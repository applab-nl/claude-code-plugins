// Where the style library lives, and how to find a style in it.
//
// The AI Style Atlas material (style sources, kits, cards) is never committed to the plugin. setup-styles.mjs builds
// it on the user's machine into STYLE_HOME:
//
//   $VIDEO_STYLES_HOME, else ${XDG_CACHE_HOME:-~/.cache}/video-production/styles
//     2d/lib/{harness,sound}.js        2d/styles/<id>.js           2d/rules/*.txt | 2d/prompts/<id>.txt (optional)
//     3d/lib/{stage,sound,...}.js       3d/styles/<id>/{card.md,reference.js,source-prompt.md,lib/}
//     gallery/index.html + stills/      manifest.json
//
// Our own code and the vendored three.js (MIT) stay in the plugin: SKILL/assets.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SKILL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const ASSETS = join(SKILL, 'assets');
export const STYLE_HOME = process.env.VIDEO_STYLES_HOME
  || join(process.env.XDG_CACHE_HOME || join(homedir(), '.cache'), 'video-production', 'styles');
export const LIB2D = join(STYLE_HOME, '2d', 'lib');
export const STYLES2D = join(STYLE_HOME, '2d', 'styles');
export const LIB3D = join(STYLE_HOME, '3d', 'lib');
export const STYLES3D = join(STYLE_HOME, '3d', 'styles');
export const SETUP_HINT = `Set it up once with:
  node ${join(SKILL, 'scripts', 'setup-styles.mjs')} --from-legacy <old checkout or plugin cache>
  node ${join(SKILL, 'scripts', 'setup-styles.mjs')} --from-prompts <folder of copied Atlas prompts>
(see the video-styles skill, step 0)`;

export function requireLibrary(medium) {
  const lib = medium === '2d' ? join(LIB2D, 'harness.js') : join(LIB3D, 'stage.js');
  if (!existsSync(lib)) {
    console.error(`The ${medium.toUpperCase()} style library is not set up in ${STYLE_HOME}.\n${SETUP_HINT}`);
    process.exit(1);
  }
}

export const catalog = () => JSON.parse(readFileSync(join(SKILL, 'references', 'catalog.json'), 'utf8'));

export function installed() {
  const two = existsSync(STYLES2D) ? readdirSync(STYLES2D).filter((f) => f.endsWith('.js')).map((f) => '2d/' + f.slice(0, -3)) : [];
  const three = existsSync(STYLES3D) ? readdirSync(STYLES3D).filter((d) => existsSync(join(STYLES3D, d, 'reference.js'))).map((d) => '3d/' + d) : [];
  return [...two, ...three];
}

// '3d/voxel' | 'voxel' | 'Voxel Style' -> { id, medium, name, file } or an error listing the candidates
export function resolveStyle(query) {
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9/]/g, '');
  const q = norm(query);
  const all = catalog().filter((s) => s.medium !== 'ui');
  let hits = all.filter((s) => norm(s.id) === q);
  if (!hits.length) hits = all.filter((s) => norm(s.id.split('/')[1]) === q || norm(s.name) === q);
  if (hits.length !== 1) {
    const near = hits.length ? hits : all.filter((s) => norm(s.id).includes(q) || norm(s.name).includes(q)).slice(0, 6);
    return { error: hits.length > 1 ? `"${query}" is ambiguous: ${hits.map((s) => s.id).join(', ')}` : `no style "${query}"${near.length ? `; closest: ${near.map((s) => s.id).join(', ')}` : ''}` };
  }
  const s = hits[0];
  const bare = s.id.split('/')[1];
  const file = s.medium === '2d' ? join(STYLES2D, bare + '.js') : join(STYLES3D, bare, 'reference.js');
  return { ...s, bare, file, installed: existsSync(file) };
}
