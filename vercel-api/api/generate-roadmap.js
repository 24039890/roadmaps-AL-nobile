// api/generate-roadmap.js
// Vercel Serverless Function — uses Google Gemini (free tier)

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return res
      .status(500)
      .json({ error: "GEMINI_API_KEY not configured on server" });
  }

  const { form } = req.body || {};
  if (!form)
    return res.status(400).json({ error: "Missing form in request body" });

  console.log("[generate-roadmap] field:", form.field, "| goal:", form.goal);

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
    GEMINI_API_KEY;

  let geminiRes;
  try {
    geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: buildPrompt(form) }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 8192,
        },
      }),
    });
  } catch (err) {
    console.error("[generate-roadmap] fetch error:", err.message);
    return res
      .status(502)
      .json({ error: "Failed to reach Gemini: " + err.message });
  }

  console.log("[generate-roadmap] Gemini status:", geminiRes.status);

  if (!geminiRes.ok) {
    const errText = await geminiRes.text().catch(() => "");
    let errMsg = errText;
    try {
      errMsg = JSON.parse(errText)?.error?.message || errText;
    } catch (_) {}
    console.error("[generate-roadmap] Gemini error:", geminiRes.status, errMsg);
    return res
      .status(502)
      .json({ error: "Gemini error " + geminiRes.status + ": " + errMsg });
  }

  const geminiData = await geminiRes.json();
  const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  if (!rawText) {
    console.error(
      "[generate-roadmap] Empty response from Gemini:",
      JSON.stringify(geminiData).slice(0, 300),
    );
    return res.status(502).json({ error: "Empty response from Gemini" });
  }

  console.log("[generate-roadmap] Raw length:", rawText.length);

  const cleaned = extractJSON(rawText);

  let roadmap;
  try {
    roadmap = JSON.parse(cleaned);
  } catch (err) {
    console.error(
      "[generate-roadmap] JSON parse failed. Preview:",
      cleaned.slice(0, 300),
    );
    return res.status(502).json({ error: "Invalid JSON from AI, try again" });
  }

  if (!roadmap.phases?.length) {
    return res
      .status(502)
      .json({ error: "Missing phases in AI response, try again" });
  }

  console.log("[generate-roadmap] Success — phases:", roadmap.phases.length);
  return res.status(200).json(roadmap);
};

function buildPrompt(form) {
  return (
    "Generate a personalized 6-phase learning roadmap.\n\n" +
    "USER PROFILE:\n" +
    "Level: " +
    (form.level || "Beginner") +
    "\n" +
    "Languages: " +
    ((form.languages || []).join(", ") || "None") +
    "\n" +
    "Field: " +
    (form.field || "General") +
    "\n" +
    "Technologies: " +
    ((form.frameworks || []).join(", ") || "Any") +
    "\n" +
    "Weekly Hours: " +
    (form.hours || 10) +
    "\n" +
    "Goal: " +
    (form.goal || "Learn") +
    "\n" +
    "Focus: " +
    (form.focus || "General") +
    "\n\n" +
    "STRICT RULES:\n" +
    "1. Return RAW JSON only — absolutely no markdown fences, no text before or after the JSON\n" +
    "2. Exactly 6 phases: Foundations, Core Skills, Intermediate Projects, Advanced Topics, Real-World Projects, Portfolio & Career\n" +
    "3. Each phase needs ALL of: number, name, duration, goal, topics(5 items), tools(3 items), resources(3 items), exercises(3 items), checklist(exactly 5 items), project{name,description}, milestone\n" +
    '4. milestone must start with "You can now"\n' +
    "5. All content specific to " +
    form.field +
    " and goal: " +
    form.goal +
    "\n" +
    "6. Realistic timeline for " +
    form.hours +
    " hours/week\n\n" +
    "Return ONLY this JSON shape, nothing else:\n" +
    '{"title":"...","summary":"2 sentence personalized summary","totalMonths":6,"weeklyHours":' +
    (form.hours || 10) +
    ',"phases":[{"number":1,"name":"Foundations","duration":"X weeks","goal":"one sentence","topics":["t1","t2","t3","t4","t5"],"tools":["t1","t2","t3"],"resources":["r1","r2","r3"],"exercises":["e1","e2","e3"],"checklist":["task1","task2","task3","task4","task5"],"project":{"name":"...","description":"2 sentences"},"milestone":"You can now..."}]}'
  );
}

function extractJSON(raw) {
  let text = raw
    .replace(/^```json\s*/gm, "")
    .replace(/^```\s*/gm, "")
    .trim();
  if (text.startsWith("{")) return text;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start)
    return text.slice(start, end + 1);
  return text;
}
