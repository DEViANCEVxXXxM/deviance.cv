(function(){
  "use strict";
  var cv = document.querySelector('.footword-bg');
  if (!cv) return;
  var gl = cv.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
  if (!gl) { cv.remove(); return; }
  try {
  function compile(type, src){
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
    return sh;
  }
  var vsrc = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}';
  var fsrc =
    'precision highp float;' +
    'uniform vec2 uRes;uniform float uTime;uniform float uXScale;uniform float uYScale;uniform float uDist;uniform vec3 uColor;' +
    'void main(){' +
    'vec2 p=(gl_FragCoord.xy*2.0-uRes)/min(uRes.x,uRes.y);' +
    'float d=length(p)*uDist;' +
    'float rx=p.x*(1.0+d);float gx=p.x;float bx=p.x*(1.0-d);' +
    'float r=0.05/abs(p.y+sin((rx+uTime)*uXScale)*uYScale);' +
    'float g=0.05/abs(p.y+sin((gx+uTime)*uXScale)*uYScale);' +
    'float b=0.05/abs(p.y+sin((bx+uTime)*uXScale)*uYScale);' +
    'vec3 light=clamp(vec3(r,g,b),0.0,1.0);' +
    'gl_FragColor=vec4(light*uColor,1.0);' +
    '}';
  var prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, vsrc));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fsrc));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var aPos = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  var U = {
    res: gl.getUniformLocation(prog, 'uRes'),
    time: gl.getUniformLocation(prog, 'uTime'),
    x: gl.getUniformLocation(prog, 'uXScale'),
    y: gl.getUniformLocation(prog, 'uYScale'),
    d: gl.getUniformLocation(prog, 'uDist'),
    col: gl.getUniformLocation(prog, 'uColor')
  };
  gl.uniform1f(U.x, 1.0);
  gl.uniform1f(U.y, 0.5);
  gl.uniform1f(U.d, 0.05);
  function acidVec(){
    var s = getComputedStyle(document.documentElement).getPropertyValue('--acid').trim();
    if (s.charAt(0) === '#') {
      if (s.length === 4) s = '#' + s[1]+s[1]+s[2]+s[2]+s[3]+s[3];
      if (s.length === 7) return [
        parseInt(s.slice(1,3),16)/255,
        parseInt(s.slice(3,5),16)/255,
        parseInt(s.slice(5,7),16)/255
      ];
    }
    return [0.753, 0.996, 0.016];
  }
  var col = acidVec(), tgt = col.slice();
  function syncAcid(){ tgt = acidVec(); }
  document.addEventListener('acidchange', syncAcid);
  gl.uniform3f(U.col, col[0], col[1], col[2]);
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var time = 0, running = false, raf = 0, rt = null;
  function resize(){
    var w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    var W = Math.round(w * DPR), H = Math.round(h * DPR);
    if (cv.width !== W || cv.height !== H) {
      cv.width = W; cv.height = H;
      gl.viewport(0, 0, W, H);
      gl.uniform2f(U.res, W, H);
    }
  }
  function frame(){
    if (!running) return;
    raf = requestAnimationFrame(frame);
    resize();
    time += 0.01;
    var k = 0.1;
    col[0] += (tgt[0]-col[0])*k;
    col[1] += (tgt[1]-col[1])*k;
    col[2] += (tgt[2]-col[2])*k;
    gl.uniform3f(U.col, col[0], col[1], col[2]);
    gl.uniform1f(U.time, time);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function start(){ if (running) return; syncAcid(); running = true; frame(); }
  function stop(){ running = false; cancelAnimationFrame(raf); }
  window.addEventListener('resize', function(){
    clearTimeout(rt);
    rt = setTimeout(resize, 120);
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function(es){
      es.forEach(function(e){ e.isIntersecting ? start() : stop(); });
    }, { threshold: 0 }).observe(cv);
  } else {
    start();
  }
  } catch (err) {
    console.warn('footword WebGL init failed:', err);
    if (cv && cv.parentNode) cv.remove();
  }
})();

(function(){
  "use strict";
  var hero = document.querySelector('.hero');
  var vid = document.querySelector('.hero-video');
  var hint = document.getElementById('asciiHint');
  if (!hero || !vid) return;
  if (location.protocol === 'file:'){
    if (hint){
      hint.textContent = '[VID:RAW] [FEATURE DISABLED]';
      hint.classList.add('on');
    }
    window.asciiFilter = {
      toggle: function(){}, enable: function(){}, disable: function(){},
      get mode(){ return 'file://'; }
    };
    return;
  }
  var DENSITY = 12000;
  var CHARS = '1279A3124E34075B8D';
  var LUMA = [0.2126, 0.7152, 0.0722];
  var ADV = 0.6;
  var q = new URLSearchParams(location.search).get('ascii');
  var wantMode = (q === 'dom') ? 'dom' : (q === 'auto') ? 'auto' : 'webgl';
  var cols = 0, rows = 0, raf = 0, tick = 0, visible = true, on = false;
  var renderer = null;
  function grid(){
    var w = hero.clientWidth, h = hero.clientHeight;
    if (!w || !h) return;
    cols = Math.max(16, Math.round(Math.sqrt(DENSITY * (w / h) / ADV)));
    rows = Math.max(8, Math.round(DENSITY / cols));
  }
  function makeDom(){
    var box = document.createElement('div');
    box.className = 'hero-ascii';
    box.setAttribute('aria-hidden', 'true');
    hero.appendChild(box);
    var off = document.createElement('canvas');
    var octx = off.getContext('2d', { willReadFrequently: true });
    return {
      label: 'DOM', el: box, half: true,
      resize: function(){
        grid();
        if (off.width !== cols || off.height !== rows){ off.width = cols; off.height = rows; }
        var w = hero.clientWidth;
        box.style.fontSize = (w / (cols * ADV)) + 'px';
      },
      frame: function(){
        if (!cols) return;
        var vw = vid.videoWidth, vh = vid.videoHeight;
        if (!vw || !vh) return;
        var aspect = hero.clientWidth / hero.clientHeight;
        var sw, sh, sx = 0, sy = 0;
        if (vw / vh > aspect){ sh = vh; sw = vh * aspect; sx = (vw - sw) / 2; }
        else { sw = vw; sh = vw / aspect; sy = (vh - sh) / 2; }
        octx.drawImage(vid, sx, sy, sw, sh, 0, 0, cols, rows);
        var data = octx.getImageData(0, 0, cols, rows).data;
        var out = new Array(rows);
        for (var y = 0; y < rows; y++){
          var line = new Array(cols);
          for (var x = 0; x < cols; x++){
            var p = (y * cols + x) * 4;
            var b = (LUMA[0]*data[p] + LUMA[1]*data[p+1] + LUMA[2]*data[p+2]) / 255;
            if (b < 0) b = 0; else if (b > 1) b = 1;
            line[x] = CHARS[(b * (CHARS.length - 1)) | 0];
          }
          out[y] = line.join('');
        }
        box.textContent = out.join('\n');
      },
      dispose: function(){ box.remove(); }
    };
  }
  function makeWebGL(){
    var canvas = document.createElement('canvas');
    canvas.className = 'hero-ascii';
    canvas.setAttribute('aria-hidden', 'true');
    hero.appendChild(canvas);
    var gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'high-performance' });
    if (!gl){ window._asciiGlFail = 'no-context'; canvas.remove(); return null; }
    function sh(type, src){
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)){
        window._asciiGlFail = (type === gl.VERTEX_SHADER ? 'vs' : 'fs') + ': ' + gl.getShaderInfoLog(s);
        console.error('asciimask: shader:', gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    }
    var vs = sh(gl.VERTEX_SHADER,
      'attribute vec2 a_pos;' +
      'varying vec2 v_uv;' +
      'void main(){ v_uv = a_pos * 0.5 + 0.5; gl_Position = vec4(a_pos, 0.0, 1.0); }');
    var fs = sh(gl.FRAGMENT_SHADER,
      'precision highp float;' +
      'varying vec2 v_uv;' +
      'uniform sampler2D u_video;' +
      'uniform sampler2D u_atlas;' +
      'uniform vec2 u_grid;' +
      'uniform vec2 u_atlasSize;' +
      'uniform float u_chars;' +
      'uniform float u_vidAspect;' +
      'uniform vec3 u_color;' +
      'void main(){' +
      '  vec2 cellUV = (floor(v_uv * u_grid) + 0.5) / u_grid;' +
      '  float k = max(1.0, 1.0 / u_vidAspect);' +
      '  vec2 d = vec2(k * u_vidAspect, k);' +
      '  vec2 vv = (cellUV - 0.5 + 0.5 * d) / d;' +
      '  float b = clamp(dot(texture2D(u_video, vec2(vv.x, 1.0 - vv.y)).rgb, vec3(0.2126, 0.7152, 0.0722)), 0.0, 1.0);' +
      '  float idx = min(floor(b * (u_chars - 1.0)), u_chars - 1.0);' +
      '  vec2 localUV = fract(v_uv * u_grid);' +
      '  vec2 auv = (vec2(mod(idx, u_atlasSize.x), floor(idx / u_atlasSize.x)) + localUV) / u_atlasSize;' +
      '  gl_FragColor = vec4(u_color, texture2D(u_atlas, auv).r);' +
      '}');
    if (!vs || !fs){ canvas.remove(); return null; }
    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)){
      window._asciiGlFail = 'link: ' + gl.getProgramInfoLog(prog);
      console.error('asciimask: link:', gl.getProgramInfoLog(prog));
      canvas.remove();
      return null;
    }
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 8, 0);
    var U = {};
    ['u_video','u_atlas','u_grid','u_atlasSize','u_chars','u_vidAspect','u_color'].forEach(function(n){
      U[n] = gl.getUniformLocation(prog, n);
    });
    var A_COLS = 5, CELL = 96;
    var atlasTex = gl.createTexture();
    function buildAtlas(){
      var c = document.createElement('canvas');
      c.width = A_COLS * CELL;
      c.height = A_COLS * CELL;
      var ctx = c.getContext('2d');
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = Math.max(2, Math.floor(CELL * 0.05));
      ctx.lineJoin = 'round';
      ctx.font = '700 ' + Math.floor(CELL * 0.72) + 'px "Space Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (var i = 0; i < CHARS.length; i++){
        var r = Math.floor(i / A_COLS);
        var cx = (i % A_COLS) * CELL + CELL / 2;
        var cy = (A_COLS - 1 - r) * CELL + CELL / 2;
        ctx.strokeText(CHARS[i], cx, cy);
        ctx.fillText(CHARS[i], cx, cy);
      }
      gl.bindTexture(gl.TEXTURE_2D, atlasTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    buildAtlas();
    if (document.fonts && document.fonts.load){
      document.fonts.load('700 48px "Space Mono"').then(buildAtlas).catch(function(err){ console.warn('font load failed:', err); });
    }
    var vidTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, vidTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    var cur = [0.753, 1.0, 0.016], tgt = null;
    function readAcid(){
      var hex = (getComputedStyle(document.documentElement).getPropertyValue('--acid') || '').trim();
      var m = hex.match(/^#?([0-9a-f]{6})$/i);
      if (m){
        var n = parseInt(m[1], 16);
        tgt = [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
      }
    }
    readAcid();
    document.addEventListener('acidchange', readAcid);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 1);
    return {
      label: 'GL', el: canvas, half: false,
      resize: function(){
        grid();
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(2, Math.floor(hero.clientWidth * dpr));
        canvas.height = Math.max(2, Math.floor(hero.clientHeight * dpr));
        gl.viewport(0, 0, canvas.width, canvas.height);
      },
      frame: function(){
        if (!cols || !vid.videoWidth || !vid.videoHeight) return;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, vidTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, vid);
        if (tgt){
          for (var i = 0; i < 3; i++) cur[i] += (tgt[i] - cur[i]) * 0.12;
        }
        gl.uniform1i(U.u_video, 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, atlasTex);
        gl.uniform1i(U.u_atlas, 1);
        gl.uniform2f(U.u_grid, cols, rows);
        gl.uniform2f(U.u_atlasSize, A_COLS, A_COLS);
        gl.uniform1f(U.u_chars, CHARS.length);
        gl.uniform1f(U.u_vidAspect, vid.videoWidth / vid.videoHeight);
        gl.uniform3f(U.u_color, cur[0], cur[1], cur[2]);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      },
      dispose: function(){ canvas.remove(); }
    };
  }
  if (wantMode !== 'dom'){
    try { renderer = makeWebGL(); }
    catch(e){ window._asciiGlFail = 'threw: ' + e.message; renderer = null; }
  }
  if (!renderer) renderer = makeDom();
  renderer.resize();
  function loop(){
    if (!on || !visible) { raf = 0; return; }
    if (vid.readyState >= 2 && !vid.paused){
      if (renderer.half ? ((tick++ & 1) === 0) : true) renderer.frame();
    }
    raf = requestAnimationFrame(loop);
  }
  function startLoop(){ if (on && visible && !raf) raf = requestAnimationFrame(loop); }
  function stopLoop(){ if (raf){ cancelAnimationFrame(raf); raf = 0; } }
  function setOn(state){
    on = state;
    renderer.el.classList.toggle('on', on);
    if (hint){
      hint.textContent = on ? '[VID:ASCII·' + renderer.label + ']' : '[VID:RAW]';
      hint.classList.toggle('on', on);
    }
    if (on) startLoop();
    else stopLoop();
  }
  hero.addEventListener('click', function(e){
    if (e.target.closest('a,button,.strip,.ticker')) return;
    setOn(!on);
  });
  var vio = new IntersectionObserver(function(es){
    es.forEach(function(e){
      visible = e.isIntersecting;
      if (visible) startLoop();
      else stopLoop();
    });
  }, { threshold: 0.05 });
  vio.observe(hero);
  var rt = 0;
  window.addEventListener('resize', function(){
    if (rt) return;
    rt = setTimeout(function(){ rt = 0; renderer.resize(); }, 120);
  });
  window.asciiFilter = {
    toggle: function(){ setOn(!on); },
    enable: function(){ setOn(true); },
    disable: function(){ setOn(false); },
    get mode(){ return renderer.label; }
  };
})();