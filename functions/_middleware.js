// ============================================================
// functions/_middleware.js
// Runs on EVERY request — guards /admin.html from unauthorized access
// ============================================================

// Simple in-memory rate limiter (resets on Worker restart — good enough for edge)
const adminAttempts = new Map(); // ip → { count, resetAt }

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Only guard admin routes
  if (!url.pathname.startsWith('/admin')) {
    return next();
  }

  const clientIP = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
  const keyParam = url.searchParams.get('key');

  // ---- Rate limiting (10 requests/min per IP on /admin) ----
  const now = Date.now();
  const record = adminAttempts.get(clientIP) || { count: 0, resetAt: now + 60_000 };

  if (now > record.resetAt) {
    // Reset window
    record.count = 0;
    record.resetAt = now + 60_000;
  }

  record.count++;
  adminAttempts.set(clientIP, record);

  if (record.count > 10) {
    return new Response(blockedPage('Too many requests. Try again in a minute.'), {
      status: 429,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // ---- Secret key check ----
  const validKey = env.ADMIN_SECRET_KEY;
  if (!keyParam || keyParam !== validKey) {
    return new Response(blockedPage('Access Denied. Invalid or missing key.'), {
      status: 403,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // ---- IP check (skipped if ALLOWED_ADMIN_IP is 0.0.0.0) ----
  const allowedIP = env.ALLOWED_ADMIN_IP || '0.0.0.0';
  if (allowedIP !== '0.0.0.0' && clientIP !== allowedIP) {
    return new Response(blockedPage(`Access Denied. Your IP (${clientIP}) is not whitelisted.`), {
      status: 403,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // ---- All checks passed — forward request ----
  return next();
}

// Clean error page shown on access denial
function blockedPage(message) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Access Denied</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0d0d14;
      font-family: system-ui, sans-serif;
      color: #f8fafc;
    }
    .card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 40px;
      text-align: center;
      max-width: 400px;
    }
    h1 { font-size: 3rem; margin-bottom: 12px; }
    p { color: #94a3b8; font-size: 1rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🔒</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}
