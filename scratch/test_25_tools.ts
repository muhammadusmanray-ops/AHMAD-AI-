import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function test() {
  const models = ["gemini-2.5-flash", "gemini-3.5-flash"];
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
            clearTimeout(timeout);
            console.log(`  ✅ SUCCESS! ${m} supports Live session with tools.`);
            setTimeout(() => {
              try { sess?.close(); } catch (_) {}
              resolve();
            }, 500);
          },
          onerror: (err) => {
            clearTimeout(timeout);
            console.log(`  ❌ ERROR for ${m}:`, err.message || err);
            resolve();
          },
          onclose: () => {
            resolve();
          }
        }
      }).then(s => {
        sess = s;
      }).catch(err => {
        clearTimeout(timeout);
        console.log(`  ❌ CATCH for ${m}:`, err.message);
        resolve();
      });
    });
  }
}

test();
