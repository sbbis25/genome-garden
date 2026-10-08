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

    def run(self):
        w = self.world
        last = time.perf_counter()
        last_reload = last
        last_frame = 0.0
        ach_t, ach_ticks = last, 0
        acc = 0.0
        self.publish(force=True)
        while True:
            now = time.perf_counter()
            dt = min(now - last, 0.25)
            last = now
            try:
                while True:
                    w.apply(self.q.get_nowait())
            except queue.Empty:
                pass
            except Exception:
                traceback.print_exc()
            if now - last_reload > 0.5:
                last_reload = now
                try:
                    w.check_reload()
                except Exception:
                    traceback.print_exc()
            if not w.paused:
                acc += dt * TICKS_PER_SEC * w.mult
                stop_at = now + 0.03
                try:
                    while acc >= 1.0 and time.perf_counter() < stop_at:
                        w.step()
                        acc -= 1.0
                        ach_ticks += 1
                except Exception as e:
                    traceback.print_exc()
                    w.paused = True
                    w.load_error = {"where": "engine", "msg": "%s: %s" % (type(e).__name__, e),
                                    "line": None, "src": "The simulation stopped. Press Reset world."}
                    w.schema_version += 1
                if acc > 4.0:
                    acc = 4.0
            if now - ach_t >= 0.5:
                self.achieved = ach_ticks / (now - ach_t) / TICKS_PER_SEC
                ach_t, ach_ticks = now, 0
            if now - last_frame >= 0.04:
                last_frame = now
                try:
                    self.publish()
                except Exception:
                    traceback.print_exc()
            time.sleep(0.004)


def make_handler(sim):
    class Handler(BaseHTTPRequestHandler):
        protocol_version = "HTTP/1.1"

        def log_message(self, *args):
            pass

        def _send(self, body, ctype="application/json"):
            try:
                self.send_response(200)
                self.send_header("Content-Type", ctype)
                self.send_header("Content-Length", str(len(body)))
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                self.wfile.write(body)
            except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
                pass

        def do_GET(self):
            u = urlparse(self.path)
            if u.path in STATIC:
                name, ctype = STATIC[u.path]
                with open(os.path.join(WEB, name), "rb") as f:
                    self._send(f.read(), ctype)
            elif u.path == "/frame":
                q = parse_qs(u.query)
                wid = q.get("watch", [""])[0]
                sim.world.watch_id = int(wid) if wid.isdigit() else None
                self._send(sim.frame)
            elif u.path == "/api/terrain":
                self._send(sim.terrain)
            elif u.path == "/api/history":
                self._send(sim.history)
            elif u.path == "/api/schema":
                self._send(sim.schema)
            else:
                self.send_error(404)

        def do_POST(self):
            if urlparse(self.path).path != "/api/cmd":
                self.send_error(404)
                return
            try:
                n = int(self.headers.get("Content-Length", "0"))
                cmd = json.loads(self.rfile.read(n).decode("utf-8"))
            except Exception:
                self.send_error(400)
                return
            if isinstance(cmd, dict) and cmd.get("type") in COMMANDS:
                sim.q.put(cmd)
            self._send(b"{}")

    return Handler


def serve(workshop_path, port=8765, open_browser=True):
    world = World(workshop_path)
    sim = Sim(world)
    sim.start()
    httpd = None
    for p in range(port, port + 25):
        try:
            ThreadingHTTPServer.daemon_threads = True
            httpd = ThreadingHTTPServer(("127.0.0.1", p), make_handler(sim))
            port = p
            break
        except OSError:
            continue
    if httpd is None:
        print("Could not find a free port near %d. Close other copies and try again." % port)
        sys.exit(1)
    url = "http://127.0.0.1:%d/" % port
    print("", flush=True)
    print("  Genome Garden is running at  %s" % url, flush=True)
    print("  Edit workshop.py and save it: the running world picks up your changes.", flush=True)
    print("  Press Ctrl+C to stop.", flush=True)
    print("", flush=True)
    if open_browser:
        threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
    finally:
        httpd.server_close()
