#!/usr/bin/env node
// Render every ```mermaid block in a markdown file to an image, using one shared theme.
//
//   node render-diagrams.mjs <file.md> [...] [options]
//
//   --out DIR       output directory (default: <dir of input>/images)
//   --format FMT    svg | png                  (default: svg)
//   --scale N       png device scale factor    (default: 2)
//   --raw           skip SVG minification
//   --bg COLOR      background                 (default: theme background)
//   --theme PATH    theme config               (default: ../assets/theme.json)
//   --only N        render just diagram N (1-based), repeatable; one input file only
//   --quiet         suppress the per-diagram log
//
// No puppeteer and no mermaid-cli: mermaid is installed once into a cache directory and run
// in a system Chrome/Chromium/Edge started headless (set CHROME_PATH to choose one).

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { DEFAULT_THEME, UserError, loadDiagrams, loadTheme, slug } from './lib.mjs';

const MERMAID_VERSION = '11.17.2';
const CACHE = join(process.env.XDG_CACHE_HOME ?? join(homedir(), '.cache'), 'diagram-images');
const CHROME_TIMEOUT_MS = 120_000;

function parseArgs(argv) {
  const opts = { files: [], out: null, format: 'svg', scale: 2, bg: null, theme: DEFAULT_THEME, only: [], quiet: false, raw: false };
  const value = (i, flag) => {
    if (i >= argv.length) throw new UserError(`${flag} needs a value`);
    return argv[i];
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') opts.out = value(++i, a);
    else if (a === '--format') opts.format = value(++i, a);
    else if (a === '--scale') opts.scale = Number(value(++i, a));
    else if (a === '--bg') opts.bg = value(++i, a);
    else if (a === '--theme') opts.theme = resolve(value(++i, a));
    else if (a === '--only') opts.only.push(Number(value(++i, a)));
    else if (a === '--quiet') opts.quiet = true;
    else if (a === '--raw') opts.raw = true;
    else if (a.startsWith('--')) throw new UserError(`unknown option: ${a}`);
    else opts.files.push(a);
  }
  if (!opts.files.length) throw new UserError('no input file given\n\nusage: render-diagrams.mjs <file.md> [...] [--out DIR] [--format svg|png] [--scale N]');
  if (!['svg', 'png'].includes(opts.format)) throw new UserError(`--format must be svg or png, got "${opts.format}"`);
  if (!(opts.scale > 0)) throw new UserError('--scale must be a positive number');
  if (opts.only.length && opts.files.length > 1) throw new UserError('--only picks diagram numbers, which only makes sense with a single input file');
  return opts;
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ].filter(Boolean);
  for (const c of candidates) if (existsSync(c)) return c;

  for (const name of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge']) {
    const found = spawnSync(process.platform === 'win32' ? 'where' : 'which', [name], { encoding: 'utf8' });
    if (found.status === 0) return found.stdout.split(/\r?\n/)[0].trim();
  }
  throw new UserError('no Chrome, Chromium or Edge found. Install one, or set CHROME_PATH to its executable.');
}

// mermaid is installed once per pinned version, so output does not depend on whatever is global.
function ensureMermaid() {
  const dir = join(CACHE, `mermaid-${MERMAID_VERSION}`);
  const bundle = join(dir, 'node_modules/mermaid/dist/mermaid.min.js');
  if (existsSync(bundle)) return bundle;

  mkdirSync(dir, { recursive: true });
  console.error(`Installing mermaid@${MERMAID_VERSION} into ${dir} (first run only)...`);
  try {
    execFileSync('npm', ['install', '--prefix', dir, '--no-audit', '--no-fund', '--silent', `mermaid@${MERMAID_VERSION}`], { stdio: ['ignore', 'ignore', 'pipe'] });
  } catch (err) {
    throw new UserError(`could not install mermaid (needs node + npm and network once):\n${(err.stderr ?? err.message).toString().trim().split('\n').slice(-4).join('\n')}`);
  }
  if (!existsSync(bundle)) throw new UserError(`mermaid installed but ${bundle} is missing`);
  return bundle;
}

function runChrome(chrome, work, args) {
  const result = spawnSync(
    chrome,
    ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', `--user-data-dir=${join(work, 'profile')}`, ...args],
    { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024, timeout: CHROME_TIMEOUT_MS },
  );
  if (result.error) throw new UserError(`could not run ${chrome}: ${result.error.message}`);
  return result;
}

// Every diagram goes through one headless-Chrome page. The page renders them with mermaid and
// leaves the results, base64-encoded, in the DOM for --dump-dom to print.
function renderSvgs(chrome, mermaidBundle, config, jobs, background, work) {
  const page = join(work, 'render.html');
  writeFileSync(
    page,
    `<!doctype html><meta charset="utf-8"><body>
<script src="${pathToFileURL(mermaidBundle).href}"></script>
<script>
const config = ${JSON.stringify(config).replace(/</g, '\\u003c')};
const jobs = ${JSON.stringify(jobs).replace(/</g, '\\u003c')};
(async () => {
  mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', ...config });
  const results = [];
  for (const job of jobs) {
    try {
      const { svg } = await mermaid.render(job.id, job.code);
      results.push({ svg });
    } catch (err) {
      results.push({ error: String((err && err.message) || err) });
    }
  }
  const out = document.createElement('pre');
  out.id = 'result';
  out.textContent = btoa(unescape(encodeURIComponent(JSON.stringify(results))));
  document.body.appendChild(out);
})();
</script>`,
    'utf8',
  );

  const run = runChrome(chrome, work, ['--virtual-time-budget=60000', '--dump-dom', pathToFileURL(page).href]);
  const encoded = run.stdout.match(/<pre id="result">([A-Za-z0-9+/=]+)<\/pre>/)?.[1];
  if (!encoded) {
    throw new UserError(`${basename(chrome)} produced no render output (exit ${run.status}).\n${(run.stderr ?? '').trim().split('\n').slice(-4).join('\n')}`);
  }
  const results = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
  return results.map((r) => (r.svg ? { svg: withBackground(r.svg, background) } : r));
}

// Same as mmdc's -b: paint the background on the root element, so it survives outside a page.
function withBackground(svg, background) {
  return svg.replace(/<svg\b[^>]*>/, (tag) => {
    const rule = `background-color: ${background};`;
    return /\sstyle="/.test(tag) ? tag.replace(/\sstyle="/, ` style="${rule} `) : tag.replace(/>$/, ` style="${rule}">`);
  });
}

function svgSize(svg) {
  const box = svg.match(/viewBox="[-\d.]+[ ,]+[-\d.]+[ ,]+([\d.]+)[ ,]+([\d.]+)"/);
  if (!box) throw new UserError('rendered SVG has no viewBox, cannot size the PNG');
  return { width: Math.ceil(Number(box[1])), height: Math.ceil(Number(box[2])) };
}

function svgToPng(chrome, svg, scale, background, outPath, work) {
  const { width, height } = svgSize(svg);
  const page = join(work, 'png.html');
  writeFileSync(
    page,
    `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:${background}}svg{display:block}</style>${svg}`,
    'utf8',
  );
  const run = runChrome(chrome, work, [
    `--screenshot=${outPath}`,
    `--window-size=${width},${height}`,
    `--force-device-scale-factor=${scale}`,
    '--virtual-time-budget=10000',
    pathToFileURL(page).href,
  ]);
  if (!existsSync(outPath)) throw new UserError(`PNG export failed (exit ${run.status}).\n${(run.stderr ?? '').trim().split('\n').slice(-4).join('\n')}`);
}

// rough.js writes coordinates at full float precision ("-73.65628193913531"), which is
// most of the file. Two decimals is visually identical and roughly halves the size.
function minifySvg(svg) {
  return svg
    .replace(/-?\d+\.\d{3,}/g, (n) => String(Number(Number(n).toFixed(2))))
    .replace(/\s+style=""/g, '');
}

// Files written by a previous run of the same document and format that this run no longer
// produces (a diagram was removed or renamed) are deleted, so images/ never collects orphans.
function pruneOrphans(outDir, docSlug, format, current) {
  const manifest = join(outDir, `.${docSlug}.diagram-images.json`);
  let previous = {};
  try { previous = JSON.parse(readFileSync(manifest, 'utf8')); } catch { /* first run */ }

  const removed = (previous[format] ?? []).filter((name) => !current.includes(name));
  for (const name of removed) {
    try { unlinkSync(join(outDir, name)); } catch { /* already gone */ }
  }
  writeFileSync(manifest, `${JSON.stringify({ ...previous, [format]: current }, null, 2)}\n`, 'utf8');
  return removed;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!existsSync(opts.theme)) throw new UserError(`theme not found: ${opts.theme}`);

  const theme = loadTheme(opts.theme);
  const background = opts.bg ?? theme.themeVariables?.background ?? '#FFFFFF';
  const chrome = findChrome();
  const mermaidBundle = ensureMermaid();
  const work = mkdtempSync(join(tmpdir(), 'diagram-images-'));
  const written = [];

  try {
    const seen = new Map();
    for (const file of opts.files) {
      const path = resolve(file);
      if (!existsSync(path)) throw new UserError(`no such file: ${path}`);

      const diagrams = loadDiagrams(path);
      if (!diagrams.length) {
        console.warn(`warning: no mermaid blocks found in ${file}`);
        continue;
      }

      const outDir = resolve(opts.out ?? join(dirname(path), 'images'));
      const docSlug = slug(basename(path, extname(path)));
      const clash = seen.get(`${outDir}/${docSlug}`);
      if (clash) throw new UserError(`${file} and ${clash} would write the same image names into ${outDir}; give them different --out directories`);
      seen.set(`${outDir}/${docSlug}`, file);

      const ids = new Set();
      const jobs = diagrams.map((diagram, index) => {
        const n = index + 1;
        const stem = diagram.id ?? `${String(n).padStart(2, '0')}-${slug(diagram.heading)}`;
        if (ids.has(stem)) throw new UserError(`${file}: two diagrams are named "${stem}" (check the "%% id:" comments)`);
        ids.add(stem);
        return { n, diagram, name: `${docSlug}-${stem}.${opts.format}`, id: `dg-${docSlug}-${stem}` };
      }).filter((job) => !opts.only.length || opts.only.includes(job.n));

      if (!jobs.length) throw new UserError(`${file} has ${diagrams.length} diagram${diagrams.length === 1 ? '' : 's'}; --only ${opts.only.join(',')} matches none`);
      mkdirSync(outDir, { recursive: true });

      const results = renderSvgs(chrome, mermaidBundle, theme, jobs.map((j) => ({ id: j.id, code: j.diagram.code })), background, work);

      const names = [];
      jobs.forEach((job, i) => {
        const result = results[i];
        if (result.error) {
          throw new UserError(`failed to render diagram ${job.n} of ${file} (source line ${job.diagram.line})\n${result.error.split('\n').slice(0, 6).join('\n')}`);
        }

        const outPath = join(outDir, job.name);
        let before;
        let after;
        if (opts.format === 'svg') {
          before = Buffer.byteLength(result.svg);
          const svg = opts.raw ? result.svg : minifySvg(result.svg);
          after = Buffer.byteLength(svg);
          writeFileSync(outPath, svg, 'utf8');
        } else {
          svgToPng(chrome, result.svg, opts.scale, background, outPath, work);
          before = after = statSync(outPath).size;
        }

        names.push(job.name);
        written.push({ file, n: job.n, heading: job.diagram.heading || job.diagram.id || `diagram ${job.n}`, outPath, outDir, name: job.name, link: relative(dirname(path), outPath).split('\\').join('/') });
        if (!opts.quiet) {
          const saved = before > after ? ` (${Math.round(100 - (100 * after) / before)}% smaller)` : '';
          console.log(`  ${job.n}. ${job.diagram.heading || '(no heading)'} -> ${job.name}  ${Math.round(after / 1024)}KB${saved}`);
        }
      });

      if (!opts.only.length) {
        const removed = pruneOrphans(outDir, docSlug, opts.format, names);
        if (removed.length && !opts.quiet) console.log(`  removed ${removed.length} stale image${removed.length === 1 ? '' : 's'}: ${removed.join(', ')}`);
      }
    }
  } finally {
    rmSync(work, { recursive: true, force: true });
  }

  if (!written.length) return;

  console.log(`\nRendered ${written.length} diagram${written.length === 1 ? '' : 's'} to ${written[0].outDir}`);
  console.log('\nMarkdown to embed them:\n');
  for (const w of written) console.log(`![${w.heading}](${w.link})`);
}

try {
  main();
} catch (err) {
  if (!(err instanceof UserError)) throw err;
  console.error(`error: ${err.message}`);
  process.exit(1);
}
