import React, { useState } from "react";
import { Upload, Plus, X, Cpu, FileText, Send, Loader2 } from "lucide-react";
import { ScanStatus } from "../../lib/types";

interface GeneratorWindowProps {
  onScan: (file: File) => Promise<void>;
  onTopicScan: (topics: string[]) => Promise<void>;
  status: ScanStatus;
  progress: number;
}

export function GeneratorWindow({
  onScan,
  onTopicScan,
  status,
  progress
}: GeneratorWindowProps) {
  const [activeMode, setActiveMode] = useState<"scan" | "topic">("scan");
  const [topics, setTopics] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onScan(file);
  };

  const handleAddTopic = () => {
    if (newTopic && topics.length < 5) {
      setTopics([...topics, newTopic]);
      setNewTopic("");
    }
  };

  const handleRemoveTopic = (index: number) => {
    setTopics(topics.filter((_, i) => i !== index));
  };

  const isIdle = status === "idle";
  const isProcessing = ["uploading", "processing"].includes(status);

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row gap-8 items-stretch">
        {/* Left Control Panel */}
        <div className="w-full md:w-80 space-y-4">
          <div className="glass-card p-6 space-y-6">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-royal-bronze mb-4 opacity-40">Intelligence Mode</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveMode("scan")}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-royal-lg transition-all ${
                    activeMode === "scan" 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "hover:bg-accent/5 text-royal-bronze"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Document Scan</span>
                </button>
                <button
                  onClick={() => setActiveMode("topic")}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-royal-lg transition-all ${
                    activeMode === "topic" 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "hover:bg-accent/5 text-royal-bronze"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Topic Mining</span>
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-accent/10">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-royal-bronze mb-4 opacity-40">Neural Status</h3>
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-royal-bronze opacity-80">
                  {status === 'idle' ? 'Ready for Input' : status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Interaction Area */}
        <div className="flex-1">
          <div className="glass-card min-h-[400px] flex flex-col p-1">
            <div className="flex-1 flex flex-col items-center justify-center p-12 relative">
              {isIdle ? (
                activeMode === "scan" ? (
                  <label className="w-full cursor-pointer group">
                    <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                    <div className="flex flex-col items-center text-center space-y-8">
                      <div className="w-24 h-24 rounded-full bg-accent/5 border border-accent/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-accent/10 transition-all duration-500 group-hover:shadow-royal-glow">
                        <Upload className="w-10 h-10 text-accent" />
                      </div>
                      <div>
                        <h4 className="text-2xl font-serif text-foreground mb-4">Ingest Research Material</h4>
                        <p className="text-sm text-royal-bronze opacity-50 max-w-xs mx-auto leading-relaxed">
                          Securely upload your handwritten notes or PDF documents for deep analytical processing.
                        </p>
                      </div>
                      <div className="px-6 py-2 rounded-full border border-accent/20 text-[10px] font-black uppercase tracking-widest text-royal-bronze group-hover:border-accent/40 transition-colors">
                        Drop Files or Click
                      </div>
                    </div>
                  </label>
                ) : (
                  <div className="w-full space-y-12">
                    <div className="text-center space-y-4">
                        <h4 className="text-2xl font-serif text-foreground">Strategic Topic Mining</h4>
                        <p className="text-sm text-royal-bronze opacity-50 max-w-xs mx-auto">
                            Identify specific knowledge domains for intelligence extraction.
                        </p>
                    </div>

                    <div className="max-w-md mx-auto space-y-6">
                        <div className="relative">
                            <input 
                                type="text"
                                value={newTopic}
                                onChange={(e) => setNewTopic(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
                                placeholder="Enter knowledge domain..."
                                className="w-full bg-background/30 border border-accent/20 rounded-royal-xl py-5 px-6 pr-16 text-sm outline-none focus:border-accent/40 transition-all"
                            />
                            <button 
                                onClick={handleAddTopic}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary text-primary-foreground rounded-lg flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                            >
                                <Plus className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2 justify-center">
                            {topics.map((t, i) => (
                                <div key={i} className="flex items-center gap-2 bg-accent/10 border border-accent/20 px-4 py-2 rounded-full animate-in fade-in slide-in-from-bottom-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-royal-bronze">{t}</span>
                                    <button onClick={() => handleRemoveTopic(i)} className="hover:text-red-500 transition-colors">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {topics.length > 0 && (
                            <button 
                                onClick={() => onTopicScan(topics)}
                                className="w-full bg-primary text-primary-foreground py-4 rounded-royal-xl font-black uppercase tracking-[0.2em] text-[10px] shadow-royal-glow hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                            >
                                <Send className="w-4 h-4" />
                                Initiate Extraction
                            </button>
                        )}
                    </div>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center text-center space-y-12 w-full max-w-sm">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full border-2 border-accent/10 flex items-center justify-center overflow-hidden">
                        <div 
                            className="absolute bottom-0 w-full bg-accent/20 transition-all duration-700 ease-out"
                            style={{ height: `${progress}%` }}
                        />
                        <Cpu className={`w-12 h-12 text-accent relative z-10 ${status === 'processing' ? 'animate-pulse' : ''}`} />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-xl font-serif text-foreground uppercase tracking-widest">{status.replace('_', ' ')}...</h4>
                    <div className="w-full h-1 bg-accent/10 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-primary transition-all duration-500" 
                            style={{ width: `${progress}%` }} 
                        />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-royal-bronze opacity-40">
                        {progress}% Intelligence Synchronized
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-3 px-6 py-3 bg-accent/5 border border-accent/10 rounded-royal-lg">
                    <Loader2 className="w-4 h-4 text-accent animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent">Establishing Neural Link</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Security Disclaimer */}
      <div className="flex items-center justify-center gap-8 opacity-40">
        <div className="h-px w-12 bg-royal-bronze" />
        <span className="text-[8px] font-black uppercase tracking-[0.5em] text-royal-bronze">End-to-End Encryption Enabled</span>
        <div className="h-px w-12 bg-royal-bronze" />
      </div>
    </div>
  );
}
