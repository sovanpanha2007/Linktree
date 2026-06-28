# 🔗 Linktree — Self-Hosted

Your personal link page, hosted free forever on Cloudflare.

**Live at:** `yourname.pages.dev` (or `yourname.me` after domain setup)
**Admin at:** `yourname.pages.dev/admin.html?key=YOUR_SECRET`

---

## 🗂️ Project Structure

```
linktree/
├── public/
│   ├── index.html      ← Public link page (your visitors see this)
│   └── admin.html      ← Admin panel (only you can access this)
├── functions/
│   ├── _middleware.js  ← Guards /admin with IP + secret key
│   └── api/
│       ├── links.js         ← GET all links / POST new link
│       ├── links/[id].js    ← PUT update / DELETE link
│       └── profile.js       ← GET/PUT your name, bio, avatar
├── schema.sql          ← Database structure
├── wrangler.toml       ← Cloudflare config (edit this!)
└── package.json
```

---

## 🚀 Setup Guide (Step by Step)

> Never deployed before? No problem. Follow each step carefully.

---

### Step 1 — Install Node.js

Download and install Node.js from: https://nodejs.org (choose the LTS version)

Verify it installed:
```bash
node --version   # should print v20.x.x or higher
npm --version    # should print 10.x.x or higher
```

---

### Step 2 — Install Wrangler (Cloudflare's CLI tool)

```bash
npm install
```

This installs Wrangler from `package.json`. Then login to Cloudflare:

```bash
npx wrangler login
```

A browser window will open — log in with your Cloudflare account (create one free at https://dash.cloudflare.com).

---

### Step 3 — Create your D1 database

```bash
npm run db:create
```

You'll see output like:
```
✅ Successfully created DB 'linktree-db'
...
database_id = "abc123-your-id-here"
```

**Copy the `database_id` value** and paste it into `wrangler.toml`:

```toml
# wrangler.toml
database_id = "abc123-your-id-here"   ← paste here
```

---

### Step 4 — Initialize the database (create tables)

```bash
npm run db:init
```

This creates the `links` and `profile` tables with starter data.

---

### Step 5 — Set your secret admin key

Open `wrangler.toml` and change:

```toml
ADMIN_SECRET_KEY = "change-me-to-a-strong-secret"
```

Pick something hard to guess — like a random word + numbers: `mango-cloud-7842`

> ⚠️ Keep this secret. Anyone with this key can edit your links.

---

### Step 6 — Test locally

```bash
npm run dev
```

Open your browser:
- **Public page:** http://localhost:8788
- **Admin panel:** http://localhost:8788/admin.html?key=dev-secret

The local dev key is `dev-secret` (set in package.json). You can change it there.

---

### Step 7 — Push to GitHub

1. Create a new repo at https://github.com/new
2. Push your code:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOURUSERNAME/linktree.git
git push -u origin main
```

---

### Step 8 — Deploy to Cloudflare Pages

1. Go to https://dash.cloudflare.com → **Workers & Pages** → **Create**
2. Click **Connect to Git** → Select your GitHub repo
3. Build settings:
   - **Framework preset:** None
   - **Build command:** *(leave empty)*
   - **Build output directory:** `public`
4. Click **Save and Deploy**

> First deploy takes ~1 minute. After that, every `git push` auto-deploys!

---

### Step 9 — Add your environment variables in Cloudflare

In Cloudflare Pages → your project → **Settings** → **Environment variables**:

| Variable | Value |
|----------|-------|
| `ADMIN_SECRET_KEY` | your secret key |
| `ALLOWED_ADMIN_IP` | your IP (get it at https://ifconfig.me) or `0.0.0.0` to skip IP check |

Then redeploy: **Deployments** → **Retry deployment**

---

### Step 10 — Initialize the remote database

```bash
npm run db:init:remote
```

This creates the tables in your live Cloudflare D1 database.

---

### Step 11 — Bind D1 to your Pages project

In Cloudflare Pages → **Settings** → **Bindings** → **Add binding**:
- Type: **D1 database**
- Variable name: `DB`
- D1 database: `linktree-db`

Save → Redeploy.

---

### ✅ You're live!

Visit `https://YOUR-PROJECT.pages.dev` to see your link page.
Admin panel: `https://YOUR-PROJECT.pages.dev/admin.html?key=YOUR_SECRET_KEY`

---

## 🌍 Connect your .me domain (optional)

1. Claim your free `.me` domain at https://education.github.com → Student Pack → Namecheap
2. In Namecheap → **Manage domain** → set nameservers to Cloudflare's
3. Add the domain to Cloudflare (free plan)
4. In Cloudflare Pages → **Custom domains** → Add your domain
5. Done! Your site is now at `yourname.me`

---

## ✏️ How to update your links

1. Open: `https://YOUR-SITE/admin.html?key=YOUR_SECRET_KEY`
2. Add, edit, or delete links
3. Changes appear on your public page instantly — no redeploy needed!

---

## 🔒 Security tips

- **Change the default secret key** before deploying (Step 5)
- **Set your IP** in `ALLOWED_ADMIN_IP` for extra protection
- **Never share your admin URL** with others
- Your admin URL looks like: `/admin.html?key=your-secret` — keep it private

---

## 🆘 Troubleshooting

| Problem | Fix |
|---------|-----|
| Admin says "Access Denied" | Check your secret key in the URL matches `ADMIN_SECRET_KEY` in Cloudflare env vars |
| Links not loading | Check D1 binding is set in Cloudflare Pages settings |
| Changes not showing | Redeploy in Cloudflare Pages dashboard |
| Locked out of admin | Use a different network or set `ALLOWED_ADMIN_IP=0.0.0.0` temporarily |
