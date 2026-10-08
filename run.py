"""start genome garden:   python run.py

    python run.py --check        check that your setup is ready (do this the night before)
    python run.py --port 9000    use a different port
    python run.py --no-browser   do not open a browser tab
"""

import argparse
import os
import socket
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
WORKSHOP = os.path.join(HERE, "workshop.py")


def check():
    ok = True
    print("Python version: %s" % sys.version.split()[0])
    if sys.version_info < (3, 9):
        print("  PROBLEM: this needs Python 3.9 or newer. Get it from https://www.python.org/downloads/")
        ok = False
    else:
        print("  ok")
    try:
        import garden.world  # noqa: f401
        print("Engine loads: ok (nothing to install, no extra packages needed)")
    except Exception as e:
        print("Engine loads: PROBLEM: %s" % e)
        ok = False
    s = socket.socket()
    try:
        s.bind(("127.0.0.1", 8765))
        print("Port 8765 is free: ok")
    except OSError:
        print("Port 8765 is busy: not a problem, another port will be picked")
    finally:
        s.close()
    try:
        from garden.hooks import WorkshopLoader
        h = WorkshopLoader(WORKSHOP).load()
        if h.load_error:
            print("workshop.py has a problem on line %s: %s" % (h.load_error["line"], h.load_error["msg"]))
            ok = False
        else:
            print("workshop.py reads fine: ok")
    except Exception as e:
        print("workshop.py check failed: %s" % e)
        ok = False
    print("")
    print("All good. Run:  python run.py" if ok else "Fix the problems above, then run this check again.")
    return 0 if ok else 1
