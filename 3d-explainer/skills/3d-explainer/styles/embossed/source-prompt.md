I want a short 3D motion graphic made with three.js in the "Embossed" style. Below is the complete source of a reference animation in this exact style, plus the small rendering kit and sound kit it runs on. Use them as your style guide and rebuild the animation around my content.

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
- Load these Google Fonts before building (the kit awaits the specs in style.fonts): Fraunces

HOW TO STAY IN THE STYLE
- The reference shows the look, not the story. Its objects, layout and beats belong to its own topic: do not reuse them unless my content calls for them. Work out what my content needs to show first, then build those things in this look.
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
Name: Embossed
Family: Flat content made physical
Use: title
Look: Words and one small mark pressed into thick cotton paper and filmed in macro: grey-blue letterpress sunk deep enough to see the walls of the impression and the shadow inside it, a ruler scale embossed blind (raised, no ink), and a copper foil stamp, on a deckle-edged sheet lying on a dark press bed.
Motion: You watch it being made. A brass plate with the type standing up in mirror image swings down, squeezes the sheet and lifts to show the impression; a ribbon of foil is laid over one spot, a heated die on a lever arm stamps it, and the spent foil is peeled back to leave the metal mark.
Light: One low, hard raking lamp from the side, so every impression has a bright far wall and a shadow inside, with dim warm fill. The lamp slides round at the end so the relief turns, and a glint runs across the foil.
Materials: Toothy cream cotton paper that is smoother where it was compressed, ink lying on the floor of the impression with bare paper walls and small bare specks, mirror-bright copper foil, etched brass with wet ink on the type, grey steel.
Camera: A long lens with shallow focus, one continuous move: low against the open plate, down with its edge to the paper, then a slow pass a few letters wide just above the sheet that arrives at the foil work, then up and back until the whole card fills the frame.
Finish: Real depth of field and motion blur, soft bloom only on the foil and brass glints, filmic contrast, a gentle vignette and fine grain.
Good for: Any quote, name, number or simple logo: it is drawn flat on a canvas and pressed into the material, so the statement arrives as a finished, tactile object. Best for one line that should feel permanent, with one small mark picked out in foil.

STAGE KIT (lib/stage.js)
[identical to the bundled assets/lib/stage.js]

SOUND KIT (lib/sound.js)
[identical to the bundled assets/lib/sound.js]

REFERENCE STYLE SOURCE (styles/embossed.js; its sample topic was "The saying "Measure twice, cut once." letterpressed into paper, with a foil-stamped carpenter's square")
[saved as reference.js]
