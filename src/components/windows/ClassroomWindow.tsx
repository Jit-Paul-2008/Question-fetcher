import React, { useState } from "react";
import { ChevronLeft, ChevronRight, FileDown, Share2, Map, Users, Target, ShieldCheck } from "lucide-react";

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
        <div className="flex flex-col items-center justify-center p-24 text-center glass-card">
            <Users className="w-12 h-12 text-royal-bronze opacity-20 mb-6" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-royal-bronze opacity-40">No Active Intelligence Stream</span>
        </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in zoom-in-95 duration-700">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
            <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full border border-accent/20 flex items-center justify-center hover:bg-accent/5 transition-all"
            >
                <ChevronLeft className="w-5 h-5 text-royal-bronze" />
            </button>
            <div>
                <h2 className="text-3xl font-serif text-royal-gradient">{activeSet.title || activeSet.topic}</h2>
                <div className="flex items-center gap-4 mt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent">{questions.length} Units</span>
                    <div className="w-1 h-1 rounded-full bg-royal-bronze/20" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-royal-bronze opacity-40">Operation: Active</span>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-3">
            <button 
                onClick={() => onExport('pdf')}
                className="flex items-center gap-3 px-6 py-2.5 bg-card/40 border border-accent/10 rounded-royal-lg hover:bg-accent/5 transition-all group"
            >
                <FileDown className="w-4 h-4 text-royal-bronze group-hover:text-accent transition-colors" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-royal-bronze">Export Intelligence</span>
            </button>
            <button 
                onClick={onShare}
                className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-royal-lg text-amber-500 hover:bg-amber-500/20 transition-all"
            >
                <Share2 className="w-4 h-4" />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Stats Rail */}
        <div className="space-y-6">
            <div className="glass-card p-6 space-y-8">
                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-royal-bronze mb-4 opacity-40">Precision Metrics</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-bold text-royal-bronze/60 uppercase">Confidence</span>
                            <span className="text-sm font-serif text-accent">98.4%</span>
                        </div>
                        <div className="w-full h-1 bg-accent/5 rounded-full overflow-hidden">
                            <div className="h-full bg-accent w-[98.4%]" />
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-accent/10 space-y-4">
                    <div className="flex items-center gap-3">
                        <Target className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-royal-bronze">Sector: Chemistry</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-4 h-4 text-amber-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-royal-bronze">Verified Asset</span>
                    </div>
                </div>
            </div>

            <div className="glass-card p-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-royal-bronze mb-6 opacity-40">Knowledge Map</h3>
                <div className="aspect-square bg-accent/5 rounded-royal-lg border border-accent/10 relative overflow-hidden flex items-center justify-center group cursor-pointer">
                    <Map className="w-8 h-8 text-royal-bronze opacity-20 group-hover:scale-110 group-hover:text-accent transition-all duration-700" />
                    <div className="absolute inset-0 bg-royal-gradient opacity-0 group-hover:opacity-5 transition-opacity" />
                </div>
            </div>
        </div>

        {/* Main Carousel View */}
        <div className="lg:col-span-3 space-y-8">
            <div className="glass-card min-h-[500px] relative overflow-hidden flex flex-col items-center justify-center px-12 md:px-24">
                <div className="absolute top-0 left-0 p-8 text-[8px] font-black uppercase tracking-[0.4em] text-royal-bronze opacity-20">
                    Sovereign Intelligence Display // Unit {currentIndex + 1}
                </div>
                
                <div className="absolute inset-y-0 left-0 w-24 flex items-center justify-center">
                    <button 
                        onClick={prevQuestion}
                        disabled={currentIndex === 0}
                        className="w-12 h-12 rounded-full border border-accent/10 flex items-center justify-center hover:bg-accent/5 transition-all disabled:opacity-0 group"
                    >
                        <ChevronLeft className="w-6 h-6 text-royal-bronze group-hover:text-accent transition-colors" />
                    </button>
                </div>

                <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-center">
                    <button 
                        onClick={nextQuestion}
                        disabled={currentIndex === questions.length - 1}
                        className="w-12 h-12 rounded-full border border-accent/10 flex items-center justify-center hover:bg-accent/5 transition-all disabled:opacity-0 group"
                    >
                        <ChevronRight className="w-6 h-6 text-royal-bronze group-hover:text-accent transition-colors" />
                    </button>
                </div>

                {currentQuestion && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-700 bg-emerald-text">
                        <div className="space-y-4 text-center">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent opacity-60">Strategic Question</span>
                            <h4 className="text-3xl md:text-5xl font-serif text-foreground leading-tight max-w-2xl mx-auto">
                                {currentQuestion.question || currentQuestion.text}
                            </h4>
                        </div>

                        <div className="max-w-xl mx-auto p-12 bg-accent/5 border border-accent/10 rounded-royal-2xl relative group">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-[8px] font-black uppercase tracking-widest rounded-full shadow-lg">
                                Expert Analysis
                            </div>
                            <p className="text-lg font-serif text-royal-bronze leading-relaxed italic opacity-80 text-center">
                                {currentQuestion.answer || "Historical data point pending verification..."}
                            </p>
                        </div>
                    </div>
                )}

                <div className="absolute bottom-0 inset-x-0 p-8 flex justify-center gap-2">
                    {questions.map((_, i) => (
                        <div 
                            key={i} 
                            className={`h-0.5 transition-all duration-700 ${i === currentIndex ? 'w-8 bg-accent' : 'w-2 bg-accent/10'}`} 
                        />
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-between px-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-royal-bronze opacity-40">Secure Stream: Active</span>
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-royal-glow" />
                        <span className="text-[10px] font-bold text-royal-bronze uppercase">Neural Link Stable</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-[10px] font-bold text-royal-bronze uppercase">Vortex encryption 256v</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
