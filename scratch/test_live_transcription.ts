import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function testWithTranscription() {
  console.log("Connecting with transcription...");
  const session = await ai.live.connect({
    model: "gemini-2.5-flash-native-audio-latest",
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: "Zephyr" },
        },
      },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      systemInstruction: "You are JARVIS. When spoken to or greeted with Salam, reply naturally with spoken voice."
    },
    callbacks: {
      onopen: () => {
        console.log("Connected!");
      },
      onmessage: (msg: any) => {
        console.log("Keys in server message:", Object.keys(msg));
        if (msg.serverContent) {
          console.log("serverContent keys:", Object.keys(msg.serverContent));
          if (msg.serverContent.outputAudioTranscription) {
            console.log("🤖 Assistant Live Transcript:", msg.serverContent.outputAudioTranscription.text);
          }
          if (msg.serverContent.inputAudioTranscription) {
            console.log("👤 User Live Transcript:", msg.serverContent.inputAudioTranscription.text);
          }
          if (msg.serverContent.modelTurn?.parts) {
            for (const p of msg.serverContent.modelTurn.parts) {
              if (p.inlineData?.data) {
                console.log("🔊 Audio chunk received, size:", p.inlineData.data.length);
              }
              if (p.text) {
                console.log("💬 Part text:", p.text);
              }
            }
          }
        }
      },
      onerror: (err) => console.error("Error:", err),
      onclose: (e) => console.log("Closed:", e)
    }
  });

  console.log("Sending text: 'Salam Alaikum Jarvis, can you hear me?'");
  session.sendClientContent({
    turns: [
      {
        role: "user",
        parts: [{ text: "Salam Alaikum Jarvis, can you hear me?" }]
      }
    ],
    turnComplete: true
  });

  setTimeout(() => {
    session.close();
    process.exit(0);
  }, 4000);
}

testWithTranscription();
