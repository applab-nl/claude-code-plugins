#!/usr/bin/env node
// Splice a style file, the vendored three.js, the bundled STAGE/SOUND kits and a page template into one
// self-contained HTML file.
//
//   node assemble.mjs <style.js> --out <file.html> [--mode player|storyboard] [--title "Two To Four Words"]
//                     [--base <style-id>] [--font "Family:wght@400;700"]... [--no-google-fonts]
//
// three.js and the kits are copied byte for byte from assets/lib (kits from styles/<base>/lib when a style
// ships its own kit version), so they are never retyped. Google Fonts are worked out from the CSS font specs
// in the style ('600 160px "Fredoka"').
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SKILL = resolve(HERE, '..');

function parseArgs(argv) {
  const a = { _: [], font: [], lib: [] };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (!k.startsWith('--')) { a._.push(k); continue; }
    const key = k.slice(2);
    if (key === 'no-google-fonts') { a.noGoogleFonts = true; continue; }
    const v = argv[++i];
    if (key === 'font' || key === 'lib') a[key].push(v); else a[key] = v;
  }
  return a;
}

const args = parseArgs(process.argv.slice(2));
const stylePath = args._[0];
if (!stylePath || !args.out) {
  console.error('usage: assemble.mjs <style.js> --out <file.html> [--mode player|storyboard] [--title ...] [--base id] [--font spec]');
  process.exit(2);
}
const mode = args.mode || 'player';
if (!['player', 'storyboard'].includes(mode)) { console.error(`unknown --mode ${mode}`); process.exit(2); }

const style = readFileSync(stylePath, 'utf8');
if (!/registerStyle\s*\(/.test(style)) { console.error('style file never calls registerStyle(...)'); process.exit(1); }
const THREE_LIB = readFileSync(join(SKILL, 'assets', 'lib', 'three.js'), 'utf8');

// which kit: a style may ship its own lib/ (imported from a prompt whose kit differs from the bundled one)
const idMatch = /registerStyle\(\s*\{[\s\S]*?\bid:\s*['"]([\w-]+)['"]/.exec(style);   // the style's own id, not a prop's
const base = args.base || (idMatch && existsSync(join(SKILL, 'styles', idMatch[1])) ? idMatch[1] : null);
const own = (name) => base && existsSync(join(SKILL, 'styles', base, 'lib', name));
const kit = (name) => readFileSync(own(name) ? join(SKILL, 'styles', base, 'lib', name) : join(SKILL, 'assets', 'lib', name), 'utf8');
// extra libraries (e.g. text3d.js) run after the stage kit: the base style's card lists them (`libs:`), --lib adds more
const cardLibs = base && existsSync(join(SKILL, 'styles', base, 'card.md')) ? ((/^libs:[ \t]*(.*)$/m.exec(readFileSync(join(SKILL, 'styles', base, 'card.md'), 'utf8')) || [])[1] || '') : '';
const libs = [...new Set([...cardLibs.split(',').map((s) => s.trim()).filter(Boolean), ...args.lib])];
for (const l of libs) if (!existsSync(join(SKILL, 'assets', 'lib', l)) && !own(l)) { console.error(`unknown library ${l}`); process.exit(1); }
const extraScripts = () => libs.map((l) => `${safe(kit(l))}\n//# sourceURL=${l}`).join("\n");

// fonts: every '<weight> <size>px "Family"' spec in the style, plus --font overrides
function googleFontsLink() {
  if (args.noGoogleFonts) return '';
  const fams = new Map();
  const re = /(?:(\d{3})\s+)?\d+(?:\.\d+)?px\s+\\?["']([^"'\\]+)\\?["']/g;
  let m;
  while ((m = re.exec(style))) {
    const fam = m[2].trim(), w = m[1] || '400';
    if (/^(serif|sans-serif|monospace|system-ui|cursive|fantasy)$/i.test(fam)) continue;
    if (!fams.has(fam)) fams.set(fam, new Set());
    fams.get(fam).add(w);
  }
  const parts = [];
  const explicit = new Set();
  for (const spec of args.font) { parts.push(spec.replace(/ /g, '+')); explicit.add(spec.split(':')[0].trim()); }
  for (const [fam, ws] of fams) {
    if (explicit.has(fam)) continue;
    parts.push(`${fam.replace(/ /g, '+')}:wght@${[...ws].sort().join(';')}`);
  }
  if (!parts.length) return '';
  const href = `https://fonts.googleapis.com/css2?${parts.map((p) => 'family=' + p).join('&')}&display=block`;
  return `<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="${href}">`;
}

// text inside <script type="text/plain"> must not close the element or open an HTML comment
const safe = (s) => s.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');

const nameMatch = /registerStyle\(\s*\{[\s\S]*?\bname:\s*['"]([^'"]+)['"]/.exec(style);
const title = args.title || (nameMatch ? nameMatch[1] : 'Motion Graphic') + (mode === 'storyboard' ? ' Storyboard' : '');
const escAttr = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let html = readFileSync(join(SKILL, 'assets', `${mode}.html`), 'utf8');
html = html
  .replace('{{TITLE}}', () => escAttr(title))
  .replace('<!--FONTS-->', () => googleFontsLink())
  .replace('<!--THREE-->', () => safe(THREE_LIB))
  .replace('<!--KIT_STAGE-->', () => safe(kit('stage.js')))
  .replace('<!--KIT_EXTRA-->', () => extraScripts())
  .replace('<!--KIT_SOUND-->', () => safe(kit('sound.js')))
  .replace('<!--STYLE-->', () => safe(style));

mkdirSync(dirname(resolve(args.out)), { recursive: true });
writeFileSync(args.out, html);
console.log(`wrote ${args.out} (${mode}, ${(html.length / 1024).toFixed(0)} KB, kit: ${own('stage.js') ? 'styles/' + base + '/lib' : 'assets/lib'}${libs.length ? ', libs: ' + libs.join(', ') : ''})`);
