# Deploy TaskPerform on Netlify

## Important: two separate deployments

| Platform | What runs there | Environment variables |
|----------|-----------------|---------------------|
| **Netlify** | Frontend only (`public/`) | **`API_BASE_URL`** only |
| **Render** | Express API + MongoDB connection | `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV`, `CLIENT_URL` |

Do **not** put `MONGODB_URI` or `JWT_SECRET` on Netlify — they only work on Render.

---

## Fix your failed build

Your log shows Netlify has `MONGODB_URI`, `JWT_SECRET`, etc. but **not** `API_BASE_URL`.

### Step 1 — Netlify environment variables

**Remove from Netlify** (optional, they are ignored):
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRE`
- `PORT`

**Add on Netlify** (required):

| Key | Value |
|-----|--------|
| `API_BASE_URL` | `https://YOUR-SERVICE.onrender.com/api` |

Example: `https://taskperform-api.onrender.com/api`

Scope: **All** (Production + Deploy previews)

### Step 2 — Deploy API on Render (if not done)

1. [render.com](https://render.com) → **New Web Service** → your GitHub repo  
2. Build: `npm install` · Start: `npm start`  
3. **Render** environment variables:

| Key | Value |
|-----|--------|
| `MONGODB_URI` | Atlas connection string |
| `JWT_SECRET` | random secret |
| `NODE_ENV` | `production` |
| `CLIENT_URL` | `https://charming-froyo-84b93d.netlify.app` |

4. Test: `https://YOUR-SERVICE.onrender.com/api/health` → JSON success

### Step 3 — Redeploy Netlify

**Deploys → Trigger deploy**

Build log should show:
```
✓ Direct API (API_BASE_URL): https://your-api.onrender.com/api
```

---

## Alternative: proxy mode

Instead of `API_BASE_URL`, you can use:

| Key | Value |
|-----|--------|
| `API_PROXY_TARGET` | `https://YOUR-SERVICE.onrender.com` |

(no `/api` suffix)

---

## Verify

1. Netlify build **succeeds**  
2. Login request goes to `https://YOUR-SERVICE.onrender.com/api/auth/login`  
3. Not 404 on Netlify domain for API (unless using proxy mode)

---

## Local development

```bash
npm run dev
# Uses /api on localhost — no Netlify env vars needed
```
