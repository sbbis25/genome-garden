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

## Operating Context

A live workshop, probably projected or run on participants' own laptops. People start from a repo and one command. Evolution is slow, so time controls (pause, 0.5x, 1x, 3x, 10x, 30x) matter. Participant surface is `workshop.py`; the engine and web front end in `garden/` are read-only for them.

## Capabilities and Constraints

- Simulation: 2D arena, regrowing food, creatures with energy, hidden predators that spot creatures more easily when creature colour contrasts with the ground colour (camouflage), biome zones.
- Genome: DNA string decoded into traits (`speed`, `size`, `sense`, `hue`, `efficiency`); new genes are added through a `GENES` table and do nothing until a hook reads them; changing `GENES` requires a world restart.
- No-code controls grouped by plain-language question: How harsh is the world? Who survives? How do they change? Who mates? Disasters. Plus time controls, seed, presets, undo/reset, an "Extinction insurance" toggle, and mouse "god tools".
- Hooks in `workshop.py`: `terrain`, `fitness` (neutral by default, optional bonus on top of natural selection), `mutate`, `choose_mate`, `on_tick`, `steer`, and optional `look`. UI is data-driven from Python via `CONTROLS`, `CHARTS`, `BUTTONS`. Hook edits hot-reload; errors appear in the UI with line numbers; broken hooks fall back to defaults.
- Main screen layout: chosen by the user as the "dashboard" layout, three columns (tabbed controls on the left, world plus trait histograms in the centre, creature card plus lineage tree on the right), with a top bar for presets, undo/reset, seed and time controls.
- Feedback: live trait charts and histograms, hover card with DNA and decoded traits, lineage following, and a plain-language "what's selecting right now" caption.
- Built as a v0 prototype: engine, local server, dashboard UI with Simple/Full views, Tune/Code/Scenarios tabs, five presets. Performance gate passed (pure Python runs about 2,000 ticks/s with 200-250 creatures, so 30x is safe). Still deferred: live lineage tree (a cluster count stands in), undo, biome brush, coach marks beyond the first two hints, devcontainer and uv setup guide.

## Brand Commitments

"Genome Garden" is the project name (it started life as the working title "Evolution Sandbox"). The user indicated club name, logo or colours may be provided; none have been supplied yet and none are to be invented.

## Evidence on Hand

The previous infection-simulation project in this repo (`simulation.py`, `workshop.py`, `model.py`, `img/sim.png`) is a reference for the workshop format, not a visual or code base to keep. There are no club branding assets, no real workshop attendee data, and no usage evidence yet; future work must not fabricate any.

## Product Principles

1. **First win in minutes.** A non-coder should change something and see a consequence within five minutes; the world is already running when the page opens.
2. **One config, three layers.** No-code controls, copy-paste code and custom hooks all edit the same settings, and the UI always shows when code is overriding a control.
3. **Python only for participants.** The front end is a fixed generic renderer; anything participants add shows up through Python declarations.
4. **Failure is visible and recoverable.** Errors name the problem and the line; a population crash is a lesson with a one-click reset, not a dead screen.
5. **Make evolution legible.** Show what changed and why, because slow, invisible selection is the main way this event could fail beginners.
