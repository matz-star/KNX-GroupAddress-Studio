#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');

const out = path.resolve('dist/ETS6_cp1252.csv');
const rows = [
  ['0/0/1', 'Kök lampa åäö', '1.001'],
  ['0/0/2', 'Entré vägg ÅÄÖ', '1.001'],
];

const q = (s) => `"${String(s).replace(/"/g, '""')}"`;
const csv = rows.map(r => [q(r[0]), q(r[1]), q(r[2])].join(',')).join('\r\n');

// encode to true cp1252 bytes
const bytes = iconv.encode(csv, 'cp1252');

// write raw bytes (IMPORTANT: no "utf8" arg)
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, bytes);

// verify by decoding same bytes as cp1252
const readBack = fs.readFileSync(out);
const decoded = iconv.decode(readBack, 'cp1252');

console.log('Wrote:', out);
console.log('Decoded preview:', decoded.split('\r\n')[0]);
console.log('Contains åäö:', decoded.includes('åäö'));
console.log('Byte markers present:', {
  E5_for_å: readBack.includes(0xE5),
  E4_for_ä: readBack.includes(0xE4),
  F6_for_ö: readBack.includes(0xF6),
});