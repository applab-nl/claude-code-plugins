// stage-kit.js: helpers for product UI rebuilt in code. Paste into a scene's <script> before the tweens.
// Assumes `tl` is the scene's paused GSAP timeline.

// 1. Fit a 2x "full screen" stage into its window. Markup:
//    <div class="win"><div class="body"><div class="stage" data-fit="contain" style="width:1240px;height:580px">...</div></div></div>
//    .stage { position:absolute; left:0; top:0; transform-origin:0 0; overflow:hidden; }
//    The script owns .stage's transform: GSAP animates children of .stage, never .stage itself.
function fitStages(root = document) {
  root.querySelectorAll(".stage").forEach((st) => {
    const body = st.parentElement;
    const W = parseFloat(st.style.width), H = parseFloat(st.style.height);
    const bw = body.clientWidth, bh = body.clientHeight;
    const k = st.dataset.fit === "cover" ? Math.max(bw / W, bh / H) : Math.min(bw / W, bh / H);
    st.style.transform = `translate(${(bw - W * k) / 2}px, ${(bh - H * k) / 2}px) scale(${k})`;
    // Paint the window body with the stage background so "contain" letterboxing is invisible.
    const cs = getComputedStyle(st);
    body.style.background = cs.backgroundImage !== "none" ? cs.backgroundImage : cs.backgroundColor;
  });
}

// 2. A number that counts. Text is a pure function of the tween value, never an incrementing variable.
function counter(node, from, to, at, dur, fmt = (v) => Math.round(v).toLocaleString("en-US"), ease = "power2.out") {
  const o = { v: from };
  tl.to(o, { v: to, duration: dur, ease, onUpdate: () => { node.textContent = fmt(o.v); } }, at);
}

// 3. Line draw. Prefer the clip rect for charts (line + area reveal together):
//    <clipPath id="cp"><rect id="cpr" x="0" y="0" width="0" height="230"/></clipPath>
//    tl.to("#cpr", { attr: { width: 540 }, duration: 2.2, ease: "power2.inOut" }, 0.2);
// For a single stroke, normalize its length and tween the ATTRIBUTE (the CSS property snaps in capture):
function drawStroke(el, at, dur = 0.35, ease = "power2.out") {
  el.setAttribute("pathLength", 1);
  el.setAttribute("stroke-dasharray", 1);
  el.setAttribute("stroke-dashoffset", 1);
  tl.to(el, { attr: { "stroke-dashoffset": 0 }, duration: dur, ease }, at);
}

// 4. A feed that scrolls one row at a time and flashes the new row.
function scrollFeed(col, rowH, steps, start, every, flash = "rgba(59,91,253,0.16)") {
  const rows = col.children, visible = Math.floor(col.parentElement.clientHeight / rowH);
  for (let i = 0; i < steps; i++) {
    const at = start + i * every;
    tl.to(col, { y: -rowH * (i + 1), duration: 0.45, ease: "back.out(1.4)" }, at);
    const row = rows[i + visible];
    if (row) tl.fromTo(row, { backgroundColor: flash }, { backgroundColor: "rgba(0,0,0,0)", duration: 0.9, immediateRender: false }, at + 0.1);
  }
}
