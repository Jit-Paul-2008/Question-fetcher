import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  FileDown,
  Hash,
  History,
  Send,
  Sparkles,
  Target,
  Bookmark,
  ShieldCheck,
} from "lucide-react";
import type { ReportSettings } from "../../lib/types";

interface ClassroomWindowProps {
  activeSet: any;
  onExport: (type: "pdf" | "docx") => void;
  onShare: () => void;
  onClose: () => void;
  publishing?: boolean;
  reportSettings: ReportSettings;
  onReportSettingsChange: (settings: ReportSettings) => void;
}

export function ClassroomWindow({
  activeSet,
  onExport,
  onShare,
  onClose,
  publishing = false,
  reportSettings,
  onReportSettingsChange,
}: ClassroomWindowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const questions = activeSet?.questions || [];
  const currentQuestion = questions[currentIndex];

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((value) => value + 1);
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex((value) => value - 1);
    }
  };

  if (!activeSet) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-center bg-muted/20 rounded-[3rem] shadow-terra-soft">
        <History className="w-16 h-16 text-primary opacity-20 mb-8" />
        <span className="text-xs font-black uppercase tracking-[0.4em] text-secondary/40">
          Research Stream Inactive
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-terra-in">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <div className="flex items-start gap-6">
          <button
            onClick={onClose}
            className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm group"
          >
            <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">
              Synthetic Dataset
            </span>
            <h2 className="text-4xl font-serif font-black text-primary leading-tight">
              {activeSet.title || activeSet.topicDetected || activeSet.topic || "Research Report"}
            </h2>
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <span className="text-xs font-bold text-secondary/60 uppercase tracking-widest">
                {activeSet.subject || "Chemistry"} Specimen
              </span>
              <div className="w-1 h-1 rounded-full bg-primary/20" />
              <span className="text-xs font-bold text-secondary/60 uppercase tracking-widest">
                {questions.length} Discrete Units
              </span>
              <div className="w-1 h-1 rounded-full bg-primary/20" />
              <span className="text-xs font-bold text-secondary/60 uppercase tracking-widest">
                {reportSettings.includeAnswers ? "Answer key included" : "Question-only report"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <div className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                {reportSettings.brandLabel || "Question Fetcher"}
              </div>
              <div className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                {questions.length.toString().padStart(2, "0")} Questions
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onExport("pdf")}
            className="flex items-center gap-3 px-5 py-3 bg-primary text-primary-foreground rounded-[1.2rem] shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all font-black text-[11px] uppercase tracking-widest"
          >
            <FileDown className="w-4 h-4" />
            <span>PDF</span>
          </button>
          <button
            onClick={() => onExport("docx")}
            className="flex items-center gap-3 px-5 py-3 bg-muted/40 rounded-[1.2rem] text-secondary hover:bg-accent hover:text-white transition-all shadow-sm font-black text-[11px] uppercase tracking-widest"
          >
            <FileDown className="w-4 h-4" />
            <span>DOCX</span>
          </button>
          <button
            onClick={onShare}
            disabled={publishing}
            className="flex items-center gap-3 px-5 py-3 bg-white/5 border border-white/5 hover:border-white/10 rounded-[1.2rem] text-white/80 hover:text-white transition-all shadow-sm font-black text-[11px] uppercase tracking-widest disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
            <span>{publishing ? "Publishing..." : "Publish"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-muted/30 p-6 rounded-[2rem] space-y-5 border border-white/5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-accent" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary/40">
                Report Controls
              </span>
            </div>

            <label className="flex items-start gap-3 p-4 rounded-2xl bg-background border border-white/5 cursor-pointer">
              <button
                type="button"
                onClick={() => onReportSettingsChange({ ...reportSettings, includeAnswers: !reportSettings.includeAnswers })}
                className="mt-1 text-primary"
              >
                {reportSettings.includeAnswers ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
              <div className="flex-1 space-y-1">
                <div className="text-sm font-bold text-secondary">Include answers</div>
                <div className="text-[11px] text-secondary/50 leading-relaxed">
                  Toggle answer-key visibility in PDF and DOCX exports.
                </div>
              </div>
            </label>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.25em] text-secondary/40">
                Branding label
              </label>
              <input
                value={reportSettings.brandLabel}
                onChange={(event) => onReportSettingsChange({ ...reportSettings, brandLabel: event.target.value })}
                placeholder="Question Fetcher"
                className="w-full bg-background border border-white/5 rounded-2xl py-3 px-4 text-sm text-secondary outline-none focus:border-primary/30"
              />
            </div>

            <div className="p-4 rounded-2xl bg-background border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-primary opacity-70">
                <Sparkles className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Preview mode</span>
              </div>
              <p className="text-[11px] text-secondary/50 leading-relaxed">
                Your export will be stamped with {reportSettings.brandLabel || "Question Fetcher"}.
              </p>
            </div>
          </div>

          <div className="bg-muted/30 p-6 rounded-[2rem] space-y-6 border border-white/5">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary/40">
              Report Metadata
            </h3>
            <div className="space-y-4">
              <div className="bg-background rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-3 text-primary opacity-60">
                  <Bookmark className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">Source Origin</span>
                </div>
                <p className="text-sm font-bold text-secondary truncate">{currentQuestion?.source || "Primary Research"}</p>
              </div>

              <div className="bg-background rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-3 text-primary opacity-60">
                  <Target className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">Targeting</span>
                </div>
                <p className="text-sm font-bold text-secondary truncate">{currentQuestion?.targetExam || "General Academic"}</p>
              </div>

              <div className="bg-background rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-3 text-primary opacity-60">
                  <Clock className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">Initialization</span>
                </div>
                <p className="text-sm font-bold text-secondary truncate">
                  {new Date(activeSet.timestamp?.toDate ? activeSet.timestamp.toDate() : activeSet.timestamp).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-9 space-y-6">
          <div className="synth-glass min-h-[650px] relative rounded-[2.5rem] flex flex-col items-center justify-start p-8 md:p-14 border border-white/5 bg-zinc-900/5 overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-neon-cyan/5 blur-[100px] rounded-full opacity-50" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-neon-violet/5 blur-[100px] rounded-full opacity-50" />

            <div className="absolute inset-y-0 left-4 flex items-center z-10 pointer-events-none">
              <button
                onClick={prevQuestion}
                disabled={currentIndex === 0}
                className="w-12 h-12 rounded-2xl bg-zinc-900/80 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-neon-cyan/20 hover:text-neon-cyan hover:border-neon-cyan/40 transition-all shadow-2xl disabled:opacity-0 group pointer-events-auto"
              >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="absolute inset-y-0 right-4 flex items-center z-10 pointer-events-none">
              <button
                onClick={nextQuestion}
                disabled={currentIndex === questions.length - 1}
                className="w-12 h-12 rounded-2xl bg-zinc-900/80 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-neon-cyan/20 hover:text-neon-cyan hover:border-neon-cyan/40 transition-all shadow-2xl disabled:opacity-0 group pointer-events-auto"
              >
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {currentQuestion ? (
              <div className="space-y-10 w-full max-w-4xl mx-auto flex flex-col h-full relative z-10">
                <div className="text-center space-y-6 pt-4">
                  <div className="inline-flex px-5 py-1.5 bg-neon-cyan/10 border border-neon-cyan/20 rounded-full">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neon-cyan">
                      Node [{String(currentIndex + 1).padStart(2, "0")}]
                    </span>
                  </div>
                  <h4 className="text-2xl md:text-4xl font-black text-white leading-tight tracking-tight italic">
                    {currentQuestion.text}
                  </h4>
                </div>

                {currentQuestion.options && currentQuestion.options.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full pt-2">
                    {currentQuestion.options.map((opt: string, index: number) => (
                      <div key={index} className="group relative">
                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-zinc-900 text-neon-cyan rounded-lg border border-neon-cyan/40 flex items-center justify-center font-black shadow-[0_0_15px_rgba(0,255,242,0.15)] z-20 text-[10px]">
                          {String.fromCharCode(65 + index)}
                        </div>
                        <div className="bg-[#0a0a0a] border border-white/5 group-hover:border-neon-cyan/30 p-6 pl-12 rounded-2xl transition-all duration-500 shadow-xl group-hover:-translate-y-1 text-sm font-bold text-white/60 group-hover:text-white leading-relaxed">
                          {opt}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-10">
                    <div className="max-w-2xl w-full p-10 bg-white/5 rounded-[2rem] relative border border-white/5 overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-neon-violet/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-neon-violet border border-neon-violet/50 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-[0_0_20px_rgba(184,112,255,0.4)] z-20">
                        Synthesis Resolution
                      </div>
                      <p className="text-xl text-white font-bold leading-relaxed text-center px-4 pt-6 italic relative z-10 transition-all group-hover:scale-[1.02] duration-700">
                        {reportSettings.includeAnswers ? currentQuestion.answer || "Scanning for conceptual resolution..." : "Answer hidden for question-only export mode."}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-8 flex justify-center gap-2 pb-4 flex-wrap">
                  {questions.map((_: any, index: number) => (
                    <button
                      key={index}
                      type="button"
                      className={`h-1 rounded-full transition-all duration-700 ${index === currentIndex ? "w-10 bg-neon-cyan shadow-[0_0_8px_rgba(0,255,242,0.8)]" : "w-2 bg-white/10 hover:bg-white/30"}`}
                      onClick={() => setCurrentIndex(index)}
                      aria-label={`Go to question ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-3 text-white/40">
                  <Sparkles className="w-10 h-10 mx-auto text-neon-cyan/50" />
                  <p className="text-sm font-bold uppercase tracking-[0.25em]">No questions available</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-[1.5rem] bg-muted/30 border border-white/5">
            <div className="flex items-center gap-3 text-secondary/60">
              <Hash className="w-4 h-4" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">
                Protocol {String(activeSet.id?.slice(0, 10) || "NULL")}
              </span>
            </div>
            <div className="flex items-center gap-3 text-secondary/60">
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">
                {reportSettings.brandLabel || "Question Fetcher"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
