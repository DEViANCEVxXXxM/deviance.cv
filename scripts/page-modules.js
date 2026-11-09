(function(){
  "use strict";
  window.PageModules = window.PageModules || {};

  window.PageModules.initReveal = function(){
    var els = document.querySelectorAll('.reveal:not(.in)');
    if (!els.length) return;

    if (!('IntersectionObserver' in window)) {
      els.forEach(function(el){ el.classList.add('in'); });
      return;
    }

    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (en.isIntersecting) { 
          en.target.classList.add('in'); 
          io.unobserve(en.target); 
        }
      });
    }, { threshold: 0.01, rootMargin: '0px 0px 0px 0px' });

    els.forEach(function(el){ io.observe(el); });

    
    setTimeout(function(){
      document.querySelectorAll('.reveal:not(.in)').forEach(function(el){
        var rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add('in');
        }
      });
    }, 1000);
  };

  window.PageModules.initSecHeadSplit = function(){
    document.querySelectorAll('.sec-head h2').forEach(function(h2){
      if (h2.querySelector('.ch')) return;
      var text = h2.textContent;
      h2.setAttribute('aria-label', text);
      h2.textContent = '';
      for (var i = 0; i < text.length; i++){
        var ch = document.createElement('span');
        ch.className = 'ch';
        ch.setAttribute('aria-hidden', 'true');
        ch.textContent = text[i];
        ch.style.setProperty('--d', (0.06 + i * 0.026) + 's');
        h2.appendChild(ch);
      }
    });
  };

  window.PageModules.initWordRotator = function(){
    var el = document.getElementById('wordRotator');
    if (!el || el.dataset.rotatorInit) return;
    el.dataset.rotatorInit = '1';

    var WORDS = [
      "SHARP", "BOLD", "CLEAN", "FAST", "HONEST",
      "LIVING", "TRUE", "REAL", "DEEP", "FINE",
      "LOUD", "SMOOTH", "TIGHT", "WARM", "RICH",
      "STILL", "BRIGHT", "DENSE", "FLUID", "GRAVE",
      "QUICK", "SOLID", "TALL", "WIDE", "YOUNG"
    ];
    var GLITCH_CHARS = "!@#$%^&*()_+-=[]{}|;':\",./<>?~`ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    
    var currentWord = WORDS[0];
    el.textContent = currentWord;
    
    var prefersReduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      
      var i = 0;
      setInterval(function(){
        if (!document.body.contains(el)) return;
        i = (i + 1) % WORDS.length;
        el.textContent = WORDS[i];
      }, 2800);
      return;
    }

    function getRandomGlitchChar() {
      return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
    }

    function glitchSwap() {
      var nextWord = WORDS[Math.floor(Math.random() * WORDS.length)];
      while (nextWord === currentWord && WORDS.length > 1) {
        nextWord = WORDS[Math.floor(Math.random() * WORDS.length)];
      }
      
      var targetLen = nextWord.length;
      var frame = 0;
      var maxFrames = 12;

      function step() {
        frame++;
        if (frame >= maxFrames) {
          el.textContent = nextWord;
          currentWord = nextWord;
          return;
        }

        var result = "";
        for (var i = 0; i < targetLen; i++) {
          if (Math.random() < (frame / maxFrames)) {
            result += nextWord[i];
          } else {
            result += getRandomGlitchChar();
          }
        }
        el.textContent = result;
        setTimeout(step, 40); 
      }
      step();
    }

    var t = setInterval(function(){
      if (!document.body.contains(el)) { clearInterval(t); return; }
      glitchSwap();
    }, 3500);
  };

  window.PageModules.initAll = function(){
    this.initReveal();
    this.initSecHeadSplit();
    this.initWordRotator();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ window.PageModules.initAll(); });
  } else {
    window.PageModules.initAll();
  }
})();
