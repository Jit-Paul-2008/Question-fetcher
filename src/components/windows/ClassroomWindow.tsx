import React, { useState } from "react";
import { ChevronLeft, ChevronRight, FileDown, Share2, Map, Users, Target, ShieldCheck, Bookmark, History, ExternalLink } from "lucide-react";

interface ClassroomWindowProps {
  activeSet: any;
  onExport: (type: 'pdf' | 'docx') => void;
  onShare: () => void;
  onClose: () => void;
}

export function ClassroomWindow({
  activeSet,
  onExport,
  onShare,
  onClose
}: ClassroomWindowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const questions = activeSet?.questions || [];
  const currentQuestion = questions[currentIndex];

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex(v => v + 1);
  };

  const prevQuestion = () => {
    if (currentIndex > 0) setCurrentIndex(v => v - 1);
  };

  if (!activeSet) {
    return (
        <div className="flex flex-col items-center justify-center p-24 text-center bg-muted/20 rounded-[3rem] shadow-terra-soft">
            <History className="w-16 h-16 text-primary opacity-20 mb-8" />
            <span className="text-xs font-black uppercase tracking-[0.4em] text-secondary/40">Research Stream Inactive</span>
        </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-terra-in">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
        <div className="flex items-center gap-8">
            <button 
                onClick={onClose}
                className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm group"
            >
                <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Synthetic Dataset</span>
                <h2 className="text-4xl font-serif font-black text-primary leading-tight">{activeSet.title || activeSet.topicDetected || activeSet.topic}</h2>
                <div className="flex items-center gap-4 pt-1">
                    <span className="text-xs font-bold text-secondary/60 uppercase tracking-widest">{activeSet.subject || "Chemistry"} Specimen</span>
                    <div className="w-1 h-1 rounded-full bg-primary/20" />
                    <span className="text-xs font-bold text-secondary/60 uppercase tracking-widest">{questions.length} Discrete Units</span>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-4">
            <button 
                onClick={() => onExport('pdf')}
                className="flex items-center gap-4 px-10 py-4 bg-primary text-primary-foreground rounded-[1.5rem] shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all font-black text-[11px] uppercase tracking-widest"
            >
                <FileDown className="w-5 h-5" />
                <span>Download Archive</span>
            </button>
            <button 
                onClick={onShare}
                className="p-4 bg-muted/40 rounded-2xl text-secondary hover:bg-accent hover:text-white transition-all shadow-sm"
            >
                <Share2 className="w-5 h-5" />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Intelligence Sidebar */}
        <div className="lg:col-span-3 space-y-8">
            <div className="bg-muted/30 p-8 rounded-[2.5rem] space-y-10">
                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary/40 mb-6">Discovery Metadata</h3>
                    <div className="space-y-6">
                        <div className="bg-background rounded-2xl p-5 space-y-2 group hover:shadow-md transition-all">
                            <div className="flex items-center gap-3 text-primary opacity-60">
                                <Bookmark className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-tighter">Source Origin</span>
                            </div>
                            <p className="text-sm font-bold text-secondary truncate">{currentQuestion?.source || "Primary Research"}</p>
                        </div>

                        <div className="bg-background rounded-2xl p-5 space-y-2 group hover:shadow-md transition-all">
                            <div className="flex items-center gap-3 text-primary opacity-60">
                                <Target className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-tighter">Scholastic Targeting</span>
                            </div>
                            <p className="text-sm font-bold text-secondary truncate">{currentQuestion?.targetExam || "General Academic"}</p>
                className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-neon-cyan/20 rounded-xl text-[10px] font-black text-white/60 hover:text-white uppercase tracking-[0.2em] transition-all"
            >
                <FileDown className="w-4 h-4 text-neon-cyan" />
                PDF
            </button>
            <button 
                onClick={() => onExport('docx')}
                className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-neon-violet/20 rounded-xl text-[10px] font-black text-white/60 hover:text-white uppercase tracking-[0.2em] transition-all"
            >
                <FileDown className="w-4 h-4 text-neon-violet" />
                DOCX
            </button>
            <button 
                onClick={onClose}
                className="p-3 bg-white/5 border border-white/5 hover:border-white/10 rounded-xl text-white/40 hover:text-white transition-all shadow-xl"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full min-h-[700px]">
        {/* Metadata Sidebar */}
        <div className="lg:col-span-3 space-y-6 flex flex-col h-full">
            <div className="p-8 synth-glass rounded-[2rem] border border-white/5 flex-grow space-y-10 bg-zinc-900/10">
                <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] border-b border-white/5 pb-4">Sequence Stats</h3>
                    
                    <div className="space-y-8">
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center">
                                <Hash className="w-4 h-4 text-neon-cyan/50" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Protocol ID</p>
                                <p className="text-xs font-mono text-white/80 font-bold tracking-tighter">#SYN_{activeSet.id?.slice(0, 10) || "NULL"}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center">
                                <Clock className="w-4 h-4 text-neon-violet/50" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Initialization</p>
                                <p className="text-xs font-bold text-white/80 tracking-tight">
                                    {new Date(activeSet.timestamp?.toDate ? activeSet.timestamp.toDate() : activeSet.timestamp).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center">
                                <Activity className="w-4 h-4 text-neon-cyan/50" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Resolution Type</p>
                                <p className="text-xs font-black text-neon-cyan uppercase tracking-tighter italic">{currentQuestion?.type || "MCQ_NODE"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-8 space-y-4">
                    <button className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-neon-cyan/10 border border-white/5 hover:border-neon-cyan/30 rounded-xl transition-all group overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/0 via-neon-cyan/5 to-neon-cyan/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        <div className="flex items-center gap-3 relative z-10">
                            <Cpu className="w-4 h-4 text-neon-cyan group-hover:animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white">Neural Optimizer</span>
                        </div>
                        <Activity className="w-3 h-3 text-white/10 relative z-10" />
                    </button>
                    <div className="p-4 bg-zinc-900/30 rounded-xl border border-white/5">
                         <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-neon-violet" />
                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Integrity Check</span>
                         </div>
                         <p className="text-[10px] font-medium text-white/40 leading-relaxed italic">Verification protocol Alpha-9 validated data structure.</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Synthesis Carousel View */}
        <div className="lg:col-span-9 space-y-6 flex flex-col h-full">
            <div className="synth-glass min-h-[650px] relative rounded-[2.5rem] flex flex-col items-center justify-start p-10 md:p-16 border border-white/5 bg-zinc-900/5 overflow-hidden flex-grow shadow-2xl">
                {/* Visual Ambience */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-neon-cyan/5 blur-[100px] rounded-full opacity-50" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-neon-violet/5 blur-[100px] rounded-full opacity-50" />

                {/* Navigation Overlays */}
                <div className="absolute inset-y-0 left-6 flex items-center z-10 pointer-events-none">
                    <button 
                        onClick={prevQuestion}
                        disabled={currentIndex === 0}
                        className="w-14 h-14 rounded-2xl bg-zinc-900/80 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-neon-cyan/20 hover:text-neon-cyan hover:border-neon-cyan/40 transition-all shadow-2xl disabled:opacity-0 group pointer-events-auto"
                    >
                        <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </button>
                </div>

                <div className="absolute inset-y-0 right-6 flex items-center z-10 pointer-events-none">
                    <button 
                        onClick={nextQuestion}
                        disabled={currentIndex === questions.length - 1}
                        className="w-14 h-14 rounded-2xl bg-zinc-900/80 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-neon-cyan/20 hover:text-neon-cyan hover:border-neon-cyan/40 transition-all shadow-2xl disabled:opacity-0 group pointer-events-auto"
                    >
                        <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                {currentQuestion && (
                    <div className="space-y-12 animate-in fade-in zoom-in-95 duration-700 w-full max-w-4xl mx-auto flex flex-col h-full relative z-10">
                        <div className="text-center space-y-8 pt-4">
                            <div className="inline-flex px-5 py-1.5 bg-neon-cyan/10 border border-neon-cyan/20 rounded-full">
                              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neon-cyan">Intelligence_Node [{String(currentIndex + 1).padStart(2, '0')}]</span>
                            </div>
                            <h4 className="text-2xl md:text-4xl font-black text-white leading-tight tracking-tight italic">
                                {currentQuestion.text}
                            </h4>
                        </div>

                        {/* Options Layer (Grid layout for MCQs) */}
                        {currentQuestion.options && currentQuestion.options.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full pt-6">
                                {currentQuestion.options.map((opt: string, i: number) => (
                                    <div key={i} className="group relative">
                                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-zinc-900 text-neon-cyan rounded-lg border border-neon-cyan/40 flex items-center justify-center font-black shadow-[0_0_15px_rgba(0,255,242,0.15)] z-20 text-[10px]">
                                            {String.fromCharCode(65 + i)}
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
                                        {currentQuestion.answer || "Scanning for conceptual resolution..."}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Pagination Indicator */}
                        <div className="mt-auto pt-12 flex justify-center gap-2 pb-4">
                            {questions.map((_: any, i: number) => (
                                <div 
                                    key={i} 
                                    className={`h-1 rounded-full transition-all duration-700 cursor-pointer ${i === currentIndex ? 'w-10 bg-neon-cyan shadow-[0_0_8px_rgba(0,255,242,0.8)]' : 'w-2 bg-white/10 hover:bg-white/30'}`}
                                    onClick={() => setCurrentIndex(i)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Verification Console */}
            <div className="flex flex-col md:flex-row items-center justify-between px-8 bg-zinc-900/40 border border-white/5 py-4 rounded-2xl shadow-xl">
                <div className="flex items-center gap-4 mb-4 md:mb-0">
                    <div className="relative">
                        <div className="w-2.5 h-2.5 rounded-full bg-neon-cyan shadow-[0_0_12px_rgba(0,255,242,0.6)] animate-pulse" />
                        <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-neon-cyan animate-ping opacity-40" />
                    </div>
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Neural_Processing_Stable</span>
                </div>
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                        <Terminal className="w-4 h-4 text-neon-violet/50" />
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-tight">Logic_Kernel_v9.2</span>
                    </div>
                    <div className="h-4 w-px bg-white/10" />
                    <div className="flex items-center gap-3">
                        <Zap className="w-4 h-4 text-neon-cyan/50" />
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Synthesis_Sync [1.2ms]</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

