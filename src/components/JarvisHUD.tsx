import React from "react";
import { SurahInfo, ReciterInfo } from "../data/quran";
import { Play, Pause, Disc3, Square } from "lucide-react";

interface JarvisHUDProps {
  assistantState: "idle" | "connecting" | "listening" | "speaking" | "muted" | "error";
  statusBadge: { text: string; type: "listening" | "salam" | "playing" | "stopped" | "info" } | null;
  activeSurah: SurahInfo | null;
  selectedReciter: ReciterInfo;
  isQuranPlaying: boolean;
  quranProgress: number; // 0 to 100
  currentTime?: number;
  duration?: number;
  onToggleQuranPlay: () => void;
  onStopQuran: () => void;
  onSeek?: (newTime: number) => void;
  onSkip?: (seconds: number) => void;
  frequencyData: Uint8Array;
  userVolume: number;
  assistantVolume: number;
  theme?: "white" | "dark";
}

const formatTime = (secs?: number) => {
  if (!secs || isNaN(secs)) return "00:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export const JarvisHUD: React.FC<JarvisHUDProps> = ({
  assistantState,
  statusBadge,
  activeSurah,
  selectedReciter,
  isQuranPlaying,
  quranProgress,
  currentTime = 0,
  duration = 0,
  onToggleQuranPlay,
  onStopQuran,
  onSeek,
  onSkip,
  frequencyData,
  userVolume,
  assistantVolume,
  theme = "white",
}) => {
  const isLight = theme === "white";

  return (
    <div className="relative w-full flex flex-col items-center justify-center select-none font-mono">
      {/* Main Center Console Screen (Fixed 320px Height to align perfectly with side panels) */}
      <div className={`relative w-full h-[320px] rounded-2xl transition-colors duration-300 flex items-center justify-center overflow-hidden border ${
        isLight
          ? "bg-gradient-to-b from-white via-slate-50 to-slate-100 border-slate-200/90 shadow-[0_12px_40px_rgba(0,0,0,0.06)]"
          : "bg-black border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.1)]"
      }`}>
        
        {/* Background Grid Pattern */}
        <div className={`absolute inset-0 bg-[size:24px_24px] pointer-events-none ${
          isLight
            ? "bg-[linear-gradient(to_right,#0284c710_1px,transparent_1px),linear-gradient(to_bottom,#0284c710_1px,transparent_1px)]"
            : "bg-[linear-gradient(to_right,#08334415_1px,transparent_1px),linear-gradient(to_bottom,#08334415_1px,transparent_1px)]"
        }`} />
        
        {/* Left Side Floating HUD Status Badge */}
        {statusBadge && (
          <div className="absolute left-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 animate-in fade-in slide-in-from-left duration-300">
            <div className={`px-4 py-2 rounded-lg text-xs font-bold tracking-widest uppercase border shadow-lg backdrop-blur-md ${
              statusBadge.type === "listening" 
                ? (isLight ? "bg-rose-50 border-rose-300 text-rose-700 shadow-rose-100" : "bg-rose-950/80 border-rose-500/60 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.3)]")
                : statusBadge.type === "salam"
                ? (isLight ? "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-emerald-100" : "bg-emerald-950/80 border-emerald-500/60 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)]")
                : statusBadge.type === "playing"
                ? (isLight ? "bg-cyan-50 border-cyan-300 text-cyan-700 shadow-cyan-100" : "bg-cyan-950/80 border-cyan-500/60 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)]")
                : (isLight ? "bg-amber-50 border-amber-300 text-amber-700 shadow-amber-100" : "bg-amber-950/80 border-amber-500/60 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.3)]")
            }`}>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {statusBadge.text}
              </div>
            </div>
          </div>
        )}

        {/* Center JARVIS Reticle & Holographic Voice Orb */}
        <div className="relative flex items-center justify-center">
          
          {/* Futuristic HUD Targeting Brackets [ ] */}
          <div className="absolute -inset-8 pointer-events-none">
            <div className={`absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 ${isLight ? "border-cyan-500" : "border-cyan-400"}`} />
            <div className={`absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 ${isLight ? "border-cyan-500" : "border-cyan-400"}`} />
            <div className={`absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 ${isLight ? "border-cyan-500" : "border-cyan-400"}`} />
            <div className={`absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 ${isLight ? "border-cyan-500" : "border-cyan-400"}`} />
          </div>

          {/* Holographic Glowing Pulse Rings - Fluid morphing blobs */}
          <div className="relative w-36 h-36 flex items-center justify-center">
            
            {/* Layer 1: Outer glowing color shifting blob */}
            <div 
              className={`absolute inset-0 rounded-full border hud-blob transition-all duration-300 ${
                isLight ? "bg-cyan-500/10 border-cyan-400/30" : "border-cyan-500/20 bg-cyan-500/5 mix-blend-screen"
              }`}
              style={{
                transform: `scale(${1 + Math.max(userVolume, assistantVolume) * 0.4})`,
                borderColor: isQuranPlaying ? "rgba(6, 182, 212, 0.6)" : "rgba(99, 102, 241, 0.4)",
                boxShadow: isQuranPlaying 
                  ? "0 0 35px rgba(6, 182, 212, 0.35)" 
                  : "0 0 20px rgba(99, 102, 241, 0.2)"
              }}
            />

            {/* Layer 2: Middle colored blob rotating in opposite direction */}
            <div 
              className={`absolute w-[110%] h-[110%] rounded-full border border-dashed hud-blob-slow transition-all duration-300 ${
                isLight ? "border-indigo-400/40 bg-indigo-500/10" : "border-indigo-500/30 bg-indigo-500/5 mix-blend-screen"
              }`}
              style={{
                transform: `scale(${1 + Math.max(userVolume, assistantVolume) * 0.25})`,
                borderColor: isQuranPlaying ? "rgba(236, 72, 153, 0.5)" : "rgba(16, 185, 129, 0.4)"
              }}
            />

            {/* Layer 3: Inner shifting color glow core */}
            <div 
              className="absolute w-[85%] h-[85%] rounded-full bg-gradient-to-tr from-cyan-600/30 via-indigo-600/35 to-rose-600/30 hud-blob hud-glow-rotate blur-[2px] transition-transform duration-150"
              style={{
                transform: `scale(${0.9 + Math.max(userVolume, assistantVolume) * 0.2})`
              }}
            />

            {/* Center Circle with Microphone Icon */}
            <div className={`absolute w-12 h-12 rounded-full border flex items-center justify-center z-10 transition-all ${
              isLight
                ? "bg-white border-slate-200 shadow-[0_4px_15px_rgba(0,0,0,0.12)]"
                : "bg-white border-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.7)]"
            }`}>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className={`w-5 h-5 transition-colors duration-300 ${
                  assistantState === "listening" ? "text-rose-500 animate-pulse" :
                  assistantState === "speaking" ? "text-cyan-600 animate-bounce" : "text-slate-800"
                }`}
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </div>

          </div>
        </div>

        {/* Interactive Video/Movie Player Style Timeline Scrubber Bar */}
        {activeSurah && (
          <div className={`absolute bottom-2 inset-x-6 z-30 flex flex-col gap-1 rounded-xl px-3 py-2 backdrop-blur-md border ${
            isLight
              ? "bg-white/95 border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
              : "bg-zinc-950/90 border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.2)]"
          }`}>
            <div className={`flex items-center justify-between text-[10px] font-mono ${isLight ? "text-slate-700" : "text-cyan-300"}`}>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSkip?.(-10)}
                  className={`px-2 py-0.5 rounded font-bold transition cursor-pointer border ${
                    isLight 
                      ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700"
                      : "bg-zinc-900 hover:bg-cyan-950 border-cyan-500/40 text-cyan-300 hover:text-white"
                  }`}
                  title="Rewind 10 Seconds"
                >
                  -10s
                </button>
                <button
                  onClick={() => onSkip?.(10)}
                  className={`px-2 py-0.5 rounded font-bold transition cursor-pointer border ${
                    isLight 
                      ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700"
                      : "bg-zinc-900 hover:bg-cyan-950 border-cyan-500/40 text-cyan-300 hover:text-white"
                  }`}
                  title="Forward 10 Seconds"
                >
                  +10s
                </button>
                <span className={`text-[9px] font-bold uppercase truncate max-w-[130px] ${isLight ? "text-slate-600" : "text-zinc-300"}`}>
                  {activeSurah.englishName}
                </span>
              </div>

              <div className={`font-bold font-mono tracking-wider ${isLight ? "text-cyan-700" : "text-cyan-300"}`}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            {/* Video-Style Range Scrubber Bar */}
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="1"
              value={currentTime || 0}
              onChange={(e) => onSeek?.(Number(e.target.value))}
              className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer focus:outline-none ${
                isLight
                  ? "bg-slate-200 accent-cyan-600"
                  : "bg-zinc-800 accent-cyan-400"
              }`}
            />
          </div>
        )}

        {/* Live Audio Frequency Bars at Bottom */}
        {!activeSurah && (
          <div className="absolute bottom-3 inset-x-8 flex items-end justify-center gap-0.5 h-8 opacity-70">
            {Array.from({ length: 32 }).map((_, i) => {
              const val = frequencyData[i * 2] || 0;
              const heightPct = Math.max(8, (val / 255) * 100);
              return (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-75 ${
                    isLight
                      ? "bg-gradient-to-t from-cyan-600 via-sky-500 to-indigo-400"
                      : "bg-gradient-to-t from-cyan-700 via-cyan-400 to-sky-200"
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

