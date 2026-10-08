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
