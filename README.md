<div align="center">

# 🎯 Lead Finder

**Find Google Maps + OpenStreetMap businesses without a website — your next clients to pitch.**

Type a query → 10 parallel Google Maps variants + OpenStreetMap → filter to no-website → dedupe → collect.

GitHub repo description: Find businesses on Google Maps and OpenStreetMap that do not have websites, then export them as leads.

[![Deploy with Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbyte-muneeb%2FLead-Finder&env=SERPER_API_KEY&envDescription=Free%20Serper%20API%20key%20from%20serper.dev&envLink=https%3A%2F%2Fserper.dev)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-your--project.vercel.app-blue?style=for-the-badge&logo=vercel)](https://lead-finder-psi.vercel.app/)
[![Serper](https://img.shields.io/badge/Search-Serper-FF6B35?style=for-the-badge)](https://serper.dev)
[![OpenStreetMap](https://img.shields.io/badge/Free-OpenStreetMap-7EBC6F?style=for-the-badge&logo=openstreetmap)](https://overpass-api.de)
[![License](https://img.shields.io/badge/License-MIT-A3E635?style=for-the-badge)](LICENSE)

</div>

---

## ✨ What is Lead Finder?

Lead Finder is a zero-dependency lead-generation tool. Paste any business type and city, and it returns a clean list of businesses on Google Maps and OpenStreetMap that **don't have a website yet** — perfect prospects for any web-design or digital-services freelancer.

The workflow is simple:

1. **Type** a search like `dentists in Karachi`
2. **Wait ~3 seconds** as the app fans out 10 Maps query variants in parallel and pulls additional results from OpenStreetMap
3. **Browse** — every result is a business without a website, deduped by name + address, with phone number, rating, and a one-tap link to Google Maps
4. **Download** the current search or every lead you've ever collected as CSV

No accounts, no databases, no LLMs to rate-limit. Country is auto-detected from your IP.

---

## 🚀 Features

| Feature | Description |
|---|---|
| **Multi-source search** | 10 Google Maps query variants via Serper + OpenStreetMap Overpass, all in parallel |
| **No-website filter** | Server- and client-side checks drop any business that has a website tag |
| **Cross-search deduplication** | By `Name + Address`, across all sources and across all your past sessions |
| **Auto country detection** | IP-based via `api.country.is` + `ipapi.co`, with `navigator.language` fallback |
| **Browser-side persistence** | Every search is added to a `localStorage` store — no database, survives reloads |
| **CSV export** | Download just this search or every lead you've ever collected |
| **Curated presets** | 8 one-click searches across Pakistan, India, UAE, UK, and Canada |
| **Live filter** | Client-side text filter narrows displayed results by name / address / category |
| **Zero build step** | Single `index.html` + one Vercel serverless function — clone and deploy |

---

## 🛠 Tech Stack

### Frontend
- **Vanilla HTML / CSS / JavaScript** — one self-contained `index.html`, no framework, no bundler
- **[Inter](https://rsms.me/inter/)** — typeface served via Google Fonts CDN
- **[localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)** — per-browser persistence for accumulated leads

### Backend
- **[Vercel Serverless Functions](https://vercel.com/docs/functions)** — single Node 18+ handler at `api/search.js`
- **[Serper](https://serper.dev/)** — Google Maps results (free tier: 2,500 queries/month)
- **[OpenStreetMap Overpass API](https://overpass-api.de/)** — free supplemental source, no key, no signup

### Geolocation
- **[api.country.is](https://api.country.is/)** — primary IP → country code lookup (CORS-enabled, no key)
- **[ipapi.co](https://ipapi.co/)** — fallback IP → country code
- **`navigator.language`** — final fallback (parses `en-US` → `us`)

### Infrastructure
- **[Vercel](https://vercel.com/)** — free Hobby plan hosts both static frontend and the serverless function
- **[GitHub](https://github.com/)** — source of truth, auto-deploys on push

---

## 📦 Repository Layout

```text
lead-finder/
├── api/
│   └── search.js         # Vercel serverless function — Serper proxy + no-website filter
├── index.html            # entire frontend (HTML + CSS + JS in one file)
├── package.json          # Node engine pin
├── vercel.json           # function timeout + clean URLs
├── .env.example          # env-var template
├── .gitignore
└── README.md             # this file
```

---

## ⚡ Quick Start

### Prerequisites

- **Free Serper API key** — sign up at [serper.dev](https://serper.dev) (2,500 queries/month)
- **GitHub account** — to fork or push this repo
- **Vercel account** — free Hobby plan, no card required

### 1. One-click deploy *(recommended)*

Click the **Deploy with Vercel** badge at the top of this README, or go to [vercel.com/new](https://vercel.com/new) and import this repo. Vercel will:

- Ask which GitHub account to clone the repo into
- Prompt you for `SERPER_API_KEY`
- Build and deploy

You're live in ~30 seconds at `https://<project>.vercel.app`.

### 2. Manual deploy from GitHub

1. Push this repository to GitHub.
2. Open [vercel.com/new](https://vercel.com/new) and select the repo.
3. Add `SERPER_API_KEY` under Environment Variables.
4. Click **Deploy**.

### 3. Local development

```bash
git clone https://github.com/byte-muneeb/Lead-Finder.git
cd lead-finder
cp .env.example .env.local
# edit .env.local and paste your Serper key
npm install
npm start
```

| Service | URL |
|---|---|
| Frontend | http://localhost:8080 |
| API | http://localhost:8080/api/search |

If you prefer the old Vercel workflow, `npx vercel dev` still works after signing in to Vercel.

---

## 🔑 Environment Variables

| Variable | Required | Where to set | Description |
|---|---|---|---|
| `SERPER_API_KEY` | ✅ | Vercel dashboard → Settings → Environment Variables (or `.env.local` for local dev) | Free Serper API key from [serper.dev](https://serper.dev). Powers all Google Maps queries. |

> **Note:** The OpenStreetMap source requires no key and keeps working even if your Serper quota is exhausted.

---

## 📡 API Reference

The single backend endpoint is intentionally simple — call it directly if you want to script lead pulls.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/search` | Run one Maps query, filter to no-website, return leads JSON |
| `OPTIONS` | `/api/search` | CORS preflight (returns `204`) |

### Request

```bash
curl -X POST https://YOUR_PROJECT.vercel.app/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"plumbers in Lahore","gl":"pk","hl":"en"}'
```

| Param | Type | Default | Notes |
|---|---|---|---|
| `query` | string | — | **Required.** Free-form search. |
| `gl` | string | `us` | 2-letter country code (lowercase). |
| `hl` | string | `en` | Language code. |

### Response

```json
{
  "totalLeads": 12,
  "totalRaw": 20,
  "skippedHadWebsite": 8,
  "query": "plumbers in Lahore",
  "leads": [
    {
      "UUID": "019e0000-0000-7000-8000-000000000000",
      "Name": "Sample Plumbing Co",
      "Address": "1 Example St, Lahore",
      "Number": "9233xxxxxxx",
      "Website": "N/A",
      "Rating": "4.7",
      "ReviewsCount": 31,
      "OpeningHours": "Mon-Sat 9-6",
      "Category": "Plumber",
      "Latitude": 31.5497,
      "Longitude": 74.3436,
      "Email": "N/A",
      "Source": "Maps",
      "Query": "plumbers in Lahore",
      "FetchedAt": "2026-05-11T12:00:00.000Z"
    }
  ]
}
```

---

## 🌍 Deployment

The recommended free-tier stack:

| Layer | Service | Free tier covers |
|---|---|---|
| Frontend + API | [Vercel](https://vercel.com/) | 100 GB bandwidth · 100h compute · 100k function calls / month |
| Search index | [Serper](https://serper.dev/) | 2,500 queries / month (≈ 250 user searches at 10 variants each) |
| Bonus results | [OSM Overpass](https://overpass-api.de/) | Unmetered, fair-use only |

When the Serper quota is exhausted, the Maps source returns 502 errors; OSM keeps working and `localStorage` keeps accumulating. The Serper quota resets at the start of each calendar month.

See the [Customizing](#%EF%B8%8F-customizing) section below for swapping in a paid Serper plan, a real DB, or per-visitor key entry.

---

## ⚙️ Customizing

The whole app is two files. Easy to bend.

| Want to… | Edit |
|---|---|
| Add more presets | `.chip` buttons inside `index.html` |
| Add more query variants | `VARIANTS` array near the top of the `<script>` in `index.html` |
| Add more OSM business types | `OSM_TAGS` lookup table inside `index.html` |
| Restrict visitors (rate-limit / password) | Vercel's [Password Protection](https://vercel.com/docs/security/password-protection) on the project |
| Per-visitor Serper key (no shared quota) | Add a text input that stores the key in `localStorage`; forward it to `/api/search` as a header |
| Replace `localStorage` with a real DB | Add [Vercel KV](https://vercel.com/docs/storage/vercel-kv) or [Supabase](https://supabase.com/) and a new serverless function in `api/` |
| Email enrichment | Add `api/enrich.js` that calls Hunter.io / Apollo / Snov.io with lead name + address |

---

## 💸 Cost & Limits

This stack is engineered to run forever on free tiers for a single user.

- **Vercel free Hobby plan** — far more bandwidth and compute than this app will ever need
- **Serper free tier** — ~250 searches/month per account; create more for more capacity
- **OSM** — no quota, just respect the built-in 25s timeout per query

If you put the deployed URL out into the world for many visitors, **all visitors share your Serper quota**. Either:

- Add Vercel's password protection
- Move the Serper key into a per-visitor input field (paste-your-own-key model)
- Upgrade to Serper's paid tier

---

## 🧠 How it stays simple

- **No build step.** `index.html` is shipped exactly as written.
- **No framework.** Plain DOM API; Inter font from a CDN.
- **No database.** `localStorage` per browser handles every visitor's accumulated leads.
- **No LLM.** Lead generation is search + filter — an LLM would only add latency, cost, and rate-limit headaches.
- **No auth.** Each visitor uses your Serper quota by default; lock it down with Vercel Password Protection if you publish the URL.

---

## ✅ Verification

```bash
# Backend: hit the search endpoint locally
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"dentists in Karachi","gl":"pk","hl":"en"}'

# Frontend: open in browser
open http://localhost:3000           # macOS
start http://localhost:3000          # Windows
xdg-open http://localhost:3000       # Linux
```

You should see a JSON response with `totalLeads`, `totalRaw`, and a populated `leads[]` array.

---

## 📄 License

MIT — do whatever you want, just don't blame me.
