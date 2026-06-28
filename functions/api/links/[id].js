// ============================================================
// functions/api/links/[id].js
// PUT    /api/links/:id  → update a link (admin only)
// DELETE /api/links/:id  → delete a link (admin only)
// ============================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

// PUT /api/links/:id — update title, url, icon, order, or active status
export async function onRequestPut({ request, env, params }) {
  const authError = checkAuth(request, env);
  if (authError) return authError;

  const id = parseInt(params.id);
  if (!id) return Response.json({ error: 'Invalid ID' }, { status: 400, headers: corsHeaders });

  try {
    const body = await request.json();
    const title = sanitize(body.title);
    const subtitle = sanitize(body.subtitle);
    const url = sanitizeUrl(body.url);
    const icon = sanitizeIcon(body.icon || '🔗');
    const order = parseInt(body.order_num) || 0;
    const active = body.active === false ? 0 : 1;

    if (!title || !url) {
      return Response.json({ error: 'title and url are required' }, { status: 400, headers: corsHeaders });
    }

    const result = await env.DB.prepare(
      'UPDATE links SET title=?, subtitle=?, url=?, icon=?, order_num=?, active=? WHERE id=?'
    ).bind(title, subtitle, url, icon, order, active, id).run();

    if (result.meta.changes === 0) {
      return Response.json({ error: 'Link not found' }, { status: 404, headers: corsHeaders });
    }

    return Response.json({ success: true }, { headers: corsHeaders });
  } catch (err) {
    console.error('PUT /api/links/:id error:', err);
    return Response.json({ error: 'Failed to update link' }, { status: 500, headers: corsHeaders });
  }
}

// DELETE /api/links/:id — permanently delete a link
export async function onRequestDelete({ request, env, params }) {
  const authError = checkAuth(request, env);
  if (authError) return authError;

  const id = parseInt(params.id);
  if (!id) return Response.json({ error: 'Invalid ID' }, { status: 400, headers: corsHeaders });

  try {
    const result = await env.DB.prepare('DELETE FROM links WHERE id = ?').bind(id).run();

    if (result.meta.changes === 0) {
      return Response.json({ error: 'Link not found' }, { status: 404, headers: corsHeaders });
    }

    return Response.json({ success: true }, { headers: corsHeaders });
  } catch (err) {
    console.error('DELETE /api/links/:id error:', err);
    return Response.json({ error: 'Failed to delete link' }, { status: 500, headers: corsHeaders });
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
