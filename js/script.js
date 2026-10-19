window.lenis = null;
(function () {
  if (!window.Lenis || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  window.lenis = new Lenis({ lerp: 0.1 }); // lower = floatier (try 0.06), higher = tighter (try 0.15)
  function raf(t) { window.lenis.raf(t); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
})();
(function () {
  var btn = document.getElementById("menu-btn");
  var menu = document.getElementById("menu");
    function setOpen(open) {
    menu.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("menu-open", open);
    if (window.lenis) open ? window.lenis.stop() : window.lenis.start();   /* add */
  }
  btn.addEventListener("click", function () { setOpen(menu.hidden); });
  menu.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { setOpen(false); btn.focus(); } });
})();
(function () {
  var root = document.documentElement, grid = document.querySelector(".grid"), ticking = false;
  var FROM = 1.75, TO = 0.5; // screen heights: starts when the grid bottom enters the screen, done when it reaches 55% down
  function update() {
    var bottom = grid.getBoundingClientRect().bottom / window.innerHeight;
    var t = Math.min(1, Math.max(0, (bottom - TO) / (FROM - TO)));
    root.style.setProperty("--t", t.toFixed(3));
    ticking = false;
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener("scroll", req, { passive: true });
  window.addEventListener("resize", req);
  update();
})();
(function () {
  var panel = document.querySelector(".panel");
  var NS = "http://www.w3.org/2000/svg";
  var svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "rays");
  svg.setAttribute("aria-hidden", "true");
  panel.prepend(svg);

  var GAP = 25; // px between lines along the edge
  function draw() {
    var w = panel.clientWidth, h = panel.clientHeight;
    var cx = w / 2, cy = h / 2, len = Math.min(w, h) * 0.6, per = 2 * (w + h), out = "";
    for (var d = GAP / 2; d < per; d += GAP) {
      var x, y;
      if (d < w) { x = d; y = 0; }
      else if (d < w + h) { x = w; y = d - w; }
      else if (d < 2 * w + h) { x = w - (d - w - h); y = h; }
      else { x = 0; y = h - (d - 2 * w - h); }
      var dx = cx - x, dy = cy - y, m = Math.hypot(dx, dy);
      out += '<line x1="' + x.toFixed(1) + '" y1="' + y.toFixed(1) +
             '" x2="' + (x + dx / m * len).toFixed(1) + '" y2="' + (y + dy / m * len).toFixed(1) + '"/>';
    }
    svg.innerHTML = out;
  }
  draw();
  new ResizeObserver(draw).observe(panel);
})();