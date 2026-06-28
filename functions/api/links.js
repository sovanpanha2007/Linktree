// ============================================================
// functions/api/links.js
// GET  /api/links  → returns all active links (public)
// POST /api/links  → creates a new link (admin only)
// ============================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

// GET /api/links — public, returns all active links ordered by order_num
export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT id, title, subtitle, url, icon, order_num FROM links WHERE active = 1 ORDER BY order_num ASC, id ASC'
    ).all();

    return Response.json({ links: results }, { headers: corsHeaders });
  } catch (err) {
    console.error('GET /api/links error:', err);
    return Response.json({ error: 'Failed to fetch links' }, { status: 500, headers: corsHeaders });
  }
}

// POST /api/links — admin only, creates a new link
export async function onRequestPost({ request, env }) {
  // Auth check
  const authError = checkAuth(request, env);
  if (authError) return authError;

  try {
    const body = await request.json();

    // Validate required fields
    const title = sanitize(body.title);
    const subtitle = sanitize(body.subtitle);
    const url = sanitizeUrl(body.url);
    const icon = sanitizeIcon(body.icon || '🔗');
    const order = parseInt(body.order_num) || 0;

    if (!title || !url) {
      return Response.json({ error: 'title and url are required' }, { status: 400, headers: corsHeaders });
    }

    const result = await env.DB.prepare(
      'INSERT INTO links (title, subtitle, url, icon, order_num, active) VALUES (?, ?, ?, ?, ?, 1)'
    ).bind(title, subtitle, url, icon, order).run();

    return Response.json(
      { success: true, id: result.meta.last_row_id },
      { status: 201, headers: corsHeaders }
    );
  } catch (err) {
    console.error('POST /api/links error:', err);
    return Response.json({ error: 'Failed to create link' }, { status: 500, headers: corsHeaders });
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
  // Strip HTML tags to prevent XSS
  return str.replace(/<[^>]*>/g, '').trim().slice(0, 200);
}

function sanitizeIcon(str) {
  if (typeof str !== 'string') return '🔗';
  const trimmed = str.trim();
  // 1. Raw SVG
  if (trimmed.startsWith('<svg') && trimmed.endsWith('</svg>')) {
    if (trimmed.toLowerCase().includes('script') ||
      trimmed.toLowerCase().includes('javascript:') ||
      /on\w+\s*=/i.test(trimmed)) {
      return '🔗';
    }
    return trimmed.slice(0, 2000);
  }
  // 2. Base64 Data URL or standard HTTP/HTTPS image URL
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (trimmed.startsWith('data:image/') && !/^data:image\/(jpeg|png|webp|gif);base64,/.test(trimmed)) {
      return '🔗';
    }
    return trimmed.slice(0, 2000);
  }
  // 3. Fallback (emoji or text)
  return sanitize(str);
}


function sanitizeUrl(str) {
  if (typeof str !== 'string') return '';
  const trimmed = str.trim();
  // Allow http://, https://, and mailto: URLs
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('mailto:')) {
    return '';
  }
  return trimmed.slice(0, 500);
}
