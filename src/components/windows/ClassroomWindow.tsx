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
    <div className="max-w-6xl mx-auto space-y-16 animate-terra-in">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="flex items-center gap-8">
            <button 
                onClick={onClose}
                className="w-12 h-12 rounded-2xl border border-primary/5 bg-card flex items-center justify-center hover:bg-muted transition-all shadow-sm"
            >
                <ChevronLeft className="w-6 h-6 text-primary" />
            </button>
            <div className="space-y-1">
                <h2 className="text-4xl font-serif font-bold text-primary">{activeSet.title || activeSet.topic}</h2>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-accent">{questions.length} Concepts Synthesized</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/10" />
                    <span className="text-xs font-bold text-secondary/40 uppercase tracking-widest">Organic Stream Active</span>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-4">
            <button 
                onClick={() => onExport('pdf')}
                className="flex items-center gap-3 px-8 py-3.5 bg-primary text-primary-foreground rounded-2xl shadow-lg hover:opacity-90 transition-all font-bold text-sm"
            >
                <FileDown className="w-5 h-5" />
                <span>Export Synthesis</span>
            </button>
            <button 
                onClick={onShare}
                className="p-4 bg-card border border-primary/5 rounded-2xl text-secondary hover:bg-muted transition-all shadow-sm"
            >
                <Share2 className="w-5 h-5" />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Left Stats Rail */}
        <div className="space-y-8">
            <div className="bg-card border border-primary/5 p-8 rounded-[2rem] shadow-terra-soft space-y-10">
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-secondary/50 mb-6">Fidelity Metrics</h3>
                    <div className="space-y-5">
                        <div className="flex justify-between items-end">
                            <span className="text-xs font-bold text-secondary/70">Semantic Accuracy</span>
                            <span className="text-lg font-serif font-bold text-primary">98.4%</span>
                        </div>
                        <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden border border-primary/5">
                            <div className="h-full bg-primary transition-all duration-1000" style={{ width: '98.4%' }} />
                        </div>
                    </div>
                </div>

                <div className="pt-10 border-t border-primary/5 space-y-5">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/5 rounded-xl">
                            <Target className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-sm font-bold text-secondary/80">Domain: Research</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-accent/5 rounded-xl">
                            <ShieldCheck className="w-5 h-5 text-accent" />
                        </div>
                        <span className="text-sm font-bold text-secondary/80">Verified Archive</span>
                    </div>
                </div>
            </div>

            <div className="bg-card border border-primary/5 p-8 rounded-[2rem] shadow-terra-soft group cursor-pointer hover:shadow-xl transition-shadow">
                <h3 className="text-xs font-bold uppercase tracking-widest text-secondary/50 mb-8">Concept Map</h3>
                <div className="aspect-[4/3] bg-muted rounded-2xl border border-primary/5 relative overflow-hidden flex items-center justify-center">
                    <Map className="w-10 h-10 text-primary opacity-20 group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>
        </div>

        {/* Main Carousel View */}
        <div className="lg:col-span-3 space-y-10">
            <div className="bg-card border border-primary/5 min-h-[580px] relative rounded-[3.5rem] shadow-terra-soft flex flex-col items-center justify-center px-12 md:px-28 py-20 overflow-hidden">
                {/* Subtle background graphics */}
                <div className="absolute top-10 left-10 p-2 opacity-5">
                  <flask-conical className="w-48 h-48" />
                </div>
                
                <div className="absolute inset-y-0 left-6 flex items-center">
                    <button 
                        onClick={prevQuestion}
                        disabled={currentIndex === 0}
                        className="w-14 h-14 rounded-2xl border border-primary/5 bg-white flex items-center justify-center hover:bg-muted transition-all shadow-sm disabled:opacity-0 group"
                    >
                        <ChevronLeft className="w-7 h-7 text-secondary group-hover:text-primary transition-colors" />
                    </button>
                </div>

                <div className="absolute inset-y-0 right-6 flex items-center">
                    <button 
                        onClick={nextQuestion}
                        disabled={currentIndex === questions.length - 1}
                        className="w-14 h-14 rounded-2xl border border-primary/5 bg-white flex items-center justify-center hover:bg-muted transition-all shadow-sm disabled:opacity-0 group"
                    >
                        <ChevronRight className="w-7 h-7 text-secondary group-hover:text-primary transition-colors" />
                    </button>
                </div>

                {currentQuestion && (
                    <div className="space-y-14 animate-terra-in w-full text-center">
                        <div className="space-y-6">
                            <div className="inline-flex px-4 py-1.5 bg-primary/5 rounded-full border border-primary/10">
                              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Intelligence Unit {currentIndex + 1}</span>
                            </div>
                            <h4 className="text-4xl md:text-5xl font-serif font-bold text-primary leading-tight max-w-3xl mx-auto px-4">
                                {currentQuestion.question || currentQuestion.text}
                            </h4>
                        </div>

                        <div className="max-w-2xl mx-auto p-12 bg-muted/40 border border-primary/5 rounded-[2.5rem] relative shadow-sm">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-accent text-white text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-lg">
                                Synthesized Insight
                            </div>
                            <p className="text-xl font-serif text-secondary italic leading-relaxed opacity-90 mx-auto px-4">
                                "{currentQuestion.answer || "Synthesis pending deep archival verification..."}"
                            </p>
                        </div>
                    </div>
                )}

                <div className="absolute bottom-10 inset-x-0 flex justify-center gap-3">
                    {questions.map((_, i) => (
                        <div 
                            key={i} 
                            className={`h-1.5 rounded-full transition-all duration-700 ${i === currentIndex ? 'w-10 bg-primary' : 'w-2.5 bg-primary/10 hover:bg-primary/20 cursor-pointer'}`}
                            onClick={() => setCurrentIndex(i)}
                        />
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-between px-8 bg-muted/30 py-5 rounded-3xl border border-primary/5">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-lg shadow-primary/20 animate-pulse" />
                    <span className="text-xs font-bold text-secondary/60 uppercase tracking-widest">Active Stream Stable</span>
                </div>
                <div className="flex items-center gap-10">
                    <div className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-accent" />
                        <span className="text-xs font-bold text-secondary uppercase italic">Community Verified</span>
                    </div>
                    <div className="h-4 w-px bg-primary/10" />
                    <span className="text-[10px] font-bold text-secondary/40 uppercase tracking-widest">Organic Protocol 2.5a</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
