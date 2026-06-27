import { NextResponse, type NextRequest } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getBook, formatEuro } from "@/lib/book";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const NIGHT = rgb(0.082, 0.051, 0.122); // #150D1F
const INK = rgb(0.957, 0.925, 0.886); // #F4ECE2
const GLOW = rgb(0.965, 0.694, 0.478); // #F6B17A

// Members-only, server-rendered PDF of the memory book.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Membership gate: RLS makes getBook return null for non-members.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const book = await getBook(id);
  if (!book) {
    return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  }

  const pdf = await PDFDocument.create();
  const serif = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);

  const W = 595; // A4 portrait points
  const H = 842;

  // Cover.
  const cover = pdf.addPage([W, H]);
  cover.drawRectangle({ x: 0, y: 0, width: W, height: H, color: NIGHT });
  cover.drawText("ERINNERUNGS-BUCH", {
    x: 60,
    y: H - 120,
    size: 11,
    font: sans,
    color: GLOW,
  });
  cover.drawText(pdfSafe(book.capsule.name), {
    x: 60,
    y: H - 180,
    size: 34,
    font: serif,
    color: INK,
  });
  const range = [book.dateRange.start, book.dateRange.end]
    .filter(Boolean)
    .map((iso) => new Date(iso as string).toLocaleDateString("de-DE"))
    .join(" – ");
  if (range) {
    cover.drawText(range, { x: 60, y: H - 210, size: 12, font: sans, color: INK });
  }

  // Highlight pages.
  for (const page of book.pages) {
    const p = pdf.addPage([W, H]);
    p.drawRectangle({ x: 0, y: 0, width: W, height: H, color: NIGHT });

    const url = page.thumbUrl ?? page.imageUrl;
    if (url) {
      try {
        const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
        const img = await pdf.embedJpg(bytes);
        const maxW = W - 120;
        const maxH = H - 260;
        const scale = Math.min(maxW / img.width, maxH / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        p.drawImage(img, { x: (W - w) / 2, y: H - 80 - h, width: w, height: h });
      } catch {
        // Skip image on any decode/fetch failure; caption still prints.
      }
    }

    p.drawText(wrap(pdfSafe(page.caption), 60), {
      x: 60,
      y: 120,
      size: 16,
      font: serif,
      color: INK,
      lineHeight: 22,
      maxWidth: W - 120,
    });
  }

  // Closing economics note.
  const last = pdf.addPage([W, H]);
  last.drawRectangle({ x: 0, y: 0, width: W, height: H, color: NIGHT });
  last.drawText("Gemeinsam erlebt, gemeinsam getragen.", {
    x: 60,
    y: H / 2,
    size: 18,
    font: serif,
    color: INK,
  });
  last.drawText(
    `${book.economics.memberCount} Freund:innen · Anteil ${formatEuro(
      book.economics.shareCents
    )}`,
    { x: 60, y: H / 2 - 30, size: 11, font: sans, color: GLOW }
  );

  const pdfBytes = await pdf.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="nachklang-${id}.pdf"`,
    },
  });
}

// Strip characters the PDF standard fonts (WinAnsi) can't encode — notably
// emoji and variation selectors — while keeping German quotes and dashes.
function pdfSafe(text: string): string {
  return text
    .replace(/[️‍]/g, "")
    .split("")
    .filter((ch) => ch.codePointAt(0)! < 0x2190)
    .join("")
    .trim();
}

// Naive word-wrap for the caption block.
function wrap(text: string, maxChars: number): string {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > maxChars) {
      lines.push(line.trim());
      line = word;
    } else {
      line = `${line} ${word}`;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines.join("\n");
}
