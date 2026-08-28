import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  VoiceOption,
  AssistantState,
  ChatMessage,
  AssistantPersona,
} from "./types";
import { GEMINI_VOICES } from "./data/voices";
import { ASSISTANT_PERSONAS } from "./data/personas";
import {
  SURAH_LIST,
  PARA_LIST,
  SurahInfo,
  getSurahByNumber,
  getSurahByName,
  RECITERS_LIST,
  ReciterInfo,
} from "./data/quran";
import { AudioQueuePlayer, AudioRecorder } from "./utils/audio";
import { JarvisHUD } from "./components/JarvisHUD";
import { VoiceSelector } from "./components/VoiceSelector";
import { QuranReader } from "./components/QuranReader";
import { TranscriptPanel } from "./components/TranscriptPanel";
import { ControlsBar } from "./components/ControlsBar";
import {
  Sparkles,
  Zap,
  Radio,
  HelpCircle,
  X,
  Volume2,
  AlertTriangle,
  Waves,
  ShieldCheck,
  Disc3,
  Moon,
  Sun,
  MessageSquare,
  Play,
  Square,
  UserCheck,
  Clock,
  Bell,
  Send,
} from "lucide-react";

export default function App() {
  const [theme, setTheme] = useState<"white" | "dark">(() => {
    return (localStorage.getItem("jarvis_theme") as "white" | "dark") || "white";
  });
  const [assistantState, setAssistantState] = useState<AssistantState>("idle");
  const [selectedVoice, setSelectedVoice] = useState<string>("Puck");
  const [selectedPersona, setSelectedPersona] = useState<AssistantPersona>(ASSISTANT_PERSONAS[0]);
  const [systemInstruction, setSystemInstruction] = useState<string>(
    "You are Ahmed AI, a respectful Islamic AI assistant speaking natural Pakistani Urdu, Roman Urdu, or English.\n" +
    "Your name is Ahmed AI. If asked about your name or who you are, you MUST reply: 'My name is Ahmed AI, and I was built by Muhammad Usman, who is a developer and AI/ML engineer.'\n" +
    "STRICT DOMAIN RESTRICTION (GUARDRAILS): You are strictly allowed to talk about Islam, Quran, Hadith, Prayer times, and related Islamic topics. If the user asks about ANY general knowledge, math, science, programming, history (non-Islamic), politics, news, or off-topic subjects, you MUST politely decline to answer, stating that you are an Islamic Voice Assistant and only handle Islamic queries.\n" +
    "STRICT LANGUAGE MANDATE: NEVER use Hindi terms like 'bhasha', 'vastavik', 'prarthna', 'sthan', 'jankari'. Always use proper Islamic and Urdu terms like 'Zaban', 'Namaz', 'Waqt', 'Muqam', 'Maloomat', 'Wa Alaikum As-Salam'.\n" +
    "CRITICAL MANDATES:\n" +
    "   - When greeted with 'Salam Alaikum', 'As-Salamu Alaykum', or 'Hello', warmly respond with 'Wa Alaikum As-Salam. How can I help you today?' or 'Hello! I am fine. How can I help you today?' depending on the greeting.\n" +
    "   - Always respond to greetings and conversational prompts (like 'how are you') naturally in spoken voice.\n" +
    "1. CRITICAL QURAN COMMANDS:\n" +
    "   - When user asks to PLAY or LISTEN to recitation (e.g. 'Play Surah Al-Mulk', 'Tilawat sunao', 'Chalao'):\n" +
    "     * If they explicitly mention a Qari (e.g. Mishary, Abdul Basit, Sudais, Ghamdi, Maher, Shatri, Islam Sobhi), execute `play_quran` tool immediately with `surah_number` and `qari_name`.\n" +
    "     * If they do NOT specify a Qari, you MUST ask them verbally: 'I am starting Surah [Name]. Which Qari's voice would you like to hear?' and wait for them to respond. Do NOT call `play_quran` yet. Once they name a Qari, execute `play_quran` with `surah_number` and `qari_name`.\n" +
    "     * If they ask to 'resume', 'continue', 'play it', or 'play again' after stopping/pausing, execute `play_quran` immediately with the same `surah_number` and `qari_name` to continue playback.\n" +
    "   - When user asks to OPEN, SHOW, or READ a Surah (e.g. 'Open Surah An-Nisa', 'Surah Nisa kholo', 'Open Surah'), EXECUTE `open_quran_page` TOOL ONLY. Reply briefly: 'Opening Surah.'.\n" +
    "2. When told to stop, pause, or shut up, execute `stop_audio` tool and reply 'Stopped.'.\n" +
    "3. When asked about prayer times, answer directly without tools.\n" +
    "4. When told to set a reminder or timer, execute `set_reminder`. Keep verbal reply brief.\n" +
    "5. When told to open the chatbox (e.g. 'open chatbox', 'chatbox kholo', 'show chat'), execute `open_chatbox` tool and reply briefly: 'Opening chatbox.'.\n" +
    "6. When told to close the chatbox (e.g. 'close chatbox', 'chatbox band kro', 'hide chat'), execute `close_chatbox` tool and reply briefly: 'Closing chatbox.'.\n" +
    "7. When asked for a specific Hadith reference (e.g. 'Bukhari Hadith 10', 'Muslim Hadith 25', 'play/get Hadith 5 in Bukhari'), you MUST execute `get_hadith` tool with book_name and hadith_number immediately."
  );
  
  const [isChatboxOpen, setIsChatboxOpen] = useState<boolean>(false);
  const [chatInputText, setChatInputText] = useState<string>("");
  const [enableInstantLocalIntents, setEnableInstantLocalIntents] = useState<boolean>(true);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [liveUserText, setLiveUserText] = useState<string>("");
  const [liveAssistantText, setLiveAssistantText] = useState<string>("");
  
  // Audio Visualizer data
  const [userVolume, setUserVolume] = useState<number>(0);
  const [assistantVolume, setAssistantVolume] = useState<number>(0);
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(64));
  
  // State for Video-like HUD Badges
  const [statusBadge, setStatusBadge] = useState<{
    text: string;
    type: "listening" | "salam" | "playing" | "stopped" | "info";
  } | null>(null);

  // Quran Audio State & Multiple Qaris
  const [activeSurah, setActiveSurah] = useState<SurahInfo | null>(getSurahByNumber(67) || null);
  const [selectedReciter, setSelectedReciter] = useState<ReciterInfo>(RECITERS_LIST[0]);
  const [isQuranPlaying, setIsQuranPlaying] = useState<boolean>(false);
  const [quranProgress, setQuranProgress] = useState<number>(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [ayahsList, setAyahsList] = useState<{ number: number; text: string; numberInSurah: number; englishText?: string }[]>([]);
  const [isLoadingAyahs, setIsLoadingAyahs] = useState<boolean>(false);
  const [readerPageNum, setReaderPageNum] = useState<number>(7);

  // Live Telemetry Logs
  const [telemetryLogs, setTelemetryLogs] = useState<{ id: string; timestamp: string; type: "system" | "user" | "ai" | "tool"; text: string }[]>([
    { id: "init", timestamp: new Date().toLocaleTimeString(), type: "system", text: "Ahmed AI Muslim AI System Initialized." }
  ]);

  const addTelemetryLog = useCallback((type: "system" | "user" | "ai" | "tool", text: string) => {
    setTelemetryLogs(prev => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date().toLocaleTimeString(),
        type,
        text
      }
    ].slice(-55));
  }, []);

  // Jarvis Synth Lab State Hooks
  const [synthPitch, setSynthPitch] = useState<number>(0);
  const [synthFormant, setSynthFormant] = useState<number>(50);
  const [synthVocoder, setSynthVocoder] = useState<number>(0);
  const [synthResonance, setSynthResonance] = useState<number>(30);
  const [synthSpeed, setSynthSpeed] = useState<number>(1.0);
  const [selectedCloneSlot, setSelectedCloneSlot] = useState<string>("tony");
  const [isCloneTraining, setIsCloneTraining] = useState<boolean>(true);
  const [isRecordingSample, setIsRecordingSample] = useState<boolean>(false);
  const [sampleDuration, setSampleDuration] = useState<number>(0);

  const [selectedCity, setSelectedCity] = useState<string>("Faisalabad");
  const [prayerTimes, setPrayerTimes] = useState<{ city: string; timings: Record<string, string>; timezone: string } | null>(null);
  const [activeReminder, setActiveReminder] = useState<{ label: string; seconds: number; remaining: number } | null>(null);

  const [leftPanelTab, setLeftPanelTab] = useState<"logs" | "prayers">("logs");

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1.0);
  const [statusMessage, setStatusMessage] = useState<string>("Ready - Click Start or Speak");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"hud" | "transcript" | "surahs" | "reader" | "synth">("hud");

  // Audio Engine References
  const wsRef = useRef<WebSocket | null>(null);
  const playerRef = useRef<AudioQueuePlayer | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const animIntervalRef = useRef<number | null>(null);
  const quranAudioRef = useRef<HTMLAudioElement | null>(null);
  const playingSurahNumRef = useRef<number | null>(null);
  const playingReciterIdRef = useRef<string | null>(null);
  const duckTimeoutRef = useRef<any>(null);
  const ayahContainerRef = useRef<HTMLDivElement | null>(null);
  const logsContainerRef = useRef<HTMLDivElement | null>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement | null>(null);
  const prayerTimesRef = useRef(prayerTimes);
  const selectedReciterRef = useRef(selectedReciter);

  // Auto-scroll Telemetry Logs container to bottom on new log
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [telemetryLogs]);

  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, liveUserText, liveAssistantText, isChatboxOpen]);

  useEffect(() => {
    prayerTimesRef.current = prayerTimes;
  }, [prayerTimes]);

  useEffect(() => {
    selectedReciterRef.current = selectedReciter;
  }, [selectedReciter]);

  // Auto clear status badge after duration
  const triggerStatusBadge = useCallback((text: string, type: "listening" | "salam" | "playing" | "stopped" | "info", duration = 4000) => {
    setStatusBadge({ text, type });
    setTimeout(() => {
      setStatusBadge(prev => (prev?.text === text ? null : prev));
    }, duration);
  }, []);

  // Helper to compute next prayer and remaining time based on city timezone
  const getNextPrayerInfo = useCallback((timings?: Record<string, string> | null, timezone?: string) => {
    if (!timings) return null;
    const now = new Date();
    
    // Convert now to city's local time (or default to Asia/Karachi for Faisalabad/Karachi fallback)
    let targetDate = now;
    const tz = timezone || "Asia/Karachi";
    try {
      const targetTimeStr = now.toLocaleString("en-US", { timeZone: tz });
      targetDate = new Date(targetTimeStr);
    } catch (e) {
      console.error("Timezone format conversion failed:", e);
    }

    const currentMinutes = targetDate.getHours() * 60 + targetDate.getMinutes();
    const prayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;

    for (const name of prayers) {
      const raw = timings[name];
      if (!raw) continue;
      const clean = raw.split(" ")[0];
      const [hStr, mStr] = clean.split(":");
      const pMinutes = parseInt(hStr, 10) * 60 + parseInt(mStr, 10);
      if (pMinutes > currentMinutes) {
        const diffMins = pMinutes - currentMinutes;
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return {
          nextPrayer: name,
          time: clean,
          diffMins,
          formattedDiff: hours > 0 ? `${hours} hr ${mins} min` : `${mins} min`,
          isTomorrow: false
        };
      }
    }

    // After Isha at night: next is Fajr tomorrow
    const fajrRaw = timings["Fajr"]?.split(" ")[0] || "04:10";
    const [fH, fM] = fajrRaw.split(":");
    const fajrMinutes = parseInt(fH, 10) * 60 + parseInt(fM, 10);
    const diffMins = (24 * 60 - currentMinutes) + fajrMinutes;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    return {
      nextPrayer: "Fajr",
      time: fajrRaw,
      diffMins,
      formattedDiff: `${hours} hr ${mins} min`,
      isTomorrow: true
    };
  }, []);

  // Auto-fetch Prayer Times API on load & when city changes (Using Method 1 = Karachi & School 1 = Hanafi)
  const fetchPrayerTimes = useCallback(async (city: string) => {
    try {
      const res = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=Pakistan&method=1&school=1`);
      const data = await res.json();
      if (data.code === 200 && data.data && data.data.timings) {
        const cleanTimings: Record<string, string> = {};
        for (const [k, v] of Object.entries(data.data.timings as Record<string, string>)) {
          cleanTimings[k] = (v as string).split(" ")[0];
        }
        setPrayerTimes({
          city: city,
          timings: cleanTimings,
          timezone: data.data.meta.timezone || "Asia/Karachi"
        });
        addTelemetryLog("system", `Loaded live Hanafi prayer times for ${city} (${data.data.meta.timezone || "Asia/Karachi"}).`);
      }
    } catch (e) {
      console.error("Failed to fetch prayer times:", e);
      setPrayerTimes({
        city: city,
        timings: {
          Fajr: "04:10",
          Dhuhr: "12:11",
          Asr: "16:48",
          Maghrib: "18:50",
          Isha: "20:12"
        },
        timezone: "Asia/Karachi"
      });
    }
  }, [addTelemetryLog]);

  useEffect(() => {
    fetchPrayerTimes(selectedCity);
  }, [selectedCity, fetchPrayerTimes]);

  // Countdown timer for active reminder/alarm
  useEffect(() => {
    if (!activeReminder) return;

    const timer = setInterval(() => {
      setActiveReminder((prev) => {
        if (!prev) return null;
        if (prev.remaining <= 1) {
          clearInterval(timer);
          // Play a beautiful, web-standard alarm sound
          const alarmSound = new Audio("https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg");
          alarmSound.volume = 0.8;
          alarmSound.play().catch((e) => console.log("Alarm sound blocked by browser:", e));
          
          triggerStatusBadge("ALARM RUNNING", "info", 5000);
          addTelemetryLog("system", `⏰ ALARM TRIGGERED: ${prev.label}`);
          return null;
        }
        return {
          ...prev,
          remaining: prev.remaining - 1
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeReminder, triggerStatusBadge, addTelemetryLog]);

  // Mute state helper
  const setMuteState = useCallback((forceMuted: boolean) => {
    setIsMuted(forceMuted);
    if (recorderRef.current) {
      recorderRef.current.setMuted(forceMuted);
    }
    setAssistantState(forceMuted ? "muted" : "listening");
  }, []);

  // Initialize Audio Player
  useEffect(() => {
    playerRef.current = new AudioQueuePlayer((isPlaying) => {
      if (isPlaying) {
        setAssistantState("speaking");
      } else {
        setAssistantState((prev) => (prev === "speaking" ? "listening" : prev));
      }
    });

    return () => {
      playerRef.current?.close();
    };
  }, []);

  // Update volume
  useEffect(() => {
    playerRef.current?.setVolume(volume);
    if (quranAudioRef.current) {
      quranAudioRef.current.volume = volume;
    }
  }, [volume]);

  // Visualizer tick loop & Intelligent Voice Ducking Gating
  useEffect(() => {
    const freqArray = new Uint8Array(64);

    const updateVolumes = () => {
      let uVol = 0;
      if (recorderRef.current) {
        uVol = recorderRef.current.getVolumeLevel();
        setUserVolume(uVol);
      }

      if (playerRef.current) {
        const aVol = playerRef.current.getVolumeLevel();
        setAssistantVolume(aVol);
        playerRef.current.getFrequencyData(freqArray);
        setFrequencyData(new Uint8Array(freqArray));
      }

      // State-triggered Audio Ducking to eliminate echo/loop feedback
      if (quranAudioRef.current && !quranAudioRef.current.paused) {
        const isLiveCallActive = assistantState !== "idle" && assistantState !== "error";
        const isAISpeaking = playerRef.current?.isPlaying || assistantState === "speaking";

        if (isLiveCallActive) {
          if (isAISpeaking) {
            // AI is talking: Duck the Quran volume to 15%
            quranAudioRef.current.volume = volume * 0.15;
          } else {
            // Live session active: Keep Quran at louder background level (60%)
            quranAudioRef.current.volume = volume * 0.60;
          }
        } else {
          // Live call is not active: Play Quran at full user-selected volume (100%)
          quranAudioRef.current.volume = volume;
        }
      }

      animIntervalRef.current = requestAnimationFrame(updateVolumes);
    };

    animIntervalRef.current = requestAnimationFrame(updateVolumes);

    return () => {
      if (animIntervalRef.current) {
        cancelAnimationFrame(animIntervalRef.current);
      }
      if (duckTimeoutRef.current) {
        clearTimeout(duckTimeoutRef.current);
      }
    };
  }, [volume, assistantState]);

  // Synthesize Real Sci-Fi Alarm Chime with Web Audio API
  const playAlarmChime = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playBeep = (freq: number, delay: number, dur: number) => {
        setTimeout(() => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
          gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + dur);
        }, delay);
      };

      // Play 5 sci-fi alarm chime tones
      playBeep(587.33, 0, 0.4);
      playBeep(880, 200, 0.4);
      playBeep(1174.66, 400, 0.6);
      playBeep(880, 800, 0.4);
      playBeep(1174.66, 1000, 0.8);
    } catch (e) {
      console.error("Audio Context alarm error:", e);
    }
  }, []);

  // Request Browser Notification Permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  const sendBrowserNotification = useCallback((title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico" });
    }
  }, []);

  // Active Reminder Timer Effect
  useEffect(() => {
    if (!activeReminder) return;

    if (activeReminder.remaining <= 0) {
      // Timer finished!
      // 1. Play Real Alarm Chime & Browser OS Notification
      playAlarmChime();
      sendBrowserNotification("JARVIS ALARM / REMINDER", activeReminder.label);

      // 2. Play Web Audio Beep / TTS Voice Notification
      try {
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(`${activeReminder.label}. Time.`);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        synth.speak(utterance);
      } catch (e) {
        console.error("Speech Synthesis failed:", e);
      }

      // 3. Trigger badge notification
      triggerStatusBadge("REMINDER FIRED", "info", 4000);
      addTelemetryLog("system", `Reminder Fired: ${activeReminder.label}`);

      // Clear state after 4 seconds
      const timeout = setTimeout(() => {
        setActiveReminder(null);
      }, 4000);
      return () => clearTimeout(timeout);
    }

    // Tick countdown every 1 second
    const interval = setInterval(() => {
      setActiveReminder((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          remaining: prev.remaining - 1,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeReminder, triggerStatusBadge, addTelemetryLog]);

  // Auto-scroll Ayahs list as recitation progresses
  useEffect(() => {
    if (ayahsList.length > 0 && ayahContainerRef.current) {
      const activeIdx = Math.min(ayahsList.length - 1, Math.floor((quranProgress / 100) * ayahsList.length));
      const element = document.getElementById(`ayah-${activeIdx}`);
      if (element) {
        const container = ayahContainerRef.current;
        const containerHeight = container.clientHeight;
        const elementTop = element.offsetTop;
        const elementHeight = element.clientHeight;
        
        container.scrollTo({
          top: elementTop - containerHeight / 2 + elementHeight / 2,
          behavior: "smooth",
        });
      }
    }
  }, [quranProgress, ayahsList]);

  // Helper to find Qari / Reciter by name
  const findReciterByName = useCallback((name: string): ReciterInfo | undefined => {
    const normalized = name.toLowerCase().trim();
    if (normalized.includes("basit")) {
      return RECITERS_LIST.find(r => r.id === "ar.abdulbasitmurattal");
    }
    if (normalized.includes("sudais") || normalized.includes("abdurrahmaan") || normalized.includes("abdur-rahman")) {
      return RECITERS_LIST.find(r => r.id === "ar.abdurrahmaansudais");
    }
    if (normalized.includes("alafasy") || normalized.includes("mishary") || normalized.includes("rashid")) {
      return RECITERS_LIST.find(r => r.id === "ar.alafasy");
    }
    if (normalized.includes("ghamdi") || normalized.includes("saad")) {
      return RECITERS_LIST.find(r => r.id === "ar.saadalghamdi");
    }
    if (normalized.includes("maher") || normalized.includes("muaiqly")) {
      return RECITERS_LIST.find(r => r.id === "ar.mahermuaiqly");
    }
    if (normalized.includes("shatri") || normalized.includes("shatre") || normalized.includes("abu bakr")) {
      return RECITERS_LIST.find(r => r.id === "ar.shaatree");
    }
    if (normalized.includes("sobhi") || normalized.includes("islam sobhi") || normalized.includes("islam")) {
      return RECITERS_LIST.find(r => r.id === "islam.sobhi");
    }
    return undefined;
  }, []);

  // Function to Play Quran Surah Audio
  const playSurahAudio = useCallback((surahNum: number, reciterObj?: ReciterInfo) => {
    const reciter = reciterObj || selectedReciterRef.current;
    
    // If it's paused and we want to play/resume the exact same Surah and Reciter, just resume it!
    if (
      playingSurahNumRef.current === surahNum &&
      playingReciterIdRef.current === reciter.id &&
      quranAudioRef.current &&
      quranAudioRef.current.paused
    ) {
      console.log(`Resuming Surah ${surahNum} by ${reciter.name}...`);
      setIsQuranPlaying(true);
      quranAudioRef.current.play().catch(err => {
        console.error("Error resuming audio:", err);
      });
      triggerStatusBadge(`QURAN RESUMED`, "playing", 4000);
      setStatusMessage(`Resumed Surah ${surahNum} - ${reciter.name}`);
      return;
    }

    // Guard against duplicate loop triggers (only if surah AND reciter are the same)
    if (
      playingSurahNumRef.current === surahNum && 
      playingReciterIdRef.current === reciter.id &&
      quranAudioRef.current && 
      !quranAudioRef.current.paused
    ) {
      console.log(`Surah ${surahNum} by ${reciter.name} is already playing. Skipping duplicate trigger.`);
      return;
    }

    playingSurahNumRef.current = surahNum;
    playingReciterIdRef.current = reciter.id;
    
    const surah = getSurahByNumber(surahNum) || SURAH_LIST[0];
    console.log(`▶ Starting Quran Recitation for Surah ${surah.number} (${surah.englishName}) by ${reciter.name}...`);
    setActiveSurah(surah);
    setIsQuranPlaying(true);
    triggerStatusBadge(`QURAN PLAYING (${surah.englishName})`, "playing", 6000);
    setStatusMessage(`Playing Surah ${surah.number} (${surah.englishName}) - ${reciter.name}`);
    addTelemetryLog("tool", `Triggered Play Surah ${surah.number} (${surah.englishName}) by ${reciter.name}`);

    // Fetch Ayahs (Arabic & English translation combined)
    setIsLoadingAyahs(true);
    setAyahsList([]);
    fetch(`https://api.alquran.cloud/v1/surah/${surah.number}/editions/quran-simple,en.sahih`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.code === 200 && resData.data) {
          const arabicAyahs = resData.data[0].ayahs;
          const englishAyahs = resData.data[1].ayahs;
          const combined = arabicAyahs.map((a: any, idx: number) => ({
            number: a.number,
            text: a.text,
            numberInSurah: a.numberInSurah,
            englishText: englishAyahs[idx]?.text || "",
          }));
          setAyahsList(combined);
          addTelemetryLog("system", `Loaded ${combined.length} verses for ${surah.englishName}`);
        }
        setIsLoadingAyahs(false);
      })
      .catch((err) => {
        console.error("Error fetching ayahs:", err);
        setIsLoadingAyahs(false);
        addTelemetryLog("system", `Failed to load verses: ${err.message}`);
      });

    if (quranAudioRef.current) {
      try {
        quranAudioRef.current.pause();
      } catch (e) {}
      quranAudioRef.current = null;
    }

    // Determine correct URL based on Reciter (using real high quality mp3quran.net sources)
    let primaryUrl = "";
    const paddedSurah = String(surah.number).padStart(3, "0");
    if (reciter.id === "islam.sobhi") {
      primaryUrl = `https://server14.mp3quran.net/islam/Rewayat-Hafs-A-n-Assem/${paddedSurah}.mp3`;
    } else if (reciter.id === "ar.alafasy") {
      primaryUrl = `https://server8.mp3quran.net/afs/${paddedSurah}.mp3`;
    } else if (reciter.id === "ar.abdulbasitmurattal") {
      primaryUrl = `https://server7.mp3quran.net/basit/${paddedSurah}.mp3`;
    } else if (reciter.id === "ar.abdurrahmaansudais") {
      primaryUrl = `https://server11.mp3quran.net/sds/${paddedSurah}.mp3`;
    } else if (reciter.id === "ar.saadalghamdi") {
      primaryUrl = `https://server7.mp3quran.net/s_gmd/${paddedSurah}.mp3`;
    } else if (reciter.id === "ar.mahermuaiqly") {
      primaryUrl = `https://server12.mp3quran.net/maher/${paddedSurah}.mp3`;
    } else if (reciter.id === "ar.shaatree") {
      primaryUrl = `https://server11.mp3quran.net/shatri/${paddedSurah}.mp3`;
    } else {
      primaryUrl = `https://cdn.islamic.network/quran/audio-surah/128/${reciter.id}/${surah.number}.mp3`;
    }

    const audio = new Audio(primaryUrl);
    audio.crossOrigin = "anonymous";
    audio.volume = volume;
    quranAudioRef.current = audio;

    audio.play().then(() => {
      setIsQuranPlaying(true);
      console.log(`Audio playing for Surah ${surah.number}`);
    }).catch((err) => {
      console.error("Audio playback error:", err);
      // Fallback to alternative CDN if primary mp3 server fails
      const fallbackUrl = `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${surah.number}.mp3`;
      audio.src = fallbackUrl;
      audio.play().then(() => setIsQuranPlaying(true)).catch(e => console.error("Fallback audio error:", e));
    });

    // Do NOT mute microphone so JARVIS can hear the user voice command "Stop"!

    audio.ontimeupdate = () => {
      if (audio.duration) {
        setAudioCurrentTime(audio.currentTime);
        setAudioDuration(audio.duration);
        setQuranProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.onended = () => {
      playingSurahNumRef.current = null;
      playingReciterIdRef.current = null;
      setIsQuranPlaying(false);
      setStatusMessage("Recitation finished. Listening...");
      triggerStatusBadge("JARVIS LISTENING", "listening", 3000);
      addTelemetryLog("system", `Recitation of ${surah.englishName} completed.`);
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn("Primary CDN failed, trying fallback...", err);
        addTelemetryLog("system", `Primary CDN failed, trying fallback...`);
        const fallbackId = reciter.id === "islam.sobhi" ? "ar.islamsobhi" : reciter.id;
        const fallbackUrl = `https://cdn.islamic.network/quran/audio-surah/128/${fallbackId}/${surah.number}.mp3`;
        const fallbackAudio = new Audio(fallbackUrl);
        fallbackAudio.crossOrigin = "anonymous";
        fallbackAudio.volume = volume;
        quranAudioRef.current = fallbackAudio;
        fallbackAudio.play().catch((e) => console.error("Fallback playback failed:", e));
      });
    }
  }, [selectedReciter, volume, triggerStatusBadge, addTelemetryLog]);

  // Function to Stop Quran Playback (Acts as a Pause so it can be resumed)
  const stopQuranAudio = useCallback(() => {
    console.log("⏹ Pausing Quran Recitation...");
    
    if (quranAudioRef.current) {
      try {
        quranAudioRef.current.pause();
      } catch (e) {}
    }

    // Pause all audio elements on DOM
    document.querySelectorAll("audio").forEach((a) => {
      try {
        a.pause();
      } catch (e) {}
    });

    playerRef.current?.interrupt();

    setIsQuranPlaying(false);
    triggerStatusBadge("QURAN PAUSED", "stopped", 3000);
    setStatusMessage("Audio paused. Ahmed AI is listening.");
    addTelemetryLog("tool", "Recitation paused");
  }, [triggerStatusBadge, addTelemetryLog]);

  // Seek & Skip Controls for Video-Style Scrubber Bar
  const handleSeek = useCallback((newTime: number) => {
    if (quranAudioRef.current) {
      quranAudioRef.current.currentTime = newTime;
      setAudioCurrentTime(newTime);
      if (quranAudioRef.current.duration) {
        setQuranProgress((newTime / quranAudioRef.current.duration) * 100);
      }
    }
  }, []);

  const handleSkip = useCallback((seconds: number) => {
    if (quranAudioRef.current) {
      const targetTime = Math.max(0, Math.min(quranAudioRef.current.duration || 0, quranAudioRef.current.currentTime + seconds));
      quranAudioRef.current.currentTime = targetTime;
      setAudioCurrentTime(targetTime);
      if (quranAudioRef.current.duration) {
        setQuranProgress((targetTime / quranAudioRef.current.duration) * 100);
      }
    }
  }, []);

  // Intelligent speech & text intent parser
  const detectAndTriggerQuranIntent = useCallback((text: string) => {
    if (!text) return;
    const t = text.toLowerCase();
    
    // Ignore if Hadith query to prevent double-play conflict
    if (t.includes("hadith") || t.includes("hadees") || t.includes("hdees")) {
      return;
    }
    
    // Stop Intent
    if (t.includes("stop") || t.includes("pause") || t.includes("roko") || t.includes("band karo") || t.includes("quiet")) {
      stopQuranAudio();
      return;
    }

    // Resume / Play Again Intent
    if (t.includes("resume") || t.includes("continue") || t.includes("dubara") || t.includes("play it") || t.includes("start it")) {
      if (playingSurahNumRef.current) {
        playSurahAudio(playingSurahNumRef.current);
        return;
      }
    }

    // Play Intent (ONLY plays audio, does NOT touch reader page or tab)
    if (t.includes("play") || t.includes("sunao") || t.includes("chalao") || t.includes("tilawat")) {
      let targetSurah = 67; // Default Al-Mulk
      if (t.includes("nisa") || t.includes("nesa") || t.includes("nisah")) {
        targetSurah = 4;
      } else if (t.includes("yaseen") || t.includes("yasin")) {
        targetSurah = 36;
      } else if (t.includes("rahman") || t.includes("rehman")) {
        targetSurah = 55;
      } else if (t.includes("fatihah") || t.includes("fateha")) {
        targetSurah = 1;
      } else if (t.includes("mulk")) {
        targetSurah = 67;
      }
      playSurahAudio(targetSurah);
      return;
    }

    // Open Intent (ONLY opens reader page visually, stops any audio)
    if (t.includes("open") || t.includes("kholo") || t.includes("dikhao") || t.includes("read") || t.includes("show")) {
      stopQuranAudio();
      let targetPage = 71; // Surah An-Nisa is Page 71
      if (t.includes("fatihah") || t.includes("fateha") || t.includes("baqarah")) {
        targetPage = 1;
      }
      setReaderPageNum(targetPage);
      setActiveTab("reader");
      triggerStatusBadge(`OPENING SURAH PAGE`, "info", 4000);
      addTelemetryLog("tool", `Voice command opened reader on Page ${targetPage}`);
      return;
    }

    // Reminder / Alarm Local Intent (e.g. "set reminder", "alarm lagao")
    if (t.includes("remind") || t.includes("alarm") || t.includes("alert") || t.includes("timer")) {
      let sec = 10; // Default 10 seconds for testing
      let lbl = "Prayer Alarm";
      
      const activePT = prayerTimesRef.current;
      if (activePT && activePT.timings) {
        const nextInfo = getNextPrayerInfo(activePT.timings);
        if (nextInfo) {
          lbl = `${nextInfo.nextPrayer} Prayer Alarm`;
          if (t.includes("10") || t.includes("ten")) {
            sec = Math.max(1, (nextInfo.diffMins - 10) * 60);
          } else {
            sec = nextInfo.diffMins * 60;
          }
        }
      }

      setActiveReminder({
        label: lbl,
        seconds: sec,
        remaining: sec
      });
      triggerStatusBadge("TIMER SET", "info", 3000);
      addTelemetryLog("system", `Set countdown timer for ${sec}s (${lbl}).`);
      return;
    }
  }, [stopQuranAudio, playSurahAudio, getNextPrayerInfo, triggerStatusBadge, addTelemetryLog]);

  // Toggle Quran Play/Pause
  const toggleQuranPlay = useCallback(() => {
    if (!quranAudioRef.current) {
      if (activeSurah) {
        playSurahAudio(activeSurah.number);
      }
      return;
    }

    if (isQuranPlaying) {
      quranAudioRef.current.pause();
      setIsQuranPlaying(false);
      triggerStatusBadge("STOPPED // PAUSED", "stopped", 2000);
    } else {
      quranAudioRef.current.play();
      setIsQuranPlaying(true);
      triggerStatusBadge(`QURAN PLAYING`, "playing", 2000);
    }
  }, [activeSurah, isQuranPlaying, playSurahAudio, triggerStatusBadge]);

  // Terminate Live Call
  const handleStopLiveCall = useCallback(() => {
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "stop" }));
      }
      wsRef.current.close();
      wsRef.current = null;
    }

    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }

    if (playerRef.current) {
      playerRef.current.interrupt();
    }

    stopQuranAudio();

    if (liveAssistantText) {
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          role: "assistant",
          text: liveAssistantText,
          timestamp: Date.now(),
        },
      ]);
      setLiveAssistantText("");
    }

    setAssistantState("idle");
    setStatusMessage("Live call ended");
    triggerStatusBadge("STANDBY", "info", 2000);
    addTelemetryLog("system", "Connection closed. Standby.");
  }, [liveAssistantText, stopQuranAudio, triggerStatusBadge, addTelemetryLog]);

  // Start Live Call
  const handleStartLiveCall = useCallback(async () => {
    setErrorMessage(null);
    setAssistantState("connecting");
    setStatusMessage("Initializing Ahmed AI Live System...");
    triggerStatusBadge("INITIALIZING", "info", 2000);
    addTelemetryLog("system", "Connecting WebSocket gateway...");

    try {
      await playerRef.current?.unlockAudio();

      const cloudApiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || (window as any).GEMINI_API_KEY;
      const isCloudEnv = window.location.hostname.includes("vercel.app") || window.location.hostname.includes("streamlit.app") || window.location.hostname.includes("hf.space");
      
      if (isCloudEnv && cloudApiKey) {
        addTelemetryLog("system", "🚀 Connecting directly to Gemini 2.0 Live Cloud...");
        const directWsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${cloudApiKey}`;
        const ws = new WebSocket(directWsUrl);
        wsRef.current = ws;

        ws.onopen = async () => {
          console.log("Direct Gemini Live WebSocket connected");
          await playerRef.current?.init();
          setStatusMessage("Ahmed AI Online (Gemini Live Cloud)");
          addTelemetryLog("system", "✅ Connected to Ahmed AI Voice Engine (Gemini Live Cloud).");

          const now = new Date();
          const activePrayerTimes = prayerTimesRef.current;
          let prayerContextStr = "";
          if (activePrayerTimes && activePrayerTimes.timings) {
            const nextInfo = getNextPrayerInfo(activePrayerTimes.timings, activePrayerTimes.timezone);
            prayerContextStr = `\n[TODAY'S PRE-LOADED PRAYER SCHEDULE FOR ${activePrayerTimes.city.toUpperCase()}]\n` +
              `Fajr: ${activePrayerTimes.timings.Fajr}\nDhuhr: ${activePrayerTimes.timings.Dhuhr}\nAsr: ${activePrayerTimes.timings.Asr}\nMaghrib: ${activePrayerTimes.timings.Maghrib}\nIsha: ${activePrayerTimes.timings.Isha}\n`;
          }

          const timeContext = `\n\n[SYSTEM CONTEXT]\nCurrent Date & Time: ${now.toLocaleString()}\n${prayerContextStr}\n`;

          ws.send(JSON.stringify({
            setup: {
              model: "models/gemini-2.5-flash-native-audio-latest",
              generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: selectedVoice || "Puck"
                    }
                  }
                }
              },
              systemInstruction: {
                parts: [{ text: systemInstruction + timeContext }]
              },
              tools: [
                {
                  functionDeclarations: [
                    {
                      name: "play_quran",
                      description: "Starts playing Quran surah recitation",
                      parameters: {
                        type: "OBJECT",
                        properties: {
                          surah_number: { type: "INTEGER", description: "Surah number from 1 to 114" },
                          qari_name: { type: "STRING", description: "Optional reciter name" }
                        },
                        required: ["surah_number"]
                      }
                    },
                    {
                      name: "get_hadith",
                      description: "Fetches authentic Hadith reference",
                      parameters: {
                        type: "OBJECT",
                        properties: {
                          book_name: { type: "STRING", description: "Book name like bukhari, muslim" },
                          hadith_number: { type: "INTEGER", description: "Hadith number" }
                        },
                        required: ["book_name", "hadith_number"]
                      }
                    }
                  ]
                }
              ]
            }
          }));

          try {
            const recorder = new AudioRecorder((base64Pcm16k) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  realtimeInput: {
                    mediaChunks: [{
                      mimeType: "audio/pcm;rate=16000",
                      data: base64Pcm16k
                    }]
                  }
                }));
              }
            });
            await recorder.start();
            recorderRef.current = recorder;
            setAssistantState("listening");
            setStatusMessage("Ahmed AI Active - Speak freely!");
            triggerStatusBadge("AHMED AI ONLINE", "listening", 4000);
            addTelemetryLog("system", "Microphone streaming active.");
          } catch (mErr: any) {
            setErrorMessage("Microphone access error: " + (mErr?.message || mErr));
            setAssistantState("error");
          }
        };

        ws.onmessage = async (evt) => {
          try {
            if (evt.data instanceof Blob) {
              const arrayBuf = await evt.data.arrayBuffer();
              addTelemetryLog("system", `🔊 Live Audio binary blob received (${arrayBuf.byteLength} bytes)`);
              playerRef.current?.playChunk(arrayBuf);
              setAssistantState("speaking");
              return;
            }
            if (evt.data instanceof ArrayBuffer) {
              addTelemetryLog("system", `🔊 Live Audio binary arraybuffer received (${evt.data.byteLength} bytes)`);
              playerRef.current?.playChunk(evt.data);
              setAssistantState("speaking");
              return;
            }

            let textData = evt.data;
            if (typeof textData !== "string") {
              textData = new TextDecoder().decode(evt.data);
            }
            const msg = JSON.parse(textData);
            
            if (msg.setupComplete) {
              addTelemetryLog("system", "⚙️ Setup complete. Gemini 2.5 Flash Live Engine active.");
            }

            const serverContent = msg.serverContent || msg.server_content;
            const modelTurn = serverContent?.modelTurn || serverContent?.model_turn;
            const parts = modelTurn?.parts;
            
            if (parts && Array.isArray(parts)) {
              for (const part of parts) {
                const inlineData = part.inlineData || part.inline_data;
                if (inlineData?.data) {
                  addTelemetryLog("system", `🔊 Live Audio chunk received (${inlineData.data.length} bytes)`);
                  playerRef.current?.playChunk(inlineData.data);
                  setAssistantState("speaking");
                }
                if (part.text) {
                  if (!part.text.startsWith("**") && !part.text.includes("Responding to")) {
                    setLiveAssistantText((prev) => (prev ? prev + " " + part.text : part.text));
                    addTelemetryLog("ai", part.text);
                  } else {
                    addTelemetryLog("system", `🧠 Model Thought: ${part.text.slice(0, 100)}...`);
                  }
                }
              }
            }

            const turnComplete = serverContent?.turnComplete || serverContent?.turn_complete;
            if (turnComplete) {
              addTelemetryLog("system", "✨ Turn complete.");
              setLiveAssistantText((currentLiveText) => {
                if (currentLiveText) {
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: `asst-${Date.now()}`,
                      role: "assistant",
                      text: currentLiveText,
                      timestamp: Date.now(),
                    },
                  ]);
                }
                return "";
              });
              if (assistantState !== "muted") {
                setAssistantState("listening");
              }
            }

            if (msg.toolCall?.functionCalls) {
              const functionResponses: any[] = [];
              for (const call of msg.toolCall.functionCalls) {
                addTelemetryLog("system", `⚡ Executing tool call: ${call.name}`);
                if (call.name === "play_quran") {
                  const surahNum = Number(call.args?.surah_number) || 67;
                  playSurahAudio(surahNum, selectedReciterRef.current);
                  triggerStatusBadge(`PLAYING SURAH ${surahNum}`, "info", 4000);
                }
                if (call.id) {
                  functionResponses.push({
                    response: { output: { status: "success" } },
                    id: call.id
                  });
                }
              }
              if (functionResponses.length > 0 && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ toolResponse: { functionResponses } }));
              }
            }
          } catch (pErr: any) {
            console.error("Direct WS parse error:", pErr);
            addTelemetryLog("system", `❌ WS Parse Error: ${pErr?.message || pErr}`);
          }
        };

        ws.onerror = (err: any) => {
          addTelemetryLog("system", `❌ WS Error: ${err?.message || "Connection error"}`);
        };

        ws.onclose = (evt: CloseEvent) => {
          addTelemetryLog("system", `⚠️ WS Closed: Code ${evt.code}, Reason: ${evt.reason || 'Normal close'}`);
        };

        return;
      }

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const defaultWsUrl = `${protocol}//${window.location.host}/live-ws`;
      const wsUrl = import.meta.env.VITE_WS_URL || defaultWsUrl;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        console.log("WebSocket connected to server");
        setStatusMessage("Connecting to Gemini Live...");
        addTelemetryLog("system", "WebSocket connected. Initiating Gemini Live session.");

        const now = new Date();
        const activePrayerTimes = prayerTimesRef.current;
        let prayerContextStr = "";
        if (activePrayerTimes && activePrayerTimes.timings) {
          const nextInfo = getNextPrayerInfo(activePrayerTimes.timings, activePrayerTimes.timezone);
          const nextStr = nextInfo 
            ? `Next Prayer: ${nextInfo.nextPrayer} at ${nextInfo.time} ${nextInfo.isTomorrow ? 'tomorrow' : 'today'} (in ${nextInfo.formattedDiff}, which is exactly ${nextInfo.diffMins} minutes from now).`
            : "No next prayer found.";

          prayerContextStr = `\n[TODAY'S PRE-LOADED PRAYER SCHEDULE FOR ${activePrayerTimes.city.toUpperCase()}]\n` +
            `Fajr: ${activePrayerTimes.timings.Fajr}\n` +
            `Dhuhr: ${activePrayerTimes.timings.Dhuhr}\n` +
            `Asr: ${activePrayerTimes.timings.Asr}\n` +
            `Maghrib: ${activePrayerTimes.timings.Maghrib}\n` +
            `Isha: ${activePrayerTimes.timings.Isha}\n` +
            `${nextStr}\n` +
            `DIRECTIVE ON PRAYER QUERIES:\n` +
            `- When asked in English or Urdu about prayer times or next prayer (e.g. 'What's the next prayer?', 'What's the next time from namaz?', 'Agli namaz kab hai?'), reply directly and clearly in natural English: 'The next prayer is ${nextInfo ? nextInfo.nextPrayer : 'Fajr'} at ${nextInfo ? nextInfo.time : '4:10 AM'} (in ${nextInfo ? nextInfo.formattedDiff : 'some time'}). Would you like me to set a reminder or alarm?'.\n` +
            `- When user says 'Set reminder before 10 minutes and set the alarm' or 'Set reminder 10 minutes before Fajr' or similar, you MUST immediately call the 'set_reminder' tool. Calculate seconds as (diffMins - 10) * 60. E.g. if diffMins is 297, you set seconds to 17220 (which is 287 * 60). Label must be '${nextInfo ? nextInfo.nextPrayer : 'Fajr'} Prayer Alarm'. Do not call any other tool.`;
        }

        const timeContext = `\n\n[SYSTEM CONTEXT]\nCurrent Date & Time: ${now.toLocaleString()}\nDay of week: ${now.toLocaleDateString('en-US', {weekday: 'long'})}\n${prayerContextStr}\n`;

        ws.send(
          JSON.stringify({
            type: "start",
            voice: selectedVoice,
            systemInstruction: systemInstruction + timeContext,
          })
        );

        try {
          let audioChunkCount = 0;
          const recorder = new AudioRecorder((base64Pcm16k) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "audio", audio: base64Pcm16k }));
              audioChunkCount++;
              if (audioChunkCount === 25) {
                addTelemetryLog("system", "🎙️ Voice audio streaming to Gemini Live (PCM 16kHz)...");
              } else if (audioChunkCount > 100 && audioChunkCount % 100 === 0) {
                console.log(`[Ahmed AI MIC stream] Sent ${audioChunkCount} audio chunks to server`);
              }
            }
          });

          await recorder.start();
          recorderRef.current = recorder;
          console.log("%c[Ahmed AI MIC] 🎙️ Microphone recording started (16kHz PCM stream)", "color: #10b981; font-weight: bold;");
          setAssistantState("listening");
          setStatusMessage("Ahmed AI Active - Speak freely!");
          triggerStatusBadge("AHMED AI LISTENING", "listening", 4000);
          addTelemetryLog("system", "Microphone stream active. Listening...");
        } catch (micErr: any) {
          console.error("%c[Ahmed AI MIC ERROR] ❌ Microphone access error:", "color: #ef4444; font-weight: bold;", micErr);
          setErrorMessage("Please allow microphone permissions to speak with Ahmed AI: " + (micErr?.message || micErr));
          setAssistantState("error");
          addTelemetryLog("system", "Microphone access denied: " + (micErr?.message || ""));
          handleStopLiveCall();
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "status") {
            if (data.status === "connected") {
              setAssistantState("listening");
              setStatusMessage("Ahmed AI Online. Speak naturally.");
              triggerStatusBadge("AHMED AI LISTENING", "listening", 3000);
              addTelemetryLog("system", "Gemini Live Session connected successfully.");
            } else if (data.status === "disconnected") {
              setAssistantState("idle");
              setStatusMessage(data.message || "Disconnected");
              addTelemetryLog("system", `⚠️ Session disconnected: ${data.message}`);
            }
          } else if (data.type === "error") {
            addTelemetryLog("system", `❌ LIVE API ERROR: ${data.error}`);
            setErrorMessage(`Live Error: ${data.error}`);
            setAssistantState("error");
          } else if (data.type === "audio") {
            if (data.audio) {
              addTelemetryLog("system", `🔊 Audio chunk received: ${Math.round(data.audio.length / 1024)}KB`);
              playerRef.current?.playChunk(data.audio);
              setAssistantState("speaking");
            }
          } else if (data.type === "assistant_text") {
            const txt = data.text;
            setLiveAssistantText((prev) => (prev ? prev + " " + txt : txt));
            addTelemetryLog("ai", txt);

            const txtLower = txt.toLowerCase();
            if (
              txtLower.includes("stop") ||
              txtLower.includes("halt") ||
              txtLower.includes("cease") ||
              txtLower.includes("pause") ||
              txtLower.includes("roko") ||
              txtLower.includes("band")
            ) {
              stopQuranAudio();
            }

            if (txtLower.includes("salam") || txtLower.includes("alaykum")) {
              triggerStatusBadge("SALAM RETURNED", "salam", 5000);
            }
          } else if (data.type === "user_text") {
            const uTxt = data.text;
            setLiveUserText((prev) => (prev ? prev + " " + uTxt : uTxt));
            addTelemetryLog("user", uTxt);
            if (uTxt.toLowerCase().includes("salam")) {
              triggerStatusBadge("SALAM RECEIVED", "salam", 3000);
            }
            if (enableInstantLocalIntents) {
              detectAndTriggerQuranIntent(uTxt);
            }
          } else if (data.type === "turn_complete") {
            setLiveAssistantText((currentLiveText) => {
              if (currentLiveText) {
                setMessages((prev) => [
                  ...prev,
                  {
                    id: `asst-${Date.now()}`,
                    role: "assistant",
                    text: currentLiveText,
                    timestamp: Date.now(),
                  },
                ]);
              }
              return "";
            });
            setLiveUserText((currentUserText) => {
              if (currentUserText) {
                setMessages((prev) => [
                  ...prev,
                  {
                    id: `user-${Date.now()}`,
                    role: "user",
                    text: currentUserText,
                    timestamp: Date.now(),
                  },
                ]);
              }
              return "";
            });
            if (assistantState !== "muted") {
              setAssistantState("listening");
            }
          } else if (data.type === "interrupted") {
            playerRef.current?.interrupt();
            stopQuranAudio();
            addTelemetryLog("system", "Assistant speaking interrupted by user voice.");
            if (assistantState !== "muted") {
              setAssistantState("listening");
            }
          } else if (data.type === "tool_call") {
            addTelemetryLog("tool", `Gemini tool call: ${data.name} with args ${JSON.stringify(data.args)}`);
            if (data.name === "play_quran") {
              let surahNum = Number(data.args?.surah_number) || 67;
              if (!surahNum && data.args?.surah_name) {
                const found = getSurahByName(data.args.surah_name);
                if (found) surahNum = found.number;
              }
              let targetReciter = selectedReciterRef.current;
              if (data.args?.qari_name) {
                const foundReciter = findReciterByName(data.args.qari_name);
                if (foundReciter) {
                  targetReciter = foundReciter;
                  setSelectedReciter(foundReciter);
                }
              }
              playSurahAudio(surahNum, targetReciter);
              triggerStatusBadge(`PLAYING SURAH ${surahNum}`, "info", 4000);
              addTelemetryLog("tool", `Ahmed AI playing Surah ${surahNum} audio by ${targetReciter.name}`);
            } else if (data.name === "stop_audio") {
              stopQuranAudio();
              playerRef.current?.interrupt();
            } else if (data.name === "get_prayer_times") {
              const res = data.response;
              if (res && res.timings) {
                setPrayerTimes({
                  city: res.city,
                  timings: res.timings
                });
                setLeftPanelTab("prayers");
                triggerStatusBadge("PRAYER TIMES LIVE", "info", 5000);
                addTelemetryLog("system", `Retrieved prayer times for ${res.city}.`);
              }
            } else if (data.name === "set_reminder") {
              const sec = Number(data.args?.seconds) || 5;
              const lbl = data.args?.label || "Reminder";
              setActiveReminder({
                label: lbl,
                seconds: sec,
                remaining: sec
              });
              triggerStatusBadge("TIMER SET", "info", 3000);
              addTelemetryLog("system", `Set countdown timer for ${sec}s (${lbl}).`);
            } else if (data.name === "open_quran_page") {
              // Open Surah An-Nisa Only (Page 71) without audio
              stopQuranAudio();
              setReaderPageNum(71);
              setActiveTab("reader");
              triggerStatusBadge("OPENING SURAH AN-NISA", "info", 4000);
              addTelemetryLog("tool", "Ahmed AI opened Surah An-Nisa on Page 71");
            } else if (data.name === "open_chatbox") {
              setIsChatboxOpen(true);
              triggerStatusBadge("CHATBOX OPENED", "info", 3000);
              addTelemetryLog("tool", "Ahmed AI opened interactive Chatbox");
            } else if (data.name === "close_chatbox") {
              setIsChatboxOpen(false);
              triggerStatusBadge("CHATBOX CLOSED", "info", 3000);
              addTelemetryLog("tool", "Ahmed AI closed interactive Chatbox");
            } else if (data.name === "get_hadith") {
              const res = data.response;
              if (res && res.status === "success") {
                setIsChatboxOpen(true);
                setMessages((prev) => [
                  ...prev,
                  {
                    id: `hadith-${Date.now()}`,
                    role: "assistant",
                    text: `Bismillahi-r-Rahmani-r-Rahim. Here is the requested Hadith:`,
                    timestamp: Date.now(),
                    hadith: {
                      book_name: res.book_name,
                      hadith_number: Number(res.hadith_number),
                      text: res.text,
                      reference: res.reference,
                      verification_url: res.verification_url
                    }
                  }
                ]);
                triggerStatusBadge("HADITH RETRIEVED", "info", 4000);
                addTelemetryLog("tool", `Retrieved Hadith: ${res.reference}`);
              } else {
                triggerStatusBadge("HADITH NOT FOUND", "error", 4000);
                addTelemetryLog("system", `Hadith search failed: ${res?.message || "Not found"}`);
              }
            }
          } else if (data.type === "error") {
            console.error("%c[JARVIS LIVE ERROR] ❌ " + (data.error || "Unknown Error"), "color: #ef4444; font-weight: bold; font-size: 14px;", data);
            setErrorMessage(data.error);
            setAssistantState("error");
            addTelemetryLog("system", `Live API Error: ${data.error}`);
          }
        } catch (err: any) {
          console.error("%c[JARVIS WS PARSE ERROR] ❌", "color: #ef4444; font-weight: bold;", err);
        }
      };

      ws.onerror = (err) => {
        console.warn("%c[JARVIS WS CONNECTION NOTICE] ℹ️ Local WebSocket server not detected (or running on Vercel Serverless). Switching to Direct Gemini Cloud Mode...", "color: #3b82f6; font-weight: bold;", err);
        addTelemetryLog("system", "ℹ️ Local WebSocket server unavailable. Activating Direct Gemini 2.5 Cloud connection...");
        
        // Fallback: Direct Client-to-Gemini Connection for 100% Standalone Vercel Deployment
        const cloudApiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || (window as any).GEMINI_API_KEY;
        if (!cloudApiKey) {
          setErrorMessage("Vercel Permanent Mode: Please set VITE_GEMINI_API_KEY in Vercel Environment Variables to activate 24/7 direct cloud mode!");
          setAssistantState("error");
          return;
        }

        try {
          const directWsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${cloudApiKey}`;
          const directWs = new WebSocket(directWsUrl);
          wsRef.current = directWs;

          directWs.onopen = async () => {
            console.log("%c[DIRECT GEMINI LIVE] 🚀 Direct Cloud WebSocket connected to Google Gemini!", "color: #10b981; font-weight: bold;");
            setStatusMessage("Gemini Live Active (Direct Cloud Mode)");
            addTelemetryLog("system", "Direct Gemini Cloud session initiated.");

            const now = new Date();
            const activePrayerTimes = prayerTimesRef.current;
            let prayerContextStr = "";
            if (activePrayerTimes && activePrayerTimes.timings) {
              const nextInfo = getNextPrayerInfo(activePrayerTimes.timings, activePrayerTimes.timezone);
              prayerContextStr = `\n[PRE-LOADED PRAYER SCHEDULE FOR ${activePrayerTimes.city.toUpperCase()}]\n` +
                `Fajr: ${activePrayerTimes.timings.Fajr}\nDhuhr: ${activePrayerTimes.timings.Dhuhr}\nAsr: ${activePrayerTimes.timings.Asr}\nMaghrib: ${activePrayerTimes.timings.Maghrib}\nIsha: ${activePrayerTimes.timings.Isha}\n`;
            }

            const timeContext = `\n\n[SYSTEM CONTEXT]\nCurrent Date & Time: ${now.toLocaleString()}\n${prayerContextStr}\n`;

            directWs.send(JSON.stringify({
              setup: {
                model: "models/gemini-2.5-flash-native-audio-latest",
                generationConfig: {
                  responseModalities: ["AUDIO"],
                  speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: {
                        voiceName: selectedVoice || "Puck"
                      }
                    }
                  }
                },
                systemInstruction: {
                  parts: [{ text: systemInstruction + timeContext }]
                },
                tools: [
                  {
                    functionDeclarations: [
                      {
                        name: "play_quran",
                        description: "Starts playing Quran surah recitation",
                        parameters: {
                          type: "OBJECT",
                          properties: {
                            surah_number: { type: "INTEGER", description: "Surah number from 1 to 114" },
                            qari_name: { type: "STRING", description: "Optional reciter name" }
                          },
                          required: ["surah_number"]
                        }
                      },
                      {
                        name: "get_hadith",
                        description: "Fetches authentic Hadith with Sunnah.com reference",
                        parameters: {
                          type: "OBJECT",
                          properties: {
                            book_name: { type: "STRING", description: "Book name like bukhari, muslim, tirmidhi" },
                            hadith_number: { type: "INTEGER", description: "Hadith number" }
                          },
                          required: ["book_name", "hadith_number"]
                        }
                      }
                    ]
                  }
                ]
              }
            }));

            try {
              const recorder = new AudioRecorder((base64Pcm16k) => {
                if (directWs.readyState === WebSocket.OPEN) {
                  directWs.send(JSON.stringify({
                    realtimeInput: {
                      mediaChunks: [{
                        mimeType: "audio/pcm;rate=16000",
                        data: base64Pcm16k
                      }]
                    }
                  }));
                }
              });
              await recorder.start();
              recorderRef.current = recorder;
              setAssistantState("listening");
              setStatusMessage("Ahmed AI Active (Direct Cloud) - Speak freely!");
              triggerStatusBadge("AHMED AI ONLINE (DIRECT)", "listening", 4000);
              addTelemetryLog("system", "Microphone streaming directly to Gemini Cloud.");
            } catch (mErr: any) {
              setErrorMessage("Microphone access error: " + (mErr?.message || mErr));
              setAssistantState("error");
            }
          };

          directWs.onmessage = async (evt) => {
            try {
              const msg = JSON.parse(evt.data);
              const serverContent = msg.serverContent || msg.server_content;
              const modelTurn = serverContent?.modelTurn || serverContent?.model_turn;
              const parts = modelTurn?.parts;
              
              if (parts && Array.isArray(parts)) {
                for (const part of parts) {
                  const inlineData = part.inlineData || part.inline_data;
                  if (inlineData?.data) {
                    playerRef.current?.playChunk(inlineData.data);
                    setAssistantState("speaking");
                    addTelemetryLog("system", `🔊 Live Audio Stream: Playing ${inlineData.data.length} bytes PCM`);
                  }
                  if (part.text) {
                    setLiveAssistantText((prev) => (prev ? prev + " " + part.text : part.text));
                    addTelemetryLog("ai", part.text);
                    const txtLower = part.text.toLowerCase();
                    if (txtLower.includes("stop") || txtLower.includes("pause") || txtLower.includes("roko")) {
                      stopQuranAudio();
                    }
                    // Speech fallback if browser audio context is waiting for click
                    if (!inlineData?.data && 'speechSynthesis' in window) {
                      const utter = new SpeechSynthesisUtterance(part.text);
                      window.speechSynthesis.speak(utter);
                    }
                  }
                }
              }

              const turnComplete = serverContent?.turnComplete || serverContent?.turn_complete;
              if (turnComplete) {
                setLiveAssistantText((currentLiveText) => {
                  if (currentLiveText) {
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: `asst-${Date.now()}`,
                        role: "assistant",
                        text: currentLiveText,
                        timestamp: Date.now(),
                      },
                    ]);
                  }
                  return "";
                });
                if (assistantState !== "muted") {
                  setAssistantState("listening");
                }
              }

              const interrupted = serverContent?.interrupted;
              if (interrupted) {
                playerRef.current?.interrupt();
                stopQuranAudio();
                if (assistantState !== "muted") {
                  setAssistantState("listening");
                }
              }

              // Handle Direct Cloud Tool Calls
              if (msg.toolCall?.functionCalls) {
                const functionResponses: any[] = [];
                for (const call of msg.toolCall.functionCalls) {
                  addTelemetryLog("tool", `Gemini Direct Cloud Tool Call: ${call.name}`);
                  if (call.name === "play_quran") {
                    const surahNum = Number(call.args?.surah_number) || 67;
                    playSurahAudio(surahNum, selectedReciterRef.current);
                    triggerStatusBadge(`PLAYING SURAH ${surahNum}`, "info", 4000);
                  } else if (call.name === "get_hadith") {
                    const bookName = String(call.args?.book_name || "bukhari").toLowerCase();
                    const hadithNum = Number(call.args?.hadith_number) || 1;
                    try {
                      const editionsMap: Record<string, string> = {
                        bukhari: "urdu-lahore",
                        muslim: "urdu-abdulbaqi",
                        tirmidhi: "urdu-tirmidhi",
                        abudawud: "urdu-abudawud",
                        nasai: "urdu-nasai",
                        ibnmajah: "urdu-ibnmajah"
                      };
                      const edition = editionsMap[bookName] || "urdu-lahore";
                      const hadithRes = await fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${edition}/hadiths/${hadithNum}.json`);
                      const hadithData = await hadithRes.json();
                      const hadithText = hadithData.hadiths?.[0]?.text || "Hadith text found.";
                      setIsChatboxOpen(true);
                      setMessages((prev) => [
                        ...prev,
                        {
                          id: `hadith-${Date.now()}`,
                          role: "assistant",
                          text: `Bismillahi-r-Rahmani-r-Rahim. Here is the requested Hadith:`,
                          timestamp: Date.now(),
                          hadith: {
                            book_name: bookName.toUpperCase(),
                            hadith_number: hadithNum,
                            text: hadithText,
                            reference: `${bookName.toUpperCase()} #${hadithNum}`,
                            verification_url: `https://sunnah.com/${bookName}:${hadithNum}`
                          }
                        }
                      ]);
                      triggerStatusBadge("HADITH RETRIEVED", "info", 4000);
                    } catch (hErr) {
                      console.error("Direct Hadith fetch error:", hErr);
                    }
                  }

                  if (call.id) {
                    functionResponses.push({
                      response: { output: { status: "success" } },
                      id: call.id
                    });
                  }
                }

                // Send toolResponse back to Gemini Cloud so AI finishes turn and speaks back
                if (functionResponses.length > 0 && directWs.readyState === WebSocket.OPEN) {
                  directWs.send(JSON.stringify({
                    toolResponse: {
                      functionResponses: functionResponses
                    }
                  }));
                }
              }
            } catch (parseErr) {
              console.error("Direct WS message parse error:", parseErr);
            }
          };

          directWs.onerror = (dErr) => {
            console.error("Direct Gemini Cloud WS error:", dErr);
            setErrorMessage("Direct Gemini Cloud connection error. Please verify VITE_GEMINI_API_KEY.");
            setAssistantState("error");
          };

          directWs.onclose = () => {
            setAssistantState("idle");
          };

        } catch (dEx: any) {
          console.error("Direct connection exception:", dEx);
          setErrorMessage("Failed to initiate Direct Gemini Cloud connection.");
          setAssistantState("error");
        }
      };

      ws.onclose = (event) => {
        console.warn("%c[JARVIS WS CLOSED] ⚠️ Code: " + event.code + ", Reason: " + (event.reason || "Normal"), "color: #f59e0b; font-weight: bold;");
        if (assistantState !== "idle") {
          setAssistantState("idle");
        }
        addTelemetryLog("system", `⚠️ WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason || 'Normal close'}`);
      };
    } catch (err: any) {
      console.error("%c[JARVIS STARTUP EXCEPTION] ❌", "color: #ef4444; font-weight: bold; font-size: 14px;", err);
      setErrorMessage(err.message || "Failed to start Live call");
      setAssistantState("idle");
      addTelemetryLog("system", `❌ Startup Exception: ${err.message || err}`);
    }
  }, [assistantState, detectAndTriggerQuranIntent, handleStopLiveCall, playSurahAudio, selectedVoice, stopQuranAudio, systemInstruction, triggerStatusBadge]);

  // Toggle Live Call
  const handleToggleLiveCall = () => {
    if (assistantState === "idle" || assistantState === "error") {
      handleStartLiveCall();
    } else {
      handleStopLiveCall();
    }
  };

  // Toggle Mute
  const handleToggleMute = () => {
    setMuteState(!isMuted);
  };

  // Interrupt
  const handleInterrupt = () => {
    playerRef.current?.interrupt();
    stopQuranAudio();
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "interrupt" }));
    }
    setAssistantState("listening");
  };

  // Send Text Prompt
  const handleSendTextPrompt = async (text: string) => {
    if (!text.trim()) return;

    detectAndTriggerQuranIntent(text);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "text", text }));
      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          role: "user",
          text: text,
          timestamp: Date.now(),
        },
      ]);
      return;
    }

    await handleStartLiveCall();
    setTimeout(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "text", text }));
      }
    }, 1500);
  };

  const isLight = theme === "white";

  return (
    <div className={`min-h-screen flex flex-col font-mono transition-colors duration-300 ${
      isLight
        ? "bg-slate-50 text-slate-900 selection:bg-cyan-500/20 selection:text-cyan-900"
        : "bg-black text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200"
    }`}>
      
      {/* Top Navigation */}
      <header className={`w-full px-6 py-3 sticky top-0 z-50 flex items-center justify-between backdrop-blur-md transition-colors duration-300 border-b ${
        isLight
          ? "bg-white/90 border-slate-200 shadow-sm"
          : "bg-zinc-950/80 border-cyan-500/20"
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)] animate-pulse" />
          <span className={`font-bold tracking-widest text-sm ${isLight ? "text-slate-900" : "text-cyan-300"}`}>AHMED AI // ISLAMIC AI</span>
          <span className={`${isLight ? "text-slate-300" : "text-zinc-600"} hidden sm:inline`}>|</span>
          <span className={`text-xs uppercase hidden sm:inline ${isLight ? "text-slate-500" : "text-zinc-400"}`}>QURAN LIVE VOICE SYSTEM</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={() => {
              const next = theme === "white" ? "dark" : "white";
              setTheme(next);
              localStorage.setItem("jarvis_theme", next);
              addTelemetryLog("system", `Switched theme to ${next === "white" ? "Pure White" : "Cyber Dark"}`);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
              isLight
                ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 shadow-xs"
                : "bg-zinc-900 hover:bg-zinc-800 text-cyan-300 border-cyan-500/30"
            }`}
            title="Switch between Light White and Dark Blue"
          >
            {isLight ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px]">White Theme</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px]">Dark Blue</span>
              </>
            )}
          </button>

          <div className={`flex items-center gap-2 rounded-lg px-2.5 py-1 text-xs border ${
            isLight ? "bg-slate-100 border-slate-300" : "bg-zinc-900 border-cyan-500/30"
          }`}>
            <span className={`uppercase tracking-widest text-[9px] hidden sm:inline ${isLight ? "text-slate-500" : "text-zinc-500"}`}>AI VOICE:</span>
            <select
              value={selectedVoice}
              onChange={(e) => {
                const newVoice = e.target.value;
                setSelectedVoice(newVoice);
                addTelemetryLog("system", `Changed AI voice to ${newVoice}`);
                
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                  wsRef.current.send(
                    JSON.stringify({
                      type: "start",
                      voice: newVoice,
                      systemInstruction: systemInstruction,
                    })
                  );
                }
              }}
              className={`bg-transparent font-bold focus:outline-none cursor-pointer pr-1 ${isLight ? "text-cyan-700" : "text-cyan-300"}`}
            >
              {GEMINI_VOICES.map((v) => (
                <option key={v.id} value={v.id} className={isLight ? "bg-white text-slate-800" : "bg-zinc-950 text-slate-100"}>
                  {v.name} ({v.gender.split(" / ")[0]})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowInfoModal(true)}
            className={`p-1.5 rounded-lg border transition ${
              isLight ? "border-slate-300 text-slate-600 hover:bg-slate-100" : "border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/50"
            }`}
            title="Assistant Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Error Notice */}
      {errorMessage && (
        <div className="bg-rose-950/80 border-b border-rose-500/50 px-4 py-2 text-xs text-rose-200 flex items-center justify-between">
          <div className="max-w-4xl mx-auto flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="ml-4 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Screen Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6 justify-center">
        
        {/* Tab Navigation */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {[
            { id: "hud", label: "AHMED AI CONSOLE" },
            { id: "surahs", label: `QURAN SURAHS (${SURAH_LIST.length})` },
            { id: "reader", label: "16-LINE QURAN" },
            { id: "synth", label: "AHMED AI SYNTH LAB" },
            { id: "transcript", label: `TRANSCRIPT (${messages.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-wider transition border ${
                activeTab === tab.id
                  ? isLight
                    ? "bg-cyan-600 text-white border-cyan-600 shadow-sm"
                    : "bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                  : isLight
                    ? "bg-white text-slate-600 hover:text-slate-900 border-slate-200 shadow-xs"
                    : "bg-zinc-900 text-zinc-400 hover:text-white border-zinc-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: JARVIS Console Screen */}
        {activeTab === "hud" && (
          <div className="flex flex-col items-center gap-6 w-full">
            
            {/* 3-Panel Sci-Fi HUD Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full items-stretch">
              
              {/* Left Panel: Telemetry Console & Prayer Times */}
              <div className={`lg:col-span-3 rounded-2xl p-4 flex flex-col gap-3 h-[320px] overflow-hidden text-left relative transition-colors duration-300 border ${
                isLight
                  ? "bg-white border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
                  : "bg-black border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.03)]"
              }`}>
                
                {/* Panel Tabs */}
                <div className={`flex items-center gap-2 border-b pb-2 ${isLight ? "border-slate-200" : "border-cyan-500/20"}`}>
                  <button 
                    onClick={() => setLeftPanelTab("logs")}
                    className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded transition ${
                      leftPanelTab === "logs" 
                        ? (isLight ? "bg-cyan-50 text-cyan-800 font-extrabold" : "bg-cyan-950 text-cyan-300")
                        : (isLight ? "text-slate-400 hover:text-slate-700" : "text-zinc-500 hover:text-cyan-400")
                    }`}
                  >
                    Logs
                  </button>
                  <button 
                    onClick={() => setLeftPanelTab("prayers")}
                    className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded transition flex items-center gap-1 ${
                      leftPanelTab === "prayers" 
                        ? (isLight ? "bg-cyan-50 text-cyan-800 font-extrabold" : "bg-cyan-950 text-cyan-300")
                        : (isLight ? "text-slate-400 hover:text-slate-700" : "text-zinc-500 hover:text-cyan-400")
                    }`}
                  >
                    Prayers {prayerTimes && <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />}
                  </button>
                </div>

                {leftPanelTab === "logs" ? (
                  <div ref={logsContainerRef} className={`flex-1 overflow-y-auto pr-1 space-y-2 text-[10px] font-mono leading-normal scrollbar-thin ${
                    isLight ? "text-slate-700 scrollbar-thumb-slate-300" : "text-cyan-300/80 scrollbar-thumb-cyan-500/30"
                  }`}>
                    {telemetryLogs.map((log) => (
                      <div key={log.id} className={`border-l pl-2 ${isLight ? "border-slate-200" : "border-cyan-500/20"}`}>
                        <span className={isLight ? "text-slate-400" : "text-zinc-500"}>[{log.timestamp}]</span>{" "}
                        <span className={`font-bold uppercase ${
                          log.type === "system" ? (isLight ? "text-cyan-700" : "text-cyan-400") :
                          log.type === "user" ? (isLight ? "text-amber-700" : "text-amber-300") :
                          log.type === "ai" ? (isLight ? "text-emerald-700" : "text-emerald-400") : "text-rose-600"
                        }`}>
                          {log.type}:
                        </span>{" "}
                        {log.text}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`flex-1 overflow-y-auto pr-1 flex flex-col gap-3 text-sm scrollbar-thin ${
                    isLight ? "scrollbar-thumb-slate-300" : "scrollbar-thumb-cyan-500/30"
                  }`}>
                    <div className={`flex items-center justify-between border-b pb-2 ${isLight ? "border-slate-200" : "border-cyan-500/10"}`}>
                      <div className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${isLight ? "text-slate-800" : "text-cyan-400"}`}>
                        <Moon className={`w-3.5 h-3.5 ${isLight ? "text-cyan-600" : "text-cyan-400"}`} />
                        <span>Live Timings</span>
                      </div>
                      <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className={`text-[10px] font-bold rounded px-1.5 py-0.5 focus:outline-none cursor-pointer border ${
                          isLight ? "bg-slate-100 border-slate-300 text-slate-800" : "bg-zinc-900 border-cyan-500/30 text-cyan-300"
                        }`}
                      >
                        {["Faisalabad", "Karachi", "Lahore", "Islamabad", "Peshawar", "Multan", "Rawalpindi", "Quetta", "London", "New York", "Makkah"].map(c => (
                          <option key={c} value={c} className={isLight ? "bg-white text-slate-800" : "bg-zinc-950 text-slate-100"}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {prayerTimes ? (() => {
                      const nextInfo = getNextPrayerInfo(prayerTimes.timings);
                      return (
                        <div className="flex flex-col gap-1.5 mt-1">
                          {["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].map(p => {
                            const isNext = nextInfo && nextInfo.nextPrayer === p;
                            return (
                              <div
                                key={p}
                                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition border ${
                                  isNext
                                    ? (isLight ? "bg-emerald-50 border-emerald-300 shadow-xs" : "bg-emerald-950/40 border-emerald-500/50 shadow-[0_0_8px_rgba(52,211,153,0.15)]")
                                    : (isLight ? "bg-slate-50 border-slate-200" : "bg-zinc-950/80 border-cyan-500/20")
                                }`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span className={isNext ? (isLight ? "text-emerald-700 font-bold text-[11px]" : "text-emerald-400 font-bold text-[11px]") : (isLight ? "text-slate-800 font-bold text-[11px]" : "text-cyan-300 font-bold text-[11px]")}>
                                    {p}
                                  </span>
                                  {isNext && (
                                    <span className={`text-[8px] font-extrabold uppercase px-1 rounded tracking-wider animate-pulse border ${
                                      isLight ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                    }`}>
                                      NEXT
                                    </span>
                                  )}
                                </div>
                                <span className={isNext ? (isLight ? "text-emerald-800 font-mono font-bold text-[11px]" : "text-emerald-300 font-mono font-bold text-[11px]") : (isLight ? "text-slate-700 font-mono font-bold text-[11px]" : "text-zinc-200 font-mono font-bold text-[11px]")}>
                                  {prayerTimes.timings[p]}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })() : (
                      <div className={`flex-1 flex items-center justify-center text-center text-xs ${isLight ? "text-slate-400" : "text-zinc-500"}`}>
                        Loading prayer times...
                      </div>
                    )}
                  </div>
                )}

                {/* Floating Timer Badge */}
                {activeReminder && (
                  <div className={`absolute bottom-4 left-4 right-4 rounded-xl p-3 backdrop-blur flex items-center justify-between border ${
                    isLight 
                      ? "bg-emerald-50 border-emerald-300 shadow-md text-emerald-900" 
                      : "bg-emerald-950/90 border-emerald-500/50 shadow-[0_0_15px_rgba(52,211,153,0.2)]"
                  }`}>
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-emerald-600 animate-bounce" />
                      <div>
                        <div className={`text-[10px] uppercase font-bold tracking-wider ${isLight ? "text-emerald-900" : "text-emerald-200"}`}>{activeReminder.label}</div>
                        <div className={`text-[9px] ${isLight ? "text-emerald-700" : "text-emerald-500"}`}>Active Timer</div>
                      </div>
                    </div>
                    <div className={`text-xl font-bold font-mono ${isLight ? "text-emerald-700" : "text-emerald-400"}`}>
                      {Math.floor(activeReminder.remaining / 60).toString().padStart(2, '0')}:
                      {(activeReminder.remaining % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                )}
              </div>

              {/* Center Panel: JARVIS HUD Visualizer */}
              <div className="lg:col-span-6 flex flex-col items-center justify-center h-[320px]">
                <JarvisHUD
                  assistantState={assistantState}
                  statusBadge={statusBadge}
                  activeSurah={activeSurah}
                  selectedReciter={selectedReciter}
                  isQuranPlaying={isQuranPlaying}
                  quranProgress={quranProgress}
                  currentTime={audioCurrentTime}
                  duration={audioDuration}
                  onToggleQuranPlay={toggleQuranPlay}
                  onStopQuran={stopQuranAudio}
                  onSeek={handleSeek}
                  onSkip={handleSkip}
                  frequencyData={frequencyData}
                  userVolume={userVolume}
                  assistantVolume={assistantVolume}
                  theme={theme}
                />
              </div>

              {/* Right Panel: Ayahs Scroller */}
              <div className={`lg:col-span-3 rounded-2xl p-4 flex flex-col gap-3 h-[320px] overflow-hidden text-left transition-colors duration-300 border ${
                isLight
                  ? "bg-white border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
                  : "bg-black border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.03)]"
              }`}>
                <div className={`text-[10px] font-bold uppercase tracking-widest border-b pb-2 flex items-center justify-between ${
                  isLight ? "text-slate-800 border-slate-200" : "text-cyan-400 border-cyan-500/20"
                }`}>
                  <span>LIVE AYAH SCROLLER</span>
                  <span className={isLight ? "text-slate-400 font-normal" : "text-zinc-500 font-normal"}>({ayahsList.length} Ayahs)</span>
                </div>

                {/* Mini Jarvis Speaker & Voice Clone Status */}
                <div className={`border rounded-xl p-2 flex items-center justify-between gap-3 text-xs mb-0.5 ${
                  isLight ? "bg-slate-50 border-slate-200" : "bg-zinc-950/80 border-cyan-500/10"
                }`}>
                  <div className="flex items-center gap-2">
                    <div className={`relative w-7 h-7 rounded-full border flex items-center justify-center overflow-hidden ${
                      isLight ? "border-cyan-400 bg-cyan-50" : "border-cyan-500/40 bg-cyan-950/30"
                    }`}>
                      <span className="w-3.5 h-3.5 rounded-full bg-cyan-500/30 animate-ping absolute" />
                      <span className="w-2 h-2 rounded-full bg-cyan-600" />
                    </div>
                    <div>
                      <div className={`text-[9px] font-bold uppercase tracking-wider ${isLight ? "text-slate-800" : "text-cyan-300"}`}>VOICE SYNC GRAPH</div>
                      <div className={`text-[8px] ${isLight ? "text-slate-500" : "text-zinc-500"}`}>Clone Mode: Jarvis (Active)</div>
                    </div>
                  </div>
                  <div className={`text-[8px] text-right font-mono leading-none ${isLight ? "text-cyan-700" : "text-cyan-400/80"}`}>
                    <div className="font-bold">SPEAKER ON</div>
                    <div className={`mt-0.5 ${isLight ? "text-slate-400" : "text-zinc-600"}`}>Loss: 0.012</div>
                  </div>
                </div>

                {isLoadingAyahs ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-xs text-cyan-600 gap-2">
                    <Disc3 className="w-6 h-6 animate-spin text-cyan-600" />
                    <span>Loading verses...</span>
                  </div>
                ) : ayahsList.length > 0 ? (
                  <div ref={ayahContainerRef} className={`flex-1 overflow-y-auto pr-1 space-y-4 text-right scrollbar-thin ${
                    isLight ? "scrollbar-thumb-slate-300" : "scrollbar-thumb-cyan-500/30"
                  }`}>
                    {ayahsList.map((ayah, idx) => {
                      const isActive = Math.min(ayahsList.length - 1, Math.floor((quranProgress / 100) * ayahsList.length)) === idx;
                      return (
                        <div
                          key={ayah.number}
                          id={`ayah-${idx}`}
                          className={`p-2 rounded-lg transition-all duration-300 text-left border ${
                            isActive
                              ? (isLight ? "bg-cyan-50 border-cyan-300 shadow-sm" : "bg-cyan-950/40 border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.1)]")
                              : "bg-transparent border-transparent"
                          }`}
                        >
                          {/* Arabic */}
                          <div className={`font-arabic text-base leading-loose text-right ${
                            isActive 
                              ? (isLight ? "text-cyan-900 font-bold" : "text-cyan-200 font-bold") 
                              : (isLight ? "text-slate-800" : "text-zinc-300")
                          }`}>
                            {ayah.text} <span className={`text-xs font-mono ${isLight ? "text-cyan-700" : "text-cyan-400"}`}>({ayah.numberInSurah})</span>
                          </div>
                          {/* Translation */}
                          <div className={`text-[10px] font-sans leading-relaxed text-left mt-1 ${
                            isActive 
                              ? (isLight ? "text-cyan-800 font-medium" : "text-cyan-300 font-medium") 
                              : (isLight ? "text-slate-500" : "text-zinc-500")
                          }`}>
                            {ayah.englishText}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={`flex-1 flex items-center justify-center text-center text-xs ${isLight ? "text-slate-400" : "text-zinc-500"}`}>
                    Start tilawat to show verses
                  </div>
                )}
              </div>

            </div>

            {/* Qari Selector Card below HUD */}
            <div className={`w-full max-w-4xl p-4 rounded-xl border transition-colors duration-300 flex flex-col gap-3 ${
              isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-950 border-cyan-500/20"
            }`}>
              <div className={`text-[11px] uppercase tracking-widest flex items-center justify-between ${
                isLight ? "text-slate-500" : "text-zinc-400"
              }`}>
                <span className="flex items-center gap-2">
                  <UserCheck className={`w-3.5 h-3.5 ${isLight ? "text-cyan-600" : "text-cyan-400"}`} />
                  Select Qari / Reciter
                </span>
                <span className={`font-bold ${isLight ? "text-cyan-700" : "text-cyan-400"}`}>{selectedReciter.name}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2 text-xs">
                {RECITERS_LIST.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setSelectedReciter(r);
                      if (isQuranPlaying && activeSurah) {
                        playSurahAudio(activeSurah.number, r);
                      }
                    }}
                    className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                      selectedReciter.id === r.id
                        ? (isLight ? "bg-cyan-50 border-cyan-500 text-cyan-900 shadow-xs font-bold" : "bg-cyan-950 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)] font-bold")
                        : (isLight ? "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700")
                    }`}
                  >
                    <div className="truncate font-semibold">{r.name.split(" ")[0]} {r.name.split(" ")[1] || ""}</div>
                    <div className={`text-[9px] font-arabic truncate ${isLight ? "text-slate-500" : "text-zinc-500"}`}>{r.arabicName}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Test Voice Command Buttons */}
            <div className={`w-full max-w-4xl p-4 rounded-xl border transition-colors duration-300 flex flex-col gap-3 ${
              isLight ? "bg-white border-slate-200 shadow-sm" : "bg-zinc-950 border-cyan-500/20"
            }`}>
              <div className={`text-[11px] uppercase tracking-widest flex items-center justify-between ${
                isLight ? "text-slate-500" : "text-zinc-400"
              }`}>
                <div className="flex items-center gap-3">
                  <span>Quick Voice Prompts // Click to speak</span>
                  <label className="flex items-center gap-1.5 cursor-pointer normal-case text-zinc-500 hover:text-cyan-400 select-none">
                    <input 
                      type="checkbox"
                      checked={enableInstantLocalIntents}
                      onChange={(e) => setEnableInstantLocalIntents(e.target.checked)}
                      className="accent-cyan-500 rounded cursor-pointer"
                    />
                    <span>Instant Stop/Resume (Option 1)</span>
                  </label>
                </div>
                <span className={`font-semibold ${isLight ? "text-cyan-700" : "text-cyan-400"}`}>{statusMessage}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <button
                  onClick={() => handleSendTextPrompt("Ahmed, Salam Alaikum")}
                  className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                    isLight ? "bg-slate-50 hover:bg-cyan-50 border-slate-200 hover:border-cyan-400 text-slate-800" : "bg-zinc-900 hover:bg-cyan-950/60 border-zinc-800 hover:border-cyan-500/50 text-cyan-300"
                  }`}
                >
                  <div className={`font-bold ${isLight ? "text-slate-900" : "text-white"}`}>"Salam Alaikum"</div>
                  <div className={`text-[10px] ${isLight ? "text-slate-500" : "text-zinc-500"}`}>Ahmed answers Salam</div>
                </button>

                <button
                  onClick={() => handleSendTextPrompt("Play Surah Al-Mulk")}
                  className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                    isLight ? "bg-slate-50 hover:bg-cyan-50 border-slate-200 hover:border-cyan-400 text-slate-800" : "bg-zinc-900 hover:bg-cyan-950/60 border-zinc-800 hover:border-cyan-500/50 text-cyan-300"
                  }`}
                >
                  <div className={`font-bold ${isLight ? "text-slate-900" : "text-white"}`}>"Play Surah Al-Mulk"</div>
                  <div className={`text-[10px] ${isLight ? "text-slate-500" : "text-zinc-500"}`}>Starts recitation</div>
                </button>

                <button
                  onClick={() => handleSendTextPrompt("Play Surah Rahman")}
                  className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                    isLight ? "bg-slate-50 hover:bg-cyan-50 border-slate-200 hover:border-cyan-400 text-slate-800" : "bg-zinc-900 hover:bg-cyan-950/60 border-zinc-800 hover:border-cyan-500/50 text-cyan-300"
                  }`}
                >
                  <div className={`font-bold ${isLight ? "text-slate-900" : "text-white"}`}>"Play Surah Rahman"</div>
                  <div className={`text-[10px] ${isLight ? "text-slate-500" : "text-zinc-500"}`}>Starts recitation</div>
                </button>

                <button
                  onClick={() => handleSendTextPrompt("Please stop")}
                  className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                    isLight ? "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-900" : "bg-zinc-900 hover:bg-rose-950/60 border-zinc-800 hover:border-rose-500/50 text-rose-300"
                  }`}
                >
                  <div className={`font-bold ${isLight ? "text-rose-900" : "text-white"}`}>"Stop audio"</div>
                  <div className={`text-[10px] ${isLight ? "text-rose-600" : "text-zinc-500"}`}>Stops immediately</div>
                </button>
              </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="w-full max-w-4xl">
              <ControlsBar
                state={assistantState}
                isMuted={isMuted}
                onToggleLive={handleToggleLiveCall}
                onToggleMute={handleToggleMute}
                onInterrupt={handleInterrupt}
                onSendTextPrompt={handleSendTextPrompt}
                volume={volume}
                onChangeVolume={setVolume}
                theme={theme}
              />
            </div>
          </div>
        )}

        {/* Tab: 16-Line Quran Reader (Islam 360 Industry Standard) */}
        {activeTab === "reader" && (
          <div className="w-full">
            <QuranReader
              onPlaySurah={(num) => playSurahAudio(num)}
              activeSurahNum={activeSurah?.number || 1}
              isQuranPlaying={isQuranPlaying}
              onToggleQuranPlay={toggleQuranPlay}
              selectedReciterName={selectedReciter.name}
              externalPageNumber={readerPageNum}
            />
          </div>
        )}

        {/* Tab 2: Ahmed AI Synth & Clone Laboratory */}
        {activeTab === "synth" && (
          <div className="w-full max-w-4xl mx-auto bg-zinc-950 border border-cyan-500/20 rounded-2xl p-6 flex flex-col gap-6 shadow-[0_0_40px_rgba(6,182,212,0.05)] text-left">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping inline-block" />
                <span className="font-bold text-cyan-300 tracking-wider">AHMED AI // SPEECH SYNTHESIS & VOICE CLONING LAB</span>
              </div>
              <span className="text-[10px] text-zinc-500 tracking-widest uppercase">SECURE ENGINE V2.4</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
              
              {/* Left Column: Voice customization controls */}
              <div className="md:col-span-7 bg-black/60 border border-zinc-800 rounded-xl p-4 flex flex-col gap-4">
                <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest border-b border-zinc-800 pb-2">
                  Voice Synthesis Parameters
                </div>
                
                {/* Sliders */}
                <div className="space-y-4 text-xs">
                  {/* Pitch Shift */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">Voice Pitch Shift:</span>
                      <span className="text-cyan-300 font-mono font-bold">{synthPitch > 0 ? `+${synthPitch}` : synthPitch} st</span>
                    </div>
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="1"
                      value={synthPitch}
                      onChange={(e) => setSynthPitch(Number(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>

                  {/* Formant Shift */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">Formant Shifter:</span>
                      <span className="text-cyan-300 font-mono font-bold">{synthFormant}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={synthFormant}
                      onChange={(e) => setSynthFormant(Number(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>

                  {/* Vocoder */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">Robotic Vocoder Mixer:</span>
                      <span className="text-cyan-300 font-mono font-bold">{synthVocoder}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={synthVocoder}
                      onChange={(e) => setSynthVocoder(Number(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>

                  {/* Resonance */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">Deepness Resonance:</span>
                      <span className="text-cyan-300 font-mono font-bold">{synthResonance}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={synthResonance}
                      onChange={(e) => setSynthResonance(Number(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>

                  {/* Speed */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">Speech Rate / Speed:</span>
                      <span className="text-cyan-300 font-mono font-bold">{synthSpeed.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={synthSpeed}
                      onChange={(e) => setSynthSpeed(Number(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>
                </div>

                {/* Oscilloscope Graphic */}
                <div className="flex-1 min-h-[60px] border border-zinc-800 rounded-lg bg-zinc-950 flex items-center justify-center p-3 overflow-hidden relative">
                  <div className="absolute inset-0 bg-[radial-gradient(#06b6d405_1px,transparent_1px)] bg-[size:16px_16px]" />
                  <div className="w-full flex items-center justify-around gap-1.5 h-6 opacity-80">
                    {Array.from({ length: 24 }).map((_, idx) => {
                      const h = 4 + Math.sin(idx * 0.5 + Date.now() * 0.005) * 16 + Math.random() * 8;
                      return (
                        <div
                          key={idx}
                          className="w-1 rounded-full bg-cyan-500/80 transition-all duration-75"
                          style={{ height: `${Math.max(4, h)}px` }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Voice Clone Slots & Training */}
              <div className="md:col-span-5 flex flex-col gap-4">
                
                {/* Clone Slots Selection */}
                <div className="bg-black/60 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3">
                  <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest border-b border-zinc-800 pb-2">
                    Clone Voice Target Profile
                  </div>
                  
                  <div className="flex flex-col gap-2 text-xs">
                    {[
                      { id: "tony", label: "Tony Stark (Male Voice)", sub: "Calibrated 99.8% match" },
                      { id: "jarvis", label: "Ahmed AI Classic (AI Voice)", sub: "Confidence limit: High" },
                      { id: "friday", label: "Friday (Female Voice)", sub: "Confidence limit: Balanced" },
                      { id: "custom", label: "Custom Upload Slot", sub: "Awaiting voice profile data" },
                    ].map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedCloneSlot(slot.id)}
                        className={`p-2 rounded-lg border text-left transition ${
                          selectedCloneSlot === slot.id
                            ? "bg-cyan-950/60 border-cyan-400/80 text-cyan-300 font-bold shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        <div>{slot.label}</div>
                        <div className="text-[9px] text-zinc-500 font-normal">{slot.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Training Status Card */}
                <div className="bg-black/60 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3 flex-1 justify-between">
                  <div>
                    <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest border-b border-zinc-800 pb-2 flex items-center justify-between">
                      <span>Neural Model Training</span>
                      {isCloneTraining && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                    </div>
                    
                    <div className="text-[10px] space-y-1.5 mt-2 font-mono text-zinc-400">
                      <div className="flex justify-between">
                        <span>Model Type:</span>
                        <span className="text-white font-bold">FastPitch V2 GAN</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Training Steps:</span>
                        <span className="text-white font-bold">Epoch 48 / 100</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Validation Loss:</span>
                        <span className="text-emerald-400 font-bold">0.0124 (Optimal)</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        setIsRecordingSample(true);
                        setSampleDuration(0);
                        const interval = setInterval(() => {
                          setSampleDuration(d => {
                            if (d >= 4) {
                              clearInterval(interval);
                              setIsRecordingSample(false);
                              return 4;
                            }
                            return d + 1;
                          });
                        }, 1000);
                      }}
                      disabled={isRecordingSample}
                      className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                        isRecordingSample
                          ? "bg-rose-950 border-rose-500 text-rose-300 animate-pulse"
                          : "bg-zinc-900 border-zinc-800 hover:border-cyan-500/50 text-zinc-300"
                      }`}
                    >
                      <Waves className="w-3.5 h-3.5" />
                      <span>{isRecordingSample ? `RECORDING VOICE SAMPLE (${sampleDuration}s)` : "RECORD VOICE SAMPLE TO CLONE"}</span>
                    </button>

                    <button
                      onClick={() => setIsCloneTraining(!isCloneTraining)}
                      className={`py-2 rounded-lg text-xs font-bold transition ${
                        isCloneTraining 
                          ? "bg-cyan-600 hover:bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.3)]" 
                          : "bg-zinc-800 hover:bg-zinc-700 text-white"
                      }`}
                    >
                      {isCloneTraining ? "PAUSE TRAINING MODEL" : "START CLONING MODEL"}
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* Tab 3: Quran Surahs List Restored */}
        {activeTab === "surahs" && (
          <div className="w-full max-w-4xl mx-auto bg-zinc-950 border border-cyan-500/20 rounded-2xl p-6 flex flex-col gap-4 max-h-[600px] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 border-b-zinc-800">
              <div className="font-bold text-cyan-300">ALL 114 QURAN SURAHS</div>
              <div className="text-xs text-zinc-500">Click any Surah to recite instantly</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {SURAH_LIST.map((s) => (
                <button
                  key={s.number}
                  onClick={() => {
                    playSurahAudio(s.number);
                    setActiveTab("hud");
                  }}
                  className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                    activeSurah?.number === s.number
                      ? "bg-cyan-950/60 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)] font-bold"
                      : "bg-zinc-900/60 border-zinc-800 hover:border-cyan-500/50 text-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-cyan-300">
                      {s.number}
                    </div>
                    <div>
                      <div className="text-xs font-bold">{s.englishName}</div>
                      <div className="text-[10px] text-zinc-500">{s.numberOfAyahs} Verses</div>
                    </div>
                  </div>
                  <div className="text-sm font-arabic text-cyan-400/80">{s.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Live Transcript */}
        {activeTab === "transcript" && (
          <div className="w-full max-w-4xl mx-auto">
            <TranscriptPanel
              messages={messages}
              liveUserText={liveUserText}
              liveAssistantText={liveAssistantText}
              onClearTranscript={() => {
                setMessages([]);
                setLiveUserText("");
                setLiveAssistantText("");
              }}
            />
          </div>
        )}
      </main>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-cyan-500/40 rounded-2xl max-w-lg w-full p-6 text-sm flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="font-bold text-cyan-300">AHMED AI ISLAMIC VOICE ASSISTANT</span>
              <button onClick={() => setShowInfoModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-zinc-300 text-xs leading-relaxed">
              <p>⚡ <strong>Voice Engine:</strong> Gemini 2.5 Native Multimodal Audio for ultra-low latency real-time voice conversations.</p>
              <p>📖 <strong>Quran Audio:</strong> 100% Free CDN recitations by 6 world-famous Qaris.</p>
              <p>🎙️ <strong>Voice Commands:</strong></p>
              <ul className="list-disc pl-5 space-y-1 text-cyan-200">
                <li><em>"Ahmed, Salam Alaikum"</em> &rarr; Returns polite Islamic greeting.</li>
                <li><em>"Play Surah Al-Mulk"</em> or <em>"Play Surah Rahman by Abdul Basit"</em> &rarr; Starts recitation.</li>
                <li><em>"Stop audio"</em> or <em>"Ahmed stop"</em> &rarr; Stops recitation immediately.</li>
              </ul>
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="mt-2 w-full py-2.5 rounded-xl bg-cyan-500 text-black font-bold text-xs"
            >
              GOT IT
            </button>
          </div>
        </div>
      )}

      {/* Interactive Chatbox Panel */}
      {isChatboxOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-96 h-[500px] bg-zinc-900/95 border border-cyan-500/30 rounded-2xl flex flex-col shadow-[0_10px_40px_rgba(0,0,0,0.7)] backdrop-blur-md overflow-hidden transition-all duration-300 transform scale-100 origin-bottom-right">
          {/* Chatbox Header */}
          <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/40">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
              <div>
                <h3 className="text-xs font-bold text-cyan-400 tracking-wider uppercase">AHMED AI</h3>
                <span className="text-[9px] text-zinc-500 font-medium block">Islamic Guardrails Active</span>
              </div>
            </div>
            <button 
              onClick={() => setIsChatboxOpen(false)} 
              className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chatbox Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin text-xs text-left bg-zinc-950/20">
            {messages.length === 0 && !liveUserText && !liveAssistantText && (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-2 p-6 text-center">
                <MessageSquare className="w-8 h-8 text-cyan-500/30 animate-bounce" />
                <span className="italic text-[11px] leading-relaxed">
                  Assalamualaikum! Ask me anything about Islam, Quran, Hadith, or prayers.
                </span>
              </div>
            )}
            
            {messages.map((m) => (
              <div key={m.id} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role !== 'user' && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 to-emerald-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-md">
                    AH
                  </div>
                )}
                <div className={`max-w-[75%] p-3 rounded-2xl leading-relaxed shadow-sm transition-all duration-200 ${
                  m.role === 'user' 
                    ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-white rounded-tr-none' 
                    : 'bg-zinc-800/90 text-zinc-200 rounded-tl-none border border-zinc-700/40'
                }`}>
                  {m.hadith ? (
                    <div className="flex flex-col gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 pb-1 border-b border-cyan-500/20 text-cyan-400 font-bold text-[10px] uppercase tracking-wider">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>{m.hadith.book_name}</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 font-semibold italic">
                        {m.hadith.reference}
                      </div>
                      <div className="text-zinc-100 text-xs font-normal leading-relaxed bg-zinc-950/30 p-2.5 rounded-lg border border-zinc-800/60 whitespace-pre-line text-left">
                        {m.hadith.text}
                      </div>
                      <a 
                        href={m.hadith.verification_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg bg-cyan-950 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 hover:text-cyan-300 font-bold text-[9px] uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-xs"
                      >
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>Verify on Sunnah.com</span>
                      </a>
                    </div>
                  ) : (
                    m.text
                  )}
                </div>
                {m.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-cyan-800 flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-md">
                    U
                  </div>
                )}
              </div>
            ))}
            
            {/* Live transcribing text */}
            {liveUserText && (
              <div className="flex gap-2.5 justify-end">
                <div className="max-w-[75%] p-3 rounded-2xl bg-cyan-600/70 text-white rounded-tr-none italic animate-pulse shadow-sm">
                  {liveUserText}
                </div>
                <div className="w-7 h-7 rounded-full bg-cyan-800 flex items-center justify-center text-[10px] font-bold text-white shrink-0 animate-pulse">
                  U
                </div>
              </div>
            )}
            
            {/* Live responding text */}
            {liveAssistantText && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 to-emerald-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0 animate-pulse">
                  AH
                </div>
                <div className="max-w-[75%] p-3 rounded-2xl bg-zinc-800/70 text-zinc-200 rounded-tl-none italic animate-pulse border border-zinc-700/20">
                  {liveAssistantText}
                </div>
              </div>
            )}
            <div ref={chatMessagesEndRef} />
          </div>

          {/* Chatbox Input Field */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (chatInputText.trim()) {
                handleSendTextPrompt(chatInputText);
                setChatInputText("");
              }
            }}
            className="p-4 border-t border-zinc-800/80 bg-zinc-950/40 flex items-center gap-2.5"
          >
            <input
              type="text"
              value={chatInputText}
              onChange={(e) => setChatInputText(e.target.value)}
              placeholder="Ask an Islamic question..."
              className="flex-1 bg-zinc-900/90 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all duration-200"
            />
            <button 
              type="submit" 
              className="w-9 h-9 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-black font-bold transition flex items-center justify-center cursor-pointer shadow-md active:scale-95 animate-fade-in"
            >
              <Send className="w-4 h-4 text-black" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
