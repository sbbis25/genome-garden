/* genome garden front end. a generic renderer: everything it shows is described by the python side.
   no libraries, no network calls except to this local server. */
(function () {
  'use strict';

  var WORLD_W = 160, WORLD_H = 100;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  var REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

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

  function placeIndicator(group, activeSel) {
    var a = group.querySelector(activeSel);
    if (!a) return;
    if (!a.offsetWidth) { group.dataset.placed = ''; return; }
    var first = !group.dataset.placed;
    if (first) group.classList.add('still');
    group.style.setProperty('--ix', a.offsetLeft + 'px');
    group.style.setProperty('--iw', a.offsetWidth + 'px');
    if (first) { void group.offsetWidth; group.classList.remove('still'); group.dataset.placed = '1'; }
  }
  function placeIndicators() {
    placeIndicator($('.tabs'), 'button[aria-selected="true"]');
    placeIndicator($('#speed-seg'), 'button[aria-pressed="true"]');
  }

  // ── colour ramp: body hue 0..1 as natural dyes (sage, straw, clay, slate). the same ramp tints the ground. ──
  var STOPS = [[0, [111, 159, 120]], [0.33, [201, 168, 92]], [0.66, [185, 116, 90]], [1, [112, 136, 187]]];
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
  var T = {};
  function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function cssRGB(name) { return cssVar(name).split(',').map(function (n) { return parseFloat(n); }); }
  function readTheme() {
    T = {
      matte: cssVar('--wash'), grid: cssVar('--grid'), food: cssVar('--food'), pred: cssVar('--pred'), predEdge: cssVar('--pred-edge'),
      predRing: cssVar('--pred-ring'), edge: cssVar('--creature-edge'), nose: cssVar('--creature-nose'), hover: cssVar('--hover-ring'),
      pin: cssVar('--accent'), sense: cssVar('--sense-ring'), meteor: cssVar('--meteor'), axisText: cssVar('--axis-text'),
      axisLine: cssVar('--axis-line'), mark: cssVar('--mark'), pop: cssVar('--series-pop'), foodLine: cssVar('--series-food'),
      base: cssRGB('--world-base'), groundAmt: parseFloat(cssVar('--ground-amount')), tint: cssRGB('--body-tint'),
      bodyAmt: parseFloat(cssVar('--body-amount')), rampLift: parseFloat(cssVar('--ramp-lift')),
      trait: { speed: cssVar('--trait-speed'), size: cssVar('--trait-size'), sense: cssVar('--trait-sense'), hue: cssVar('--trait-hue'), efficiency: cssVar('--trait-efficiency') },
      extra: [1, 2, 3, 4, 5, 6].map(function (i) { return cssVar('--extra-' + i); })
    };
  }
  readTheme();
  function mixRGB(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function body(h) { return rgbStr(mixRGB(rampRGB(h), T.tint, T.bodyAmt)); }
  function lifted(h) { return rgbStr(mixRGB(rampRGB(h), [255, 255, 255], T.rampLift)); }
  var RAMP_BG = 'linear-gradient(to right,' + [0, 0.15, 0.33, 0.5, 0.66, 0.85, 1].map(ramp).join(',') + ')';

  function traitColor(name, i) { return T.trait[name] || T.extra[i % T.extra.length]; }

  // ── state ──────────────────────────────────────────────────────────────────────
  var S = {
    schema: null, frame: null, history: null, terrain: null, groundCv: null,
    sv: -1, tv: -1, hv: -1, histAt: 0,
    tool: 'food', pinned: null, hover: null, openGroup: 'harsh', tab: 'tune',
    view: pref('view', 'simple'), snippet: null, dragging: false, pendingSchema: false,
    creatures: new Map(), ghosts: [], preds: [], frameAt: 0, frameDur: 60,
    lastMsg: -1, firstFrame: true, hintStage: parseInt(pref('hint', '0'), 10) || 0, pulseId: null,
    watch: null, cardKey: '', errKey: '', scale: 1, statsAt: 0, chartsDirty: true, scienceBuilt: '',
    customBuilt: '', offline: 0, speedKey: '', hist: {}, histDirty: false, cardId: null
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
      S.tv = t.v; S.terrain = t;
      buildGround();
    }).catch(function () {});
  }
  function buildGround() {
    var t = S.terrain; if (!t) return;
    var cv = document.createElement('canvas');
    cv.width = t.gw; cv.height = t.gh;
    var ctx = cv.getContext('2d'), img = ctx.createImageData(t.gw, t.gh);
    for (var i = 0; i < t.hue.length; i++) {
      var c = mixRGB(rampRGB(t.hue[i]), T.base, T.groundAmt);
      img.data[i * 4] = c[0];
      img.data[i * 4 + 1] = c[1];
      img.data[i * 4 + 2] = c[2];
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    S.groundCv = cv;
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
        e = { id: id, sx: c[1], sy: c[2], tx: c[1], ty: c[2], t0: now, born: S.firstFrame ? -9999 : now, col: body(c[3]) };
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
    var sk = String(f.paused ? 0 : f.mult);
    if (sk !== S.speedKey) { S.speedKey = sk; placeIndicator($('#speed-seg'), 'button[aria-pressed="true"]'); }
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
    if (f.stats && S.view === 'full' && now - S.statsAt > 250) { S.statsAt = now; updateHistograms(); }
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
    setTimeout(function () {
      t.classList.add('leaving');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 260);
    }, 4800);
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

  // ── building the left panels from the python schema ───────────────────────────
  function buildAll() {
    buildTune(); buildPresets(); renderCode(); buildScience(); buildCustomCharts();
  }

  function fmtVal(c, v) {
    if (c.ramp) return '<span class="swatch" style="background:' + ramp(v) + '"></span>';
    switch (c.fmt) {
      case 'int': return String(Math.round(v));
      case 'pct': return Math.round(v * 100) + '%';
      case 'pct1': return (v * 100).toFixed(1) + '%';
      case 'signed': return (v > 0 ? '+' : '') + v.toFixed(2);
      default: return Math.abs(c.step) >= 1 ? String(Math.round(v)) : v.toFixed(2);
    }
  }

  function codeButton(c) {
    if (!c.code) return null;
    var b = el('button', 'code-btn', '&lt;/&gt;');
    b.title = 'Show the Python for this';
    b.setAttribute('aria-label', 'Show Python for ' + c.label);
    b.onclick = function () { S.snippet = { title: c.label, code: c.code }; switchTab('code'); };
    return b;
  }

  function buildControl(c) {
    var wrap = el('div', 'ctl' + (c.overridden ? ' overridden' : '') + (S.pulseId === c.id ? ' pulse' : ''));
    var id = 'ctl-' + c.id;
    var head = el('div', 'ctl-head');
    var lab = el('label'); lab.textContent = c.label; lab.htmlFor = id;
    head.appendChild(lab);
    if (c.kind === 'slider') {
      var val = el('span', 'val'); val.innerHTML = fmtVal(c, c.value); head.appendChild(val);
    }
    var cb = codeButton(c); if (cb) head.appendChild(cb);
    wrap.appendChild(head);

    if (c.kind === 'slider') {
      var inp = el('input'); inp.type = 'range'; inp.id = id;
      inp.min = c.lo; inp.max = c.hi; inp.step = c.step; inp.value = c.value;
      if (c.ramp) { inp.className = 'ramp'; inp.style.setProperty('--ramp-bg', RAMP_BG); }
      var fill = function () {
        var v = (inp.value - c.lo) / (c.hi - c.lo) * 100, z = c.lo < 0 && c.hi > 0 ? (0 - c.lo) / (c.hi - c.lo) * 100 : 0;
        inp.style.setProperty('--a', Math.min(z, v) + '%'); inp.style.setProperty('--b', Math.max(z, v) + '%');
      };
      fill();
      inp.addEventListener('pointerdown', function () { S.dragging = true; });
      inp.addEventListener('input', function () {
        var v = parseFloat(inp.value);
        c.value = v; val.innerHTML = fmtVal(c, v); fill();
        sendSet(c.id, v);
        if (c.id === 'predators') advanceHint(2);
        scheduleCode();
      });
      wrap.appendChild(inp);
    } else if (c.kind === 'choice') {
      var seg = el('div', 'seg'); seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', c.label);
      c.options.forEach(function (o) {
        var b = el('button'); b.textContent = (c.labels && c.labels[o]) || o;
        b.setAttribute('aria-pressed', String(c.value === o));
        b.onclick = function () {
          c.value = o;
          $$('button', seg).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
          b.setAttribute('aria-pressed', 'true');
          post({ type: 'set', id: c.id, value: o }); scheduleCode();
        };
        seg.appendChild(b);
      });
      wrap.appendChild(seg);
    } else if (c.kind === 'toggle') {
      var sw = el('div', 'switch');
      var tb = el('button'); tb.setAttribute('role', 'switch'); tb.id = id; tb.setAttribute('aria-label', c.label);
      tb.setAttribute('aria-checked', String(!!c.value));
      tb.onclick = function () {
        c.value = !c.value; tb.setAttribute('aria-checked', String(c.value));
        post({ type: 'set', id: c.id, value: c.value }); scheduleCode();
      };
      sw.appendChild(tb); wrap.appendChild(sw);
    }
    if (c.help) wrap.appendChild(el('div', 'ctl-help', esc(c.help)));
    if (c.overridden) wrap.appendChild(el('span', 'badge', 'workshop.py is controlling this'));
    return wrap;
  }

  function buildTune() {
    if (!S.schema) return;
    var panel = $('#panel-tune'), scroll = panel.scrollTop;
    panel.innerHTML = '';
    S.schema.groups.forEach(function (g) {
      var grp = el('div', 'group' + (g.id === S.openGroup ? ' open' : '')); grp.dataset.id = g.id;
      var head = el('button', 'group-head', '<span class="chev"></span><span>' + esc(g.title) + '</span>');
      head.setAttribute('aria-expanded', String(g.id === S.openGroup));
      head.onclick = function () {
        S.openGroup = S.openGroup === g.id ? null : g.id;
        $$('.group', panel).forEach(function (x) {
          x.classList.toggle('open', x.dataset.id === S.openGroup);
          $('.group-head', x).setAttribute('aria-expanded', String(x.dataset.id === S.openGroup));
        });
      };
      var body = el('div', 'group-body'), inner = el('div', 'group-inner'), pad = el('div', 'group-pad');
      body.appendChild(inner); inner.appendChild(pad);
      g.controls.forEach(function (c) { pad.appendChild(buildControl(c)); });
      if (g.actions.length) {
        var a = el('div', 'actions');
        g.actions.forEach(function (act) {
          var b = el('button', 'btn' + (act.kind === 'action' ? ' danger' : ''));
          b.textContent = act.label; b.title = act.help || '';
          b.onclick = function () {
            post(act.kind === 'action' ? { type: 'action', id: act.id } : { type: 'button', index: parseInt(act.id, 10) });
          };
          a.appendChild(b);
        });
        pad.appendChild(a);
      }
      grp.appendChild(head); grp.appendChild(body); panel.appendChild(grp);
    });
    panel.scrollTop = scroll;
  }

  function buildPresets() {
    var sel = $('#preset-select');
    sel.innerHTML = '<option value="">Presets...</option>';
    var panel = $('#panel-presets');
    panel.innerHTML = '<p class="tip">Each scenario sets a handful of sliders and restarts the world. The code shows how you would write the same thing in <span class="mono">workshop.py</span>.</p>';
    S.schema.presets.forEach(function (p) {
      var o = el('option'); o.value = p.id; o.textContent = p.label; sel.appendChild(o);
      var card = el('div', 'preset', '<h4>' + esc(p.label) + '</h4><p>' + esc(p.blurb) + '</p>');
      var row = el('div', 'row');
      var run = el('button', 'btn primary'); run.textContent = 'Run it';
      run.onclick = function () { runPreset(p.id); };
      var show = el('button', 'btn'); show.textContent = 'Show code';
      var pre = el('pre', 'code'); pre.textContent = p.code; pre.style.display = 'none'; pre.style.marginTop = '10px';
      show.onclick = function () {
        var on = pre.style.display === 'none'; pre.style.display = on ? 'block' : 'none';
        show.textContent = on ? 'Hide code' : 'Show code';
      };
      row.appendChild(run); row.appendChild(show);
      card.appendChild(row); card.appendChild(pre); panel.appendChild(card);
    });
  }

  function runPreset(id) {
    post({ type: 'preset', id: id }); resetClientWorld();
  }
  function resetClientWorld() {
    S.creatures.clear(); S.ghosts.length = 0; S.pinned = null; S.hover = null; S.firstFrame = true;
  }

  // ── code tab ───────────────────────────────────────────────────────────────────
  function pyVal(v) {
    if (typeof v === 'boolean') return v ? 'True' : 'False';
    if (typeof v === 'number') return String(Number(v.toFixed(4)));
    return JSON.stringify(v);
  }
  var codeTimer = 0;
  function scheduleCode() {
    if (S.tab !== 'code') return;
    clearTimeout(codeTimer); codeTimer = setTimeout(renderCode, 200);
  }
  function renderCode() {
    if (!S.schema) return;
    var panel = $('#panel-code'), scroll = panel.scrollTop;
    var h = '<div class="sec">Hooks in workshop.py</div><div class="hookrow">';
    Object.keys(S.schema.hooks).forEach(function (n) {
      var k = S.schema.hooks[n];
      h += '<span class="hook ' + (k.failed ? 'bad' : (k.defined ? 'on' : '')) + '" title="' +
        (k.failed ? 'raised an error, using the default' : (k.defined ? 'your code is running' : 'not defined: default behaviour')) +
        '">' + n + (k.failed ? ' (error)' : '') + '</span>';
    });
    h += '</div><p class="tip" style="margin-top:8px">Tinted means your code is running. Grey means the built-in behaviour. Red means it hit an error.</p>';

    var errs = S.frame ? (S.frame.errors || []).slice() : [];
    if (S.frame && S.frame.load_error) errs.unshift(S.frame.load_error);
    if (errs.length) {
      h += '<div class="sec">Problems</div>';
      errs.forEach(function (e) {
        h += '<div class="err"><b>' + esc(e.line ? 'Line ' + e.line : e.where || 'workshop.py') + ' in ' + esc(e.where || 'workshop.py') + '</b><br>' + esc(e.msg) +
          (e.src ? '<code>' + esc(e.src) + '</code>' : '') + '</div>';
      });
    }

    var changed = [];
    S.schema.groups.forEach(function (g) {
      g.controls.forEach(function (c) {
        if (c.value !== c.default) changed.push('    ' + JSON.stringify(c.id) + ': ' + pyVal(c.value) + ',');
      });
    });
    h += '<div class="sec">Your slider changes as Python</div>';
    var text = changed.length ? 'SETTINGS = {\n' + changed.join('\n') + '\n}' : '# Nothing changed yet. Move a slider.';
    h += '<div class="codebox"><pre class="code" id="code-settings">' + esc(text) + '</pre><button class="btn copy" data-copy="code-settings">Copy</button></div>';
    h += '<p class="tip">Paste this into <span class="mono">workshop.py</span> to start with these values every time.</p>';

    if (S.snippet) {
      h += '<div class="sec">' + esc(S.snippet.title) + ' as code</div>';
      h += '<div class="codebox"><pre class="code" id="code-snippet">' + esc(S.snippet.code) + '</pre><button class="btn copy" data-copy="code-snippet">Copy</button></div>';
      h += '<p class="tip">Paste into <span class="mono">workshop.py</span> and save. The running world updates.</p>';
    } else {
      h += '<p class="tip">Click the <span class="mono">&lt;/&gt;</span> button next to any slider to see the Python behind it.</p>';
    }
    panel.innerHTML = h;
    $$('.copy', panel).forEach(function (b) {
      b.onclick = function () {
        var txt = $('#' + b.dataset.copy).textContent;
        try { navigator.clipboard.writeText(txt); b.textContent = 'Copied'; } catch (e) { b.textContent = 'Select and copy'; }
        setTimeout(function () { b.textContent = 'Copy'; }, 1200);
      };
    });
    panel.scrollTop = scroll;
  }

  function switchTab(name) {
    S.tab = name;
    $$('.tabs button').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.tab === name)); b.tabIndex = b.dataset.tab === name ? 0 : -1; });
    placeIndicator($('.tabs'), 'button[aria-selected="true"]');
    ['tune', 'code', 'presets'].forEach(function (n) { $('#panel-' + n).hidden = n !== name; });
    if (name === 'code') renderCode();
  }

  // ── creature card ──────────────────────────────────────────────────────────────
  function updateCard(now) {
    var d = S.watch;
    var key = d ? [d.id, d.gone, d.age, d.energy, d.kids, S.pinned === d.id].join(',') : 'none' + S.pinned;
    if (key === S.cardKey) return;
    S.cardKey = key;
    var box = $('#creature');
    var cid = d ? d.id : null;
    if (cid !== S.cardId) { S.cardId = cid; box.classList.remove('swap'); void box.offsetWidth; box.classList.add('swap'); }
    if (!d) { box.innerHTML = '<h3>Creature</h3><div class="empty">Hover over a creature to read its DNA. Click one to pin it.</div>'; return; }
    if (d.gone) {
      box.innerHTML = '<h3>Creature #' + d.id + '</h3><div class="empty">This creature has died.</div>';
      if (S.pinned === d.id) setTimeout(function () { if (S.pinned === d.id) S.pinned = null; }, 1500);
      return;
    }
    var h = '<h3>Creature #' + d.id + (S.pinned === d.id ? ' <span class="pin">PINNED</span>' : '') + '</h3>';
    h += '<div class="facts"><div><b>' + d.gen + '</b><span>generation</span></div><div><b>' + d.age + 's</b><span>age</span></div>' +
      '<div><b>' + d.energy + '</b><span>energy</span></div><div><b>' + d.kids + '</b><span>babies</span></div></div>';
    h += '<div class="dna">';
    d.genes.forEach(function (g) {
      var letters = d.dna.slice(g.a, g.b).split('').map(function (ch) { return '<span class="b' + esc(ch) + '">' + esc(ch) + '</span>'; }).join('');
      var norm = Math.max(0, Math.min(1, (g.value - g.lo) / ((g.hi - g.lo) || 1)));
      h += '<div class="gseg"><div class="gn"><span>' + esc(g.name) + '</span><b>' + fmtNum(g.value) + '</b></div><div class="bases">' + letters +
        '</div><div class="bar"><i style="width:' + Math.round(norm * 100) + '%' + (g.name === 'hue' ? ';background:' + lifted(g.value) : '') + '"></i></div></div>';
    });
    h += '</div>';
    h += '<p class="tip" style="margin:10px 0 0">Camouflage gap vs ground: <b class="mono">' + d.contrast.toFixed(2) + '</b> (lower hides better)' +
      (d.parent ? '. Parent #' + d.parent : '') + '.</p>';
    box.innerHTML = h;
  }

  // ── charts ─────────────────────────────────────────────────────────────────────
  function sizeCanvas(cv) {
    var w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return null;
    if (cv.width !== Math.round(w * DPR) || cv.height !== Math.round(h * DPR)) { cv.width = Math.round(w * DPR); cv.height = Math.round(h * DPR); }
    var ctx = cv.getContext('2d');
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx: ctx, w: w, h: h };
  }

  function lineChart(cv, series, o) {
    var g = sizeCanvas(cv); if (!g) return;
    var ctx = g.ctx, w = g.w, h = g.h, padL = 30, padB = 4, padT = 6;
    var n = 0, lo = o.min, hi = o.max;
    series.forEach(function (s) { n = Math.max(n, s.data.length); });
    if (lo == null || hi == null) {
      var mn = Infinity, mx = -Infinity;
      series.forEach(function (s) { s.data.forEach(function (v) { if (v < mn) mn = v; if (v > mx) mx = v; }); });
      if (!isFinite(mn)) { mn = 0; mx = 1; }
      if (mx === mn) { mx = mn + 1; }
      lo = lo == null ? Math.min(0, mn) : lo; hi = hi == null ? mx : hi;
    }
    ctx.font = '11px "Chivo Mono", ui-monospace, Menlo, Consolas, monospace';
    ctx.fillStyle = T.axisText; ctx.strokeStyle = T.axisLine; ctx.lineWidth = 1;
    for (var i = 0; i <= 2; i++) {
      var y = padT + (h - padT - padB) * i / 2;
      ctx.beginPath(); ctx.moveTo(padL, y + 0.5); ctx.lineTo(w, y + 0.5); ctx.stroke();
      var label = hi - (hi - lo) * i / 2;
      ctx.fillText(Math.abs(hi) >= 10 ? String(Math.round(label)) : label.toFixed(1), 0, y + 4);
    }
    if (n < 2) return;
    series.forEach(function (s) {
      ctx.strokeStyle = s.color; ctx.lineWidth = 1.8; ctx.beginPath();
      s.data.forEach(function (v, k) {
        var x = padL + (w - padL - 2) * k / (n - 1);
        var y = padT + (h - padT - padB) * (1 - (v - lo) / ((hi - lo) || 1));
        if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });
  }

  function drawCharts() {
    var hst = S.history; if (!hst || S.view !== 'full') return;
    var names = Object.keys(hst.traits);
    lineChart($('#ch-traits'), names.map(function (nm, i) { return { data: hst.traits[nm], color: traitColor(nm, i) }; }), { min: 0, max: 1 });
    var mx = 10;
    hst.pop.concat(hst.food).forEach(function (v) { if (v > mx) mx = v; });
    lineChart($('#ch-pop'), [{ data: hst.food, color: T.foodLine }, { data: hst.pop, color: T.pop }], { min: 0, max: mx });
    $$('#custom-charts canvas').forEach(function (cv, i) {
      var c = hst.custom[i]; if (!c) return;
      lineChart(cv, c.series.map(function (d, k) { return { data: d, color: T.extra[(k + i) % T.extra.length] }; }), {});
    });
  }

  function buildCustomCharts() {
    var box = $('#custom-charts'), n = S.schema.chart_count || 0;
    var titles = (S.history && S.history.custom) ? S.history.custom.map(function (c) { return c.title; }) : [];
    var key = n + '|' + titles.join('|');
    if (key === S.customBuilt && $$('canvas', box).length === n) return;
    S.customBuilt = key; box.innerHTML = '';
    for (var i = 0; i < n; i++) {
      var card = el('div', 'card chartcard', '<h4>' + esc(titles[i] || 'Custom chart') + '</h4><canvas></canvas>');
      card.style.marginTop = '12px'; box.appendChild(card);
    }
    S.chartsDirty = true;
  }

  function buildScience() {
    var genes = S.schema.genes, key = genes.map(function (g) { return g.name + g.lo + g.hi; }).join('|');
    if (key === S.scienceBuilt) return;
    S.scienceBuilt = key;
    var box = $('#science'); box.innerHTML = '';
    genes.forEach(function (g) {
      var c = el('div', 'card hcard',
        '<div class="ht"><span>' + esc(g.name) + '</span><b class="mono" data-mean="' + esc(g.name) + '"></b></div><canvas data-gene="' + esc(g.name) +
        '"></canvas><div class="hs"><span>' + fmtNum(g.lo) + '</span><span>' + fmtNum(g.hi) + '</span></div>');
      c.title = g.desc || g.name;
      box.appendChild(c);
    });
    var lg = $('#lgd-traits'); lg.innerHTML = '';
    genes.forEach(function (g, i) {
      lg.appendChild(el('span', null, '<i style="background:' + traitColor(g.name, i) + '"></i>' + esc(g.name)));
    });
  }

  function updateHistograms() {
    var st = S.frame && S.frame.stats; if (!st || !S.schema) return;
    Object.keys(st).forEach(function (name) {
      var d = st[name], h = S.hist[name];
      if (!h) h = S.hist[name] = { cur: d.bins.map(function () { return 0; }), mean: d.mean, lo: d.lo, hi: d.hi };
      h.tgt = d.bins; h.tmean = d.mean; h.lo = d.lo; h.hi = d.hi;
    });
    S.histDirty = true;
  }

  function animateHistograms() {
    if (!S.histDirty) return;
    var moving = false, k = REDUCED ? 1 : 0.2;
    $$('#science canvas').forEach(function (cv, idx) {
      var name = cv.dataset.gene, h = S.hist[name]; if (!h || !h.tgt) return;
      var mx = 1;
      for (var i = 0; i < h.cur.length; i++) {
        var diff = h.tgt[i] - h.cur[i];
        if (Math.abs(diff) > 0.05) { h.cur[i] += diff * k; moving = true; } else { h.cur[i] = h.tgt[i]; }
        if (h.cur[i] > mx) mx = h.cur[i];
      }
      var md = h.tmean - h.mean;
      if (Math.abs(md) > (h.hi - h.lo) * 0.002) { h.mean += md * k; moving = true; } else { h.mean = h.tmean; }
      var g = sizeCanvas(cv); if (!g) return;
      var ctx = g.ctx, bw = g.w / h.cur.length;
      h.cur.forEach(function (b, i) {
        var bh = (g.h - 4) * b / mx;
        ctx.fillStyle = name === 'hue' ? lifted((i + 0.5) / h.cur.length) : traitColor(name, idx);
        ctx.globalAlpha = 0.78;
        ctx.fillRect(i * bw + 1, g.h - bh, bw - 2, bh);
      });
      ctx.globalAlpha = 1;
      var mxp = (h.mean - h.lo) / ((h.hi - h.lo) || 1) * g.w;
      ctx.fillStyle = T.mark; ctx.fillRect(Math.max(0, Math.min(g.w - 2, mxp - 1)), 0, 2, g.h);
      var m = $('[data-mean="' + name + '"]'); if (m) m.textContent = fmtNum(h.mean);
    });
    S.histDirty = moving;
  }

  // ── the world canvas ───────────────────────────────────────────────────────────
  var cv = $('#world'), ctx = cv.getContext('2d');

  function fitCanvas() {
    var wrap = $('#worldwrap'), ww = wrap.clientWidth, wh = wrap.clientHeight;
    if (!ww || !wh) return;
    var scale = Math.min(ww / WORLD_W, wh / WORLD_H), cw = WORLD_W * scale, ch = WORLD_H * scale;
    cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
    cv.style.left = ((ww - cw) / 2) + 'px'; cv.style.top = ((wh - ch) / 2) + 'px';
    cv.width = Math.round(cw * DPR); cv.height = Math.round(ch * DPR);
    S.scale = scale;
    draw(performance.now());
  }

  function draw(now) {
    var f = S.frame;
    ctx.setTransform(DPR * S.scale, 0, 0, DPR * S.scale, 0, 0);
    ctx.fillStyle = T.matte; ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    if (S.groundCv) {
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(S.groundCv, 0, 0, WORLD_W, WORLD_H);
    }
    ctx.strokeStyle = T.grid; ctx.lineWidth = 0.15; ctx.beginPath();
    for (var gx = 20; gx < WORLD_W; gx += 20) { ctx.moveTo(gx, 0); ctx.lineTo(gx, WORLD_H); }
    for (var gy = 20; gy < WORLD_H; gy += 20) { ctx.moveTo(0, gy); ctx.lineTo(WORLD_W, gy); }
    ctx.stroke();
    if (!f) return;

    // food
    ctx.fillStyle = T.food;
    for (var i = 0; i < f.f.length; i++) { var fd = f.f[i]; ctx.fillRect(fd[0] - 0.4, fd[1] - 0.4, 0.8, 0.8); }

    // predators and what they can see
    var eye = f.eye;
    for (var j = 0; j < S.preds.length; j++) {
      var pr = S.preds[j], pp = posOf(pr, now);
      ctx.strokeStyle = T.predRing; ctx.lineWidth = 0.25; ctx.setLineDash([1.2, 1.4]);
      ctx.beginPath(); ctx.arc(pp.x, pp.y, eye, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.pred; ctx.strokeStyle = T.predEdge; ctx.lineWidth = 0.3;
      ctx.beginPath();
      ctx.moveTo(pp.x, pp.y - 2.6); ctx.lineTo(pp.x + 2, pp.y); ctx.lineTo(pp.x, pp.y + 2.6); ctx.lineTo(pp.x - 2, pp.y);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }

    // creatures
    var hoverE = null, pinE = null;
    S.creatures.forEach(function (e) {
      var p = posOf(e, now), age = now - e.born, k = age >= 350 ? 1 : age / 350;
      var r = e.size * 0.85 * (0.3 + 0.7 * k);
      ctx.fillStyle = e.col; ctx.strokeStyle = T.edge; ctx.lineWidth = 0.22;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.2832); ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.nose;
      ctx.beginPath(); ctx.arc(p.x + Math.cos(e.h) * r * 0.55, p.y + Math.sin(e.h) * r * 0.55, r * 0.24, 0, 6.2832); ctx.fill();
      e.px = p.x; e.py = p.y; e.pr = r;
      if (e.id === S.hover) hoverE = e;
      if (e.id === S.pinned) pinE = e;
    });
    if (hoverE && hoverE !== pinE) { ring(hoverE, T.hover, 0.5, 0.25); }
    if (pinE) {
      ring(pinE, T.pin, 0.8, 0.4);
      var sense = S.watch && S.watch.id === pinE.id ? senseOf(S.watch) : 0;
      if (sense) {
        ctx.strokeStyle = T.sense; ctx.lineWidth = 0.25; ctx.setLineDash([1, 1.2]);
        ctx.beginPath(); ctx.arc(pinE.px, pinE.py, sense * 0.9, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]);
      }
    }

    // creatures that just died fade out
    for (var q = S.ghosts.length - 1; q >= 0; q--) {
      var gh = S.ghosts[q], ga = (now - gh.t) / 500;
      if (ga >= 1) { S.ghosts.splice(q, 1); continue; }
      ctx.globalAlpha = 0.7 * (1 - ga); ctx.strokeStyle = gh.col; ctx.lineWidth = 0.3;
      ctx.beginPath(); ctx.arc(gh.x, gh.y, gh.size * 0.85 * (1 + ga * 1.4), 0, 6.2832); ctx.stroke(); ctx.globalAlpha = 1;
    }

    // meteor shockwave
    if (f.meteor && f.tick - f.meteor[3] >= 0 && f.tick - f.meteor[3] < 40) {
      var mt = (f.tick - f.meteor[3]) / 40;
      ctx.globalAlpha = 1 - mt; ctx.strokeStyle = T.meteor; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.arc(f.meteor[0], f.meteor[1], f.meteor[2] * Math.min(1, mt * 2), 0, 6.2832); ctx.stroke(); ctx.globalAlpha = 1;
    }
  }
  function ring(e, color, extra, lw) {
    ctx.strokeStyle = color; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.arc(e.px, e.py, e.pr + extra, 0, 6.2832); ctx.stroke();
  }
  function senseOf(d) {
    for (var i = 0; i < d.genes.length; i++) if (d.genes[i].name === 'sense') return d.genes[i].value;
    return 0;
  }

  function loop(now) {
    draw(now);
    if (S.chartsDirty && S.view === 'full') { S.chartsDirty = false; drawCharts(); }
    if (S.view === 'full') animateHistograms();
    requestAnimationFrame(loop);
  }

  // ── mouse on the world ─────────────────────────────────────────────────────────
  function worldPoint(ev) {
    var r = cv.getBoundingClientRect();
    return { x: (ev.clientX - r.left) / r.width * WORLD_W, y: (ev.clientY - r.top) / r.height * WORLD_H };
  }
  function hit(pt) {
    var best = null, bd = 1e9;
    S.creatures.forEach(function (e) {
      if (e.px == null) return;
      var d = Math.hypot(e.px - pt.x, e.py - pt.y), reach = Math.max(3.4, e.pr + 2);
      if (d < reach && d < bd) { best = e; bd = d; }
    });
    return best;
  }
  cv.addEventListener('mousemove', function (ev) {
    var h = hit(worldPoint(ev));
    S.hover = h ? h.id : null;
    cv.style.cursor = h ? 'pointer' : 'crosshair';
  });
  cv.addEventListener('mouseleave', function () { S.hover = null; });
  cv.addEventListener('click', function (ev) {
    var pt = worldPoint(ev), h = hit(pt);
    if (h && S.tool === 'food') { S.pinned = S.pinned === h.id ? null : h.id; S.cardKey = ''; return; }
    post({ type: 'click', tool: S.tool, x: pt.x, y: pt.y });
    if (S.tool === 'food') advanceHint(1);
  });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { S.pinned = null; S.cardKey = ''; } });
  document.addEventListener('pointerup', function () {
    if (S.dragging) { S.dragging = false; if (S.pendingSchema) { S.pendingSchema = false; buildAll(); } }
  });

  // ── top bar wiring ─────────────────────────────────────────────────────────────
  $$('#tools button').forEach(function (b) {
    b.onclick = function () {
      S.tool = b.dataset.tool;
      $$('#tools button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    };
  });
  $$('#speed-seg button').forEach(function (b) {
    b.onclick = function () { post({ type: 'speed', mult: parseFloat(b.dataset.mult) }); };
  });
  $('#btn-restart').onclick = function () { post({ type: 'reset' }); resetClientWorld(); };
  $('#banner-restart-go').onclick = function () { post({ type: 'reset' }); resetClientWorld(); };
  $('#btn-reset-settings').onclick = function () { post({ type: 'reset_settings' }); };
  $('#preset-select').onchange = function (ev) {
    if (ev.target.value) runPreset(ev.target.value);
    ev.target.value = '';
  };
  $('#banner-error-open').onclick = function () { switchTab('code'); };
  $$('.tabs button').forEach(function (b) { b.onclick = function () { switchTab(b.dataset.tab); }; b.tabIndex = b.dataset.tab === S.tab ? 0 : -1; });
  $('.tabs').addEventListener('keydown', function (ev) {
    var tabs = $$('.tabs button'), i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    var j = ev.key === 'ArrowRight' ? (i + 1) % tabs.length : ev.key === 'ArrowLeft' ? (i + tabs.length - 1) % tabs.length
      : ev.key === 'Home' ? 0 : ev.key === 'End' ? tabs.length - 1 : -1;
    if (j < 0) return;
    ev.preventDefault(); tabs[j].focus(); switchTab(tabs[j].dataset.tab);
  });

  function applyView() {
    $('#app').dataset.view = S.view;
    $('#btn-view').textContent = S.view === 'full' ? 'Simple view' : 'Show the science';
    $('#btn-view').classList.toggle('primary', S.view !== 'full');
    pref('view', 'simple', S.view);
    setTimeout(function () { fitCanvas(); S.chartsDirty = true; S.statsAt = 0; }, 30);
  }
  $('#btn-view').onclick = function () { S.view = S.view === 'full' ? 'simple' : 'full'; applyView(); };

  function syncThemeButton(name) {
    var b = $('#btn-theme'); if (!b) return;
    var next = name === 'dark' ? 'light' : 'dark';
    b.setAttribute('aria-label', 'Switch to ' + next + ' theme');
    b.title = 'Switch to ' + next + ' theme';
  }
  function applyTheme(name, fade) {
    var root = document.documentElement;
    S.theme = name;
    if (fade) {
      root.classList.add('theme-fade');
      setTimeout(function () { root.classList.remove('theme-fade'); }, 450);
    }
    root.dataset.theme = name;
    var meta = $('meta[name="theme-color"]'); if (meta) meta.setAttribute('content', cssVar('--paper'));
    readTheme(); buildGround();
    S.creatures.forEach(function (e) { e.col = body(e.hue); });
    if (S.schema) $$('#lgd-traits i').forEach(function (sw, i) { sw.style.background = traitColor(S.schema.genes[i].name, i); });
    S.chartsDirty = true; S.histDirty = true;
    syncThemeButton(name);
  }

  // ── go ─────────────────────────────────────────────────────────────────────────
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(function () { fitCanvas(); S.chartsDirty = true; S.histDirty = true; }).observe($('#worldwrap'));
  }
  window.addEventListener('resize', function () { fitCanvas(); S.chartsDirty = true; S.histDirty = true; });
  placeIndicators();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeIndicators);
  window.addEventListener('resize', placeIndicators);
  $('#btn-theme').onclick = function () {
    var next = S.theme === 'dark' ? 'light' : 'dark';
    pref('theme', 'light', next);
    applyTheme(next, true);
  };
  S.theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  syncThemeButton(S.theme);
  if (window.matchMedia) {
    var scheme = window.matchMedia('(prefers-color-scheme: dark)');
    var onScheme = function (ev) { if (!pref('theme', '')) applyTheme(ev.matches ? 'dark' : 'light', true); };
    if (scheme.addEventListener) scheme.addEventListener('change', onScheme); else if (scheme.addListener) scheme.addListener(onScheme);
  }
  applyView();
  fitCanvas();
  if (S.hintStage === 0) showHint('Click anywhere in the world to drop some food.', 0);
  else if (S.hintStage === 1) { S.pulseId = 'predators'; showHint('Open "How harsh is the world?" and drag Predators up. Watch what happens.', 0); }
  else $('#hint').classList.add('gone');
  setTimeout(function () {
    if (S.view === 'simple' && S.hintStage >= 2) showHint('Curious how it works? Click "Show the science" to see DNA, traits and charts.', 9000);
  }, 75000);
  fetchSchema(); fetchTerrain(); fetchHistory();
  poll();
  requestAnimationFrame(loop);
})();
