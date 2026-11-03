# Video Production

Skills for making launch videos, feature drops, product walkthroughs and social clips **in code**, with [HyperFrames](https://www.npmjs.com/package/hyperframes) (HTML + GSAP rendered to video). Every frame is reproducible, every number on screen can move, and nothing ships before someone has looked at every cut.

## Skills

The skills follow the order a video gets made in:

| Skill | Use it when |
|-------|-------------|
| `video-brief` | Before anything is built: a one-page brief (one line, audience, length, aspect ratios, beats with second marks, shown vs said) that gets approved first |
| `hyperframes-scene` | Writing or editing a scene, setting up a project, or debugging a render that flickers, freezes or differs between runs |
| `motion-system` | Choosing eases, durations, staggers, kinetic type and camera moves, or when a draft "looks generated" or "feels like slides" |
| `product-ui-recreation` | The video needs product screens: rebuild them in HTML instead of dropping in a screenshot |
| `walkthrough-video` | Cursor-driven demos: cursor paths, clicks, zoom punch-ins, spotlight, numbered steps, the loop reset |
| `ai-footage` | Generated live-action or character shots via fal: still-first workflow, model per shot, spend logging, rerolls |
| `voice-and-music` | Voiceover, dialogue, music beds and SFX via ElevenLabs on fal, plus the "on set" treatment and a loudness mix |
| `captions-on-the-beat` | Word-timed captions from the voice track, and cuts that land on the music's beat grid |
| `video-review` | The eyes-on gate before showing anything: snapshot beats and cuts, run the defect checklist, write `REVIEW.md` |
| `render-and-export` | Final render, per-channel cuts (16:9, 9:16, 1:1, 4:5), loop rotation, MP4/GIF/poster exports, batch renders |

## Installation

```bash
/plugin install video-production --marketplace applab-nl/claude-code-plugins
```

## Requirements

- Node 18+ (or Bun) for the HyperFrames CLI, used pinned: `bunx hyperframes@0.8.228`
- `ffmpeg` / `ffprobe` for review frames, loudness and exports
- Python 3 with `numpy` for the caption, beat and audio scripts; `openai-whisper` or whisper.cpp for word timestamps
- `FAL_KEY` and `pip install fal-client` only for `ai-footage` and `voice-and-music` (paid calls)

## Usage

Ask naturally ("make a 30-second launch video for the new export feature", "add captions to this voiceover", "cut this for 9:16"). Scripts are referenced relative to each skill, for example:

```bash
S=<plugin>/skills
python $S/ai-footage/scripts/fal_run.py spent
python $S/captions-on-the-beat/scripts/words.py vo.wav captions.json --script script.txt
$S/video-review/scripts/frames.sh out/film.mp4 out/review 0 1.2 3.5
$S/render-and-export/scripts/export.sh gif out/loop.mp4 out/loop.gif 720 25
```

## Notes

- Export the HyperFrames opt-outs before any CLI call (see `hyperframes-scene`): without them the CLI sends telemetry, self-updates and installs third-party skills into your agent home folders.
- Never run `hyperframes usage`, `auth`, `cloud` or `snapshot --describe`.
- Every paid fal call goes through `fal_run.py`, which logs spend and refuses to upload anything that isn't an image, video or audio file under the current directory.

## License

MIT
