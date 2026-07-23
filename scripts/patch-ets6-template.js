#!/usr/bin/env node
/**
 * Usage:
 *   node scripts/patch-ets6-template.js \
 *     --template ./ETS6_csv.csv \
 *     --input ./data/group-addresses.json \
 *     --out ./dist/ETS6_import_ready.csv \
 *     --project "labb"
 *
 * Input JSON format:
 * [
 *   { "address": "0/0/1", "name": "100 Lampa, TF" },
 *   { "address": "0/1/1", "name": "100 Lampa, Dim" }
 * ]
 */

const fs = require('fs');

function arg(name, def = '') {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : def;
}

const templatePath = arg('template');
const inputPath = arg('input');
const outPath = arg('out', './dist/ETS6_import_ready.csv');
const projectName = arg('project', 'labb');

if (!templatePath || !inputPath) {
  console.error('Missing --template or --input');
  process.exit(1);
}

// Read template as raw bytes and keep exact encoding bytes
const templateBuf = fs.readFileSync(templatePath);
const templateText = templateBuf.toString('latin1'); // byte-preserving 1:1 mapping
const lines = templateText.split(/\r\n|\n|\r/);

// Parse data
const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
if (!Array.isArray(data) || data.length === 0) {
  console.error('Input JSON must be a non-empty array');
  process.exit(1);
}

const q = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;

// Build rows in exact ETS template shape (9 columns)
const outRows = [];
outRows.push(
  [q(projectName), q(''), q(''), q('0/-/-'), q(''), q(''), q(''), q(''), q('Auto')].join(',')
);

for (const item of data) {
  const addr = String(item.address || '').trim();
  const name = String(item.name || '').trim();
  const m = addr.match(/^(\d+)\/(\d+)\/(\d+)$/);
  if (!m) continue;

  const mainMiddleDash = `${m[1]}/${m[2]}/-`;

  outRows.push(
    [q(''), q(name), q(''), q(mainMiddleDash), q(''), q(''), q(''), q(''), q('Auto')].join(',')
  );
}

// Preserve template line ending style
const hasCRLF = templateText.includes('\r\n');
const eol = hasCRLF ? '\r\n' : '\n';
const outText = outRows.join(eol);

// Write bytes in same single-byte style to avoid UTF-8 conversions
fs.mkdirSync(require('path').dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, Buffer.from(outText, 'latin1'));

console.log(`Wrote ${outPath}`);
console.log('Import this file directly in ETS6.');