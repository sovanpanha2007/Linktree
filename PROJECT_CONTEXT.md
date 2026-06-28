# PROJECT_CONTEXT.md — Linktree (Self-Hosted)

> **Single source of truth** for scope, architecture, guardrails, and eval criteria.
> Re-read this file before any code change, prompt change, or tool addition/removal.

---

## 0. Status

| Field | Value |
|-------|-------|
| **Project name** | Linktree (Self-Hosted) |
| **Stage** | Idea |
| **Owner** | Me |
| **Last reviewed** | 2026-06-27 |

---

## 1. Problem Definition & Scope

### 1.1 What This Project Is FOR

- A self-hosted personal link page displaying all social account links in one place
- Visitors land on the page and click any link to be redirected to the matching social account
- Accessible to anyone on the internet (e.g. people coming from TikTok bio, Instagram, etc.)
- Owner manages links via a password-protected admin panel (add / edit / delete)

### 1.2 What This Project Is Explicitly NOT For

- No visitor accounts or sign-ups
- No analytics dashboard
- No comments, forms, or contact features
- No e-commerce or payments
- No content beyond links (no blog, feed, or media uploads)

### 1.3 Success Definition

> "Anyone with the URL can open the page from any device or platform, see all links, and click through without issues — and the page loads in under 2 seconds."

### 1.4 Primary User / Caller

- **Owner (you):** manages and updates links via the admin panel
- **Visitors:** anyone on the internet with the link (coming from TikTok, Instagram, etc.) — browser-based, no login needed

---

## 2. Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend | Cloudflare Pages | Free forever, global CDN, deploys from GitHub |
| Backend | Cloudflare Workers | Free tier (100k req/day), serverless, no server to manage |
| Database | Cloudflare D1 (SQLite) | Free (5GB, 5M reads/day), SQLite-compatible, zero setup |
| Domain (primary) | `yourname.me` via Namecheap (GitHub Education — free 1 year) | Free via GitHub Student Pack |
| Domain (fallback) | `yourname.pages.dev` | Free forever, always active even with custom domain |
| Deploy pipeline | Push to GitHub → Cloudflare auto-deploys | Zero-config CI/CD |
| HTTPS | Built into Cloudflare | Free, automatic |

### 2.1 Tools / Function Calls

| Tool | Purpose | Read or Write? | Reversible? | Requires Confirmation? |
|------|---------|----------------|-------------|------------------------|
| Cloudflare D1 (read) | Fetch links to display on public page | Read | N/A | No |
| Cloudflare D1 (write) | Add / edit / delete links via admin | Write | No (delete is permanent) | Yes — confirm dialog before save/delete |
| Cloudflare Worker | Serve public page + handle admin API | Read + Write | N/A | No |
| GitHub | Store and version-control code | Read + Write | Yes (git revert) | No |

### 2.2 Data Flow

```
[Visitor]
  → hits yourname.me (or yourname.pages.dev)
  → Cloudflare Worker receives request
  → reads links from D1 database
  → renders HTML link page
  → visitor clicks a link → Worker returns 301 redirect → visitor lands on social page

[Owner / Admin]
  → opens /admin?key=yourSecretKey from whitelisted laptop IP
  → Worker checks IP + secret key → grants access
  → admin page loads current links from D1
  → owner adds / edits / deletes a link
  → confirm dialog appears → owner confirms
  → Worker writes change to D1
  → public page reflects change instantly

⚠️ Untrusted input enters at: admin form fields (link name, URL) → sanitize before writing to D1
```

---

## 3. Hard Rules

- ✅ **No irreversible action** (delete) without an explicit confirm dialog.
- ✅ **Admin panel is IP-locked** — only accessible from owner's whitelisted laptop IP.
- ✅ **Admin panel has a secret URL key** — `/admin?key=yourSecretKey` — as backup if IP changes.
- ✅ **Visitors can only view and click links** — no forms, no uploads, no interaction beyond clicking.
- ✅ **All form inputs are sanitized** before writing to D1 — treat all user input as untrusted.
- ✅ **Rate limit admin panel** to 10 requests/minute — blocks brute force attempts.
- ✅ **Rate limit public page** to prevent abuse from eating the free tier quota.

### 3.1 Escalation Path

1. Site goes down → check Cloudflare dashboard for errors
2. If bad deploy → previous version stays live; fix code → push to GitHub → auto-redeploys
3. If D1 database issue → restore links from backup JSON file kept in GitHub repo
4. If locked out of admin (IP changed) → use secret URL key; or update IP whitelist in config + redeploy
5. If free tier limit hit → Cloudflare resets limits daily; add stricter rate limiting if abuse continues

---

## 4. Failure Modes & Containment

| Failure Mode | Detection | Containment |
|-------------|-----------|-------------|
| Cloudflare free tier limit hit (100k req/day) | Cloudflare dashboard alert | Rate limiting on public page; limits reset daily |
| Locked out of admin (IP changed) | Can't access `/admin` | Use secret URL key as backup; update IP in config + redeploy |
| Link saves but redirects to wrong URL | Manual test after every save | Confirm dialog before saving; test link shown in admin |
| D1 database goes down | Site shows no links / errors | Cloudflare handles DB uptime; backup JSON in GitHub repo |
| GitHub deploy fails | Cloudflare Pages build log shows error | Fix code → push again; previous version stays live |
| Brute force on admin panel | Rate limit triggers (10 req/min) | IP blocked after threshold; alert logged in Worker logs |
| Malicious input in admin form | Input sanitization catches it | Strip/escape all input before writing to D1 |

---

## 5. Eval Strategy

### 5.1 Test Scenario Categories

**Happy Path:**
- Visitor opens `yourname.me` on desktop → sees all links with icons → clicks one → redirected correctly
- Visitor opens `yourname.me` on mobile (TikTok in-app browser) → page looks good, links work
- Owner opens `/admin` from laptop → adds a new link → it appears on public page instantly
- Owner edits a link URL → visitor now redirected to the new URL
- Owner deletes a link → it disappears from the public page immediately

**Edge Cases:**
- Owner adds a link with an invalid/broken URL → admin shows a warning, does not save
- Visitor on a slow 3G connection → page still loads under 5 seconds (lightweight HTML/CSS)
- Owner tries to access `/admin` from a different device (wrong IP) → gets a clean "Access Denied" page, no crash
- D1 returns empty results → public page shows a friendly "coming soon" message, no blank/broken page

**Adversarial:**
- Someone tries to access `/admin` without the secret key → blocked (403)
- Someone spams the public page → rate limited, no free tier blowout
- Someone injects `<script>` tags via admin form → input sanitized, not executed

### 5.2 Pass / Fail Criteria

> ✅ **Pass** = page loads in under 2 seconds on any device + all links redirect to the correct URL + admin CRUD works end to end + non-whitelisted IPs cannot access admin + malicious input is sanitized and not rendered

### 5.3 Regression Policy

- ✅ Manual test of all happy-path scenarios required before any code change goes live
- ✅ Keep a backup JSON of all links in GitHub — verify it matches D1 after any change
- ✅ Note which Worker version + D1 schema version is live at all times (in this file)

---

## 6. Production Readiness Checklist

- ✅ **Logging:** Cloudflare Workers built-in logs — captures every request, redirect, and error
- ✅ **Traffic monitoring:** Cloudflare dashboard — free, shows visits, bandwidth, top countries
- ✅ **Rate limiting:** 10 req/min on admin; abuse protection on public page
- ✅ **Rollback plan:** GitHub commit history — broken deploy? Revert commit in <2 min, Cloudflare redeploys automatically
- ✅ **Kill switch:** Cloudflare dashboard → disable Worker instantly, no redeploy needed
- ✅ **Ownership:** Solo project — owner is on-call

---

## 7. Open Questions / Risks

- ⚠️ Owner has never deployed a website, used a hosting platform, or registered a domain — **step-by-step deployment guide needed** before going live
- ⚠️ Need to learn and set up: Cloudflare Pages, GitHub integration, D1 database, Namecheap domain connection to Cloudflare
- ⚠️ After 1 year, `.me` domain requires renewal (~$20/year) — decide then whether to pay or fall back to `yourname.pages.dev`

---

*Framework version: 1.0 — Re-read this file before any code, prompt, or tool change.*
