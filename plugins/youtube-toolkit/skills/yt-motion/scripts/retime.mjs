// Times every motion scene by the words it covers and writes the result into the scene.
//
//   node retime.mjs <scenesDir>                      estimate from the script text, 130 words a minute
//   node retime.mjs <scenesDir> --voice <file.json>  real timing from a whisper.cpp -ojf transcript
//   node retime.mjs <scenesDir> --wpm 140            another speaking rate for the estimate
//
// <scenesDir> holds one folder per scene, processed in name order (01-…, 02-…). Each has scene.json:
//   { "phrase": "…игру начинают с {gold}прототипа…", "lead": 0.3, "tail": 0.6 }
// {name} in front of a word marks a cue on that word. A silent scene has "phrase": "" and "duration": 4.
// The script stores the result under "timing" in scene.json and rewrites index.html: the block between
// /* CUES:BEGIN */ and /* CUES:END */ becomes `const CUES = {…}; const DURATION = …;`, and every
// data-duration equal to the root's old duration becomes the new one.
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const scenesDir = argv[0];
const opt = (name) => { const i = argv.indexOf(name); return i > 0 ? argv[i + 1] : undefined; };
const voiceFile = opt('--voice');
const wpm = Number(opt('--wpm') || 130);
const SEC_PER_WORD = 60 / wpm;
const badFlag = (argv.includes('--voice') && !(voiceFile && fs.existsSync(voiceFile))) || !(wpm > 0);
if (!scenesDir || !fs.existsSync(scenesDir) || badFlag) {
  console.error('usage: node retime.mjs <scenesDir> [--voice transcript.json] [--wpm 130]');
  process.exit(1);
}

const norm = (w) => w.toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]/g, '');
const r3 = (x) => Math.round(x * 1000) / 1000;

// Phrase → [{w, cues: [names]}]. Cue names are Latin identifiers, so the worker can write CUES.<name>.
function parsePhrase(text) {
  const out = [];
  let pending = []; // a cue glued to punctuation ("{x}—") belongs to the next word
  const seen = new Set();
  for (const raw of text.split(/\s+/).filter(Boolean)) {
    const cues = [];
    const word = raw.replace(/\{([^}]*)\}/g, (_, name) => {
      if (!/^[A-Za-z_]\w*$/.test(name)) throw new Error(`cue name {${name}} must be Latin letters, digits, _`);
      if (['speechStart', 'speechEnd', '__proto__'].includes(name) || seen.has(name)) throw new Error(`cue name {${name}} is reserved or used twice`);
      seen.add(name);
      cues.push(name);
      return '';
    });
    if (/[{}]/.test(word)) throw new Error(`unclosed cue mark in «${raw}»`);
    if (!norm(word)) { pending = pending.concat(cues); continue; }
    out.push({ w: norm(word), cues: pending.concat(cues) });
    pending = [];
  }
  if (pending.length && out.length) out[out.length - 1].cues.push(...pending); // a cue after the last word
  return out;
}

// whisper.cpp -ojf → [{w, s, e}] with the same word grouping the episode scripts use.
function transcriptWords(file) {
  const j = JSON.parse(fs.readFileSync(file, 'utf8'));
  const out = [];
  for (const seg of j.transcription) {
    for (const t of seg.tokens) {
      if (t.text.startsWith('[_')) continue;
      const s = t.t_dtw >= 0 ? t.t_dtw / 100 : t.offsets.from / 1000;
      const e = t.offsets.to / 1000;
      if (t.text.startsWith(' ') || !out.length) out.push({ raw: t.text.trim(), s, e });
      else { const last = out[out.length - 1]; last.raw += t.text; last.e = e; }
    }
  }
  return out.map((x) => ({ ...x, w: norm(x.raw) })).filter((x) => x.w);
}

// Longest common subsequence of P against T[from, to), returning the matched pairs [pi, ti].
function lcs(P, T, from, to) {
  const n = P.length, m = to - from;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = P[i].w === T[from + j].w ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const pairs = [];
  for (let i = 0, j = 0; i < n && j < m;) {
    if (P[i].w === T[from + j].w) { pairs.push([i, from + j]); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++;
  }
  return pairs;
}

// Keeps the largest run of matches that follow each other closely and drops the rest — misheard words
// paired with the same words a sentence later would otherwise stretch the scene into the next phrase.
function trimStrays(pairs) {
  const runs = [[]];
  pairs.forEach((p, k) => {
    const prev = pairs[k - 1];
    if (prev && (p[1] - prev[1]) - (p[0] - prev[0]) > 3) runs.push([]);
    runs[runs.length - 1].push(p);
  });
  return runs.reduce((a, b) => (b.length > a.length ? b : a));
}

// Placement of the phrase in the transcript at or after `cursor`: the most matched words, and on a tie
// the tightest spread, so a short word like «в» is not paired with an earlier one outside the phrase.
// A window counts only if its matches are dense (scattered «и», «в», «что» are not a phrase). The search
// stops one window past the first strong match, so a later repeat of the phrase is not taken.
function locate(P, T, cursor) {
  const span = Math.ceil(P.length * 1.5) + 3;
  const strong = Math.ceil(P.length * 0.8);
  const need = Math.max(Math.ceil(P.length / 2), Math.min(P.length, 2));
  const spread = (pairs) => pairs[pairs.length - 1][1] - pairs[0][1];
  let best = null, bestDropped = 0, strongAt = -1;
  for (let j = cursor; j < T.length; j++) {
    if (strongAt >= 0 && j > strongAt + span) break;
    const raw = lcs(P, T, j, Math.min(T.length, j + span));
    const pairs = trimStrays(raw);
    if (!pairs.length || pairs.length < (spread(pairs) + 1) / 2) continue;
    if (!best || pairs.length > best.length || (pairs.length === best.length && spread(pairs) < spread(best))) {
      best = pairs;
      bestDropped = raw.length - pairs.length;
    }
    if (strongAt < 0 && best.length >= strong) strongAt = j;
  }
  if (!best || best.length < need) return null;
  return { pairs: best, strong: best.length >= strong, dropped: bestDropped };
}

function estimate(P, scene) {
  const lead = scene.lead ?? 0.3, tail = scene.tail ?? 0.5;
  const cues = {};
  P.forEach((p, i) => p.cues.forEach((c) => { cues[c] = r3(lead + i * SEC_PER_WORD); }));
  const speech = P.length * SEC_PER_WORD;
  return { source: 'estimate', duration: r3(lead + speech + tail), speechStart: r3(lead), speechEnd: r3(lead + speech), cues, missing: [] };
}

function fromVoice(P, T, pairs, scene) {
  const lead = scene.lead ?? 0.3, tail = scene.tail ?? 0.5;
  const at = new Map(pairs); // phrase index → transcript index
  // Start time of phrase word i: the matched word, or interpolated between matched neighbours.
  const timeOf = (i) => {
    if (at.has(i)) return T[at.get(i)].s;
    let a = -1, b = -1;
    for (const [pi] of pairs) { if (pi < i) a = pi; else if (b < 0) b = pi; }
    if (a >= 0 && b >= 0) return T[at.get(a)].s + ((i - a) / (b - a)) * (T[at.get(b)].s - T[at.get(a)].s);
    if (a >= 0) return T[at.get(a)].e + (i - a - 1) * SEC_PER_WORD;
    return T[at.get(b)].s - (b - i) * SEC_PER_WORD;
  };
  const firstP = pairs[0][0], lastP = pairs[pairs.length - 1][0];
  const start = T[pairs[0][1]].s - firstP * SEC_PER_WORD;
  const end = T[pairs[pairs.length - 1][1]].e + (P.length - 1 - lastP) * SEC_PER_WORD;
  const cues = {}, missing = [];
  P.forEach((p, i) => p.cues.forEach((c) => {
    if (!at.has(i)) missing.push(`cue ${c} on «${p.w}» not heard, interpolated`);
    cues[c] = r3(lead + timeOf(i) - start);
  }));
  return {
    source: 'voice', duration: r3(lead + (end - start) + tail), speechStart: r3(lead), speechEnd: r3(lead + end - start),
    voiceStart: r3(start - lead), cues, missing,
  };
}

function writeHtml(file, timing) {
  let html = fs.readFileSync(file, 'utf8');
  const block = /\/\* CUES:BEGIN \*\/[\s\S]*?\/\* CUES:END \*\//;
  if (!block.test(html)) throw new Error('no /* CUES:BEGIN */ … /* CUES:END */ block');
  const rootTag = html.match(/<[a-z]+\b[^>]*(?<![\w-])id="root"[^>]*>/i);
  const old = rootTag && rootTag[0].match(/data-duration="([^"]+)"/);
  if (!old) throw new Error('root element has no data-duration');
  const cues = { ...timing.cues, speechStart: timing.speechStart, speechEnd: timing.speechEnd };
  html = html.replace(block, `/* CUES:BEGIN */ const CUES = ${JSON.stringify(cues)}; const DURATION = ${timing.duration}; /* CUES:END */`);
  html = html.split(`data-duration="${old[1]}"`).join(`data-duration="${timing.duration}"`);
  fs.writeFileSync(file, html);
}

const T = voiceFile ? transcriptWords(voiceFile) : null;
let cursor = 0;
let failed = 0;
for (const id of fs.readdirSync(scenesDir).sort()) {
  const dir = path.join(scenesDir, id);
  const sceneFile = path.join(dir, 'scene.json');
  if (!fs.existsSync(sceneFile)) continue;
  const scene = JSON.parse(fs.readFileSync(sceneFile, 'utf8'));
  let P;
  try { P = parsePhrase(scene.phrase || ''); }
  catch (e) { console.log(`${id}: ${e.message} — timing left as it was`); failed++; continue; }
  let timing;
  if (!P.length) {
    timing = { source: 'fixed', duration: scene.duration ?? 3, speechStart: 0, speechEnd: 0, cues: {}, missing: [] };
  } else if (!T) {
    timing = estimate(P, scene);
  } else {
    const found = locate(P, T, cursor);
    if (!found) { console.log(`${id}: phrase not found in the recording — timing left as it was`); failed++; continue; }
    timing = fromVoice(P, T, found.pairs, scene);
    // Only a confident match moves the search on: a doubtful one must not push later scenes past their phrases.
    if (found.strong) cursor = found.pairs[found.pairs.length - 1][1] + 1;
    else timing.missing.push(`only ${found.pairs.length} of ${P.length} words matched — check where this scene starts`);
    if (found.dropped) timing.missing.push(`${found.dropped} matched words dropped as strays — check the scene's start and end`);
    if (timing.voiceStart < 0) timing.missing.push('negative voiceStart — lower this scene\'s lead');
  }
  scene.timing = timing;
  fs.writeFileSync(sceneFile, JSON.stringify(scene, null, 2) + '\n');
  const html = path.join(dir, 'index.html');
  try { if (fs.existsSync(html)) writeHtml(html, timing); }
  catch (e) { console.log(`${id}: index.html not updated — ${e.message}`); failed++; }
  const at = timing.voiceStart !== undefined ? ` from ${timing.voiceStart}s of the recording` : '';
  const miss = timing.missing.length ? `; check: ${timing.missing.join(', ')}` : '';
  console.log(`${id}: ${timing.duration}s (${timing.source})${at}${miss}`);
}
process.exit(failed ? 2 : 0);
