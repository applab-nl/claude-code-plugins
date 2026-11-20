## ADDED Requirements

### Requirement: Style selection
The skill SHALL resolve the user's style to exactly one of the 86 bundled styles before building anything.

#### Scenario: Style named directly
- **WHEN** the user names a style by its name or styleId (case-insensitive, punctuation ignored)
- **THEN** the skill loads only that style's file from `assets/styles/`

#### Scenario: Style described, not named
- **WHEN** the user describes a look or mood instead of naming a style
- **THEN** the skill reads `references/catalog.md`, proposes three matching styles with their one-line looks, and waits for a choice

#### Scenario: Unknown style name
- **WHEN** the name matches no style
- **THEN** the skill offers the closest catalog matches instead of guessing

### Requirement: Content and options intake
The skill SHALL collect the content and the storyboard and voiceover options before building, with storyboard on and voiceover off by default.

#### Scenario: No content given
- **WHEN** the user has not supplied a topic or script
- **THEN** the skill asks for it before building

#### Scenario: Voiceover requested without timing
- **WHEN** voiceover is on and no SRT or word timestamps are given
- **THEN** the skill transcribes an attached audio file with word-level timestamps if it can, and otherwise asks for the timing

### Requirement: Storyboard approval gate
When storyboard is on, the skill SHALL produce a visual storyboard and stop until the user approves it.

#### Scenario: Storyboard shown
- **WHEN** storyboard is on
- **THEN** the skill produces one HTML page of 6–10 still canvas panels drawn with the style's own functions, each labelled with beat number, times, on-screen text, transition and key sounds, plus a list of assumed facts, and ends its turn

#### Scenario: Approval
- **WHEN** the user approves or amends the storyboard
- **THEN** the skill builds the animation as storyboarded, reusing the storyboard's drawing code

### Requirement: Animation build
The skill SHALL build one self-contained HTML file that follows `references/build-rules.md` for the chosen options.

#### Scenario: Required interface
- **WHEN** the animation is built
- **THEN** it has a letterboxed 1280x720 canvas, play/pause, scrub, time, a sound toggle, loop on by default, `explainer(ctx, W, H_, t)`, `scoreSound(k)`, a `DURATION` constant and `window.seek`, `window.DURATION` and `window.scoreSound`

#### Scenario: Shared libraries copied in unchanged
- **WHEN** the HTML is assembled
- **THEN** `lib/harness.js` and `lib/sound.js` are copied in byte-for-byte from the plugin's assets

#### Scenario: Deterministic frames
- **WHEN** a frame is drawn for time t
- **THEN** all randomness comes from `H.rng(seed)` / `H.makeNoise(seed)` and the same t always gives the same frame

#### Scenario: Voiceover mode
- **WHEN** voiceover is on
- **THEN** the build uses a BEATS table from the timing, a "Load voiceover" control that drives the clock once a file is loaded, `{ voiceover: true }` for sound, and `DURATION` = last line end + ~1 s

### Requirement: MP4 render
The skill SHALL offer to render an MP4 with the bundled `scripts/render.mjs` when a shell is available.

#### Scenario: Dependencies missing
- **WHEN** Node, puppeteer or ffmpeg is unavailable
- **THEN** the script stops before rendering and reports what to install

#### Scenario: Render with voiceover
- **WHEN** a voiceover audio file is supplied
- **THEN** the script mixes it with the offline effects WAV using the loudnorm/sidechain chain from the build rules

### Requirement: Asset generator integrity
The repo-only generator SHALL rebuild the plugin's assets from copied prompts and refuse inputs that don't fit the known structure.

#### Scenario: Shared parts differ
- **WHEN** any copied prompt's harness, sound kit or normalised build rules differ from the known variants
- **THEN** the generator exits non-zero and names the styles and sections that differ

#### Scenario: Clean regeneration
- **WHEN** run on the 86 captured prompts
- **THEN** it writes 86 style files, both libraries and `catalog.md`, and a second run produces no diff
