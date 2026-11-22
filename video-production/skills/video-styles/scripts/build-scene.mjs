#!/usr/bin/env node
// Turn one style file (2D or 3D) into a HyperFrames scene: compositions/<id>.html, its sound as
// assets/audio/<id>.wav, its fonts as local files in assets/fonts/, and the host + audio lines for index.html.
//
//   node build-scene.mjs <style.js> --id <scene-id> --project <hyperframes dir> [--size 1920x1080]
//                        [--samples N] [--voiceover] [--no-sound] [--prerender] [--allow-software]
//
//   --size        the composition's size (default 1920x1080; 1080x1920, 1080x1080, 1080x1350 ...)
//   --samples     3D only: samples per frame (default: the style's render.samples). Lower for drafts.
//   --voiceover   render the score in voiceover mode (beds and music drop out, minor sounds quieter)
//   --prerender   3D only: render the scene to assets/video/<id>.mp4 with render.mjs and place that clip instead of a
//                 live canvas (for machines whose HyperFrames Chrome has no GPU)
//
// The style file is the source. Never edit the generated composition; rebuild it.
import { chromium } from 'playwright';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { basename, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { ASSETS, LIB2D, SKILL, requireLibrary } from './paths.mjs';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const flag = (k) => argv.includes(`--${k}`);
const VALUED = ['--id', '--project', '--size', '--samples', '--medium'];
const stylePath = argv.find((a, i) => !a.startsWith('--') && !VALUED.includes(argv[i - 1]));
const ID = opt('id'), PROJECT = opt('project');
if (!stylePath || !ID || !PROJECT) { console.error('usage: build-scene.mjs <style.js> --id <scene-id> --project <dir> [--size 1920x1080] [--samples N] [--voiceover] [--no-sound] [--prerender] [--allow-software]'); process.exit(2); }
if (!/^[a-z][a-z0-9-]*$/.test(ID)) { console.error('--id: lowercase letters, digits and dashes, starting with a letter'); process.exit(2); }
const [W, H] = (opt('size', '1920x1080').split('x')).map(Number);
if (!(W > 0 && H > 0)) { console.error('--size must be <w>x<h>'); process.exit(2); }
const log = (...a) => console.log('[scene]', ...a);
const src = readFileSync(stylePath, 'utf8');
const medium = opt('medium') || (/\bbuild\s*\(\s*S\s*\)/.test(src) ? '3d' : /\bexplainer\s*\(\s*\w+\s*,/.test(src) ? '2d' : null);
if (!medium) { console.error('cannot tell the medium: a 3D style has build(S), a 2D style has explainer(ctx, W, H, t). Pass --medium 2d|3d.'); process.exit(1); }
requireLibrary(medium);
if (spawnSync('ffmpeg', ['-version']).status !== 0) { console.error('ffmpeg is not on PATH'); process.exit(1); }

// ---- 1. lint the style file (our code only; the kits are trusted)
const lint = spawnSync(process.execPath, [join(SKILL, 'scripts', 'lint-style.mjs'), stylePath, '--medium', medium], { encoding: 'utf8' });
process.stdout.write(lint.stdout.split('\n').filter(Boolean).map((l) => '[lint] ' + l).join('\n') + '\n');
if (lint.status !== 0) process.exit(1);

const P = resolve(PROJECT);
for (const d of ['compositions', 'assets/audio', 'assets/fonts']) mkdirSync(join(P, d), { recursive: true });
const tmp = join(tmpdir(), `vp-scene-${process.pid}`);
mkdirSync(tmp, { recursive: true });
const safe = (s) => s.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
const aspect = (() => { const g = (a, b) => (b ? g(b, a % b) : a); const k = g(W, H); return `${W / k}:${H / k}`; })();

// ---- 2. the code that goes into the scene: kits + style, and a standalone page to read metadata and sound from
let libs, standalone;
if (medium === '3d') {
  const player = join(tmp, 'player.html');
  const r = spawnSync(process.execPath, [join(SKILL, 'scripts', 'assemble.mjs'), stylePath, '--out', player, '--aspect', aspect, '--no-google-fonts'], { encoding: 'utf8' });
  if (r.status !== 0) { console.error(r.stderr || r.stdout); process.exit(1); }
  const lines = readFileSync(player, 'utf8').split('\n');
  const a = lines.findIndex((l) => l.startsWith('<script type="module">')), b = lines.findIndex((l) => l.includes('const params = new URLSearchParams'));
  if (a < 0 || b < 0) { console.error('unexpected player template: cannot find the kit block'); process.exit(1); }
  libs = lines.slice(a + 1, b).join('\n');
  standalone = player;
} else {
  libs = [readFileSync(join(LIB2D, 'harness.js'), 'utf8'), readFileSync(join(LIB2D, 'sound.js'), 'utf8')].map(safe).join('\n');
  standalone = join(tmp, 'page.html');
  writeFileSync(standalone, `<!doctype html><html><head><meta charset="utf-8"></head><body><canvas id="c" width="${W}" height="${H}"></canvas>
<script>${libs}</script><script>${safe(src)}</script>
<script>window.STYLE = window.STYLES[window.STYLES.length - 1]; window.DURATION = window.STYLE.explainerDuration || window.STYLE.duration; window.STAGE_READY = true;</script></body></html>`);
}

// ---- 3. fonts: every '<weight> <size>px "Family"' spec -> local woff2 files (render contract: fonts are local files)
async function vendorFonts() {
  const fams = new Map();
  for (const m of src.matchAll(/(?:(\d{3})\s+)?\d+(?:\.\d+)?px\s+\\?["']([^"'\\]+)\\?["']/g)) {
    const fam = m[2].trim();
    if (/^(serif|sans-serif|monospace|system-ui|cursive|fantasy)$/i.test(fam)) continue;
    if (!fams.has(fam)) fams.set(fam, new Set());
    fams.get(fam).add(m[1] || '400');
  }
  if (!fams.size) return '';
  const q = [...fams].map(([f, ws]) => `family=${f.replace(/ /g, '+')}:wght@${[...ws].sort().join(';')}`).join('&');
  const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';
  let css;
  try {
    const res = await fetch(`https://fonts.googleapis.com/css2?${q}&display=block`, { headers: { 'user-agent': UA } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    css = await res.text();
  } catch (e) {
    log(`could not download fonts (${e.message}); falling back to a Google Fonts @import (needs network at render time)`);
    return `    @import url("https://fonts.googleapis.com/css2?${q}&display=block");`;
  }
  // keep the latin and latin-ext subsets; each @font-face block names its subset in a comment before it
  const out = [];
  for (const m of css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g)) {
    if (!['latin', 'latin-ext'].includes(m[1])) continue;
    let block = m[2];
    const url = /url\((https:[^)]+\.woff2)\)/.exec(block)?.[1];
    if (!url) continue;
    const fam = /font-family:\s*'([^']+)'/.exec(block)[1], w = /font-weight:\s*(\d+)/.exec(block)?.[1] || '400', st = /font-style:\s*(\w+)/.exec(block)?.[1] || 'normal';
    const file = `${fam.replace(/\W+/g, '')}-${w}${st === 'italic' ? 'i' : ''}-${m[1]}.woff2`;
    const dst = join(P, 'assets/fonts', file);
    if (!existsSync(dst)) {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`font download failed: ${url}`);
      writeFileSync(dst, Buffer.from(await r.arrayBuffer()));
    }
    block = block.replace(url, `assets/fonts/${file}`).replace(/\s+/g, ' ');
    out.push('    ' + block);
  }
  log(`fonts: ${[...fams.keys()].join(', ')} -> assets/fonts/ (${out.length} files)`);
  return out.join('\n');
}
const fontFaces = await vendorFonts();

// ---- 4. metadata, declared texts and the sound, read from the standalone page
const args = ['--ignore-gpu-blocklist', '--enable-gpu', '--enable-webgl', process.platform === 'darwin' ? '--use-angle=metal' : '--use-angle=default'];
let browser;
try { browser = await chromium.launch({ channel: 'chrome', headless: true, args }); } catch { browser = await chromium.launch({ headless: true, args }); }
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.stack || e.message));
await page.goto(pathToFileURL(standalone).href + '?render');
await page.waitForFunction(() => window.STAGE_READY || window.STAGE_ERROR, null, { timeout: 180000 }).catch(() => {});
if (errors.length) { console.error('the style failed to load:\n' + errors[0]); await browser.close(); process.exit(1); }
const meta = await page.evaluate(() => {
  const s = window.STYLE, beats = (s.storyboard && s.storyboard.beats) || [];
  return {
    D: window.DURATION, name: s.name || s.id,
    hasSound: typeof (s.sound || s.explainerSound) === 'function',
    texts: beats.filter((b) => b.text).map((b) => ({ text: b.text, start: b.start ?? b.at, end: b.end ?? b.at, key: true })),
  };
});
const D = +opt('duration', meta.D);
if (!(D > 0)) { console.error('the style has no duration'); await browser.close(); process.exit(1); }

let audioLine = '';
if (meta.hasSound && !flag('no-sound')) {
  const a = await page.evaluate(async (vo) => {
    const s = window.STYLE, fn = s.sound ? (k) => s.sound(k) : (k) => s.explainerSound(k);
    const r = await window.SOUND.renderOffline(fn, window.DURATION, 48000, { voiceover: vo });
    const u8 = new Uint8Array(r.inter.buffer); let b = '';
    for (let i = 0; i < u8.length; i += 0x8000) b += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return { b64: btoa(b), peak: r.peak };
  }, flag('voiceover'));
  if (a.peak > 1e-5) {
    const raw = join(tmp, 'sound.f32');
    writeFileSync(raw, Buffer.from(a.b64, 'base64'));
    const wav = join(P, 'assets/audio', `${ID}.wav`);
    const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'f32le', '-ar', '48000', '-ac', '2', '-i', raw, '-c:a', 'pcm_s24le', wav]);
    if (r.status !== 0) { console.error('ffmpeg could not write the sound'); process.exit(1); }
    log(`sound -> assets/audio/${ID}.wav (peak ${a.peak.toFixed(3)}${a.peak > 1 ? ', CLIPS: lower some gains' : ''})`);
    audioLine = `<audio id="${ID}-sfx" class="clip" src="assets/audio/${ID}.wav" data-start="START" data-duration="${D}" data-track-index="2"></audio>`;
  } else log('the score is silent');
}
await browser.close();

// ---- 5. the composition
const texts = meta.texts.length
  ? `  <script type="application/json" data-texts>\n${JSON.stringify(meta.texts, null, 1)}\n  </script>`
  : '';
let html;
if (medium === '3d' && flag('prerender')) {
  mkdirSync(join(P, 'assets/video'), { recursive: true });
  const clip = join(P, 'assets/video', `${ID}.mp4`);
  const r = spawnSync(process.execPath, [join(SKILL, 'scripts', 'render.mjs'), standalone, '--out', clip, ...(opt('samples') ? ['--samples', opt('samples')] : []), ...(flag('allow-software') ? ['--allow-software'] : [])], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(1);
  html = `<!-- compositions/${ID}.html: a pre-rendered 3D style scene, GENERATED by build-scene.mjs --prerender from ${basename(stylePath)}. -->
<template>
  <style>#${ID}-root { position: absolute; inset: 0; background: #000; } #${ID}-v { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }</style>
  <div id="${ID}-root" data-composition-id="${ID}" data-width="${W}" data-height="${H}">
    <video id="${ID}-v" class="clip" src="assets/video/${ID}.mp4" data-start="0" data-duration="${D}" muted playsinline></video>
  </div>
${texts}
  <script>
    const tl = gsap.timeline({ paused: true }); tl.set({}, {}, ${D});
    window.__timelines = window.__timelines || {}; window.__timelines['${ID}'] = tl;
  </script>
</template>
`;
} else {
  const tpl = readFileSync(join(ASSETS, `scene-${medium}.html`), 'utf8');
  const style = medium === '3d' ? '' : safe(src);
  html = tpl
    .replaceAll('{{ID}}', ID).replaceAll('{{W}}', String(W)).replaceAll('{{H}}', String(H)).replaceAll('{{DUR}}', String(D))
    .replaceAll('{{SOURCE}}', basename(stylePath)).replaceAll('{{SAMPLES}}', String(+opt('samples', 0) || 0))
    .replaceAll('{{ALLOW_SOFTWARE}}', String(flag('allow-software')))
    .replace('<!--FONTFACES-->', () => fontFaces)
    .replace('<!--TEXTS-->', () => texts)
    .replace('<!--LIBS-->', () => libs)
    .replace('<!--STYLE-->', () => style);
}
const out = join(P, 'compositions', `${ID}.html`);
writeFileSync(out, html);
rmSync(tmp, { recursive: true, force: true });
log(`${medium.toUpperCase()} scene "${meta.name}" -> ${relative(process.cwd(), out)} (${W}x${H}, ${D}s, ${(html.length / 1024).toFixed(0)} KB${meta.texts.length ? `, ${meta.texts.length} declared texts` : ''})`);
console.log(`\nAdd to index.html inside the root (set START to the scene's start in the film):
  <div id="${ID}" data-composition-id="${ID}" data-composition-src="compositions/${ID}.html" data-start="START" data-duration="${D}" data-track-index="1" data-width="${W}" data-height="${H}" style="z-index: 1"></div>${audioLine ? '\n  ' + audioLine : ''}`);
