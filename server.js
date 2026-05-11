const http = require('http');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const port = Number(process.env.PORT || 8080);

loadEnvFile(path.join(root, '.env.local'));
loadEnvFile(path.join(root, '.env'));

const apiKey = process.env.SERPER_API_KEY;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const server = http.createServer(async (req, res) => {
  const url = (req.url || '/').split('?')[0];

  if (url === '/api/search') {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      res.end();
      return;
    }

    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'POST only' });
      return;
    }

    if (!apiKey) {
      sendJson(res, 500, { error: 'SERPER_API_KEY env var is not set' });
      return;
    }

    try {
      const body = await readJsonBody(req);
      const query = String(body.query || '').trim();
      if (!query) {
        sendJson(res, 400, { error: 'query is required' });
        return;
      }

      const gl = String(body.gl || 'us').trim().toLowerCase();
      const hl = String(body.hl || 'en').trim().toLowerCase();

      const response = await fetch('https://google.serper.dev/maps', {
        method: 'POST',
        headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query, page: 1, gl, hl }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        sendJson(res, 502, { error: 'serper ' + response.status + ': ' + text.slice(0, 200) });
        return;
      }

      const serperData = await response.json();
      const places = Array.isArray(serperData.places) ? serperData.places : [];
      const seen = new Set();
      const leads = [];

      for (const place of places) {
        if (hasSite(place.website)) continue;
        const key = String(place.title || '').toLowerCase().trim() + '|' + String(place.address || '').toLowerCase().trim();
        if (seen.has(key)) continue;
        seen.add(key);
        leads.push({
          UUID: v7(),
          Name: place.title || 'N/A',
          Address: place.address || 'N/A',
          Number: (place.phoneNumber || '').replace(/^\+/, '') || 'N/A',
          Website: 'N/A',
          Rating: place.rating != null ? String(place.rating) : 'N/A',
          ReviewsCount: place.reviewsCount ?? place.reviews ?? null,
          OpeningHours: place.hours ?? (Array.isArray(place.openingHours) ? place.openingHours.join('; ') : 'N/A'),
          Category: place.category || place.type || null,
          Latitude: place.latitude ?? null,
          Longitude: place.longitude ?? null,
          Email: 'N/A',
          Source: 'Maps',
          Query: query,
          FetchedAt: new Date().toISOString(),
        });
      }

      sendJson(res, 200, {
        totalLeads: leads.length,
        totalRaw: places.length,
        skippedHadWebsite: places.length - leads.length,
        query,
        leads,
      });
      return;
    } catch (err) {
      sendJson(res, 500, { error: 'serper fetch failed: ' + err.message });
      return;
    }
  }

  const filePath = url === '/' ? path.join(root, 'index.html') : path.join(root, url);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(data);
  });
});

server.listen(port, () => {
  console.log('Server running at http://localhost:' + port);
});

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1e6) {
        reject(new Error('request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function hasSite(website) {
  if (website == null) return false;
  const value = String(website).trim().toLowerCase();
  if (!value || value === 'n/a' || value === 'na' || value === 'none' || value === 'null') return false;
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

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) continue;
    const key = trimmed.slice(0, equalsIndex).trim();
    if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) continue;
    let value = trimmed.slice(equalsIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}
