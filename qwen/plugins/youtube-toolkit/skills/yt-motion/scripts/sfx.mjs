// TEMPLATE — copy into a scene folder as sfx.mjs. Keep the loader, `place` and the writer;
// rewrite the source list, SRC and the events section for the scene. The events below are
// the worked example of ep02 01-chronicler (a chronicler unrolls a scroll and writes on it).
//
// Builds this scene's sound track, assets/sfx/track.wav, from the cue times in scene.json.
// Every event sits on the same step as the picture in index.html (FPS = the picture's
// stepping: 12 for a stepped style, the composition's 30 for smooth motion), so after
// retime.mjs moves the cues to the recorded voice, running `node sfx.mjs` here again
// moves the sounds with them. Then the clip is re-rendered.
//
// Sources (assets/sfx/src, all Freesound, CC0):
//   quill.wav  — 856167 "Ink Quill Writing on Parchment ASMR" (brktkrgll)
//   scroll.wav — 202107 "Unrolling Scroll" (spookymodem)
//   knock.wav  — 634127 "Hit Wooden Cutting Board" (Erbsland-Music), one hit at 0.82 s, both channels summed
//   candle.wav — 662891 "Candle wick crackle" (InMotionAudio), 10–30 s

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SR = 48000;
const FPS = 12;

const { timing } = JSON.parse(readFileSync(join(HERE, 'scene.json'), 'utf8'));
const CUES = timing.cues;
const DURATION = timing.duration;

// The picture's step grid (index.html: stepOf).
const stepOf = (t) => Math.floor(t * FPS + 1e-6);
const atStep = (n) => n / FPS;

function load(name) {
  const buf = execFileSync('ffmpeg', ['-v', 'error', '-i', join(HERE, 'assets/sfx/src', name),
    '-ac', '2', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
  const all = new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
  const L = new Float32Array(all.length / 2), R = new Float32Array(all.length / 2);
  for (let i = 0; i < L.length; i++) { L[i] = all[2 * i]; R[i] = all[2 * i + 1]; }
  // Normalise to a common reference: the loudest 50 ms windows sit at -20 dBFS RMS.
  const win = SR / 20, levels = [];
  for (let i = 0; i + win <= L.length; i += win) {
    let e = 0;
    for (let j = i; j < i + win; j++) e += (L[j] * L[j] + R[j] * R[j]) / 2;
    levels.push(Math.sqrt(e / win));
  }
  levels.sort((a, b) => a - b);
  const ref = levels[Math.floor(levels.length * 0.95)] || 1e-6;
  const g = 0.1 / ref;
  for (let i = 0; i < L.length; i++) { L[i] *= g; R[i] *= g; }
  return { L, R, seconds: L.length / SR };
}

const SRC = {
  quill: load('quill.wav'),
  scroll: load('scroll.wav'),
  knock: load('knock.wav'),
  candle: load('candle.wav'),
};

const outLen = Math.round(DURATION * SR);
const OL = new Float32Array(outLen), OR = new Float32Array(outLen);

// Places `len` seconds of a source from `from` at time `at`, `db` relative to the reference,
// with linear fades; `rate` > 1 plays faster and higher, < 1 slower and lower.
function place(src, { at, from = 0, len, db = 0, fadeIn = 0.01, fadeOut = 0.03, rate = 1 }) {
  const s = SRC[src];
  const maxLen = (s.seconds - from) / rate;
  const n = Math.round(Math.min(len ?? maxLen, maxLen) * SR);
  const g = Math.pow(10, db / 20);
  const o0 = Math.round(at * SR);
  for (let k = 0; k < n; k++) {
    const o = o0 + k;
    if (o < 0 || o >= outLen) continue;
    const p = from * SR + k * rate, i = Math.floor(p), f = p - i;
    if (i + 1 >= s.L.length) break;
    const t = k / SR, rest = (n - k) / SR;
    const env = Math.min(1, fadeIn > 0 ? t / fadeIn : 1, fadeOut > 0 ? rest / fadeOut : 1);
    OL[o] += g * env * (s.L[i] * (1 - f) + s.L[i + 1] * f);
    OR[o] += g * env * (s.R[i] * (1 - f) + s.R[i + 1] * f);
  }
}

// --- the candle under the whole scene
place('candle', { at: 0, from: 0, len: DURATION, db: -22, fadeIn: 0.3, fadeOut: 0.3 });

// --- dip: the nib taps the inkpot on the step the pose "dipped" appears (DIP_SEQ index 3)
place('knock', { at: atStep(stepOf(CUES.dip) + 3), db: -16, rate: 1.9, fadeOut: 0.05 });
place('quill', { at: atStep(stepOf(CUES.dip) + 3) + 0.02, from: 2.0, len: 0.12, db: -12 });

// --- unroll: paper rustles while the bottom roll travels (steps 0..7), the roll lands on step 7
place('scroll', { at: atStep(stepOf(CUES.unroll)), from: 0.55, len: 7 / FPS + 0.1, db: -5, fadeOut: 0.12 });
place('knock', { at: atStep(stepOf(CUES.unroll) + 7), db: -12, rate: 0.85 });

// --- writing: the quill scratches while letters come, quiet on the spaces and the line break
const TEXT = ['Игру начинают', 'с ', 'прототипа'].join('');
const span = CUES.gold - CUES.write - 3 / FPS;
const letterAt = (i) => atStep(stepOf(CUES.write + (span * i) / TEXT.length));
const groups = [];
let cur = null;
[...TEXT].forEach((ch, i) => {
  const lineBreak = i === 13; // «с» starts the second line
  if (ch === ' ' || lineBreak) { if (cur) groups.push(cur); cur = null; }
  if (ch !== ' ') { if (!cur) cur = { from: i, to: i }; else cur.to = i; }
});
if (cur) groups.push(cur);
let quillAt = 0.45;
for (const g of groups) {
  const start = letterAt(g.from);
  const len = letterAt(g.to) - start + 1 / FPS;
  if (quillAt + len > 5.6) quillAt = 0.45;
  place('quill', { at: start, from: quillAt, len, db: -2, fadeIn: 0.012, fadeOut: 0.04 });
  quillAt += len + 0.2;
}

// --- gold: the word is pressed like a stamp
place('knock', { at: atStep(stepOf(CUES.gold)), db: -9, rate: 0.7 });

// --- underline: one long quill stroke while the red line is drawn (about five steps)
place('quill', { at: atStep(stepOf(CUES.underline)), from: 3.4, len: 5 / FPS + 0.05, db: 0, fadeOut: 0.08 });

// --- roll: paper rustles back, the two rolls knock on step 7
place('scroll', { at: atStep(stepOf(CUES.roll)), from: 1.6, len: 7 / FPS, db: -5, fadeOut: 0.06 });
place('knock', { at: atStep(stepOf(CUES.roll) + 7), db: -6 });

// --- keep the peak at -3 dBFS at most, write 16-bit stereo WAV
let peak = 0;
for (let i = 0; i < outLen; i++) peak = Math.max(peak, Math.abs(OL[i]), Math.abs(OR[i]));
const scale = peak > 0.708 ? 0.708 / peak : 1;
const data = Buffer.alloc(outLen * 4);
for (let i = 0; i < outLen; i++) {
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, OL[i] * scale)) * 32767), 4 * i);
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, OR[i] * scale)) * 32767), 4 * i + 2);
}
const head = Buffer.alloc(44);
head.write('RIFF', 0); head.writeUInt32LE(36 + data.length, 4); head.write('WAVE', 8);
head.write('fmt ', 12); head.writeUInt32LE(16, 16); head.writeUInt16LE(1, 20); head.writeUInt16LE(2, 22);
head.writeUInt32LE(SR, 24); head.writeUInt32LE(SR * 4, 28); head.writeUInt16LE(4, 32); head.writeUInt16LE(16, 34);
head.write('data', 36); head.writeUInt32LE(data.length, 40);
writeFileSync(join(HERE, 'assets/sfx/track.wav'), Buffer.concat([head, data]));
console.log(`assets/sfx/track.wav: ${DURATION}s, peak ${(20 * Math.log10(peak * scale)).toFixed(1)} dBFS`);
