---
name: voice-and-music
description: Use when a video needs voiceover, character dialogue, a music bed or sound effects, made with ElevenLabs through fal, or when generated dialogue sounds fake and needs the "on set" treatment and a proper loudness mix.
---

# Voice and music

Sound is half of how a video feels, and AI audio fails in predictable ways: dead silence between words,
a bright "radio" sheen, every line at one level. This skill makes the voice, the score and the effects,
then mixes them so they sound recorded, not rendered. Paid calls go through `ai-footage/scripts/fal_run.py`
(price first, cap, ledger). The voice is the clock for a narrated film; for timing captions and cuts to
it, see `captions-on-the-beat`.

## What to make, and with what

All through fal with one `FAL_KEY`. Prices at the time of writing (Oct 2026); check current pricing.

| Job | fal endpoint (Oct 2026) | Input that matters | Price |
|---|---|---|---|
| Voiceover (TTS) | `fal-ai/elevenlabs/tts/eleven-v3` | `text`, `voice`, `stability: 0.5`, `language_code` | about $0.10 per 1,000 characters |
| One voice per character | `fal-ai/elevenlabs/voice-changer` | `audio_url`, `voice`, `remove_background_noise: true` | about $0.30 per minute, about $0.03 a line |
| Music bed | `elevenlabs/music/v2.5` | `prompt`, `music_length_ms`, `force_instrumental: true` | about $0.60 per minute |
| Sound effects | the ElevenLabs sound effects model on fal (look up the current id) | a short literal prompt, a duration | cents per effect |

## Voice

- **A human read is the source when delivery matters.** A phone recording of a real person reading along
  with the clip, 10 minutes for a dozen lines, beats any TTS on timing and intent. The voice changer keeps
  the delivery and swaps only the timbre. TTS is for placeholders and plain narration.
- **One voice per character, every line.** Native speech from video models drifts from shot to shot. Run
  every line of a character through the voice changer with the same voice id. `remove_background_noise`
  also strips the far-room echo some video models add.
- **Cast by age and role, not by "nice voice".** A narrator voice on a 50-year-old manager in a quarter-zip
  reads wrong at once. Audition 3 or 4 voices on the same line and have a human pick by ear.
- **A placeholder VO is fine to build against.** Time the edit to its word timings, then swap in the final
  read and re-time from its own transcript. Never keep hard-coded times from a voice you replaced.

## The "on set" chain for dialogue

We measured generated dialogue against a film whose office scenes sound recorded on set. The real one sat
at about -25.6 LUFS with 9 LU of range, kept 14 dB between speech and the quiet between words, and had
little energy at 4 to 8 kHz. Ours sat at -15 LUFS with every line flattened, dropped 50 to 73 dB into dead
silence between words, and was 3 to 9 dB too bright up top. So, per line, `scripts/onset.py`:

1. High-pass at 90 Hz.
2. No presence boost. Never add a 3 kHz lift to "make it clear".
3. A gentle shelf down, about -4 dB, above 7 kHz.
4. 2:1 compression, threshold about -24 dB, attack 8 ms, release 120 ms.
5. A short room reverb sized to the shot: RT60 0.4 to 0.7 s. Wide shots get more room and sit lower
   (`--wet -9 --dist 1.0`); close-ups stay dry and forward (`--wet -18 --dist 0`). A camera move inside a
   line gets keys (`--keys "0:-9:1.0,3.2:-15:0.2"`).
6. Room tone mixed inside each line at about -46 dB relative to speech (`--tone room.wav`), so silence
   is never digital zero. Keep a continuous room tone bed under every dialogue scene as well.

```bash
python scripts/onset.py boss-line-04.wav boss-line-04-set.wav --wet -10 --dist 0.6 --rt60 0.55 --tone office-tone.wav
```

When a voice-changed line has to match a shot's native audio, match its tone to that track over 150 Hz to
7 kHz only, with the difference clipped to 8 dB. Anything more is a filter, not a match.

## Music

- Prompt the feel and the tempo, not the subject: "tense minimal pulse building to a bright drop, 124 bpm,
  no vocals". Generate 2 or 3 and pick by ear.
- Generate longer than you need (60 s for a 30 s cut) and enter at a strong bar, not the quiet intro.
- To extend a bed, repeat whole bars: 4 bars at 124 bpm is `4 * 4 * 60 / 124 = 7.74 s`. Cut on bar lines
  only, and end with a 1 to 1.5 s fade under the end card.
- Under a voice, the bed sits around 0.3 to 0.4 volume before the drop and drops further under dense VO.
  A bed with its energy under 150 Hz is inaudible on a phone speaker.
- Only music you have the rights to. Generated or licensed. No label tracks.

## Sound effects

Every effect has a cause on screen: a click on a real cursor click, a pop on a badge or number landing,
a whoosh on a fast move or a cut, a soft tick on text arriving, one riser into the payoff. Place each so
its peak lands one frame after the picture. Keep hits 3 to 6 dB over the bed. Rotate 2 or 3 takes of any
repeated sound; the same whoosh on every cut is the most common tell. When the score is busy, drop the
small clicks.

## Levels and master

- **Dialogue stem around -23 LUFS, range kept.** One static gain on the whole stem
  (`scripts/loudness.sh gain dialogue.wav -23 dialogue-23.wav`). Never loudnorm each line: a yell and a
  mutter must not come out the same.
- **Master the whole film once, at the end, to -14 LUFS, true peak -1 dBTP**:
  `scripts/loudness.sh master film.mp4 -14 film-master.mp4`. It is a two-pass linear loudnorm, so it acts
  as gain, not a compressor. Run it after the last picture change.
- Check every stem for clipping before the mix; generated audio often clips. Measure the final with
  `scripts/loudness.sh measure`.
- You cannot hear the result from a terminal. Say in the delivery note that loudness was measured, and
  have a human listen once on headphones and once on a phone speaker.

## Done when

- Each character has one voice id across every line, and lips still match.
- Silence between words has room in it; no line sounds closer than its shot.
- Dialogue stem near -23 LUFS, master at -14 LUFS and -1 dBTP or lower, measured on the delivered file.
