// server.js
import dotenv from "dotenv";
import express from "express";
import fetch from "node-fetch"; // or built-in fetch in Node 20+

dotenv.config();
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;
const GROQ_KEY = process.env.GROQ_KEY;

// ── Build prompt (same as client) ─────────────────────────────
function buildPrompt(form) {
  return `You are a world-class learning architect. Generate a highly personalized learning roadmap.

USER PROFILE:
- Skill Level: ${form.level}
- Known Languages: ${form.languages.join(", ") || "None"}
- Target Field: ${form.field}
- Preferred Technologies: ${form.frameworks.join(", ") || "Open"}
- Weekly Study Hours: ${form.hours} hrs/week
- Primary Goal: ${form.goal}
- Specific Focus: ${form.focus || "General mastery"}

Return ONLY valid JSON (no markdown, no prose).`;
}

// ── Helper: fetch with retry ───────────────────────────────────
async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      console.warn(`Request failed (${res.status}). Retrying...`);
    } catch (err) {
      console.warn("Network error, retrying...", err);
    }
    await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
  }
  throw new Error("Network request failed after retries");
}

// ── API route ────────────────────────────────────────────────
app.post("/api/roadmap", async (req, res) => {
  const form = req.body;

  try {
    // 1️⃣ Try Anthropic first
    if (!ANTHROPIC_KEY) throw new Error("No Anthropic key configured");

    const anthropicRes = await fetchWithRetry(
      "https://api.anthropic.com/v1/messages",
      {
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
      },
    );

    const data = await anthropicRes.json();
    const raw = (data.content ?? []).map((b) => b.text ?? "").join("");
    return res.json({ raw, source: "anthropic" });
  } catch (err) {
    console.warn("Anthropic failed, falling back to Groq:", err);

    if (!GROQ_KEY)
      return res.status(500).json({ error: "No Groq key configured" });

    try {
      const groqRes = await fetchWithRetry(
        "https://api.groq.ai/v1/completions",
        {
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
        },
      );

      const groqData = await groqRes.json();
      const raw = groqData.output_text ?? "";
      return res.json({ raw, source: "groq" });
    } catch (err2) {
      console.error("Groq also failed:", err2);
      return res.status(500).json({ error: "Both Anthropic and Groq failed" });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
