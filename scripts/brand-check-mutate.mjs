#!/usr/bin/env node
/*
  Mutation test for scripts/brand-check.mjs.

  Writes a probe file, expects the check to fail, then removes the probe.
  A commented hex must still pass (comments are prose). Exits non-zero if
  any injection is missed or the negative control fails.
*/
import { spawnSync } from 'node:child_process';
import { unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CHECK = join(ROOT, 'scripts', 'brand-check.mjs');

const MUST_CATCH = [
  { file: 'src/__brand_probe.css', body: 'a { color: #FFFFFF; }', why: 'hex white' },
  { file: 'src/__brand_probe.css', body: 'a { color: #000000; }', why: 'hex black' },
  { file: 'src/__brand_probe.css', body: 'a { color: #fff; }', why: 'short hex white' },
  { file: 'src/__brand_probe.css', body: 'a { color: #000; }', why: 'short hex black' },
  { file: 'src/__brand_probe.css', body: 'a { color: #123456; }', why: 'off-brand hex' },
  { file: 'src/__brand_probe.css', body: 'a { color: #0000; }', why: '4-digit transparent black' },
  { file: 'src/__brand_probe.css', body: 'a { color: rgb(0, 0, 0); }', why: 'rgb()' },
  { file: 'src/__brand_probe.css', body: 'a { color: hsl(0, 0%, 0%); }', why: 'hsl()' },
  { file: 'src/__brand_probe.css', body: 'a { color: color-mix(in srgb, #1F4E4A, #E6A24A); }', why: 'color-mix()' },
  { file: 'src/__brand_probe.css', body: 'a { background: linear-gradient(#1F4E4A, #E6A24A); }', why: 'linear-gradient' },
  { file: 'src/__brand_probe.css', body: 'a { box-shadow: 0 1px 2px #153937; }', why: 'box-shadow' },
  { file: 'src/__brand_probe.css', body: 'a { text-shadow: 0 1px 0 #153937; }', why: 'text-shadow' },
  { file: 'src/__brand_probe.css', body: 'a { filter: drop-shadow(0 1px 1px #153937); }', why: 'drop-shadow' },
  { file: 'src/__brand_probe.css', body: 'a { backdrop-filter: blur(8px); }', why: 'backdrop-filter' },
  { file: 'src/__brand_probe.css', body: 'a { color: white; }', why: 'white keyword' },
  { file: 'src/__brand_probe.css', body: 'a { color: black; }', why: 'black keyword' },
  { file: 'src/__brand_probe.css', body: 'a { color: white!important; }', why: 'white!important' },
  { file: 'src/__brand_probe.css', body: 'a { font-family: Arial, sans-serif; }', why: 'off-brand typeface' },
  { file: 'src/__brand_probe.css', body: 'a { color: navy; }', why: 'named colour navy' },
  { file: 'src/__brand_probe.css', body: 'a { background: transparent; }', why: 'transparent keyword' },
  { file: 'src/__brand_probe.astro', body: '<div style=\'color: white\'></div>', why: 'single-quoted style attribute' },
];

const MUST_PASS = [
  { file: 'src/__brand_probe.css', body: '/* #FFFFFF */ a { color: #1F4E4A; }', why: 'hex inside a CSS comment' },
];

function runCheck() {
  return spawnSync(process.execPath, [CHECK], { cwd: ROOT, encoding: 'utf8' });
}

function withProbe(file, body, fn) {
  const full = join(ROOT, file);
  writeFileSync(full, body);
  try {
    return fn();
  } finally {
    try {
      unlinkSync(full);
    } catch {
      /* probe already gone */
    }
  }
}

const failures = [];

for (const { file, body, why } of MUST_CATCH) {
  const result = withProbe(file, body, runCheck);
  if (result.status === 0) failures.push(`missed: ${why}`);
}

for (const { file, body, why } of MUST_PASS) {
  const result = withProbe(file, body, runCheck);
  if (result.status !== 0) failures.push(`false positive: ${why}`);
}

if (failures.length) {
  console.error(`brand-check-mutate: ${failures.length} failure(s)`);
  for (const f of failures) console.error(`  FAIL ${f}`);
  process.exit(1);
}

console.log(`brand-check-mutate: caught ${MUST_CATCH.length}/${MUST_CATCH.length}; ${MUST_PASS.length} negative control(s) held`);
