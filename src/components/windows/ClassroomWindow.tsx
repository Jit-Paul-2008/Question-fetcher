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
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                           <div className="bg-background rounded-2xl p-5 space-y-2">
                                <span className="text-[9px] font-black uppercase tracking-tighter text-primary/40 block">Vantage Year</span>
                                <p className="text-xs font-bold text-secondary">{currentQuestion?.year || "Active"}</p>
                           </div>
                           <div className="bg-background rounded-2xl p-5 space-y-2">
                                <span className="text-[9px] font-black uppercase tracking-tighter text-primary/40 block">Taxonomy</span>
                                <p className="text-xs font-bold text-secondary uppercase">{currentQuestion?.type || "MCQ"}</p>
                           </div>
                        </div>
                    </div>
                </div>

                <div className="pt-8">
                    <button className="w-full flex items-center justify-between p-5 bg-background/50 hover:bg-primary hover:text-white rounded-2xl transition-all shadow-sm group">
                        <div className="flex items-center gap-4">
                            <Map className="w-5 h-5 text-accent group-hover:text-white" />
                            <span className="text-xs font-bold">Relational Map</span>
                        </div>
                        <ExternalLink className="w-4 h-4 opacity-20" />
                    </button>
                </div>
            </div>
        </div>

        {/* Synthesis Carousel View */}
        <div className="lg:col-span-9 space-y-8">
            <div className="terra-glass min-h-[650px] relative rounded-[4rem] flex flex-col items-center justify-start p-10 md:p-20 overflow-hidden">
                {/* Navigation Controls (Embedded Tonal) */}
                <div className="absolute inset-y-0 left-6 flex items-center z-10">
                    <button 
                        onClick={prevQuestion}
                        disabled={currentIndex === 0}
                        className="w-16 h-16 rounded-3xl bg-background/50 backdrop-blur-md flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-lg disabled:opacity-0 group"
                    >
                        <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
                    </button>
                </div>

                <div className="absolute inset-y-0 right-6 flex items-center z-10">
                    <button 
                        onClick={nextQuestion}
                        disabled={currentIndex === questions.length - 1}
                        className="w-16 h-16 rounded-3xl bg-background/50 backdrop-blur-md flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-lg disabled:opacity-0 group"
                    >
                        <ChevronRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                {currentQuestion && (
                    <div className="space-y-16 animate-terra-in w-full max-w-4xl mx-auto flex flex-col h-full">
                        <div className="text-center space-y-10 pt-4">
                            <div className="inline-flex px-6 py-2 bg-primary/10 rounded-full">
                              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Intelligence Node {currentIndex + 1}</span>
                            </div>
                            <h4 className="text-3xl md:text-5xl font-serif font-black text-primary leading-[1.2] tracking-tight">
                                {currentQuestion.text}
                            </h4>
                        </div>

                        {/* Options Layer (Grid layout for MCQs) */}
                        {currentQuestion.options && currentQuestion.options.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full pt-10">
                                {currentQuestion.options.map((opt: string, i: number) => (
                                    <div key={i} className="group relative">
                                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-accent text-white rounded-xl flex items-center justify-center font-black shadow-lg shadow-accent/20 z-10 text-xs">
                                            {String.fromCharCode(65 + i)}
                                        </div>
                                        <div className="bg-background/80 hover:bg-background p-8 pl-12 rounded-[2rem] transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 text-sm font-bold text-secondary/80 leading-relaxed">
                                            {opt}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center pt-10">
                                <div className="max-w-2xl w-full p-12 bg-muted/40 rounded-[3rem] relative shadow-inner">
                                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-8 py-2.5 bg-accent text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl">
                                        Synthesis Resolution
                                    </div>
                                    <p className="text-2xl font-serif text-secondary/90 italic leading-relaxed text-center px-4 pt-4">
                                        "{currentQuestion.answer || "Scanning for conceptual resolution..."}"
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Answer Disclosure (Only if options exist) */}
                        {currentQuestion.options && currentQuestion.options.length > 0 && (
                            <div className="mt-auto pt-16 flex justify-center">
                                <button className="group relative overflow-hidden bg-muted/60 hover:bg-accent hover:text-white px-12 py-5 rounded-[2rem] transition-all duration-500 font-black text-xs uppercase tracking-[0.3em]">
                                    <span className="relative z-10">Reveal Verified Answer</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div className="absolute bottom-10 inset-x-0 flex justify-center gap-3">
                    {questions.map((_, i) => (
                        <div 
                            key={i} 
                            className={`h-2 rounded-full transition-all duration-700 cursor-pointer ${i === currentIndex ? 'w-12 bg-primary' : 'w-3 bg-primary/20 hover:bg-primary/40'}`}
                            onClick={() => setCurrentIndex(i)}
                        />
                    ))}
                </div>
            </div>

            {/* Verification Bar */}
            <div className="flex items-center justify-between px-10 bg-muted/20 py-6 rounded-[2.5rem]">
                <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_15px_rgba(74,124,89,0.4)] animate-pulse" />
                    <span className="text-[10px] font-black text-secondary/60 uppercase tracking-[0.2em]">Neural Processing Online</span>
                </div>
                <div className="flex items-center gap-12">
                    <div className="flex items-center gap-3 opacity-60">
                        <Users className="w-5 h-5 text-accent" />
                        <span className="text-[10px] font-black text-secondary uppercase tracking-tight">Verified Community Pool</span>
                    </div>
                    <div className="h-5 w-px bg-primary/10" />
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-primary opacity-60" />
                        <span className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">Protocol V3.2 Stable</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

