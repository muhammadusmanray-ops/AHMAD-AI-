import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function test() {
  try {
    console.log("Testing text generation with gemini-3.6-flash...");
    const res = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: "Hello! Respond in 5 words.",
    });
    console.log("gemini-3.6-flash Response:", res.text);
  } catch (err: any) {
    console.error("Text gen error:", err.message);
  }

  try {
    console.log("\nTesting Multimodal Live connect with gemini-2.0-flash-exp...");
    let liveSession: any = null;
    liveSession = await ai.live.connect({
      model: "gemini-2.0-flash-exp",
      config: {
        responseModalities: [Modality.AUDIO],
      },
      callbacks: {
        onopen: () => {
          console.log("✓ Gemini Live Multimodal WebSocket connected successfully!");
          setTimeout(() => {
            liveSession?.close();
            console.log("✓ Gemini Live session closed cleanly.");
          }, 1000);
        },
        onmessage: (msg) => {
          console.log("Live message received:", Object.keys(msg));
        },
        onerror: (err) => {
          console.error("Live error:", err);
        },
        onclose: () => {
          console.log("Live connection closed callback.");
        }
      }
    });
  } catch (err: any) {
    console.error("Live connect error:", err.message);
  }
}

test();
