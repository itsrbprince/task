# Deploy TaskPerform on Netlify

## Why you saw 404

Netlify only hosts **static files**. `/api/auth/login` does not exist unless you:

1. Deploy the **Express API** elsewhere (Render), and  
2. Tell Netlify where the API is via an **environment variable** + **redeploy**

---

## Step-by-step fix

### 1. Deploy API on Render (if not done)

1. [render.com](https://render.com) → **New Web Service** → connect GitHub repo  
2. **Build command:** `npm install`  
3. **Start command:** `npm start`  
4. **Environment variables:**

| Key | Value |
|-----|--------|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | Random secret string |
| `NODE_ENV` | `production` |
| `CLIENT_URL` | `https://charming-froyo-84b93d.netlify.app` |

5. Deploy and test: open  
   `https://YOUR-SERVICE.onrender.com/api/health`  
   You must see: `{"success":true,"message":"Task Performance API is running"}`

### 2. Configure Netlify (required)

**Netlify → Site configuration → Environment variables → Add variable**

Use **one** of these (recommended: `API_BASE_URL`):

| Key | Value example |
|-----|----------------|
| **`API_BASE_URL`** | `https://YOUR-SERVICE.onrender.com/api` |
| `API_PROXY_TARGET` | `https://YOUR-SERVICE.onrender.com` |

- No trailing slash on the host  
- Scope: **All** (Production + Deploy previews)

### 3. Redeploy Netlify

**Deploys → Trigger deploy → Deploy site**

The build **will fail** if neither env var is set (this prevents broken 404 deploys).

After success, check deploy log for:
```
✓ Direct API: https://your-api.onrender.com/api
```

### 4. Test login

Open `https://charming-froyo-84b93d.netlify.app` and sign in.

In DevTools → Network, login should go to either:
- `https://YOUR-SERVICE.onrender.com/api/auth/login` (direct), or  
- `https://charming-froyo-84b93d.netlify.app/api/auth/login` (proxy → Render)

---

## Quick checklist

| Check | Expected |
|-------|----------|
| Render `/api/health` | JSON success |
| Netlify env `API_BASE_URL` set | Yes |
| Netlify deploy | Build succeeded (not failed) |
| Render `CLIENT_URL` | Your Netlify URL |
| MongoDB Atlas | Network access allows `0.0.0.0/0` |

---

## Still 404?

1. **Build failed on Netlify** → add `API_BASE_URL` and redeploy  
2. **Only uploaded `public/` folder** → connect **full Git repo** instead  
3. **Render URL wrong** → copy exact URL from Render dashboard  
4. **No Render service** → API must run on Render; Netlify alone cannot run Express  

---

## Local development

```bash
npm install
npm run seed   # needs MongoDB
npm run dev    # http://localhost:5000
```

No Netlify env vars needed locally.
