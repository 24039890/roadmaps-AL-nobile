// supabase/functions/generate-roadmap/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Supabase Edge Function — proxies Claude API calls so the Anthropic key
// NEVER leaves the server and is NEVER bundled into the mobile app.
//
// Deploy:
//   npx supabase functions deploy generate-roadmap
//
// Set the secret (one time):
//   npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-key-here
//
// Then in aiService.ts, point fetch() at this function URL instead of
// api.anthropic.com directly. See the comment at the bottom of this file.
// ─────────────────────────────────────────────────────────────────────────────
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    // Verify the request comes from a logged-in Supabase user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Read the form data sent from the app
    const { form } = await req.json();
    if (!form) {
      return new Response(JSON.stringify({ error: "Missing form data" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Anthropic key is a server-side secret — never exposed to the client
    const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_KEY) throw new Error("ANTHROPIC_API_KEY secret not set");

    const prompt = buildPrompt(form);

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      throw new Error(`Anthropic API error ${anthropicRes.status}: ${errText}`);
    }

    const data = await anthropicRes.json();
    const raw = data.content.map((b: any) => b.text || "").join("");
    const clean = raw.replace(/```json|```/g, "").trim();
    const roadmap = JSON.parse(clean);

    return new Response(JSON.stringify(roadmap), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});

function buildPrompt(form: any): string {
  return `You are a world-class learning architect. Generate a personalized roadmap.

USER PROFILE:
- Skill Level: ${form.level}
- Known Languages: ${(form.languages || []).join(", ") || "None"}
- Target Field: ${form.field}
- Preferred Technologies: ${(form.frameworks || []).join(", ") || "Open"}
- Weekly Study Hours: ${form.hours} hrs/week
- Primary Goal: ${form.goal}
- Specific Focus: ${form.focus || "General mastery"}

Return ONLY valid JSON:
{"title":"string","summary":"2 sentences","totalMonths":number,"weeklyHours":${form.hours},"phases":[{"number":1,"name":"string","duration":"X weeks","goal":"string","topics":["x5"],"tools":["x3"],"resources":["x3"],"exercises":["x3"],"checklist":["task1","task2","task3","task4","task5"],"project":{"name":"string","description":"2 sentences"},"milestone":"You can now..."}]}

Rules: Exactly 6 phases. Field-specific content. 5 checklist items each. Milestone starts "You can now...".`;
}

/*
─────────────────────────────────────────────────────────────────────────────
HOW TO USE THIS EDGE FUNCTION IN aiService.ts
─────────────────────────────────────────────────────────────────────────────
Replace the generateRoadmap function body in services/aiService.ts with:

import { supabase } from '../lib/supabase';

export async function generateRoadmap(form) {
  const { data, error } = await supabase.functions.invoke('generate-roadmap', {
    body: { form },
  });
  if (error) throw new Error(error.message);
  return data;
}

This way:
  ✅ The Anthropic key lives ONLY on the Supabase server
  ✅ Only authenticated users can call the function (JWT verified)
  ✅ The key is NEVER in the app bundle or in .env
─────────────────────────────────────────────────────────────────────────────
*/
