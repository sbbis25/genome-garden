"""
workshop.py  -  the one file you edit.

the simulation is already running with no code at all: use the sliders first.
when you want more, uncomment an example below: delete the "# " at the start of each
code line (the hash and the space after it, or python complains about indentation).
in most editors you can select the lines and press ctrl+/ (cmd+/ on a mac). then save
the file and the running world picks it up. mistakes show up in the "code" tab with
the line number, and the world keeps running.

handy things on a creature `c`:
    c.speed  c.size  c.sense  c.hue  c.efficiency    (its traits)
    c.x  c.y  c.energy  c.age  c.dna  c.gen
on `world`:  world.tick  world.creatures  world.predators  world.mean("speed")
             world.controls.<your slider>  world.kill_in_circle(x, y, r)  world.spawn(x, y)
helpers: nearest, hamming, similarity, most_similar, most_different,
         point_mutate, crossover, gc_content, lerp, clamp, noise
"""

from garden.api import *


# ── level 1: start values (instead of dragging sliders) ──────────────────────
# SETTINGS = {"predators": 8, "mutation_rate": 0.03}
