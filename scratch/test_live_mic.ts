import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function testLiveMicResponse() {
  console.log("Connecting live session with voice Puck...");
  let audioChunksReceived = 0;

  const session = await ai.live.connect({
    model: "gemini-2.5-flash-native-audio-latest",
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: "Puck" },
        },
      },
      systemInstruction: "You are Ahmed AI, a friendly Islamic assistant. When you receive a greeting or question, respond naturally in spoken voice."
    },
    callbacks: {
      onopen: () => {
        console.log("Connected to Gemini Live!");
      },
      onmessage: (msg) => {
        if (msg.serverContent?.modelTurn?.parts) {
          for (const part of msg.serverContent.modelTurn.parts) {
            if (part.inlineData?.data) {
              audioChunksReceived++;
              console.log(`🔊 Received Audio Chunk #${audioChunksReceived} (${part.inlineData.data.length} bytes)`);
            }
            if (part.text) {
              console.log("💬 AI Text:", part.text);
            }
          }
        }
        if (msg.serverContent?.turnComplete) {
          console.log("✨ Turn complete!");
        }
      },
      onerror: (err) => console.error("Session error:", err),
      onclose: (e) => console.log("Session closed:", e.code, e.reason)
    }
  });

  // Test 1: Send client content text "Salam Alaikum"
  console.log("Sending text 'Salam Alaikum'...");
  session.sendClientContent({
    turns: [
      {
        role: "user",
        parts: [{ text: "Salam Alaikum! How are you?" }]
      }
    ],
    turnComplete: true
  });

  setTimeout(() => {
    console.log(`Total audio chunks received so far: ${audioChunksReceived}`);
    session.close();
    process.exit(0);
  }, 6000);
}

testLiveMicResponse();
