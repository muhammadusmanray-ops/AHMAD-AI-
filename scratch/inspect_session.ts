import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function inspectSession() {
  console.log("Connecting live session...");
  let session = await ai.live.connect({
    model: "gemini-2.5-flash-native-audio-latest",
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
        console.log("WebSocket onopen fired");
      },
      onmessage: (msg) => {
        console.log("Got message from server! Keys:", Object.keys(msg));
        if (msg.serverContent?.modelTurn?.parts) {
          console.log("Audio parts received:", msg.serverContent.modelTurn.parts.map(p => ({
            hasText: !!p.text,
            text: p.text,
            hasAudio: !!p.inlineData,
            audioLen: p.inlineData?.data?.length
          })));
        }
      },
      onerror: (err) => console.error("Error:", err),
      onclose: (e) => console.log("Closed:", e.code, e.reason)
    }
  });

  console.log("Session object keys:", Object.keys(session));
  console.log("Session proto methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(session)));

  // Test sending text
  console.log("Sending text via session.send()...");
  try {
    session.send({
      clientContent: {
        turns: [
          {
            role: "user",
            parts: [{ text: "Hello! Say testing one two three." }]
          }
        ],
        turnComplete: true
      }
    });
    console.log("session.send() called successfully!");
  } catch (e: any) {
    console.error("session.send failed:", e.message);
  }

  // Also test sendRealtimeInput if it exists
  if (typeof (session as any).sendRealtimeInput === "function") {
    console.log("sendRealtimeInput exists!");
  }

  setTimeout(() => {
    session.close();
    process.exit(0);
  }, 4000);
}

inspectSession();
