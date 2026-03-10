// services/aiService.ts
// ─────────────────────────────────────────────────────────────────────────────
// The mobile app calls OUR Vercel API route — not Grok directly.
// This means:
//   ✅ Zero API keys in the app or .env
//   ✅ Key lives only on Vercel servers
//   ✅ Safe to publish on Play Store / App Store
//
// Set EXPO_PUBLIC_API_URL in .env to your deployed Vercel URL.
// For local testing, run `vercel dev` in vercel-api/ and use http://localhost:3000
// ─────────────────────────────────────────────────────────────────────────────
import { RoadmapForm, Roadmap } from '../types';

// Your deployed Vercel URL — set in .env
// e.g. https://ai-roadmap-builder-api.vercel.app
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

if (!API_BASE) {
  console.warn(
    '[aiService] EXPO_PUBLIC_API_URL is not set.\n' +
    'Add it to .env and run: expo start --clear\n' +
    'For local dev: run `vercel dev` in vercel-api/ and set EXPO_PUBLIC_API_URL=http://localhost:3000'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// JSON extractor — safety net in case server sends extra prose
// ─────────────────────────────────────────────────────────────────────────────
function extractJSON(raw: string): string {
  let text = raw.replace(/^```json\s*/gm, '').replace(/^```\s*/gm, '').trim();
  if (text.startsWith('{')) return text;
  const start = text.indexOf('{');
  const end   = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) return text.slice(start, end + 1);
  return text;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export — called by build.tsx
// ─────────────────────────────────────────────────────────────────────────────
export async function generateRoadmap(
  form: RoadmapForm,
): Promise<Omit<Roadmap, 'id' | 'createdAt' | 'form'>> {

  if (!API_BASE) {
    throw new Error(
      'API URL not configured.\n\n' +
      'Add EXPO_PUBLIC_API_URL to your .env file and restart with: expo start --clear'
    );
  }

  const url = API_BASE.replace(/\/$/, '') + '/api/generate-roadmap';
  console.log('[aiService] POST', url);
  console.log('[aiService] Field:', form.field, '| Goal:', form.goal, '| Hours:', form.hours);

  // ── Call our Vercel proxy ─────────────────────────────────────────────────
  let response: Response;
  try {
    response = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ form }),
    });
  } catch (netErr: any) {
    console.error('[aiService] fetch() threw:', netErr?.message ?? netErr);
    throw new Error('Network error — check your internet connection and try again.');
  }

  console.log('[aiService] HTTP status:', response.status);

  // ── Handle non-200 ────────────────────────────────────────────────────────
  if (!response.ok) {
    let body = '';
    try { body = await response.text(); } catch (_) {}

    let errMsg = body;
    try { errMsg = JSON.parse(body)?.error ?? body; } catch (_) {}

    console.error('[aiService] Server error:', response.status, errMsg);

    if (response.status === 401 || response.status === 403) {
      throw new Error('Authentication error (' + response.status + ').\n\nCheck that XAI_API_KEY is set correctly in your Vercel project environment variables.');
    }
    if (response.status === 429) {
      throw new Error('Rate limit hit (429). Wait a moment and try again.');
    }
    if (response.status === 500 || response.status === 502) {
      throw new Error('Server error (' + response.status + '): ' + errMsg + '\n\nCheck Vercel function logs.');
    }
    throw new Error('Request failed (' + response.status + '): ' + errMsg);
  }

  // ── Parse response ────────────────────────────────────────────────────────
  let data: any;
  try {
    const text = await response.text();
    console.log('[aiService] Response length:', text.length);
    console.log('[aiService] First 120 chars:', text.slice(0, 120));
    const cleaned = extractJSON(text);
    data = JSON.parse(cleaned);
  } catch (parseErr: any) {
    console.error('[aiService] JSON parse failed:', parseErr.message);
    throw new Error('Could not parse server response. Please try again.');
  }

  // ── Validate ──────────────────────────────────────────────────────────────
  if (!data.phases || !Array.isArray(data.phases) || data.phases.length === 0) {
    console.error('[aiService] Missing phases:', JSON.stringify(data).slice(0, 300));
    throw new Error('AI response was missing phase data. Please try again.');
  }

  console.log('[aiService] Success — phases:', data.phases.length);
  return data;
}
