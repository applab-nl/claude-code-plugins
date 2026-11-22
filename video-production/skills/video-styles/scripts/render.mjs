#!/usr/bin/env node
// Render an assembled player.html to MP4 in headless Chrome with the GPU, or just a few stills to look at.
//
//   node render.mjs <player.html> --out <file.mp4>            full render: every frame + offline audio at -15 LUFS
//   node render.mjs <player.html> --preview --out <dir>       stills only (storyboard beat times, or 6 even times)
//
// options:
//   --fps 30            frame rate
//   --samples N         override the style's sample count (lower = faster test render)
//   --at 0.5,2,4.8      times for stills (preview) / contact sheet (full)
//   --check-purity      render frames in different orders and fail if they differ (update(t) must be pure)
//   --channel chrome    browser: chrome (installed Google Chrome, default) or chromium (Playwright's)
//   --allow-software    do not fail when WebGL falls back to a software renderer
//   --lufs -15          loudness target
// Writes <out-base>-frames/still-NN.png and contact.png next to the output for an eyes-on check.
import { chromium } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { resolve, dirname, basename, extname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { once } from 'node:events';

const argv = process.argv.slice(2);
const flag = (k) => argv.includes(`--${k}`);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const VALUED = ['--out', '--fps', '--samples', '--at', '--channel', '--lufs'];
const page0 = argv.find((a, i) => !a.startsWith('--') && !VALUED.includes(argv[i - 1]));
if (!page0 || !opt('out')) { console.error('usage: render.mjs <player.html> --out <file.mp4|dir> [--preview] [--samples N] [--at t,t] [--check-purity]'); process.exit(2); }
if (spawnSync('ffmpeg', ['-version']).status !== 0) { console.error('ffmpeg is not on PATH'); process.exit(1); }

const FPS = +opt('fps', 30), PREVIEW = flag('preview'), LUFS = +opt('lufs', -15);
const OUT = resolve(opt('out'));
const framesDir = PREVIEW ? OUT : join(dirname(OUT), basename(OUT, extname(OUT)) + '-frames');
mkdirSync(framesDir, { recursive: true });
const log = (...a) => console.log('[render]', ...a);

const channel = opt('channel', 'chrome');
const launchArgs = ['--ignore-gpu-blocklist', '--enable-gpu', '--enable-webgl', '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
  process.platform === 'darwin' ? '--use-angle=metal' : '--use-angle=default', '--autoplay-policy=no-user-gesture-required'];
const launch = async () => {
  try { return await chromium.launch({ channel: channel === 'chromium' ? 'chromium' : 'chrome', headless: true, args: launchArgs }); }
  catch (e) { log(`could not launch ${channel} (${e.message.split('\n')[0]}); trying Playwright's chromium`); return chromium.launch({ channel: 'chromium', headless: true, args: launchArgs }); }
};
const probe = (p) => p.evaluate(() => {
  const gl = document.createElement('canvas').getContext('webgl2');
  if (!gl) return 'none';
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  return gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER);
});
// check the GPU on a blank page before loading anything heavy; a fresh browser sometimes comes up without it
const soft = (g) => /swiftshader|llvmpipe|software|none/i.test(g);
let browser, page, gpu;
for (let attempt = 1; attempt <= 3; attempt++) {
  browser = await launch();
  page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  gpu = await probe(page);
  if (!soft(gpu) || attempt === 3) break;
  log(`WebGL came up as "${gpu}", relaunching (${attempt}/3)`);
  await browser.close();
}
log('WebGL renderer:', gpu);
if (soft(gpu) && !flag('allow-software')) {
  console.error('WebGL is running in software. Rendering will be very slow and may differ. Fix the GPU flags or pass --allow-software.');
  await browser.close(); process.exit(1);
}
const problems = [];
page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
page.on('pageerror', (e) => problems.push(e.stack || e.message));
page.on('crash', () => problems.push('page crashed (out of GPU memory?)'));
await page.exposeFunction('__ctxLost', () => problems.push('WebGL context lost'));
await page.addInitScript(() => document.addEventListener('webglcontextlost', () => window.__ctxLost(), true));
await page.goto(pathToFileURL(resolve(page0)).href + '?render');
// the frame size comes from the page (assemble --aspect); fit the viewport to it so the canvas is never clipped
const size = await page.evaluate(() => { const c = document.getElementById('c'); return { width: c.width, height: c.height }; });
await page.setViewportSize(size);

await page.waitForFunction(() => window.STAGE_READY || window.STAGE_ERROR, null, { timeout: 180000 });
// a lost context or a shader that failed to compile renders blank frames that would pass every later check: stop here
const fatal = () => problems.filter((p) => /context lost|crashed|Shader Error|VALIDATE_STATUS|could not compile/i.test(p));
await grabCheck();
async function grabCheck() {
  await page.evaluate(() => window.seekN && window.seekN(0, 1));
  if (fatal().length) { console.error('WebGL failed while building the scene:\n  ' + [...new Set(fatal())].slice(0, 6).join('\n  ')); await browser.close(); process.exit(1); }
}
const err = await page.evaluate(() => window.STAGE_ERROR);
if (err) { console.error('page error:\n' + err); await browser.close(); process.exit(1); }
const info = await page.evaluate(() => ({ D: window.DURATION, samples: window.S.samples, beats: (window.STYLE.storyboard && window.STYLE.storyboard.beats || []).map((b) => b.at), hasSound: !!window.STYLE.sound }));
const SAMPLES = +opt('samples', info.samples);
log(`duration ${info.D}s, ${SAMPLES} samples/frame, ${FPS} fps`);

const grab = (t, n) => page.evaluate(([t, n]) => { window.seekN(t, n); return document.getElementById('c').toDataURL('image/png').split(',')[1]; }, [t, n]);
const hash = (b64) => createHash('sha1').update(b64).digest('hex').slice(0, 12);

// ---- purity: the same t must give the same picture whatever was rendered before it
if (flag('check-purity')) {
  const D = info.D, ts = [D * 0.27, D * 0.55, D * 0.86].map((t) => Math.round(t * FPS) / FPS);
  let bad = 0;
  for (const t of ts) {
    await grab(0, 1); const a = hash(await grab(t, 1));
    await grab(D, 1); const b = hash(await grab(t, 1));
    const c = hash(await grab(t, 1));
    const ok = a === b && b === c;
    if (!ok) bad++;
    log(`purity t=${t.toFixed(2)}: after 0 ${a}, after end ${b}, repeat ${c} ${ok ? 'ok' : 'DIFFERENT'}`);
  }
  if (bad) { console.error(`purity check failed at ${bad} time(s): update(t) leaves state behind or reads something other than t`); await browser.close(); process.exit(1); }
}

// ---- stills + contact sheet
const atList = opt('at') ? opt('at').split(',').map(Number) : info.beats.length && PREVIEW ? info.beats : Array.from({ length: 6 }, (_, i) => +(info.D * (i === 5 ? 0.999 : i / 5)).toFixed(3));
async function stills(n) {
  for (let i = 0; i < atList.length; i++) {
    const png = Buffer.from(await grab(atList[i], n), 'base64');
    const f = join(framesDir, `still-${String(i + 1).padStart(2, '0')}.png`);
    writeFileSync(f, png);
    log(`still ${i + 1}: t=${atList[i]} -> ${f}`);
  }
  const cols = Math.min(3, atList.length), rows = Math.ceil(atList.length / cols);
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '1', '-i', join(framesDir, 'still-%02d.png'), '-vf', `scale=640:-1,tile=${cols}x${rows}:padding=8:margin=8:color=white`, '-frames:v', '1', join(framesDir, 'contact.png')]);
  if (r.status === 0) log('contact sheet ->', join(framesDir, 'contact.png')); else log('contact sheet failed:', String(r.stderr).trim());
}

if (PREVIEW) {
  await stills(SAMPLES);
  if (problems.length) log('console errors:\n  ' + problems.join('\n  '));
  await browser.close();
  process.exit(0);
}

// ---- video: every frame at full quality, piped to ffmpeg as PNG
const total = Math.round(info.D * FPS);
const tmpVideo = OUT.replace(/\.mp4$/i, '') + '.video.mp4';
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', tmpVideo], { stdio: ['pipe', 'inherit', 'inherit'] });
const t0 = Date.now();
for (let i = 0; i < total; i++) {
  const buf = Buffer.from(await grab(i / FPS, SAMPLES), 'base64');
  if (!ff.stdin.write(buf)) await once(ff.stdin, 'drain');
  if (i % 15 === 0 || i === total - 1) {
    const el = (Date.now() - t0) / 1000, eta = el / (i + 1) * (total - i - 1);
    process.stdout.write(`\r[render] frame ${i + 1}/${total}  ${el.toFixed(0)}s elapsed, ~${eta.toFixed(0)}s left   `);
  }
}
process.stdout.write('\n');
ff.stdin.end();
const [code] = await once(ff, 'close');
if (code !== 0) { console.error('ffmpeg (video) failed'); await browser.close(); process.exit(1); }

await stills(SAMPLES);

// ---- audio: the same score, rendered offline, loudness-normalised in two passes
let audioFile = null;
if (info.hasSound) {
  const a = await page.evaluate(async () => {
    const r = await window.SOUND.renderOffline((k) => window.STYLE.sound(k), window.DURATION, 48000, { voiceover: false });
    const u8 = new Uint8Array(r.inter.buffer); let s = '';
    for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return { b64: btoa(s), peak: r.peak };
  });
  log(`audio peak ${a.peak.toFixed(3)}`);
  if (a.peak > 1e-5) { audioFile = OUT.replace(/\.mp4$/i, '') + '.audio.f32'; writeFileSync(audioFile, Buffer.from(a.b64, 'base64')); }
}
await browser.close();

const RAW = ['-f', 'f32le', '-ar', '48000', '-ac', '2'];
if (audioFile) {
  const target = `I=${LUFS}:TP=-1.5:LRA=11`;
  const m = spawnSync('ffmpeg', ['-hide_banner', ...RAW, '-i', audioFile, '-af', `loudnorm=${target}:print_format=json`, '-f', 'null', '-'], { encoding: 'utf8' });
  const js = /\{[\s\S]*\}/.exec(m.stderr || '');
  let af = `loudnorm=${target}`;
  if (js) {
    const j = JSON.parse(js[0]);
    log(`measured ${j.input_i} LUFS, true peak ${j.input_tp} dBTP`);
    af += `:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`;
  }
  const mux = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', tmpVideo, ...RAW, '-i', audioFile, '-af', af, '-ar', '48000', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', OUT], { stdio: 'inherit' });
  if (mux.status !== 0) { console.error('ffmpeg (mux) failed'); process.exit(1); }
  rmSync(audioFile); rmSync(tmpVideo);
} else {
  spawnSync('mv', [tmpVideo, OUT]);
  log('no sound score (or silent): video only');
}
if (problems.length) log('console errors:\n  ' + problems.join('\n  '));
log(`done -> ${OUT} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
if (existsSync(join(framesDir, 'contact.png'))) log('look at', join(framesDir, 'contact.png'), 'before calling it done');
