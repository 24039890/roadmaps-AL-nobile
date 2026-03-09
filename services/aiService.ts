// services/aiService.ts
import { Roadmap, RoadmapForm } from "../types";

// ── API Keys ───────────────────────────────────────────────────
const ANTHROPIC_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? "";
const GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY ?? "";

if (!ANTHROPIC_KEY) {
  console.warn(
    "[aiService] EXPO_PUBLIC_ANTHROPIC_API_KEY is not set. Anthropic calls will fail.",
  );
}
if (!GROQ_KEY) {
  console.warn(
    "[aiService] EXPO_PUBLIC_GROQ_API_KEY is not set. Groq fallback will fail.",
  );
}

// ── Build prompt ───────────────────────────────────────────────
function buildPrompt(form: RoadmapForm): string {
  return `You are a world-class learning architect. Generate a highly personalized learning roadmap.

USER PROFILE:
- Skill Level: ${form.level}
- Known Languages: ${form.languages.join(", ") || "None"}
- Target Field: ${form.field}
- Preferred Technologies: ${form.frameworks.join(", ") || "Open"}
- Weekly Study Hours: ${form.hours} hrs/week
- Primary Goal: ${form.goal}
- Specific Focus: ${form.focus || "General mastery"}

Return ONLY valid JSON (no markdown, no prose):
{
  "title": "string",
  "summary": "2-sentence personalized summary",
  "totalMonths": number,
  "weeklyHours": ${form.hours},
  "phases": [
    {
      "number": 1,
      "name": "string",
      "duration": "X weeks",
      "goal": "One-sentence phase goal",
      "topics": ["x5"],
      "tools": ["x3"],
      "resources": ["x3"],
      "exercises": ["x3"],
      "checklist": ["task1","task2","task3","task4","task5"],
      "project": { "name": "string", "description": "2-sentence with tech stack" },
      "milestone": "You can now..."
    }
  ]
}

Rules: Exactly 6 phases (Foundations→Core Skills→Intermediate→Advanced→Real-World Projects→Portfolio & Career). Checklist = exactly 5 items. Milestone starts "You can now...". Realistic for ${form.hours} hrs/week.`;
}

// ── Extract JSON safely from AI output ─────────────────────────
function extractJSON(raw: string): string {
  let text = raw
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return start !== -1 && end !== -1 && end > start
    ? text.slice(start, end + 1)
    : text;
}

// ── Normalize roadmap deeply ───────────────────────────────────
function normalizeRoadmap(rawRoadmap: any) {
  const roadmap = { ...rawRoadmap };

  roadmap.title ||= "Untitled Roadmap";
  roadmap.summary ||= "No summary provided";
  roadmap.totalMonths ||= 0;
  roadmap.weeklyHours ||= 0;
  roadmap.phases ||= [];

  for (let i = 0; i < 6; i++) {
    const p = roadmap.phases[i] || {};
    roadmap.phases[i] = {
      number: i + 1,
      name: p.name || `Phase ${i + 1}`,
      duration: p.duration || "1 week",
      goal: p.goal || "TBD",
      topics: Array.isArray(p.topics)
        ? p.topics.slice(0, 5)
        : Array(5).fill("TBD Topic"),
      tools: Array.isArray(p.tools)
        ? p.tools.slice(0, 3)
        : Array(3).fill("TBD Tool"),
      resources: Array.isArray(p.resources)
        ? p.resources.slice(0, 3)
        : Array(3).fill("TBD Resource"),
      exercises: Array.isArray(p.exercises)
        ? p.exercises.slice(0, 3)
        : Array(3).fill("TBD Exercise"),
      checklist: Array.isArray(p.checklist)
        ? p.checklist.slice(0, 5)
        : ["task1", "task2", "task3", "task4", "task5"],
      project: {
        name: p.project?.name || "TBD",
        description: p.project?.description || "TBD",
      },
      milestone: p.milestone || "You can now...",
    };
  }

  return roadmap;
}

// ── Safe parse JSON ────────────────────────────────────────────
function safeParse(raw: string) {
  try {
    const parsed = JSON.parse(extractJSON(raw));
    return normalizeRoadmap(parsed);
  } catch (err) {
    console.error("[aiService] JSON parse failed:", err);
    return normalizeRoadmap({});
  }
}

// ── Helper: fetch with retry + exponential backoff ─────────────
async function fetchWithRetry(url: string, options: any, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      console.warn(`[aiService] Request failed (${res.status}). Retrying...`);
    } catch (err) {
      console.warn("[aiService] Network error, retrying...", err);
    }
    await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
  }
  throw new Error("Network request failed after retries");
}

// ── Anthropic API call with retry ─────────────────────────────
async function callAnthropic(form: RoadmapForm) {
  if (!ANTHROPIC_KEY) throw new Error("No Anthropic key configured.");
  console.log("[aiService] Calling Anthropic API...");

  const res = await fetchWithRetry("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      messages: [{ role: "user", content: buildPrompt(form) }],
    }),
  });

  const data = await res.json();
  const raw = (data.content ?? []).map((b: any) => b.text ?? "").join("");
  return safeParse(raw);
}

// ── Groq API fallback with retry ──────────────────────────────
async function callGroq(form: RoadmapForm) {
  if (!GROQ_KEY) throw new Error("No Groq key configured.");
  console.log("[aiService] Calling Groq API (fallback)...");

  const res = await fetchWithRetry("https://api.groq.ai/v1/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: "groq-1",
      prompt: buildPrompt(form),
      max_output_tokens: 2000,
    }),
  });

  const data = await res.json();
  const raw = data.output_text ?? "";
  return safeParse(raw);
}

// ── Main export ───────────────────────────────────────────────
export async function generateRoadmap(
  form: RoadmapForm,
): Promise<Omit<Roadmap, "id" | "createdAt" | "form">> {
  try {
    const roadmap = await callAnthropic(form);
    console.log(
      "[aiService] Raw roadmap generated by Anthropic:",
      JSON.stringify(roadmap, null, 2),
    );
    return roadmap;
  } catch (err) {
    console.warn("[aiService] Falling back to Groq due to error:", err);
    const roadmap = await callGroq(form);
    console.log(
      "[aiService] Raw roadmap generated by Groq:",
      JSON.stringify(roadmap, null, 2),
    );
    return roadmap;
  }
}
