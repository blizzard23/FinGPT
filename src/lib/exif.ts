import exifr from "exifr";

export type ExifData = {
  takenAt: string | null;
  lat: number | null;
  lng: number | null;
};

// Extracts capture time and GPS from a photo. Always resolves — missing or
// unreadable EXIF simply yields nulls (no tipping, no failures).
export async function parseExif(buffer: Buffer): Promise<ExifData> {
  try {
    const data = await exifr.parse(buffer, {
      gps: true,
      pick: ["DateTimeOriginal", "CreateDate", "latitude", "longitude"],
    });

    if (!data) return { takenAt: null, lat: null, lng: null };

    const taken: Date | undefined = data.DateTimeOriginal ?? data.CreateDate;

    return {
      takenAt: taken instanceof Date ? taken.toISOString() : null,
      lat: typeof data.latitude === "number" ? data.latitude : null,
      lng: typeof data.longitude === "number" ? data.longitude : null,
    };
  } catch {
    return { takenAt: null, lat: null, lng: null };
  }
}
