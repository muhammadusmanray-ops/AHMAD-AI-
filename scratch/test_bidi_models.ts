import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

const candidates = [
  "gemini-2.5-flash-native-audio-latest",
  "gemini-2.5-flash-native-audio-preview-12-2025",
  "gemini-3.1-flash-live-preview",
  "gemini-2.5-flash",
  "gemini-3.6-flash"
];

async function testAllBidi() {
  for (const model of candidates) {
    console.log(`\n========================================`);
    console.log(`Testing Bidi live stream with: ${model}`);
    console.log(`========================================`);

    await new Promise<void>((resolve) => {
      let session: any = null;
      let timeout = setTimeout(() => {
        console.log(`  ⏱️ Timeout for ${model}`);
        try { session?.close(); } catch (_) {}
        resolve();
      }, 7000);

      ai.live.connect({
        model: model,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Zephyr" },
            },
          },
        },
        callbacks: {
          onopen: () => {
            console.log(`  🟢 onopen fired for ${model}`);
          },
          onmessage: (msg) => {
            console.log(`  📩 onmessage received from ${model}! Parts:`, !!msg.serverContent?.modelTurn?.parts);
            if (msg.serverContent?.modelTurn?.parts) {
              for (const p of msg.serverContent.modelTurn.parts) {
                if (p.text) console.log(`     Text chunk: ${p.text}`);
                if (p.inlineData) console.log(`     Audio chunk: length ${p.inlineData.data?.length}`);
              }
            }
            if (msg.serverContent?.turnComplete) {
              console.log(`  🎉 turnComplete! This model works flawlessly!`);
              clearTimeout(timeout);
              try { session?.close(); } catch (_) {}
              resolve();
            }
          },
          onerror: (err) => {
            console.log(`  ❌ onerror for ${model}:`, err?.message || err);
          },
          onclose: (e) => {
            console.log(`  ⚠️ onclose for ${model}: code=${e.code}, reason=${e.reason}`);
            clearTimeout(timeout);
            resolve();
          }
        }
      }).then(s => {
        session = s;
        console.log(`  📡 Session created. Sending prompt: "Say hello"...`);
        session.sendRealtimeInput({
          text: "Say hello",
        });
      }).catch(err => {
        console.log(`  ❌ connect error for ${model}:`, err.message);
        clearTimeout(timeout);
        resolve();
      });
    });
  }
}

testAllBidi();
