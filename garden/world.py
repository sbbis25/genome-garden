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
