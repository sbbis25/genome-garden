# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Decided with the user during design (Section 1): pure-Python 3.9+ engine, a standard-library HTTP server that streams frames with Server-Sent Events, and a static HTML/JS/CSS front end with no build step. Zero third-party dependencies, because some participants may not have Python installed. Launched with `python run.py`, which opens the browser. Fallbacks for people without Python: a setup guide (python.org or `uv`), a devcontainer for GitHub Codespaces, and a `python run.py --check` command.

## Users

Members of a bioinformatics club attending a 1-2 hour workshop, on a mix of Mac and Windows laptops. Most are non-programmers or have basic Python; one or two are strong programmers. The tool must serve all of them in the same room.

## Product Purpose

An event project for a club workshop: an open evolution garden with a very low barrier to entry. Beginners tune controls and watch populations evolve. Participants with some Python edit hook functions in `workshop.py`. Strong programmers add genes, behaviours and UI elements. There is no scoring or leaderboard. Success means that within about 5 minutes of launch a non-coder has changed something and seen a visible consequence, a beginner can find every no-code control without reading docs, and a strong programmer can add a gene and a behaviour in under 20 minutes. The project replaces the previous infection-simulation event in this repo, which was considered not polished enough.

## Positioning

Creatures carry a real DNA string (over ACGT) whose segments decode into traits, so the garden teaches sequence-level ideas (mutation, Hamming distance, phylogenetic trees, drift versus selection) rather than only showing dots that move. One `Settings` config drives three layers: no-code controls, copy-paste code, and write-your-own hooks. Every no-code control has a Python equivalent. Participants only ever edit Python, never HTML.
