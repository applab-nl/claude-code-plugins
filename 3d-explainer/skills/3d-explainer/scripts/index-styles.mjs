#!/usr/bin/env node
// Rebuild the style index from every styles/<id>/card.md: references/styles.md (what the skill reads to pick a style)
// and the style table in the plugin README. Run it after adding or changing a style.
//   node index-styles.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const README = resolve(SKILL, '..', '..', 'README.md');
const rows = [];
for (const id of readdirSync(join(SKILL, 'styles')).sort()) {
  const f = join(SKILL, 'styles', id, 'card.md');
  if (!existsSync(f)) continue;
  const c = readFileSync(f, 'utf8'), fm = {};
  for (const [, k, v] of (c.split(/^---$/m)[1] || '').matchAll(/^(\w+):[ \t]*(.*)$/gm)) fm[k] = v.trim();
  const field = (k) => ((new RegExp(`\\*\\*${k}:\\*\\* (.+)`).exec(c) || [])[1] || '').trim();
  rows.push({ id, name: fm.name || id, family: fm.family || '', use: fm.use || '', libs: fm.libs || '', look: field('Look'), good: field('Good for') });
}
rows.sort((a, b) => a.family.localeCompare(b.family) || a.name.localeCompare(b.name));

const md = ['# Styles', '', `${rows.length} looks. Pick by "Good for" first, then read only the chosen \`styles/<id>/card.md\`.`, ''];
let fam = null;
for (const r of rows) {
  if (r.family !== fam) { fam = r.family; md.push(`## ${fam || 'Other'}`, ''); }
  md.push(`- **${r.name}** (\`${r.id}\`, ${r.use}${r.libs ? `, needs ${r.libs}` : ''}): ${r.look}`, `  Good for: ${r.good}`);
}
writeFileSync(join(SKILL, 'references', 'styles.md'), md.join('\n') + '\n');

if (existsSync(README)) {
  const short = (s) => s.split(/(?<=[.:])\s/)[0].replace(/[.:]$/, '');
  const tbl = '| Style | Family | Use | Good for |\n|---|---|---|---|\n' + rows.map((r) => `| ${r.name} (\`${r.id}\`) | ${r.family} | ${r.use} | ${short(r.good)} |\n`).join('');
  const s = readFileSync(README, 'utf8'), out = s.replace(/\| Style \| Family \|[^\n]*\n\|[-| ]+\|\n(?:\|.*\n)+/, tbl);
  writeFileSync(README, out);
}
console.log(`indexed ${rows.length} styles -> references/styles.md${existsSync(README) ? ' and README.md' : ''}`);
