import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function testLiveModelsWithTools() {
  const models = [
    "gemini-2.5-flash-native-audio-latest",
    "gemini-2.0-flash-exp",
    "gemini-2.0-flash",
  ];

  for (const m of models) {
    console.log(`Testing Live model with tools: ${m}...`);
    try {
      let sess: any = null;
      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          console.log(`  ⏱️ Timeout for ${m}`);
          resolve();
        }, 6000);

        ai.live.connect({
          model: m,
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: "Zephyr" },
              },
            },
            tools: [
              {
                functionDeclarations: [
                  {
                    name: "test_tool",
                    description: "A test tool",
                    parameters: {
                      type: "OBJECT" as any,
                      properties: {
                        query: { type: "STRING" as any }
                      }
                    }
                  }
                ]
              }
            ]
          },
          callbacks: {
            onopen: () => {
              clearTimeout(timer);
              console.log(`  🌟 CONNECTED WITH TOOLS: ${m}`);
              setTimeout(() => {
                try { sess?.close(); } catch (_) {}
                resolve();
              }, 500);
            },
            onerror: (err) => {
              clearTimeout(timer);
              console.log(`  ❌ ERROR for ${m}:`, err);
              resolve();
            },
            onclose: () => {
              // closed
            }
          }
        }).then(s => {
          sess = s;
        }).catch(err => {
          clearTimeout(timer);
          console.log(`  ❌ CATCH for ${m}:`, err.message);
          resolve();
        });
      });
    } catch (e: any) {
      console.log(`  ❌ EXCEPTION:`, e.message);
    }
  }
}

testLiveModelsWithTools();
