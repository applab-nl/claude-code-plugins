#!/usr/bin/env node
// Render gallery stills for every installed style and write the gallery page into STYLE_HOME/gallery/.
//
//   node gallery.mjs [--only 2d|3d] [--ids 2d/flat-space,3d/voxel] [--samples 24] [--force]
//
// 2D: the style's hero frame (draw at frameT) and one frame from the middle of its reference explainer.
// 3D: two frames of the reference animation (its storyboard key times when it has them), at --samples per frame.
// Stills are 640x360 JPEGs in gallery/stills/<medium>-<id>-<n>.jpg; existing ones are kept unless --force.
// The page (assets/gallery.html + catalog.json + what is installed) works from file:// with no server.
import { chromium } from 'playwright';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { ASSETS, LIB2D, SKILL, STYLE_HOME, STYLES2D, STYLES3D, catalog, installed } from './paths.mjs';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const force = argv.includes('--force');
const only = opt('only');
const ids = opt('ids') ? new Set(opt('ids').split(',')) : null;
const SAMPLES = +opt('samples', 24);
const OUT = join(STYLE_HOME, 'gallery'), STILLS = join(OUT, 'stills');
mkdirSync(STILLS, { recursive: true });
const log = (...a) => console.log('[gallery]', ...a);
const esc = (s) => s.replace(/<\/script/gi, '<\\/script');

const have = installed().filter((id) => (!only || id.startsWith(only + '/')) && (!ids || ids.has(id)));
const stillPath = (id, n) => join(STILLS, `${id.replace('/', '-')}-${n}.jpg`);
const todo = have.filter((id) => force || !existsSync(stillPath(id, 1)));

const shrink = `(src) => { const c = document.createElement('canvas'); c.width = 640; c.height = 360;
  const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, 640, 360);
  const s = Math.min(640 / src.width, 360 / src.height), w = src.width * s, h = src.height * s;
  x.drawImage(src, (640 - w) / 2, (360 - h) / 2, w, h); return c.toDataURL('image/jpeg', 0.84).split(',')[1]; }`;

let browser = null;
if (todo.length) {
  const args = ['--ignore-gpu-blocklist', '--enable-gpu', '--enable-webgl', process.platform === 'darwin' ? '--use-angle=metal' : '--use-angle=default'];
  try { browser = await chromium.launch({ channel: 'chrome', headless: true, args }); }
  catch { browser = await chromium.launch({ headless: true, args }); }
}
const tmp = join(tmpdir(), `vp-gallery-${process.pid}`);
mkdirSync(tmp, { recursive: true });
let ok = 0;
const failed = [];

for (const id of todo) {
  const [medium, bare] = id.split('/');
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(`window.__shrink = ${shrink};`);   // our own helper, defined before the page loads
  try {
    let shots;
    if (medium === '2d') {
      const src = readFileSync(join(STYLES2D, bare + '.js'), 'utf8');
      const header = JSON.parse((/\/\* @explainer-style\n([\s\S]*?)\n\*\//.exec(src) || [, '{}'])[1]);
      const html = `<!doctype html><html><head><meta charset="utf-8">${header.fonts?.link || ''}</head><body style="margin:0;background:#000">
<canvas id="c" width="1280" height="720"></canvas>
<script>${esc(readFileSync(join(LIB2D, 'harness.js'), 'utf8'))}</script>
<script>${esc(src)}</script></body></html>`;
      const f = join(tmp, `${bare}.html`);
      writeFileSync(f, html);
      await page.goto(pathToFileURL(f).href);
      shots = await page.evaluate(async () => {
        const shrink = window.__shrink;
        const s = window.STYLES[window.STYLES.length - 1];
        if (s.fonts && document.fonts) await Promise.all(s.fonts.map((f) => document.fonts.load(f).catch(() => null)));
        const c = document.getElementById('c'), x = c.getContext('2d');
        const out = [];
        x.save(); s.draw(x, 1280, 720, s.frameT ?? (s.duration || 5) * 0.9); x.restore(); out.push(shrink(c));
        if (s.explainer) { x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, 1280, 720); x.save(); s.explainer(x, 1280, 720, (s.explainerDuration || 10) * 0.55); x.restore(); out.push(shrink(c)); }
        return out;
      });
    } else {
      const player = join(tmp, `${bare}.html`);
      const r = spawnSync(process.execPath, [join(SKILL, 'scripts', 'assemble.mjs'), join(STYLES3D, bare, 'reference.js'), '--out', player], { encoding: 'utf8' });
      if (r.status !== 0) throw new Error((r.stderr || r.stdout).trim().split('\n').pop());
      await page.goto(pathToFileURL(player).href + '?render');
      await page.waitForFunction(() => window.STAGE_READY || window.STAGE_ERROR, null, { timeout: 120000 });
      shots = await page.evaluate((n) => {
        const shrink = window.__shrink;
        const D = window.DURATION, beats = (window.STYLE.storyboard?.beats || []).map((b) => b.at);
        const ts = beats.length >= 2 ? [beats[Math.floor(beats.length / 2) - 1] ?? beats[0], beats[beats.length - 1]] : [D * 0.45, D * 0.85];
        return ts.map((t) => { window.seekN(t, n); return shrink(document.getElementById('c')); });
      }, SAMPLES);
    }
    if (errors.length) throw new Error(errors[0]);
    shots.forEach((b64, i) => writeFileSync(stillPath(id, i + 1), Buffer.from(b64, 'base64')));
    ok++;
    log(`${id}: ${shots.length} still(s)`);
  } catch (e) {
    failed.push(`${id}: ${e.message.split('\n')[0]}`);
    log(`${id}: FAILED ${e.message.split('\n')[0]}`);
  }
  await page.close();
}
if (browser) await browser.close();

// ---- the page: catalog + which styles are installed + which stills exist, inlined so it works from file://
const all = installed();
const data = catalog().map((s) => ({
  ...s,
  installed: s.medium === 'ui' || all.includes(s.id),
  stills: [1, 2].map((n) => stillPath(s.id, n)).filter(existsSync).map((p) => 'stills/' + p.split('/').pop()),
}));
const page = readFileSync(join(ASSETS, 'gallery.html'), 'utf8').replace('/*__DATA__*/[]', () => JSON.stringify(data).replace(/</g, '\\u003c'));
writeFileSync(join(OUT, 'index.html'), page);
log(`rendered ${ok}/${todo.length}${failed.length ? `, failed: ${failed.join('; ')}` : ''}; kept ${have.length - todo.length} existing`);
log(`gallery -> ${join(OUT, 'index.html')}`);
if (failed.length) process.exitCode = 1;
