/* scripts/contact-fx.js
   Black hole with gravitational lensing.
   Pauses the render loop when the canvas is offscreen. */
(function(){
  "use strict";
  var canvas = document.getElementById('contact-cv');
  if (!canvas) return;

  var gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
  if (!gl) return;

  var vsSource = `
    attribute vec2 a_pos;
    void main() {
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `;

  var fsSource = `
    precision highp float;
    uniform vec2 uRes;
    uniform float uTime;
    uniform vec3 uCamPos;
    uniform vec3 uCamTarget;
    uniform vec3 uCamUp;
    uniform vec3 uColor;

    float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
    }
    
    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
    }

    vec3 starfield(vec3 dir) {
        vec3 color = vec3(0.0);
        vec2 uv = vec2(atan(dir.z, dir.x) / 3.14159, asin(dir.y) / 1.57079);
        vec2 grid = uv * 40.0;
        vec2 id = floor(grid);
        float h = hash(id);
        
        if (h > 0.98) {
            vec2 f = fract(grid) - 0.5;
            float d = length(f);
            float twinkle = 0.5 + 0.5 * sin(uTime * 3.0 + h * 100.0);
            color = vec3(0.8, 0.9, 1.0) * smoothstep(0.1, 0.0, d) * (h - 0.98) * 50.0 * twinkle;
        }
        return color;
    }

    void main() {
        // Нормализованные координаты от -1 до 1
        vec2 uv = (gl_FragCoord.xy * 2.0 - uRes) / min(uRes.x, uRes.y);

        // 1. УВЕЛИЧИВАЕМ РАЗМЕР (чем меньше множитель, тем больше дыра)
        uv *= 3.3; 

        // 2. СМЕЩАЕМ ЯКОРЬ (ЦЕНТР) ДЫРЫ ВПРАВО
        uv.x -= 3.5;
        uv.y -= 0.0;

        // Создаем базис камеры
        vec3 forward = normalize(uCamTarget - uCamPos);
        vec3 right = normalize(cross(forward, uCamUp));
        vec3 up = cross(right, forward);

        // Направление луча
        float focalLength = 2.0; 
        vec3 rd = normalize(uv.x * right + uv.y * up + focalLength * forward);

        vec3 pos = uCamPos;
        vec3 dir = rd;
        vec3 color = vec3(0.0);
        vec3 prevPos = pos;
        bool hitEventHorizon = false;

        // Raymarching
        for (int i = 0; i < 120; i++) {
            float r = length(pos);
            
            // Горизонт событий
            if (r < 0.3) {
                hitEventHorizon = true;
                break;
            }
            
            // Гравитация (искривление луча)
            vec3 accel = -pos / (r * r * r);
            dir += accel * 0.06;
            
            prevPos = pos;
            pos += dir * 0.06;

            // Пересечение с плоскостью диска (y = 0)
            if (prevPos.y * pos.y < 0.0) {
                float t = prevPos.y / (prevPos.y - pos.y);
                vec3 hit = mix(prevPos, pos, t);
                float hitR = length(hit.xz);
                
                // Размер диска (УВЕЛИЧЕН до 2.8 вместо 2.0)
                if (hitR > 0.3 && hitR < 15.0) {
                    float angle = atan(hit.z, hit.x);
                    
                    // Текстура диска
                    float n1 = noise(vec2(angle * 8.0 - uTime * 2.0, hitR * 8.0));
                    float n2 = noise(vec2(angle * 16.0 + uTime, hitR * 16.0));
                    float density = n1 * 0.6 + n2 * 0.4;
                    
                    // Затухание (края шире)
                    float alpha = smoothstep(0.3, 0.45, hitR) * smoothstep(2.8, 1.5, hitR) * density;
                    
                    // Яркость
                    float brightness = 1.0 + 3.0 * smoothstep(1.2, 0.3, hitR);
                    color += uColor * alpha * brightness * 2.0;
                }
            }
            if (r > 10.0) break;
        }
        
        // Звезды
        if (!hitEventHorizon) {
             color += starfield(rd);
        }
        
        // Фотонное кольцо (свечение)
        float dist = length(uv); 
        float glow = exp(-abs(dist - 0.3) * 15.0) * 0.4;
        color += uColor * glow;

        gl_FragColor = vec4(color, 1.0);
    }
  `;

  function compileShader(type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  }

  var vs = compileShader(gl.VERTEX_SHADER, vsSource);
  var fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(prog));
    return;
  }
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  var aPos = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  var uRes = gl.getUniformLocation(prog, 'uRes');
  var uTime = gl.getUniformLocation(prog, 'uTime');
  var uCamPos = gl.getUniformLocation(prog, 'uCamPos');
  var uCamTarget = gl.getUniformLocation(prog, 'uCamTarget');
  var uCamUp = gl.getUniformLocation(prog, 'uCamUp');
  var uColor = gl.getUniformLocation(prog, 'uColor');

  var color = [0.75, 0.99, 0.01];
  function updateColor() {
    var hex = getComputedStyle(document.documentElement).getPropertyValue('--acid').trim();
    if (hex.startsWith('#')) {
      if (hex.length === 4) hex = '#' + hex[1]+hex[1]+hex[2]+hex[2]+hex[3]+hex[3];
      if (hex.length === 7) {
        color = [
          parseInt(hex.slice(1,3),16)/255,
          parseInt(hex.slice(3,5),16)/255,
          parseInt(hex.slice(5,7),16)/255
        ];
      }
    }
    gl.uniform3fv(uColor, color);
  }
  updateColor();
  document.addEventListener('acidchange', updateColor);

  // Орбитальная камера
  var camYaw = 0.0;
  var camPitch = 0.05;
  var camDist = 2.2;
  var camTarget = [0, 0, 0];
  var isDragging = false;
  var prevX = 0, prevY = 0;

  function updateCamera() {
    var cosP = Math.cos(camPitch), sinP = Math.sin(camPitch);
    var cosY = Math.cos(camYaw), sinY = Math.sin(camYaw);
    var camX = camDist * cosP * sinY;
    var camY = camDist * sinP;
    var camZ = camDist * cosP * cosY;
    
    gl.uniform3fv(uCamPos, [camX, camY, camZ]);
    gl.uniform3fv(uCamTarget, camTarget);
    gl.uniform3fv(uCamUp, [0, 1, 0]);
  }

  canvas.addEventListener('pointerdown', function(e) {
    isDragging = true;
    prevX = e.clientX;
    prevY = e.clientY;
  });

  canvas.addEventListener('pointermove', function(e) {
    if (!isDragging) return;
    var dx = e.clientX - prevX;
    var dy = e.clientY - prevY;
    prevX = e.clientX;
    prevY = e.clientY;

    camYaw -= dx * 0.01;
    camPitch += dy * 0.01;
    camPitch = Math.max(-1.5, Math.min(1.5, camPitch)); // Ограничение
  });

  window.addEventListener('pointerup', function() {
    isDragging = false;
  });
  window.addEventListener('pointercancel', function() {
    isDragging = false;
  });

  var t0 = performance.now();
  var raf = null;
  var isVisible = false;

  function resize() {
    // Cap DPR at 1.5 for performance
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var w = canvas.clientWidth;
    var h = canvas.clientHeight;
    
    // Prevent WebGL errors if hidden (0x0)
    if (w === 0 || h === 0) return; 

    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    }
  }

  function frame(now) {
    if (!isVisible) return; // Stop loop if not visible
    
    raf = requestAnimationFrame(frame);
    resize();
    
    var time = (now - t0) / 1000;

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform1f(uTime, time);
    updateCamera();

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function startLoop() {
    if (!raf) {
      raf = requestAnimationFrame(frame);
    }
  }

  function stopLoop() {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = null;
    }
  }

  // Automatically pause the WebGL loop when hidden (e.g., navigating to #page/)
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function(entries) {
      isVisible = entries[0].isIntersecting;
      if (isVisible) startLoop();
      else stopLoop();
    }, { threshold: 0 }).observe(canvas);
  } else {
    isVisible = true;
    startLoop();
  }
})();