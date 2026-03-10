# AI Roadmap Builder — Vercel API

Serverless backend that proxies Grok (xAI) so the API key **never** leaves the server.

---

## Architecture

```
Mobile App (Expo)
      |
      | POST /api/generate-roadmap  { form: {...} }
      |
Vercel Serverless Function
      |   reads XAI_API_KEY from Vercel env (server-side only)
      |
Grok API (api.x.ai)
      |
      | { title, summary, phases: [...] }
      |
Mobile App displays roadmap
```

---

## Deploy to Vercel (5 minutes)

### Step 1 — Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2 — Deploy from this folder

```bash
cd vercel-api/
vercel deploy
```

Follow the prompts. When asked:

- Set up and deploy? **Y**
- Which scope? Choose your account
- Link to existing project? **N** (first time)
- Project name: `ai-roadmap-builder-api`
- Directory: `./` (current)

### Step 3 — Set the Grok API key

```bash
vercel env add XAI_API_KEY
# Paste your key when prompted: xai-xxxxxxxxxxxx
# Select: Production, Preview, Development (all three)
```

Get your key from: https://console.x.ai → API Keys

### Step 4 — Redeploy to apply the env var

```bash
vercel deploy --prod
```

### Step 5 — Copy your Vercel URL into the mobile app .env

Your URL looks like: `https://ai-roadmap-builder-api.vercel.app`

In `RoadmapApp/.env`:

```env
EXPO_PUBLIC_API_URL=https://ai-roadmap-builder-api.vercel.app
```

Then restart Expo:

```bash
expo start --clear
```

---

## Local Development

```bash
cd vercel-api/
vercel env pull .env.local   # pulls your Vercel env vars locally
vercel dev                   # starts local server at http://localhost:3000
```

In `RoadmapApp/.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

Test the endpoint:

```bash
curl -X POST http://localhost:3000/api/generate-roadmap \
  -H "Content-Type: application/json" \
  -d '{"form":{"level":"Beginner","languages":["Python"],"field":"AI / Machine Learning","frameworks":["TensorFlow"],"hours":10,"goal":"Get a Job","focus":"Computer Vision"}}'
```

---

## Files

```
vercel-api/
├── api/
│   └── generate-roadmap.js   ← The serverless function
├── vercel.json               ← Vercel config (CORS, timeout)
├── package.json
├── .env.example              ← Template (safe to commit)
├── .gitignore                ← Excludes .env from Git
└── README.md
```

---

## Security

| What              | Where                        | In app?                     |
| ----------------- | ---------------------------- | --------------------------- |
| Grok API key      | Vercel environment variables | ❌ Never                    |
| Supabase anon key | Mobile app .env              | ✅ Safe (RLS protects data) |
| Supabase URL      | Mobile app .env              | ✅ Safe (public)            |

The Grok key is **only** accessible inside the Vercel function at runtime.
It is never bundled into the app binary, never sent to the client, and never in .env.
