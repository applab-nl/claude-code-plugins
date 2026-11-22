## 0. Spike (decides live vs pre-rendered 3D)
- [x] 0.1 One 2D style (flat-space) and one 3D style (tiny-diorama) as HyperFrames scenes through the adapter, at 1920×1080 and 1080×1920
- [x] 0.2 Verify hardware WebGL in HyperFrames' Chrome, a deterministic double render, and the timing of a 10 s 3D scene; record the result in design.md §1

## 1. Move the libraries (Atlas material out of the repo, design §8)
- [x] 1.0 Check whether the Atlas site serves the style prompts at stable URLs (it doesn't: prompts come from a login-gated, rate-limited internal API, which we don't script); write `scripts/setup-styles` that fetches them (or reads a user folder of copied prompts) and builds the library into `~/.cache/video-production/styles/`, plus gallery stills
- [x] 1.1 2D: drop the committed Atlas assets and the Atlas-brief tooling (`prompt.py`, rule templates, `inline_libs.py`, `render.mjs`); the 2D importer now lives in `setup-styles.mjs`, the build rules are restated in our words in `references/build-2d.md`
- [x] 1.2 Move our own 3D code (assemble, lint-style, render, import-style, templates, vendored three.js; `index-styles` dropped, the catalog is ours) into the same skill, bringing the uncommitted `--aspect` changes along; drop the committed 3D Atlas assets
- [x] 1.2a Write catalog metadata in our own words (id, medium, family, one-line look, good-for) so styles can be suggested before setup has run
- [x] 1.3 Make the engines take `W`/`H` from the composition (2D virtual canvas; 3D `S.W`/`S.H`)
- [x] 1.4 Write the unified `references/catalog.json` + `catalog.md` with `2d/`, `3d/` and `ui` entries; bare-id resolution with ambiguity prompt
- [x] 1.5 Write the scene adapter templates (`assets/scene-2d.html`, `assets/scene-3d.html`, filled by `scripts/build-scene.mjs`) and the offline `SOUND` → WAV step

## 2. Skills
- [x] 2.1 `video-styles/SKILL.md`: pick a style (gallery + catalog, suggest three), build a styled scene, lint and purity checks, troubleshooting
- [x] 2.2 `add-style/SKILL.md` for 2D and 3D, including gallery still regeneration
- [x] 2.3 `video-brief`: style per film / per scene, treatment step, storyboard toggle, voice engine field
- [x] 2.4 `video-storyboard/SKILL.md`: key frames → contact sheet → self-look → stop
- [x] 2.5 `voice-and-music`: `scripts/tts_kokoro.py` (pinned, checksummed model cache), engine selection rules, whisper round-trip check
- [x] 2.6 `render-and-export`: `scripts/readcheck.py` + `texts.json` manifest (DOM sampling, declared for styled scenes)
- [x] 2.7 `video-review`: fresh-context reviewer dispatch and finding format

## 3. Gallery
- [x] 3.1 `skills/video-styles/scripts/gallery.mjs` (runs on the user's machine after setup): 2 JPEG stills per style from its reference animation, catalog data inlined into the page
- [x] 3.2 `gallery/index.html`: filters by medium/family, search, cards with name, look and good-for; works from `file://` and in terminal-browser
- [x] 3.3 Generate all 123 entries and check the stills by eye on a contact sheet

## 4. Plugin and marketplace
- [x] 4.1 Remove `explainer/` and `3d-explainer/` and their marketplace entries; mark `add-explainer-plugin` superseded
- [x] 4.2 `video-production` 2.0.0 in plugin.json and marketplace.json; marketplace 1.17.0 → 1.18.0
- [x] 4.3 README (gallery link, Kokoro setup, migration note), CHANGELOG, LICENSE/attribution (three.js, Atlas, Kokoro model licence)
- [x] 4.4 Root README and CLAUDE.md Available Plugins updated
- [x] 4.5 Settle the licensing decision (design §8) before merge

## 5. Verification
- [x] 5.1 `claude plugin validate` for the plugin and marketplace
- [x] 5.2 End to end (partial): a 23 s film with a 2D and a 3D styled scene, their scores, Kokoro VO and caption clips, rendered twice bit-identical; a 3D scene at 1080x1920; readcheck failing a short caption and passing once fixed. Not exercised: a UI scene in the same film, whisper word captions (no whisper installed), the fresh-context reviewer
- [x] 5.3 A pure 2D explainer and a pure 3D clip through `build-scene` (references of flat-space and tiny-diorama)
- [ ] 5.4 A real creative run through the installed plugin in a fresh session

> 5.4 needs a person: install the plugin from the branch in a fresh session and make one real film through the skills.
