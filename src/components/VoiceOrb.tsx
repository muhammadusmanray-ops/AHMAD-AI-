import React, { useEffect, useRef } from "react";
import { AssistantState } from "../types";
import { Mic, MicOff, Volume2, Sparkles, AlertCircle, Loader2 } from "lucide-react";

interface VoiceOrbProps {
  state: AssistantState;
  userVolume: number;
  assistantVolume: number;
  selectedVoice: string;
  isMuted: boolean;
  onOrbClick?: () => void;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  state,
  userVolume,
  assistantVolume,
  selectedVoice,
  isMuted,
  onOrbClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = window.devicePixelRatio || 1;
    const size = 320;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const render = () => {
      timeRef.current += 0.03;
      const t = timeRef.current;
      ctx.clearRect(0, 0, size, size);

      const centerX = size / 2;
      const centerY = size / 2;

      // Determine dynamic radius and intensities based on state
      let activeVolume = 0;
      let coreColor1 = "rgba(255, 255, 255, 0.85)";
      let coreColor2 = "rgba(180, 180, 180, 0.85)";
      let glowColor = "rgba(255, 255, 255, 0.15)";

      if (state === "speaking") {
        activeVolume = Math.min(1, assistantVolume * 2.5 + 0.15);
        coreColor1 = "rgba(255, 255, 255, 0.9)";
        coreColor2 = "rgba(200, 200, 200, 0.9)";
        glowColor = "rgba(255, 255, 255, 0.25)";
      } else if (state === "listening") {
        activeVolume = isMuted ? 0.05 : Math.min(1, userVolume * 3 + 0.1);
        coreColor1 = "rgba(16, 185, 129, 0.9)"; // Emerald
        coreColor2 = "rgba(255, 255, 255, 0.9)"; // White
        glowColor = "rgba(16, 185, 129, 0.2)";
      } else if (state === "thinking") {
        activeVolume = 0.3 + Math.sin(t * 3) * 0.15;
        coreColor1 = "rgba(255, 255, 255, 0.7)";
        coreColor2 = "rgba(100, 100, 100, 0.7)";
        glowColor = "rgba(255, 255, 255, 0.15)";
      } else if (state === "connecting") {
        activeVolume = 0.2 + Math.sin(t * 2) * 0.1;
        coreColor1 = "rgba(255, 255, 255, 0.5)";
        coreColor2 = "rgba(100, 100, 100, 0.5)";
        glowColor = "rgba(255, 255, 255, 0.1)";
      } else if (state === "error") {
        activeVolume = 0.1;
        coreColor1 = "rgba(239, 68, 68, 0.8)";
        coreColor2 = "rgba(185, 28, 28, 0.8)";
        glowColor = "rgba(239, 68, 68, 0.3)";
      } else if (state === "muted") {
        activeVolume = 0.05;
        coreColor1 = "rgba(50, 50, 50, 0.8)";
        coreColor2 = "rgba(30, 30, 30, 0.8)";
        glowColor = "rgba(255, 255, 255, 0.05)";
      } else {
        // Idle
        activeVolume = 0.1 + Math.sin(t * 1.2) * 0.05;
      }

      const baseRadius = 65 + activeVolume * 35;

      // 1. Draw outer diffuse glow rings
      const glowGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        baseRadius * 0.5,
        centerX,
        centerY,
        baseRadius * 1.9
      );
      glowGrad.addColorStop(0, glowColor);
      glowGrad.addColorStop(0.7, "rgba(99, 102, 241, 0.08)");
      glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 1.9, 0, Math.PI * 2);
      ctx.fill();

      // 2. Harmonic Fluid Waves
      const layers = 3;
      for (let layer = 0; layer < layers; layer++) {
        ctx.beginPath();
        const layerOffset = (layer * Math.PI * 2) / layers;
        const layerRadius = baseRadius + (layer - 1) * 8 * (1 + activeVolume);
        const waveCount = 6;

        for (let angle = 0; angle <= Math.PI * 2 + 0.1; angle += 0.05) {
          const wave =
            Math.sin(angle * waveCount + t * (2 + layer * 0.5) + layerOffset) *
            (4 + activeVolume * 16) +
            Math.cos(angle * 3 - t * 1.5) * (3 + activeVolume * 10);
          const r = layerRadius + wave;
          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;

          if (angle === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();

        const grad = ctx.createLinearGradient(
          centerX - layerRadius,
          centerY - layerRadius,
          centerX + layerRadius,
          centerY + layerRadius
        );
        grad.addColorStop(0, coreColor1);
        grad.addColorStop(1, coreColor2);

        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.55 - layer * 0.12;
        ctx.fill();
      }

      // 3. Central Core
      ctx.globalAlpha = 0.95;
      const coreGrad = ctx.createRadialGradient(
        centerX - baseRadius * 0.25,
        centerY - baseRadius * 0.25,
        0,
        centerX,
        centerY,
        baseRadius * 0.9
      );
      coreGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      coreGrad.addColorStop(0.3, coreColor2);
      coreGrad.addColorStop(0.9, coreColor1);
      coreGrad.addColorStop(1, "rgba(5, 5, 5, 0.8)");

      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 0.75, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // 4. Subtle Inner Rim Highlight
      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.globalAlpha = 1.0;
      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [state, userVolume, assistantVolume, isMuted]);

  const getStateLabel = () => {
    switch (state) {
      case "connecting":
        return "Connecting to Gemini Live...";
      case "listening":
        return isMuted ? "Microphone Muted" : "Listening to you...";
      case "thinking":
        return "Gemini is processing...";
      case "speaking":
        return `${selectedVoice} is speaking...`;
      case "muted":
        return "Microphone is muted";
      case "error":
        return "Connection issue";
      case "idle":
      default:
        return "Tap to start Live Voice";
    }
  };

  const getStateBadge = () => {
    switch (state) {
      case "connecting":
        return (
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold bg-white/5 text-white/70 border border-white/10">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Connecting
          </span>
        );
      case "listening":
        return isMuted ? (
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold bg-white/5 text-white/50 border border-white/10">
            <MicOff className="w-3.5 h-3.5" />
            Mic Muted
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Listening Live
          </span>
        );
      case "speaking":
        return (
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold bg-white/10 text-white border border-white/20">
            <Volume2 className="w-3.5 h-3.5 animate-bounce" />
            Voice Output: {selectedVoice}
          </span>
        );
      case "thinking":
        return (
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold bg-white/5 text-white/70 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            Thinking...
          </span>
        );
      case "error":
        return (
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertCircle className="w-3.5 h-3.5" />
            Live Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold bg-white/5 text-white/70 border border-white/10">
            <Mic className="w-3.5 h-3.5 text-white/50" />
            Ready for Live Call
          </span>
        );
    }
  };

  return (
    <div
      id="voice-orb-container"
      className="flex flex-col items-center justify-center p-6 text-center select-none"
    >
      <div
        id="voice-orb-canvas-wrapper"
        onClick={onOrbClick}
        className="relative cursor-pointer group flex items-center justify-center transition-transform duration-300 hover:scale-105 active:scale-95"
        role="button"
        tabIndex={0}
        aria-label="Toggle Live Voice Call"
      >
        <canvas
          ref={canvasRef}
          className="w-64 h-64 sm:w-72 sm:h-72 drop-shadow-2xl"
          style={{ width: "280px", height: "280px" }}
        />

        {/* Center overlay icon on idle or muted */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {state === "idle" && (
            <div className="w-14 h-14 rounded-full bg-white backdrop-blur-sm shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center text-black transition-transform group-hover:scale-110">
              <Mic className="w-6 h-6" />
            </div>
          )}
          {state === "muted" && (
            <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm shadow-md flex items-center justify-center text-white/50 border border-white/20">
              <MicOff className="w-6 h-6" />
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center gap-3">
        {getStateBadge()}
        <p className="text-[10px] uppercase tracking-widest font-medium text-white/40">
          {getStateLabel()}
        </p>
      </div>
    </div>
  );
};
