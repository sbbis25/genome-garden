# Genome Garden

Watch evolution happen on your screen. Little creatures eat, hide from predators, mate and mutate.
Every creature carries a real DNA string, and you decide what the world is like.

You can play with **no code at all**, copy and paste a few lines, or write your own rules.

## Start in one command

You need Python 3.9 or newer. There is nothing to install.

```
python run.py
```

Your browser opens on a running world. (On a Mac or Linux the command may be `python3 run.py`. On Windows, if `python` is not found, try `py run.py`.)
Do this the night before to be sure you are ready: `python run.py --check`

**No Python on your laptop?** Install it from https://www.python.org/downloads/ (tick "Add Python to PATH"
on Windows), or ask an organizer for a shared machine.

## Three ways to play

### 1. No code: use the controls
- Click anywhere in the world to drop food. Click a creature to pin it and read its DNA.
- Open **How harsh is the world?** and drag **Predators** up.
- Drag **Ground colour** and watch the creatures' body colours follow it. Predators spot creatures
  that stand out, so the ones that blend in survive.
- Try the **Scenarios** tab, or speed time up with 3x, 10x or 30x.
- Press **Show the science** for DNA, trait histograms and charts.
- Switch between light and dark with the round button next to it. It cycles auto (follows your system), light and dark, and remembers your choice.

### 2. A little code: copy and paste
Every slider has a `</>` button that shows the Python behind it. Open `workshop.py`, uncomment an
example, and save. The running world picks it up straight away. Mistakes show up in the **Code** tab
with the line number, and the world keeps running.

```python
def fitness(c, world):
    return 1 + c.speed * 2     # fast creatures have more babies
```

### 3. Your own rules
All of this lives in `workshop.py`, which is the only file you edit. You never touch any HTML.

| Hook | What it does |
|---|---|
| `fitness(c, world)` | Score for each creature. Above 1 means more babies, sooner. |
| `choose_mate(me, candidates)` | Pick who a creature mates with, or `None`. |
| `mutate(dna, rate)` | Make a baby's DNA. Keep the length, use only A, C, G, T. |
| `terrain(x, y, t)` | Paint the ground: `Patch(hue=..., food=..., danger=...)`. |
| `steer(c, world)` | Return an `(x, y)` point to head for, or `None`. |
| `on_tick(world)` | Runs 30 times a second with the whole world in your hands. |

Also in `workshop.py`:
- `SETTINGS = {...}` sets start values for the sliders.
- `GENES["night_owl"] = Gene(12, (0, 1))` adds a new trait. It does nothing until one of your hooks reads
  it, and you need to press **Restart world** afterwards.
- `CONTROLS`, `CHARTS` and `BUTTONS` add your own sliders, live charts and buttons to the screen.

Helpers: `nearest`, `hamming`, `similarity`, `most_similar`, `most_different`, `point_mutate`,
`crossover`, `gc_content`, `lerp`, `clamp`, `noise`.

## Things to try

1. Make predators rare, then make them everywhere. What happens to body colour?
2. Set **Reward speed** to +1 with no predators. Then try -1. Who wins?
3. Turn on **Mate choice: Most similar DNA** and watch **lineage clusters** in the science panel.
4. Write a `terrain()` with a river that has lots of food and lots of danger.
5. Write a `steer()` that sends creatures towards ground that matches their colour.
6. Add a `night_owl` gene and make owls breed more at some times than others.
7. Add a `Button` that drops a meteor on the middle of the map.

## How the DNA works

Each creature has 80 letters of DNA, cut into five genes of 16 letters: `speed`, `size`, `sense`, `hue`
and `efficiency`. A trait is the share of `G` and `C` letters in its gene, stretched onto a range, so one
mutation changes a trait a little. Pin a creature to see its letters, colour-banded by gene.

## If something goes wrong

- **Nothing opens:** go to the address printed in the terminal, usually http://127.0.0.1:8765/
- **Port busy:** another copy is running. Close it, or it will pick the next free port for you.
- **Red banner at the top:** your `workshop.py` has a mistake. The line number is in the Code tab.
  The last working version keeps running until you fix it.
- **Everything died:** that is allowed. Press **Restart world**, or leave **Extinction insurance** on.
- **Slow on an old laptop:** lower **Crowding limit**, or drop to 1x speed.

## What is in the folder

```
run.py          start here
workshop.py     the one file you edit
garden/         the engine and the web page (you do not need to touch it)
```
