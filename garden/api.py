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
