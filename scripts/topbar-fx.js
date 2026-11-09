/* scripts/topbar-fx.js
   Interactive canvas background for the topbar.
   Pointer events are attached to the topbar host because the canvas
   itself has pointer-events: none. */
(function(){
  "use strict";
  var canvas = document.getElementById('topbar-cv');
  if (!canvas) return;

  var host = canvas.parentElement; // .topbar
  if (!host) return;

  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var w = 0, h = 0, dpr = 1;
  var particles = [];
  var NUM_PARTICLES = 40;
  var mouse = { x: -1000, y: -1000 };

  var color = '#c0fe04';
  function updateColor() {
    var hex = getComputedStyle(document.documentElement).getPropertyValue('--acid').trim();
    if (hex) color = hex;
  }
  updateColor();
  document.addEventListener('acidchange', updateColor);

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.max(1, w * dpr);
    canvas.height = Math.max(1, h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  function initParticles() {
    if (!w || !h) return;
    particles = [];
    for (var i = 0; i < NUM_PARTICLES; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        char: Math.random() > 0.5 ? '+' : (Math.random() > 0.5 ? '0' : '1')
      });
    }
  }

  var oldW = 0, oldH = 0;
  function checkResize() {
    if (w !== oldW || h !== oldH) {
      oldW = w;
      oldH = h;
      initParticles();
    }
  }

  // Listen on the host, not the canvas, because the canvas has pointer-events: none.
  host.addEventListener('pointermove', function(e) {
    var rect = host.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  host.addEventListener('pointerleave', function() {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  function frame() {
    requestAnimationFrame(frame);
    checkResize();

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];

      p.x += p.vx;
      p.y += p.vy;

      var dx = p.x - mouse.x;
      var dy = p.y - mouse.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0 && dist < 50) {
        var force = (50 - dist) / 50;
        p.x += (dx / dist) * force * 2;
        p.y += (dy / dist) * force * 2;
      }

      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;

      if (p.char === '+') {
        ctx.beginPath();
        ctx.moveTo(p.x - p.size, p.y);
        ctx.lineTo(p.x + p.size, p.y);
        ctx.moveTo(p.x, p.y - p.size);
        ctx.lineTo(p.x, p.y + p.size);
        ctx.stroke();
      } else {
        ctx.fillText(p.char, p.x, p.y);
      }
    }
  }

  requestAnimationFrame(frame);
})();