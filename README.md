# Gargantua

> AI Agent Framework for Java — showcase site

[![Deploy to GitHub Pages](https://github.com/GiskardB/gargantua-site/actions/workflows/deploy.yml/badge.svg)](https://github.com/GiskardB/gargantua-site/actions/workflows/deploy.yml)

🌐 **Live demo:** https://giskardb.github.io/gargantua-site/

---

## What this repo contains

A single-page showcase site for the Gargantua agent framework. Built as a hand-authored HTML + React (via Babel) prototype, then bundled into a single self-contained file for production.

```
.
├── Gargantua.html          ← source (loads src/*.jsx via Babel at runtime)
├── src/
│   ├── app.jsx             ← root component
│   ├── hero.jsx
│   ├── features.jsx
│   ├── architecture.jsx
│   ├── blackhole.jsx
│   ├── quickstart.jsx
│   └── logo.jsx
├── tweaks-panel.jsx        ← in-page design tweaks panel
├── dist/
│   └── index.html          ← bundled, single-file production build (~1.5 MB)
├── .github/workflows/
│   └── deploy.yml          ← auto-publishes dist/ to GitHub Pages on push
├── DEPLOY.md               ← deploy notes
└── README.md
```

## Local development

Just open `Gargantua.html` in a browser — no build step, no `npm install`. Babel transpiles the JSX at runtime.

For a clean serve (avoids `file://` quirks):

```bash
python3 -m http.server 8000
# → http://localhost:8000/Gargantua.html
```

## Production build

`dist/index.html` is the **single-file**, self-contained build:
- Zero external network requests (React, Babel, fonts, JSX all inlined)
- Works offline
- Loads instantly from any CDN

To regenerate after editing the sources, ask Claude to *"rebuild the bundle"* — the project includes a packaging tool that re-inlines all assets.

## Deploy

Pushed automatically to **GitHub Pages** on every commit to `main` via the included [GitHub Action](.github/workflows/deploy.yml). The action publishes the contents of `dist/`.

First-time setup:

1. Push this repo to GitHub
2. Open the repo on GitHub: **Settings → Pages**
3. Under **Source**, select **GitHub Actions**
4. Done — the workflow runs on every push to `main`

See [`DEPLOY.md`](DEPLOY.md) for alternative deploy methods (manual, branch-based, custom domain).

## License

MIT — see [`LICENSE`](LICENSE).
