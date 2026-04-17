import React, { useMemo, useState } from "react";
import { Search, Filter, ArrowRight, Clock, Hash, FileDown, FileText, Database, Shield } from "lucide-react";

interface LibraryWindowProps {
  history: any[];
  onSelect: (set: any) => void;
  onExport: (set: any, type: "pdf" | "docx") => void;
  loading: boolean;
}

function toTimestampLabel(rawTimestamp: any): string {
  const parsed = rawTimestamp?.toDate ? rawTimestamp.toDate() : new Date(rawTimestamp);
  if (!(parsed instanceof Date) || Number.isNaN(parsed.getTime())) {
    return "Unknown time";
  }
  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LibraryWindow({ history, onSelect, onExport, loading }: LibraryWindowProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "recent" | "question-rich">("all");

  const visibleSets = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return history.filter((set) => {
      const title = String(set.title || set.topicDetected || set.topic || "").toLowerCase();
      const subject = String(set.subject || "").toLowerCase();
      const keywordBlob = Array.isArray(set.keywords) ? set.keywords.join(" ").toLowerCase() : "";

      const matchesQuery = !normalizedQuery ||
        title.includes(normalizedQuery) ||
        subject.includes(normalizedQuery) ||
        keywordBlob.includes(normalizedQuery);

      if (!matchesQuery) return false;

      if (filterMode === "question-rich") {
        return (set.questions?.length || set.questionCount || 0) >= 20;
      }

      if (filterMode === "recent") {
        const rawDate = set.timestamp?.toDate ? set.timestamp.toDate() : new Date(set.timestamp);
        const ts = rawDate instanceof Date ? rawDate.getTime() : NaN;
        if (Number.isNaN(ts)) return false;
        const days30 = 30 * 24 * 60 * 60 * 1000;
        return Date.now() - ts <= days30;
      }

      return true;
    });
  }, [history, searchQuery, filterMode]);

  const cycleFilter = () => {
    setFilterMode((prev) => {
      if (prev === "all") return "recent";
      if (prev === "recent") return "question-rich";
      return "all";
    });
  };

  const filterLabel = filterMode === "all"
    ? "All"
    : filterMode === "recent"
      ? "Recent 30d"
      : "20+ Questions";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-8 min-h-[60vh]">
        <div className="relative">
          <div className="w-16 h-16 border-2 border-neon-cyan/5 border-t-neon-cyan rounded-full animate-spin" />
          <Database className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-neon-cyan/50 animate-pulse" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-neon-cyan animate-pulse">Accessing Archive</span>
          <span className="text-[8px] uppercase tracking-widest text-white/30">Loading your saved reports...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pb-8 border-b border-white/5">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-neon-cyan/10 p-2 rounded-lg">
              <Shield className="w-5 h-5 text-neon-cyan" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-neon-cyan/60">Personal Archive</span>
          </div>
          <div className="space-y-1">
            <h2 className="text-4xl font-display font-black text-white tracking-tight uppercase italic">History Vault</h2>
            <p className="text-white/40 font-medium text-sm">Every scan saved with topic, timestamp, and question count.</p>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
              {history.length.toString().padStart(2, "0")} Reports
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative group flex-grow md:flex-grow-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-neon-cyan transition-colors" />
            <input
              type="text"
              placeholder="Search topic, subject, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-900/50 border border-white/5 rounded-xl py-3 pl-12 pr-6 text-sm text-white placeholder:text-white/20 outline-none focus:border-neon-cyan/30 focus:ring-4 focus:ring-neon-cyan/5 transition-all w-full md:w-72"
            />
          </div>
          <button
            onClick={cycleFilter}
            className="p-3.5 rounded-xl bg-zinc-900/50 border border-white/5 hover:border-white/10 text-white/40 hover:text-white transition-all shadow-xl"
            title={`Filter: ${filterLabel}`}
          >
            <Filter className="w-4 h-4" />
          </button>
          <div className="px-3 py-2 rounded-xl bg-zinc-900/50 border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
            {filterLabel}
          </div>
        </div>
      </div>

      {visibleSets.length === 0 ? (
        <div className="synth-glass p-24 rounded-[2rem] text-center space-y-10 border border-white/5 bg-zinc-900/20">
          <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto border border-white/5 group overflow-hidden relative">
            <div className="absolute inset-0 bg-neon-violet/10 animate-pulse" />
            <Database className="w-10 h-10 text-white/20 group-hover:text-neon-violet transition-colors duration-700 relative z-10" />
          </div>
          <div className="space-y-4">
            <h4 className="text-2xl font-bold text-white tracking-tight">NO SAVED REPORTS</h4>
            <p className="text-white/30 max-w-xs mx-auto text-sm leading-relaxed">
              {searchQuery.trim()
                ? "No reports match your current search/filter settings."
                : "Run your first scan to create a saved report in history."}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-[0.25em] text-white/40">
            History is user-specific and private
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleSets.map((set) => (
            <div
              key={set.id}
              onClick={() => onSelect(set)}
              className="group relative bg-[#0a0a0a] border border-white/5 hover:border-neon-cyan/30 rounded-2xl p-6 transition-all duration-500 cursor-pointer overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-neon-cyan/10 group-hover:text-neon-cyan transition-all duration-500 border border-white/5">
                      <Hash className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] uppercase tracking-widest font-bold text-white/30">Report</span>
                      <span className="text-[10px] font-mono font-bold text-white/60">#REP_{String(set.id || "").slice(0, 6)}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-neon-cyan transition-all translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100" />
                </div>

                <div className="space-y-3 flex-grow">
                  <h3 className="text-lg font-bold text-white group-hover:text-neon-cyan transition-colors line-clamp-2 leading-tight tracking-tight">
                    {set.title || set.topicDetected || set.topic || "Unknown Topic"}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-violet shadow-[0_0_8px_rgba(184,112,255,0.6)]" />
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] italic">
                      {set.subject || "General"}
                    </span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-white/20" />
                      <span className="text-[10px] font-bold text-white/40 tracking-tight">
                        {toTimestampLabel(set.timestamp)}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-tight">
                      {(set.questionCount || set.questions?.length || 0)} questions
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); onExport(set, "pdf"); }}
                      className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-neon-cyan transition-colors"
                      title="Export PDF"
                    >
                      <FileDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onExport(set, "docx"); }}
                      className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-neon-violet transition-colors"
                      title="Export Word"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
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

