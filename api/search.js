// Vercel serverless function: POST /api/search
// Body: { query: string, gl?: string, hl?: string }
// Returns: { totalLeads, totalRaw, skippedHadWebsite, query, leads[] }
// Required env var: SERPER_API_KEY  (get a free key at https://serper.dev)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'SERPER_API_KEY env var is not set' });

  const body = typeof req.body === 'string' ? safeJson(req.body) : (req.body || {});
  const query = String(body.query || '').trim();
  if (!query) return res.status(400).json({ error: 'query is required' });
  const gl = String(body.gl || 'us').trim().toLowerCase();
  const hl = String(body.hl || 'en').trim().toLowerCase();

  let serperData;
  try {
    const r = await fetch('https://google.serper.dev/maps', {
      method: 'POST',
      headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, page: 1, gl, hl }),
    });
    if (!r.ok) {
      const t = await r.text().catch(() => '');
      return res.status(502).json({ error: 'serper ' + r.status + ': ' + t.slice(0, 200) });
    }
    serperData = await r.json();
  } catch (err) {
    return res.status(500).json({ error: 'serper fetch failed: ' + err.message });
  }

  const places = Array.isArray(serperData.places) ? serperData.places : [];
  const seen = new Set();
  const leads = [];
  for (const p of places) {
    if (hasSite(p.website)) continue;
    const key = (p.title || '').toLowerCase().trim() + '|' + (p.address || '').toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);
    leads.push({
      UUID: v7(),
      Name: p.title || 'N/A',
      Address: p.address || 'N/A',
      Number: (p.phoneNumber || '').replace(/^\+/, '') || 'N/A',
      Website: 'N/A',
      Rating: p.rating != null ? String(p.rating) : 'N/A',
      ReviewsCount: p.reviewsCount ?? p.reviews ?? null,
      OpeningHours: p.hours ?? (Array.isArray(p.openingHours) ? p.openingHours.join('; ') : 'N/A'),
      Category: p.category || p.type || null,
      Latitude: p.latitude ?? null,
      Longitude: p.longitude ?? null,
      Email: 'N/A',
      Source: 'Maps',
      Query: query,
      FetchedAt: new Date().toISOString(),
    });
  }

  res.status(200).json({
    totalLeads: leads.length,
    totalRaw: places.length,
    skippedHadWebsite: places.length - leads.length,
    query,
    leads,
  });
}

function safeJson(s) { try { return JSON.parse(s); } catch { return {}; } }
function hasSite(w) {
  if (w == null) return false;
  const s = String(w).trim().toLowerCase();
  if (!s || s === 'n/a' || s === 'na' || s === 'none' || s === 'null') return false;
  return true;
}
function v7() {
  return 'tttttttt-tttt-7xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.trunc(Math.random() * 16);
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  }).replace(/[t]{8}-[t]{4}/, () => {
    const ts = Date.now().toString(16).padStart(12, '0');
    return ts.slice(0, 8) + '-' + ts.slice(8);
  });
}
