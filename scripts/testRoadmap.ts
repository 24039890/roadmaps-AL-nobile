// scripts/testRoadmap.ts
import { generateRoadmap } from "../services/aiService";
import { RoadmapForm } from "../types";

async function testRoadmap() {
  // Define the form using the proper type
  const form: RoadmapForm = {
    level: "Beginner",
    languages: ["JavaScript", "Python"],
    field: "Web Development",
    frameworks: ["React", "Next.js"],
    hours: 10,
    goal: "Become a full-stack developer",
    focus: "Front-end",
  };

  try {
    // Call the dynamic roadmap generator
    const roadmap = await generateRoadmap(form);

    // Print the result to the console
    console.log("Generated Roadmap:", JSON.stringify(roadmap, null, 2));
  } catch (err: any) {
    console.error("Error generating roadmap:", err.message);
  }
}

// Run the test
testRoadmap();
