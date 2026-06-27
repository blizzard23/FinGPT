# Nachklang (Arbeitstitel)

Eine private PWA für gemeinsame Erlebnisse von Freundesgruppen: Erlebnis-Kapsel
anlegen, Fotos dosiert freigeben ("Drip"), gemeinsam wiedererleben, am Ende ein
geteilt bezahltes Highlight-Buch.

Siehe [`CLAUDE.md`](./CLAUDE.md) für Produktvision, Architektur und Konventionen.

## Entwicklung

```bash
npm install
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000).

## Stack

Next.js (App Router, TypeScript) · Tailwind CSS · Supabase (Postgres, Auth,
Storage, RLS) · Vercel (Hosting, Cron) · Web Push (VAPID) · PWA.
