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

### Required: set backend URL on Netlify

After your API is live on Render, open **Netlify → Site configuration → Environment variables** and add:

| Key | Value | Scope |
|-----|--------|--------|
| `API_PROXY_TARGET` | `https://YOUR-API.onrender.com` | All (Production + Deploy previews) |

**No trailing slash.** Example: `https://taskperform-api.onrender.com`

Then **Trigger deploy → Deploy site** (required after adding env vars).

The site uses a **Netlify Function** (`netlify/functions/api.js`) to forward `/api/*` to your backend. You do **not** need to rebuild when only changing the backend URL — but you **must redeploy** once after setting the variable.

### Option A — Netlify UI

1. [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import from Git**.
2. Select the repo.
3. Build settings (auto-read from `netlify.toml`):

   | Setting | Value |
   |---------|--------|
   | Build command | `npm run build:netlify` |
   | Publish directory | `public` |

4. Add **`API_PROXY_TARGET`** (see “Required” section above).

5. **Deploy site**, then update Render **`CLIENT_URL`** to your Netlify URL and redeploy the API.

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
| `netlify.toml` | Build, redirects, functions config |
| `netlify/functions/api.js` | Proxies `/api/*` → Render backend |
| `scripts/netlify-build.js` | Writes `public/js/config.js` |
| `render.yaml` | Optional Render blueprint for API |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| **`POST /api/auth/login` → 404** | Push latest code (includes API proxy function), set `API_PROXY_TARGET` on Netlify, **redeploy** |
| API 502 / “Backend unreachable” | Render API is down or wrong `API_PROXY_TARGET` URL |
| API 503 / “API not configured” | Add `API_PROXY_TARGET` in Netlify env and redeploy |
| CORS errors | Set `CLIENT_URL=https://charming-froyo-84b93d.netlify.app` on Render |

---

## Custom domain

Netlify: **Domain management** → add domain.  
Update Render `CLIENT_URL` to `https://yourdomain.com`.
