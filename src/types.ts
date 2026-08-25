export interface VoiceOption {
  id: string;
  name: string;
  gender: string;
  tag: string;
  description: string;
  recommended?: boolean;
}

export type AssistantState =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking"
  | "muted"
  | "error";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  timestamp: number;
  isLive?: boolean;
  interrupted?: boolean;
  audioBlobUrl?: string;
  hadith?: {
    book_name: string;
    hadith_number: number;
    text: string;
    reference: string;
    verification_url: string;
  };
}

export interface AssistantPersona {
  id: string;
  name: string;
  iconName: string;
  category: string;
  description: string;
  systemInstruction: string;
  suggestedPrompts: string[];
}

export interface AudioVisualizerData {
  userVolume: number;
  assistantVolume: number;
  frequencyData: Uint8Array;
}
