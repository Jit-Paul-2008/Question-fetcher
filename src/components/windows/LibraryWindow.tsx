import React from "react";
import { BookOpen, Search, Filter, ArrowRight, Clock, Hash, FileDown, FileText } from "lucide-react";

interface LibraryWindowProps {
  history: any[];
  onSelect: (set: any) => void;
  onExport: (set: any, type: 'pdf' | 'docx') => void;
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
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary opacity-40">Opening Archives...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-16">
      <div className="flex flex-col md:flex-row justify-between items-end gap-10">
        <div className="space-y-2">
          <h2 className="text-5xl font-serif font-bold text-primary">Research Archives</h2>
          <p className="text-secondary opacity-60 font-medium italic">A curated collection of your organic discoveries.</p>
        </div>

        <div className="flex items-center gap-4">
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/40 group-focus-within:text-primary transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search discovery history..."
                    className="bg-card rounded-2xl py-3.5 pl-12 pr-6 text-sm outline-none focus:ring-8 focus:ring-primary/5 transition-all w-72 shadow-sm"
                />
            </div>
            <button className="p-3.5 rounded-2xl bg-card hover:bg-muted transition-all shadow-sm">
                <Filter className="w-4 h-4 text-secondary" />
            </button>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="bg-card p-24 rounded-[3rem] text-center space-y-10 shadow-terra-soft">
            <div className="w-24 h-24 bg-muted/50 rounded-[2.5rem] flex items-center justify-center mx-auto">
                <BookOpen className="w-10 h-10 text-primary opacity-40" />
            </div>
            <div className="space-y-3">
                <h4 className="text-2xl font-serif font-bold text-secondary">The Archives are Silent</h4>
                <p className="text-secondary/50 max-w-xs mx-auto font-medium">Begin a new synthesis to populate your private research collection.</p>
            </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {history.map((set) => (
            <button
              key={set.id}
              onClick={() => onSelect(set)}
              className="bg-card p-8 text-left group hover:-translate-y-1.5 transition-all duration-700 rounded-[2.5rem] shadow-terra-soft relative overflow-hidden flex flex-col items-start"
            >
              <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-2 group-hover:translate-x-0">
                <ArrowRight className="w-6 h-6 text-primary" />
              </div>
              
              <div className="space-y-8 w-full">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/5 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                        <Hash className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-secondary/40">Ref: {set.id.slice(0, 8)}</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-serif font-bold text-secondary group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                    {set.title || set.topic || "Untitled Synthesis"}
                  </h3>
                  <p className="text-xs font-medium text-secondary/40 uppercase tracking-wider italic">Research Material</p>
                </div>

                 <div className="flex items-center justify-between pt-8 w-full">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-secondary/30" />
                            <span className="text-xs font-bold text-secondary/50">{new Date(set.timestamp?.toDate ? set.timestamp.toDate() : set.timestamp).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <button 
                                onClick={(e) => { e.stopPropagation(); onExport(set, 'pdf'); }}
                                className="p-2 hover:bg-primary/5 rounded-lg text-primary transition-colors"
                             >
                                <FileDown className="w-4 h-4" />
                             </button>
                             <button 
                                onClick={(e) => { e.stopPropagation(); onExport(set, 'docx'); }}
                                className="p-2 hover:bg-primary/5 rounded-lg text-accent transition-colors"
                             >
                                <FileText className="w-4 h-4" />
                             </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-xl">
                        <span className="text-xs font-bold text-primary">{set.questions?.length || 0} Units</span>
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
