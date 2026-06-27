@AGENTS.md

# Projekt: Nachklang (Arbeitstitel)

## Produktvision
Nachklang ist eine private App für gemeinsame Erlebnisse von Freundesgruppen.
Eine Gruppe legt eine "Erlebnis-Kapsel" an (z.B. eine Reise), alle laden ihre Fotos hinein.
Statt alle Bilder sofort zu zeigen, werden sie über einen definierten Zeitraum dosiert
freigegeben ("Drip"). Eine Push-Nachricht holt die Gruppe immer wieder zurück; Bilder werden
geliked, kommentiert und mit Kontext versehen (Ort, Stimmung, was passiert ist) — die Gruppe
erlebt den Moment gemeinsam ein zweites Mal. Am Ende entsteht aus den Highlights ein digitales
Erinnerungs-Buch, dessen Kosten die Gruppe teilt (später als Print bestellbar).

## Plattform-Entscheidung: PWA-first (verbindlich)
- Wir bauen eine installierbare PWA (mobile-first). KEIN nativer App-Store-Build im MVP.
- Begründung steht fest: Das Wachstum läuft über EINLADUNGSLINKS in Gruppenchats, nicht über
  Store-Suche. Ein Link, der mit einem Tap direkt in die laufende App führt, hat die geringste
  Reibung — genau das ist unser viraler Kanal. Die Onboarding-Strecke (was passiert, wenn jemand
  auf den Einladungslink tippt) ist deshalb ein erstklassiges Feature, kein Nebenschauplatz.
- Bekannte Einschränkung, die sauber behandelt werden muss: Auf iOS funktioniert Web-Push NUR,
  wenn die PWA zum Home-Bildschirm hinzugefügt wurde. Installation und Push sind daher als EIN
  zusammenhängender, gut getimter Moment zu gestalten (siehe Phase 6). Wo Push nicht verfügbar
  ist, sauber degradieren.

## Kernprinzipien (nicht verletzen)
1. PRIVAT. Inhalte sind nur für Mitglieder der jeweiligen Kapsel sichtbar. Kein öffentlicher Feed,
   keine Fremden, kein Entdecken. Privacy ist ein Feature.
2. EVENT-GEBUNDEN. Kein Dauer-Social-Network. Engagement kommt in Wellen pro Erlebnis. Kein
   erzwungenes Daily-Engagement, keine Stories, kein Algorithmus-Feed.
3. NIEDRIGE FRIKTION ÜBERALL. Beitritt per Link, ein Tap in die App. Login leichtgewichtig.
   Kontext erfassen ist optional und größtenteils automatisch — niemals ein Pflicht-Formular.
4. DER LOOP IST HEILIG: Kapsel → Drip → Wiedererleben → Buch → (später) Nochmal.
5. DAS BUCH IST DER HÖHEPUNKT. Der Drip steuert dramaturgisch darauf zu (beste Bilder spät).
6. DIE ERINNERUNG SCHREIBT SICH SELBST. Ort kommt aus den Fotodaten, Stimmung ist ein Tap,
   die KI verdichtet vorhandene Signale (Ort, Reaktionen, Notizen) zu kurzen Buch-Texten.

## Tech-Stack (verbindlich)
- Next.js (App Router, TypeScript, RSC wo sinnvoll). Aktuelle stabile Version. Als PWA konfiguriert.
- Tailwind CSS. Design-Tokens siehe unten — exakt einhalten.
- Supabase: Postgres (Daten), Auth (Magic Link/OTP), Storage (Fotos), Row Level Security (RLS).
- Vercel: Hosting + Vercel Cron Jobs für den Drip-Scheduler.
- Web Push: `web-push` (VAPID) + Service Worker.
- Bildverarbeitung serverseitig mit `sharp` (Thumbnails, EXIF: Aufnahmezeit + GPS, Qualitäts-Heuristik).
- Validierung mit `zod`. Getypte DB-Zugriffe (Supabase-Types).
- Tests: Vitest für Logik (besonders Drip-Auswahl und Highlight-Auswahl). Playwright optional E2E.

## Verbindliche Konventionen
- UI-Sprache: Deutsch. Code/Variablen/Kommentare: Englisch.
- Strikte TypeScript-Typisierung, kein `any` ohne Begründung.
- Server-Logik in Route Handlers / Server Actions. Secrets nie an den Client.
- Jede Tabelle hat RLS. Standard: ein User sieht nur Daten von Kapseln, in denen er Mitglied ist.
- Kleine, fokussierte Commits. Bei mehrdeutigen Designentscheidungen: Optionen kurz nennen,
  die einfachste MVP-taugliche wählen.
- PWA-Hygiene ernst nehmen: sauberes Manifest, Icons, Service Worker — damit Browser-eigene
  Installations-Hinweise greifen und die App "echt" wirkt.

## Design-System (Tokens — exakt verwenden)
Palette (Dusk / Golden Hour):
  --night:#150D1F  --dusk:#1D142C  --surface:#271B3A  --surface-2:#322648
  --glow:#F6B17A   --glow-bright:#FCDFBE  --coral:#E8896B  --lilac:#BBA0DC
  --ink:#F4ECE2    --ink-dim:rgba(244,236,226,.66)  --ink-faint:rgba(244,236,226,.42)
  --line:rgba(244,236,226,.12)
Typografie:
  Display (emotionale Headlines): "Instrument Serif" (inkl. Italic)
  Body / UI: "Hanken Grotesk"
  Daten/Labels/Eyebrows: "JetBrains Mono"
Signature: "Entwickelnde" Fotos — neu freigegebene Bilder erscheinen kurz unscharf/dunkel/
  entsättigt und entwickeln sich über ~1.5s zu scharf/warm/farbig. prefers-reduced-motion
  respektieren (dann sofort Endzustand).
Stil: warm, ruhig, hochwertig. Großzügiger Weißraum. Sparsame Animation. Große Touch-Targets.

## Datenmodell (Kern)
- profiles(id=auth.uid, display_name, avatar_url, created_at)
- capsules(id, name, cover_photo_id?, owner_id, status[draft|active|completed],
           drip_start_at, drip_end_at, drip_interval[daily|weekly], photos_per_release,
           book_total_cents?, created_at)
- capsule_members(capsule_id, user_id, role[owner|member], joined_at)  // PK (capsule_id, user_id)
- capsule_invites(capsule_id, token unique, created_by, expires_at?)
- photos(id, capsule_id, uploader_id, storage_path, thumb_path, taken_at,
         width, height, quality_score float, status[pending|released], release_at?, released_at?,
         location_name?, lat?, lng?, location_visible bool default true,   // aus EXIF, abschaltbar
         created_at)
- reactions(id, photo_id, user_id, type[like|fire|laugh|love], created_at)  // unique (photo_id,user_id,type)
- comments(id, photo_id, user_id, body, created_at)
- photo_moods(id, photo_id, user_id, mood, created_at)        // kollektive Stimmungs-Tags (Tap)
- moment_notes(id, photo_id, user_id, body, source[text|voice], created_at) // kollektive Geschichte
- push_subscriptions(id, user_id, endpoint unique, p256dh, auth, created_at)
- book_intents(id, capsule_id, user_id, share_cents, created_at) // MVP: Kaufabsicht, KEINE echte Zahlung
// Spätere Phasen (NICHT im MVP anlegen):
// revivals(...) für "Nochmal"; payments/orders(...) für echte geteilte Bezahlung + Print

## Der Drip — Herzstück (Verhalten)
- Beim Start einer Kapsel sind alle Fotos status=pending.
- Vercel Cron läuft täglich, gibt pro Intervall `photos_per_release` Bilder frei
  (status=released, released_at=now) und sendet danach EINE gebündelte Push an alle Mitglieder.
- Reihenfolge ("Smart Drip", MVP-Heuristik): grob aufsteigende Qualität Richtung Finale
  (quality_score), gleichmäßig über den Zeitraum verteilt, deterministisch & IDEMPOTENT.
- quality_score im MVP heuristisch (Auflösung/Helligkeit/Schärfe via sharp). Scoring in
  lib/quality.ts kapseln, damit später ersetzbar.
- Idempotenz ist Pflicht: mehrfacher Cron-Lauf darf nie doppelt freigeben oder doppelt pushen.

## Kontext-Schicht (Verhalten) — "die Erinnerung schreibt sich selbst"
- ORT: beim Upload aus EXIF-GPS ableiten -> location_name (Reverse-Geocoding). location_visible
  pro Foto abschaltbar (wichtig bei Kinder-/Privatfotos). Kein Tippen nötig.
- STIMMUNG: photo_moods als Tap (z.B. 😍/😂/😢/🤩). Kollektiv: jedes Mitglied kann taggen.
- GESCHICHTE: moment_notes optional, kurz, per Text ODER Sprache (Voice-to-Text). Niemals
  erzwingen, niemals beim Upload abfragen — sondern im Drip-Moment, wenn die Nostalgie hoch ist.
- KI-VERDICHTUNG: eine austauschbare Funktion lib/weave.ts nimmt vorhandene Signale (Ort, Datum,
  Top-Reaktionen, Notizen) und erzeugt einen kurzen Erinnerungssatz fürs Buch. Verdichten, nicht
  zumüllen: ein Ort, ein Gefühl, eine Zeile.

## Geteiltes Buch (Verhalten)
- Buch ist DIGITAL und wird in der Gruppe GETEILT bezahlt: book_total_cents / Mitgliederzahl = Anteil.
- KEIN Alles-oder-nichts: jeder schaltet SEIN Exemplar frei, sobald er seinen Anteil leistet —
  unabhängig von den anderen. (Im MVP wird nur die Absicht erfasst, keine echte Zahlung.)

## Was im MVP NICHT gebaut wird (Non-Goals)
- Keine echte Bezahlung/Event-Kasse, kein echter Print-Versand. Buch = digitale Vorschau,
  Buch-Kauf = Absichts-Erfassung im Split-Framing (book_intents).
- Kein nativer App-Build, kein öffentlicher Feed, keine Freundessuche, kein Algorithmus.
- Keine Videos, keine Mehrsprachigkeit (nur Deutsch).
