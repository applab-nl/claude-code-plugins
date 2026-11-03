// walkthrough-kit.js: camera, cursor, click, spotlight, tooltip and confetti for a product walkthrough.
// Paste into the scene's <script>. Assumes `tl` (paused GSAP timeline) and `rnd` (seeded mulberry32).
//
// Markup inside the stage (stage = the full frame of this walkthrough, W x H):
//   <div id="cam"> ...the app UI... </div>            transform-origin: 0 0; everything that zooms
//   <div id="spot"></div>                             fixed at screen center; box-shadow ring
//   <div id="tip"><b id="tipn">1</b><span id="tipt"></span></div>
//   <div id="ripple"></div>                           ring at screen center
//   <svg id="cursor">...</svg>                        outside #cam so it never scales
//
// #spot   { position:absolute; width:120px; height:120px; border-radius:50%;
//           left: CX-60px; top: CY-60px; box-shadow: 0 0 0 2400px rgba(19,18,16,0.22); }
// #ripple { position:absolute; width:60px; height:60px; border-radius:50%; border:3px solid #3B5BFD;
//           left: CX-30px; top: CY-30px; }

const CX = 420, CY = 324; // screen center of the stage: the point every target is brought to

// Frame 0 state for everything the walkthrough touches. Call first; add your own UI resets here too.
function initWalkthrough(cursorStart = [560, 560]) {
  tl.set("#cam", { scale: 1, x: 0, y: 0 }, 0);
  tl.set(["#spot", "#tip", "#ripple"], { opacity: 0 }, 0);
  tl.set("#cursor", { x: cursorStart[0], y: cursorStart[1], scale: 1 }, 0);
}

// Center point p = [px, py] (in un-zoomed #cam coordinates) on the screen at scale s.
// With transform-origin 0 0: screen = cam_xy + p * s, so cam x = CX - px*s, y = CY - py*s.
function zoomTo(p, s, at, dur = 0.7) {
  tl.to("#cam", { scale: s, x: CX - p[0] * s, y: CY - p[1] * s, duration: dur, ease: "power3.inOut" }, at);
}

// Cursor travel. Ends on CX, CY when the camera is bringing the target there on the same timing.
function moveCursor(x, y, at, dur = 0.7) {
  tl.to("#cursor", { x, y, duration: dur, ease: "power3.inOut" }, at);
}

// A click: cursor presses (0.08 s down, 0.08 s up), one ripple ring, the target reacts 0.05 s later.
function click(at) {
  tl.to("#cursor", { scale: 0.85, duration: 0.08, yoyo: true, repeat: 1, transformOrigin: "10% 5%" }, at);
  tl.fromTo("#ripple", { scale: 0.4, opacity: 0.6 }, { scale: 2.2, opacity: 0, duration: 0.45, ease: "power2.out", immediateRender: false }, at);
  return at + 0.05; // time for the state change
}

// Numbered tooltip step with spotlight. Hide both before the next zoom starts.
function step(n, text, at, tipX, tipY) {
  tl.set("#tipn", { textContent: String(n) }, at);
  tl.set("#tipt", { textContent: text }, at);
  tl.to("#spot", { opacity: 1, duration: 0.3 }, at);
  tl.fromTo("#tip", { opacity: 0, scale: 0.6, x: tipX, y: tipY }, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)", immediateRender: false }, at + 0.05);
}
function endStep(at) {
  tl.to(["#spot", "#tip"], { opacity: 0, duration: 0.2 }, at);
}

// Seeded confetti burst from (x, y). Same pieces, same paths, every render.
function confetti(parent, x, y, at, count = 46, colors = ["#E8612C", "#3B5BFD", "#FFD23F", "#2EB67D", "#FF5FA2", "#36C5F0"]) {
  for (let i = 0; i < count; i++) {
    const c = document.createElement("div");
    c.style.cssText = `position:absolute;left:0;top:0;width:12px;height:18px;border-radius:3px;background:${colors[i % colors.length]}`;
    parent.appendChild(c);
    const ang = rnd() * Math.PI * 2, sp = 140 + rnd() * 260;
    const x1 = x + Math.cos(ang) * sp, y1 = y + Math.sin(ang) * sp * 0.8 - 120;
    tl.set(c, { x, y, opacity: 0, rotation: 0 }, 0);
    tl.set(c, { opacity: 1 }, at);
    tl.to(c, { x: x1, y: y1, rotation: rnd() * 720 - 360, duration: 0.7, ease: "power3.out" }, at);
    tl.to(c, { y: y1 + 200 + rnd() * 200, opacity: 0, duration: 1.1, ease: "power1.in" }, at + 0.7);
  }
}
