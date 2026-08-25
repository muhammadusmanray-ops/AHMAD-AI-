import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function testFullFlow() {
  let sessionObj: any = null;
  const sessionPromise = ai.live.connect({
    model: "gemini-2.0-flash-exp",
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: "Zephyr" },
        },
      },
      systemInstruction: "You are JARVIS. Say salam briefly.",
    },
    callbacks: {
      onopen: () => {
        console.log("WebSocket connected!");
      },
      onmessage: (msg) => {
        if (msg.serverContent?.modelTurn?.parts) {
          for (const p of msg.serverContent.modelTurn.parts) {
            if (p.text) console.log("Text:", p.text);
            if (p.inlineData?.data) console.log("Audio chunk received, length:", p.inlineData.data.length);
          }
        }
        if (msg.serverContent?.turnComplete) {
          console.log("Turn complete!");
          setTimeout(() => {
            sessionObj?.close();
            process.exit(0);
          }, 500);
        }
      },
      onerror: (err) => console.error("Error:", err),
      onclose: (e) => console.log("Closed:", e)
    }
  });

  sessionObj = await sessionPromise;
  console.log("Session assigned!");

  // Send a real-time text input
  console.log("Sending text: Salam...");
  sessionObj.sendRealtimeInput({
    text: "Salam, how are you?",
  });
}

testFullFlow();
