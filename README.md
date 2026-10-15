# Bremray Electrical Field App ⚡

The full owner-facing field app (pricing + estimate/invoice). The installer-facing
pergola/sunroom-only version lives in `hallek-86/bremray-pergola-field`.

## Deployment (free) — Vercel

The app is a pre-built static frontend in `dist/` plus a tiny API proxy.

### One-time setup

1. Go to [vercel.com](https://vercel.com) and sign in with the GitHub account.
2. Click **Add New… → Project** and import the **`bremray-field`** repository.
3. Before deploying, open **Environment Variables** and add:
   - **Name:** `HCP_API_KEY`
   - **Value:** your HouseCall Pro API key
4. Click **Deploy**.

### How it works on Vercel

- `dist/` is served as static files (`outputDirectory` in `vercel.json`).
- `api/[...path].js` is a serverless function that proxies the browser's
  `/api/*` calls to `api.housecallpro.com` with the `Authorization: Token <key>`
  header, so the key never reaches the browser. The rewrite rule in
  `vercel.json` routes every `/api/*` path to it.
- Any other unknown path falls back to `index.html` (single-page app).

### Alternative hosting — Railway

- **Build:** Nixpacks (see `NIXPACKS.toml`) — `npm install` (no-op, no deps)
- **Start:** `node server.js` (see `railway.json`) — serves `dist/` + the same proxy
- Set the `HCP_API_KEY` variable in Railway's Variables tab.
