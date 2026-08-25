import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

const voices = ["Puck", "Charon", "Kore", "Fenrir", "Aoede", "Zephyr"];

async function testVoices() {
  for (const v of voices) {
    console.log(`\nTesting voice: "${v}"`);
    let chunks = 0;
    try {
      const session = await ai.live.connect({
        model: "gemini-2.5-flash-native-audio-latest",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: v },
            },
          },
        },
        callbacks: {
          onopen: () => {},
          onmessage: (m) => {
            if (m.serverContent?.modelTurn?.parts) {
              for (const p of m.serverContent.modelTurn.parts) {
                if (p.inlineData?.data) chunks++;
              }
            }
          },
          onerror: (e) => console.log(`Error on voice ${v}:`, e),
        }
      });

      session.sendClientContent({
        turns: [{ role: "user", parts: [{ text: "Hello, test voice." }] }],
        turnComplete: true
      });

      await new Promise(r => setTimeout(r, 2500));
      session.close();
      console.log(`Voice "${v}" returned ${chunks} audio chunks!`);
    } catch (e: any) {
      console.error(`Failed for voice "${v}":`, e.message);
    }
  }
}

testVoices();
