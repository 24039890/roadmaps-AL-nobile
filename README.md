# 🗺 AI Roadmap Builder

A professional mobile app that generates and tracks personalised AI-powered learning roadmaps, synced to the cloud via Supabase so you can log in from any device.

Built with **React Native + Expo**, **Supabase**, and **Google Gemini AI** via a **Vercel serverless proxy**.

---

## ✨ Features

- 🤖 **AI-generated roadmaps** — 6 structured phases tailored to your skill level, goals, and weekly hours
- 📱 **Cross-device sync** — sign in on any phone and your roadmaps follow you
- 📊 **Progress tracker** — check off tasks and track completion per phase
- 🔐 **Secure auth** — email/password login via Supabase Auth (bcrypt)
- 👁️ **Password visibility toggle** — show/hide password on login
- 🛡️ **API key safety** — AI key lives on Vercel server only, never in the app bundle

---

## 🏗️ Architecture

```
Mobile App (React Native + Expo)
        │
        ├── Supabase ──────────── Auth + PostgreSQL database
        │
        └── Vercel API ─────────── Serverless proxy
                  │
                  └── Google Gemini ── AI roadmap generation
```

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Mobile | React Native + Expo Router | iOS & Android app |
| Auth & DB | Supabase | Login, roadmaps, progress |
| AI Proxy | Vercel Serverless Function | Keeps Gemini key server-side |
| AI Model | Google Gemini 1.5 Flash | Roadmap generation (free tier) |

---

## 🔐 API Key Safety

| File | Purpose | In Git? |
|------|---------|---------|
| `.env` | Your real keys (fill this in) | ❌ No — in `.gitignore` |
| `.env.example` | Template showing required vars | ✅ Yes — safe to commit |
| `.gitignore` | Prevents `.env` from being committed | ✅ Yes |
| `vercel-api/` | Gemini key lives here only | ✅ Key set via `vercel env` |

> ⚠️ **`EXPO_PUBLIC_` variables** are baked into the compiled app bundle.
> The Gemini API key is **not** in the app — it lives only on Vercel as a server-side environment variable, called via the `/api/generate-roadmap` proxy.

---

## 🚀 Setup

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/ai-roadmap-builder.git
cd ai-roadmap-builder/RoadmapApp
```

### 2. Copy the env template
```bash
cp .env.example .env
```

### 3. Fill in `.env`
```env
# Vercel API proxy URL — deploy vercel-api/ first (see below)
EXPO_PUBLIC_API_URL=https://your-project.vercel.app

# Supabase — get from https://app.supabase.com → project → Settings → API
EXPO_PUBLIC_SUPABASE_URL=https://your_ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 4. Set up Supabase (free)
1. Go to [app.supabase.com](https://app.supabase.com) → **New Project**
2. Wait ~2 minutes for provisioning
3. Go to **SQL Editor** → paste contents of `supabase/schema.sql` → **Run**
4. Go to **Settings → API** → copy your URL and anon key into `.env`

### 5. Deploy the Vercel API proxy
```bash
cd vercel-api/
vercel deploy --prod
vercel env add GEMINI_API_KEY production
# paste your Gemini key (get free at https://aistudio.google.com)
vercel deploy --prod
```
Copy the deployed URL into `EXPO_PUBLIC_API_URL` in your `.env`.

### 6. Install and run
```bash
cd RoadmapApp/
npm install
npx expo start --clear
```
Scan the QR code with **Expo Go** on your Android or iOS phone.

---

## 🗄️ Database Schema

```
Supabase PostgreSQL
├── auth.users           ← Built-in Supabase auth (bcrypt passwords)
├── public.profiles      ← User display name
├── public.roadmaps      ← Roadmaps (phases stored as JSONB)
└── public.progress      ← Per-user progress (checks + completed phases)
```

Row Level Security (RLS) is enforced on every table — users can only read and write their own rows.

---

## 📁 Project Structure

```
RoadmapApp/
├── .env                      ← YOUR SECRETS — never commit this
├── .env.example              ← Template — safe to commit
├── .gitignore                ← Excludes .env from Git
│
├── vercel-api/               ← Serverless AI proxy (deploy separately)
│   ├── api/
│   │   ├── generate-roadmap.js   ← Calls Gemini, returns roadmap JSON
│   │   └── health.js             ← Health check endpoint
│   └── vercel.json
│
├── lib/
│   └── supabase.ts           ← Supabase client
│
├── supabase/
│   └── schema.sql            ← Run once in Supabase SQL Editor
│
├── services/
│   ├── aiService.ts          ← Calls Vercel proxy → Gemini
│   ├── authService.ts        ← Supabase Auth (login/signup)
│   └── storageService.ts     ← Supabase DB (roadmaps + progress)
│
├── app/
│   ├── _layout.tsx           ← Root layout + session listener
│   ├── (auth)/
│   │   └── login.tsx         ← Sign In / Create Account
│   └── (tabs)/
│       ├── dashboard.tsx     ← Overview + stats
│       ├── build.tsx         ← Roadmap generation wizard
│       ├── roadmaps.tsx      ← Saved roadmaps list
│       ├── tracker.tsx       ← Progress tracking
│       └── profile.tsx       ← Account settings
│
├── components/ui/            ← Reusable native components
├── constants/                ← Theme tokens + option lists
├── hooks/useAuth.ts          ← Auth context
└── types/index.ts            ← TypeScript interfaces
```

---

## 🌐 Vercel API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check — confirms API is live |
| POST | `/api/generate-roadmap` | Generate a 6-phase roadmap via Gemini |

**POST `/api/generate-roadmap`** body:
```json
{
  "form": {
    "level": "Beginner",
    "languages": ["Python"],
    "field": "AI / Machine Learning",
    "frameworks": ["TensorFlow"],
    "hours": 10,
    "goal": "Get a Job",
    "focus": "Computer Vision"
  }
}
```

---

## 🤖 AI Roadmap Structure

Each generated roadmap contains **6 phases**:

| Phase | Name |
|-------|------|
| 1 | Foundations |
| 2 | Core Skills |
| 3 | Intermediate Projects |
| 4 | Advanced Topics |
| 5 | Real-World Projects |
| 6 | Portfolio & Career |

Each phase includes: topics, tools, resources, exercises, a 5-item checklist, a project, and a milestone.

---

## 📦 Key Dependencies

```json
{
  "expo": "~52.x",
  "expo-router": "~4.x",
  "react-native": "0.76.x",
  "@supabase/supabase-js": "^2.x",
  "react-native-svg": "^15.x",
  "react-native-safe-area-context": "^4.x"
}
```

---

## 🛠️ Common Issues

| Error | Fix |
|-------|-----|
| `EXPO_PUBLIC_API_URL not set` | Add it to `.env` and run `npx expo start --clear` |
| `502 Gemini error 429` | Rate limit hit — wait 1 minute and retry |
| `401 Authentication Required` | Turn off Vercel Deployment Protection in project Settings |
| `RNSVGSvgView not found` | Run `npx expo install react-native-svg` |
| Metro bundler 404 | Run `npx expo start --clear` from inside `RoadmapApp/` |

---

## 📄 License

MIT — free to use, modify, and distribute.
