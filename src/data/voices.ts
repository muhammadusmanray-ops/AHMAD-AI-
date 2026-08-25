import { VoiceOption } from "../types";

export const GEMINI_VOICES: VoiceOption[] = [
  {
    id: "Zephyr",
    name: "Zephyr",
    gender: "Neutral / Balanced",
    tag: "Natural & Warm",
    description: "Balanced, human-like voice with natural pacing and warm inflections.",
  },
  {
    id: "Kore",
    name: "Kore",
    gender: "Female / Soothing",
    tag: "Calm & Reflective",
    description: "Gentle, soothing tone ideal for tutoring, mindful chats, and thoughtful discussions.",
  },
  {
    id: "Puck",
    name: "Puck",
    gender: "Male / Upbeat",
    tag: "Energetic & Natural",
    description: "Dynamic, human-like vocal energy with lively expression.",
    recommended: true,
  },
  {
    id: "Charon",
    name: "Charon",
    gender: "Male / Deep",
    tag: "Deep & Authoritative",
    description: "Resonant, deep timbre with confident, calming resonance.",
  },
  {
    id: "Fenrir",
    name: "Fenrir",
    gender: "Male / Crisp",
    tag: "Crisp & Focused",
    description: "Direct, articulate delivery suited for technical analysis and fast-paced Q&A.",
  },
  {
    id: "Aoede",
    name: "Aoede",
    gender: "Female / Melodic",
    tag: "Articulate & Melodic",
    description: "Rich vocal tone with expressive cadence for creative storytelling and engaging banter.",
  },
];
