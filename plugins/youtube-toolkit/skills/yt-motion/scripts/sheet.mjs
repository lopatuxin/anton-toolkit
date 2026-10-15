// Builds the review page the owner opens in a browser, and a contact image for the director.
//
//   node sheet.mjs <cardsDir> <out.html>                      still frames: <card>/keyframe.png
//   node sheet.mjs <cardsDir> <out.html> --clips <clipsDir>   finished clips: <clipsDir>/<card>.mp4
//
// <cardsDir> holds one folder per card in name order (scenes\01-…, or styles\<slug>), each with
// scene.json: { "title": "…", "phrase": "…", "note": "…" } — cue marks {name} are stripped from the phrase.
// Still frames also produce <out>.png next to the page: every keyframe tiled three across, for one look.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const [cardsDir, outHtml, flag, clipsDir] = process.argv.slice(2);
if (!cardsDir || !outHtml || (flag && (flag !== '--clips' || !clipsDir))) {
  console.error('usage: node sheet.mjs <cardsDir> <out.html> [--clips <clipsDir>]');
  process.exit(1);
}
const clips = flag === '--clips';
const outDir = path.dirname(path.resolve(outHtml));
const rel = (p) => path.relative(outDir, p).split(path.sep).join('/');
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const cards = [];
for (const id of fs.readdirSync(cardsDir).sort()) {
  const dir = path.join(cardsDir, id);
  const metaFile = path.join(dir, 'scene.json');
  if (!fs.existsSync(metaFile)) continue;
  const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
  const media = clips ? path.join(clipsDir, `${id}.mp4`) : path.join(dir, 'keyframe.png');
  cards.push({ id, meta, media, exists: fs.existsSync(media) });
}
if (!cards.length) { console.error(`no card folders with scene.json in ${cardsDir}`); process.exit(1); }

const cell = (c, i) => {
  const media = !c.exists
    ? `<div class="missing">нет ${clips ? 'клипа' : 'кадра'}</div>`
    : clips
      ? `<video src="${rel(c.media)}" controls preload="metadata"></video>`
      : `<img src="${rel(c.media)}" alt="">`;
  const phrase = (c.meta.phrase || '').replace(/\{[\w-]+\}/g, '').trim();
  return `<figure>${media}<figcaption><b>${i + 1}. ${esc(c.meta.title || c.id)}</b>` +
    (phrase ? `<q>${esc(phrase)}</q>` : '') + (c.meta.note ? `<span>${esc(c.meta.note)}</span>` : '') +
    `</figcaption></figure>`;
};

const cols = cards.length <= 4 ? 2 : 3;
const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(path.basename(outHtml, '.html'))}</title>
<style>
body{margin:0;background:#16151a;color:#e8e4dc;font:15px/1.45 "Segoe UI",system-ui,sans-serif}
main{display:grid;grid-template-columns:repeat(${cols},1fr);gap:28px;padding:28px}
figure{margin:0}img,video,.missing{width:100%;aspect-ratio:16/9;display:block;border-radius:6px;background:#000}
.missing{display:grid;place-items:center;color:#c44}
figcaption{padding:10px 2px 0;display:grid;gap:4px}q{color:#b8b2a6}span{color:#8d877c}
@media (max-width:900px){main{grid-template-columns:1fr;padding:16px}}
</style></head><body><main>
${cards.map(cell).join('\n')}
</main></body></html>
`;
fs.writeFileSync(outHtml, html);
console.log(`${outHtml}: ${cards.length} cards${cards.some((c) => !c.exists) ? `, missing: ${cards.filter((c) => !c.exists).map((c) => c.id).join(', ')}` : ''}`);

if (!clips && cards.some((c) => c.exists)) {
  // Every card keeps its tile — a missing frame is a dark red tile — so tile N is always card N.
  const png = outHtml.replace(/\.html$/, '') + '.png';
  const inputs = cards.flatMap((c) => (c.exists ? ['-i', c.media] : ['-f', 'lavfi', '-i', 'color=c=0x400000:s=640x360:d=1']));
  if (cards.length === 1) {
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-frames:v', '1', '-vf', 'scale=960:540', png]);
  } else {
    const w = 640, h = 360, per = 3;
    const scale = cards.map((_, i) => `[${i}:v]scale=${w}:${h}[v${i}]`).join(';');
    const layout = cards.map((_, i) => `${(i % per) * w}_${Math.floor(i / per) * h}`).join('|');
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex',
      `${scale};${cards.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${cards.length}:layout=${layout}:fill=black`, '-frames:v', '1', png]);
  }
  console.log(`${png}: contact image, three across, left to right, top to bottom:`);
  cards.forEach((c, i) => console.log(`  ${i + 1}. ${c.id}${c.exists ? '' : ' (no frame — dark red tile)'}`));
}
