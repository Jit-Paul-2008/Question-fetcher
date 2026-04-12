import React from "react";
import { BookOpen, Search, Filter, ArrowRight, Clock, Hash, FileDown, FileText, Database, Shield } from "lucide-react";

interface LibraryWindowProps {
  history: any[];
  onSelect: (set: any) => void;
  onExport: (set: any, type: 'pdf' | 'docx') => void;
  loading: boolean;
}

export function LibraryWindow({
  history,
  onSelect,
  onExport,
  loading
}: LibraryWindowProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-8 min-h-[60vh]">
        <div className="relative">
          <div className="w-16 h-16 border-2 border-neon-cyan/5 border-t-neon-cyan rounded-full animate-spin" />
          <Database className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-neon-cyan/50 animate-pulse" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-neon-cyan animate-pulse">Accessing Vault</span>
          <span className="text-[8px] uppercase tracking-widest text-white/30">Decrypting Archive Headers...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Vault Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pb-8 border-b border-white/5">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="bg-neon-cyan/10 p-2 rounded-lg">
                <Shield className="w-5 h-5 text-neon-cyan" />
             </div>
             <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-neon-cyan/60">Secure Storage</span>
          </div>
          <div className="space-y-1">
            <h2 className="text-4xl font-display font-black text-white tracking-tight uppercase italic">Archive Vault</h2>
            <p className="text-white/40 font-medium text-sm">Long-term persistence for synthesized chemical research data.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative group flex-grow md:flex-grow-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-neon-cyan transition-colors" />
                <input 
                    type="text" 
                    placeholder="Query archives..."
                    className="bg-zinc-900/50 border border-white/5 rounded-xl py-3 pl-12 pr-6 text-sm text-white placeholder:text-white/20 outline-none focus:border-neon-cyan/30 focus:ring-4 focus:ring-neon-cyan/5 transition-all w-full md:w-72"
                />
            </div>
            <button className="p-3.5 rounded-xl bg-zinc-900/50 border border-white/5 hover:border-white/10 text-white/40 hover:text-white transition-all shadow-xl">
                <Filter className="w-4 h-4" />
            </button>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="synth-glass p-24 rounded-[2rem] text-center space-y-10 border border-white/5 bg-zinc-900/20">
            <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto border border-white/5 group overflow-hidden relative">
                <div className="absolute inset-0 bg-neon-violet/10 animate-pulse" />
                <Database className="w-10 h-10 text-white/20 group-hover:text-neon-violet transition-colors duration-700 relative z-10" />
            </div>
            <div className="space-y-4">
                <h4 className="text-2xl font-bold text-white tracking-tight">VAULT IS EMPTY</h4>
                <p className="text-white/30 max-w-xs mx-auto text-sm leading-relaxed">No research sequences found in the persistent buffer. Complete a synthesis to archive your first find.</p>
            </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.map((set, idx) => (
            <div
              key={set.id}
              onClick={() => onSelect(set)}
              className="group relative bg-[#0a0a0a] border border-white/5 hover:border-neon-cyan/30 rounded-2xl p-6 transition-all duration-500 cursor-pointer overflow-hidden"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* Highlight Effect */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-neon-cyan/10 group-hover:text-neon-cyan transition-all duration-500 border border-white/5">
                            <Hash className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] uppercase tracking-widest font-bold text-white/30">Sector</span>
                            <span className="text-[10px] font-mono font-bold text-white/60">#SAV_{set.id.slice(0, 6)}</span>
                        </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-neon-cyan transition-all translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100" />
                </div>

                <div className="space-y-3 flex-grow">
                  <h3 className="text-lg font-bold text-white group-hover:text-neon-cyan transition-colors line-clamp-2 leading-tight tracking-tight">
                    {set.title || set.topic || "UNKNOWN SEQUENCE"}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-violet shadow-[0_0_8px_rgba(184,112,255,0.6)]" />
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] italic">Laboratory Archive</span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-white/20" />
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">
                                {new Date(set.timestamp?.toDate ? set.timestamp.toDate() : set.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                             <button 
                                onClick={(e) => { e.stopPropagation(); onExport(set, 'pdf'); }}
                                className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-neon-cyan transition-colors"
                                title="Export PDF"
                             >
                                <FileDown className="w-4 h-4" />
                             </button>
                             <button 
                                onClick={(e) => { e.stopPropagation(); onExport(set, 'docx'); }}
                                className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-neon-violet transition-colors"
                                title="Export Word"
                             >
                                <FileText className="w-4 h-4" />
                             </button>
                        </div>
                    </div>
                    <div className="px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
                        <span className="text-[10px] font-mono font-bold text-neon-cyan">{String(set.questions?.length || 0).padStart(2, '0')}</span>
                    </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

