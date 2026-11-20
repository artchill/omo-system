// Bundles docs/<locale>/*.md into src/generated/docs.json at build time.
// Cloudflare Workers have no runtime filesystem, so docs must be bundled.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";

const root = process.cwd();
const docsDir = join(root, "docs");
const LOCALES = ["en", "zh-Hant"];
const SLUG_RE = /^[a-z0-9-]+$/;

const bundle = {};
for (const locale of LOCALES) {
  bundle[locale] = {};
  const dir = join(docsDir, locale);
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".md"))) {
    const slug = file.slice(0, -3);
    if (!SLUG_RE.test(slug)) throw new Error(`Bad doc filename: ${locale}/${file}`);
    const { data, content } = matter(readFileSync(join(dir, file), "utf8"));
    if (!data.title) throw new Error(`Missing title: ${locale}/${file}`);
    bundle[locale][slug] = {
      slug,
      title: String(data.title),
      order: Number(data.order ?? 999),
      body: content.trim(),
    };
  }
}

const outDir = join(root, "src", "generated");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "docs.json"), JSON.stringify(bundle, null, 2));
console.log(
  `docs bundled: ${LOCALES.map((l) => `${l}=${Object.keys(bundle[l]).length}`).join(", ")}`,
);
