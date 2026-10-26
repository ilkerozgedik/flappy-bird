# Flappy Bird

A tiny, responsive Flappy Bird browser game built with **vanilla JavaScript and HTML5 Canvas**. No runtime dependencies, frameworks, build steps, trackers or backend.

**Play:** https://ilkerozgedik.github.io/flappy-bird/

## Controls

- **Mobile:** tap the game area to flap.
- **Desktop:** click, press **Space** or **Arrow Up**.
- Dodge the pipes and beat your personal best (stored only in your browser).

## Run locally

ES modules need an HTTP server (opening index.html with file:// will not work):

~~~sh
python3 -m http.server 8000
~~~

Open http://localhost:8000.

## Test

~~~sh
node --test
node --check game.mjs
node --check logic.mjs
~~~

Node is used only for tests, **not** for the site itself.

## Deploy to GitHub Pages

GitHub Pages serves the repository root from the **main** branch. Just push static files; no CI build, package manager or hosting server is required.

## Project layout

- index.html + style.css: game shell and overlays
- game.mjs: Canvas rendering, input and sound
- logic.mjs: dependency-free, testable game rules
- test/: built-in Node test runner
- assets/: sprite images and sound effects migrated from the earlier Flutter/Flame project

**Asset note:** Game sprites and audio originated in the archived Flappy Bird clone. They may be subject to third-party rights; no third-party asset license is claimed here. Replace them with independently licensed assets before republishing or commercial reuse.
