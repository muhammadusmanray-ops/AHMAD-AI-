import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey });

    const { text, audio, voice } = req.body || {};
    const promptText = text || "Salam Alaikum";

    console.log("Vercel Serverless Request received:", promptText);

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: promptText,
      config: {
        systemInstruction: "You are JARVIS, a respectful Islamic AI assistant speaking natural Pakistani Urdu, Roman Urdu, or English. Respond politely, naturally and concisely."
      }
    });

    const responseText = result.text || "Wa Alaikum As-Salam. How can I assist you?";

    return res.status(200).json({
      type: "assistant_text",
      text: responseText,
      status: "success"
    });
  } catch (err: any) {
    console.error("Vercel API Handler Error:", err);
    return res.status(500).json({
      type: "error",
      error: err.message || "Failed to process request on Vercel"
    });
  }
}
