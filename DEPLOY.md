# Gargantua — Deploy guide

Single-file landing page for the Gargantua agent framework.

## Files

- `Gargantua.html` — source (development version, loads `src/*.jsx` via Babel)
- `dist/index.html` — **bundled, single-file build** for production deploy

---

## 🚀 Recommended: automated deploy via GitHub Actions

The repo includes [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) which publishes the contents of `dist/` to GitHub Pages on every push to `main`. **No manual file copying needed.**

### One-time setup

1. **Create the repo on GitHub** (empty, no README — we already have one):

   ```bash
   gh repo create gargantua --public --source=. --remote=origin
   # or, manually: create on github.com, then:
   # git remote add origin https://github.com/<user>/gargantua.git
   ```

2. **Initial commit + push:**

   ```bash
   git init
   git add .
   git commit -m "Initial commit: Gargantua showcase"
   git branch -M main
   git push -u origin main
   ```

3. **Enable Pages with Actions as source:**
   - Open the repo on GitHub → **Settings → Pages**
   - **Source:** select **GitHub Actions** (not "Deploy from a branch")
   - Save.

4. **Wait ~30 seconds.** The deploy workflow runs automatically. Check progress under the **Actions** tab.

URL: `https://<user>.github.io/<repo>/`

### Subsequent updates

Just commit and push:

```bash
git add .
git commit -m "Update copy"
git push
```

The Action rebuilds the Pages site automatically. No manual `cp dist/index.html index.html` step.

> **Important:** when you edit `Gargantua.html` or `src/*.jsx`, ask Claude to *"rebuild the bundle"* before pushing — `dist/index.html` is what actually gets deployed.

---

## Custom domain

In **Settings → Pages → Custom domain** enter your domain (e.g. `gargantua.dev`). GitHub auto-creates a `CNAME` file in the deployed site. Add a DNS `CNAME` record at your registrar pointing `gargantua.dev` → `<user>.github.io`. Enable **Enforce HTTPS**.

If you use a custom domain, also add a `dist/CNAME` file with the domain on a single line so it survives rebuilds:

```bash
echo "gargantua.dev" > dist/CNAME
git add dist/CNAME && git commit -m "Add CNAME" && git push
```

---

## Manual alternatives (no Actions)

### Option A — Pages from `main` / root

```bash
cp dist/index.html index.html
git add index.html
git commit -m "Add showcase page"
git push origin main
```

On GitHub: **Settings → Pages → Source: Deploy from a branch → main / (root)**.

### Option B — Pages from `/docs`

```bash
mkdir -p docs
cp dist/index.html docs/index.html
git add docs/index.html
git commit -m "Add showcase page"
git push origin main
```

**Settings → Pages → Source: main / `/docs`**.

### Option C — Dedicated `gh-pages` branch

```bash
git checkout --orphan gh-pages
git rm -rf .
cp /tmp/dist-index.html ./index.html
git add index.html
git commit -m "Initial Pages deploy"
git push -u origin gh-pages
```

**Settings → Pages → Source: gh-pages / (root)**.

---

## Notes

- Bundle size: ~1.5 MB (mostly React + Babel-transpiled JSX inlined). Loads instantly from any CDN.
- Zero external requests after the page loads — works offline, no analytics, no fonts CDN at runtime.
- Tested on Chrome, Firefox, Safari, mobile Safari.
