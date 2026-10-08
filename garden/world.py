"""the simulation: creatures, food, predators, selection, and the data the ui shows.

one world object is owned by one thread (see server.py). everything the browser needs
is turned into plain data here, so the front end stays a generic renderer.
"""

import json
import math
import random
from collections import deque

from . import genome as G
from .hooks import WorkshopLoader, HOOK_NAMES
from .settings import (Settings, BUILTIN, BUILTIN_ACTIONS, GROUPS, PRESETS,
                       MATING_LABELS)
from .api import Patch

W, H = 160.0, 100.0
CELL = 8.0                 # spatial hash cell for food and creatures
GCELL = 4.0                # terrain grid cell
GW, GH = 40, 25
FOOD_ENERGY = 20.0
MAX_FOOD = 450
START_N = 150
ENERGY_CAP = 140.0
BIRTH_COST = 40.0
CHILD_ENERGY = 35.0
PRED_SPEED = 1.9
PRED_REST = 20
TICKS_PER_SEC = 30         # one tick is 1/30 of a "second" at 1x speed
TRAIT_ORDER = ("speed", "size", "sense", "hue", "efficiency")
REWARDS = (("speed", "reward_speed"), ("size", "reward_size"), ("sense", "reward_sense"),
           ("efficiency", "reward_efficiency"), ("hue", "reward_hue"))


class Creature:
    __slots__ = ("id", "x", "y", "h", "energy", "age", "dna", "speed", "size", "sense", "hue",
                 "efficiency", "t", "parent", "gen", "cool", "target", "flee", "hold", "alive",
                 "cost", "maxage", "kids", "score", "thresh")

    def __getattr__(self, name):          # custom genes live in .t
        t = object.__getattribute__(self, "t")
        if name in t:
            return t[name]
        raise AttributeError(name)


class Predator:
    __slots__ = ("x", "y", "h", "target", "rest", "chase")

    def __init__(self, x, y):
        self.x, self.y = x, y
        self.h = random.uniform(0, 6.28)
        self.target, self.rest, self.chase = None, 0, 0


def _control_dict(c):
    base = dict(group="mine", id=c.id, label=c.label, help=getattr(c, "help", ""), hook=None, code="",
                fmt="num", ramp=False, default=c.default)
    n = type(c).__name__
    if n == "Slider":
        base.update(kind="slider", lo=c.lo, hi=c.hi, step=c.step)
    elif n == "Choice":
        base.update(kind="choice", options=c.options, labels={o: o for o in c.options})
    else:
        base.update(kind="toggle")
    return base


class World:
    width, height = W, H

    def __init__(self, workshop_path):
        self.loader = WorkshopLoader(workshop_path)
        self.settings = Settings()
        self.controls = self.settings
        self.hooks = self.loader.current
        self.load_error = None
        self.gene_sig = None
        self.genes = G.default_genes()
        self.needs_restart = False
        self.schema_version = 1
        self.terrain_version = 0
        self.msg_id = 0
        self.msgs = deque(maxlen=6)
        self.mult = 1.0
        self.paused = False
        self.watch_id = None
        self.next_id = 1
        self.terrain_dirty = True
        self.food_mod_until = 0
        self.stats = {}
        self.stats2 = {"div": 0.0, "clusters": 1, "maxgen": 0}
        self.caption = "Warming up. Watch the colours and bars for a minute."
        self.hist_stride = TICKS_PER_SEC
        self.reload(first=True)
        self.reset()

    # ── workshop.py loading ──────────────────────────────────────────────────
    def reload(self, first=False):
        new = self.loader.load()
        if new.load_error:
            self.load_error = new.load_error
            self.schema_version += 1
            return
        self.load_error = None
        self.hooks = new
        defs = list(BUILTIN) + [_control_dict(c) for c in new.controls]
        self.settings.define(defs)
        for k, v in new.settings.items():
            if k not in self.settings.touched:
                self.settings.set(k, v, user=False)
        sig = [(n, g.length, g.range) for n, g in new.genes.items()]
        if self.gene_sig is not None and sig != self.gene_sig:
            self.needs_restart = True
        self.pending_genes = new.genes
        self.terrain_dirty = True
        self.hist_custom = [[] for _ in new.charts]
        self.schema_version += 1
        if not first:
            self.say("workshop.py reloaded")

    def check_reload(self):
        if self.loader.changed():
            self.reload()

    def fail(self, where, exc):
        self.hooks.fail(where, exc, self.loader.path)
        self.schema_version += 1

    def say(self, text):
        self.msg_id += 1
        self.msgs.append([self.msg_id, text])

    # ── (re)starting ─────────────────────────────────────────────────────────
    def reset(self):
        self.genes = self.pending_genes
        self.gene_sig = [(n, g.length, g.range) for n, g in self.genes.items()]
        self.layout = G.layout(self.genes)
        self.dna_len = G.dna_length(self.genes)
        self.needs_restart = False
        self.tick = 0
        self.creatures = []
        self.by_id = {}
        self.fgrid = {}
        self.food_n = 0
        self.food_acc = 0.0
        self.preds = []
        self.cg = {}
        self.deaths = deque(maxlen=600)
        self.births = 0
        self.hist = {"pop": [], "food": [], "div": [], "traits": {n: [] for n in self.genes}}
        self.hist_custom = [[] for _ in self.hooks.charts]
        self.hist_stride = TICKS_PER_SEC
        self.hist_version = 0
        self.food_mod_until = 0
        self.terrain_dirty = True
        for _ in range(START_N):
            c = self.make_creature(G.random_dna(self.genes), random.uniform(4, W - 4),
                                   random.uniform(4, H - 4), None, 0, random.uniform(45, 80))
            c.age = random.randint(0, 300)
        for _ in range(int(MAX_FOOD * 0.4)):
            self.add_food(random.uniform(1, W - 1), random.uniform(1, H - 1))
        self.rebuild_terrain()
        self._refresh_all()
        self.schema_version += 1

    def _refresh_all(self):
        self.compute_stats()
        self.compute_diversity()
        self.record_history()

    # ── creatures and food ───────────────────────────────────────────────────
    def make_creature(self, dna, x, y, parent, gen, energy):
        c = Creature()
        c.id = self.next_id
        self.next_id += 1
        c.x, c.y, c.h = x, y, random.uniform(0, 6.28)
        c.energy, c.age, c.dna = energy, 0, dna
        t = G.decode(dna, self.layout)
        c.t = t
        c.speed, c.size, c.sense = t["speed"], t["size"], t["sense"]
        c.hue, c.efficiency = t["hue"], t["efficiency"]
        c.parent, c.gen, c.cool = parent, gen, 100
        c.target, c.flee, c.hold, c.alive, c.kids = None, 0, 0, True, 0
        c.cost = (0.04 + 0.03 * c.speed ** 2 + 0.03 * c.size + 0.004 * c.sense) / c.efficiency
        c.maxage = int(random.uniform(420, 720))
        c.score, c.thresh = 1.0, 85.0
        self.creatures.append(c)
        self.by_id[c.id] = c
        self.refresh_score(c)
        return c

    def kill(self, c, cause):
        if not c.alive:
            return
        c.alive = False
        self.by_id.pop(c.id, None)
        self.deaths.append((self.tick, cause, c.speed, c.size, c.sense, c.efficiency,
                            abs(c.hue - self.ground_hue(c.x, c.y))))

    def add_food(self, x, y):
        if self.food_n >= MAX_FOOD:
            return
        key = (int(x / CELL), int(y / CELL))
        item = [x, y, 1, key]
        lst = self.fgrid.get(key)
        if lst is None:
            self.fgrid[key] = [item]
        else:
            lst.append(item)
        self.food_n += 1

    def remove_food(self, f):
        f[2] = 0
        lst = self.fgrid.get(f[3])
        if lst is not None and f in lst:
            lst.remove(f)
        self.food_n -= 1

    def find_food(self, c):
        r = c.sense
        cx, cy = int(c.x / CELL), int(c.y / CELL)
        rc = int(r / CELL) + 1
        best, bd = None, r * r
        fg, x, y = self.fgrid, c.x, c.y
        for gx in range(cx - rc, cx + rc + 1):
            for gy in range(cy - rc, cy + rc + 1):
                lst = fg.get((gx, gy))
                if lst:
                    for f in lst:
                        d = (f[0] - x) ** 2 + (f[1] - y) ** 2
                        if d < bd:
                            bd, best = d, f
        return best

    # ── terrain ──────────────────────────────────────────────────────────────
    def _tidx(self, x, y):
        ix = int(x / GCELL)
        iy = int(y / GCELL)
        ix = 0 if ix < 0 else (GW - 1 if ix >= GW else ix)
        iy = 0 if iy < 0 else (GH - 1 if iy >= GH else iy)
        return iy * GW + ix

    def ground_hue(self, x, y):
        """ground colour (0..1) at a spot. creatures whose hue matches hide from predators."""
        return self.t_hue[self._tidx(x, y)]

    def rebuild_terrain(self):
        ground = self.settings.ground_color
        fn = self.hooks.get("terrain")
        hue, food, danger = [], [], []
        secs = self.tick / float(TICKS_PER_SEC)
        for iy in range(GH):
            y = (iy + 0.5) * GCELL
            for ix in range(GW):
                x = (ix + 0.5) * GCELL
                a = math.exp(-(((x - 45) / 22.0) ** 2 + ((y - 62) / 16.0) ** 2))
                b = math.exp(-(((x - 118) / 24.0) ** 2 + ((y - 30) / 20.0) ** 2))
                hv, fv, dv = min(1.0, max(0.0, ground + 0.30 * a - 0.22 * b)), 1.0, 1.0
                if fn is not None:
                    try:
                        r = fn(x, y, secs)
                    except Exception as e:
                        self.fail("terrain", e)
                        fn = None
                        r = None
                    if isinstance(r, dict):
                        r = Patch(r.get("hue"), r.get("food"), r.get("danger"))
                    if isinstance(r, (int, float)):
                        r = Patch(hue=r)
                    if isinstance(r, Patch):
                        if r.hue is not None:
                            hv = min(1.0, max(0.0, float(r.hue)))
                        if r.food is not None:
                            fv = max(0.0, float(r.food))
                        if r.danger is not None:
                            dv = max(0.0, float(r.danger))
                hue.append(hv)
                food.append(fv)
                danger.append(dv)
        self.t_hue, self.t_food, self.t_danger = hue, food, danger
        self.t_foodmax = max(food) or 1.0
        self.terrain_dirty = False
        self.terrain_version += 1

    # ── selection ────────────────────────────────────────────────────────────
    def refresh_score(self, c):
        """how strongly this creature breeds: >1 breeds sooner and more, <1 later and less."""
        fn = self.hooks.get("fitness")
        score = 1.0
        if fn is not None:
            try:
                score = float(fn(c, self))
                if score != score or score in (float("inf"), float("-inf")):
                    raise ValueError("fitness() returned %r; it needs to return a normal number" % (score,))
            except Exception as e:
                self.fail("fitness", e)
                score = 1.0
            score = max(0.0, score)
        else:
            s = self.settings
            total = 0.0
            for name, key in REWARDS:
                w = s[key]
                if w:
                    lo, hi = self.genes[name].range if name in self.genes else (0.0, 1.0)
                    total += w * ((c.t[name] - lo) / (hi - lo) - 0.5) * 2.0
            if total:
                score = math.exp(1.5 * total)
        c.score = score
        c.thresh = 130.0 if score < 0.0001 else min(130.0, max(45.0, 85.0 / math.sqrt(score)))

    def mutate_dna(self, dna):
        rate = self.settings.mutation_rate
        fn = self.hooks.get("mutate")
        if fn is not None:
            try:
                out = fn(dna, rate)
                if not G.is_valid_dna(out, self.dna_len):
                    raise ValueError("mutate() must return a DNA string of exactly %d letters using only "
                                     "A, C, G and T" % self.dna_len)
                return out
            except Exception as e:
                self.fail("mutate", e)
        if rate <= 0:
            return dna
        out = list(dna)
        rnd = random.random
        for i, ch in enumerate(out):
            if rnd() < rate:
                out[i] = random.choice("ACGT".replace(ch, ""))
        return "".join(out)

    def nearby_creatures(self, c, r, limit=14):
        cx, cy = int(c.x / CELL), int(c.y / CELL)
        rc = int(r / CELL) + 1
        r2, out = r * r, []
        for gx in range(cx - rc, cx + rc + 1):
            for gy in range(cy - rc, cy + rc + 1):
                for o in self.cg.get((gx, gy), ()):
                    if o is not c and o.alive and (o.x - c.x) ** 2 + (o.y - c.y) ** 2 < r2:
                        out.append(o)
                        if len(out) >= limit:
                            return out
        return out

    def reproduce(self, c, newborn):
        mode = self.settings.mating
        fn = self.hooks.get("choose_mate")
        mate = None
        if fn is not None or mode != "clone":
            cands = [o for o in self.nearby_creatures(c, 12.0) if o.energy > 30]
            if cands:
                if fn is not None:
                    try:
                        mate = fn(c, cands)
                        if mate is not None and mate not in cands:
                            raise ValueError("choose_mate() must return one of the candidates or None")
                    except Exception as e:
                        self.fail("choose_mate", e)
                        mate = None
                elif mode == "random":
                    mate = random.choice(cands)
                else:
                    key = lambda o: sum(1 for a, b in zip(c.dna, o.dna) if a != b)
                    mate = min(cands, key=key) if mode == "similar" else max(cands, key=key)
        if mate is not None:
            dna = "".join(random.choice((c.dna, mate.dna))[a:b] for _, a, b, _, _ in self.layout)
            mate.energy -= 8.0
        else:
            dna = c.dna
        dna = self.mutate_dna(dna)
        c.energy -= BIRTH_COST
        c.cool = 120
        c.kids += 1
        self.births += 1
        child = self.make_creature(dna, min(W - 1, max(1, c.x + random.uniform(-1.5, 1.5))),
                                   min(H - 1, max(1, c.y + random.uniform(-1.5, 1.5))),
                                   c.id, c.gen + 1, CHILD_ENERGY)
        newborn.append(child)

    # ── one tick ─────────────────────────────────────────────────────────────
    def step(self):
        self.tick += 1
        t = self.tick
        S = self.settings
        if self.terrain_dirty or (t % 60 == 0 and self.hooks.active("terrain")):
            self.rebuild_terrain()

        # food
        mod = 0.12 if t < self.food_mod_until else 1.0
        self.food_acc += 2.6 * S.food_rate * mod
        rnd = random.random
        while self.food_acc >= 1.0:
            self.food_acc -= 1.0
            for _ in range(3):
                x, y = rnd() * (W - 2) + 1, rnd() * (H - 2) + 1
                if rnd() * self.t_foodmax <= self.t_food[self._tidx(x, y)]:
                    self.add_food(x, y)
                    break

        fn = self.hooks.get("on_tick")
        if fn is not None:
            try:
                fn(self)
            except Exception as e:
                self.fail("on_tick", e)

        if t % 3 == 0:
            cg = {}
            for c in self.creatures:
                key = (int(c.x / CELL), int(c.y / CELL))
                lst = cg.get(key)
                if lst is None:
                    cg[key] = [c]
                else:
                    lst.append(c)
            self.cg = cg

        if t % 15 == 0:
            self._sync_predators()
        self._update_predators(t)
        self._update_creatures(t)

        if t % 10 == 0:
            self.compute_stats()
        if t % 30 == 0:
            self._insurance()
            self.caption = self.compute_caption()
        if t % 90 == 0:
            self.compute_diversity()
        if t % self.hist_stride == 0:
            self.record_history()

    def _update_creatures(self, t):
        cs = self.creatures
        S = self.settings
        steer = self.hooks.get("steer")
        preds = self.preds
        cap = S.pop_cap
        n_alive = len(cs)
        newborn = []
        cos, sin, atan2, rnd = math.cos, math.sin, math.atan2, random.random
        for c in cs:
            if not c.alive:
                continue
            c.age += 1
            e = c.energy - c.cost
            if c.flee > 0:
                e -= c.cost * 0.4
            c.energy = e
            if e <= 0:
                self.kill(c, "starved")
                continue
            if c.age > c.maxage:
                self.kill(c, "old")
                continue
            c.cool -= 1
            cid = c.id
            if (t + cid) % 15 == 0:
                self.refresh_score(c)

            if steer is not None and (t + cid) % 2 == 0:
                try:
                    r = steer(c, self)
                except Exception as ex:
                    self.fail("steer", ex)
                    steer = None
                    r = None
                if r is not None:
                    try:
                        c.h = atan2(float(r[1]) - c.y, float(r[0]) - c.x)
                        c.hold = 2
                        c.target = None
                        c.flee = 0
                    except Exception:
                        self.fail("steer", ValueError("steer() must return an (x, y) point or None"))
                        steer = None

            if c.hold > 0:
                c.hold -= 1
            elif (t + cid) % 3 == 0:
                sr = c.sense * 0.9
                sr2 = sr * sr
                for p in preds:
                    dx, dy = p.x - c.x, p.y - c.y
                    if dx * dx + dy * dy < sr2:
                        c.h = atan2(-dy, -dx) + (rnd() - 0.5) * 0.6
                        c.flee = 14
                        c.target = None
                        break
                if c.flee <= 0 and (c.target is None or not c.target[2]):
                    c.target = self.find_food(c)

            spd = c.speed
            if c.flee > 0:
                c.flee -= 1
                spd *= 1.15
            else:
                f = c.target
                if f is not None:
                    if not f[2]:
                        c.target = None
                    else:
                        dx, dy = f[0] - c.x, f[1] - c.y
                        reach = 1.2 + 0.6 * c.size
                        if dx * dx + dy * dy < reach * reach:
                            c.energy = min(ENERGY_CAP, c.energy + FOOD_ENERGY)
                            self.remove_food(f)
                            c.target = None
                        elif c.hold <= 0:
                            c.h = atan2(dy, dx)
                elif c.hold <= 0:
                    c.h += (rnd() - 0.5) * 0.7
            x = c.x + cos(c.h) * spd
            y = c.y + sin(c.h) * spd
            if x < 1.0 or x > W - 1.0:
                c.h = math.pi - c.h
                x = 1.0 if x < 1.0 else W - 1.0
            if y < 1.0 or y > H - 1.0:
                c.h = -c.h
                y = 1.0 if y < 1.0 else H - 1.0
            c.x, c.y = x, y

            if c.cool <= 0 and c.energy >= c.thresh and n_alive + len(newborn) < cap:
                self.reproduce(c, newborn)
        self.creatures = [c for c in cs if c.alive]

    def _sync_predators(self):
        want = int(self.settings.predators)
        while len(self.preds) < want:
            side = random.random()
            self.preds.append(Predator(random.choice((2.0, W - 2.0)) if side < 0.5 else random.uniform(0, W),
                                       random.uniform(0, H) if side < 0.5 else random.choice((2.0, H - 2.0))))
        while len(self.preds) > want:
            self.preds.pop()

    def _update_predators(self, t):
        eye = float(self.settings.eyesight)
        eye2 = eye * eye
        rnd = random.random
        atan2, cos, sin = math.atan2, math.cos, math.sin
        for i, p in enumerate(self.preds):
            tgt = p.target
            if p.rest > 0:
                p.rest -= 1
                tgt = None
                p.target = None
            if tgt is not None and tgt.alive:
                dx, dy = tgt.x - p.x, tgt.y - p.y
                d2 = dx * dx + dy * dy
                p.chase += 1
                if d2 > (eye * 1.6) ** 2 or p.chase > 200:
                    p.target, p.rest = None, 30
                elif d2 < 6.25:
                    escape = tgt.speed * (1.15 if tgt.flee > 0 else 1.0)
                    if rnd() < min(0.95, max(0.12, 0.75 + (PRED_SPEED - escape) * 0.8)):
                        self.kill(tgt, "eaten")
                        p.target, p.rest = None, PRED_REST
                    else:
                        p.h = atan2(dy, dx)
                else:
                    p.h = atan2(dy, dx)
                    p.x += cos(p.h) * PRED_SPEED
                    p.y += sin(p.h) * PRED_SPEED
            else:
                p.target = None
                p.chase = 0
                p.h += (rnd() - 0.5) * 0.4
                p.x += cos(p.h) * 0.9
                p.y += sin(p.h) * 0.9
                if p.rest <= 0 and (t + i) % 2 == 0:
                    p.target = self._spot(p, eye, eye2)
            if p.x < 1 or p.x > W - 1:
                p.h = math.pi - p.h
                p.x = min(W - 1, max(1, p.x))
            if p.y < 1 or p.y > H - 1:
                p.h = -p.h
                p.y = min(H - 1, max(1, p.y))

    def _spot(self, p, eye, eye2):
        """pick a victim: of the creatures in view, the one that stands out most against the ground."""
        cx, cy = int(p.x / CELL), int(p.y / CELL)
        rc = int(eye / CELL) + 1
        best, best_v, best_s = None, 0.0, 0.0
        for gx in range(cx - rc, cx + rc + 1):
            for gy in range(cy - rc, cy + rc + 1):
                for c in self.cg.get((gx, gy), ()):
                    if not c.alive:
                        continue
                    d2 = (c.x - p.x) ** 2 + (c.y - p.y) ** 2
                    if d2 > eye2:
                        continue
                    idx = self._tidx(c.x, c.y)
                    v = abs(c.hue - self.t_hue[idx]) * 3.0
                    pspot = (0.02 + 0.98 * min(1.0, v * math.sqrt(v))) * (0.7 + 0.3 * c.size) * self.t_danger[idx]
                    val = pspot * (1.0 - 0.5 * d2 / eye2)
                    if val > best_v:
                        best, best_v, best_s = c, val, pspot
        if best is not None and random.random() < min(1.0, best_s):
            return best
        return None

    def _insurance(self):
        if not self.settings.insurance:
            return
        n = len(self.creatures)
        if n >= 8:
            return
        if n == 0:
            for _ in range(25):
                self.make_creature(G.random_dna(self.genes), random.uniform(4, W - 4),
                                   random.uniform(4, H - 4), None, 0, 60)
            self.say("Everyone died. Extinction insurance dropped in a fresh population.")
            return
        survivors = list(self.creatures)
        while len(self.creatures) < 20:
            s = random.choice(survivors)
            self.make_creature(self.mutate_dna(s.dna), s.x + random.uniform(-3, 3), s.y + random.uniform(-3, 3),
                               s.id, s.gen + 1, 60)
        self.say("Almost extinct. Extinction insurance cloned the survivors.")

    # ── disasters and tools ──────────────────────────────────────────────────
    def kill_in_circle(self, x, y, r, cause="disaster"):
        """kill every creature within r of (x, y). returns how many died."""
        n = 0
        for c in self.creatures:
            if c.alive and (c.x - x) ** 2 + (c.y - y) ** 2 < r * r:
                self.kill(c, cause)
                n += 1
        return n

    def spawn(self, x, y, dna=None, energy=60.0):
        """add a creature (random dna unless you pass some). returns it."""
        return self.make_creature(dna if dna else G.random_dna(self.genes), x, y, None, 0, energy)

    def kill_creature(self, c):
        """remove one creature."""
        self.kill(c, "disaster")

    def food_near(self, x, y, r):
        """food items within r of (x, y), as [x, y, ...] lists."""
        out = []
        for gx in range(int((x - r) / CELL), int((x + r) / CELL) + 1):
            for gy in range(int((y - r) / CELL), int((y + r) / CELL) + 1):
                for f in self.fgrid.get((gx, gy), ()):
                    if (f[0] - x) ** 2 + (f[1] - y) ** 2 < r * r:
                        out.append(f)
        return out

    def mean(self, trait):
        """average value of a trait across living creatures (0 if nobody is alive)."""
        cs = self.creatures
        return sum(c.t[trait] for c in cs) / len(cs) if cs else 0.0

    @property
    def predators(self):
        return self.preds

    def action(self, name):
        if name == "meteor":
            x, y = random.uniform(25, W - 25), random.uniform(20, H - 20)
            n = self.kill_in_circle(x, y, 24, "disaster")
            for f in self.food_near(x, y, 24):
                self.remove_food(f)
            self.say("Meteor strike! %d creatures lost." % n)
            self.meteor = (x, y, 24, self.tick)
        elif name == "plague":
            n = 0
            for c in self.creatures:
                if c.alive and random.random() < 0.4:
                    self.kill(c, "disaster")
                    n += 1
            self.say("Plague. %d creatures lost." % n)
        elif name == "famine":
            for lst in list(self.fgrid.values()):
                for f in list(lst):
                    self.remove_food(f)
            self.say("Famine. All food is gone.")
        elif name == "iceage":
            self.food_mod_until = self.tick + 20 * TICKS_PER_SEC * 2
            self.say("Ice age. Food barely grows for a while.")

    def click(self, tool, x, y):
        x, y = min(W - 1, max(1, x)), min(H - 1, max(1, y))
        if tool == "food":
            for _ in range(8):
                self.add_food(min(W - 1, max(1, x + random.uniform(-3, 3))),
                              min(H - 1, max(1, y + random.uniform(-3, 3))))
        elif tool == "predator":
            if len(self.preds) < 12:
                self.preds.append(Predator(x, y))
                self.settings.set("predators", len(self.preds), user=True)
                self.schema_version += 1
        elif tool == "smite":
            self.kill_in_circle(x, y, 9, "disaster")
