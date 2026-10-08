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
