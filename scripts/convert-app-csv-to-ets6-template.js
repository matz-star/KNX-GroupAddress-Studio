#!/usr/bin/env node
/**
 * Convert App CSV -> ETS6 template-style CSV (9 columns)
 * preserving ETS-friendly structure:
 *
 * "labb","","","0/-/-","","","","","Auto"
 * "","100 Lampa, TF","","0/0/-","","","","","Auto"
 *
 * Usage:
 *   node scripts/convert-app-csv-to-ets6-template.js \
 *     --in ./input/app.csv \
 *     --out ./dist/ETS6_import_ready.csv \
 *     --project "labb"
 *
 * App CSV expected headers:
 *   Address,Name,Description,DataPointType,Comment
 */

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

function getArg(name, def = '') {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : def;
}

const inPath = getArg('in');
const outPath = getArg('out', './dist/ETS6_import_ready.csv');
const projectName = getArg('project', 'labb');

if (!inPath) {
  console.error('Missing --in <app.csv>');
  process.exit(1);
}

if (!fs.existsSync(inPath)) {
  console.error(`Input file not found: ${inPath}`);
  process.exit(1);
}

const REQUIRED_HEADERS = ['Address', 'Name', 'Description', 'DataPointType', 'Comment'];
const GROUP_ADDRESS_PATTERN = /^\d+\/\d+\/\d+$/;

const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

function toMainMiddleDash(address) {
  const [main = '', middle = ''] = String(address).split('/');
  return `${main}/${middle}/-`;
}

// Read source bytes as latin1 to avoid accidental UTF-8 transformations by editors/tools.
// Papa parses string content; for ASCII headers/GA it is fine.
const sourceText = fs.readFileSync(inPath, 'latin1');

// Parse App CSV
const parsed = Papa.parse(sourceText, {
  header: true,
  skipEmptyLines: true,
});

if (parsed.errors?.length) {
  console.error('CSV parse error:', parsed.errors[0].message);
  process.exit(1);
}

const headers = parsed.meta?.fields || [];
const hasRequired = REQUIRED_HEADERS.every((h) => headers.includes(h));
if (!hasRequired) {
  console.error(
    `Invalid headers. Expected: ${REQUIRED_HEADERS.join(', ')}\nFound: ${headers.join(', ')}`
  );
  process.exit(1);
}

const rows = parsed.data || [];
const seen = new Set();
const valid = [];

for (let i = 0; i < rows.length; i++) {
  const r = rows[i] || {};
  const address = String(r.Address ?? '').trim();
  const name = String(r.Name ?? '').trim();

  if (!address || !GROUP_ADDRESS_PATTERN.test(address)) continue;
  if (!name) continue;
  if (seen.has(address)) continue;

  seen.add(address);
  valid.push({ address, name });
}

if (!valid.length) {
  console.error('No valid rows to export.');
  process.exit(1);
}

// Build ETS template-style 9-column CSV
const outLines = [];

// root row
outLines.push(
  [
    q(projectName),
    q(''),
    q(''),
    q('0/-/-'),
    q(''),
    q(''),
    q(''),
    q(''),
    q('Auto'),
  ].join(',')
);

// child rows
for (const item of valid) {
  outLines.push(
    [
      q(''),
      q(item.name),
      q(''),
      q(toMainMiddleDash(item.address)),
      q(''),
      q(''),
      q(''),
      q(''),
      q('Auto'),
    ].join(',')
  );
}

// Keep Windows line endings like ETS exports
const output = outLines.join('\r\n');

// Write as latin1 single-byte stream (prevents UTF-8 BOM/markers)
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, Buffer.from(output, 'latin1'));

console.log(`Wrote: ${outPath}`);
console.log(`Rows exported: ${valid.length}`);
console.log('Import this file directly in ETS6.');