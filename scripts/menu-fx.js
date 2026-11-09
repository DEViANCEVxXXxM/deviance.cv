
(function(){
  "use strict";
  var canvas = document.getElementById('menu-cv');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var w, h, dpr;
  var menu = document.getElementById('menu');
  var isOpen = false;
  var offset = 0;
  var raf = null;

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
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);

  function draw() {
    if (!isOpen) return;
    raf = requestAnimationFrame(draw);

    ctx.clearRect(0, 0, w, h);

    
    var horizon = h * 0.65;
    
    
    var grad = ctx.createLinearGradient(0, horizon, 0, h);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(0.3, color);
    grad.addColorStop(1, color);

    ctx.strokeStyle = grad;
    ctx.lineWidth = 1;

    offset = (offset + 0.4) % 100;

    
    for (var i = 1; i < 25; i++) {
      var z = i + offset * 0.02;
      var y = horizon + (h - horizon) / z;
      if (y < h + 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    }

    
    for (var j = -15; j <= 15; j++) {
      ctx.beginPath();
      ctx.moveTo(w/2, horizon);
      ctx.lineTo(w/2 + j * (w/5), h);
      ctx.stroke();
    }
  }

  if (menu) {
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        if (m.attributeName === 'class') {
          var open = menu.classList.contains('open');
          if (open && !isOpen) {
            isOpen = true;
            resize(); 
            raf = requestAnimationFrame(draw);
          } else if (!open && isOpen) {
            isOpen = false;
            if (raf) { cancelAnimationFrame(raf); raf = null; }
          }
        }
      });
    });
    observer.observe(menu, { attributes: true });
  }
})();
