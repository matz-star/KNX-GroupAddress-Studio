#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');

const outPath = path.resolve(process.argv[2] || 'dist/ETS6_cp1252_test.csv');

const rows = [
  ['0/0/1', 'Test åäö ÅÄÖ éèü', '1.001'],
  ['0/0/2', 'Kök lampa', '1.001'],
];

const q = (s) => `"${String(s).replace(/"/g, '""')}"`;
const csv = rows.map(r => [q(r[0]), q(r[1]), q(r[2])].join(',')).join('\r\n');

// TRUE CP1252 bytes
const buf = iconv.encode(csv, 'windows-1252');

// ensure folder
fs.mkdirSync(path.dirname(outPath), { recursive: true });

// write raw bytes (no utf8 conversion!)
fs.writeFileSync(outPath, buf);

console.log('Written:', outPath);
console.log('Byte check åäö:', {
  'å expected E5': buf.includes(0xE5),
  'ä expected E4': buf.includes(0xE4),
  'ö expected F6': buf.includes(0xF6),
});

// Print a hex slice around Swedish chars for debugging
console.log('First 120 bytes hex:');
console.log(buf.subarray(0, 120).toString('hex'));