#!/usr/bin/env node
// Render an explainer HTML file to MP4: headless Chrome draws every frame through window.seek(t),
// ffmpeg encodes them, SOUND.renderOffline(window.scoreSound, ...) gives the effects track, and an
// optional voiceover is mixed in with the loudness/sidechain chain from the build rules.
//
//   node render.mjs explainer.html [--out explainer.mp4] [--fps 30] [--voiceover voice.wav]
//                                  [--canvas "canvas"] [--no-sound] [--keep]
//
// Needs Node 18+, ffmpeg on PATH and puppeteer (resolved from the current project, or install it
// with `npm i -D puppeteer`).
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, basename } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args.splice(i, 2)[1] : dflt; };
const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? (args.splice(i, 1), true) : false; };
const fps = Number(opt('--fps', 30));
const voice = opt('--voiceover', null);
const canvasSel = opt('--canvas', 'canvas');
const noSound = flag('--no-sound');
const keep = flag('--keep');
let out = opt('--out', null);
const input = args[0];
if (!input || !existsSync(input)) die('usage: node render.mjs <explainer.html> [--out x.mp4] [--fps 30] [--voiceover voice.wav] [--canvas sel] [--no-sound] [--keep]');
if (voice && !existsSync(voice)) die(`voiceover file not found: ${voice}`);
out = resolve(out || basename(input).replace(/\.html?$/i, '') + '.mp4');

// ---- dependency check before any work ----
if (spawnSync('ffmpeg', ['-version']).status !== 0) die('ffmpeg not found. Install it (macOS: brew install ffmpeg) and retry.');
let puppeteer;
try {
  const req = createRequire(join(process.cwd(), 'noop.js'));
  puppeteer = (await import(pathToFileURL(req.resolve('puppeteer')).href)).default;
} catch {
  try { puppeteer = (await import('puppeteer')).default; } catch {
    die('puppeteer not found. In this folder run: npm i -D puppeteer   (then rerun this command)');
  }
}

const work = mkdtempSync(join(tmpdir(), 'explainer-'));
const video = join(work, 'video.mp4'), fx = join(work, 'effects.wav');
const browser = await launch();
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  page.on('pageerror', (e) => console.error('[page error]', e.message));
  await page.goto(pathToFileURL(resolve(input)).href, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => typeof window.seek === 'function' && window.DURATION > 0, { timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  const duration = await page.evaluate(() => window.DURATION);
  const frames = Math.ceil(duration * fps);
  const size = await page.evaluate((sel) => { const c = document.querySelector(sel); return c && [c.width, c.height]; }, canvasSel);
  if (!size) die(`no canvas matches "${canvasSel}" (use --canvas)`);
  console.log(`rendering ${frames} frames (${duration}s @ ${fps}fps, ${size[0]}x${size[1]})`);

  // ---- picture: seek + capture in one synchronous evaluate, so a running player loop can't interleave ----
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart', video],
  { stdio: ['pipe', 'inherit', 'inherit'] });
  const ffDone = new Promise((ok, bad) => ff.on('close', (c) => (c === 0 ? ok() : bad(new Error(`ffmpeg exited ${c}`)))));
  for (let i = 0; i < frames; i++) {
    const b64 = await page.evaluate((t, sel) => {
      window.seek(t);
      return document.querySelector(sel).toDataURL('image/png').split(',')[1];
    }, i / fps, canvasSel);
    if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % fps === 0) process.stdout.write(`\r  frame ${i}/${frames}`);
  }
  ff.stdin.end();
  await ffDone;
  process.stdout.write(`\r  frame ${frames}/${frames}\n`);

  // ---- sound: offline render of the score ----
  const hasScore = !noSound && await page.evaluate(() => typeof window.scoreSound === 'function' && !!window.SOUND?.renderOffline);
  if (hasScore) {
    const meta = await page.evaluate(async (vo) => {
      const r = await SOUND.renderOffline(window.scoreSound, window.DURATION, 48000, { voiceover: vo });
      window.__fx = new Uint8Array(r.inter.buffer);
      return { bytes: window.__fx.length, peak: r.peak, sr: r.sr };
    }, !!voice);
    const parts = [];
    const CHUNK = 4 * 1024 * 1024;
    for (let o = 0; o < meta.bytes; o += CHUNK) {
      parts.push(Buffer.from(await page.evaluate((o, n) => {
        const a = window.__fx.subarray(o, o + n); let s = '';
        for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000));
        return btoa(s);
      }, o, CHUNK), 'base64'));
    }
    writeFileSync(fx, wavFloat32(Buffer.concat(parts), meta.sr, 2));
    if (meta.peak > 1) console.warn(`warning: effects peak ${meta.peak.toFixed(2)} > 1.0 (will clip); lower some gains`);
  }

  // ---- mux ----
  const mux = voice && hasScore
    ? ['-i', video, '-i', resolve(voice), '-i', fx, '-filter_complex',
      '[1:a]apad,loudnorm=I=-17:TP=-2,asplit=2[v1][v2];[2:a]loudnorm=I=-26:TP=-4:LRA=20[fx0];[fx0][v1]sidechaincompress=threshold=0.05:ratio=3:attack=10:release=250[fx];[v2][fx]amix=inputs=2:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11[a]',
      '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k']
    : voice
      ? ['-i', video, '-i', resolve(voice), '-map', '0:v', '-map', '1:a', '-af', 'apad,loudnorm=I=-16:TP=-1.5:LRA=11', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k']
      : hasScore
        ? ['-i', video, '-i', fx, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k']
        : ['-i', video, '-c', 'copy'];
  // -t: the picture sets the length; a shorter voice track is padded with silence, a longer one is cut
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', ...mux, '-t', String(duration), '-movflags', '+faststart', out], { stdio: 'inherit' });
  if (r.status !== 0) die('ffmpeg mux failed');
  console.log(`wrote ${out}${keep ? `  (intermediates in ${work})` : ''}`);
} finally {
  await browser.close();
  if (!keep) rmSync(work, { recursive: true, force: true });
}

// Puppeteer's own headless shell first, then an installed Chrome. npm may skip puppeteer's
// post-install browser download, so the bundled one is not always there.
async function launch() {
  const base = { args: ['--autoplay-policy=no-user-gesture-required'] };
  const tries = [
    process.env.PUPPETEER_EXECUTABLE_PATH && { ...base, headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH },
    { ...base, headless: 'shell' },
    { ...base, headless: true },
    { ...base, headless: true, channel: 'chrome' },
  ].filter(Boolean);
  for (const o of tries) {
    try { return await puppeteer.launch(o); } catch { /* next */ }
  }
  die('no browser for puppeteer. Run: npx puppeteer browsers install chrome-headless-shell   (or set PUPPETEER_EXECUTABLE_PATH)');
}

function wavFloat32(data, sr, ch) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(3, 20); h.writeUInt16LE(ch, 22);
  h.writeUInt32LE(sr, 24); h.writeUInt32LE(sr * ch * 4, 28); h.writeUInt16LE(ch * 4, 32); h.writeUInt16LE(32, 34);
  h.write('data', 36); h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

function die(msg) { console.error(msg); process.exit(1); }
