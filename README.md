# ModernBlog Monorepo (Frontend + Backend)

A full‑stack blog platform with:
- Responsive Next.js frontend (Tailwind CSS v4, Framer Motion)
- Express/MongoDB backend (News import, AI helpers, Auth, Email)
- News integration via NewsAPI with one‑click import and batch cron
- AI endpoints (Gemini) for generating content, tags, and summaries
- Firebase authentication (Google + email/password) with secure sessions

This repository contains two apps:

```
blog-backend/   # Express API (port 5555)
blog-site/      # Next.js app (port 3000)
```

---

## Features

- Create, edit, like, react to, and comment on posts
- Trending tags, series support, and pagination
- News search/top headlines + import (single or bulk)
- AI content tools (generate, summarize, tag)
- Firebase‑backed auth with secure httpOnly session cookies
- Beautiful light/dark theme with gradient UI

---

## Quick Start (Windows PowerShell)

Open two terminals.

Terminal A – API (backend):
```powershell
cd "blog-backend"
npm install
# Create and edit .env (see example below)
npm start
# API runs on http://localhost:5555
```

Terminal B – Web (frontend):
```powershell
cd "blog-site"
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

Make sure the backend CORS allows the frontend origin (http://localhost:3000).

---

## Environment Variables

### Backend (.env)
Required for production; for local dev you can start with minimal config.

```
# Server
PORT=5555

# CORS (set one or many)
FRONTEND_ORIGIN=http://localhost:3000
# FRONTEND_ORIGINS=http://localhost:3000,https://your-frontend.example.com

# Database
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
# (also supported: mongodb_uri or MONGO_URI)

# Auth & Sessions
JWT_SECRET=your_long_random_secret
COOKIE_SAMESITE=none  # for cross-site cookies in production

# Email (optional, for welcome email)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@email
EMAIL_PASS=your_app_password
EMAIL_FROM="ModernBlog <noreply@modernblog.com>"

# News & AI
NEWSAPI_KEY=your_newsapi_key
GEMINI_API_KEY=your_google_gemini_api_key

# Firebase Admin (JSON or base64 of JSON)
# Paste raw JSON or base64-encoded content of your service account
FIREBASE_SERVICE_ACCOUNT={ "type": "service_account", ... }
# or
# FIREBASE_SERVICE_ACCOUNT=eyJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsIC4uLn0=

# Auto-import controls (optional)
AUTO_IMPORT_ENABLED=true
AUTO_IMPORT_INTERVAL=3600000 # 1 hour in ms
```

Notes:
- In serverless prod (e.g., Vercel), file writes are disabled and cookies are set `secure`.
- `FRONTEND_ORIGIN(S)` must include your deployed frontend domain for CORS.

### Frontend (.env.local)
Currently no required envs. The app points to the backend using a constant `API_URL` in pages (e.g., `src/app/page.tsx`, `src/app/news/page.tsx`).

For production, update those constants to your deployed API base URL (or migrate to `NEXT_PUBLIC_API_URL`).

---

## Dark Mode (Tailwind CSS v4)
- Tailwind v4 uses CSS‑first configuration (no tailwind.config.js).
- We enable class‑based dark mode; the toggle adds/removes `.dark` on `<html>` and persists in `localStorage`.
- You will see new at‑rules like `@custom-variant` and `@theme` inside `globals.css`; editor warnings are harmless.

If the UI doesn’t change when toggling:
- Ensure the `<html>` element receives the `dark` class (handled in `src/app/layout.tsx` and the toggle)
- Check that components use `dark:` variants (already applied site‑wide)

---

## API Overview (selected)

Base URL (local): `http://localhost:5555`

Posts
- GET `/api/posts` – list with pagination and filters: `page, limit, q, tag, tags, startDate, endDate, sort(newest|popular)`
- GET `/api/posts/:id`
- POST `/api/posts` – create
- PUT `/api/posts/:id` – update
- DELETE `/api/posts/:id`
- POST `/api/posts/:id/like` / `/unlike`
- POST `/api/posts/:id/comments`
- POST `/api/posts/:id/react` – `{ type?: 'like'|'love'|'laugh'|'wow'|'sad'|'angry', prevType? }`

Tags
- GET `/api/tags/trending`

Series
- GET `/api/series/:seriesId`

News
- GET `/api/news/search` – query NewsAPI (sanitized date window)
- GET `/api/news/top-headlines`
- POST `/api/news/import` – import articles (from `everything` or `top-headlines` depending on params)
- POST `/api/news/import-batch` – serverless‑friendly batch import (default categories)

AI (Gemini)
- POST `/api/ai/generate` – `{ prompt, model? }`
- POST `/api/ai/summarize` – `{ content, length? }`
- POST `/api/ai/tags` – `{ title?, content? }`

Auth (Firebase + Email/Password)
- POST `/api/auth/firebase` – `{ idToken }` (verifies Firebase ID token and sets httpOnly session)
- POST `/api/auth/signup` – `{ email, password, name? }`
- POST `/api/auth/signin` – `{ email, password }`
- POST `/api/auth/logout`
- GET `/api/auth/me`
- POST `/api/users/follow` – `{ author }`

Misc
- GET `/api/status` – health info (auto‑import, db, API keys)

---

## News Section – Why it matters

- Content Velocity: fill your blog with fresh posts sourced from NewsAPI
- SEO: frequent, topical content improves crawl rate and ranking potential
- Engagement: varied, up‑to‑date posts keep readers returning
- Efficiency: one‑click imports (or bulk) with titles, images, and metadata

How to use:
1. In the frontend, open `/news`
2. Enter a search (e.g., “tesla”), adjust date/sort
3. Click “Search News” → preview
4. Click “Import” on an item or “Import All” to bulk import

Serverless batch (cron):
- Endpoint: `POST /api/news/import-batch`
- Configure a daily/weekly cron in your host to call this endpoint

---

## Deployment (Vercel)

### Backend (Serverless)
- The project includes `vercel.json` and exports the Express app when running in Vercel
- Set required env vars in Vercel Project → Settings → Environment Variables
- Important: set `FRONTEND_ORIGIN(S)` to your frontend domain (e.g., https://your-site.vercel.app)
- Configure a Cron Job (Settings → Cron Jobs) to `POST https://<your-backend-domain>/api/news/import-batch` on your desired schedule

### Frontend (Next.js)
- Deploy as a standard Next.js app
- Update `API_URL` constants in:
  - `src/app/page.tsx`
  - `src/app/news/page.tsx`
  - and any other pages/components that call the API
  to point to your deployed backend (e.g., `https://your-backend.vercel.app`).

Cookie notes (prod):
- Cookies are set `secure: true` in serverless/production
- If frontend and backend are on different domains, set `COOKIE_SAMESITE=none` and use HTTPS

---

## Example Requests (local)

Status:
```powershell
curl -X GET http://localhost:5555/api/status
```

Batch Import:
```powershell
curl -X POST http://localhost:5555/api/news/import-batch -H "Content-Type: application/json"
```

AI Generate:
```powershell
curl -X POST http://localhost:5555/api/ai/generate -H "Content-Type: application/json" -d '{"prompt":"Write a 2 sentence intro about modern web dev."}'
```

---

## Troubleshooting

- 500 on `/api/ai/generate`: ensure `GEMINI_API_KEY` is set
- CORS blocked: verify `FRONTEND_ORIGIN(S)` includes your frontend URL
- Cookies missing in prod: use HTTPS and set `COOKIE_SAMESITE=none`
- MongoDB not connecting: verify `MONGODB_URI`
- Emails not sending: set `EMAIL_USER` and `EMAIL_PASS` (app password if using Gmail)
- Tailwind v4 CSS warnings about `@custom-variant`/`@theme`: safe to ignore in editor; build handles them

---

## Tech Stack
- Frontend: Next.js 15, React 19, Tailwind CSS v4, Framer Motion, Firebase Web SDK
- Backend: Node.js + Express, MongoDB + Mongoose, Firebase Admin, Nodemailer, Google Gemini

---

## License
MIT (or your preferred license)
