#!/usr/bin/env node
// Static checks for a style file before it is assembled. Exits 1 on errors, 0 with warnings.
//   node lint-style.mjs <style.js> [--storyboard]
import { readFileSync } from 'node:fs';

const file = process.argv[2];
const needStoryboard = process.argv.includes('--storyboard');
if (!file) { console.error('usage: lint-style.mjs <style.js> [--storyboard]'); process.exit(2); }
const src = readFileSync(file, 'utf8');
const lines = src.split('\n');
const errors = [], warnings = [];

// update(t) is called many times per frame in any order: nothing may depend on wall-clock time or hidden state
const banned = [
  [/\bMath\.random\s*\(/, 'Math.random: use K.rng(seed) or K.hash(...)'],
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

const need = [
  [/registerStyle\s*\(/, 'registerStyle({...}) call'],
  [/\bbuild\s*\(\s*S\s*\)/, 'build(S) method'],
  [/\bupdate\s*\(\s*t\s*\)/, 'update(t) returned from build'],
  [/\bduration\s*:/, 'duration'],
  [/\bfonts\s*:/, 'fonts list (the kit awaits them before building)'],
  [/\brender\s*:/, 'render settings (copy them from the reference)'],
];
for (const [re, what] of need) if (!re.test(src)) errors.push(`missing ${what}`);
if (!/\bsound\s*\(\s*k\s*\)/.test(src)) warnings.push('no sound(k) score: the piece will be silent');
if (needStoryboard && !/\bstoryboard\s*:/.test(src)) errors.push('missing storyboard: { beats: [...], assumptions: [...] }');

// state that builds up between update calls: += / -= / ++ on object properties inside update is almost always a bug
const u = src.search(/\bupdate\s*\(\s*t\s*\)\s*\{/);
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
