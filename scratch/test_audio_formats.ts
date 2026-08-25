import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

// Helper to create 1 second of 16kHz 16-bit PCM audio (tone)
function createPcmChunk(durationMs = 200, freq = 440): string {
  const sampleRate = 16000;
  const numSamples = Math.floor((sampleRate * durationMs) / 1000);
  const buffer = new ArrayBuffer(numSamples * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * freq * t) * 0.5;
    view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
  return Buffer.from(buffer).toString("base64");
}

async function testAudioStreamFormats() {
  const formats = [
    {
      name: "mediaChunks array",
      fn: (s: any, b64: string) => s.sendRealtimeInput({
        mediaChunks: [{ mimeType: "audio/pcm;rate=16000", data: b64 }]
      })
    },
    {
      name: "audio object",
      fn: (s: any, b64: string) => s.sendRealtimeInput({
        audio: { mimeType: "audio/pcm;rate=16000", data: b64 }
      })
    }
  ];

  for (const fmt of formats) {
    console.log(`\nTesting format: ${fmt.name}`);
    await new Promise<void>((resolve) => {
      let session: any = null;
      ai.live.connect({
        model: "gemini-2.5-flash-native-audio-latest",
        config: {
          responseModalities: [Modality.AUDIO],
        },
        callbacks: {
          onopen: () => {
            console.log(`Connected for ${fmt.name}`);
            try {
              const chunk = createPcmChunk(200);
              for (let i = 0; i < 5; i++) {
                fmt.fn(session, chunk);
              }
              console.log(`Sent 5 chunks with ${fmt.name}`);
            } catch (err: any) {
              console.error(`Error sending with ${fmt.name}:`, err.message);
            }
            setTimeout(() => {
              session?.close();
              resolve();
            }, 2000);
          },
          onmessage: (m) => {
            console.log(`Message received on ${fmt.name}:`, Object.keys(m));
          },
          onerror: (e) => console.log(`Error on ${fmt.name}:`, e),
          onclose: (c) => console.log(`Close on ${fmt.name}:`, c.code, c.reason)
        }
      }).then(s => { session = s; });
    });
  }
}

testAudioStreamFormats();
