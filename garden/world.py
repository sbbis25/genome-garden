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
