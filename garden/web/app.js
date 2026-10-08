/* genome garden front end. a generic renderer: everything it shows is described by the python side.
   no libraries, no network calls except to this local server. */
(function () {
  'use strict';

  var WORLD_W = 160, WORLD_H = 100;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pref(key, dflt, set) {
    try {
      if (set !== undefined) { localStorage.setItem('gg.' + key, set); return set; }
      var v = localStorage.getItem('gg.' + key);
      return v == null ? dflt : v;
    } catch (e) { return set !== undefined ? set : dflt; }
  }
  function fmtNum(v) { return Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2); }

  // ── colour ramp: body hue 0..1 (green, ochre, rust, blue). the same ramp paints the ground. ──
  var STOPS = [[0, [63, 191, 110]], [0.33, [201, 178, 74]], [0.66, [196, 102, 63]], [1, [90, 120, 214]]];
  function rampRGB(h) {
    h = Math.max(0, Math.min(1, h));
    for (var i = 1; i < STOPS.length; i++) {
      if (h <= STOPS[i][0]) {
        var a = STOPS[i - 1], b = STOPS[i], t = (h - a[0]) / (b[0] - a[0]);
        return [a[1][0] + (b[1][0] - a[1][0]) * t, a[1][1] + (b[1][1] - a[1][1]) * t, a[1][2] + (b[1][2] - a[1][2]) * t];
      }
    }
    return STOPS[STOPS.length - 1][1];
  }
  function rgbStr(c) { return 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')'; }
  function ramp(h) { return rgbStr(rampRGB(h)); }
  var RAMP_BG = 'linear-gradient(to right,' + [0, 0.15, 0.33, 0.5, 0.66, 0.85, 1].map(ramp).join(',') + ')';

  var TRAIT_COLORS = { speed: '#55b6ff', size: '#c58bff', sense: '#ffd166', hue: '#ff8a65', efficiency: '#7be3a8' };
  var EXTRA_COLORS = ['#f78fb3', '#63cdda', '#f5cd79', '#a29bfe', '#b8e994', '#fab1a0'];
  function traitColor(name, i) { return TRAIT_COLORS[name] || EXTRA_COLORS[i % EXTRA_COLORS.length]; }

})();
