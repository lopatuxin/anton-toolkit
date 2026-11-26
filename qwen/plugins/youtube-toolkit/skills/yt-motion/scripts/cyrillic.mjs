// Tells whether font files really draw Russian letters, read from the font's character map.
//   node cyrillic.mjs <font.ttf|otf> …   → one line per file: "ok" or the letters it lacks
import fs from 'node:fs';

const LETTERS = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя';

function covers(file) {
  const b = fs.readFileSync(file);
  const u16 = (o) => b.readUInt16BE(o), u32 = (o) => b.readUInt32BE(o);
  let cmap = -1;
  for (let i = 0; i < u16(4); i++) {
    const rec = 12 + i * 16;
    if (b.toString('ascii', rec, rec + 4) === 'cmap') cmap = u32(rec + 8);
  }
  if (cmap < 0) throw new Error('no cmap table (a .woff2 must be unpacked first)');
  const subtables = [];
  for (let i = 0; i < u16(cmap + 2); i++) subtables.push(cmap + u32(cmap + 4 + i * 8 + 4));
  return (cp) => subtables.some((off) => {
    const format = u16(off);
    if (format === 4) {
      const segs = u16(off + 6) / 2, ends = off + 14, starts = ends + segs * 2 + 2, deltas = starts + segs * 2, ranges = deltas + segs * 2;
      for (let s = 0; s < segs; s++) {
        const start = u16(starts + s * 2);
        if (cp < start || cp > u16(ends + s * 2)) continue;
        const ro = u16(ranges + s * 2);
        const glyph = ro ? u16(ranges + s * 2 + ro + (cp - start) * 2) : cp;
        return glyph !== 0 && ((glyph + u16(deltas + s * 2)) & 0xffff) !== 0;
      }
    }
    if (format === 12) {
      for (let g = 0; g < u32(off + 12); g++) {
        const rec = off + 16 + g * 12;
        if (cp >= u32(rec) && cp <= u32(rec + 4)) return true;
      }
    }
    return false;
  });
}

const files = process.argv.slice(2);
if (!files.length) { console.error('usage: node cyrillic.mjs <font.ttf|otf> …'); process.exit(1); }
let bad = 0;
for (const file of files) {
  try {
    const has = covers(file);
    const missing = [...LETTERS].filter((ch) => !has(ch.codePointAt(0)));
    if (missing.length) bad++;
    console.log(`${file}: ${missing.length ? `lacks ${missing.join('')}` : 'ok'}`);
  } catch (e) { bad++; console.log(`${file}: ${e.message}`); }
}
process.exit(bad ? 1 : 0);
