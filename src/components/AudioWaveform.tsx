import React, { useEffect, useRef } from "react";

interface AudioWaveformProps {
  userVolume: number;
  assistantVolume: number;
  frequencyData?: Uint8Array;
  mode?: "stereo" | "compact";
  isActive: boolean;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  userVolume,
  assistantVolume,
  frequencyData,
  mode = "compact",
  isActive,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement?.clientWidth || 280;
    const height = mode === "compact" ? 36 : 60;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const barCount = 32;
    const barWidth = (width - barCount * 2) / barCount;

    let phase = 0;

    const render = () => {
      phase += 0.08;
      ctx.clearRect(0, 0, width, height);

      const dominantVolume = Math.max(userVolume, assistantVolume);

      for (let i = 0; i < barCount; i++) {
        let barHeight = 4;

        if (isActive) {
          // Dynamic frequency calculation
          const freqFactor = frequencyData && frequencyData.length > i * 2
            ? frequencyData[i * 2] / 255
            : 0;

          const harmonic = Math.sin(phase + i * 0.25) * 0.4 + 0.6;
          const heightFactor = Math.max(freqFactor, dominantVolume * harmonic);
          barHeight = Math.max(4, heightFactor * (height - 8));
        }

        const x = i * (barWidth + 2) + 2;
        const y = (height - barHeight) / 2;

        // Gradient coloring based on user vs assistant
        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (assistantVolume > userVolume && assistantVolume > 0.05) {
          grad.addColorStop(0, "#ffffff"); // White
          grad.addColorStop(1, "#c8c8c8"); // Grey
        } else if (userVolume > 0.05) {
          grad.addColorStop(0, "#10b981"); // Emerald
          grad.addColorStop(1, "#ffffff"); // White
        } else {
          grad.addColorStop(0, "#a0a0a0"); // Darker Grey
          grad.addColorStop(1, "#606060");
        }

        ctx.fillStyle = isActive ? grad : "rgba(255, 255, 255, 0.1)";
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [userVolume, assistantVolume, frequencyData, mode, isActive]);

  return (
    <div id="audio-waveform-wrapper" className="w-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="w-full rounded-lg"
        style={{ height: mode === "compact" ? "36px" : "60px" }}
      />
    </div>
  );
};
