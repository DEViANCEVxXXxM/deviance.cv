(function(){
  "use strict";

  var home = document.getElementById('app-home');
  var app  = document.getElementById('app-page');
  if (!home || !app) return;

  var currentAbort = null;
  var currentUrl = null;
  var mounted = [];
  var cache = new Map();
  var baseTitle = document.title;
  var ALLOWED = {
    'pages/game-snk.html':   'GAME//SNK',
    'pages/disc-viz.html':   'DISC//VIZ',
    'pages/slab-field.html': 'SLAB FIELD'
  };
  function showError(msg){
    home.hidden = true;
    app.hidden = false;
    var d = document.createElement('div');
    d.className = 'page-error';
    d.textContent = '[ERR] ' + msg;
    app.replaceChildren(d);
  }

  function abs(u, base){ try { return new URL(u, base || location.href).href; } catch(e){ return u; } }

  function unmountAll(){
    mounted.forEach(function(entry){
      entry.styles.forEach(function(s){ s.remove(); });
      entry.scripts.forEach(function(s){ s.remove(); });
      if (typeof entry.cleanup === 'function') {
        try { entry.cleanup(); } catch(e){ console.warn('page cleanup failed:', e); }
      }
    });
    mounted = [];
  }

  function fetchFragment(url){
    if (cache.has(url)) return Promise.resolve(cache.get(url));
    return fetch(url, { signal: currentAbort.signal })
      .then(function(r){ if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(function(html){
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var root = doc.querySelector('[data-page]') || doc.body;
        var styles = Array.from(root.querySelectorAll('style, link[rel="stylesheet"]'));
        var scripts = Array.from(root.querySelectorAll('script'));
        styles.forEach(function(s){ s.remove(); });
        scripts.forEach(function(s){ s.remove(); });

        var entry = {
          root: root,
          styles: styles.map(function(s){
            return {
              tag: s.tagName.toLowerCase(),
              href: s.getAttribute('href') ? abs(s.getAttribute('href'), url) : null,
              text: s.tagName === 'STYLE' ? s.textContent : null,
              media: s.getAttribute('media')
            };
          }),
          scripts: scripts.map(function(s){
            return { src: s.src ? abs(s.src, url) : null, text: s.src ? null : s.textContent };
          })
        };
        cache.set(url, entry);
        return entry;
      });
  }

  function mountStyles(styles){
    var created = [];
    styles.forEach(function(st){
      var el;
      if (st.tag === 'link') {
        el = document.createElement('link');
        el.rel = 'stylesheet';
        el.href = st.href;
        if (st.media) el.media = st.media;
      } else {
        el = document.createElement('style');
        el.textContent = st.text;
      }
      el.setAttribute('data-mounted-page', '');
      document.head.appendChild(el);
      created.push(el);
    });
    return created;
  }

  function mountScripts(scripts){
    var created = [];
    return scripts.reduce(function(chain, sc){
      return chain.then(function(){
        return new Promise(function(resolve){
          var s = document.createElement('script');
          s.setAttribute('data-mounted-page', '');
          s.async = false;
          if (sc.src) {
            s.src = sc.src;
            s.onload = resolve;
            s.onerror = function(){ console.warn('page script failed:', sc.src); resolve(); };
          } else {
            s.textContent = sc.text;
          }
          document.body.appendChild(s);
          created.push(s);
          if (!sc.src) resolve();
        });
      });
    }, Promise.resolve()).then(function(){ return created; });
  }

  function reinit(){
    if (window.PageModules && window.PageModules.initAll) {
      window.PageModules.initAll();
    }
  }

  function pushAcidToIframe(iframe, value){
    try { iframe.contentWindow.postMessage({ type: 'acid', value: value }, location.origin); } catch(e){}
  }

  function loadPage(url){
    try { url = decodeURIComponent(url); } catch(e){}
    var bare = url.replace(/^iframe\//, '');
    if (!Object.prototype.hasOwnProperty.call(ALLOWED, bare)) {
      document.title = baseTitle;
      unmountAll();
      showError('unknown page');
      return;
    }
    document.title = ALLOWED[bare] + ' — DEVIANCE';
    if (currentAbort) currentAbort.abort();
    currentAbort = new AbortController();
    currentUrl = url;

    if (location.protocol === 'file:') {
      home.hidden = true;
      app.hidden = false;
      app.innerHTML = '<div class="page-error">[ERR] embedded pages require http(s) — run: python -m http.server</div>';
      return;
    }

    home.hidden = true;
    app.hidden = false;
    app.innerHTML = '<div class="page-loading">LOADING…</div>';
    unmountAll();

    if (url.indexOf('iframe/') === 0) {
      var wrap = document.createElement('article');
      wrap.className = 'page page-embed';
      wrap.setAttribute('data-page', '');
      wrap.style.height = '100%';
      var iframe = document.createElement('iframe');
      iframe.src = abs(url.replace(/^iframe\//, ''));
      iframe.loading = 'lazy';
      iframe.title = iframe.src.split('/').pop().replace('.html', '');
      iframe.className = 'page-embed-frame';
      iframe.style.cssText = 'width:100%;height:100%;border:0;display:block';
      iframe.addEventListener('load', function(){
        var acid = getComputedStyle(document.documentElement).getPropertyValue('--acid').trim();
        pushAcidToIframe(iframe, acid);
      });
      wrap.appendChild(iframe);
      app.replaceChildren(wrap);
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }

    fetchFragment(url).then(function(entry){
      if (currentUrl !== url) return;
      app.replaceChildren(entry.root.cloneNode(true));
      var styles = mountStyles(entry.styles);
      return mountScripts(entry.scripts).then(function(scripts){
        var cleanup = null;
        var pageEl = app.querySelector('[data-page]');
        if (pageEl) {
          var id = pageEl.getAttribute('data-page-id');
          if (id && window['__' + id + 'Cleanup']) cleanup = window['__' + id + 'Cleanup'];
        }
        mounted.push({ styles: styles, scripts: scripts, cleanup: cleanup });
        reinit();
        window.scrollTo({ top: 0, behavior: 'instant' });
      });
    }).catch(function(err){
      if (err.name === 'AbortError') return;
      showError(bare + ' — ' + err.message);
    });
  }

  function showHome(){
    if (currentAbort) currentAbort.abort();
    currentUrl = null;
    document.title = baseTitle;
    unmountAll();
    var wasPage = !app.hidden;
    app.hidden = true;
    app.replaceChildren();
    home.hidden = false;
    if (wasPage) {      var id = decodeURIComponent(location.hash.slice(1));
      var target = id && id !== 'top' ? document.getElementById(id) : null;
      if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' });
      else window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }

  function route(){
    var h = location.hash;
    if (h.indexOf('#page/') === 0) loadPage(h.slice('#page/'.length));
    else showHome();
  }
  window.addEventListener('hashchange', route);
  route();

  document.addEventListener('acidchange', function(e){
    var iframe = app.querySelector('iframe');
    if (iframe) pushAcidToIframe(iframe, e.detail);
  });

  window.pagesRouter = { loadPage: loadPage, showHome: showHome };
})();