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

})();
