// Shared by render-diagrams.mjs and lint-diagrams.mjs, so both find the same diagrams
// and read the same theme.

import { readFileSync } from 'node:fs';
import { basename, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_THEME = resolve(HERE, '../assets/theme.json');

// Thrown for anything the user can fix; the entry points print the message and exit 1.
export class UserError extends Error {}

export function slug(text) {
  return text
    .toLowerCase()
    .replace(/[`*_[\]()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'diagram';
}

export function loadTheme(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    throw new UserError(`cannot read theme ${path}: ${err.message}`);
  }
}

// The vocabulary is whatever the theme defines, so the two cannot drift apart.
export function vocabularyOf(theme) {
  return new Set([...(theme.themeCSS ?? '').matchAll(/\.node\.([A-Za-z_][\w-]*)/g)].map((m) => m[1]));
}

// A diagram may name itself with a `%% id: central-aggregation` comment. The id becomes the
// file name, so inserting a diagram or renaming a heading does not rename every later image.
function explicitId(code) {
  return code.match(/^\s*%%\s*id:\s*([A-Za-z0-9_-]+)\s*$/m)?.[1] ?? null;
}

// Fenced-code aware: only ```mermaid fences yield diagrams, and a `# comment` or a nested
// fence inside any other code block is neither a heading nor a diagram.
export function extractDiagrams(markdown) {
  const lines = markdown.split(/\r?\n/);
  const found = [];
  let heading = '';
  let fence = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (fence) {
      const close = line.match(/^\s*(`{3,}|~{3,})\s*$/);
      if (close && close[1][0] === fence.char && close[1].length >= fence.len) {
        if (fence.mermaid) {
          const code = fence.code.join('\n');
          found.push({ code, heading: fence.heading, line: fence.line, id: explicitId(code) });
        }
        fence = null;
      } else if (fence.mermaid) {
        fence.code.push(line);
      }
      continue;
    }

    const open = line.match(/^\s*(`{3,}|~{3,})\s*([^`\s]*)/);
    if (open) {
      fence = { char: open[1][0], len: open[1].length, mermaid: open[2].toLowerCase() === 'mermaid', code: [], line: i + 1, heading };
      continue;
    }

    const h = line.match(/^#{1,6}\s+(.*)$/);
    if (h) heading = h[1].trim();
  }

  if (fence?.mermaid) throw new UserError(`unclosed \`\`\`mermaid block starting at line ${fence.line}`);
  return found;
}

export function isBareMermaid(path) {
  return ['.mmd', '.mermaid'].includes(extname(path).toLowerCase());
}

// Diagrams of a markdown file, or the whole of a .mmd/.mermaid file. `line` is the line of the fence.
export function loadDiagrams(path) {
  const source = readFileSync(path, 'utf8');
  if (isBareMermaid(path)) {
    return [{ code: source, heading: basename(path, extname(path)), line: 0, id: explicitId(source) }];
  }
  return extractDiagrams(source);
}
