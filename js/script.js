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
  var root = document.documentElement, ticking = false;
  var START = -0.2, LENGTH = 1.05; // in screen heights: wait 0.8 screens, then align over the next 1.5
  function update() {
    var vh = window.innerHeight;
    var t = Math.min(1, Math.max(0, 1 - (window.scrollY - START * vh) / (LENGTH * vh)));
    root.style.setProperty("--t", t.toFixed(3));
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
})();