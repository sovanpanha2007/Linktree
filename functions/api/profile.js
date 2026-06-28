// ============================================================
// functions/api/profile.js
// GET /api/profile  → get name, bio, avatar (public)
// PUT /api/profile  → update profile (admin only)
// ============================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

// GET /api/profile — public
export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare('SELECT key, value FROM profile').all();
    const profile = Object.fromEntries(results.map(r => [r.key, r.value]));
    return Response.json({ profile }, { headers: corsHeaders });
  } catch (err) {
    console.error('GET /api/profile error:', err);
    return Response.json({ error: 'Failed to fetch profile' }, { status: 500, headers: corsHeaders });
  }
}

// PUT /api/profile — admin only
export async function onRequestPut({ request, env }) {
  const authError = checkAuth(request, env);
  if (authError) return authError;

  try {
    const body = await request.json();
    const allowed = ['name', 'bio', 'avatar'];

    for (const key of allowed) {
      if (body[key] !== undefined) {
        let value = String(body[key]);
        if (key === 'avatar') {
          value = sanitizeAvatar(value);
        } else {
          value = sanitize(value);
        }
        await env.DB.prepare(
          'INSERT INTO profile (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value'
        ).bind(key, value).run();
      }
    }

    return Response.json({ success: true }, { headers: corsHeaders });
  } catch (err) {
    console.error('PUT /api/profile error:', err);
    return Response.json({ error: 'Failed to update profile' }, { status: 500, headers: corsHeaders });
  }
}

// ---- Helpers ----

function checkAuth(request, env) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (token !== env.ADMIN_SECRET_KEY) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  }
  return null;
}

function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim().slice(0, 300);
}

function sanitizeAvatar(str) {
  if (typeof str !== 'string') return '';
  const trimmed = str.trim();
  if (trimmed.startsWith('data:image/')) {
    if (/^data:image\/(jpeg|png|webp|gif);base64,/.test(trimmed)) {
      return trimmed.slice(0, 1024 * 1024 * 2); // 2MB max
    }
  }
  return trimmed.replace(/<[^>]*>/g, '').slice(0, 2000);
}
