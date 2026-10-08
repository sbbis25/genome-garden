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

  // ── state ──────────────────────────────────────────────────────────────────────
  var S = {
    schema: null, frame: null, history: null, terrain: null, groundCv: null,
    sv: -1, tv: -1, hv: -1, histAt: 0,
    tool: 'food', pinned: null, hover: null, openGroup: 'harsh', tab: 'tune',
    view: pref('view', 'simple'), snippet: null, dragging: false, pendingSchema: false,
    creatures: new Map(), ghosts: [], preds: [], frameAt: 0, frameDur: 60,
    lastMsg: -1, firstFrame: true, hintStage: parseInt(pref('hint', '0'), 10) || 0, pulseId: null,
    watch: null, cardKey: '', errKey: '', scale: 1, statsAt: 0, chartsDirty: true, scienceBuilt: '',
    customBuilt: '', offline: 0
  };

  // ── network ────────────────────────────────────────────────────────────────────
  function getJSON(url) {
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }
  function post(cmd) {
    return fetch('/api/cmd', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) })
      .catch(function () {});
  }
  var pending = {}, sendTimer = 0;
  function sendSet(id, value) {
    pending[id] = value;
    if (!sendTimer) {
      sendTimer = setTimeout(function () {
        var p = pending; pending = {}; sendTimer = 0;
        Object.keys(p).forEach(function (k) { post({ type: 'set', id: k, value: p[k] }); });
      }, 60);
    }
  }

  function poll() {
    var watch = S.pinned != null ? S.pinned : (S.hover != null ? S.hover : '');
    getJSON('/frame?watch=' + watch).then(function (f) {
      S.offline = 0;
      $('#banner-offline').classList.remove('show');
      if (f && f.c) {
        try { onFrame(f); } catch (err) { if (window.console) console.error('frame error', err); }
      }
    }).catch(function () {
      S.offline++;
      if (S.offline > 6) $('#banner-offline').classList.add('show');
    }).then(function () { setTimeout(poll, 30); });
  }

  function fetchSchema() {
    getJSON('/api/schema').then(function (sc) {
      S.schema = sc; S.sv = sc.version;
      if (S.dragging) { S.pendingSchema = true; return; }
      buildAll();
    }).catch(function () {});
  }
  function fetchTerrain() {
    getJSON('/api/terrain').then(function (t) {
      S.tv = t.v;
      var cv = document.createElement('canvas');
      cv.width = t.gw; cv.height = t.gh;
      var ctx = cv.getContext('2d'), img = ctx.createImageData(t.gw, t.gh), base = [10, 16, 22];
      for (var i = 0; i < t.hue.length; i++) {
        var c = rampRGB(t.hue[i]);
        img.data[i * 4] = c[0] * 0.5 + base[0] * 0.5;
        img.data[i * 4 + 1] = c[1] * 0.5 + base[1] * 0.5;
        img.data[i * 4 + 2] = c[2] * 0.5 + base[2] * 0.5;
        img.data[i * 4 + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      S.groundCv = cv;
    }).catch(function () {});
  }
  function fetchHistory() {
    S.histAt = performance.now();
    getJSON('/api/history').then(function (h) {
      S.history = h; S.hv = h.v; S.chartsDirty = true;
    }).catch(function () {});
  }

  // ── frames ─────────────────────────────────────────────────────────────────────
  function posOf(e, now) {
    var k = Math.min(1, (now - e.t0) / S.frameDur);
    return { x: e.sx + (e.tx - e.sx) * k, y: e.sy + (e.ty - e.sy) * k };
  }

  function onFrame(f) {
    var now = performance.now();
    if (S.frame) S.frameDur = Math.max(30, Math.min(140, now - S.frameAt));
    S.frameAt = now;
    S.frame = f;

    var seen = new Set();
    for (var i = 0; i < f.c.length; i++) {
      var c = f.c[i], id = c[0];
      seen.add(id);
      var e = S.creatures.get(id);
      if (!e) {
        e = { id: id, sx: c[1], sy: c[2], tx: c[1], ty: c[2], t0: now, born: S.firstFrame ? -9999 : now, col: ramp(c[3]) };
        S.creatures.set(id, e);
      } else {
        var p = posOf(e, now);
        e.sx = p.x; e.sy = p.y; e.tx = c[1]; e.ty = c[2]; e.t0 = now;
      }
      e.hue = c[3]; e.size = c[4]; e.h = c[5];
    }
    S.creatures.forEach(function (e, id) {
      if (!seen.has(id)) {
        var p = posOf(e, now);
        if (S.ghosts.length < 90) S.ghosts.push({ x: p.x, y: p.y, size: e.size, col: e.col, t: now });
        S.creatures.delete(id);
      }
    });
    for (var j = 0; j < f.p.length; j++) {
      var q = f.p[j], pr = S.preds[j];
      if (!pr) { S.preds[j] = { sx: q[0], sy: q[1], tx: q[0], ty: q[1], t0: now }; }
      else { var pp = posOf(pr, now); pr.sx = pp.x; pr.sy = pp.y; pr.tx = q[0]; pr.ty = q[1]; pr.t0 = now; }
    }
    S.preds.length = f.p.length;

    $('#stat-n').textContent = f.n;
    $('#stat-gen').textContent = f.s2 ? f.s2.maxgen : 0;
    $('#t-div').textContent = f.s2 ? Math.round(f.s2.div * 100) + '%' : '-';
    $('#t-clu').textContent = f.s2 ? f.s2.clusters : '-';
    $('#t-gen').textContent = f.s2 ? f.s2.maxgen : '-';
    $$('#speed-seg button').forEach(function (b) {
      var m = parseFloat(b.dataset.mult);
      b.setAttribute('aria-pressed', String(f.paused ? m === 0 : m === f.mult));
    });
    $('#achieved').textContent = f.paused ? 'paused' : (f.x < f.mult * 0.85 ? 'x' + f.x.toFixed(1) + ' (max)' : '');
    $('#worldwrap').classList.toggle('paused', !!f.paused);

    if ($('#caption-text').textContent !== f.caption) $('#caption-text').textContent = f.caption;

    f.msgs.forEach(function (m) {
      if (m[0] > S.lastMsg) { if (!S.firstFrame) toast(m[1]); S.lastMsg = m[0]; }
    });
    S.firstFrame = false;

    if (f.sv !== S.sv) fetchSchema();
    if (f.tv !== S.tv) fetchTerrain();
    if (f.hv !== S.hv && now - S.histAt > 400) fetchHistory();

    updateBanners(f);
    S.watch = f.watch;
    updateCard(now);
    if (f.stats && S.view === 'full' && now - S.statsAt > 250) { S.statsAt = now; drawHistograms(); }
  }

  function updateBanners(f) {
    var errs = (f.errors || []).slice();
    if (f.load_error) errs.unshift(f.load_error);
    var key = JSON.stringify(errs) + '|' + f.restart;
    if (key === S.errKey) return;
    S.errKey = key;
    var b = $('#banner-error');
    if (errs.length) {
      var e = errs[0];
      var where = e.line ? 'workshop.py line ' + e.line : (e.where || 'workshop.py');
      var more = errs.length > 1 ? ' (+' + (errs.length - 1) + ' more)' : '';
      var tail = f.load_error ? ' Your last working version keeps running.' : ' That hook fell back to its default behaviour.';
      $('#banner-error-text').innerHTML = '<b>' + esc(where) + ':</b> ' + esc(e.msg) + more + '.' + tail;
      b.classList.add('show');
    } else { b.classList.remove('show'); }
    $('#code-dot').classList.toggle('on', errs.length > 0);
    $('#banner-restart').classList.toggle('show', !!f.restart);
    if (S.tab === 'code') renderCode();
  }

  // ── toasts and hints ───────────────────────────────────────────────────────────
  function toast(text) {
    var box = $('#toasts');
    var t = el('div', 'toast'); t.textContent = text;
    box.appendChild(t);
    while (box.children.length > 4) box.removeChild(box.firstChild);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 5000);
  }
  var hintTimer = 0;
  function showHint(text, ms) {
    var h = $('#hint');
    h.textContent = text; h.classList.remove('gone');
    clearTimeout(hintTimer);
    if (ms) hintTimer = setTimeout(function () { h.classList.add('gone'); }, ms);
  }
  function advanceHint(stage) {
    if (S.hintStage >= stage) return;
    S.hintStage = stage; pref('hint', '0', String(stage));
    if (stage === 1) {
      S.pulseId = 'predators';
      showHint('Now open "How harsh is the world?" and drag Predators up. Watch what happens.', 0);
      buildTune();
    } else if (stage === 2) {
      S.pulseId = null; $('#hint').classList.add('gone'); buildTune();
    }
  }

})();
