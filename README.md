# AI Roadmap Builder — React Native + Supabase

A professional mobile app to generate and track personalised AI-powered learning roadmaps,
synced to the cloud via Supabase so you can log in from any device.

---

## 🔐 API Key Safety

All secrets are stored in a `.env` file which is **never committed to Git**.

| File           | Purpose                               | In Git?                        |
| -------------- | ------------------------------------- | ------------------------------ |
| `.env`         | Your real keys (fill this in)         | ❌ No — listed in `.gitignore` |
| `.env.example` | Template showing what vars are needed | ✅ Yes — safe to commit        |
| `.gitignore`   | Prevents `.env` from being committed  | ✅ Yes                         |

Keys are loaded via Expo's `EXPO_PUBLIC_` prefix at build time using `process.env`.

> ⚠️ **Note:** `EXPO_PUBLIC_` variables are baked into the compiled app bundle.
> This is fine for development and private/personal apps.
> For a public production app, move the Claude API call to a **Supabase Edge Function**
> so the Anthropic key lives only on the server and is never in the bundle.

---

## 🚀 Setup

### 1. Copy the env template

```bash
cp .env.example .env
```

### 2. Fill in `.env` with your real keys

```env
# Anthropic — get from https://console.anthropic.com
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...

# Supabase — get from https://app.supabase.com → your project → Settings → API
EXPO_PUBLIC_SUPABASE_URL=https://your_ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 3. Create your Supabase project (free)

1. Go to https://app.supabase.com → **New Project**
2. Wait ~2 minutes for provisioning
3. Go to **SQL Editor** → paste the full contents of `supabase/schema.sql` → **Run**
4. Go to **Settings → API** to copy your URL and anon key

### 4. Install and run

```bash
npm install
npm start        # Expo dev server + QR code
npm run ios      # iOS simulator
npm run android  # Android emulator
```

Or scan the QR code with **Expo Go** on your phone.

---

## 🗄️ Database

```
Supabase PostgreSQL
├── auth.users           ← Built-in Supabase auth (bcrypt passwords)
├── public.profiles      ← User display name
├── public.roadmaps      ← Roadmaps (phases stored as JSONB)
└── public.progress      ← Per-user progress (checks + completed phases)
```

Row Level Security (RLS) is enforced on every table — users can only access their own rows.

---

## 📁 Project Structure

```
RoadmapApp/
├── .env                 ← YOUR SECRETS — never commit this
├── .env.example         ← Template — safe to commit
├── .gitignore           ← Excludes .env from Git
├── lib/
│   └── supabase.ts      ← Supabase client (reads from .env)
├── supabase/
│   └── schema.sql       ← Run this once in Supabase SQL Editor
├── services/
│   ├── aiService.ts     ← Claude API (reads key from .env)
│   ├── authService.ts   ← Supabase Auth
│   └── storageService.ts← Supabase DB (roadmaps + progress)
├── app/
│   ├── _layout.tsx      ← Root layout + session listener
│   ├── (auth)/login.tsx ← Sign In / Create Account
│   └── (tabs)/
│       ├── dashboard.tsx
│       ├── build.tsx
│       ├── roadmaps.tsx
│       ├── tracker.tsx
│       └── profile.tsx
├── components/ui/       ← Reusable native components
├── constants/           ← Theme tokens + option lists
├── hooks/useAuth.ts     ← Auth context
└── types/index.ts       ← TypeScript interfaces
```
