import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function checkQuota() {
  console.log("Checking API key quota with simple models.generateContent call...");
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Hello, confirm if this API key is active.",
    });
    console.log("Response text:", response.text);
    console.log("✅ API KEY GENERATE CONTENT WORKS!");
  } catch (err: any) {
    console.error("❌ GenerateContent failed:", err.message);
  }
}

checkQuota();
