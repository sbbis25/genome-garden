"""the control schema and the settings store.

every control the ui shows (built-in or declared in workshop.py) is described here
as plain data. the browser renders whatever this module says exists, so adding a
control never means touching html.
"""

GROUPS = [
    ("harsh", "How harsh is the world?"),
    ("survive", "Who survives?"),
    ("change", "How do they change?"),
    ("mate", "Who mates with whom?"),
    ("disasters", "Disasters"),
]

MATING_OPTIONS = ["clone", "random", "similar", "different"]
MATING_LABELS = {
    "clone": "Clone (no mating)",
    "random": "Anyone nearby",
    "similar": "Most similar DNA",
    "different": "Most different DNA",
}


def _slider(group, id, label, lo, hi, step, default, help, hook=None, code="", fmt="num", ramp=False):
    return dict(kind="slider", group=group, id=id, label=label, lo=lo, hi=hi, step=step,
                default=default, help=help, hook=hook, code=code, fmt=fmt, ramp=ramp)


BUILTIN = [
    _slider("harsh", "food_rate", "Food regrowth", 0.2, 2.0, 0.05, 1.0,
            "How fast new food appears. Less food means more starvation and a smaller population.",
            code="SETTINGS = {\"food_rate\": 0.6}"),
    _slider("harsh", "predators", "Predators", 0, 12, 1, 5,
            "Hunters that chase the creatures they can see.",
            code="SETTINGS = {\"predators\": 8}", fmt="int"),
    _slider("harsh", "eyesight", "Predator eyesight", 6, 30, 1, 18,
            "How far predators can spot a creature. Hiding matters more when this is high.",
            code="SETTINGS = {\"eyesight\": 24}", fmt="int"),
    _slider("harsh", "ground_color", "Ground colour", 0.0, 1.0, 0.01, 0.25,
            "Predators see creatures that stand out from the ground. Move this and watch body colours follow.",
            code="# or paint your own ground:\ndef terrain(x, y, t):\n    return Patch(hue=0.8)", ramp=True,
            fmt="pct"),
    _slider("harsh", "pop_cap", "Crowding limit", 60, 400, 10, 250,
            "No more babies are born once this many creatures are alive.",
            code="SETTINGS = {\"pop_cap\": 120}", fmt="int"),
]
