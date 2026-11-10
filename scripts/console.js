(function(){
  "use strict";
  var Q = new URLSearchParams(location.search);
  if (Q.get('console') === '0') return;
  var NODE_ID = '41.3038.69.2418.cv26';
  var LINK_ID = '0.4.5-23';
  var FX_STARTUP = 'assets/audio/fx/cli_startup.wav';
  var FX_STARTUP_VOL = 0.25;
  var FX_KEY = 'assets/audio/fx/key.wav';
  var FX_KEY_VOL = 0.15;
  var FX_KEY_PITCH_MIN = 0.85;
  var FX_KEY_PITCH_MAX = 1.3;
  var BOOT_FIRST = [
    'OPENING CONNECTION TO ' + LINK_ID + ' ... [OK]',
    'DEVIANCE qterm v1.0 — 11 commands loaded',
    'type `help` or `load` to see pages'
  ];
  var BOOT_RE = 'RECONNECT ' + LINK_ID + ' ... [OK]';
  var cmds = {};
  function register(name, desc, fn, aliases){
    var entry = {desc: desc, fn: fn, aliases: aliases || []};
    cmds[name] = entry;
    entry.aliases.forEach(function(a){ cmds[a] = entry; });
  }
  function reroll(){
    var logo = document.querySelector('.logo');
    if (!logo) return 'no accent bound';
    var before = getComputedStyle(document.documentElement).getPropertyValue('--acid').trim().toLowerCase();
    logo.click();
    var after = getComputedStyle(document.documentElement).getPropertyValue('--acid').trim().toLowerCase();
    return 'accent re-rolled ' + before + ' → ' + after;
  }
  register('help', 'list available commands', function(){
    var seen = new Map(), out = [];
    Object.keys(cmds).forEach(function(k){
      var c = cmds[k];
      if (seen.has(c)) return; seen.set(c, 1);
      var name = k + (c.aliases.length ? ' (' + c.aliases.join(', ') + ')' : '');
      out.push(name.padEnd(14) + '— ' + c.desc);
    });
    out.sort();
    return out;
  }, ['?']);
  register('about', 'display admin information', function(){
    return [
      'THIS PAGE IS CV/PORTFOLIO MADE IN CYBERBRUTLISM STYLE CONTAINS DATA ABOUT SKILL AND PROJECTS FOR HR AND EMPLOYERS.',
      'DEVIANCE IS A PERSONAL PROJECT OF NIKITA REPRINTSEV, DIGITAL DESIGNER / GAME DESIGNER.',
      'FOR ADDITIONAL INFO USE `contact` COMMAND OR EMAIL ME DIRECTLY.'
    ];
  }, ['abt']);
  register('contact', 'display contact information', function(){
    return ['NIKITA REPRINTSEV', 'DIGITAL DESIGN / GAME DESIGN', 'deviancevxxxxm@gmail.com', 'TZ: TSK UTC+05'];
  }, ['cnt']);
  register('load', 'load embedded page: snk | dsc | sf | home', function(args){
    var key = (args && args[0] || '').toLowerCase();
    var PAGES = {
      snk:  { url: 'iframe/pages/game-snk.html',   label: 'GAME//SNK' },
      dsc:  { url: 'pages/disc-viz.html',          label: 'DISC//VIZ' },
      sf:   { url: 'iframe/pages/slab-field.html', label: 'SLAB FIELD' },
      home: { url: null,                           label: 'PORTFOLIO' }
    };
    if (!key || !PAGES[key]) {
      return [
        'usage: load <snk|dsc|sf|home>',
        '',
        'snk  — GAME//SNK (20×20 snake)',
        'dsc  — DISC//VIZ (audio disc)',
        'sf   — SLAB FIELD (WebGL pit)',
        'home — return to portfolio'
      ];
    }
    var p = PAGES[key];
    close();
    if (p.url === null) { location.hash = '#top'; return null; }
    location.hash = '#page/' + p.url;
    return ['LOADING ' + p.label + ' ...'];
  }, ['ld']);
  register('color', 're-roll the accent color', reroll, ['clr']);
  register('crt', 'toggle CRT screen filter', function(){
    var on = document.documentElement.classList.toggle('crt-on');
    return ['crt mode ' + (on ? 'on' : 'off')];
  });
  register('clear', 'clear the log', function(){ log.innerHTML = ''; return null; }, ['cls']);
  register('version', 'build info', function(){
    return ['qterm v1.0 — build 26.11 — ' + NODE_ID];
  }, ['ver']);
  register('exit', 'close the console', function(){ close(); return null; }, ['q']);
  register('reload', 'reload the page', function(){
    setTimeout(function(){ location.reload(); }, 1200);
    return ['SYSTEM // RELOAD', 'connection ' + LINK_ID + ' — resetting ...'];
  }, ['rld']);
  register('shutdown', 'close the page', function(){
    setTimeout(function(){
      window.close();
      setTimeout(function(){
        if (!window.closed){
          typeOutput(['DENIED: tab not script-opened — MANUAL OVERRIDE REQUIRED']);
        }
      }, 400);
    }, 1200);
    return ['SYSTEM // RELOAD', 'connection ' + LINK_ID + ' — resetting ...'];
  }, ['sd']);

  var root, tl, tr, bl, br, log, input, openFlag = false, firstBoot = true;
  var statTimer = null, dateTimer = null, lastFocus = null;
  var hist = [], hIdx = -1, draft = '';
  function build(){
    root = document.createElement('div');
    root.id = 'dc-root';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'DEV console');
    root.innerHTML =
      '<div id="dc-frame" aria-hidden="true"></div>' +
      '<div id="dc-scan" aria-hidden="true"></div>' +
      '<div id="dc-tl" class="dc-chrome">OPENING CONNECTION TO ' + LINK_ID + '</div>' +
      '<div id="dc-tr" class="dc-chrome"></div>' +
      '<div id="dc-bl" class="dc-chrome" aria-hidden="true"></div>' +
      '<div id="dc-br" class="dc-chrome">&lt;' + NODE_ID + '&gt;</div>' +
      '<div id="dc-log" class="dc-chrome"></div>' +
      '<div id="dc-in" class="dc-chrome"><span id="dc-prompt">&gt;</span><input id="dc-input" ' +
        'spellcheck="false" autocomplete="off" autocapitalize="off" type="text" aria-label="command"></div>';
    document.body.appendChild(root);
    tl = root.querySelector('#dc-tl'); tr = root.querySelector('#dc-tr');
    bl = root.querySelector('#dc-bl'); br = root.querySelector('#dc-br');
    log = root.querySelector('#dc-log'); input = root.querySelector('#dc-input');
    input.addEventListener('keydown', onKey);
    input.addEventListener('input', function(){ hIdx = -1; });
    root.addEventListener('mousedown', function(e){
      if (e.target !== input){ e.preventDefault(); input.focus(); }
    });
    document.addEventListener('keydown', onGlobalKey);
    var barcode = document.querySelector('.barcode');
    if (barcode) barcode.addEventListener('click', toggle);
  }
  function addLine(text, cls){
    var d = document.createElement('div');
    d.className = 'dc-line' + (cls ? ' ' + cls : '');
    d.textContent = text;
    log.appendChild(d);
    while (log.children.length > 400) log.removeChild(log.firstChild);
    log.scrollTop = log.scrollHeight;
    return d;
  }
  var TYPE_CPS = 75;
  var typeTimer = null, typeLines = null, typeLi = 0, typeCi = 0, typeNode = null;
  function stopType(){
    if (typeTimer){ clearInterval(typeTimer); typeTimer = null; }
    typeLines = null; typeNode = null;
  }
  function typeOutput(lines){
    stopType();
    if (!lines.length) return;
    typeLines = lines; typeLi = 0; typeCi = 0; typeNode = null;
    typeTimer = setInterval(typeTick, Math.max(16, Math.round(1000 / TYPE_CPS)));
    typeTick();
  }
  function typeTick(){
    if (!typeLines) return;
    var line = typeLines[typeLi];
    if (typeCi === 0) typeNode = addLine('');
    typeNode.appendChild(document.createTextNode(line.charAt(typeCi++)));
    if (typeCi >= line.length){ typeLi++; typeCi = 0; typeNode = null; }
    if (typeLi >= typeLines.length) stopType();
  }
  function flushType(){
    if (!typeLines) return;
    var lines = typeLines, li = typeLi, ci = typeCi, node = typeNode;
    stopType();
    if (ci > 0 && node){
      node.appendChild(document.createTextNode(lines[li].slice(ci)));
    } else {
      addLine(lines[li]);
    }
    for (var i = li + 1; i < lines.length; i++) addLine(lines[i]);
  }
  function run(raw){
    var line = raw.trim();
    addLine('> ' + line, 'dc-echo');
    if (!line) return;
    hist.push(line); if (hist.length > 50) hist.shift();
    hIdx = hist.length; draft = '';
    var parts = line.split(/\s+/);
    var name = parts[0].toLowerCase();
    var c = cmds[name];
    if (!c) { typeOutput(["ERR: unknown command '" + name + "' — try `help`"]); return; }
    var out = c.fn(parts.slice(1));
    if (out === null) return;
    typeOutput(Array.isArray(out) ? out : [out]);
  }
  function onKey(e){
    if (typeTimer) flushType();
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) playKey();
    if (e.key === 'Enter'){ run(input.value); input.value = ''; }
    else if (e.key === 'ArrowUp'){
      e.preventDefault();
      if (hIdx > 0){ hIdx--; input.value = hist[hIdx] || ''; draft = input.value; }
    } else if (e.key === 'ArrowDown'){
      e.preventDefault();
      if (hIdx < hist.length){ hIdx++; input.value = hist[hIdx] || ''; draft = input.value; }
    } else if (e.key === 'Escape'){ close(); }
    else if (e.key === '`'){ close(); e.stopPropagation(); }
  }
  function onGlobalKey(e){
    if (e.key === 'Escape' && openFlag){ close(); return; }
    if (openFlag) return;
    if ((e.key === '`' || e.key === '~' || e.code === 'Backquote') && !e.ctrlKey && !e.metaKey && !e.altKey){
      var t = e.target;
      if (t && t !== input && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      e.preventDefault();
      open();
    }
  }
  var st = {l1: 0.42, l2: 0.38, cpu: 7.5, thr: 2587};
  function pad(n, w){ n = String(n); while (n.length < w) n = '0' + n; return n; }
  function statsLine(){
    return 'PROCESSES: 046 TOTAL, 002 RUNNING, 044 SLEEP, ' + st.thr + ' THREADS\n' +
      'LOAD AVG: ' + st.l1.toFixed(2) + ', ' + st.l2.toFixed(2) +
      ' CPU: ' + pad(st.cpu.toFixed(1), 4) + '% USER, 09.4% SYS, ' +
      pad((100 - st.cpu - 9.4).toFixed(1), 4) + '% IDLE\n' +
      'MEM RESIDENT: 31212 TOTAL, 5184 RESIDENT, 14448 SHARED\n' +
      'NODES: 41.3038N 69.2418E · TSK UTC+05 · LINK STABLE';
  }
  function tickStats(){
    st.l1 = Math.min(0.9, Math.max(0.2, st.l1 + (Math.random() - 0.5) * 0.08));
    st.l2 = Math.min(0.9, Math.max(0.2, st.l2 + (Math.random() - 0.5) * 0.06));
    st.cpu = Math.min(14, Math.max(4, st.cpu + (Math.random() - 0.5) * 2));
    st.thr = 2580 + Math.floor(Math.random() * 14);
    if (bl) bl.textContent = statsLine();
  }
  function tickDate(){
    var d = new Date();
    tr.textContent = d.getFullYear() + '.' + pad(d.getMonth() + 1, 2) + '.' + pad(d.getDate(), 2) +
      '.' + pad(d.getHours(), 2) + pad(d.getMinutes(), 2);
  }
  function playStartup(){
    try {
      var a = new Audio(FX_STARTUP);
      a.volume = FX_STARTUP_VOL;
      a.play().catch(function(err){ console.warn('audio play failed:', err); });
    } catch (e) { }
  }
  var actx = null, keyBuf = null, keyLoadTried = false;
  function keyCtx(){
    if (actx) return actx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    actx = new AC();
    return actx;
  }
  function loadKeyBuf(){
    if (keyLoadTried) return;
    keyLoadTried = true;
    var ctx = keyCtx();
    if (!ctx) return;
    try {
      var x = new XMLHttpRequest();
      x.open('GET', FX_KEY, true);
      x.responseType = 'arraybuffer';
      x.onload = function(){
        if (x.status !== 200) return;
        ctx.decodeAudioData(x.response, function(buf){ keyBuf = buf; }, function(){ });
      };
      x.send();
    } catch (e) { }
  }
  function playKey(){
    var ctx = actx;
    if (!ctx || !keyBuf) return;
    try {
      if (ctx.state === 'suspended'){ ctx.resume().catch(function(err){ console.warn('audio resume failed:', err); }); }
      var rate = FX_KEY_PITCH_MIN + Math.random() * (FX_KEY_PITCH_MAX - FX_KEY_PITCH_MIN);
      var src = ctx.createBufferSource();
      src.buffer = keyBuf;
      src.playbackRate.value = rate;
      var g = ctx.createGain();
      g.gain.value = FX_KEY_VOL;
      src.connect(g);
      g.connect(ctx.destination);
      src.start();
    } catch (e) { }
  }
  function open(){
    if (openFlag) return;
    openFlag = true;
    lastFocus = document.activeElement;
    window.scrollLock(true);
    root.classList.add('open');
    if (firstBoot){ firstBoot = false; BOOT_FIRST.forEach(addLine); playStartup(); }
    else { addLine(BOOT_RE); }
    loadKeyBuf();
    var kc = keyCtx();
    if (kc && kc.state === 'suspended'){ kc.resume().catch(function(err){ console.warn('audio resume failed:', err); }); }
    if (bl) bl.textContent = statsLine();
    tickDate();
    statTimer = setInterval(tickStats, 2000);
    dateTimer = setInterval(tickDate, 1000);
    setTimeout(function(){ input.focus(); }, 0);
  }
  function close(){
    if (!openFlag) return;
    openFlag = false;
    flushType();
    window.scrollLock(false);
    root.classList.remove('open');
    clearInterval(statTimer); clearInterval(dateTimer);
    if (document.activeElement === input) input.blur();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function toggle(){ openFlag ? close() : open(); }
  build();
  if (Q.get('console') === '1') setTimeout(open, 350);
  window.devi = { register: register, open: open, close: close, run: run };
})();
