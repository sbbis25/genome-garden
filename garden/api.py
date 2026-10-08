"""everything a workshop.py file can use.

    from garden.api import *

helpers have a one-line docstring; read them, copy them, combine them.
"""

import math
import random

from .genome import Gene, BASES

__all__ = [
    "Gene", "Patch", "Slider", "Choice", "Toggle", "Chart", "Button",
    "math", "random",
    "distance", "nearest", "hamming", "similarity", "most_similar",
    "most_different", "point_mutate", "crossover", "gc_content",
    "lerp", "clamp", "noise",
]


class Patch:
    """what the ground is like at one spot. leave a field as none to keep the default."""

    def __init__(self, hue=None, food=None, danger=None):
        self.hue = hue        # ground colour 0..1 (creatures with a matching hue hide)
        self.food = food      # food richness multiplier, 1.0 = normal
        self.danger = danger  # predator-visibility multiplier, 1.0 = normal


class Slider:
    """a slider in the my controls panel. read it with world.controls.<id>."""

    def __init__(self, id, label, lo, hi, default=None, step=None, help=""):
        self.id, self.label, self.lo, self.hi = id, label, float(lo), float(hi)
        self.default = float(lo if default is None else default)
        self.step = float(step) if step else (self.hi - self.lo) / 100.0
        self.help = help


class Choice:
    """a pick-one control. world.controls.<id> is the chosen option text."""

    def __init__(self, id, label, options, default=None, help=""):
        self.id, self.label, self.options = id, label, list(options)
        self.default = default if default is not None else self.options[0]
        self.help = help


class Toggle:
    """an on/off switch. world.controls.<id> is true or false."""

    def __init__(self, id, label, default=False, help=""):
        self.id, self.label, self.default, self.help = id, label, bool(default), help


class Chart:
    """a live chart. fn(world) returns one number, or a list of numbers for several lines."""

    def __init__(self, title, fn):
        self.title, self.fn = title, fn


class Button:
    """a button in the my controls panel. fn(world) runs when it is pressed."""

    def __init__(self, label, fn):
        self.label, self.fn = label, fn


# ── helpers ──────────────────────────────────────────────────────────────────

def distance(a, b):
    """distance between two things that have .x and .y (creatures, predators)."""
    return math.hypot(a.x - b.x, a.y - b.y)


def nearest(me, others):
    """the thing in `others` closest to `me`, or none if the list is empty."""
    best, best_d = None, 1e18
    for o in others:
        d = (o.x - me.x) ** 2 + (o.y - me.y) ** 2
        if d < best_d:
            best, best_d = o, d
    return best


def hamming(a, b):
    """how many letters differ between two dna strings of the same length."""
    return sum(1 for x, y in zip(a, b) if x != y)


def similarity(a, b):
    """0..1, how alike two dna strings are (1 = identical)."""
    return 1.0 - hamming(a, b) / float(len(a))


def most_similar(me, candidates):
    """the candidate whose dna is closest to mine (none if there are none)."""
    return min(candidates, key=lambda o: hamming(me.dna, o.dna), default=None)


def most_different(me, candidates):
    """the candidate whose dna is furthest from mine (none if there are none)."""
    return max(candidates, key=lambda o: hamming(me.dna, o.dna), default=None)
