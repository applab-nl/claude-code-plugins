## 1. Assets
- [x] 1.1 Write `explainer/tools/build_assets.py` (input: directory of copied prompts + `variants.json`), with the integrity checks from the spec
- [x] 1.2 Generate `assets/lib/{harness,sound}.js`, 86 `assets/styles/<styleId>.js` with metadata headers, the 4 rule templates and `references/catalog.md`
- [x] 1.3 Check that a rerun produces no diff, and that `prompt.py --full` rebuilds all 86 default prompts and all 16 captured switch combinations byte for byte

## 2. Skill
- [x] 2.1 Rule templates in `references/rules/` plus `scripts/prompt.py` to render them (replaces the planned hand-written `build-rules.md`; see design decision 3)
- [x] 2.2 Write `SKILL.md`: trigger description, intake (style, content, options), storyboard gate, build steps (inlining the libraries), render offer
- [x] 2.3 Write `scripts/inline_libs.py` (byte-exact inlining, re-runnable, player-interface lint)
- [x] 2.4 Write `scripts/render.mjs` (dependency check, browser fallbacks, seek loop → ffmpeg, `SOUND.renderOffline` → WAV, optional voiceover mix padded to picture length)

## 3. Plugin + marketplace
- [x] 3.1 `explainer/.claude-plugin/plugin.json`, README.md (with install line), CHANGELOG.md, LICENSE
- [x] 3.2 `marketplace.json` entry (category media) and marketplace version 1.15.0 → 1.16.0
- [x] 3.3 Add the plugin under **Media** in the repo's CLAUDE.md and README; cross-link with video-production

## 4. Verification
- [x] 4.1 `claude plugin validate` passes for the plugin and the marketplace
- [x] 4.2 Script pipeline end to end on three styles (flat-space, glassmorphism, whiteboard): reference animation wrapped in a player → `inline_libs.py` → `render.mjs`. H.264 1280x720 with AAC audio; frames inspected; lint failure paths checked
- [x] 4.3 Voiceover mix with a test tone shorter than the picture: output keeps the full picture length
- [x] 4.4 Real creative run through the installed skill (new topic → storyboard → build → render), in a fresh session
