I want a short 3D motion graphic made with three.js in the "Painted" style. Below is the complete source of a reference animation in this exact style, plus the small rendering kit and sound kit it runs on. Use them as your style guide and rebuild the animation around my content.

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
- Load these Google Fonts before building (the kit awaits the specs in style.fonts): Caveat

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
Name: Painted
Family: Filters over 3D
Use: story
Look: A filter, not a set: any lit 3D scene comes out as an oil painting on canvas, with thick directional brush dabs, broken colour, ridges of paint that catch a raking light, linen weave showing through the thin darks and a ragged unpainted edge. Here it carries a golden-hour countryside: a wheat field, a windmill, a bakery cottage.
Motion: Things happen inside the painting and each one causes the next: a gust runs through the wheat as a wave of bent stalks, reaches the sails and spins them up, the millstone turns with them, flour pours into a sack and puffs, a loaf is slid onto a sill. Brush dabs are fixed to the things they describe, so they travel with stalks, sails and sacks instead of boiling; the canvas weave stays still. Each caption is brushed on in under half a second when its beat starts and stays until the next one.
Light: One low golden sun from behind and to the side, long shadows, cool blue-violet sky light in every shadow, and small warm lamps (a doorway, a window, a lantern) wherever the story needs the eye. Warm light against cool shadow is the whole palette.
Materials: Rough simple shapes with no detail of their own, each big enough to survive a brush nine pixels wide. Every surface carries a field of brush dabs that varies its colour, tilts its shading and adds bristle streaks; the painterly filter turns that into strokes.
Camera: One continuous shot at walking height, like a picture book without page turns: it travels with the wind from the field toward the mill, cranes down to the door and drifts slowly across it while the stone works, then glides after the flour dust along the track and pushes in on the window sill, where it stops and holds on the thing that was made. Everything sharp, like a canvas. Each stop is composed like a painting, with the subject large in frame.
Finish: Anisotropic Kuwahara brush filter, then a paint-relief and canvas-weave pass lit from the upper left, which also letters the caption on a bare corner of the linen. Soft bloom on the sun and the lamps before the filter, so the glow is painted too. No grain, no vignette.
Good for: Stories, journeys and processes that happen in a place, told as a picture book: how something is made, where something comes from, a day in a life, a chain of cause and effect. Each beat is one stop in the landscape where one thing visibly happens and sets off the next; something that travels (wind, a road, a river, a character) leads the camera from stop to stop; one short caption per beat sits in the bare corner of the canvas and names what is happening. The filter carries any 3D scene, so the world can be a farm, a city, a workshop or a room, as long as each subject is a big simple shape.

STAGE KIT (lib/stage.js)
[identical to the bundled assets/lib/stage.js]

SOUND KIT (lib/sound.js)
[identical to the bundled assets/lib/sound.js]

REFERENCE STYLE SOURCE (styles/painted.js; its sample topic was "From wind to bread: a gust crosses a wheat field and turns the windmill, the millstone grinds flour, and a loaf ends up on the bakery sill")
[saved as reference.js]
