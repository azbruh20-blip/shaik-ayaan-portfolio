# Shaik Ayaan — Portfolio

Grade 9 student developer & creative technologist from Kuwait.
*Young mind. Big ideas. Building the future.*

One site, two complete experiences — switch with the button in the top-right corner:

- **F1 mode** (default) — light, racing-inspired, with a WebGL hero, circuit map and career timeline.
- **Dark cinematic mode** — near-black editorial layout with giant type and liquid image effects.

Both read the same data, so projects, achievements and media stay in sync.

## Run locally

The page loads images and a WebGL scene, so serve it over HTTP rather than opening the file directly:

```bash
python3 -m http.server 5173
```

Then open <http://localhost:5173/>. Add `?theme=dark` or `?theme=f1` to jump to a theme.

## Editing

- Content (projects, achievements, media, contact): `build/site-data.js`
- After editing anything in `build/`, rebuild `index.html`:

```bash
cd build && python3 assemble.py
```

Images live in `media/`.
