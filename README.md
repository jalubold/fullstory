# FULLSTORY — photobook creation platform

**Your photos. Your story. Your book.**

FULLSTORY is a self-service platform for discovering professionally designed photo-album templates, previewing them page by page, customising them in a browser editor, and ordering the result as a printed book, a digital PDF or a private shareable album.

```
DISCOVER → SELECT → PREVIEW → CUSTOMIZE → REVIEW → PAY → EXPORT / SHARE / PRINT
```

## What’s included

| Area | Pages |
| --- | --- |
| Public site | Home, Explore Templates (search + filters), Template Categories, Category pages, Template Detail, interactive Demo Preview, How It Works, Pricing, Explore (inspiration gallery), About, FAQ |
| Creation | Create New Album, Template Selection, album setup (size/name), Photo Upload, Album Editor, Full Preview, Export & Purchase |
| Workspace | Dashboard, My Projects, Saved Drafts, Completed Albums, My Downloads, Shared Albums, Print Orders, Settings, Billing, order detail/tracking |
| Operations | `/admin/orders`: fulfilment status, tracking, print-ready files, refunds (password: `ADMIN_PASSWORD`) |

**No accounts.** Visitors never sign up or log in. The first time someone starts an album, the server issues an anonymous, signed guest id in an http-only cookie; albums, photos and orders belong to that id. A private recovery link (Settings / Dashboard) reopens the albums on another device. Checkout only asks for an email for receipts and order updates.

- **18 data-driven templates** across 11 categories and 8 styles, each a complete 20-page album with cover and back cover, demoed with real photography.
- **Editor**: pages / photos / layouts / text / backgrounds / elements panels; drag & drop photos into frames; move, resize, rotate with snapping; crop & zoom inside frames; inline text editing; 30 layouts that keep your photos and text when switched; add / duplicate / delete / reorder pages; undo/redo; autosave with conflict detection and an on-device backup for recovery.
- **One rendering model** (`src/lib/album`) drives the editor, previews, thumbnails and the PDF renderer — same geometry, same crop maths, same font files and line-breaking rules.
- **PDF export** (`src/lib/server/pdf/render.ts`) draws vector text, ornaments and patterns and crops photos from the **original uploads** at the target DPI. Separate outputs for the digital PDF, the print-ready interior (with bleed, trim/bleed boxes, page-count padding) and the print cover spread (back + spine + front, with board wrap for hardcovers).
- **Commerce**: server-side pricing from a configurable catalog, order snapshots, Stripe Checkout (webhook + server-side verification), payment states `pending → paid / failed / refunded / cancelled`, and access gates — downloads, share links and print files are only available for **paid** orders.

## Tech stack

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Postgres, Storage) · pdf-lib + fontkit · sharp · Stripe · zustand + immer · dnd-kit.

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no environment variables the app runs fully on your machine:

- **Database**: embedded Postgres (PGlite) in `./.data/pglite`, migrated automatically
- **Storage**: uploaded photos and exported PDFs in `./.data/storage`
- **Visitors**: anonymous guest ids (signed cookie) — no accounts
- **Payments**: a clearly-labelled **test provider** — you choose “successful” or “failed” payment; no money moves. It is disabled in production unless `ALLOW_TEST_PAYMENTS=true`.

Copy `.env.example` to `.env.local` to configure integrations.

## Production setup (Vercel + Supabase + Stripe)

1. **Import the repository** into Vercel (framework: Next.js).
2. **Supabase** (database + photo storage): in the Vercel project → *Storage* → connect a Supabase database. This injects `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `POSTGRES_URL`. On first request the app creates its tables (`supabase/migrations/0001_fullstory.sql` is the same schema, for reference) and a private storage bucket. Row Level Security is enabled with no public policies, so the Supabase Data API exposes nothing — all access goes through the server. Supabase Auth is not used.

   *Alternative used on fullstory.pro:* any Postgres via `DATABASE_URL` (here a Supabase project reached through the Supavisor transaction pooler, using a dedicated `fullstory_app` role whose `search_path` is a private `fullstory` schema) plus a **private Vercel Blob** store for photos and PDFs (`BLOB_READ_WRITE_TOKEN`, added automatically when the store is connected to the project). Browsers upload straight to Blob with per-file client tokens and read through short-lived presigned URLs, so large originals and print PDFs never pass through a function response. `GET /api/health` reports database reachability and the storage mode; `?deep=1` also round-trips a tiny file through storage.
3. **Stripe**: set `STRIPE_SECRET_KEY` and `PAYMENT_PROVIDER=stripe`. Add a webhook endpoint `https://<your-domain>/api/payments/webhook/stripe` for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired` and `charge.refunded`, then set `STRIPE_WEBHOOK_SECRET`.
4. Set `APP_URL=https://<your-domain>`, optionally `SESSION_SECRET` (otherwise derived from the database secret), and `ADMIN_PASSWORD` for `/admin`.
5. **Domain**: Vercel project → *Settings → Domains* → add your domain (e.g. `fullstory.pro`).

Without a database on Vercel, the public site and template previews work, and album creation shows a clear “not available yet” notice instead of failing silently.

## Configuring products and prices

All product specifications and prices live in **`src/config/catalog.json`** — sizes (mm), cover types, page limits, digital products, print base prices and per-page prices per currency (USD / GBP / EUR), shipping options and countries, bleed, safe margin, spine thickness and DPI targets. The shipped values are **samples** (`"isSample": true` shows a notice on the pricing and checkout pages) — replace them with your real prices and your print partner’s specifications, then set `isSample` to `false`. You can also override the whole catalog at runtime with `FULLSTORY_CATALOG_JSON`.

## Project structure

```
src/
  app/                    routes (marketing, auth, workspace, projects, share, admin, api)
  components/
    album/                PageView renderer, book mockups, AlbumViewer
    editor/               editor store, canvas, interaction layer, panels, autosave
    templates/ marketing/ create/ commerce/ dashboard/
  config/catalog.json     products & prices (configurable)
  lib/
    album/                document model, layouts, geometry, fonts, ornaments, ops, validation
    templates/            template definitions, themes, sample photos, materialiser
    commerce/             catalog loader, server-authoritative pricing
    server/               db (Postgres/PGlite), auth, storage, payments, orders, exports, pdf
  assets/fonts/           TTF files used by the PDF renderer (WOFF2 copies in public/fonts)
supabase/migrations/      SQL schema (reference)
scripts/fetch-fonts.mjs   downloads the OFL fonts and builds WOFF2 copies
```

Templates are reusable definitions (`src/lib/templates/designs`). Creating a project *materialises* a template into an independent album document — the template itself is never modified. Projects store the template id, photo references, page order, layouts, text, backgrounds, crop/position and trim size.

## Sample photography

Template demos use photographs published on Unsplash (Unsplash License), hot-linked from `images.unsplash.com`, with photographer credits listed on each template page and in `src/lib/templates/sample-photos.json`. Before launch, consider replacing them with your own commissioned sample photography for full brand control.

## Scripts

| Command | |
| --- | --- |
| `npm run dev` | development server |
| `npm run build` / `npm start` | production build / server |
| `npm run lint` | ESLint |
| `node scripts/fetch-fonts.mjs` | re-download fonts (Google Fonts, OFL) |
