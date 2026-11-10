(function(){
  "use strict";
  function spark(s, d){
    return '<svg class="dx-spark" style="--s:' + s + 'px;--d:' + (d || 0) + 's" viewBox="0 0 24 24"><path fill="currentColor" d="M12 0c.6 7 5 11.4 12 12-7 .6-11.4 5-12 12-.6-7-5-11.4-12-12C7 11.4 11.4 7 12 0z"/></svg>';
  }
  function globe(s){
    var m = '';
    for (var i = 0; i < 4; i++) m += '<g class="mer" style="--i:' + i + '"><ellipse cx="60" cy="60" rx="56" ry="56"/></g>';
    return '<svg class="dx-globe" width="' + s + '" height="' + s + '" viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.4" vector-effect="non-scaling-stroke">' +
      '<circle cx="60" cy="60" r="56"/><path d="M4 60h112M9 36h102M9 84h102M28 14h64M28 106h64"/>' + m +
      '<ellipse cx="60" cy="60" rx="60" ry="17" transform="rotate(-24 60 60)" stroke-dasharray="2 5"/></svg>';
  }
  function arrow(s, rot){
    var p = 'M14 100H176M104 28L176 100L104 172';
    return '<svg class="dx-arrow" width="' + s + '" height="' + s + '" viewBox="0 0 200 200" style="transform:rotate(' + rot + 'deg)">' +
      '<g fill="none" stroke="currentColor" stroke-width="22" stroke-linejoin="miter" stroke-miterlimit="10">' +
      '<path d="' + p + '" transform="translate(12 12)" opacity=".22"/>' +
      '<path d="' + p + '"/></g></svg>';
  }

  var QR_URL = 'https://www.youtube.com/watch?v=uBDyQVQu_vE';
  var QR_ROWS = ["111111100101101000111101001111111", "100000100001100100101100001000001", "101110101101001100010110101011101", "101110101100100000100101101011101", "101110101000011111001010001011101", "100000101011011001010011101000001", "111111101010101010101010101111111", "000000001011101010011111000000000", "101111100110111001010011001111100", "001101001011011011111011001101100", "101000111001111111000010100010110", "001000010101010001111001010011110", "100010111110001110011111110001010", "101011011100010101100100111000111", "101100111001001110001110011110010", "010101001000111100000110011001100", "101011110000111101100010110110101", "101101000110011010110111111101111", "101100110001000100101100010110110", "011010010001001110001111010111110", "010000101001111100100100110001011", "110100000110110111001110010001101", "101000110011101001010110110000110", "100100001000110010011101011101111", "111110101110000011010010111111001", "000000001011000011011011100010111", "111111100111100111000011101010100", "100000101100100101110001100011101", "101110101011111110001110111111010", "101110101011101100100101010010001", "101110101111001111001111111101100", "100000100011110100000111011011100", "111111101110011101000011111101110"];
  var QR_PATH = (function(){
    var d = '';
    QR_ROWS.forEach(function(row, y){
      var m, re = /1+/g;
      while ((m = re.exec(row))) d += 'M' + m.index + ' ' + y + 'h' + m[0].length + 'v1h-' + m[0].length + 'z';
    });
    return d;
  })();
  function qr(s){
    var n = QR_ROWS.length, Q = 3, T = n + Q * 2;
    return '<svg class="dx-qr" width="' + 50 + '" height="' + 50 + '" viewBox="0 0 ' + T + ' ' + T + '">' +
      '<rect width="' + T + '" height="' + T + '" fill="currentColor"/>' +
      '<path transform="translate(' + Q + ' ' + Q + ')" fill="#000" d="' + QR_PATH + '"/></svg>';
  }
  function dots(n){ var h = ''; for (var i = 0; i < n; i++) h += '<i style="--i:' + i + '"></i>'; return '<div class="dx-dots">' + h + '</div>'; }
  function el(cls, html){
    var d = document.createElement('div');
    d.className = 'dx ' + cls;
    d.setAttribute('aria-hidden', 'true');
    d.setAttribute('data-dx', '');
    d.innerHTML = html;
    return d;
  }
  function once(host, sel){ return host && !host.querySelector(':scope > ' + sel); }

  function init(){
    var hero = document.querySelector('.hero');
    if (once(hero, '.dx-hero-r')){
      hero.appendChild(el('dx-hero-r',
        '<div class="dx-row"><span class="dx-num fill">03</span>' + spark(18, 0) + '<span class="dx-x">✕</span>' + spark(14, 1.2) + '<span class="dx-num">26</span></div>' +
        '<div class="dx-row end" style="margin-top:14px">' + globe(130) +
          '<div class="dx-col">' + qr(117) + '<span class="dx-label">SIG // 0x2A</span></div></div>' +
        '<div class="dx-hazard" style="margin-top:14px"></div>' +
        '<div class="dx-row" style="justify-content:space-between;margin-top:10px"><span class="dx-jp">サイバーパンク</span><span class="dx-label">V.26 // TSK</span></div>'));
      hero.appendChild(el('dx-hero-l',
        '<div class="dx-row" style="align-items:flex-start;gap:16px"><span class="dx-vert">DEViNACE</span>' +
        '<div class="dx-col" style="gap:14px">' + arrow(120, 45) + '<span class="dx-outline" style="--fs:40px">XXX</span>' + dots(5) + '<span class="dx-label">LINK // STABLE</span></div></div>'));
    }

    var side = document.querySelector('.work-side');
    if (once(side, '.dx-work')){
      side.appendChild(el('dx-work',
        '<div class="dx-row"><span class="dx-num fill">01</span><span class="dx-num">02</span><span class="dx-num">03</span>' + spark(16, .5) + '</div>' +
        '<div class="dx-wave" style="height:84px"></div>' +
        '<div class="dx-hazard" style="--h:12px"></div>' +
        '<div class="dx-bar" style="--p:62%"></div>' +
        '<div class="dx-row" style="justify-content:space-between">' + dots(4) + '<span class="dx-label">LOG.STREAM // TODO</span></div>'));
    }

    var home = document.getElementById('app-home');
    function divider(beforeId, html){
      var sec = document.getElementById(beforeId);
      if (!sec || (sec.previousElementSibling && sec.previousElementSibling.hasAttribute('data-dx'))) return;
      sec.parentNode.insertBefore(el('dx-div', html), sec);
    }
    if (home){
      divider('stack',
        '<span class="dx-num fill">02</span>' + spark(18, 0) + '<span class="dx-outline" style="--fs:34px">XXX</span>' + spark(12, 1) +
        '<div class="dx-hazard"></div><span class="dx-barcode"></span><span class="dx-label">SIGNAL // 0x1A</span>');
      divider('about',
        '<span class="dx-label">NODE // 0x2A</span>' + dots(5) + '<div class="dx-bar" style="--p:40%;flex:1"></div>' + globe(46) + spark(16, .8) + '<span class="dx-jp">サイバーパンク</span>');
      divider('contact',
        '<div class="dx-hazard" style="--h:18px"></div>' + spark(20, 0) + '<span class="dx-num">05</span>' + spark(12, 1.4) + '<span class="dx-label">OPEN CHANNEL</span><span class="dx-barcode"></span>');
    }

    var por = document.querySelector('.portrait');
    if (once(por, '.dx-portrait')){
      por.appendChild(el('dx-portrait',
        '<div class="cross"></div><div class="g">' + globe(230) + '</div>' +
        '<div class="s">' + spark(16, .3) + '</div><div class="v"><span class="dx-vert">DEViANCE</span></div>' +
        '<div class="q">' + qr(117) + '</div>'));
    }

  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
