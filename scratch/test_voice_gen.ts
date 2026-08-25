import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function testAudioInput() {
  console.log("Connecting...");
  let receivedAudioChunks = 0;

  const session = await ai.live.connect({
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
        console.log("Connected!");
      },
      onmessage: (msg) => {
        if (msg.serverContent?.modelTurn?.parts) {
          for (const p of msg.serverContent.modelTurn.parts) {
            if (p.inlineData?.data) {
              receivedAudioChunks++;
              console.log(`🔊 Received audio chunk #${receivedAudioChunks}, size: ${p.inlineData.data.length}`);
            }
            if (p.text) {
              console.log(`💬 Model text:`, p.text);
            }
          }
        }
        if (msg.serverContent?.turnComplete) {
          console.log("✅ Turn complete, voice playback generated successfully!");
        }
      },
      onerror: (err) => console.error("Error:", err),
      onclose: (e) => console.log("Closed:", e)
    }
  });

  // Test 1: Send text prompt
  console.log("Sending text prompt...");
  session.sendRealtimeInput({
    text: "Say Salam Alaikum to test the voice",
  });

  setTimeout(() => {
    session.close();
    process.exit(0);
  }, 4000);
}

testAudioInput();
