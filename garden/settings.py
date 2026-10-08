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
    _slider("survive", "reward_speed", "Reward speed", -1.0, 1.0, 0.05, 0.0,
            "Above 0: fast creatures have more babies. Below 0: slow ones do. You are the breeder.",
            hook="fitness", code="def fitness(c, world):\n    return 1 + c.speed * 2   # fast creatures breed more",
            fmt="signed"),
    _slider("survive", "reward_size", "Reward size", -1.0, 1.0, 0.05, 0.0,
            "Above 0: big creatures have more babies. Below 0: small ones do.",
            hook="fitness", code="def fitness(c, world):\n    return 3 - c.size   # small creatures breed more",
            fmt="signed"),
    _slider("survive", "reward_sense", "Reward alertness", -1.0, 1.0, 0.05, 0.0,
            "Above 0: creatures that see further have more babies.",
            hook="fitness", code="def fitness(c, world):\n    return c.sense / 10", fmt="signed"),
    _slider("survive", "reward_efficiency", "Reward thriftiness", -1.0, 1.0, 0.05, 0.0,
            "Above 0: creatures that burn little energy have more babies.",
            hook="fitness", code="def fitness(c, world):\n    return c.efficiency ** 2", fmt="signed"),
    _slider("survive", "reward_hue", "Reward colour", -1.0, 1.0, 0.05, 0.0,
            "Above 0: creatures with a higher colour value have more babies. Fights with camouflage!",
            hook="fitness", code="def fitness(c, world):\n    return 0.5 + c.hue", fmt="signed"),
    _slider("change", "mutation_rate", "Mutation rate", 0.0, 0.10, 0.002, 0.01,
            "Share of DNA letters that change in each baby. 1% of 80 letters is about one change per baby.",
            hook="mutate", code="def mutate(dna, rate):\n    return point_mutate(dna, rate * 2)", fmt="pct1"),
    dict(kind="choice", group="mate", id="mating", label="Mate choice", default="clone",
         options=MATING_OPTIONS, labels=MATING_LABELS, hook="choose_mate",
         help="Clone: babies copy one parent. Otherwise two parents mix their DNA.",
         code="def choose_mate(me, candidates):\n    return most_similar(me, candidates)"),
    dict(kind="toggle", group="disasters", id="insurance", label="Extinction insurance", default=True,
         help="If almost everyone dies, a few survivors are cloned so you can keep experimenting.", code="",
         hook=None),
]

BUILTIN_ACTIONS = [
    dict(id="meteor", label="Meteor strike", help="Wipes out everything in a big circle."),
    dict(id="plague", label="Plague", help="Kills about 40% of creatures at random."),
    dict(id="famine", label="Famine", help="Clears all the food right now."),
    dict(id="iceage", label="Ice age", help="Food nearly stops growing for a while."),
]

PRESETS = [
    dict(id="predator_boom", label="Predator boom", blurb="Ten hunters with sharp eyes. Hide or run.",
         values={"predators": 10, "eyesight": 24, "food_rate": 1.2, "pop_cap": 300}),
    dict(id="ice_age", label="Ice age", blurb="Pale ground, scarce food. Colours shift fast.",
         values={"ground_color": 0.92, "food_rate": 0.55, "predators": 4, "pop_cap": 200}),
    dict(id="island", label="Island", blurb="A small, mutation-happy population with few predators.",
         values={"pop_cap": 110, "mutation_rate": 0.035, "predators": 1, "food_rate": 1.3}),
    dict(id="famine", label="Famine", blurb="Little food. Thrifty creatures win.",
         values={"food_rate": 0.45, "predators": 2, "reward_efficiency": 0.6}),
    dict(id="speed_breeders", label="Speed breeders", blurb="No predators. You choose: fast creatures breed.",
         values={"predators": 0, "reward_speed": 1.0, "mutation_rate": 0.02}),
]


class Settings:
    """current value of every control. read as settings.predators or controls.my_slider."""

    def __init__(self):
        object.__setattr__(self, "_defs", {})
        object.__setattr__(self, "_v", {})
        object.__setattr__(self, "touched", set())
        self.define(BUILTIN)

    def define(self, defs):
        """(re)declare controls, keeping the values of ones that still exist."""
        keep = dict(self._v)
        self._defs.clear()
        self._v.clear()
        for d in defs:
            self._defs[d["id"]] = d
            self._v[d["id"]] = keep.get(d["id"], d["default"])

    def __getattr__(self, name):
        try:
            return object.__getattribute__(self, "_v")[name]
        except KeyError:
            raise AttributeError("no control called %r" % name)

    def __getitem__(self, name):
        return self._v[name]

    def get(self, name, default=None):
        return self._v.get(name, default)

    def set(self, name, value, user=True):
        d = self._defs.get(name)
        if d is None:
            return False
        k = d["kind"]
        if k == "slider":
            value = max(d["lo"], min(d["hi"], float(value)))
            if d.get("fmt") == "int":
                value = int(round(value))
        elif k == "choice":
            if value not in d["options"]:
                return False
        else:
            value = bool(value)
        self._v[name] = value
        if user:
            self.touched.add(name)
        return True

    def reset_all(self):
        for k, d in self._defs.items():
            self._v[k] = d["default"]
        self.touched.clear()

    def changed(self):
        return {k: v for k, v in self._v.items() if v != self._defs[k]["default"]}

    def definitions(self):
        return list(self._defs.values())
