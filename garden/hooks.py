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

    def get(self, name):
        if name in self.disabled:
            return None
        return self.fns.get(name)

    def active(self, name):
        return name in self.fns and name not in self.disabled

    def fail(self, where, exc, path):
        line, src = None, ""
        for fs in traceback.extract_tb(exc.__traceback__):
            if fs.filename == path:
                line, src = fs.lineno, (fs.line or "")
        msg = "%s: %s" % (type(exc).__name__, exc)
        self.errors[where] = {"where": where, "msg": msg, "line": line, "src": src.strip()}
        if where in self.fns:
            self.disabled.add(where)
