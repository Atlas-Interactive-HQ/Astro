#!/usr/bin/env node
/*
  Brand guardrail — the executable form of the Warm Geo v2 rules for Astro.

  1. Colour: only the nine brand hues may appear. No #000000, no #FFFFFF,
     no other hex, no rgb()/hsl()/color-mix(), no named CSS colours, no
     `transparent` (the bundler emits #0000).
  2. Finish: no gradients, no shadows, no glass. Flat fields only.
  3. Type: only Playfair Display and Inter, with plain generic fallbacks.
  4. Contrast: every declared text/background pairing meets WCAG AA.

  Scans src/ and public/. Exits non-zero on any failure so CI blocks it.
*/
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SCAN_DIRS = ['src', 'public'];
if (process.argv.includes('--dist')) {
  if (!existsSync(join(ROOT, 'dist'))) {
    console.error('brand-check: --dist given but dist/ is missing — run npm run build first');
    process.exit(1);
  }
  SCAN_DIRS.push('dist');
}
const EXTS = new Set(['.astro', '.css', '.ts', '.mjs', '.js', '.svg', '.html']);

const BRAND = {
  'Warm Ochre': '#E6A24A',
  'Deep Teal': '#1F4E4A',
  'Burnt Orange': '#C65A2E',
  'Terracotta': '#A63D2F',
  'Soft Sand': '#F2D6A2',
  'Muted Sage': '#7FA39A',
  'Dusty Coral': '#D97A5B',
  'Dark Petrol': '#153937',
  'Clay Brown': '#8C4A2F',
};
const ALLOWED_HEX = new Set(Object.values(BRAND).map((h) => h.toUpperCase()));

const ALLOWED_FONT_TOKENS = new Set([
  'playfair display',
  'inter',
  'georgia',
  'times new roman',
  'serif',
  'system-ui',
  '-apple-system',
  'segoe ui',
  'sans-serif',
  'inherit',
]);

// CSS Color Module named keywords. Delimited so `--deep-teal` and `white-space` do not match.
const NAMED_COLOURS =
  'aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|grey|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|rebeccapurple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen|black';

// Rules that apply to CSS text (stylesheets, <style> blocks, style="" attributes).
const CSS_RULES = [
  { re: /(linear|radial|conic)-gradient\s*\(/i, why: 'gradient — flat fields only' },
  { re: /\b(?:box|text)-shadow\s*:\s*(?!none\b)/i, why: 'shadow — Warm Geo is flat, no depth effects' },
  { re: /drop-shadow\s*\(/i, why: 'drop-shadow filter — no depth effects' },
  { re: /backdrop-filter\s*:/i, why: 'backdrop-filter — no glass effects' },
  { re: /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color-mix)\s*\(/i, why: 'derived or alpha colour — use the nine hues flat' },
  { re: new RegExp(`(?:^|[\\s:,(])(?:${NAMED_COLOURS})\\s*(?=[;)\\s,}!]|$)`, 'im'), why: 'named CSS colour — use the nine hues' },
  { re: /(?:^|[\s:,(])transparent\s*(?=[;)\s,}!]|$)/im, why: 'transparent keyword — the bundler emits #0000; use a brand surface token' },
];

// Text/background pairs as the stylesheet uses them. Threshold: 4.5 for body
// text, 3.0 for large text (≥ 24px, or ≥ 18.66px bold) and UI boundaries.
const CONTRAST_PAIRS = [
  ['Dark Petrol', 'Warm Ochre', 4.5, 'body and UI text on the field'],
  ['Deep Teal', 'Warm Ochre', 3.0, 'headlines on the field (large type)'],
  ['Dark Petrol', 'Soft Sand', 4.5, 'body text on sheets and inputs'],
  ['Deep Teal', 'Soft Sand', 4.5, 'labels and headings on sheets'],
  ['Soft Sand', 'Deep Teal', 4.5, 'footer text and primary button label'],
  ['Soft Sand', 'Dark Petrol', 4.5, 'button label on hover'],
  ['Terracotta', 'Soft Sand', 3.0, 'numerals on sheets (large type)'],
  ['Deep Teal', 'Soft Sand', 3.0, 'input border on sheets (UI boundary)'],
  ['Dark Petrol', 'Warm Ochre', 3.0, 'focus ring on the field'],
  ['Dark Petrol', 'Soft Sand', 3.0, 'focus ring on sheets'],
  ['Soft Sand', 'Deep Teal', 3.0, 'focus ring on the footer'],
];

const failures = [];
const notes = [];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (EXTS.has(extname(entry))) out.push(full);
  }
  return out;
}

// Comments are prose, not colour: drop them before any rule looks at the text.
function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');
}

function cssContexts(file, text) {
  const ext = extname(file);
  if (ext === '.css') return [text];
  const blocks = [];
  for (const m of text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) blocks.push(m[1]);
  for (const m of text.matchAll(/\sstyle\s*=\s*"([^"]*)"/gi)) blocks.push(m[1]);
  for (const m of text.matchAll(/\sstyle\s*=\s*'([^']*)'/gi)) blocks.push(m[1]);
  return blocks;
}

function stripNonColourHashes(text) {
  return text
    .replace(/%23/g, '#') // hexes inside encoded data URIs
    .replace(/url\(\s*['"]?#[^)'"]*['"]?\s*\)/gi, 'url()') // url(#id) references
    .replace(/\b(?:href|aria-controls|aria-describedby|aria-labelledby|for|id)\s*=\s*"[^"]*"/gi, '');
}

function checkHexes(file, text) {
  const cleaned = stripNonColourHashes(text);
  for (const m of cleaned.matchAll(/#([0-9a-f]{3,8})\b/gi)) {
    const digits = m[1];
    if (![3, 4, 6, 8].includes(digits.length)) continue;
    const hex = `#${digits.toUpperCase()}`;
    if (!ALLOWED_HEX.has(hex)) {
      failures.push(`${file}: colour ${hex} is not one of the nine brand hues`);
    }
  }
}

function checkCss(file, css) {
  for (const { re, why } of CSS_RULES) {
    if (re.test(css)) failures.push(`${file}: ${why} (matched ${re})`);
  }
  for (const m of css.matchAll(/font-family\s*:\s*([^;}]+)/gi)) {
    for (const raw of m[1].split(',')) {
      const token = raw.trim().replace(/^['"]|['"]$/g, '').toLowerCase();
      if (!token || token.startsWith('var(')) continue;
      if (!ALLOWED_FONT_TOKENS.has(token)) failures.push(`${file}: typeface "${token}" is outside Playfair Display / Inter`);
    }
  }
  for (const m of css.matchAll(/(?:^|[\s;{])font\s*:\s*([^;}]+)/gi)) {
    if (m[1].trim() !== 'inherit') failures.push(`${file}: use font-family, not the font shorthand (found "font: ${m[1].trim()}")`);
  }
}

function luminance(hex) {
  const channel = (i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// --- run ---
const files = SCAN_DIRS.flatMap((d) => {
  try {
    return walk(join(ROOT, d));
  } catch {
    return [];
  }
});

for (const full of files) {
  const file = relative(ROOT, full);
  const text = stripComments(readFileSync(full, 'utf8'));
  checkHexes(file, text);
  for (const css of cssContexts(file, text)) checkCss(file, css);
}

for (const [fg, bg, min, use] of CONTRAST_PAIRS) {
  const ratio = contrast(BRAND[fg], BRAND[bg]);
  const line = `${ratio.toFixed(2)}:1  ${fg} on ${bg}  (min ${min.toFixed(1)}) — ${use}`;
  if (ratio < min) failures.push(`contrast: ${line}`);
  else notes.push(`ok   ${line}`);
}

console.log(`brand-check: scanned ${files.length} files in ${SCAN_DIRS.join(', ')}`);
for (const n of notes) console.log(`  ${n}`);
if (failures.length) {
  console.error(`\nbrand-check: ${failures.length} failure(s)`);
  for (const f of failures) console.error(`  FAIL ${f}`);
  process.exit(1);
}
console.log('\nbrand-check: all rules hold');
