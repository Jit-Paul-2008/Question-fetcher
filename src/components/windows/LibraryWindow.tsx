import React from "react";
import { BookOpen, Search, Filter, ArrowRight, Clock, Hash, ChevronRight } from "lucide-react";

interface LibraryWindowProps {
  history: any[];
  onSelect: (set: any) => void;
  loading: boolean;
}

export function LibraryWindow({
  history,
  onSelect,
  loading
}: LibraryWindowProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-6">
        <div className="w-12 h-12 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-royal-bronze opacity-40">Decrypting Archives...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-end gap-8">
        <div>
          <h2 className="text-4xl font-serif text-royal-gradient mb-2">Knowledge Archives</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-royal-bronze opacity-60">Complete history of generated intelligence units</p>
        </div>

        <div className="flex items-center gap-4">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-royal-bronze/40" />
                <input 
                    type="text" 
                    placeholder="Search archives..."
                    className="bg-card/40 border border-accent/10 rounded-full py-2.5 pl-12 pr-6 text-xs outline-none focus:border-accent/40 transition-all w-64"
                />
            </div>
            <button className="p-2.5 rounded-full border border-accent/10 hover:bg-accent/5 transition-all">
                <Filter className="w-4 h-4 text-royal-bronze" />
            </button>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="glass-card p-24 text-center space-y-8">
            <div className="w-20 h-20 bg-accent/5 border border-accent/10 rounded-full flex items-center justify-center mx-auto opacity-50">
                <BookOpen className="w-8 h-8 text-royal-bronze" />
            </div>
            <div className="space-y-2">
                <h4 className="text-xl font-serif text-royal-bronze">The Archives are Empty</h4>
                <p className="text-sm text-royal-bronze/40 max-w-xs mx-auto">Initiate a intelligence extraction to populate your private library.</p>
            </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.map((set) => (
            <button
              key={set.id}
              onClick={() => onSelect(set)}
              className="glass-card p-8 text-left group hover:scale-[1.02] hover:shadow-royal-glow transition-all duration-500 relative overflow-hidden text-card-foreground"
            >
              <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-5 h-5 text-accent" />
              </div>
              
              <div className="space-y-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-accent/5 border border-accent/10 rounded-royal-lg group-hover:bg-primary transition-colors">
                        <Hash className="w-3 h-3 text-royal-bronze group-hover:text-primary-foreground" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-royal-bronze opacity-40">Set ID: {set.id.slice(0, 8)}</span>
                </div>

                <h3 className="text-lg font-serif group-hover:text-accent transition-colors line-clamp-1">{set.title || set.topic || "Untitled Extraction"}</h3>

                <div className="flex items-center justify-between pt-6 border-t border-accent/10">
                    <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-royal-bronze/40" />
                        <span className="text-[10px] font-bold text-royal-bronze/60 uppercase">{new Date(set.timestamp?.toDate ? set.timestamp.toDate() : set.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-accent/5 rounded-full border border-accent/10">
                        <span className="text-[9px] font-black text-accent">{set.questions?.length || 0} UNITS</span>
                        <ChevronRight className="w-2 h-2 text-accent" />
                    </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
