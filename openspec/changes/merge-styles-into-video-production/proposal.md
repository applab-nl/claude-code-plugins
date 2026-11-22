# Change: Merge the explainer style libraries into `video-production`, add a style gallery and Kokoro TTS

## Why

Three media plugins cover overlapping ground:
- `video-production`: HyperFrames (HTML + GSAP). It has the brief, review, captions, voice and per-channel export, but no style library and no stills storyboard.
- `explainer`: 86 2D canvas styles, at 720p only, with no TTS and no captions.
- `3d-explainer`: 37 three.js styles. Its pieces are short and it has no voice or captions.

Each plugin has what the others lack, and the user has to know which one to call. Folding the two style libraries into `video-production` as scene types gives one pipeline. Any of the 123 styles then gets the brief, captions, the four channel ratios, measured loudness and review, and a launch film can mix a styled 2D or 3D scene with UI scenes.

Two smaller gaps close in the same change:
- There is no visual way to choose among 123 styles, so the change adds a gallery page.
- Voice depends on a paid service (ElevenLabs via fal), so the change adds Kokoro as a free local engine.

Three process ideas from comparable projects are adopted:
- a treatment step (lemo-opuscar);
- an automated readability check (lemo-opuscar's `readcheck`);
- a fresh-context reviewer (video-shotcraft).

## What Changes

- **Style library moves into `video-production`** as a new skill, `video-styles`:
  - 86 2D styles (canvas, `H` harness + `SOUND` kit) and 37 3D styles (three.js `stage.js` accumulation renderer + `SOUND`), with their reference sources, cards and kits.
  - Style ids are namespaced `2d/<id>` and `3d/<id>`, because four ids exist in both libraries: `low-poly`, `neon-sign`, `voxel` and `x-ray`.
- **Styled scenes are HyperFrames scenes.** A scene adapter drives a style's `render(t)` / `S.seek(t)` from the scene's paused GSAP timeline. The style's synthesized sound is rendered offline to a WAV that the composition mixes. Styled scenes render at the composition's size and ratio (16:9, 9:16, 1:1, 4:5), and the explainers' fixed 1280×720 and 3D `--aspect` handling become the scene's `W`/`H`. If the spike (design §1) shows live capture is not viable for 3D, the fallback is a pre-rendered clip per styled scene, composited as media.
- **New `add-style` skill** (replaces 3d-explainer's): imports an AI Style Atlas style into the 2D or 3D library, renders its gallery stills and updates the catalog and gallery.
- **Style gallery:** `video-production/gallery/index.html`, a static page with one or two WebP stills per style. It filters by medium (2D, 3D, UI) and family, and each card shows the name, look and "good for". The page is committed without stills. The stills are rendered locally by the style setup script into the user's cache, and `video-styles` points to the page when suggesting styles.
- **`video-brief` changes:**
  - a style choice per film, with optional per-scene overrides;
  - a **treatment** step: three candidate structures, one picked, and a reference to learn from but not copy;
  - a **storyboard toggle**, default on, skippable for quick social clips;
  - a voice engine field.
- **New `video-storyboard` skill:** 6–10 key frames rendered in the real style(s) on a contact sheet. Claude looks at them first, then stops for approval.
- **`voice-and-music` adds Kokoro** (`kokoro-onnx`, run with `uv`, model downloaded and checksummed on first use).
  - Kokoro is the default engine.
  - ElevenLabs is used when the brief asks for Dutch or another language Kokoro lacks, a cloned voice, or premium delivery.
  - Every TTS line is transcribed back with whisper and compared with the script.
- **`render-and-export` adds a readability check** (`readcheck`): it fails when on-screen text or captions are held shorter than the motion-system reading rule.
- **`video-review` adds a fresh-context reviewer:** a subagent with no build context reviews the render against the rubric and reports findings tied to frame numbers.
- **The 3d-explainer `--aspect` work** (uncommitted on this branch) is carried into the 3D scene type and not shipped separately.
- **Removed:** the `explainer` and `3d-explainer` plugins and their marketplace entries.
- **Versions:** `video-production` 1.0.0 → **2.0.0** (BREAKING: two plugins removed, `video-brief` flow changed). The marketplace version goes 1.17.0 → 1.18.0. CHANGELOG and README carry a migration note.

## Impact

- **Affected specs:** `video-production` (new delta; no baseline spec exists yet). `explainer` is retired: the `add-explainer-plugin` change is superseded.
- **Affected code:**
  - `video-production/**`
  - removal of `explainer/` and `3d-explainer/`
  - `.claude-plugin/marketplace.json`, root `README.md`, `CLAUDE.md` (Available Plugins)
- **Size:** `video-production` grows by our own scripts and the vendored three.js (~1–2 MB). Style sources (~25 MB) and gallery stills live in the user's cache, not in the repo.
- **Licensing (decided, design §8):**
  - The repo is public, and the Atlas material was only bundled for internal use.
  - No Atlas material is committed. A setup script fetches or builds the styles and the gallery stills on the user's machine on first use.
  - The repo keeps our own code, catalog metadata in our own words, and the empty gallery page.
