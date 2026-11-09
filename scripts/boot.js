window.scrollLock = (function(){
  var n = 0;
  return function(on){
    n = Math.max(0, n + (on ? 1 : -1));
    document.body.style.overflow = n ? 'hidden' : '';
  };
})();

(function () {
  'use strict';
  var KEY = 'deviance.filewarn.dismissed';
  var HOLD_MS = 2500;
  var DRAIN = 2;
  var box = document.getElementById('fileWarn');
  if (!box) return;
  if (location.protocol !== 'file:') return;
  try { if (localStorage.getItem(KEY)) return; } catch (e) {}
  box.removeAttribute('hidden');
  var btn = document.getElementById('fwIgnore');
  if (!btn) return;
  var label = document.getElementById('fwHoldLabel');
  var svg = document.getElementById('fwRing');
  var rect = document.getElementById('fwRingRect');
  var panel = document.querySelector('.fw-panel');
  var IDLE = label ? label.textContent : 'HOLD TO IGNORE';
  var p = 0, holding = false, raf = null, last = 0, done = false, surge = 0;
  function size() {
    var w = svg.clientWidth - 2;
    var h = svg.clientHeight - 2;
    if (w < 4 || h < 4) return;
    rect.setAttribute('width', w);
    rect.setAttribute('height', h);
    paint();
  }
  function paint() {
    // rect uses pathLength="1" and stroke-dasharray:1 in CSS,
    // so dashoffset is normalized 0..1 regardless of pixel size.
    rect.setAttribute('stroke-dashoffset', String(1 - p));
    if (svg) svg.classList.toggle('on', p > 0 || holding);
    btn.classList.toggle('is-holding', holding);
    if (label) label.textContent = (p > 0 || holding) ? pct(p) : IDLE;
  }
  function pct(v) {
    var s = String(Math.min(100, Math.round(v * 100)));
    while (s.length < 3) s = '0' + s;
    return s + '%';
  }
  if (typeof ResizeObserver !== 'undefined' && panel) {
    new ResizeObserver(size).observe(panel);
  } else if (window.addEventListener) {
    window.addEventListener('resize', size);
  }
  function tick(t) {
    var dt = Math.min(t - last, 64);
    last = t;
    if (holding) p = Math.min(1, p + dt / HOLD_MS);
    else p = Math.max(0, p - (dt / HOLD_MS) * DRAIN);
    paint();
    if (holding && p >= 1) { complete(); return; }
    if (p > 0 || holding) raf = requestAnimationFrame(tick);
    else raf = null;
  }
  function start() {
    if (raf === null) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
  }
  function complete() {
    if (done) return;
    done = true;
    holding = false;
    p = 1;
    surge = 1;
    paint();
    try { localStorage.setItem(KEY, '1'); } catch (e) {}
    box.classList.add('fw-done');
    setTimeout(function () { box.setAttribute('hidden', ''); }, 450);
  }
  btn.addEventListener('pointerdown', function (e) {
    if (done) return;
    e.preventDefault();
    holding = true;
    start();
  });
  window.addEventListener('pointerup', function () { holding = false; });
  window.addEventListener('pointercancel', function () { holding = false; });
  btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  btn.addEventListener('keydown', function (e) {
    if (done || e.repeat) return;
    if (e.key === ' ' || e.key === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter') {
      e.preventDefault();
      holding = true;
      start();
    }
  });
  window.addEventListener('keyup', function (e) {
    if (e.key === ' ' || e.key === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter') {
      holding = false;
    }
  });
  window.addEventListener('blur', function () { holding = false; });

  var fxc = document.getElementById('fwFx');
  if (fxc && fxc.getContext) {
    var fctx = fxc.getContext('2d');
    var FW = 0, FH = 0;
    var px = 0, py = 0, tx = 0, ty = 0;
    var fxT = 0, fxRaf = null, fxLast = 0;
    function fxColor() {
      var raw = (getComputedStyle(document.documentElement).getPropertyValue('--acid') || '').trim();
      var m = raw.match(/^#([0-9a-f]{6})$/i);
      if (m) { var n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
      m = raw.match(/^rgba?\((\d+)[\s,]+(\d+)[\s,]+(\d+)/);
      if (m) return [+m[1], +m[2], +m[3]];
      return [192, 254, 4];
    }
    var ACID = fxColor();
    document.addEventListener('acidchange', function () { ACID = fxColor(); });
    function makeItems(count, smin, smax, v0, v1, depth) {
      var a = [];
      for (var i = 0; i < count; i++) {
        var v = v0 + Math.random() * (v1 - v0);
        a.push({
          x: Math.random(), y: Math.random(),
          s: smin + Math.random() * (smax - smin),
          vx: v * (Math.random() < 0.5 ? -1 : 1) * 0.6,
          vy: -v,
          depth: depth
        });
      }
      return a;
    }
    var LAYERS = [
      { items: makeItems(90, 2, 3.5, 4, 7, 0.35),   a: 0.08, lw: 1   },
      { items: makeItems(60, 3, 5,   7, 12, 0.65),  a: 0.13, lw: 1   },
      { items: makeItems(34, 4.5, 7.5, 11, 18, 1.0), a: 0.20, lw: 1.5 }
    ];
    function fxResize() {
      FW = Math.max(1, box.clientWidth | 0);
      FH = Math.max(1, box.clientHeight | 0);
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      fxc.width = FW * dpr;
      fxc.height = FH * dpr;
      fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function fxTick(t) {
      var dt = Math.min(t - fxLast, 64); fxLast = t; fxT += dt;
      px += (tx - px) * 0.07;
      py += (ty - py) * 0.07;
      fctx.clearRect(0, 0, FW, FH);
      var e = p, sm = 1 + 1.6 * e, am = 0.75 + 2.2 * e;
      var i, it, L, arr;
      for (i = 0; i < LAYERS.length; i++) {
        L = LAYERS[i]; arr = L.items;
        var al = Math.min(0.6, L.a * am);
        fctx.lineWidth = L.lw;
        fctx.strokeStyle = 'rgba(' + ACID[0] + ',' + ACID[1] + ',' + ACID[2] + ',' + al.toFixed(3) + ')';
        fctx.beginPath();
        for (var j = 0; j < arr.length; j++) {
          it = arr[j];
          it.x += it.vx * sm * dt / 1000;
          it.y += it.vy * sm * dt / 1000;
          if (it.x > 1.08) it.x = -0.08; else if (it.x < -0.08) it.x = 1.08;
          if (it.y < -0.08) it.y = 1.08;
          var x = it.x * FW + px * 14 * it.depth;
          var y = it.y * FH + py * 10 * it.depth;
          var s = it.s;
          fctx.moveTo(x - s, y); fctx.lineTo(x + s, y);
          fctx.moveTo(x, y - s); fctx.lineTo(x, y + s);
        }
        fctx.stroke();
      }
      var sy = ((fxT % 4200) / 4200) * (FH + 60) - 30;
      fctx.fillStyle = 'rgba(' + ACID[0] + ',' + ACID[1] + ',' + ACID[2] + ',' + (0.08 + 0.18 * e).toFixed(3) + ')';
      fctx.fillRect(0, sy, FW, 1);
      if (surge > 0) {
        surge = Math.max(0, surge - dt / 500);
        fctx.fillStyle = 'rgba(' + ACID[0] + ',' + ACID[1] + ',' + ACID[2] + ',' + (surge * 0.22).toFixed(3) + ')';
        fctx.fillRect(0, 0, FW, FH);
        var cx = FW / 2, cy = FH / 2, maxR = Math.sqrt(FW * FW + FH * FH) / 2;
        for (i = 0; i < 3; i++) {
          var rr = 40 + (1 - surge) * maxR + i * 34;
          fctx.lineWidth = 1.5;
          fctx.strokeStyle = 'rgba(' + ACID[0] + ',' + ACID[1] + ',' + ACID[2] + ',' + (surge * 0.5 * (1 - i * 0.25)).toFixed(3) + ')';
          fctx.beginPath();
          fctx.arc(cx, cy, rr, 0, 6.2832);
          fctx.stroke();
        }
      }
      if (done && surge <= 0) { fxRaf = null; return; }
      fxRaf = requestAnimationFrame(fxTick);
    }
    function fxStart() {
      if (fxRaf === null) { fxLast = performance.now(); fxRaf = requestAnimationFrame(fxTick); }
    }
    fxResize();
    window.addEventListener('resize', fxResize);
    box.addEventListener('pointermove', function (e) {
      tx = (e.clientX / window.innerWidth) * 2 - 1;
      ty = (e.clientY / window.innerHeight) * 2 - 1;
    });
    fxStart();
  }
  size();
})();