# Design: styles as HyperFrames scenes

## Context
- HyperFrames seeks a paused GSAP timeline to frame N and screenshots it (`hyperframes-scene`). Every pixel must be a pure function of time.
- Both style engines already meet that contract:
  - explainer exposes `window.seek(t)` / `window.DURATION`;
  - 3d-explainer exposes `S.seek(t, n)`, and its purity check proves out-of-order seeks match.
- So the integration is an adapter, not a rewrite.

## Decisions

### 1. Scene adapter, with a spike first
- A styled scene is a normal composition file with one `<canvas>`. Its script builds the style synchronously, then adds a single tween to the scene timeline whose `onUpdate` calls the engine's seek at the scene-local time (`tl.time()`).
  - 3D seeks run at full samples during render and at a low sample count in `preview`.
- **The spike checks four things:**
  1. that HyperFrames' headless Chrome has hardware WebGL (3D fails loudly on software rendering today);
  2. that the capture waits for a synchronous multi-sample seek;
  3. that frames are identical across two renders;
  4. the render time of a 10 s 3D scene at 1080p.
- **Fallback** if the 3D checks fail: the scene adapter pre-renders the styled scene to a clip with the ported `render.mjs` at the composition's size and fps, and the composition places it as a muted `<video>`. 2D stays live either way. Scenes look the same in both modes; only build time differs.

#### Spike result (2026-11-22, HyperFrames 0.8.228, M1 Max)
**Live capture works, and the fallback is not needed on a GPU machine.**

Test film: a 14 s composition with a 2D `flat-space` scene (6 s) followed by a 3D `tiny-diorama` scene (8 s, 72 samples).

| Check | Result |
|---|---|
| GPU | The `browserGpuMode` probe chose **hardware** (ANGLE Metal) with auto settings, so no flag is needed |
| Async start | The 3D engine starts asynchronously (font loading, `K.run`) inside a `<script type="module">`, which breaks render-contract rule 15. HyperFrames waits for the late timeline registration, and frames are correct from t=0 |
| Speed | 1920×1080: 420 frames in **52 s**. 1080×1920: **44 s** |
| Determinism (inline kits) | Two renders gave bit-identical frames at 0.5 / 3.2 / 6.0 / 9.7 / 13.9 s |
| Lint, inline kits | Three errors (`Math.random`, `performance.now`, `requestAnimationFrame`), all from vendored three.js internals. The `requestAnimationFrame` hit routes the render to screenshot capture with virtual time, which is what makes it bit-exact |
| Lint, kits in an external bundle | Kits in `assets/vendor/stage-bundle.js`: lint clean and faster (32–35 s) |
| Determinism (external bundle) | Runs differ slightly (PSNR ≈ 48 dB, not visible), including in the 2D scene. Neither `--experimental-fast-capture=false` nor `PRODUCER_FORCE_SCREENSHOT` fixed it |

**Decisions from the spike:**
- **Kits are inlined into the scene**, so the double-render pixel-diff check in `hyperframes-scene` stays exact. The skill documents the three lint errors as expected for styled scenes, and `check` must report no other errors.
- Recheck the external-bundle route whenever the HyperFrames pin moves.
- Composition files of styled scenes are large (~2 MB for 3D). Gitignore them, or regenerate them from `style.js` the way 3d-explainer's `assemble` does today. The source is `style.js`, never the assembled scene.
- The 3D adapter reads `UNMASKED_RENDERER_WEBGL` and throws on SwiftShader, so a machine without a GPU fails loudly instead of rendering for hours. Those machines use the pre-render fallback with `--allow-software`.
- **9:16:**
  - 3D renders natively at 1080×1920, but the reference camera crops the sides. The build step must reframe it (as expected).
  - 2D reference layouts are fixed at 1280×720. Letterboxing them showed drawing spilling outside the box, so the adapter clips to the layout box. Vertical 2D still needs a real re-layout in the build.
- **Not covered by the spike:** offline `SOUND` → WAV inside a HyperFrames project. It is the same code path `render.mjs` uses today and gets tested in task 5.2.

### 2. One library, namespaced
- `skills/video-styles/assets/{2d,3d}/…` hold the style sources, kits, cards and the vendored three.js 0.187.
- `references/styles.md` is one catalog with medium, family, look and good-for. Ids are `2d/<id>` and `3d/<id>`, because four ids exist in both libraries. A bare id resolves when it is unique and asks when it is not.
- UI scenes (today's motion system) appear in the catalog as medium `ui`.

### 3. Size and aspect
- The engines take `W`/`H` from the composition instead of fixed constants:
  - 2D: the harness gets a virtual canvas size;
  - 3D: `S.W`/`S.H`, as the `--aspect` work already does.
- Reference sources stay at their native layout. The build step reflows for the target ratio (per-ratio safe zones from `render-and-export`).
- A vertical cut of a styled scene is a re-layout, as with UI scenes, never a crop.

### 4. Sound
- Each styled scene's `SOUND` score is rendered offline (`SOUND.renderOffline`) to `assets/audio/<scene>.wav` and added as an `<audio id>` with `data-start`.
- It is mixed and loudness-measured by `voice-and-music` like any other stem. With voiceover on, the existing sidechain/duck rules apply.

### 5. Process changes in `video-brief`
- Order: brief → treatment → approval → storyboard (if on) → approval → build.
- The treatment is short: three candidate structures with one line each, the chosen one with its reason, and a reference to learn from plus what not to copy.
- The storyboard toggle defaults on. The brief records `storyboard: off` for quick social clips.
- `video-storyboard` renders key frames:
  - with `hyperframes snapshot` at each beat's key time, for block-out compositions;
  - with the ported `render.mjs --preview` for styled 3D scenes.
  
  It builds a contact sheet, Claude looks at it, and then it stops.

### 6. Kokoro
- `scripts/tts_kokoro.py` is a `uv` inline-deps script with `kokoro-onnx` pinned.
- Its model and voice files come from a pinned release. They are downloaded once to a user cache dir and checked by SHA-256. The script refuses to run on a mismatch.
- Output is one WAV per line, then whisper word timings feed `captions-on-the-beat`.
- Engine choice:
  - Kokoro by default;
  - ElevenLabs when the language is unsupported (Dutch, for example), a cloned voice is wanted, or the brief says premium.
- An engine is never switched silently: the brief records it.

### 7. Readability and fresh review
- **`readcheck`** reads a `texts.json` manifest (`[{text, start, end}]`).
  - DOM scenes: it is generated by sampling visible text from snapshots.
  - Styled scenes: it is declared, from the storyboard beats.
  
  It fails any item held shorter than the motion-system rule (0.5 s + 0.3 s per word), with a 1.5 s floor for anything the story needs.
- **The fresh reviewer** gets only the render, the brief and the `video-review` rubric, not the build conversation. It returns P0/P1/P2 findings with frame numbers, and the main thread fixes them or justifies leaving them.

### 8. Licensing: Atlas material stays out of the repo (decided)
- The Atlas material was bundled on the assumption that the repo is private. The repo is public.
- **Decision:** no Atlas material is committed. That covers style sources, cards, `harness.js`, `sound.js`, `stage.js`, `strokefont.js`, `text3d.js`, prompt wording, and gallery stills rendered from Atlas references.
- On first use, a setup script obtains the prompts on the user's machine and builds the library locally, in a user cache dir (`~/.cache/video-production/styles/`), with the existing importers: `build_assets.py` for 2D and `import-style.mjs` for 3D.
- **Source order:**
  1. download from the public Atlas site, if it serves the prompts at a stable URL (to be checked);
  2. otherwise a folder of prompts the user copied.
- **The repo keeps only:**
  - our MIT code: importers, adapter, scene templates, scripts;
  - the catalog metadata needed to suggest styles (id, name, family, a one-line look in our own words);
  - vendored three.js (MIT).
- **The gallery page** is committed as an empty shell. Its stills are rendered locally into the cache by the setup script, and the page reads them from there.
- The existing `explainer/` and `3d-explainer/` directories are removed, but git history still holds the material. Purging history is out of scope unless the user asks.

## Risks
- **3D render time inside HyperFrames:** about 72 samples × frames. Mitigations are the pre-render fallback and a per-scene sample override for drafts.
- **HyperFrames changes fast.** The adapter depends only on timeline seek and canvas capture, and the CLI stays pinned (0.8.228).
- **Repo size** (~30 MB): acceptable for a marketplace plugin; no model weights are committed.
- **Old style ids:** users who still type `/explainer` or `/3d-explainer` lose those triggers. The `video-styles` description names "explainer", "3D explainer" and the Atlas style names so the same requests still trigger it.
