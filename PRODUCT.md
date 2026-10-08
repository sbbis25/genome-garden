# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Decided with the user during design (Section 1): pure-Python 3.9+ engine, a standard-library HTTP server that streams frames with Server-Sent Events, and a static HTML/JS/CSS front end with no build step. Zero third-party dependencies, because some participants may not have Python installed. Launched with `python run.py`, which opens the browser. Fallbacks for people without Python: a setup guide (python.org or `uv`), a devcontainer for GitHub Codespaces, and a `python run.py --check` command.

## Users

Members of a bioinformatics club attending a 1-2 hour workshop, on a mix of Mac and Windows laptops. Most are non-programmers or have basic Python; one or two are strong programmers. The tool must serve all of them in the same room.
