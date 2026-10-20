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
  var img = document.querySelector(".portrait");
  if (!img || img.tagName !== "IMG") return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var HEIGHT_SRC = "images/portraitHeight.png";
var STRENGTH = -0.0125;
var FOCUS    = 0.8;
var SMOOTH   = 0.08;
var Y_SCALE  = 0.5;
var ANCHOR   = 0.1;
var TEXT_SHIFT = 2;

  var VS = "attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}";
var FS = "precision highp float;varying vec2 v;" +
  "uniform sampler2D uColor,uHeight;uniform vec2 uMouse,uSize;uniform float uS,uF;" +
  // bilinear filtering done by hand, on premultiplied values
  "vec4 pm(vec2 uv){" +
  "  vec2 p=uv*uSize-.5;vec2 i=floor(p);vec2 f=p-i;" +
  "  vec4 a=texture2D(uColor,(i+vec2(.5,.5))/uSize);" +
  "  vec4 b=texture2D(uColor,(i+vec2(1.5,.5))/uSize);" +
  "  vec4 c=texture2D(uColor,(i+vec2(.5,1.5))/uSize);" +
  "  vec4 d=texture2D(uColor,(i+vec2(1.5,1.5))/uSize);" +
  "  a.rgb*=a.a;b.rgb*=b.a;c.rgb*=c.a;d.rgb*=d.a;" +
  "  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);" +
  "}" +
  "void main(){" +
  "  float m=smoothstep(0.,float(" + ANCHOR + "),v.y);" +
  "  vec2 uv=v;" +
  "  for(int i=0;i<3;i++){float h=texture2D(uHeight,uv).r;uv=v+uMouse*(h-uF)*uS*m;}" +
  "  gl_FragColor=pm(uv);" +
  "}";

  function load(src) {
    return new Promise(function (res, rej) {
      var i = new Image();
      i.onload = function () { res(i); };
      i.onerror = rej;
      i.src = src;
    });
  }

  Promise.all([load(img.src), load(HEIGHT_SRC)]).then(function (a) {
    var color = a[0], height = a[1];
    var canvas = document.createElement("canvas");
    canvas.width = color.naturalWidth;
    canvas.height = color.naturalHeight;
    var gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true });
    if (!gl) return;

    function sh(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }
    var prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    function tex(unit, image, nearest) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);      // keep the exact edge colors
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE); // no color-profile shifts
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      var f = nearest ? gl.NEAREST : gl.LINEAR;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    tex(0, color, true);    // portrait: nearest, the shader does the blending
    tex(1, height, false);  // height map: normal smooth filtering
    gl.uniform1i(gl.getUniformLocation(prog, "uColor"), 0);
    gl.uniform1i(gl.getUniformLocation(prog, "uHeight"), 1);
    gl.uniform1f(gl.getUniformLocation(prog, "uS"), STRENGTH);
    gl.uniform1f(gl.getUniformLocation(prog, "uF"), FOCUS);
    gl.uniform2f(gl.getUniformLocation(prog, "uSize"), color.naturalWidth, color.naturalHeight);
    var uMouse = gl.getUniformLocation(prog, "uMouse");
    var headline = document.querySelector(".headline");
    var dir = STRENGTH < 0 ? -1 : 1;

    var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    function draw() {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uMouse, cx, cy);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (headline) headline.style.translate = (dir * cx * TEXT_SHIFT) + "px " + (-dir * cy * TEXT_SHIFT) + "px";
    }
    function tick() {
      cx += (tx - cx) * SMOOTH;
      cy += (ty - cy) * SMOOTH;
      draw();
      raf = (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.0005) ? requestAnimationFrame(tick) : 0;
    }
    function kick() { if (!raf) raf = requestAnimationFrame(tick); }

    draw(); // first frame; if the texture upload failed, we never get here

    canvas.className = img.className;
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", img.alt || "");
    img.parentNode.insertBefore(canvas, img);
    img.className = "";
    img.style.display = "none";

  addEventListener("pointermove", function (e) {
    tx = (e.clientX / innerWidth) * 2 - 1;
    ty = -((e.clientY / innerHeight) * 2 - 1) * Y_SCALE;
    kick();
  }, { passive: true });
    document.documentElement.addEventListener("mouseleave", function () { tx = 0; ty = 0; kick(); });
  }).catch(function () { /* keep the normal image */ });
})();