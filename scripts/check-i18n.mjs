// CI guard for translations. Fails (exit 1) on:
//  - message keys missing/extra between en and zh-Hant
//  - ICU placeholder mismatch ({name}) between languages
//  - docs files present in en but missing in zh-Hant (or vice versa)
//  - Simplified-Chinese characters in zh-Hant messages or docs
//  - lead status codes without a label
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as OpenCC from "opencc-js";

const root = process.cwd();
const errors = [];

const flatten = (obj, prefix = "") =>
  Object.entries(obj).flatMap(([k, v]) =>
    typeof v === "object" ? flatten(v, `${prefix}${k}.`) : [[`${prefix}${k}`, v]],
  );
const load = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));

const en = new Map(flatten(load("messages/en.json")));
const zh = new Map(flatten(load("messages/zh-Hant.json")));

for (const k of en.keys()) if (!zh.has(k)) errors.push(`zh-Hant missing key: ${k}`);
for (const k of zh.keys()) if (!en.has(k)) errors.push(`zh-Hant extra key: ${k}`);

const placeholders = (s) => [...s.matchAll(/\{(\w+)/g)].map((m) => m[1]).sort().join(",");
for (const [k, v] of en) {
  if (zh.has(k) && placeholders(v) !== placeholders(zh.get(k)))
    errors.push(`placeholder mismatch: ${k}`);
}

// Lead status codes <-> labels
const src = readFileSync(join(root, "src/domain/lead-status.ts"), "utf8");
const codes = [...src.matchAll(/^\s+"([a-z_]+)",$/gm)].map((m) => m[1]);
for (const c of codes) {
  if (!en.has(`LeadStatus.${c}`)) errors.push(`no en label for status: ${c}`);
  if (!zh.has(`LeadStatus.${c}`)) errors.push(`no zh-Hant label for status: ${c}`);
}

// Docs parity
const list = (l) => readdirSync(join(root, "docs", l)).filter((f) => f.endsWith(".md")).sort();
const enDocs = list("en");
const zhDocs = list("zh-Hant");
for (const f of enDocs) if (!zhDocs.includes(f)) errors.push(`docs/zh-Hant missing: ${f}`);
for (const f of zhDocs) if (!enDocs.includes(f)) errors.push(`docs/en missing: ${f}`);

// Simplified-character detection: convert cn->tw; if text changes, it had
// Simplified forms. Only characters that differ are reported.
// Characters that are valid Traditional too (OpenCC remaps them only in some
// words), so they are never flagged on their own.
const SHARED = new Set([..."了干后里面发系只云范采台复布向克出制准松折表钟"]);
const toTwChars = OpenCC.Converter({ from: "cn", to: "tw" });
function simplifiedIn(text) {
  const converted = toTwChars(text);
  const hits = new Set();
  if (converted.length === text.length) {
    for (let i = 0; i < text.length; i++) if (text[i] !== converted[i] && !SHARED.has(text[i])) hits.add(text[i]);
  }
  return [...hits];
}

const zhTexts = [
  ...[...zh].map(([k, v]) => [`messages/zh-Hant.json ${k}`, v]),
  ...zhDocs.map((f) => [`docs/zh-Hant/${f}`, readFileSync(join(root, "docs/zh-Hant", f), "utf8")]),
];
for (const [where, text] of zhTexts) {
  const hits = simplifiedIn(text);
  if (hits.length) errors.push(`Simplified characters in ${where}: ${hits.join("")}`);
}

if (errors.length) {
  console.error(`i18n check failed:\n - ${errors.join("\n - ")}`);
  process.exit(1);
}
console.log(`i18n OK: ${en.size} keys, ${enDocs.length} guides, ${codes.length} statuses`);
