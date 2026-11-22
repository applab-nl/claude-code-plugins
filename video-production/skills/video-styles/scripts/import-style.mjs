#!/usr/bin/env node
// Import a style from a "make me a 3D motion graphic in the <X> style" prompt (style card + STAGE kit + SOUND kit +
// reference source) into the style library: <STYLE_HOME>/3d/styles/<id>/ (see paths.mjs).
//
//   node import-style.mjs <prompt.txt> [--force]
//   node import-style.mjs --clipboard [--force]          (macOS: reads the prompt with pbpaste)
//
// Writes styles/<id>/card.md (frontmatter + card), reference.js, source-prompt.md (the prompt with the code removed),
// and styles/<id>/lib/*.js only when that prompt's kit differs from the bundled one. Prints what differs from the
// baseline prompt so style-specific instructions are not lost.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { LIB3D, STYLES3D } from './paths.mjs';
const argv = process.argv.slice(2);
const force = argv.includes('--force');
const src = argv.includes('--clipboard') ? execFileSync('pbpaste', [], { encoding: 'utf8', maxBuffer: 64 << 20 }) : readFileSync(argv.find((a) => !a.startsWith('--')) || '', 'utf8');
const text = src.replace(/\r\n/g, '\n');

// a fenced block that follows a heading line matching `re`
function blockAfter(re) {
  const m = re.exec(text);
  if (!m) return null;
  const rest = text.slice(m.index + m[0].length);
  const f = /```[a-z]*\n([\s\S]*?)\n```/.exec(rest);
  return f ? { code: f[1], heading: m[0], start: m.index, end: m.index + m[0].length + f.index + f[0].length } : null;
}
const stage = blockAfter(/^STAGE KIT[^\n]*$/m);
const sound = blockAfter(/^SOUND KIT[^\n]*$/m);
const ref = blockAfter(/^REFERENCE STYLE SOURCE[^\n]*$/m);
if (!stage || !sound || !ref) { console.error(`could not find ${[!stage && 'STAGE KIT', !sound && 'SOUND KIT', !ref && 'REFERENCE STYLE SOURCE'].filter(Boolean).join(', ')} code block(s)`); process.exit(1); }
// extra libraries some styles ship, under any other "NAME (lib/<file>.js ...)" heading, e.g. TEXT3D (lib/text3d.js)
const extras = [];
for (const m of text.matchAll(/^[A-Z0-9][A-Z0-9 ]*\(lib\/([\w.-]+\.js)[^\n]*$/gm)) {
  if (m[1] === 'stage.js' || m[1] === 'sound.js') continue;
  const b = blockAfter(new RegExp('^' + m[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'm'));
  if (b) extras.push({ file: m[1], ...b });
}

const head = /styles\/([\w-]+)\.js(?:;\s*its sample topic was\s*"(.*)"\)\s*$)?/.exec(ref.heading) || [];   // greedy: topics can contain quotes
const idFromCode = /registerStyle\(\s*\{[\s\S]*?\bid:\s*['"]([\w-]+)['"]/.exec(ref.code);   // the style's own id, not a prop's
const id = (idFromCode && idFromCode[1]) || head[1];
if (!id) { console.error('could not work out the style id'); process.exit(1); }
const topic = head[2] || (/\btopic:\s*'((?:[^'\\]|\\.)*)'/.exec(ref.code) || [])[1] || '';

// the card: "Key: value" lines between STYLE CARD and the STAGE KIT heading
const cardStart = /^STYLE CARD\s*$/m.exec(text);
const cardText = cardStart ? text.slice(cardStart.index + cardStart[0].length, stage.start).trim() : '';
const card = {};
let lastKey = null;
for (const line of cardText.split('\n')) {
  const m = /^([A-Z][\w ]{1,20}):\s*(.*)$/.exec(line);
  if (m) { lastKey = m[1].trim(); card[lastKey] = m[2].trim(); } else if (lastKey && line.trim()) card[lastKey] += ' ' + line.trim();
}
const fonts = (/Load these Google Fonts[^:]*:\s*([^\n]+)/.exec(text) || [])[1] || '';
const durRaw = (/\bduration:\s*([\w.]+)/.exec(ref.code) || [])[1] || '';      // a number, or a schedule key like T.end
const duration = /^[\d.]+$/.test(durRaw) ? durRaw : ((new RegExp('\\b' + durRaw.split('.').pop() + '\\s*[:=]\\s*([\\d.]+)').exec(ref.code) || [])[1] || '')   // T.end: 8.5 or const D = 12;
const samples = (/\bsamples:\s*(\d+)/.exec(ref.code) || [])[1] || '';

mkdirSync(LIB3D, { recursive: true });
const dir = join(STYLES3D, id);
if (existsSync(dir) && !force) { console.error(`styles/${id} already exists (pass --force to overwrite)`); process.exit(1); }
mkdirSync(dir, { recursive: true });

const name = card.Name || id;
const body = Object.entries(card).filter(([k]) => !['Name', 'Family', 'Use'].includes(k)).map(([k, v]) => `**${k}:** ${v}`).join('\n\n');
writeFileSync(join(dir, 'card.md'), `---
id: ${id}
name: ${name}
family: ${card.Family || ''}
use: ${card.Use || ''}
fonts: ${fonts.trim()}
reference_topic: ${topic}
duration: ${duration}
samples: ${samples}
libs: ${extras.map((e) => e.file).join(', ')}
---

# ${name}

${body}

## Working with the reference

TODO: read reference.js and fill this in (see styles/tiny-diorama/card.md for the shape): which part is the topic's
content and schedule, which part is the style's own kit of builders to copy unchanged, and the habits that make the look.
`);
writeFileSync(join(dir, 'reference.js'), ref.code + '\n');

// kits and libraries: keep the bundled one unless this prompt ships a different version; a library nobody has
// bundled yet becomes a shared one in assets/lib (other styles may use it too)
const norm = (s) => s.replace(/[ \t]+$/gm, '').trim();
const kitReport = [], note = {};
for (const [file, block] of [['stage.js', stage], ['sound.js', sound], ...extras.map((e) => [e.file, e])]) {
  const shared = join(LIB3D, file);
  if (!existsSync(shared)) { writeFileSync(shared, block.code + '\n'); note[file] = `new shared library, saved as assets/lib/${file}`; kitReport.push(`${file}: ${note[file]}`); continue; }
  if (norm(readFileSync(shared, 'utf8')) === norm(block.code)) { note[file] = `identical to the bundled assets/lib/${file}`; kitReport.push(`${file}: identical to the bundled kit`); continue; }
  mkdirSync(join(dir, 'lib'), { recursive: true });
  writeFileSync(join(dir, 'lib', file), block.code + '\n');
  const tmp = join(tmpdir(), `video-styles-${process.pid}-${file}`);
  writeFileSync(tmp, block.code + '\n');
  const d = spawnSync('diff', ['-u', shared, tmp], { encoding: 'utf8' }).stdout || '';
  note[file] = `saved as lib/${file}`;
  kitReport.push(`${file}: DIFFERS from the bundled kit -> saved to styles/${id}/lib/${file} (assemble picks it up for this style)\n${d.split('\n').slice(0, 60).join('\n')}`);
}

// the prompt without code, for provenance and to spot style-specific instructions
const strip = (s) => {
  for (const [file, b] of [['stage.js', stage], ['sound.js', sound], ...extras.map((e) => [e.file, e])]) s = s.replace(text.slice(b.start, b.end), `${b.heading}\n[${note[file]}]`);
  return s.replace(text.slice(ref.start, ref.end), `${ref.heading}\n[saved as reference.js]`);
};
const prose = strip(text).trim() + '\n';
writeFileSync(join(dir, 'source-prompt.md'), prose);

// compare the generic sections with the baseline style's prompt (style names, fonts and the card are expected to differ)
const baseId = existsSync(join(STYLES3D, 'tiny-diorama', 'source-prompt.md')) && id !== 'tiny-diorama' ? 'tiny-diorama'
  : readdirSync(STYLES3D).find((s) => s !== id && existsSync(join(STYLES3D, s, 'source-prompt.md')));
let promptDiff = '(no baseline prompt to compare with)';
if (baseId) {
  const generic = (s) => s.split(/^STYLE CARD\s*$/m)[0];
  const a = join(tmpdir(), `video-styles-${process.pid}-base.md`), b = join(tmpdir(), `video-styles-${process.pid}-new.md`);
  writeFileSync(a, generic(readFileSync(join(STYLES3D, baseId, 'source-prompt.md'), 'utf8')));
  writeFileSync(b, generic(prose));
  const d = spawnSync('diff', ['-u', a, b], { encoding: 'utf8' }).stdout;
  promptDiff = d ? `differences from styles/${baseId}/source-prompt.md (generic sections only):\n${d.split('\n').slice(2).join('\n')}` : `generic sections identical to styles/${baseId}`;
}

console.log(`imported style "${name}" (${id}) -> styles/${id}/`);
console.log(`  card.md, reference.js, source-prompt.md${kitReport.some((r) => r.includes('DIFFERS')) ? ', lib/' : ''}`);
for (const r of kitReport) console.log('  ' + r);
console.log('\n' + promptDiff);
