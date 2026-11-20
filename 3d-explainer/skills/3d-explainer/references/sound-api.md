# SOUND kit API (assets/lib/sound.js)

Synthesized Web Audio, no files. `style.sound(k)` schedules the whole score with times in seconds on the piece's
clock; the same function drives live playback (`SOUND.live`) and the offline render (`SOUND.renderOffline`), and
randomness is seeded, so every render is identical. This skill always plays the full mix (`voiceover: false`).

## Scheduling

| Call | Use |
|---|---|
| `k.play(name, t, { gain, pan, f, dur, ...})` | a named sound (below). `gain` scales it, `pan` -1..1 |
| `k.bed(name, t0, t1, { gain })` | continuous ambience on the amb bus, faded in/out: `room` `hiss` `hum` `rain` `projector` `vinyl` |
| `k.music(name, t0, t1, { bpm, chords, gain })` | light music on the music bus: `pad` (sustained chords), `pulse` (pad + kick/hat/bass), `chip` (8-bit arpeggio). `chords` = one note array per bar, cycled |
| `k.tone(t, { f, type, dur, gain, a, hold, pan, verb, bus, filter, f2, q, detune })` | raw oscillator. `f` a number, a note (`'C#5'`) or a sweep `[[dt, hz], ...]` |
| `k.noise(t, { dur, color, filter, f, q, gain, a, hold, pan, verb, bus, rate })` | raw noise: `color` white/pink/brown; `f` may sweep |
| `k.withMinor(() => {...})` / `{ minor: true }` | marks detail sounds (only matters in voiceover mode) |
| `k.hz('A4')` | note → Hz |

Buses: sfx 0.85, amb 0.5, music 0.45 → compressor → master. `verb: 0..1` sends to a shared room reverb.

## Named sounds

| Group | Sounds | Typical use |
|---|---|---|
| UI / motion | `pop` `tick` `click` `tock` `blip` `count` | things appearing, labels, small contacts, counters (`f` pitches them) |
| Moves | `whoosh` `swish` `riser` | transitions, wipes, sign flips, build-ups (`dur`) |
| Hits | `thud` `impact` `stamp` `press` `slap` | landings, doors shutting, approvals |
| Results | `ding` `success` `bell` `sparkle` | a stage done, the final result (`f` a note) |
| Problems | `error` `buzz` `glitch` | failures, rejections |
| Hand-made | `stroke` (`material`: marker chalk pencil pen brush sharpie) `paper` `tape` `roller` `erase` | drawing, paper, conveyors, rolling doors |
| Machines | `key` `typing` (`n`, `rate`) `typebar` `boot` `crtOn` `neon` `shutter` | screens, keyboards, lights flickering on |
| Chip | `coin` `jump` `hurt` `powerup` `select` `text` | 8-bit styles only |

## Scoring habits (from the reference)

- Keep one schedule object `T` at the top of the style; `update(t)` and `sound(k)` both read it, so a sound starts on
  the exact frame its event appears.
- One small sound per contact; pan it to where it happens on screen (left of frame ≈ -0.4, right ≈ +0.4).
- Repeated "stage done" moments ring a rising chord (C6, E6, G6), with `success` on the last.
- A bed (`room`, gain ~0.7) and a quiet `pad` underneath; effects clearly in front; leave small silences before big hits.
- A continuous machine (an engine, a motor) is a `k.tone` sawtooth through a lowpass with a frequency sweep that
  follows the motion (climb, cruise, come down), plus a brown-noise layer.
