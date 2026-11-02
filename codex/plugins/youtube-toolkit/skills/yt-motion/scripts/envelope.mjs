// Prints a coarse loudness / brightness envelope of an audio file: one char per window.
// Usage: node envelope.mjs <file> [windowMs=100] [fromSec] [toSec]
// L row: loudness, ' ' below -57 dBFS up to '@' near 0 dBFS, 6 dB per step.
// Z row: zero crossings per ms (0–9) — a rough brightness: a quill or paper scratch reads 5–9,
// a thump, hum or handling noise 0–2.
import { execFileSync } from 'node:child_process';
const [file, winMsArg, fromArg, toArg] = process.argv.slice(2);
const winMs = Number(winMsArg || 100), sr = 22050;
const args = ['-v', 'error'];
if (fromArg) args.push('-ss', fromArg);
if (toArg) args.push('-to', toArg);
args.push('-i', file, '-ac', '1', '-ar', String(sr), '-f', 'f32le', '-');
const buf = execFileSync('ffmpeg', args, { maxBuffer: 1 << 30 });
const s = new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
const n = Math.floor(sr * winMs / 1000);
let line = '', zl = '', peak = 0;
const rmsArr = [], zcrArr = [];
for (let i = 0; i + n <= s.length; i += n) {
  let e = 0, z = 0;
  for (let j = i; j < i + n; j++) { e += s[j] * s[j]; if (j > i && (s[j] >= 0) !== (s[j - 1] >= 0)) z++; }
  const rms = Math.sqrt(e / n); rmsArr.push(rms); zcrArr.push(z / n); peak = Math.max(peak, rms);
}
const chars = ' .:-=+*#%@';
for (let k = 0; k < rmsArr.length; k++) {
  const db = 20 * Math.log10(rmsArr[k] + 1e-9);
  line += chars[Math.max(0, Math.min(9, Math.round((db + 60) / 6)))];
  zl += Math.min(9, Math.floor(zcrArr[k] * sr / 1000)); // zero crossings per ms ~ brightness, 0-9 kHz-ish
}
console.log(`${file.split(/[\/]/).pop()}  ${(s.length / sr).toFixed(2)}s  win ${winMs}ms  peakRMS ${(20*Math.log10(peak)).toFixed(1)} dB`);
for (let k = 0; k < line.length; k += 100) console.log(`${(k * winMs / 1000).toFixed(1).padStart(6)}s L ${line.slice(k, k + 100)}\n        Z ${zl.slice(k, k + 100)}`);
