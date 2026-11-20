# OMO System

Lead-management web app for the OMO team. Bilingual UI and docs:
**English (`en`)** and **Traditional Chinese (`zh-Hant`, Taiwan usage)**.
Default language: `zh-Hant`.

網頁版名單管理系統，介面與說明文件皆提供英文與繁體中文（台灣用語），預設語言為繁體中文。

## Stack

Next.js 16 (App Router) · React 19 · Tailwind 4 · next-intl · TypeScript.
Target host: Cloudflare (adapter to be chosen in a later step).

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
npm run check      # i18n check + typecheck + lint (also run in CI)
npm run build
```

## How bilingual support works

- **UI text**: `messages/en.json` and `messages/zh-Hant.json`, same keys in both. Typed keys: a typo fails `npm run typecheck`.
- **Locale choice** (no language in the URL): saved preference (later) → `NEXT_LOCALE` cookie → browser `Accept-Language` → `zh-Hant`. See `src/i18n/`.
- **Switcher**: `src/components/LanguageSwitcher.tsx` → server action `setLocale` (validates against an allow-list, sets an httpOnly cookie). `<html lang>` follows the locale.
- **Missing translation**: falls back to English, never shows a raw key.
- **Data stores codes, not labels**: e.g. lead status `consulting`; the label comes from `messages/*.json` (`src/domain/lead-status.ts`).
- **Docs**: `docs/en/*.md` and `docs/zh-Hant/*.md`, identical filenames. Bundled into JSON at build (`scripts/build-docs.mjs`) because Cloudflare Workers have no runtime filesystem. Terms are fixed in `docs/glossary.md`.

## Adding a language string or guide

1. Add the key to **both** `messages/*.json` (or the same filename under both `docs/` folders).
2. Use the term from `docs/glossary.md`.
3. Run `npm run check`. It fails on missing keys, mismatched `{placeholders}`, missing guide translations, and Simplified characters in `zh-Hant` files.

## Security notes

- Secrets live in server-only env vars (never `NEXT_PUBLIC_*`). Copy `.env.example` to `.env.local`; never commit real values.
- Locale values and doc slugs are checked against allow-lists before use.
- Markdown is rendered without raw HTML; no `dangerouslySetInnerHTML`.
