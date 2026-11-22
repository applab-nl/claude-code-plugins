#!/usr/bin/env node
// Build the style library on this machine (the AI Style Atlas material is never committed to the plugin).
//
//   node setup-styles.mjs --from-legacy <dir>     copy from an old explainer / 3d-explainer install: a checkout of
//                                                 claude-code-plugins before the merge, or the Claude plugin cache
//                                                 (~/.claude/plugins); searched recursively
//   node setup-styles.mjs --from-prompts <dir>    import prompts copied from the Atlas site (*.txt, 2D or 3D)
//   node setup-styles.mjs --status                what is installed, what the catalog lists but is missing
//   node setup-styles.mjs --gallery               (re)render the gallery stills only
//
// options: --no-gallery (skip stills), --only 2d|3d, --force (overwrite existing styles)
// Output goes to STYLE_HOME (paths.mjs). The gallery is rendered after an import unless --no-gallery.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { LIB2D, LIB3D, SKILL, STYLE_HOME, STYLES2D, STYLES3D, catalog, installed } from './paths.mjs';

const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : null; };
const flag = (k) => argv.includes(`--${k}`);
const only = opt('only');
const want = (m) => !only || only === m;
const log = (...a) => console.log('[setup]', ...a);

function walk(dir, depth, fn) {
  if (depth < 0 || !existsSync(dir)) return;
  let entries = [];
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (!e.isDirectory() || e.name === 'node_modules' || e.name === '.git') continue;
    const p = join(dir, e.name);
    if (fn(p) === false) continue;
    walk(p, depth - 1, fn);
  }
}

// ---------------------------------------------------------------- legacy copy
function fromLegacy(root) {
  root = resolve(root);
  let two = null, three = null;
  // newest wins when the plugin cache holds several versions
  const newer = (a, b) => (!a || statSync(b).mtimeMs > statSync(a).mtimeMs ? b : a);
  walk(root, 8, (p) => {
    if (p.endsWith(join('skills', 'explainer', 'assets')) && existsSync(join(p, 'lib', 'harness.js'))) two = newer(two, p);
    if (p.endsWith(join('skills', '3d-explainer')) && existsSync(join(p, 'assets', 'lib', 'stage.js'))) three = newer(three, p);
  });
  if (!two && !three) { console.error(`no explainer or 3d-explainer assets found under ${root}`); process.exit(1); }
  let n2 = 0, n3 = 0;
  if (two && want('2d')) {
    mkdirSync(LIB2D, { recursive: true }); mkdirSync(STYLES2D, { recursive: true });
    for (const f of ['harness.js', 'sound.js']) cpSync(join(two, 'lib', f), join(LIB2D, f));
    for (const f of readdirSync(join(two, 'styles')).filter((f) => f.endsWith('.js'))) {
      const dst = join(STYLES2D, f);
      if (existsSync(dst) && !flag('force')) continue;
      cpSync(join(two, 'styles', f), dst); n2++;
    }
    const rules = join(two, '..', 'references', 'rules');
    if (existsSync(rules)) cpSync(rules, join(STYLE_HOME, '2d', 'rules'), { recursive: true });
    log(`2D: ${n2} styles + kits from ${two}`);
  }
  if (three && want('3d')) {
    mkdirSync(LIB3D, { recursive: true }); mkdirSync(STYLES3D, { recursive: true });
    for (const f of readdirSync(join(three, 'assets', 'lib')).filter((f) => f.endsWith('.js') && f !== 'three.js')) cpSync(join(three, 'assets', 'lib', f), join(LIB3D, f));
    for (const id of readdirSync(join(three, 'styles'))) {
      const src = join(three, 'styles', id), dst = join(STYLES3D, id);
      if (!existsSync(join(src, 'reference.js'))) continue;
      if (existsSync(dst) && !flag('force')) continue;
      cpSync(src, dst, { recursive: true }); n3++;
    }
    log(`3D: ${n3} styles + kits from ${three}`);
  }
  writeManifest(`legacy:${root}`);
}

// ---------------------------------------------------------------- prompts
const FENCE = /```js\n([\s\S]*?)\n```/;
function import2d(text, file) {
  const at = (label) => { const i = text.indexOf(label); if (i < 0) throw new Error(`missing section "${label}"`); return i; };
  const iCard = at('STYLE CARD\n'), iLib = at('H HELPER LIBRARY ('), iSnd = at('SOUND KIT (lib/sound.js)'), iSrc = at('REFERENCE STYLE SOURCE (');
  const block = (i) => { const m = FENCE.exec(text.slice(i)); if (!m) throw new Error('missing ```js block'); return m[1]; };
  const harness = block(iLib), sound = block(iSnd), source = block(iSrc);
  const id = (/REFERENCE STYLE SOURCE \(styles\/([a-z0-9-]+)\.js/.exec(text.slice(iSrc)) || [])[1];
  if (!id) throw new Error('cannot read the styleId');
  const card = text.slice(iCard, iLib);
  const field = (label) => ((new RegExp(`^${label}: (.*)$`, 'm')).exec(card) || [])[1] || '';
  const fonts = /Load these Google Fonts[^:]*: (.*)\n {2}(<link [^\n]*>)\n/.exec(text.slice(0, iCard));
  const header = { styleId: id, name: field('Name'), family: field('Family'), look: field('Look'), motion: field('Motion'),
    howItExplains: field('How it explains'), fonts: fonts ? { families: fonts[1].split(', '), link: fonts[2] } : null };
  mkdirSync(LIB2D, { recursive: true }); mkdirSync(STYLES2D, { recursive: true }); mkdirSync(join(STYLE_HOME, '2d', 'prompts'), { recursive: true });
  for (const [name, code] of [['harness.js', harness], ['sound.js', sound]]) {
    const p = join(LIB2D, name);
    if (!existsSync(p)) writeFileSync(p, code + '\n');
    else if (readFileSync(p, 'utf8').trim() !== code.trim()) log(`warning: ${file}: its lib/${name} differs from the installed one; kept the installed one`);
  }
  const dst = join(STYLES2D, id + '.js');
  if (existsSync(dst) && !flag('force')) return { id: '2d/' + id, skipped: true };
  writeFileSync(dst, `/* @explainer-style\n${JSON.stringify(header, null, 2)}\n*/\n${source}\n`);
  writeFileSync(join(STYLE_HOME, '2d', 'prompts', id + '.txt'), text);
  return { id: '2d/' + id };
}

function fromPrompts(dir) {
  const files = readdirSync(dir).filter((f) => f.endsWith('.txt') || f.endsWith('.md'));
  if (!files.length) { console.error(`no .txt/.md prompts in ${dir}`); process.exit(1); }
  const done = [], failed = [];
  for (const f of files) {
    const p = join(dir, f), text = readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
    try {
      if (/^STAGE KIT/m.test(text)) {
        if (!want('3d')) continue;
        const r = spawnSync(process.execPath, [join(SKILL, 'scripts', 'import-style.mjs'), p, ...(flag('force') ? ['--force'] : [])], { encoding: 'utf8' });
        if (r.status !== 0) throw new Error((r.stderr || r.stdout).trim().split('\n')[0]);
        done.push(/\(([\w-]+)\) ->/.exec(r.stdout)?.[1] ? '3d/' + /\(([\w-]+)\) ->/.exec(r.stdout)[1] : f);
      } else if (text.includes('H HELPER LIBRARY (')) {
        if (!want('2d')) continue;
        done.push(import2d(text, f).id);
      } else throw new Error('not a 2D or 3D Style Atlas prompt');
    } catch (e) { failed.push(`${f}: ${e.message}`); }
  }
  log(`imported ${done.length}: ${done.join(', ')}`);
  if (failed.length) log(`failed ${failed.length}:\n  ${failed.join('\n  ')}`);
  writeManifest(`prompts:${resolve(dir)}`);
}

// ---------------------------------------------------------------- status / manifest
function status() {
  const have = new Set(installed());
  const cat = catalog().filter((s) => s.medium !== 'ui');
  const missing = cat.filter((s) => !have.has(s.id)).map((s) => s.id);
  const extra = [...have].filter((id) => !cat.some((s) => s.id === id));
  const stills = existsSync(join(STYLE_HOME, 'gallery', 'stills')) ? readdirSync(join(STYLE_HOME, 'gallery', 'stills')).length : 0;
  return { home: STYLE_HOME, installed2d: [...have].filter((i) => i.startsWith('2d/')).length, installed3d: [...have].filter((i) => i.startsWith('3d/')).length,
    catalog: cat.length, missing, notInCatalog: extra, galleryStills: stills };
}
function writeManifest(source) {
  mkdirSync(STYLE_HOME, { recursive: true });
  const m = { ...status(), source, updated: new Date().toISOString() };
  writeFileSync(join(STYLE_HOME, 'manifest.json'), JSON.stringify(m, null, 2) + '\n');
  log(`${m.installed2d} 2D + ${m.installed3d} 3D styles in ${STYLE_HOME}${m.missing.length ? `; ${m.missing.length} catalog styles missing` : ''}`);
}

function gallery() {
  const r = spawnSync(process.execPath, [join(SKILL, 'scripts', 'gallery.mjs'), ...(only ? ['--only', only] : [])], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status || 1);
}

if (flag('status')) { console.log(JSON.stringify(status(), null, 2)); process.exit(0); }
if (opt('from-legacy')) fromLegacy(opt('from-legacy'));
else if (opt('from-prompts')) fromPrompts(opt('from-prompts'));
else if (!flag('gallery')) { console.error('usage: setup-styles.mjs --from-legacy <dir> | --from-prompts <dir> | --status | --gallery  [--no-gallery] [--only 2d|3d] [--force]'); process.exit(2); }
if (!flag('no-gallery')) gallery();
