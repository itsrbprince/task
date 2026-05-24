# Deploy TaskPerform on Netlify

This app has two parts:

| Part | Host | Why |
|------|------|-----|
| **Frontend** (HTML/CSS/JS in `public/`) | **Netlify** | Static SPA |
| **API** (Express + MongoDB) | **Render** (or Railway/Fly) | Netlify cannot run this Node server + file uploads long-term |

---

## 1. MongoDB Atlas (database)

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. **Database Access** → add user + password.
3. **Network Access** → allow `0.0.0.0/0` (or Render’s IPs).
4. Copy connection string → `MONGODB_URI`.

---

## 2. Deploy API to Render

1. Push this repo to GitHub.
2. [render.com](https://render.com) → **New** → **Web Service** → connect repo.
3. Settings:

   | Field | Value |
   |-------|--------|
   | Build Command | `npm install` |
   | Start Command | `npm start` |
   | Health Check | `/api/health` |

4. **Environment variables:**

   | Key | Value |
   |-----|--------|
   | `MONGODB_URI` | Atlas connection string |
   | `JWT_SECRET` | long random string |
   | `NODE_ENV` | `production` |
   | `CLIENT_URL` | `https://YOUR-SITE.netlify.app` (set after Netlify deploy) |

5. Deploy → copy URL, e.g. `https://taskperform-api.onrender.com`.

6. Seed (optional, from your machine):

   ```bash
   MONGODB_URI="your-atlas-uri" npm run seed
   ```

---

## 3. Deploy frontend to Netlify

### Option A — Netlify UI (recommended)

1. [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import from Git**.
2. Select the repo.
3. Build settings (auto-read from `netlify.toml`):

   | Setting | Value |
   |---------|--------|
   | Build command | `npm run build:netlify` |
   | Publish directory | `public` |

4. **Site configuration → Environment variables** (choose one):

   **Proxy (same-origin `/api`, simpler CORS):**

   | Key | Value |
   |-----|--------|
   | `API_PROXY_TARGET` | `https://taskperform-api.onrender.com` |

   **Direct API URL:**

   | Key | Value |
   |-----|--------|
   | `API_BASE_URL` | `https://taskperform-api.onrender.com/api` |

5. **Deploy site**.

6. Copy Netlify URL → update Render `CLIENT_URL` to that URL → redeploy API.

### Option B — Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify init
# Set API_PROXY_TARGET or API_BASE_URL in Netlify dashboard
netlify deploy --prod
```

---

## 4. Verify

1. Open `https://YOUR-SITE.netlify.app`
2. Login: `admin@company.com` / `admin123` (if seeded)
3. Check browser Network tab — API calls go to `/api/...` (proxy) or your Render URL.

---

## Files added for Netlify

| File | Purpose |
|------|---------|
| `netlify.toml` | Build & publish settings |
| `scripts/netlify-build.js` | Injects `public/js/config.js` + `public/_redirects` |
| `public/js/config.js` | API base URL (local default `/api`) |
| `render.yaml` | Optional Render blueprint for API |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| API 404 on Netlify | Set `API_PROXY_TARGET` and redeploy; or set `API_BASE_URL` |
| CORS errors | Set `CLIENT_URL` on Render to exact Netlify URL (no trailing slash) |
| Login works locally, not on Netlify | MongoDB Atlas IP allowlist; check Render logs |
| File uploads fail | API must be on Render (not Netlify); uploads live on Render disk (ephemeral on free tier — use S3 for production) |

---

## Custom domain

Netlify: **Domain management** → add domain.  
Update Render `CLIENT_URL` to `https://yourdomain.com`.
