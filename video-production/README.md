# Video Production

Skills for making launch videos, feature drops, product walkthroughs, social clips and animated explainers **in code**, with [HyperFrames](https://www.npmjs.com/package/hyperframes) (HTML + GSAP rendered to video). Every frame is reproducible, every number on screen can move, and nothing ships before someone has looked at every cut.

## Skills

The skills follow the order a video gets made in:

| Skill | Use it when |
|-------|-------------|
| `video-brief` | Before anything is built: a one-page brief (one line, audience, length, aspect ratios, beats with second marks, shown vs said, look, voice engine) plus a short treatment, approved first |
| `video-storyboard` | After the brief, when the storyboard is on: one key frame per beat on a contact sheet, approved before the build |
| `video-styles` | A film or scene in one of 123 visual styles (86 2D canvas, 37 three.js 3D), built into a HyperFrames scene; the style gallery |
| `add-style` | Importing a new AI Style Atlas prompt into the local style library |
| `hyperframes-scene` | Writing or editing a scene, setting up a project, or debugging a render that flickers, freezes or differs between runs |
| `motion-system` | Choosing eases, durations, staggers, kinetic type and camera moves, or when a draft "looks generated" or "feels like slides" |
| `product-ui-recreation` | The video needs product screens: rebuild them in HTML instead of dropping in a screenshot |
| `walkthrough-video` | Cursor-driven demos: cursor paths, clicks, zoom punch-ins, spotlight, numbered steps, the loop reset |
| `ai-footage` | Generated live-action or character shots via fal: still-first workflow, model per shot, spend logging, rerolls |
| `voice-and-music` | Voiceover (Kokoro locally by default, ElevenLabs on fal for Dutch, cloned or premium voices, every line checked back with whisper), dialogue, music beds and SFX, the "on set" treatment and a loudness mix |
| `captions-on-the-beat` | Word-timed captions from the voice track, and cuts that land on the music's beat grid |
| `video-review` | The eyes-on gate before showing anything: snapshot beats and cuts, the defect checklist, a fresh-context reviewer, `REVIEW.md` |
| `render-and-export` | Readability check, final render, per-channel cuts (16:9, 9:16, 1:1, 4:5), loop rotation, MP4/GIF/poster exports, batch renders |

## Installation

```bash
/plugin install video-production --marketplace applab-nl/claude-code-plugins
```

## Style library and gallery

The 123 styles come from Futurepedia's [AI Style Atlas](https://www.futurepedia.io/resources/ai-style-atlas/view). Their material (reference animations, drawing, stage and sound kits, prompt wording) is **not shipped in this plugin**. You build it once per machine into `~/.cache/video-production/styles` (or `$VIDEO_STYLES_HOME`):

```bash
cd <plugin>/skills/video-styles/scripts && npm install
# from an old explainer / 3d-explainer install (plugin cache) or a checkout from before v2.0.0:
node setup-styles.mjs --from-legacy ~/.claude/plugins
# or from prompts you copied from the Atlas site ("Copy prompt", one .txt per style):
node setup-styles.mjs --from-prompts ~/Downloads/atlas-prompts
node setup-styles.mjs --status
```

Setup ends by rendering two stills per style into the gallery page, `~/.cache/video-production/styles/gallery/index.html` (filter by 2D / 3D / Product UI and family, search, copy a style id). The plugin itself carries only its own code, the vendored three.js (MIT) and a catalog of the styles written in our own words.

## Requirements

- Node 18+ (or Bun) for the HyperFrames CLI, used pinned: `bunx hyperframes@0.8.228`
- `ffmpeg` / `ffprobe` for review frames, loudness and exports
- Python 3 with `numpy` for the caption, beat and audio scripts; `openai-whisper` or whisper.cpp for word timestamps
- Google Chrome with a working GPU for 3D styles (HyperFrames picks it up on its own; without one, 3D scenes are pre-rendered)
- `uv` for the Kokoro voice (`kokoro-onnx`, pinned); the ~350 MB model downloads once to `~/.cache/video-production/kokoro`, checked by SHA-256
- `FAL_KEY` and `pip install fal-client` only for `ai-footage` and ElevenLabs voice (paid calls)

## Usage

Ask naturally ("make a 30-second launch video for the new export feature", "add captions to this voiceover", "cut this for 9:16"). Scripts are referenced relative to each skill, for example:

```bash
S=<plugin>/skills
python $S/ai-footage/scripts/fal_run.py spent
uv run $S/voice-and-music/scripts/tts_kokoro.py script.txt --out vo/
python $S/voice-and-music/scripts/tts_check.py vo/ script.txt
node $S/video-styles/scripts/build-scene.mjs scenes/intro.style.js --id intro --project . --size 1080x1920
python3 -I $S/render-and-export/scripts/readcheck.py .
python $S/captions-on-the-beat/scripts/words.py vo.wav captions.json --script script.txt
$S/video-review/scripts/frames.sh out/film.mp4 out/review 0 1.2 3.5
$S/render-and-export/scripts/export.sh gif out/loop.mp4 out/loop.gif 720 25
```

## Notes

- Export the HyperFrames opt-outs before any CLI call (see `hyperframes-scene`): without them the CLI sends telemetry, self-updates and installs third-party skills into your agent home folders.
- Never run `hyperframes usage`, `auth`, `cloud` or `snapshot --describe`.
- Every paid fal call goes through `fal_run.py`, which logs spend and refuses to upload anything that isn't an image, video or audio file under the current directory.

## Migrating from explainer / 3d-explainer

v2.0.0 replaces both plugins. Uninstall them, install this one, and run `setup-styles.mjs --from-legacy ~/.claude/plugins` before their cache is cleared (or point it at a checkout from before the merge, e.g. `git worktree add /tmp/old-plugins 662793b`). The same requests still work: "an animated explainer in the watercolor style", "a 3D diorama video about X". Styled pieces are now HyperFrames scenes, so they get captions, voice, every channel ratio and the review gates, and can be mixed with UI scenes.

## License

MIT for the plugin's own code. three.js 0.187.0 is vendored in `skills/video-styles/assets/three.js` under the MIT License (`three.LICENSE`). The Kokoro-82M model (Apache-2.0) is downloaded on first use, not bundled. The AI Style Atlas material is Futurepedia's and is built locally from your own copies; it is not part of this repository.
