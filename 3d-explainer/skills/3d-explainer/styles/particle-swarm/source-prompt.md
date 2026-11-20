I want a short 3D motion graphic made with three.js in the "Particle Swarm" style. Below is the complete source of a reference animation in this exact style, plus the small rendering kit and sound kit it runs on. Use them as your style guide and rebuild the animation around my content.

MY CONTENT:
[Describe your topic, or paste your script here. If this is left as is, ask me for it before building.]


STORYBOARD FIRST: before building the animation, make a VISUAL storyboard and wait for my OK.
- One HTML page (show it as an artifact if you can) with a grid of panels, one per beat (about 3-6). Each panel is a still of that beat's key frame, rendered with the STAGE kit from a block-out of the scene: simple forms in the reference's materials, lighting, camera angle and grade, so the panels already look like the finished piece. Render the stills one after another on one canvas with S.seek(time) at about 16 samples (enough for depth of field and soft shadows to read) and copy each into an image. Stills only, no animation or sound yet.
- Under each panel: the beat number, its start and end time, the exact on-screen text, what moves or changes to get there from the previous panel, what the camera does, and its key sounds.
- Below the grid, list any facts or numbers you had to assume.
When I approve it (or after my changes), build the full animation exactly as storyboarded, reusing the storyboard's scene code.

WHAT TO BUILD
One self-contained HTML file (show it as an artifact if you can):
- three.js 0.187.0 core only, loaded as an ES module from a CDN with an import map (no addons), then set window.THREE = THREE before running the kit and the style code.
- A 1920x1080 canvas scaled to fit the window, with a small control bar: play/pause, a scrub slider, the time, a sound toggle, loop on by default.
- A new style object, built the same way as the reference (content block first, then build(S) returning update(t)), that tells MY CONTENT in this style. 7-12 seconds unless my content needs more.
- Run it with the kit: const S = await K.run(canvas, style, { samples }). Use a low sample count (2-4) while playing live and the style's full count when rendering frames. Expose window.seek = (t) => S.seek(t) and window.DURATION.
- Play the style's sound(k) score in sync from the player: on play call stopSound = SOUND.live((k) => style.sound(k), currentT, { voiceover: false }), and call stopSound() on pause, on seek and when the sound toggle is turned off.
- Include the STAGE kit and the SOUND kit below unchanged.
- Load these Google Fonts before building (the kit awaits the specs in style.fonts): Inter

HOW TO STAY IN THE STYLE
- The reference shows the look, not the story. Its objects, layout and beats belong to its own topic: do not reuse them unless my content calls for them. Work out what my content needs to show first, then build those things in this look.
- Tell my content as an explainer, not a title card: things happen to objects or characters over three or four beats that follow from each other, and the picture does the telling. Words are small captions and labels, never the subject of a shot. End on the result of the process or the end of the story, not on a headline, slogan or logo.
- Keep the reference's materials, lighting, camera language, grade and the way things move. Change the story, the objects and the words; do not change the look.
- update(t) must set the whole scene for time t and nothing may build up between calls: the kit calls it many times per frame to make motion blur, depth of field and soft shadows. No Math.random, Date or timers; use K.rng(seed).
- Build everything in code: no downloaded models, images, HDRIs or textures.
- Simple forms, beautifully lit and finished, beat complicated models that look wrong. Draw my subject accurately and double-check any facts or numbers you show.
- It is video, often watched on a phone: keep every word the story needs large, sharp and on screen long enough to read, keep the subject filling most of the frame, and keep everything that matters inside the frame for the whole camera move. The first frame should already be worth looking at, and the last second should hold.

FLOW BETWEEN BEATS
- A new beat does not automatically mean a new scene. When the next idea builds on the last, stay in the same world: the things that matter stay on screen and move, grow, re-arrange or transform, and the camera travels to the part of the scene where the next idea happens.
- When the story really moves on (a new place or time, a before/after contrast, a reveal), change scene the way this look would: a turn of the set, a page, a passing object that wipes the frame, a change of light. No hard cuts.
- The reference's scene count is not a template: fit the number of beats to my content.

SOUND (no voiceover: a fuller mix)
- A sound starts on the exact frame its event appears: drive picture and sound from the same schedule, as the reference does.
- Score the events that land (things arriving, labels, contacts, transitions, the key number, the result) with sounds this material would make: glass, plastic, paper, metal, motors.
- A quiet ambience bed is welcome, and music only if it suits the style. Effects in front, bed and music clearly underneath, and small silences so the big hits read.


If you are Claude Code with a shell: render an MP4 in headless Chrome with the GPU enabled. Load the page, call window.seek(i / 30) for every frame, capture the canvas and pipe the frames into ffmpeg; render the sound with SOUND.renderOffline((k) => style.sound(k), DURATION, 48000, { voiceover: false }) and mux it in at about -15 LUFS. Look at a few rendered frames and fix framing, lighting or legibility problems before you call it done.

STYLE CARD
Name: Particle Swarm
Family: Flat content made physical
Use: explainer
Look: Sixty thousand tiny glass beads hanging in front of a matte paper wall. They pile into plump, rounded models of things (a seed, a drop, a cell, an organ, a heap) that fill most of the frame and throw a soft shadow on the wall, change colour and strain while they hold, then let go and fly on to the next formation.
Motion: Beads arrive as a stream, overshoot their place and settle. A formed shape never freezes: it breathes, a colour change can run through it as a front, loose beads inside it buzz like a gas, and it can swell and tremble. When it lets go, a front crosses it or it bursts from the centre: beads are thrown outwards, curl along a flow field in ribbons and veils, then land in the next shape, with a few stragglers arriving late.
Light: One soft, warm key from the upper left, like a window, so every bead has a lit side, a small glint and a shadow on its neighbours, and the whole shape drops a soft shadow on the wall. Warm fill from all round. Heat is shown as light: hot beads glow by themselves and an orange lamp comes up from below.
Materials: Polished glass seed beads, uneven in size and shade, each with a sharp highlight and a glow on its far side: golden corn, blue water, white steam, cream popcorn. Matte paper wall in a deep, dull teal that all of them stand out from.
Camera: Long lens with shallow focus on the shape, so beads that fly towards the camera go soft. One slow continuous dolly: close and a little to one side of the small first shape, drifting back and round to square-on while it changes, pulled back by the burst to hold the big last shape.
Finish: Real motion blur and depth of field from accumulation (96 sub-renders), neutral tone mapping to keep the colours true, a touch of bloom on the glints and the hot beads only, a soft vignette, almost no grain. Captions are a crisp 2D overlay.
Good for: Processes where stuff flows, gathers, splits, grows, heats up or bursts, and things that are made of many units (cells, molecules, people, grains, data points). The beads are the stuff itself: a beat is either a new formation the swarm flows into or a change that runs through a formation while it holds (it warms from one side, something inside it comes loose, it swells). Populations keep their colour and identity from start to finish, so the viewer can follow where each kind of thing ends up. One short caption per beat names what is happening; the beads never form words or numbers.

STAGE KIT (lib/stage.js)
[identical to the bundled assets/lib/stage.js]

SOUND KIT (lib/sound.js)
[identical to the bundled assets/lib/sound.js]

REFERENCE STYLE SOURCE (styles/particle-swarm.js; its sample topic was "Why popcorn pops")
[saved as reference.js]
