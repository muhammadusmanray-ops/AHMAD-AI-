import React, { useState } from "react";
import { AssistantState } from "../types";
import {
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  Square,
  Volume2,
  VolumeX,
  Send,
  Sliders,
  Sparkles,
} from "lucide-react";

interface ControlsBarProps {
  state: AssistantState;
  isMuted: boolean;
  onToggleLive: () => void;
  onToggleMute: () => void;
  onInterrupt: () => void;
  onSendTextPrompt: (text: string) => void;
  volume: number;
  onChangeVolume: (vol: number) => void;
  theme?: "white" | "dark";
}

export const ControlsBar: React.FC<ControlsBarProps> = ({
  state,
  isMuted,
  onToggleLive,
  onToggleMute,
  onInterrupt,
  onSendTextPrompt,
  volume,
  onChangeVolume,
  theme = "white",
}) => {
  const [textInput, setTextInput] = useState("");
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const isLight = theme === "white";

  const isConnected =
    state === "listening" ||
    state === "speaking" ||
    state === "thinking" ||
    state === "muted";

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    onSendTextPrompt(textInput.trim());
    setTextInput("");
  };

  return (
    <div
      id="controls-bar-container"
      className="flex flex-col gap-3 w-full max-w-2xl mx-auto"
    >
      {/* Floating Action Bar */}
      <div className={`flex items-center justify-between gap-4 p-4 rounded-[2rem] border transition-colors duration-300 ${
        isLight
          ? "bg-white/95 backdrop-blur-md border-slate-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
          : "bg-[#050505]/60 backdrop-blur-md border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]"
      }`}>
        {/* Left: Volume & Mute Controls */}
        <div className="flex items-center gap-2 relative">
          <button
            type="button"
            id="toggle-mute-btn"
            onClick={onToggleMute}
            disabled={!isConnected}
            className={`p-3.5 rounded-full transition-all cursor-pointer border ${
              isMuted
                ? (isLight ? "bg-red-50 text-red-600 border-red-200" : "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]")
                : (isLight ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200" : "bg-white/5 hover:bg-white/10 text-white/80 border-white/5")
            } ${!isConnected ? "opacity-30 pointer-events-none" : ""}`}
            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <div className="relative">
            <button
              type="button"
              id="volume-slider-toggle"
              onClick={() => setShowVolumeSlider(!showVolumeSlider)}
              className={`p-3.5 rounded-full transition-colors cursor-pointer border ${
                isLight
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                  : "bg-white/5 hover:bg-white/10 text-white/80 border-white/5"
              }`}
              title="Adjust Volume"
            >
              {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            {showVolumeSlider && (
              <div
                id="volume-popup"
                className={`absolute bottom-16 left-0 p-4 rounded-[1.5rem] border shadow-2xl flex items-center gap-3 z-30 min-w-[180px] ${
                  isLight
                    ? "bg-white border-slate-200 text-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
                    : "bg-[#050505] border-white/10 text-white shadow-[0_0_30px_rgba(0,0,0,0.8)]"
                }`}
              >
                <Volume2 className={`w-4 h-4 ${isLight ? "text-slate-400" : "text-white/50"}`} />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
                  className={`w-full h-1.5 rounded-full cursor-pointer ${
                    isLight ? "bg-slate-200 accent-cyan-600" : "bg-white/20 accent-white"
                  }`}
                />
                <span className={`text-[10px] font-mono w-8 text-right ${isLight ? "text-slate-600" : "text-white/60"}`}>
                  {Math.round(volume * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Center: Main Live Call Toggle */}
        <button
          type="button"
          id="main-live-call-btn"
          onClick={onToggleLive}
          className={`flex items-center justify-center gap-3 px-8 py-4 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold transition-all active:scale-95 cursor-pointer border ${
            isConnected
              ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-500 shadow-[0_4px_20px_rgba(225,29,72,0.3)]"
              : state === "connecting"
              ? (isLight ? "bg-slate-200 text-slate-700 border-slate-300 animate-pulse" : "bg-white/50 hover:bg-white/60 text-black border-transparent animate-pulse")
              : (isLight ? "bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-500 shadow-[0_4px_20px_rgba(8,145,178,0.25)]" : "bg-white hover:bg-white/90 text-black border-transparent shadow-[0_0_30px_rgba(255,255,255,0.2)]")
          }`}
        >
          {isConnected ? (
            <>
              <PhoneOff className="w-4 h-4" />
              <span>End Live Call</span>
            </>
          ) : state === "connecting" ? (
            <>
              <PhoneCall className="w-4 h-4 animate-spin" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <PhoneCall className="w-4 h-4" />
              <span>Start Live Conversation</span>
            </>
          )}
        </button>

        {/* Right: Interrupt / Stop Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="interrupt-speech-btn"
            onClick={onInterrupt}
            disabled={state !== "speaking"}
            className={`p-3.5 rounded-full transition-all cursor-pointer border ${
              state === "speaking"
                ? (isLight ? "bg-slate-900 hover:bg-black text-white border-transparent shadow-md" : "bg-white hover:bg-white/90 text-black border-transparent shadow-[0_0_20px_rgba(255,255,255,0.2)]")
                : (isLight ? "bg-slate-100 text-slate-300 border-slate-200 pointer-events-none" : "bg-white/5 text-white/30 border-white/5 pointer-events-none")
            }`}
            title="Interrupt AI Speech"
          >
            <Square className="w-5 h-5 fill-current" />
          </button>
        </div>
      </div>

      {/* Fallback Text Input Form */}
      <form
        onSubmit={handleSend}
        id="text-prompt-form"
        className={`flex items-center gap-3 p-2 pl-5 rounded-full border shadow-sm transition-colors duration-300 ${
          isLight
            ? "bg-white border-slate-200/90 text-slate-800"
            : "bg-[#050505]/50 border-white/20 text-[#e0e0e0]"
        }`}
      >
        <input
          type="text"
          id="text-prompt-input"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Or type a question / prompt here to speak aloud..."
          className={`flex-1 text-sm bg-transparent focus:outline-none placeholder:italic placeholder:font-light font-light ${
            isLight ? "placeholder:text-slate-400 text-slate-800" : "placeholder:text-white/40 text-[#e0e0e0]"
          }`}
          style={{ fontFamily: 'Georgia, serif' }}
        />
        <button
          type="submit"
          id="submit-text-prompt-btn"
          disabled={!textInput.trim()}
          className={`p-3 rounded-full transition-colors cursor-pointer ${
            isLight
              ? "bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-200 text-white disabled:text-slate-400"
              : "bg-white hover:bg-white/90 disabled:bg-white/10 text-black disabled:text-white/30"
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

