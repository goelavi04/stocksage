---
title: StockSage Backend
emoji: 📈
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
app_port: 7860
---

# StockSage

> An AI-powered Indian stock market platform for retail investors — built to help families track portfolios, research stocks, and get plain-language investment advice.

**Live App:** [stocksage.vercel.app](https://stocksage.vercel.app) &nbsp;|&nbsp; **API:** [goelavi04-stocksage-backend.hf.space](https://goelavi04-stocksage-backend.hf.space)

---

## What It Does

StockSage is a mobile-first PWA (installable on iPhone and Android) that gives a family of investors one shared space to:

- Track live portfolio value, P&L, and SIPs — with **separate data per person**
- Research any NSE/BSE stock with live charts and technical indicators
- Get AI-generated Buy / Hold / Sell recommendations in plain Hindi/English
- Chat with an AI assistant that understands your actual portfolio
- Set price alerts with WhatsApp and email delivery

---

## Features

| Feature | Description |
|---|---|
| **Multi-user Profiles** | Each family member gets their own portfolio with a photo avatar |
| **Live Portfolio** | Real-time P&L, current prices pulled from Yahoo Finance |
| **SIP Tracking** | Track monthly mutual fund SIPs alongside equity holdings |
| **Stock Research** | Interactive charts (1D to 5Y), RSI, MACD, Bollinger Bands |
| **AI Recommendations** | Composite score from technical + fundamental analysis with "Father Mode" plain-English explanation in Hinglish |
| **News Sentiment** | FinBERT NLP model classifies financial news as positive / neutral / negative |
| **AI Chat** | Groq-powered LLaMA 3 chat with your live portfolio as context |
| **Price Alerts** | Configurable alerts with WhatsApp + email notifications |
| **PWA** | Install on iPhone or Android home screen, works like a native app |
| **Persistent Storage** | Portfolio data survives server restarts via HuggingFace Dataset backup |

---

## Tech Stack

### Frontend
- **React 19** + **Vite 8**
- **Tailwind CSS** — dark-themed mobile-first UI
- **Recharts** — stock charts and indicators
- **Lucide React** — icons
- **Vite PWA Plugin** (Workbox) — service worker, offline support, installable on home screen

### Backend
- **FastAPI** (Python) — REST API with async support
- **SQLAlchemy** + **SQLite** — portfolio and user data
- **HuggingFace Hub** — free persistent storage (SQLite backed up to a private Dataset repo)
- **Groq API** (LLaMA 3.3 70B) — AI chat and buy/hold/sell recommendations
- **FinBERT** — financial news sentiment analysis via HF Inference API
- **APScheduler** — background price alert checks every 15 minutes
- **pandas-ta** — technical indicators (RSI, MACD, Bollinger Bands)

### Infrastructure
- **Frontend:** Vercel (auto-deploy, global CDN, PWA hosting)
- **Backend:** HuggingFace Spaces (Docker container, free tier)
- **Stock Data:** Yahoo Finance HTTP API (direct, no SDK)

---

## Architecture

```
iPhone / Browser  (PWA — installable)
        │
        ▼
  stocksage.vercel.app              ← React SPA served from Vercel CDN
        │
        │  REST API (HTTPS)
        ▼
  HuggingFace Spaces (Docker)       ← FastAPI backend
  goelavi04/stocksage-backend
        │
        ├── Yahoo Finance v8 API    ← live prices & OHLCV history
        ├── Groq API                ← LLaMA 3 for AI features
        ├── FinBERT (HF Inference)  ← news sentiment scoring
        └── SQLite  /tmp/stocksage.db
                │
                │  upload on every portfolio write
                │  + background thread every 5 min
                │  + on shutdown
                ▼
        HuggingFace Dataset         ← free persistent storage
        goelavi04/stocksage-data
```

---

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 20+

### Backend

```bash
cd stocksage
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Environment variables
cp .env.example .env
# Fill in: GROQ_API_KEY, HF_PERSIST_TOKEN

uvicorn backend.main:app --reload
# API at http://localhost:8000
# Docs at http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install

# Point frontend at local backend
echo "VITE_API_URL=http://localhost:8000" > .env.local

npm run dev
# App at http://localhost:5173
```

---

## Deployment

### Backend → HuggingFace Spaces

The backend runs as a Docker container. HF Spaces does **not** auto-sync from GitHub — you must push directly to the Space's git remote.

```bash
git remote add hf https://huggingface.co/spaces/goelavi04/stocksage-backend

# Deploy (use HF write token as the password when prompted)
git push hf main
```

Required Spaces secrets (set via HF Space settings UI):
| Secret | Purpose |
|---|---|
| `GROQ_API_KEY` | Groq LLaMA API for AI features |
| `HF_PERSIST_TOKEN` | Write token for database backup to Dataset repo |

### Frontend → Vercel

```bash
cd frontend
vercel --prod
```

`vercel.json` handles two things automatically on every deploy:
1. Re-claims the `stocksage.vercel.app` alias
2. Rewrites all routes to `index.html` so React Router works on direct URL access

---

## Project Structure

```
stocksage/
├── backend/
│   ├── main.py                  # FastAPI app, lifespan, CORS, DB migration
│   ├── database.py              # SQLAlchemy engine (SQLite at /tmp)
│   ├── persistence.py           # HuggingFace Dataset backup layer
│   ├── models/
│   │   ├── portfolio.py         # Portfolio, SIP, Notification models
│   │   └── user.py              # User profile model
│   ├── routes/
│   │   ├── portfolio.py         # Holdings & SIP CRUD (per-user)
│   │   ├── users.py             # Profile CRUD with photo storage
│   │   ├── stock.py             # Quote, history, technical indicators
│   │   ├── recommendations.py   # AI Buy/Hold/Sell engine
│   │   ├── chat.py              # Groq AI conversational chat
│   │   ├── news.py              # News fetch + FinBERT sentiment
│   │   └── alerts.py            # Price alerts + notifications
│   └── services/
│       ├── yahoo_client.py      # Direct Yahoo Finance HTTP session
│       ├── data_fetcher.py      # Stock quote & OHLCV history
│       ├── indicators.py        # RSI, MACD, Bollinger Bands via pandas-ta
│       ├── fundamentals.py      # P/E, P/B, EPS, financial ratios
│       ├── recommender.py       # Weighted technical + fundamental scoring
│       └── scheduler.py         # APScheduler background alert job
├── frontend/
│   ├── src/
│   │   ├── pages/               # Dashboard, Research, Portfolio, Chat, Profiles, Alerts
│   │   └── components/layout/   # Shared Header (notifications + profile switcher)
│   ├── public/                  # PWA icons, web manifest
│   └── vercel.json              # SPA rewrite rule + stocksage.vercel.app alias
├── Dockerfile                   # HuggingFace Spaces container definition
└── requirements.txt
```

---

## Challenges & How We Solved Them

### 1. Yahoo Finance blocked on cloud IPs

**Problem:** The `yfinance` Python library's `Ticker.fast_info` and `quoteSummary` calls use Yahoo's v10 API, which requires a "crumb" token. HuggingFace Spaces IPs are rate-limited by Yahoo (returns 429 on the crumb endpoint), causing all stock data fetches to hang indefinitely.

**Solution:** Replaced all `yfinance` usage with direct HTTP calls to Yahoo Finance's **v8 chart API** (`/v8/finance/chart/{symbol}`), which works without a crumb — it only requires browser-like cookies from a warm session. We initialize a `requests.Session`, visit `finance.yahoo.com` once to obtain cookies, then query stock data directly. Crumb is attempted once as an optional enhancement; if it returns 429, we save the cookie session anyway and continue. Fundamentals that genuinely need the crumb degrade gracefully to a neutral 50/100 score with a status message.

---

### 2. SQLite data lost on every server restart

**Problem:** HuggingFace Spaces free tier runs ephemeral Docker containers — every restart wipes the filesystem including `/tmp`. The SQLite portfolio database was being lost on every cold start.

**Solution:** Built a persistence layer using a **private HuggingFace Dataset repo** as free cloud storage. On startup, the app downloads `stocksage.db` from the Dataset repo. After every portfolio write, every 5 minutes via a background daemon thread, and on graceful shutdown, it uploads the file back. This gives persistent storage at zero cost, with the only downside being a few seconds of upload latency on writes.

---

### 3. PWA service worker caching stale JavaScript bundles

**Problem:** After deploying code changes (specifically the "del" button on the portfolio page), users on iPhone kept seeing the old app. The PWA service worker had pre-cached the old bundle and was serving it from cache, ignoring the new deploy. We confirmed the new code was in the live Vercel bundle but it wasn't reaching users.

**Solution:** Vite's PWA plugin (Workbox) uses `registerType: 'autoUpdate'` and content-hashed filenames. Any code change produces a new bundle filename (e.g. `index-DET1DyBg.js`), which causes the service worker to detect a new version and update. For users already stuck on a cached version, the fix is a hard refresh on desktop (Ctrl+Shift+R) or clearing website data in Safari on iPhone. Going forward, this is automatic on each deploy.

---

### 4. Getting a clean URL — team vs personal Vercel account

**Problem:** The Vercel project was created under a team account (`aviral-goels-projects-b3ad9f58`). Team projects get long deployment URLs like `stocksage-aviral-goels-projects-b3ad9f58.vercel.app`. The clean `stocksage.vercel.app` was registered as a project domain by a different user, so we couldn't add it permanently.

**Solution:** Used `vercel alias set` to point `stocksage.vercel.app` at our deployment (this works as an override even when the domain is registered elsewhere), and added `"alias": ["stocksage.vercel.app"]` to `vercel.json` so the alias is automatically re-applied on every future deploy without any manual step.

---

### 5. SPA routing returning 404 on direct URL access

**Problem:** React Router handles all routing client-side. When a user opens the app fresh on a new device (no cached HTML), the browser requests the URL path (e.g. `/profiles`) from Vercel. Vercel looks for a physical file at that path, finds nothing, and returns a 404. This was breaking the app for first-time visitors on any device.

**Solution:** Added a catch-all rewrite rule to `vercel.json`:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```
This tells Vercel to serve `index.html` for every path, letting React Router take over routing entirely in the browser.

---

### 6. HuggingFace Spaces not auto-deploying from GitHub

**Problem:** Vercel automatically redeploys when you push to GitHub. HuggingFace Spaces Docker containers do not — they have their own separate git remote. Pushing backend changes to GitHub had no effect on the live API, which caused confusion when new endpoints (like `/users/`) appeared in the code but returned 404 in production.

**Solution:** The HF Space has its own git repository at `https://huggingface.co/spaces/goelavi04/stocksage-backend`. Deploying requires pushing directly to that remote using a HuggingFace write-access token (password authentication was deprecated by HF). The workflow is: commit to GitHub first (source of truth), then push to the HF remote to deploy.

---

### 7. Multi-user database migration on a live SQLite database

**Problem:** The app was already running with user portfolios in the database when we added multi-user support. Adding `user_id` as a new column to the SQLAlchemy model doesn't automatically update the existing database — `create_all` only creates tables that don't exist yet. The live database had no `user_id` column and all existing data had no user assignment.

**Solution:** On startup, after `create_all`, we run raw SQL migration statements wrapped in try/except:
```python
ALTER TABLE portfolio ADD COLUMN user_id INTEGER DEFAULT 1
ALTER TABLE sips ADD COLUMN user_id INTEGER DEFAULT 1
```
If the column already exists, the statement raises an exception which we catch and ignore. Existing records get `user_id = 1`, which matches the auto-created default "Me" profile seeded in the same migration block. Zero data loss, zero downtime.

---

## Made By

**Aviral Goel** — KJ Somaiya College of Engineering, AI & Data Science

Built as a personal project to make stock investing more accessible and understandable for Indian retail investors and their families.
