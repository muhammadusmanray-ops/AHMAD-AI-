import React, { useState } from "react";
import { VoiceOption } from "../types";
import { GEMINI_VOICES } from "../data/voices";
import { Play, Square, Check, Volume2, Sparkles, Loader2 } from "lucide-react";
import { AudioQueuePlayer } from "../utils/audio";

interface VoiceSelectorProps {
  selectedVoice: string;
  onSelectVoice: (voiceId: string) => void;
  disabled?: boolean;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoice,
  onSelectVoice,
  disabled = false,
}) => {
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [loadingVoiceId, setLoadingVoiceId] = useState<string | null>(null);
  const playerRef = React.useRef<AudioQueuePlayer | null>(null);

  const handlePreviewVoice = async (voice: VoiceOption, e: React.MouseEvent) => {
    e.stopPropagation();

    if (playingVoiceId === voice.id) {
      playerRef.current?.interrupt();
      setPlayingVoiceId(null);
      return;
    }

    try {
      setLoadingVoiceId(voice.id);
      if (!playerRef.current) {
        playerRef.current = new AudioQueuePlayer((isPlaying) => {
          if (!isPlaying) setPlayingVoiceId(null);
        });
      }

      playerRef.current.interrupt();

      const samplePhrases: Record<string, string> = {
        Zephyr: "Hello there! I'm Zephyr, ready for our live natural conversation.",
        Kore: "Greetings. I'm Kore, here to explore ideas calmly and thoughtfully with you.",
        Puck: "Hey, what's up! I'm Puck. Let's make this conversation lively and fun!",
        Charon: "Hello. I'm Charon, offering grounded insight and thoughtful perspective.",
        Fenrir: "Hi! I'm Fenrir, articulate, focused, and ready to solve problems fast.",
        Aoede: "Welcome! I'm Aoede, bringing expressive melody and creativity to our chat.",
      };

      const phrase =
        samplePhrases[voice.id] ||
        `Hi, this is a live demonstration of the natural ${voice.name} voice powered by Google Gemini.`;

      const response = await fetch("/api/tts-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: phrase, voice: voice.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate voice preview");
      }

      const data = await response.json();
      if (data.audio) {
        setPlayingVoiceId(voice.id);
        playerRef.current.playChunk(data.audio);
      }
    } catch (err) {
      console.error("Preview voice failed:", err);
    } finally {
      setLoadingVoiceId(null);
    }
  };

  return (
    <div id="voice-selector-container" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-[10px] uppercase tracking-widest font-bold text-white/50 flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-white/80" />
          Natural Gemini Voice ({GEMINI_VOICES.length})
        </label>
        <span className="text-[10px] text-white/30 font-medium italic tracking-wider" style={{ fontFamily: 'Georgia, serif' }}>Ultra-low latency 24kHz</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {GEMINI_VOICES.map((voice) => {
          const isSelected = selectedVoice === voice.id;
          const isPlaying = playingVoiceId === voice.id;
          const isLoading = loadingVoiceId === voice.id;

          return (
            <div
              key={voice.id}
              id={`voice-card-${voice.id}`}
              onClick={() => !disabled && onSelectVoice(voice.id)}
              className={`relative flex flex-col p-4 rounded-2xl border transition-all cursor-pointer select-none text-left ${
                isSelected
                  ? "bg-white/10 border-white/30 ring-2 ring-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                  : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
              } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
            >
              {voice.recommended && (
                <span className="absolute -top-2.5 right-4 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-white text-black shadow-lg flex items-center gap-1.5">
                  <Sparkles className="w-2.5 h-2.5" />
                  Recommended
                </span>
              )}

              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-light italic text-white text-lg tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>{voice.name}</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/5">
                      {voice.gender}
                    </span>
                  </div>
                  <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold mt-1">{voice.tag}</p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Sample Play Button */}
                  <button
                    type="button"
                    id={`preview-voice-btn-${voice.id}`}
                    onClick={(e) => handlePreviewVoice(voice, e)}
                    disabled={disabled}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors border border-white/10 ${
                      isPlaying
                        ? "bg-white text-black"
                        : "bg-white/5 hover:bg-white/20 text-white/70"
                    }`}
                    title={isPlaying ? "Stop sample" : "Listen to voice sample"}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isPlaying ? (
                      <Square className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    )}
                  </button>

                  {/* Selected checkmark indicator */}
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      isSelected ? "bg-white text-black" : "border border-white/20 text-transparent"
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>
              </div>

              <p className="text-xs text-white/40 mt-3 line-clamp-2 leading-relaxed font-light">
                {voice.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
