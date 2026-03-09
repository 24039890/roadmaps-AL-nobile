import OpenAI from "openai";
import { RoadmapForm } from "../types";

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
});

export async function callOpenAI(form: RoadmapForm) {
  const prompt = `Generate a roadmap for: ${form.title}\nDetails: ${form.description ?? ""}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 500,
    });

    return response.choices[0].message?.content ?? "";
  } catch (err: any) {
    console.error("[OpenAI ERROR FULL]", err);

    if (err.status === 429) {
      console.error("Rate limit or quota exceeded.");
    }

    throw err;
  }
}
console.log("API KEY:", process.env.EXPO_PUBLIC_OPENAI_API_KEY);
