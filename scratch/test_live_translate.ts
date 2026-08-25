import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function test() {
  const models = [
    "gemini-3.5-live-translate-preview",
    "gemini-3.1-flash-live-preview",
    "gemini-2.5-flash-native-audio-latest"
  ];
  for (const m of models) {
    console.log(`Testing model with tools: ${m}`);
    await new Promise<void>((resolve) => {
      let sess: any = null;
      const timeout = setTimeout(() => {
        console.log(`  ⏱️ Timeout for ${m}`);
        resolve();
      }, 5000);

      ai.live.connect({
        model: m,
        config: {
          responseModalities: [Modality.AUDIO],
          tools: [{
            functionDeclarations: [{
              name: "open_chatbox",
              description: "open chatbox",
              parameters: { type: "OBJECT" as any, properties: {} }
            }]
          }]
        },
        callbacks: {
          onopen: () => {
            console.log(`  🟢 Opened: ${m}`);
          },
          onmessage: () => {
            // empty
          },
          onerror: (err) => {
            clearTimeout(timeout);
            console.log(`  ❌ ERROR for ${m}:`, err.message || err);
            resolve();
          },
          onclose: (event) => {
            clearTimeout(timeout);
            console.log(`  🔴 Closed: ${m} | Code: ${event.code} | Reason: ${event.reason}`);
            resolve();
          }
        }
      }).then(s => {
        sess = s;
        // Keep open for 2 seconds to check if gateway drops it with 1008
        setTimeout(() => {
          clearTimeout(timeout);
          console.log(`  ... Stable for 2s`);
          try { sess?.close(); } catch (_) {}
          resolve();
        }, 2000);
      }).catch(err => {
        clearTimeout(timeout);
        console.log(`  ❌ CATCH for ${m}:`, err.message);
        resolve();
      });
    });
  }
}

test();
