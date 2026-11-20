I want a short 3D motion graphic made with three.js in the "LED Wall" style. Below is the complete source of a reference animation in this exact style, plus the small rendering kit and sound kit it runs on. Use them as your style guide and rebuild the animation around my content.

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

HOW TO STAY IN THE STYLE
- The reference shows the look, not the story. Its objects, layout and beats belong to its own topic: do not reuse them unless my content calls for them. Work out what my content needs to show first, then build those things in this look.
- Tell my content as a story, not a title card: things happen to objects or characters over three or four beats that follow from each other, and the picture does the telling. Words are small captions and labels, never the subject of a shot. End on the result of the process or the end of the story, not on a headline, slogan or logo.
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
Name: LED Wall
Family: Flat content made physical
Use: story
Look: A giant outdoor screen made of real lamps: thousands of frosted round LEDs in black louvred cabinets on a steel gantry at night. From far away it is a crisp bright picture; close up it falls apart into single glowing lamps, each with a red, a green and a blue chip under its lens.
Motion: The wall plays pixel animation at one pixel per lamp and 30 pictures a second: characters built from a few flat colours with a dark outline walk, run, stop and react in real cycles, the ground scrolls under them lamp by lamp with slower hills behind, and one short caption per beat pushes up into a ticker strip along the bottom. The camera does the opposite of the content: one slow continuous pull from a single lamp to the whole wall, still drifting at the end.
Light: The wall is the light. Its own colours spill onto the louvres and the black plastic between the lamps, glow in the haze around it, tint the steel and paint the wet ground, and all of it changes when the picture changes. One cold floodlight from behind gives the steel a rim; everything else is night.
Materials: Frosted dome lenses in black collars, satin black louvres and cabinet faces with seams and screws, galvanised lattice steel, rubber cable, wet tarmac with dry patches and a painted line.
Camera: Long lens. Starts as a macro shot at a low angle across the lamps with very shallow focus, pulls back and swings round to face the wall while the story waits on its opening pose, has the wall in frame by the time the first story event happens, and then keeps drifting back and across, low over the wet ground, to the last frame.
Finish: Soft bloom from the lamps, true-colour (neutral) tone mapping so the LED colours stay saturated, light vignette, very little grain. No scanline or pixel filters: the dots are real geometry.
Good for: Any 2D animation, diagram or story that can be drawn at lamp resolution: a fable with two characters, a process with parts that move along a track, a chart that grows, a map with a route, a game-like sequence. Draw it on a small canvas with one pixel per lamp. A beat is something happening in that picture (a character sets off, stops, is overtaken, arrives); a label is one short dot-font line in the ticker strip; what moves is the pixel picture, while the wall, its housing and the light it throws stay the same and take their colour from whatever is playing.

STAGE KIT (lib/stage.js)
[identical to the bundled assets/lib/stage.js]

SOUND KIT (lib/sound.js)
[identical to the bundled assets/lib/sound.js]

REFERENCE STYLE SOURCE (styles/led-wall.js; its sample topic was "The Tortoise and the Hare, as a pixel cartoon playing on the lamp wall")
[saved as reference.js]
