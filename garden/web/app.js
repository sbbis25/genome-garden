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
      var body = el('div', 'group-body');
      g.controls.forEach(function (c) { body.appendChild(buildControl(c)); });
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
        body.appendChild(a);
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
    h += '</div><p class="tip" style="margin-top:8px">Teal means your code is running. Grey means the built-in behaviour. Red means it hit an error.</p>';

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
    $$('.tabs button').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.tab === name)); });
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
        '</div><div class="bar"><i style="width:' + Math.round(norm * 100) + '%' + (g.name === 'hue' ? ';background:' + ramp(g.value) : '') + '"></i></div></div>';
    });
    h += '</div>';
    h += '<p class="tip" style="margin:10px 0 0">Camouflage gap vs ground: <b class="mono">' + d.contrast.toFixed(2) + '</b> (lower hides better)' +
      (d.parent ? '. Parent #' + d.parent : '') + '.</p>';
    box.innerHTML = h;
  }

})();
