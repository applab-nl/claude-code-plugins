#!/usr/bin/env node
// Static checks for a style file (2D or 3D) before it is built into a scene. Exits 1 on errors, 0 with warnings.
//   node lint-style.mjs <style.js> [--medium 2d|3d] [--storyboard]
import { readFileSync } from 'node:fs';

const argv = process.argv.slice(2);
const mi = argv.indexOf('--medium');
const file = argv.find((a, i) => !a.startsWith("--") && (mi < 0 || i !== mi + 1));
const needStoryboard = argv.includes('--storyboard');
if (!file) { console.error('usage: lint-style.mjs <style.js> [--medium 2d|3d] [--storyboard]'); process.exit(2); }
const src = readFileSync(file, 'utf8');
const medium = mi >= 0 ? argv[mi + 1] : /\bbuild\s*\(\s*S\s*\)/.test(src) ? '3d' : '2d';
const lines = src.split('\n');
const errors = [], warnings = [];

// update(t) is called many times per frame in any order: nothing may depend on wall-clock time or hidden state
const banned = [
  [/\bMath\.random\s*\(/, 'Math.random: use K.rng(seed) / K.hash(...) (3D) or H.rng(seed) (2D)'],
  [/\bDate\.now\s*\(|\bnew Date\s*\(/, 'Date: drive everything from t'],
  [/\bperformance\.now\s*\(/, 'performance.now: drive everything from t'],
  [/\bset(Timeout|Interval)\s*\(/, 'timers: drive everything from t'],
  [/\brequestAnimationFrame\s*\(/, 'requestAnimationFrame: the player owns the clock'],
  [/\bfetch\s*\(|\bXMLHttpRequest\b|\bimport\s*\(/, 'network loads: build everything in code'],
  [/\b(GLTF|FBX|OBJ|Texture|RGBE|EXR|Font)Loader\b|three\/addons|examples\/jsm/, 'loaders/addons: core three.js only, no downloaded assets'],
  [/\bnew Audio\s*\(|<audio/, 'audio files: use the SOUND kit'],
];
lines.forEach((l, i) => {
  const code = l.replace(/\/\/.*$/, '');
  for (const [re, msg] of banned) if (re.test(code)) errors.push(`${file}:${i + 1}: ${msg}`);
});

const need = medium === '2d' ? [
  [/registerStyle\s*\(/, 'registerStyle({...}) call'],
  [/\bexplainer\s*\(\s*\w+\s*,/, 'explainer(ctx, W, H, t) method'],
  [/\b(explainerDuration|duration)\s*:/, 'explainerDuration (or duration)'],
  [/\bfonts\s*:/, 'fonts list (the adapter awaits them before the first frame)'],
] : [
  [/registerStyle\s*\(/, 'registerStyle({...}) call'],
  [/\bbuild\s*\(\s*S\s*\)/, 'build(S) method'],
  [/\bupdate\s*\(\s*t\s*\)/, 'update(t) returned from build'],
  [/\bduration\s*:/, 'duration'],
  [/\bfonts\s*:/, 'fonts list (the kit awaits them before building)'],
  [/\brender\s*:/, 'render settings (copy them from the reference)'],
];
for (const [re, what] of need) if (!re.test(src)) errors.push(`missing ${what}`);
if (!/\b(sound|explainerSound)\s*[(:]/.test(src)) warnings.push(`no ${medium === '2d' ? 'explainerSound(k)' : 'sound(k)'} score: the scene will be silent`);
if (needStoryboard && !/\bstoryboard\s*:/.test(src)) errors.push('missing storyboard: { beats: [...], assumptions: [...] }');

// state that builds up between update calls: += / -= / ++ on object properties inside update is almost always a bug
const u = medium === '2d' ? -1 : src.search(/\bupdate\s*\(\s*t\s*\)\s*\{/);
if (u >= 0) {
  const startLine = src.slice(0, u).split('\n').length;
  for (let i = startLine; i < lines.length; i++) {
    const code = lines[i].replace(/\/\/.*$/, '');
    if (/\b(sound|overlay)\s*\(/.test(code) && /^\s*(sound|overlay)\s*\(/.test(code)) break;
    if (/[\w\]\)]\.(position|rotation|scale|quaternion)\.\w+\s*(\+=|-=|\*=)|\.(position|rotation|scale)\.(add|multiply|addScaledVector|applyAxisAngle)\s*\(|\.(rotate[XYZ]|translate[XYZ]|translateOnAxis)\s*\(/.test(code)
      && !/\.set\(|\.copy\(/.test(code)) warnings.push(`${file}:${i + 1}: accumulating transform inside update(t)? every value must be set fresh from t (rotateX after rotation.set(...) on the same line is fine)`);
  }
}

for (const w of warnings) console.log('warn  ' + w);
for (const e of errors) console.log('error ' + e);
console.log(errors.length ? `${errors.length} error(s)` : `ok${warnings.length ? ` with ${warnings.length} warning(s)` : ''}`);
process.exit(errors.length ? 1 : 0);
