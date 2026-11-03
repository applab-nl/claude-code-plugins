---
name: ai-footage
description: Use when a video needs generated live-action or character footage (people, offices, crowds, cinematic shots) made with AI video models through fal. Covers the still-first workflow, model choice per shot, spend logging, rerolls, character consistency and upscaling.
---

# AI footage

Generated footage is the most expensive and the least predictable part of a video made from code. Type,
UI and titles belong in HyperFrames (`hyperframes-scene`, `motion-system`). Use AI footage only for what
code cannot draw: people, rooms, weather, crowds, real light. Plan the shot list in `video-brief` first.
Never generate a shot that is not on an approved list.

## The pipeline, in order

1. **Script and shot list, approved by a human.** Every shot: what we see, camera, length, line of dialogue.
2. **Style frames, still first.** Generate 3 to 4 stills per shot with Nano Banana Pro at 2K. A human
   picks one. 4K stills bill double and look too smooth; 2K reads more like film.
3. **Previs (optional, worth it from about 8 shots up).** Have Claude drive Blender to block each shot
   with grey boxes: camera height, lens, where people stand. Export a still per shot and feed it to the
   style frame call as the layout reference ("replace every grey shape with real people, real light").
   This is what stops rerolling a shot because the camera was in the wrong place.
4. **Image-to-video only.** Animate the picked still. Text-to-video looks generic and wanders off the
   look; teams that tried it on paid work lost days to it. The prompt for the video call describes
   motion only (who moves, how the camera moves), not the scene again.
5. **Edit, grade, sound** in HyperFrames: one LUT and one grain layer over every AI clip so shots from
   different models match. Finish at 24 fps to match the models' native rate.
6. **Upscale last**, only the takes that made the cut: Topaz Proteus 2x on the 720p picks.

## Which model for what

All of these run through fal with one `FAL_KEY`. Prices at the time of writing (Oct 2026), from the
vendors' and fal's price pages. They move weekly: check current pricing before you budget.

| Shot | Model | fal endpoint (Oct 2026) | Price |
|---|---|---|---|
| Style frames | Nano Banana Pro | `fal-ai/nano-banana-pro/edit` (with refs), `fal-ai/nano-banana-pro` | about $0.15 per 2K image |
| Talking characters, native speech, lip sync | Seedance 2.5 | `bytedance/seedance-2.5/us/image-to-video` | about $0.57/s 720p, $1.40/s 1080p |
| Crowds, many people, multi-scene | Wan 3.0 | `alibaba/wan-3.0/image-to-video` | $0.10/s 720p, $0.20/s 1080p |
| Live-action cinematic, no dialogue | FLUX 3 Max | `blackforestlabs/flux-3-max/image-to-video` | $0.17/s HD |
| Hero shots made by hand | Kling 4.0 | in its own app; check your provider for an API | per plan |
| Upscale | Topaz Proteus 2x | `fal-ai/topaz/upscale/video` | cents per short clip |
| Fix a mouth to a new voice | sync lipsync-2-pro | `fal-ai/sync-lipsync/v2` | about $0.60 per line |

Input keys differ per endpoint: Seedance and FLUX take `image_url`, Wan takes `start_image_url`.
Seedance and Wan want `duration` as a string ("5"). Seedance bills by tokens
(`width * height * fps * seconds / 1024` at $0.0214 per 1000 at the time of writing), so 1080p costs
2.25x 720p, not 2x. Read each endpoint's schema on fal before the first call.

## Spend: price, cap, log

Every paid call goes through `scripts/fal_run.py`:

```bash
export VIDEO_CAP_USD=150 VIDEO_LEDGER=media/spend.jsonl
python scripts/fal_run.py bytedance/seedance-2.5/us/image-to-video --usd 2.85 --args shot-04.json --kind video --out media/takes/shot-04
python scripts/fal_run.py spent
```

- It writes a `start` row before the call and a `done` or `failed` row after. A start with no end counts
  as spent: a timeout may still have billed. Check the fal dashboard before you retry.
- It refuses any call that would pass the cap. Raising the cap is a human decision, written down.
- Result URLs are logged before download. Large PNGs and MP4s truncate now and then; re-fetch from the log.
- Price every call yourself first. Do not trust a tool that says "don't estimate".

**Budget for the yield.** Expect 5 to 25% of takes to be usable. A 5 s Seedance shot at 720p is about
$2.85 a take, so plan 4 to 8 takes per shot. Real cost for finished film runs about $500 to $1,000 per
100 s once rerolls are counted. A 30 s film with 10 shots: budget $150 to $300, not $30.

Reroll rules: change one thing per reroll (seed, or one motion phrase). After 4 failed takes on a shot,
change the still or the shot, not the prompt again.

## Characters that stay the same person

- One reference sheet per character: front, three-quarter, the outfit. Pass it as `image_urls` to every
  style frame call for that character.
- The same wardrobe words in every prompt ("charcoal quarter-zip, grey at the temples").
- One voice per character. Native model speech drifts between shots; run every line through the voice
  changer to one voice id (`voice-and-music`).
- Lip sync only when a new read drifts from the mouth. On a short line, the original mouth with the voice
  fitted to it often beats a lip-synced one. Compare both.
- For lip sync, the audio must already be the clip's length with the line placed where the mouth moves.

## Real faces

Generated characters only. Seedance and Gemini models block real faces, and you need a person's written
consent to put their likeness in a video anyway. No celebrities, no employees, no customers.

## Slop markers: reject a take that shows any of these

- Objects that change between shots: the mug, the laptop logo, the hair part, the number of chairs.
- Uncanny robots or mascots. A humanoid robot on screen reads as AI stock in a second.
- Montage with no story: pretty shots that do not cause each other.
- Dialogue in every shot. Mix in reaction shots and silence.
- The audio echo some models add to native speech (Seedance does it). Strip it or re-voice.
- Plastic skin and identical faces. Ask for pores, creases, varied ages, no airbrushing.
- Hands near faces, text on screens and signs. Cover generated screens with real UI in post.

## Done when

- Every shot in the cut is a picked still animated image-to-video, upscaled, graded with the shared LUT.
- `spend.jsonl` sums to what the fal dashboard shows, give or take one in-flight call.
- No take in the cut shows a slop marker. `video-review` passed on the whole film.
