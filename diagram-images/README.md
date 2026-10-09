# Diagram Images

Renders the ` ```mermaid ` blocks in a markdown document to SVG or PNG files, styled from **one shared theme**, so diagrams across documents and months still look like one set.

The diagram source holds topology and labels only; the theme holds every visual decision. A diagram cannot drift stylistically if it has no styling in it.

## Features

- **Shared theme and vocabulary** — ten node classes (`consumer`, `platform`, `service`, `datastore`, `external`, `decision`, `outcome`, `warn`, `muted`, `artefact`) defined in `assets/theme.json`
- **Drift linter** — flags inline styling, `%%{init}%%` and front-matter config overrides, unknown or missing classes, a class drawn in the wrong shape, more than one `platform` node
- **Hand-drawn, reproducible** — pinned mermaid version and pinned rough.js seed, so re-rendering an unchanged diagram changes nothing
- **Stable file names** — `%% id: name` names an image; removed or renamed diagrams have their stale images cleaned up
- **Portable output** — SVG labels are plain text (no `foreignObject`) so they open in PowerPoint, Keynote and Slides; PNG when fonts must be baked in

## Installation

```bash
/plugin install diagram-images --marketplace applab-nl/claude-code-plugins
```

## Requirements

Node 18+, `npm`, and Chrome, Chromium or Edge (set `CHROME_PATH` if it is not in a standard location). No puppeteer, mermaid-cli or Docker: the first run installs a pinned `mermaid` into `~/.cache/diagram-images`, and renders run in the browser headless.

## Usage

Ask naturally ("render the diagrams in docs/proposal.md", "add diagrams to this ADR") or run the scripts directly:

```bash
S=<plugin>/skills/diagram-images/scripts
node $S/lint-diagrams.mjs docs/proposal.md
node $S/render-diagrams.mjs docs/proposal.md                  # -> docs/images/*.svg
node $S/render-diagrams.mjs docs/proposal.md --format png     # for decks and review
```

Options: `--format svg|png`, `--scale N`, `--out DIR`, `--bg COLOR`, `--only N`, `--theme PATH`, `--raw`.

## Notes

- Vocabulary classes and the lint apply to flowcharts (`graph` / `flowchart`) only.
- Handwriting fonts are macOS fonts and SVGs reference fonts by name; use `--format png` when the picture must look identical everywhere.
- Changing `assets/theme.json` restyles every document that uses it — re-render them all.

## License

MIT
