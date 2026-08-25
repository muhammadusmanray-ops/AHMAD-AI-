import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function testSessionMethods() {
  const session = await ai.live.connect({
    model: "gemini-2.0-flash-exp",
    config: {
      responseModalities: [Modality.AUDIO],
    },
    callbacks: {
      onopen: () => {
        console.log("Connected! Checking session methods:");
        console.log("Keys on session:", Object.keys(session));
        console.log("Prototype keys:", Object.getOwnPropertyNames(Object.getPrototypeOf(session)));
        
        // Test sending text
        try {
          console.log("Testing sending text via sendRealtimeInput / send...");
          if (typeof (session as any).sendRealtimeInput === "function") {
            (session as any).sendRealtimeInput({
              text: "Salam",
            });
            console.log("sendRealtimeInput worked");
          }
          if (typeof (session as any).send === "function") {
            console.log("send function exists");
          }
        } catch (e: any) {
          console.error("Error sending input:", e.message);
        }
      },
      onmessage: (msg) => {
        console.log("Got message turn:", Object.keys(msg));
        setTimeout(() => {
          session.close();
          process.exit(0);
        }, 1500);
      },
      onerror: (e) => console.error("Error:", e),
      onclose: (e) => console.log("Closed:", e)
    }
  });
}

testSessionMethods();
