"""tiny standard-library web server plus the thread that runs the simulation.

the browser polls /frame for what to draw and posts /api/cmd to change things.
nothing here needs installing: it is all python's built-in http.server.
"""

import json
import os
import queue
import sys
import threading
import time
import traceback
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

from .world import World, TICKS_PER_SEC

WEB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "web")
STATIC = {
    "/": ("index.html", "text/html; charset=utf-8"),
    "/index.html": ("index.html", "text/html; charset=utf-8"),
    "/app.js": ("app.js", "application/javascript; charset=utf-8"),
    "/style.css": ("style.css", "text/css; charset=utf-8"),
}
COMMANDS = {"set", "reset", "reset_settings", "preset", "action", "button", "click", "speed", "watch"}


class Sim(threading.Thread):
    """runs the world and publishes ready-made json for the http threads to hand out."""

    def __init__(self, world):
        threading.Thread.__init__(self, daemon=True)
        self.world = world
        self.q = queue.Queue()
        self.frame = b"{}"
        self.terrain = b"{}"
        self.history = b"{}"
        self.schema = b"{}"
        self._seen = {"tv": -1, "hv": -1, "sv": -1}
        self.achieved = 1.0

    def publish(self, force=False):
        w = self.world
        if w.terrain_version != self._seen["tv"] or force:
            self.terrain = w.terrain_json()
            self._seen["tv"] = w.terrain_version
        if w.hist_version != self._seen["hv"] or force:
            self.history = w.history_json()
            self._seen["hv"] = w.hist_version
        if w.schema_version != self._seen["sv"] or force:
            self.schema = w.schema_json()
            self._seen["sv"] = w.schema_version
        self.frame = w.frame_bytes(self.achieved)
