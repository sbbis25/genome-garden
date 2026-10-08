"""loads workshop.py, hot-reloads it, and keeps one broken hook from breaking the rest."""

import os
import traceback

from . import api
from .genome import default_genes, CORE_GENES

HOOK_NAMES = ("terrain", "fitness", "mutate", "choose_mate", "steer", "on_tick")


class Hooks:
    """one snapshot of what workshop.py defined. built whole, then swapped in with one assignment."""

    def __init__(self):
        self.fns = {}              # hook name -> callable
        self.genes = default_genes()
        self.controls = []         # slider / choice / toggle objects
        self.charts = []
        self.buttons = []
        self.settings = {}         # settings dict from the file
        self.disabled = set()      # hooks that raised; they fall back to defaults until the next reload
        self.errors = {}           # key -> {"where", "msg", "line", "src"}
        self.load_error = None
