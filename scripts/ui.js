
(function(){
  "use strict";

  var menu = document.getElementById('menu');
  var btn = document.getElementById('menuBtn');
  var close = document.getElementById('menuClose');
  function setMenu(open){
    if (menu.classList.contains('open') !== open) window.scrollLock(open);
    menu.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
  }
  btn.addEventListener('click', function(){ setMenu(!menu.classList.contains('open')); });
  close.addEventListener('click', function(){ setMenu(false); });
  menu.querySelectorAll('a.big').forEach(function(a){ a.addEventListener('click', function(){ setMenu(false); }); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') setMenu(false); });

  var vid = document.querySelector('.hero-video');
  if (vid) {
    var vio = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting) { vid.play().catch(function(err){ console.warn('hero video play failed:', err); }); }
        else { vid.pause(); }
      });
    }, {threshold: 0.1});
    vio.observe(vid);
    vid.addEventListener('error', function(e) {
      console.warn('hero video source failed:', e);
      var hint = document.getElementById('asciiHint');
      if (hint) {
        hint.textContent = '[VID:ERROR] [POSTER ONLY]';
        hint.classList.add('on');
      }
    });
  }

  var ACID = ['#00f0ff','#00ff88','#a3ff00','#ffe600','#ff6b00','#ff3b3b','#ff2ec4','#d400ff','#8c52ff','#00b3ff'];
  var logo = document.querySelector('.logo');
  if (logo) {
    logo.setAttribute('title', 'Re-roll accent');
    logo.addEventListener('click', function(){
      var cur = getComputedStyle(document.documentElement).getPropertyValue('--acid').trim().toLowerCase();
      var next;
      do { next = ACID[Math.floor(Math.random()*ACID.length)]; } while (next === cur);
      document.documentElement.style.setProperty('--acid', next);
      document.dispatchEvent(new CustomEvent('acidchange', { detail: next }));
    });
  }
})();

(function(){
  "use strict";
  if (!window.matchMedia || !matchMedia('(pointer:fine)').matches) return;
  var cur = document.getElementById('cursor');
  var TIPX = 4, TIPY = 1;
  var probe = new Image();
  probe.onload = function(){ document.documentElement.classList.add('has-cursor'); };
  probe.src = 'assets/cursor.png';
  var raf = null, mx = -100, my = -100;
  function paint(){
    raf = null;
    cur.style.transform = 'translate3d(' + (mx - TIPX) + 'px,' + (my - TIPY) + 'px,0)';
  }
  document.addEventListener('mousemove', function(e){
    mx = e.clientX; my = e.clientY;
    if (cur.style.visibility !== 'visible') cur.style.visibility = 'visible';
    if (raf === null) raf = requestAnimationFrame(paint);
  });
  document.addEventListener('mouseout', function(e){
    if (!e.relatedTarget && e.target.tagName !== 'IFRAME') cur.style.visibility = 'hidden';
  });

  var INTER = 'a,button,.cell,.proj,.cta,.socials,label,input,select,textarea,[role="button"],[tabindex],.page-disc-viz .btn';
  document.addEventListener('mouseover', function(e){
    if (e.target.tagName === 'IFRAME') {
      cur.style.visibility = 'hidden';
    } else {
      cur.classList.toggle('is-hover', !!(e.target.closest && e.target.closest(INTER)));
    }
  });
  document.addEventListener('mouseout', function(e){
    if (e.target.tagName === 'IFRAME') {
      cur.style.visibility = 'visible';
    }
  });
})();

(function(){
  "use strict";
  document.querySelectorAll('.proj[data-img]').forEach(function(el){
    var img = el.getAttribute('data-img');
    if (img){
      
      
      var absImg = new URL(img, location.href).href;
      el.style.setProperty('--proj-img', 'url("' + absImg + '")');
    }
  });
})();

(function(){
  "use strict";
  var track = document.querySelector('.ticker .track');
  if (track) {
    var content = track.innerHTML;
    track.innerHTML = content + content;
  }
})();

(function(){
  "use strict";
  var cmd = document.getElementById('pageCmd');
  if (!cmd) return;
  function sync(){
    cmd.classList.toggle('visible', location.hash.indexOf('#page/') === 0);
  }
  window.addEventListener('hashchange', sync);
  sync();
  cmd.addEventListener('click', function(){
    if (window.devi && window.devi.open) window.devi.open();
  });
})();

(function(){
  var topnav = document.querySelector('.topnav');
  if (!topnav) return;
  var defaultNav = '<a href="#work">WORK</a><a href="#stack">STACK</a><a href="#projects">PROJECTS</a><a href="#about">ABOUT</a><a href="#contact">CONTACT</a>';
  function updateNav() {
    var hash = window.location.hash;
    if (hash.indexOf('#page/') === 0) {
      var pageUrl = hash.slice('#page/'.length);
      var pageName = "UNKNOWN";
      if (pageUrl.indexOf('game-snk') !== -1) pageName = "GAME//SNK";
      else if (pageUrl.indexOf('disc-viz') !== -1) pageName = "DISC//VIZ";
      else if (pageUrl.indexOf('slab-field') !== -1) pageName = "SLAB FIELD";
      topnav.innerHTML =
        '<a href="#" style="color:var(--ink); margin-right:12px;">HOME</a>' +
        '<span style="color:var(--mut); margin-right:12px;">/</span>' +
        '<span style="color:var(--acid); font-weight:700;">' + pageName + '</span>';
    } else {
      topnav.innerHTML = defaultNav;
    }
  }
  window.addEventListener('hashchange', updateNav);
  setTimeout(updateNav, 0);

  if ('IntersectionObserver' in window) {
    var secIO = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (!en.isIntersecting) return;
        topnav.querySelectorAll('a').forEach(function(a){
          if (a.getAttribute('href') === '#' + en.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('#app-home section[id]').forEach(function(s){ secIO.observe(s); });
  }
})();

(function(){
  var bar = document.getElementById('progress');
  if (!bar) return;
  var raf = 0;
  function paint(){
    raf = 0;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
  }
  window.addEventListener('scroll', function(){ if (!raf) raf = requestAnimationFrame(paint); }, { passive: true });
  paint();
})();
