#!/usr/bin/env node
// Drift check. Styling must live in the shared theme, never in a diagram.
//
//   node lint-diagrams.mjs <file.md> [...] [--theme PATH]
//
// Exits 1 if any error-level finding is present.

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { DEFAULT_THEME, UserError, loadDiagrams, loadTheme, vocabularyOf } from './lib.mjs';

const SHAPE = '\\[\\(.*?\\)\\]|\\[\\[.*?\\]\\]|\\{\\{.*?\\}\\}|\\[.*?\\]|\\(\\(.*?\\)\\)|\\(.*?\\)|\\{.*?\\}';
const NODE = new RegExp(`([A-Za-z_][\\w-]*)(${SHAPE})(?::::([A-Za-z_][\\w-]*))?`, 'g');
const ASSIGNED = /([A-Za-z_][\w-]*):::([A-Za-z_][\w-]*)/g;
const CLASS_STATEMENT = /^\s*class\s+(\S+)\s+([A-Za-z_][\w-]*)\s*$/;

// What each class must be drawn as (see assets/shape-vocabulary.md). Everything else is a rectangle.
const SHAPE_NAMES = { cylinder: 'a cylinder [("...")]', rhombus: 'a rhombus {"..."}', rectangle: 'a rectangle ["..."]' };
const expectedShape = (cls) => (cls === 'datastore' ? 'cylinder' : cls === 'decision' ? 'rhombus' : 'rectangle');

function shapeKind(shape) {
  if (shape.startsWith('[(')) return 'cylinder';
  if (shape.startsWith('[[')) return 'subroutine';
  if (shape.startsWith('{{')) return 'hexagon';
  if (shape.startsWith('((')) return 'circle';
  if (shape.startsWith('(')) return 'rounded';
  if (shape.startsWith('{')) return 'rhombus';
  return 'rectangle';
}

function lintDiagram(code, startLine, vocabulary, findings, file) {
  const lines = code.split('\n');
  const err = (at, msg) => findings.push({ level: 'error', at, msg });
  const warn = (at, msg) => findings.push({ level: 'warning', at, msg });
  const firstLine = `${file}:${startLine}`;

  // YAML front matter can carry a `config:` block, which overrides the theme as surely as %%{init}%%.
  if (/^\s*---\s*\n[\s\S]*?\bconfig\s*:[\s\S]*?\n---\s*(\n|$)/.test(code)) {
    err(firstLine, 'front-matter config block overrides the shared theme. Remove it; change assets/theme.json instead.');
  }

  const type = code
    .replace(/^\s*---[\s\S]*?\n---\s*(\n|$)/, '')
    .split('\n')
    .map((l) => l.replace(/%%.*$/, '').trim())
    .find(Boolean)
    ?.match(/^[A-Za-z][\w-]*/)?.[0];
  const isFlowchart = type === 'graph' || type === 'flowchart';
  if (type && !isFlowchart) {
    warn(firstLine, `${type} diagram: vocabulary classes only exist for flowcharts, so this renders with theme defaults and is not checked.`);
  }

  const declared = new Map(); // id -> { at, kind }
  const assigned = new Map(); // id -> { cls, at }

  lines.forEach((line, i) => {
    const at = `${file}:${startLine + i}`;
    const bare = line.replace(/%%.*$/, '');

    if (/%%\{\s*init\s*:/.test(line)) err(at, 'per-diagram init directive overrides the shared theme. Remove it; change assets/theme.json instead.');
    if (/^\s*classDef\s/.test(bare)) err(at, 'classDef defines a local style. Add the class to themeCSS in assets/theme.json instead.');
    if (/^\s*style\s+\S/.test(bare)) err(at, 'inline style statement. Use a vocabulary class (:::name) instead.');
    if (/^\s*linkStyle\s/.test(bare)) err(at, 'inline linkStyle. Edge styling belongs in themeCSS.');
    if (/(fill|stroke|color)\s*:\s*#[0-9a-fA-F]{3,8}/.test(bare)) err(at, 'hard-coded colour in the diagram source. Colour belongs in the shared theme.');

    if (!isFlowchart || /^\s*subgraph\b/.test(bare)) return;

    // Labels can contain anything that looks like a node, so blank them before matching.
    const text = bare.replace(/"[^"]*"/g, '""').replace(/\|[^|]*\|/g, '||');

    const statement = text.match(CLASS_STATEMENT);
    if (statement) {
      for (const id of statement[1].split(',')) assigned.set(id, { cls: statement[2], at });
      return;
    }
    for (const m of text.matchAll(ASSIGNED)) assigned.set(m[1], { cls: m[2], at });
    for (const m of text.matchAll(NODE)) {
      if (!declared.has(m[1])) declared.set(m[1], { at, kind: shapeKind(m[2]) });
      if (m[3]) assigned.set(m[1], { cls: m[3], at });
    }
  });

  for (const [id, { at }] of declared) {
    if (!assigned.has(id)) {
      warn(at, `node "${id}" has no vocabulary class. It will render as an unstyled default. Add :::consumer, :::service, :::platform, ...`);
    }
  }

  let platforms = 0;
  for (const [id, { cls, at }] of assigned) {
    if (!vocabulary.has(cls)) {
      err(at, `unknown class ":::${cls}". Known: ${[...vocabulary].sort().join(', ')}`);
      continue;
    }
    if (cls === 'platform') platforms++;

    const kind = declared.get(id)?.kind;
    const want = expectedShape(cls);
    if (kind && kind !== want) warn(declared.get(id).at, `node "${id}" is :::${cls} but drawn as a ${kind}; the vocabulary requires ${SHAPE_NAMES[want]}.`);
  }

  if (platforms > 1) {
    warn(firstLine, `${platforms} nodes marked :::platform. A diagram should have one subject; consider splitting it.`);
  }
}

function main() {
  const args = process.argv.slice(2);
  let themePath = DEFAULT_THEME;
  const files = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--theme') {
      if (i + 1 >= args.length) throw new UserError('--theme needs a value');
      themePath = resolve(args[++i]);
    } else if (args[i].startsWith('--')) {
      throw new UserError(`unknown option: ${args[i]}`);
    } else {
      files.push(args[i]);
    }
  }
  if (!files.length) throw new UserError('usage: lint-diagrams.mjs <file.md> [...] [--theme PATH]');
  if (!existsSync(themePath)) throw new UserError(`theme not found: ${themePath}`);

  const vocabulary = vocabularyOf(loadTheme(themePath));
  const findings = [];

  for (const file of files) {
    const path = resolve(file);
    if (!existsSync(path)) throw new UserError(`no such file: ${path}`);
    for (const d of loadDiagrams(path)) lintDiagram(d.code, d.line + 1, vocabulary, findings, file);
  }

  if (!findings.length) {
    console.log(`No drift found in ${files.length} file${files.length === 1 ? '' : 's'}.`);
    return;
  }

  for (const f of findings) console.log(`${f.level === 'error' ? 'ERROR  ' : 'warning'} ${f.at}\n         ${f.msg}`);

  const errors = findings.filter((f) => f.level === 'error').length;
  const warnings = findings.length - errors;
  console.log(`\n${errors} error${errors === 1 ? '' : 's'}, ${warnings} warning${warnings === 1 ? '' : 's'}.`);
  if (errors) process.exit(1);
}

try {
  main();
} catch (err) {
  if (!(err instanceof UserError)) throw err;
  console.error(`error: ${err.message}`);
  process.exit(1);
}
