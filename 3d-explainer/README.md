# 3D Explainer

Short (7–12 s) 3D explainer motion graphics made with three.js, in a fixed look. You give a topic; Claude storyboards
it as rendered stills, waits for your OK, then builds a self-contained HTML player and renders an MP4.

The look comes from a **style**: a style card plus the full source of a reference animation. Every style runs on the
same two kits: `stage.js`, an accumulation renderer that gives real motion blur, depth of field and soft shadows, and
`sound.js`, a synthesized Web Audio sound kit. Scripts splice the kits in, so Claude only ever writes one `style.js`
per piece.

## Skills

| Skill | Use it when |
|---|---|
| `3d-explainer` | "Make a Tiny Diorama video about how a coffee bean reaches your cup", "a 3D explainer of how a request moves through our API" |
| `add-style` | You have another style prompt ("I want a short 3D motion graphic made with three.js in the X style…") and want it bundled |

## Styles

| Style | Family | Use | Good for |
|---|---|---|---|
| Blueprint Build (`blueprint-build`) | Diagrams with depth | explainer | Plans, set-ups and how-it-is-made |
| Data Skyline (`data-skyline`) | Diagrams with depth | explainer | Any list of labelled values |
| Exploded View (`exploded-view`) | Diagrams with depth | explainer | How something is built or what is inside it |
| Layer Stack (`layer-stack`) | Diagrams with depth | explainer | Anything built in layers |
| Node Network (`node-network`) | Diagrams with depth | explainer | Anything that is things and the connections between them |
| White Model (`white-model`) | Diagrams with depth | explainer | How something flows through a system |
| Dithered (`dithered`) | Filters over 3D | explainer | Any object or small set-up staged like a still life, with desktop windows carrying the numbers |
| Ink and Toon (`ink-toon`) | Filters over 3D | explainer | Steps, recipes and how-tos with a few recognisable objects |
| Low-Poly (`low-poly`) | Filters over 3D | explainer | Processes that happen in a place |
| Painted (`painted`) | Filters over 3D | story | Stories, journeys and processes that happen in a place, told as a picture book |
| Pencil Sketch (`pencil-sketch`) | Filters over 3D | explainer | How something is built or put together, step by step |
| Voxel (`voxel`) | Filters over 3D | explainer | Anything that can be shown as a small model that builds up in stages |
| X-Ray (`x-ray`) | Filters over 3D | explainer | What is inside something and how it works |
| Embossed (`embossed`) | Flat content made physical | title | Any quote, name, number or simple logo |
| LED Wall (`led-wall`) | Flat content made physical | story | Any 2D animation, diagram or story that can be drawn at lamp resolution |
| Neon Sign (`neon-sign`) | Flat content made physical | explainer | How something works, as a diagram that switches on in the order it happens |
| Particle Swarm (`particle-swarm`) | Flat content made physical | explainer | Processes where stuff flows, gathers, splits, grows, heats up or bursts, and things that are made of many units (cells, molecules, people, grains, data points) |
| Pin Wall (`pin-wall`) | Flat content made physical | explainer | Anything that can be shown as a moving relief or a moving greyscale picture |
| Shadow Box (`shadow-box`) | Flat content made physical | explainer | Sequences with a natural order in depth |
| Split-Flap Board (`split-flap`) | Flat content made physical | title | Lists, rankings and numbers |
| Domino Chain (`domino-chain`) | Machines that explain | explainer | Cause and effect, chain reactions, step-by-step plans and anything that compounds |
| Factory Line (`factory-line`) | Machines that explain | explainer | Any step-by-step process |
| Marble Run (`marble-run`) | Machines that explain | explainer | Sorting, routing and filtering |
| Glass and Light (`glass-light`) | Material worlds | explainer | Recipes, mixtures, ratios, amounts, chemistry |
| Inflated (`inflated`) | Material worlds | explainer | Any explainer or story that can be told with a few simple inflated objects and characters |
| Paper Pop-Up (`paper-pop-up`) | Material worlds | story | A story or a process in a few steps |
| Soft Clay (`soft-clay`) | Material worlds | explainer | Anything that can be told with a few friendly objects on a table |
| Toy Blocks (`toy-blocks`) | Material worlds | explainer | Lists, comparisons, proportions, steps and "the building blocks of X" |
| Device Hero (`device-hero`) | Products and screens | product | An app, a feature or any on-screen moment |
| Floating Screens (`floating-screens`) | Products and screens | explainer | Anything made of steps or screens |
| Hero Icon (`hero-icon`) | Products and screens | title | A tool, product or idea as one object |
| Studio Product (`studio-product`) | Products and screens | product | One product and one claim |
| Circuit City (`circuit-city`) | Spaces and journeys | explainer | Journeys and pipelines |
| Monument Type (`monument-type`) | Spaces and journeys | title | A short statement of two to five words where one word is the point |
| Museum Gallery (`museum-gallery`) | Spaces and journeys | explainer | Lists and timelines of three to five points |
| Spotlight Stage (`spotlight-stage`) | Spaces and journeys | story | Stories, history, fables and step-by-step scenes |
| Tiny Diorama (`tiny-diorama`) | Spaces and journeys | explainer | Places, systems and journeys |

## How a piece gets made

```
intake ─▶ style.js (block-out + storyboard beats) ─▶ storyboard.html ─▶ ✋ approval
       ─▶ style.js (full scene + sound) ─▶ lint + purity check ─▶ player.html ─▶ MP4 + contact sheet
```

Files for a piece live in `./motion/<slug>/`: `style.js`, `storyboard.html`, `player.html`, `stills/`, `<slug>.mp4`.

## Scripts

All in `skills/3d-explainer/scripts/`:

| Script | Does |
|---|---|
| `assemble.mjs <style.js> --out x.html [--mode player\|storyboard]` | Splices template + three.js (vendored, see `tools/vendor-three.mjs`) + kits + style into one HTML file; loads Google Fonts named in the style |
| `lint-style.mjs <style.js> [--storyboard]` | Flags `Math.random`, `Date`, timers, loaders, accumulating transforms, missing fields |
| `render.mjs <page.html> --out x.mp4` | Every frame through ffmpeg, offline audio, two-pass loudnorm to -15 LUFS, contact sheet |
| `render.mjs <page.html> --preview --out dir [--check-purity] [--at t,t]` | Stills only; optionally verifies `update(t)` leaves nothing behind |
| `index-styles.mjs` | Rebuilds `references/styles.md` (the skill's style picker) and this README's style table from the cards |
| `import-style.mjs <prompt.txt> \| --clipboard` | Splits a style prompt into `styles/<id>/`, diffs its kits and generic instructions; extra libraries (e.g. `text3d.js`) become shared ones in `assets/lib` |

## Requirements

- Node 18+ and `npm install` once in `skills/3d-explainer/scripts` (Playwright)
- Nothing else online: three.js is vendored into `assets/lib/three.js` by `tools/vendor-three.mjs`, so assembled HTML files are fully self-contained (Google Fonts, when a style names any, are the only optional network use)
- Google Chrome (headless, GPU via ANGLE/Metal on macOS); falls back to Playwright's Chromium
- ffmpeg on `PATH`

## Installation

```bash
/plugin install 3d-explainer --marketplace applab-nl/claude-code-plugins
```
