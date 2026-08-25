import React, { useEffect, useRef } from "react";
import { ChatMessage } from "../types";
import {
  MessageSquare,
  Copy,
  Check,
  Trash2,
  Download,
  Bot,
  User,
  Sparkles,
  Volume2,
} from "lucide-react";

interface TranscriptPanelProps {
  messages: ChatMessage[];
  liveUserText?: string;
  liveAssistantText?: string;
  onClear: () => void;
  selectedVoice: string;
  theme?: "white" | "dark";
}

export const TranscriptPanel: React.FC<TranscriptPanelProps> = ({
  messages,
  liveUserText,
  liveAssistantText,
  onClear,
  selectedVoice,
  theme = "white",
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = React.useState(false);
  const isLight = theme === "white";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, liveUserText, liveAssistantText]);

  const handleCopyAll = () => {
    const text = messages
      .map(
        (m) =>
          `[${new Date(m.timestamp).toLocaleTimeString()}] ${
            m.role === "assistant" ? `Gemini (${selectedVoice})` : "User"
          }: ${m.text}`
      )
      .join("\n\n");

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const text = `# Gemini Live Voice Conversation Log\nDate: ${new Date().toLocaleString()}\nVoice: ${selectedVoice}\n\n` +
      messages
        .map(
          (m) =>
            `### ${m.role === "assistant" ? `Gemini (${selectedVoice})` : "You"}\n*${new Date(
              m.timestamp
            ).toLocaleTimeString()}*\n\n${m.text}\n`
        )
        .join("\n---\n\n");

    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voice-assistant-transcript-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="transcript-panel"
      className={`flex flex-col h-full rounded-[2rem] border overflow-hidden transition-colors duration-300 ${
        isLight
          ? "bg-white border-slate-200 shadow-[0_4px_25px_rgba(0,0,0,0.04)]"
          : "bg-white/5 border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.02)]"
      }`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-6 py-4 border-b ${
        isLight ? "border-slate-200 bg-slate-50/70" : "border-white/10 bg-transparent"
      }`}>
        <div className="flex items-center gap-3">
          <MessageSquare className={`w-4 h-4 ${isLight ? "text-slate-500" : "text-white/60"}`} />
          <span className={`text-xs uppercase tracking-widest font-bold ${isLight ? "text-slate-800" : "text-white/80"}`}>Live Transcript</span>
          <span className={`text-[10px] font-mono ${isLight ? "text-slate-400" : "text-white/40"}`}>({messages.length})</span>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <>
              <button
                type="button"
                id="copy-transcript-btn"
                onClick={handleCopyAll}
                className={`p-2 rounded-full transition-colors ${
                  isLight ? "text-slate-500 hover:text-slate-900 hover:bg-slate-200" : "text-white/50 hover:text-white hover:bg-white/10"
                }`}
                title="Copy Transcript"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>

              <button
                type="button"
                id="export-transcript-btn"
                onClick={handleExport}
                className={`p-2 rounded-full transition-colors ${
                  isLight ? "text-slate-500 hover:text-slate-900 hover:bg-slate-200" : "text-white/50 hover:text-white hover:bg-white/10"
                }`}
                title="Export Markdown"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                type="button"
                id="clear-transcript-btn"
                onClick={onClear}
                className={`p-2 rounded-full transition-colors ${
                  isLight ? "text-slate-400 hover:text-red-500 hover:bg-red-50" : "text-white/40 hover:text-red-400 hover:bg-red-500/20"
                }`}
                title="Clear Transcript"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={scrollRef}
        id="transcript-messages-container"
        className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 min-h-[220px] max-h-[420px] bg-transparent"
      >
        {messages.length === 0 && !liveUserText && !liveAssistantText ? (
          <div className={`flex-1 flex flex-col items-center justify-center text-center p-6 ${isLight ? "text-slate-400" : "text-white/40"}`}>
            <div className={`w-16 h-16 rounded-full border flex items-center justify-center mb-4 ${
              isLight ? "bg-slate-100 border-slate-200 text-slate-400" : "bg-white/5 border-white/10 text-white/30"
            }`}>
              <Volume2 className="w-6 h-6" />
            </div>
            <p className={`text-xs uppercase tracking-widest font-bold mb-2 ${isLight ? "text-slate-700" : "text-white/60"}`}>Start the Live Voice session</p>
            <p className={`text-xs max-w-xs mt-1 font-light italic ${isLight ? "text-slate-500" : "text-white/40"}`} style={{ fontFamily: 'Georgia, serif' }}>
              Speak into your microphone. Words and responses will stream here in real-time.
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                id={`transcript-msg-${msg.id}`}
                className={`flex gap-2.5 max-w-[90%] ${
                  msg.role === "user" ? "self-end flex-row-reverse" : "self-start flex-row"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border ${
                    msg.role === "user"
                      ? (isLight ? "bg-cyan-600 text-white border-cyan-500" : "bg-white text-black border-white/20")
                      : (isLight ? "bg-slate-100 text-slate-700 border-slate-300" : "bg-white/10 text-white border-white/20")
                  }`}
                >
                  {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`px-4 py-3 rounded-[1.5rem] text-xs leading-relaxed font-light ${
                    msg.role === "user"
                      ? (isLight ? "bg-cyan-600 text-white rounded-tr-sm shadow-md" : "bg-white text-black rounded-tr-sm shadow-[0_0_20px_rgba(255,255,255,0.1)]")
                      : (isLight ? "bg-slate-100 text-slate-800 border border-slate-200 rounded-tl-sm shadow-sm" : "bg-white/5 text-[#e0e0e0] border border-white/10 rounded-tl-sm shadow-[0_0_15px_rgba(255,255,255,0.02)]")
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <span
                      className={`text-[9px] uppercase tracking-widest font-bold ${
                        msg.role === "user" ? (isLight ? "text-cyan-100" : "text-black/50") : (isLight ? "text-slate-500" : "text-white/40")
                      }`}
                    >
                      {msg.role === "user" ? "You" : `Gemini (${selectedVoice})`}
                    </span>
                    <span
                      className={`text-[9px] font-mono ${
                        msg.role === "user" ? (isLight ? "text-cyan-200" : "text-black/40") : (isLight ? "text-slate-400" : "text-white/30")
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>

                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {msg.interrupted && (
                    <span className={`inline-block mt-2 text-[10px] italic font-medium ${isLight ? "text-amber-600" : "text-white/50"}`} style={{ fontFamily: 'Georgia, serif' }}>
                      [User interrupted]
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Live Streaming User Speech */}
            {liveUserText && (
              <div className="flex gap-3 max-w-[90%] self-end flex-row-reverse opacity-90 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <User className="w-4 h-4" />
                </div>
                <div className={`px-4 py-3 rounded-[1.5rem] border text-xs leading-relaxed rounded-tr-sm font-light ${
                  isLight ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-emerald-500/20 border-emerald-500/30 text-emerald-100"
                }`}>
                  <span className={`text-[9px] uppercase tracking-widest font-bold block mb-1 ${isLight ? "text-emerald-700" : "text-emerald-400"}`}>Speaking...</span>
                  <p>{liveUserText}</p>
                </div>
              </div>
            )}

            {/* Live Streaming Assistant Speech */}
            {liveAssistantText && (
              <div className="flex gap-3 max-w-[90%] self-start flex-row animate-in fade-in duration-200">
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 shadow-sm ${
                  isLight ? "bg-cyan-100 border-cyan-300 text-cyan-700" : "bg-white/20 border-white/30 text-white"
                }`}>
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className={`px-4 py-3 rounded-[1.5rem] border text-xs leading-relaxed rounded-tl-sm shadow-sm font-light ${
                  isLight ? "bg-white border-slate-200 text-slate-800" : "bg-white/10 border-white/20 text-[#e0e0e0]"
                }`}>
                  <span className={`text-[9px] uppercase tracking-widest font-bold block mb-1 ${isLight ? "text-cyan-700" : "text-white/60"}`}>
                    Gemini Live ({selectedVoice})
                  </span>
                  <p>{liveAssistantText}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

