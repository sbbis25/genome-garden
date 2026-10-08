"""dna strings and how they decode into traits.

a creature's genome is one string over a, c, g, t. it is cut into segments, one
per gene. a trait is the share of g and c letters in its segment, stretched onto
the gene's range. one point mutation therefore nudges a trait a little, which is
what lets selection read clearly on the screen.
"""

import random

BASES = "ACGT"


class Gene:
    """one gene: how many dna letters it uses and what range its trait spans."""

    def __init__(self, length=16, range=(0.0, 1.0), description=""):
        self.length = int(length)
        self.range = (float(range[0]), float(range[1]))
        self.description = description


def default_genes():
    return {
        "speed": Gene(16, (0.4, 1.6), "how fast it moves"),
        "size": Gene(16, (0.6, 2.0), "body size; big bodies are easier to spot"),
        "sense": Gene(16, (4.0, 24.0), "how far it can see food and danger"),
        "hue": Gene(16, (0.0, 1.0), "body colour; match the ground to hide"),
        "efficiency": Gene(16, (0.6, 1.4), "how little energy it burns"),
    }


CORE_GENES = tuple(default_genes().keys())


def layout(genes):
    """[(name, start, end, lo, hi)] for each gene, in table order."""
    out, pos = [], 0
    for name, g in genes.items():
        out.append((name, pos, pos + g.length, g.range[0], g.range[1]))
        pos += g.length
    return out


def dna_length(genes):
    return sum(g.length for g in genes.values())


def decode(dna, lay):
    """dna string -> {trait name: value}."""
    traits = {}
    for name, a, b, lo, hi in lay:
        seg = dna[a:b]
        gc = (seg.count("G") + seg.count("C")) / float(b - a)
        traits[name] = lo + gc * (hi - lo)
    return traits


def random_dna(genes):
    """random genome. each gene gets its own gc bias so a fresh population has real variety."""
    parts = []
    for g in genes.values():
        p = random.uniform(0.1, 0.9)
        seg = []
        for _ in range(g.length):
            if random.random() < p:
                seg.append("G" if random.random() < 0.5 else "C")
            else:
                seg.append("A" if random.random() < 0.5 else "T")
        parts.append("".join(seg))
    return "".join(parts)


def is_valid_dna(dna, length):
    return isinstance(dna, str) and len(dna) == length and not (set(dna) - set(BASES))
