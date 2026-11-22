#!/usr/bin/env node
// Vendor three.js into skills/video-styles/assets/three.js as ONE self-contained ES module, so the
// assembled player/storyboard HTML has no CDN dependency (works offline, no third-party request).
//
//   node tools/vendor-three.mjs [version]      (default 0.187.0; rerun to upgrade)
//
// What it does: downloads build/three.core.js and build/three.module.js from jsdelivr and merges them
// into a single module. three.module.js imports its bindings from ./three.core.js, so the merge:
//   1. wraps the core in an IIFE that returns its exports (its internal helpers stay private, so the two
//      files' same-named internals cannot collide);
//   2. destructures those exports into the module scope, where three.module.js's own code expects them;
//   3. drops the cross-file import and both `export` statements, and re-exposes the union of all
//      exported names as `const THREE = {...}; window.THREE = THREE;`.
// The result is syntax-checked with `node --check` before it is written.
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const VERSION = process.argv[2] || '0.187.0';
const OUT = new URL('../skills/video-styles/assets/three.js', import.meta.url).pathname;
const CDN = (f) => `https://cdn.jsdelivr.net/npm/three@${VERSION}/build/${f}`;

const get = async (file) => {
  const r = await fetch(CDN(file));
  if (!r.ok) throw new Error(`${file}: HTTP ${r.status}`);
  return r.text();
};

const [core, mod] = await Promise.all([get('three.core.js'), get('three.module.js')]);

// Every export statement in these builds is a single `export { A, B, ... };` (optionally `from '...'`),
// with no `as` aliases.
const EXPORT = /^export \{([^}]*)\}(?:\s*from\s*'[^']*')?\s*;?\s*$/gm;
const parseExports = (src, label) => {
  const names = [];
  for (const m of src.matchAll(EXPORT)) {
    for (const n of m[1].split(',')) {
      const name = n.trim();
      if (!name) continue;
      if (name.includes(' as ')) throw new Error(`${label}: unexpected alias in export: ${name}`);
      names.push(name);
    }
  }
  if (!names.length) throw new Error(`${label}: no export statement found — build layout changed?`);
  return names;
};
const stripExports = (src) => src.replace(EXPORT, `/* (exports handled by the merge below) */`);

const coreNames = parseExports(core, 'three.core.js');
const modNames = parseExports(mod, 'three.module.js');
const allNames = [...new Set([...coreNames, ...modNames])];

// the core IIFE: source verbatim except the export statement, plus a return of every exported name
const coreIIFE = `const __three_core__ = (() => {
${stripExports(core).trim()}
return {
  ${coreNames.join(',\n  ')},
};
})();`;

// the module part: drop the import (its bindings come from the destructure below) and both export
// statements (the `from './three.core.js'` one and the final plain one)
const modPart = stripExports(mod)
  .replace(/^import \{[^}]*\} from '\.\/three\.core\.js';\s*$/m, `/* (three.core.js is merged above) */`);
if (modPart.includes("'./three.core.js'")) throw new Error('unmerged reference to three.core.js left in three.module.js');

const banner = `// three.js ${VERSION}, vendored inline by tools/vendor-three.mjs.
// Merged from ${CDN('three.module.js')} and ${CDN('three.core.js')} into one module so assembled HTML
// files need no network. MIT licensed — https://threejs.org (copyright notice below).
/**
 * @license
 * Copyright 2010-2025 Three.js Authors
 * SPDX-License-Identifier: MIT
 */
`;

const merged = `${banner}${coreIIFE}

// every name three.module.js's code (and the page) expects, bound in this module's scope
const { ${coreNames.join(', ')} } = __three_core__;

/* ==== three.module.js (WebGL renderer build) ==== */
${modPart.trim()}

// the union of everything the two files exported, re-exposed for the page
const THREE = {
  ${allNames.join(',\n  ')},
};
window.THREE = THREE;
`;

// syntax check before writing (module syntax: check through a .mjs copy)
const tmp = mkdtempSync(join(tmpdir(), 'vendor-three-'));
const check = join(tmp, 'check.mjs');
writeFileSync(check, merged);
const c = spawnSync(process.execPath, ['--check', check], { encoding: 'utf8' });
if (c.status !== 0) { rmSync(tmp, { recursive: true, force: true }); throw new Error(`syntax check failed:\n${c.stderr}`); }
rmSync(tmp, { recursive: true, force: true });

writeFileSync(OUT, merged);
console.log(`vendored three.js ${VERSION} -> ${OUT.replace(process.cwd() + '/', '')}`);
console.log(`  ${(merged.length / 1024).toFixed(0)} KB, ${allNames.length} exports (${coreNames.length} core + ${modNames.length} module), syntax OK`);
