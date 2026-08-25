import React, { useState } from "react";
import { AssistantPersona } from "../types";
import { ASSISTANT_PERSONAS } from "../data/personas";
import {
  Sparkles,
  Code2,
  GraduationCap,
  HeartHandshake,
  Feather,
  Settings2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface PersonaSelectorProps {
  selectedPersona: AssistantPersona;
  onSelectPersona: (persona: AssistantPersona) => void;
  systemInstruction: string;
  onChangeSystemInstruction: (instruction: string) => void;
  onSendPrompt?: (prompt: string) => void;
  disabled?: boolean;
}

export const PersonaSelector: React.FC<PersonaSelectorProps> = ({
  selectedPersona,
  onSelectPersona,
  systemInstruction,
  onChangeSystemInstruction,
  onSendPrompt,
  disabled = false,
}) => {
  const [showCustomEditor, setShowCustomEditor] = useState(false);

  const getPersonaIcon = (iconName: string) => {
    switch (iconName) {
      case "Code2":
        return <Code2 className="w-4 h-4" />;
      case "GraduationCap":
        return <GraduationCap className="w-4 h-4" />;
      case "HeartHandshake":
        return <HeartHandshake className="w-4 h-4" />;
      case "Feather":
        return <Feather className="w-4 h-4" />;
      case "Sparkles":
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <div id="persona-selector-container" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-[10px] uppercase tracking-widest font-bold text-white/50 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-white/80" />
          Conversational Mode & Tone
        </label>
        <button
          type="button"
          id="toggle-custom-prompt-btn"
          onClick={() => setShowCustomEditor(!showCustomEditor)}
          className="text-[10px] uppercase tracking-widest font-bold text-white/70 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Settings2 className="w-3.5 h-3.5" />
          {showCustomEditor ? "Hide Editor" : "Customize Prompt"}
          {showCustomEditor ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Preset Personas Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {ASSISTANT_PERSONAS.map((persona) => {
          const isSelected = selectedPersona.id === persona.id;
          return (
            <button
              key={persona.id}
              type="button"
              id={`persona-btn-${persona.id}`}
              onClick={() => {
                onSelectPersona(persona);
                onChangeSystemInstruction(persona.systemInstruction);
              }}
              disabled={disabled}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                isSelected
                  ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                  : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
              } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
            >
              <span className={isSelected ? "text-black" : "text-white/40"}>
                {getPersonaIcon(persona.iconName)}
              </span>
              <span>{persona.name}</span>
            </button>
          );
        })}
      </div>

      {/* Suggested Spoken Prompts */}
      {selectedPersona.suggestedPrompts && selectedPersona.suggestedPrompts.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mt-2">
          <span className="text-[10px] uppercase tracking-widest font-bold text-white/30">Try saying:</span>
          {selectedPersona.suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              id={`suggested-prompt-${idx}`}
              onClick={() => onSendPrompt?.(prompt)}
              className="text-[10px] text-white/70 bg-white/5 hover:bg-white/10 hover:text-white px-3 py-1.5 rounded-full transition-colors border border-white/10 cursor-pointer text-left font-light italic" style={{ fontFamily: 'Georgia, serif' }}
            >
              "{prompt}"
            </button>
          ))}
        </div>
      )}

      {/* Custom System Instruction Editor Drawer */}
      {showCustomEditor && (
        <div
          id="custom-instruction-editor"
          className="p-4 bg-white/5 rounded-2xl border border-white/10 flex flex-col gap-3 mt-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest font-bold text-white/80">Live Assistant Directives (System Instruction)</span>
            <span className="text-[10px] text-white/40 font-light italic" style={{ fontFamily: 'Georgia, serif' }}>Takes effect on next connection</span>
          </div>
          <textarea
            id="system-instruction-textarea"
            rows={4}
            value={systemInstruction}
            onChange={(e) => onChangeSystemInstruction(e.target.value)}
            disabled={disabled}
            className="w-full text-xs text-white/90 bg-[#050505]/50 p-4 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-white/50 focus:border-white/50 resize-none font-mono"
            placeholder="Instruct Gemini how to speak, respond, and behave..."
          />
        </div>
      )}
    </div>
  );
};
