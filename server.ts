import express from "express";
import http from "http";
import path from "path";
import dotenv from "dotenv";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({ apiKey });
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  app.use(express.json());

  // API Health & Status
  app.get("/api/health", (req, res) => {
    const hasKey = Boolean(process.env.GEMINI_API_KEY);
    res.json({
      status: "ok",
      hasApiKey: hasKey,
      timestamp: Date.now(),
    });
  });

  // Voices list
  app.get("/api/voices", (req, res) => {
    res.json({
      voices: [
        {
          id: "Zephyr",
          name: "Zephyr",
          gender: "Neutral / Warm",
          tag: "Natural & Balanced",
          description: "Friendly, balanced, everyday conversational tone with warm cadence.",
          recommended: true,
        },
        {
          id: "Kore",
          name: "Kore",
          gender: "Female / Soothing",
          tag: "Calm & Reflective",
          description: "Gentle, soothing voice ideal for deep explanations, tutoring, and calming chats.",
        },
        {
          id: "Puck",
          name: "Puck",
          gender: "Male / Upbeat",
          tag: "Energetic & Playful",
          description: "Vibrant, dynamic, and expressive voice with engaging energy.",
        },
        {
          id: "Charon",
          name: "Charon",
          gender: "Male / Deep",
          tag: "Deep & Grounded",
          description: "Rich, resonant, deep voice with an authoritative yet warm presence.",
        },
        {
          id: "Fenrir",
          name: "Fenrir",
          gender: "Male / Crisp",
          tag: "Crisp & Focused",
          description: "Direct, precise, articulate vocal tone suited for fast problem solving.",
        },
        {
          id: "Aoede",
          name: "Aoede",
          gender: "Female / Melodic",
          tag: "Articulate & Melodic",
          description: "Expressive, melodic voice with rich inflections for storytelling and creative tasks.",
        },
      ],
    });
  });

  // REST TTS preview endpoint
  app.post("/api/tts-preview", async (req, res) => {
    try {
      const { text, voice = "Zephyr" } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text.slice(0, 300) }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        return res.status(500).json({ error: "No audio generated from model" });
      }

      res.json({ audio: base64Audio, sampleRate: 24000 });
    } catch (err: any) {
      console.error("TTS preview error:", err);
      res.status(500).json({ error: err.message || "Failed to generate TTS preview" });
    }
  });

  // Fallback text chat endpoint in case user wants one-shot voice reply
  app.post("/api/chat-response", async (req, res) => {
    try {
      const { message, history = [], systemInstruction, voice = "Zephyr" } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const ai = getGeminiClient();

      // Generate response text
      const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction:
            systemInstruction ||
            "You are a warm, natural, and helpful AI voice assistant. Keep answers conversational, natural to speak aloud, concise, and friendly.",
          tools: [{ googleSearch: {} }],
        },
      });

      const chatResponse = await chat.sendMessage({ message });
      const textOutput = chatResponse.text || "";

      // Also synthesize audio
      let base64Audio: string | null = null;
      try {
        const ttsResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: textOutput.slice(0, 1000) }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice },
              },
            },
          },
        });
        base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
      } catch (ttsErr) {
        console.warn("TTS generation warning in fallback chat:", ttsErr);
      }

      res.json({
        text: textOutput,
        audio: base64Audio,
        sampleRate: 24000,
      });
    } catch (err: any) {
      console.error("Chat response error:", err);
      res.status(500).json({ error: err.message || "Failed to process chat" });
    }
  });

  // WebSocket Server for Live Voice Stream
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const pathname = request.url ? new URL(request.url, `http://${request.headers.host}`).pathname : "";
    if (pathname === "/live-ws" || pathname === "/api/live-ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on("connection", async (clientWs: WebSocket) => {
    console.log("Client connected to Live Voice WebSocket");

    const processedToolCalls = new Set<string>();
    let liveSession: any = null;
    let liveSessionPromise: Promise<any> | null = null;
    let isLiveActive = false;
    let serverAudioChunkCount = 0;

    // Helper to safely send to client
    const sendToClient = (data: any) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify(data));
      }
    };

    const cleanupSession = () => {
      isLiveActive = false;
      if (liveSession) {
        try {
          if (typeof liveSession.close === "function") {
            liveSession.close();
          }
        } catch (e) {
          console.error("Error closing live session:", e);
        }
        liveSession = null;
      }
    };

    clientWs.on("message", async (rawMessage) => {
      try {
        const msg = JSON.parse(rawMessage.toString());

        // 1. Initialize session with custom voice & system prompt
        if (msg.type === "start") {
          cleanupSession();

          const rawVoice = msg.voice || "Puck";
          const validVoices = ["Puck", "Charon", "Kore", "Fenrir", "Aoede", "Zephyr"];
          const voice = validVoices.includes(rawVoice) ? rawVoice : "Puck";
          const systemInstruction =
            msg.systemInstruction ||
            "You are Ahmed AI, an Islamic AI voice assistant speaking natural Pakistani Urdu, Roman Urdu, or English.\n" +
            "Your name is Ahmed AI. If asked about your name or who you are, you MUST reply: 'My name is Ahmed AI, and I was built by Muhammad Usman, who is a developer and AI/ML engineer.'\n" +
            "CRITICAL MANDATES:\n" +
            "- STRICT DOMAIN RESTRICTION (GUARDRAILS): You are strictly allowed to talk about Islam, Quran, Hadith, Prayer times, and related Islamic topics. If the user asks about ANY general knowledge, math, science, programming, history (non-Islamic), politics, news, or off-topic subjects, you MUST politely decline to answer, stating that you are an Islamic Voice Assistant and only handle Islamic queries.\n" +
            "- You MUST speak verbally and converse naturally with the user.\n" +
            "- When the user greets you with 'Salam Alaikum', 'Hello', or asks 'Can you hear me?', 'Are you there?', immediately answer with spoken voice warmly (e.g. 'Wa Alaikum As-Salam! Yes, I can hear you clearly. How can I help you today?'). DO NOT CALL ANY FUNCTION FOR CONVERSATION OR GREETINGS.\n" +
            "- QURAN RECITER RULES: When the user asks to play, hear, or listen to Quran recitation: \n" +
            "  1. If they explicitly mention a Qari (e.g. Mishary, Abdul Basit, Sudais, Ghamdi, Maher, Shatri, Islam Sobhi), execute `play_quran` immediately with `surah_number` and `qari_name`.\n" +
            "  2. If they do NOT specify a Qari, you MUST ask them verbally: 'I am starting Surah [Name]. Which Qari's voice would you like to hear?' and wait for them to respond. Do NOT call `play_quran` yet. Once they name a Qari, execute `play_quran` with both `surah_number` and `qari_name`.\n" +
            "  3. If they ask to 'resume', 'continue', 'play it', or 'play again' after it has been stopped or paused, execute `play_quran` immediately with the same `surah_number` and `qari_name` to resume playback.\n" +
            "- ONLY execute `play_quran` when the user explicitly asks to play or listen to Quran recitation.\n" +
            "- ONLY execute `get_hadith` when the user explicitly asks for a specific Hadith reference (e.g. 'Bukhari Hadith 10', 'Muslim Hadith 25').\n" +
            "- ONLY execute `open_quran_page` when the user explicitly asks to open/show a specific Surah or page.\n" +
            "- ONLY execute `open_chatbox` when the user asks to open the chatbox (e.g. 'open chatbox', 'chatbox kholo', 'show chat').\n" +
            "- ONLY execute `close_chatbox` when the user asks to close the chatbox (e.g. 'close chatbox', 'chatbox band kro', 'hide chat').\n" +
            "- ONLY execute `stop_audio` when told to stop playback.\n" +
            "- Keep all answers spoken, polite, concise, and natural.";

          try {
            const ai = getGeminiClient();
            sendToClient({ type: "status", status: "connecting", message: "Connecting to Gemini Live..." });

            // Connect to Gemini Live Multimodal Session
            liveSessionPromise = ai.live.connect({
              model: "gemini-2.5-flash",
              config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voice },
                  },
                },
                systemInstruction: systemInstruction,
                tools: [
                  {
                    functionDeclarations: [
                      {
                        name: "play_quran",
                        description: "Plays audio recitation of a Surah. Use ONLY when user explicitly asks to PLAY, HEAR, or LISTEN to audio (e.g. 'Play Surah', 'Tilawat sunao', 'Chalao'). NEVER use when user asks to OPEN or SHOW or READ a Surah.",
                        parameters: {
                          type: "OBJECT" as any,
                          properties: {
                            surah_number: {
                              type: "INTEGER" as any,
                              description: "The Surah number (1 to 114). E.g. Al-Fatihah is 1, An-Nisa is 4, Yaseen is 36, Ar-Rahman is 55, Al-Mulk is 67.",
                            },
                            surah_name: {
                              type: "STRING" as any,
                              description: "Name of the Surah (e.g. 'An-Nisa', 'Al-Mulk', 'Ya-Sin').",
                            },
                            qari_name: {
                              type: "STRING" as any,
                              description: "Name of the Qari / Reciter (optional). E.g. 'Mishary Rashid', 'Abdul Basit', 'Abdur-Rahman', 'Saad Al-Ghamdi', 'Maher Al-Muaiqly', 'Abu Bakr', 'Islam Sobhi'.",
                            }
                          },
                          required: ["surah_number"],
                        },
                      },
                      {
                        name: "stop_audio",
                        description: "Stops any currently playing audio, Quran recitation, or background media.",
                        parameters: {
                          type: "OBJECT" as any,
                          properties: {}
                        },
                      },
                      {
                        name: "get_prayer_times",
                        description: "Retrieves accurate Islamic prayer times (Fajr, Dhuhr, Asr, Maghrib, Isha) for a given city.",
                        parameters: {
                          type: "OBJECT" as any,
                          properties: {
                            city: {
                              type: "STRING" as any,
                              description: "City name, e.g. 'Faisalabad', 'Karachi', 'Lahore', 'Islamabad', 'London', 'Makkah'.",
                            },
                          },
                          required: ["city"],
                        },
                      },
                      {
                        name: "set_reminder",
                        description: "Sets a countdown timer / reminder for a given duration in seconds with a label.",
                        parameters: {
                          type: "OBJECT" as any,
                          properties: {
                            seconds: {
                              type: "INTEGER" as any,
                              description: "Duration in seconds to wait, e.g. 5, 10, 30, 300.",
                            },
                            label: {
                              type: "STRING" as any,
                              description: "The reminder label, e.g. 'Isha Prayer', 'Fajr Adhan', 'Break'.",
                            }
                          },
                          required: ["seconds", "label"],
                        }
                      },
                      {
                        name: "open_quran_page",
                        description: "Opens the Quran Reader visually to a page or Surah without playing any audio. MUST be used whenever user says 'Open', 'Show', 'Kholo', 'Read', 'Go to' (e.g. 'Open Surah An-Nisa', 'Surah Nisa kholo', 'Open page 71').",
                        parameters: {
                          type: "OBJECT" as any,
                          properties: {
                            page_number: {
                              type: "INTEGER" as any,
                              description: "The page number to open (1 to 611).",
                            },
                            surah_number: {
                              type: "INTEGER" as any,
                              description: "Optional Surah number (1 to 114) to jump to its starting page.",
                            },
                            para_number: {
                              type: "INTEGER" as any,
                              description: "Optional Para / Juz number (1 to 30) to jump to its starting page.",
                            }
                          }
                        }
                      },
                      {
                        name: "open_chatbox",
                        description: "Opens the visual interactive chatbox panel on the screen. Call this when the user says 'open chatbox', 'chatbox kholo', 'show chat', etc.",
                        parameters: {
                          type: "OBJECT" as any,
                          properties: {}
                        }
                      },
                      {
                        name: "close_chatbox",
                        description: "Closes the interactive chatbox panel on the screen. Call this when the user says 'close chatbox', 'chatbox band kro', 'hide chat', etc.",
                        parameters: {
                          type: "OBJECT" as any,
                          properties: {}
                        }
                      },
                      {
                        name: "get_hadith",
                        description: "Retrieves a specific authentic Hadith by book name and Hadith number. Use whenever the user asks for a specific Hadith reference (e.g. 'Bukhari Hadith 1', 'Muslim Hadith 25').",
                        parameters: {
                          type: "OBJECT" as any,
                          properties: {
                            book_name: {
                              type: "STRING" as any,
                              description: "The name of the book, e.g., 'bukhari', 'muslim', 'tirmidhi', 'abudawud', 'nasai', 'ibnmajah'.",
                            },
                            hadith_number: {
                              type: "INTEGER" as any,
                              description: "The Hadith number (e.g., 1, 5, 200).",
                            }
                          },
                          required: ["book_name", "hadith_number"]
                        }
                      }
                    ],
                  },
                ],
              },
              callbacks: {
                onopen: () => {
                  console.log("\x1b[32m[Gemini Live API]\x1b[0m 🟢 Multimodal WebSocket Session Connected successfully!");
                  isLiveActive = true;
                  sendToClient({
                    type: "status",
                    status: "connected",
                    message: "Live voice connection established. Speak naturally!",
                  });
                },
                onmessage: async (message: LiveServerMessage) => {
                  if (message.serverContent?.modelTurn?.parts) {
                    const hasAudio = message.serverContent.modelTurn.parts.some(p => !!p.inlineData?.data);
                    const hasText = message.serverContent.modelTurn.parts.some(p => !!p.text);
                    console.log(`\x1b[36m[Gemini Live API]\x1b[0m 📩 Server turn received | Audio: ${hasAudio} | Text: ${hasText}`);
                  }

                  const handleToolCall = async (id: string | undefined, name: string, args: any) => {
                    console.log("\x1b[33m[Gemini Live Tool Call]\x1b[0m ⚡ Executing:", name, JSON.stringify(args));
                    let responsePayload: any = { output: { status: "success", message: "Action executed successfully." } };

                    if (name === "get_prayer_times") {
                      const city = args?.city || "Karachi";
                      const country = args?.country || "Pakistan";
                      try {
                        const res = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=1&school=1`);
                        const data = await res.json();
                        if (data.code === 200 && data.data && data.data.timings) {
                          responsePayload = {
                            output: {
                              city,
                              country,
                              timings: data.data.timings
                            }
                          };
                        }
                      } catch (e: any) {
                        console.error("\x1b[31m[Prayer Times Error]\x1b[0m", e.message || e);
                        responsePayload = {
                          output: {
                            city,
                            country,
                            timings: {
                              Fajr: "04:45",
                              Dhuhr: "12:30",
                              Asr: "15:45",
                              Maghrib: "18:45",
                              Isha: "20:15"
                            }
                          }
                        };
                      }
                    } else if (name === "get_hadith") {
                      const rawBook = args?.book_name || "bukhari";
                      const hadithNum = args?.hadith_number || 1;
                      
                      // Normalize book name to Fawaz Ahmed API identifiers
                      let book = "bukhari";
                      const bookLower = rawBook.toLowerCase();
                      if (bookLower.includes("bukhari")) book = "bukhari";
                      else if (bookLower.includes("muslim")) book = "muslim";
                      else if (bookLower.includes("tirmidhi") || bookLower.includes("tirmizi")) book = "tirmidhi";
                      else if (bookLower.includes("abudawud") || bookLower.includes("abu dawud") || bookLower.includes("abu dawood")) book = "abudawud";
                      else if (bookLower.includes("nasai") || bookLower.includes("nasa'i") || bookLower.includes("nasaee")) book = "nasai";
                      else if (bookLower.includes("ibnmajah") || bookLower.includes("ibn majah") || bookLower.includes("ibne majah")) book = "ibnmajah";
                      
                      try {
                        const url = `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/urd-${book}/${hadithNum}.json`;
                        console.log(`[Hadith Tool] Fetching: ${url}`);
                        const res = await fetch(url);
                        if (!res.ok) {
                          throw new Error(`Failed to fetch Hadith from CDN (Status: ${res.status})`);
                        }
                        const data = await res.json();
                        if (data && data.hadiths && data.hadiths[0]) {
                          const nameVal = data.metadata?.name || `Sahih ${book.charAt(0).toUpperCase() + book.slice(1)}`;
                          const text = data.hadiths[0].text;
                          const verificationUrl = `https://sunnah.com/${book}:${hadithNum}`;
                          
                          responsePayload = {
                            output: {
                              status: "success",
                              book_name: nameVal,
                              hadith_number: hadithNum,
                              text: text,
                              reference: `${nameVal} (Hadith #${hadithNum})`,
                              verification_url: verificationUrl
                            }
                          };
                        } else {
                          responsePayload = {
                            output: {
                              status: "error",
                              message: `Hadith #${hadithNum} not found in ${book}.`
                            }
                          };
                        }
                      } catch (e: any) {
                        console.error("\x1b[31m[Hadith API Error]\x1b[0m", e.message || e);
                        responsePayload = {
                          output: {
                            status: "error",
                            message: `Could not fetch Hadith reference from CDN: ${e.message || e}`
                          }
                        };
                      }
                    }

                    sendToClient({
                      type: "tool_call",
                      name,
                      args,
                      response: responsePayload.output || responsePayload
                    });

                    const responseId = id || `call_${Date.now()}`;
                    if (liveSession) {
                      try {
                        liveSession.sendToolResponse({
                          functionResponses: [
                            {
                              id: responseId,
                              name,
                              response: responsePayload,
                            },
                          ],
                        });
                      } catch (err: any) {
                        console.error("\x1b[31m[Gemini Live Tool Response Error]\x1b[0m", err.message || err);
                      }
                    }
                  };

                  // 1. Process Tool Calls from Live Multimodal API
                  if (message.toolCall?.functionCalls) {
                    for (const fc of message.toolCall.functionCalls) {
                      const callId = fc.id || `${fc.name}-${JSON.stringify(fc.args)}`;
                      if (!processedToolCalls.has(callId)) {
                        processedToolCalls.add(callId);
                        await handleToolCall(fc.id, fc.name, fc.args);
                      }
                    }
                  }

                  // 2. Process model parts (Audio, text, inline function calls)
                  const outputParts = message.serverContent?.modelTurn?.parts || (message.serverContent as any)?.parts;
                  if (outputParts) {
                    for (const part of outputParts) {
                      if (part.inlineData?.data) {
                        console.log("\x1b[35m[Live Audio Stream]\x1b[0m 🔊 Sending 24kHz audio chunk to client (" + part.inlineData.data.length + " bytes)");
                        sendToClient({
                          type: "audio",
                          audio: part.inlineData.data,
                          sampleRate: 24000,
                        });
                      }
                      if (part.text && !part.text.startsWith("**Formulating") && !part.text.startsWith("**Refining") && !part.text.startsWith("**Drafting")) {
                        console.log("\x1b[32m[Live Text]\x1b[0m 💬 AI:", part.text);
                        sendToClient({
                          type: "assistant_text",
                          text: part.text,
                        });
                      }
                    }
                  }

                  // Live Transcription events if present
                  const serverContent = message.serverContent as any;
                  const asstTranscript =
                    serverContent?.outputTranscription?.text ||
                    serverContent?.outputAudioTranscription?.text ||
                    serverContent?.outputTranscription?.parts?.[0]?.text;
                  if (asstTranscript) {
                    console.log("\x1b[32m[Transcript Output]\x1b[0m 🗣️ AI Transcript:", asstTranscript);
                    sendToClient({
                      type: "assistant_text",
                      text: asstTranscript,
                    });
                  }

                  const userTranscript =
                    serverContent?.inputTranscription?.text ||
                    serverContent?.inputAudioTranscription?.text ||
                    serverContent?.inputTranscription?.parts?.[0]?.text;
                  if (userTranscript) {
                    console.log("\x1b[34m[Transcript Input]\x1b[0m 🎤 User Speech:", userTranscript);
                    sendToClient({
                      type: "user_text",
                      text: userTranscript,
                    });
                  }

                  // Interruption notice
                  if (message.serverContent?.interrupted) {
                    console.log("\x1b[33m[Gemini Live API]\x1b[0m ⚡ Interrupted by user voice");
                    sendToClient({
                      type: "interrupted",
                      interrupted: true,
                    });
                  }

                  // Turn completion
                  if (message.serverContent?.turnComplete) {
                    console.log("\x1b[36m[Gemini Live API]\x1b[0m ✨ Turn completed");
                    sendToClient({
                      type: "turn_complete",
                    });
                  }
                },
                onerror: (err: any) => {
                  console.error("\x1b[31m[Gemini Live API ERROR]\x1b[0m ❌", err?.message || JSON.stringify(err));
                  sendToClient({
                    type: "error",
                    error: `Gemini Live API Error (in server.ts): ${err?.message || JSON.stringify(err)}`,
                  });
                },
                onclose: (e: any) => {
                  console.warn("\x1b[33m[Gemini Live API CLOSED]\x1b[0m ⚠️ Code:", e?.code, "Reason:", e?.reason || "Normal close");
                  isLiveActive = false;
                  sendToClient({
                    type: "status",
                    status: "disconnected",
                    message: `Gemini Live closed. Code: ${e?.code || '1000'}, Reason: ${e?.reason || 'Normal close'}.`,
                  });
                },
              },
            });

            liveSession = await liveSessionPromise;
            isLiveActive = true;
            console.log(`\x1b[32m[Gemini Live API]\x1b[0m 🚀 Session active with voice '${voice}'`);
            sendToClient({
              type: "status",
              status: "connected",
              message: `Live session active with ${voice} voice!`,
            });
          } catch (initErr: any) {
            console.error("\x1b[31m[Gemini Live Startup ERROR]\x1b[0m ❌", initErr?.message || initErr);
            sendToClient({
              type: "error",
              error: initErr.message || "Failed to connect to Live API. Please check Gemini API Key.",
            });
          }
          return;
        }

        // 2. Audio input from microphone (PCM 16kHz)
        if (msg.type === "audio" || msg.audio) {
          const audioBase64 = msg.audio || msg.data;
          if (audioBase64) {
            serverAudioChunkCount++;
            if (serverAudioChunkCount === 1 || serverAudioChunkCount % 100 === 0) {
              console.log(`\x1b[35m[CMD MIC STREAM]\x1b[0m 🎙️ Streaming audio to Gemini Live (chunk #${serverAudioChunkCount})...`);
            }
            try {
              const activeSession = liveSession || (liveSessionPromise ? await liveSessionPromise : null);
              if (activeSession) {
                // Send audio chunk to Gemini Multimodal Live API
                try {
                  activeSession.sendRealtimeInput({
                    media: {
                      data: audioBase64,
                      mimeType: "audio/pcm;rate=16000",
                    },
                  });
                } catch (e1) {
                  if (typeof (activeSession as any).send === "function") {
                    (activeSession as any).send({
                      realtimeInput: {
                        mediaChunks: [
                          {
                            data: audioBase64,
                            mimeType: "audio/pcm;rate=16000",
                          },
                        ],
                      },
                    });
                  }
                }
              }
            } catch (sendErr) {
              console.error("\x1b[31m[CMD AUDIO ERROR]\x1b[0m", sendErr);
            }
          }
          return;
        }

        // 3. Text prompt input sent to live session
        if (msg.type === "text" && msg.text) {
          try {
            const activeSession = liveSession || (liveSessionPromise ? await liveSessionPromise : null);
            if (activeSession) {
              activeSession.sendClientContent({
                turns: [
                  {
                    role: "user",
                    parts: [{ text: msg.text }],
                  },
                ],
                turnComplete: true,
              });
            }
          } catch (txtErr) {
            console.error("Error sending text turn:", txtErr);
          }
          return;
        }

        // 4. Stop session request
        if (msg.type === "stop") {
          cleanupSession();
          sendToClient({
            type: "status",
            status: "disconnected",
            message: "Session ended by user.",
          });
          return;
        }
      } catch (err: any) {
        console.error("Error processing websocket message:", err);
        sendToClient({ type: "error", error: "Malformed message format" });
      }
    });

    clientWs.on("close", () => {
      console.log("WebSocket client disconnected");
      cleanupSession();
    });

    clientWs.on("error", (err) => {
      console.error("WebSocket client error:", err);
      cleanupSession();
    });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const startListening = (initialPort: number) => {
    const host = process.env.IP || "::";
    server.listen(initialPort, host as any, () => {
      console.log("\n\x1b[36m=======================================================");
      console.log("  🚀 AHMED AI GEMINI LIVE VOICE ASSISTANT SERVER READY!");
      console.log(`  🌐 Local Access: http://localhost:${initialPort}`);
      console.log(`  🔑 Gemini API Key: ${process.env.GEMINI_API_KEY ? "CONFIGURED OK ✅" : "MISSING ❌"}`);
      console.log("=======================================================\x1b[0m\n");
    });

    server.on("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        console.warn(`\x1b[33m[Port Warning]\x1b[0m Port ${initialPort} is in use. Trying port ${initialPort + 1}...`);
        setTimeout(() => {
          server.close();
          startListening(initialPort + 1);
        }, 1000);
      } else {
        console.error("Server listen error:", err);
      }
    });
  };

  const defaultPort = Number(process.env.PORT) || 3000;
  startListening(defaultPort);
}

startServer().catch((err) => {
  console.error("Fatal server startup error:", err);
});
