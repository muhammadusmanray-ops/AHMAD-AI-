import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function checkModels() {
  console.log("Listing available models from API...");
  try {
    const list = await ai.models.list();
    for await (const m of list) {
      if (m.name?.includes("gemini") || m.name?.includes("live") || m.name?.includes("flash")) {
        console.log("Model:", m.name, "| supportedActions:", m.supportedActions);
      }
    }
  } catch (e: any) {
    console.log("Error listing models:", e.message);
  }

  const candidateLiveModels = [
    "gemini-2.0-flash-exp",
    "gemini-2.0-flash-realtime-exp",
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-2.5-flash-preview",
  ];

  for (const model of candidateLiveModels) {
    console.log(`\nTesting Live connect for: ${model}...`);
    try {
      let liveSession: any = null;
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          console.log(`  ❌ Timeout on ${model}`);
          resolve();
        }, 5000);

        ai.live.connect({
          model: model,
          config: {
            responseModalities: [Modality.AUDIO],
          },
          callbacks: {
            onopen: () => {
              clearTimeout(timeout);
              console.log(`  ✅ SUCCESS! ${model} connected to Live API`);
              setTimeout(() => {
                try { liveSession?.close(); } catch (_) {}
                resolve();
              }, 500);
            },
            onerror: (err) => {
              clearTimeout(timeout);
              console.log(`  ❌ ERROR for ${model}:`, err.message || err);
              resolve();
            },
            onclose: (event) => {
              // closed
            }
          }
        }).then(s => {
          liveSession = s;
        }).catch(err => {
          clearTimeout(timeout);
          console.log(`  ❌ CONNECT REJECTED for ${model}:`, err.message);
          resolve();
        });
      });
    } catch (err: any) {
      console.log(`  ❌ EXCEPTION for ${model}:`, err.message);
    }
  }
}

checkModels();
