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


class WorkshopLoader:
    def __init__(self, path):
        self.path = os.path.abspath(path)
        self.mtime = None
        self.current = Hooks()

    def _stamp(self):
        try:
            return os.stat(self.path).st_mtime_ns
        except OSError:
            return None

    def changed(self):
        return self._stamp() != self.mtime

    def load(self):
        """read workshop.py into a fresh hooks. never raises: problems land in .load_error."""
        self.mtime = self._stamp()
        h = Hooks()
        try:
            with open(self.path, encoding="utf-8") as f:
                source = f.read()
        except OSError as e:
            h.load_error = {"where": "workshop.py", "msg": "Could not read the file: %s" % e,
                            "line": None, "src": ""}
            return h
        ns = {k: getattr(api, k) for k in api.__all__}
        ns["__name__"] = "workshop"
        ns["GENES"] = default_genes()
        ns["SETTINGS"] = {}
        ns["CONTROLS"] = []
        ns["CHARTS"] = []
        ns["BUTTONS"] = []
        try:
            exec(compile(source, self.path, "exec"), ns)
        except SyntaxError as e:
            h.load_error = {"where": "workshop.py", "msg": "SyntaxError: %s" % (e.msg,),
                            "line": e.lineno, "src": (e.text or "").strip()}
            return h
        except Exception as e:
            h.fail("workshop.py", e, self.path)
            h.load_error = h.errors.pop("workshop.py")
            return h
        for name in HOOK_NAMES:
            fn = ns.get(name)
            if callable(fn):
                h.fns[name] = fn
        genes = ns.get("GENES")
        if isinstance(genes, dict) and all(hasattr(g, "length") for g in genes.values()):
            for core in CORE_GENES:
                if core not in genes:
                    genes[core] = default_genes()[core]
            h.genes = genes
        h.controls = [c for c in ns.get("CONTROLS", []) if hasattr(c, "id")]
        h.charts = [c for c in ns.get("CHARTS", []) if hasattr(c, "fn")]
        h.buttons = [b for b in ns.get("BUTTONS", []) if hasattr(b, "fn")]
        if isinstance(ns.get("SETTINGS"), dict):
            h.settings = ns["SETTINGS"]
        return h
