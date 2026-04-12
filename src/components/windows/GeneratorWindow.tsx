import React, { useState } from "react";
import { Upload, Plus, X, Cpu, FileText, Send, Loader2, Binary, GraduationCap, Target, Zap, Waves, Boxes } from "lucide-react";
import { ScanStatus } from "../../lib/types";
import { SUBJECTS, EXAMS, CLASSES } from "../../lib/constants";

interface GeneratorWindowProps {
  onScan: (file: File, subject: string, exams: string[], targetClass: string) => Promise<void>;
  onTopicScan: (topics: string[], subject: string, exams: string[], targetClass: string) => Promise<void>;
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
  const [selectedSubject, setSelectedSubject] = useState("Chemistry");
  const [selectedExams, setSelectedExams] = useState<string[]>(["jee-mains"]);
  const [selectedClass, setSelectedClass] = useState("12");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onScan(file, selectedSubject, selectedExams, selectedClass);
  };

  const handleToggleExam = (id: string) => {
    setSelectedExams(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
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
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row gap-8 items-stretch">
        
        {/* Strategic Parameters Panel */}
        <aside className="w-full lg:w-80 space-y-6">
          <div className="synth-panel space-y-8">
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-6 px-2">Synthesis Protocol</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setActiveMode("scan")}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all duration-300 border ${
                    activeMode === "scan" 
                    ? "bg-primary/10 border-primary/40 text-primary shadow-[0_0_20px_rgba(0,255,242,0.1)]" 
                    : "bg-white/[0.02] border-transparent text-white/40 hover:bg-white/[0.05]"
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span className="text-[10px] font-bold">SCAN</span>
                </button>
                <button
                  onClick={() => setActiveMode("topic")}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all duration-300 border ${
                    activeMode === "topic" 
                    ? "bg-primary/10 border-primary/40 text-primary shadow-[0_0_20px_rgba(0,255,242,0.1)]" 
                    : "bg-white/[0.02] border-transparent text-white/40 hover:bg-white/[0.05]"
                  }`}
                >
                  <Cpu className="w-5 h-5" />
                  <span className="text-[10px] font-bold">TOPIC</span>
                </button>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 mb-3 flex items-center gap-2">
                  <Binary className="w-3 h-3" /> Academic Stream
                </label>
                <select 
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-3 px-4 text-xs font-bold text-white outline-none focus:border-primary/40 transition-all cursor-pointer"
                >
                  {SUBJECTS.map(group => (
                    <optgroup key={group.group} label={group.group} className="bg-background">
                      {group.items.map(item => (
                        <option key={item} value={item} className="bg-background">{item}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 mb-3 flex items-center gap-2">
                  <Target className="w-3 h-3" /> Target Exam
                </label>
                <div className="flex flex-wrap gap-2">
                  {EXAMS.map(exam => (
                    <button
                      key={exam.id}
                      onClick={() => handleToggleExam(exam.id)}
                      className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase border transition-all duration-300 ${
                        selectedExams.includes(exam.id)
                        ? "bg-accent/10 border-accent/40 text-accent"
                        : "bg-white/[0.02] border-transparent text-white/20 hover:text-white/40"
                      }`}
                    >
                      {exam.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 mb-3 flex items-center gap-2">
                  <GraduationCap className="w-3 h-3" /> Grade Level
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {CLASSES.map(cls => (
                    <button
                      key={cls}
                      onClick={() => setSelectedClass(cls)}
                      className={`py-2.5 rounded-lg text-[10px] font-bold border transition-all ${
                        selectedClass === cls
                        ? "bg-primary/10 border-primary/40 text-primary"
                        : "bg-white/[0.02] border-transparent text-white/20"
                      }`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Synthesis Core Interaction Area */}
        <main className="flex-1">
          <div className="synth-panel min-h-[520px] h-full flex flex-col p-2 bg-gradient-to-br from-white/[0.03] to-transparent">
            <div className="flex-1 flex flex-col items-center justify-center p-12 relative overflow-hidden rounded-[2.5rem]">
              
              {/* Decorative Pulse Ring */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[150%] h-[150%] bg-primary/[0.01] blur-[100px] rounded-full animate-pulse" />
              </div>

              {isIdle ? (
                activeMode === "scan" ? (
                  <label className="w-full cursor-pointer group">
                    <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                    <div className="flex flex-col items-center text-center space-y-8 relative z-10">
                      <div className="w-32 h-32 rounded-[2.5rem] bg-card border border-white/5 flex items-center justify-center group-hover:scale-110 group-hover:border-primary/30 group-hover:shadow-[0_0_40px_rgba(0,255,242,0.1)] transition-all duration-700">
                        <Upload className="w-12 h-12 text-primary" />
                      </div>
                      <div className="space-y-3">
                        <h4 className="text-3xl font-bold text-white tracking-tight">Ingest Intelligence</h4>
                        <p className="text-white/40 max-w-xs mx-auto text-sm font-medium leading-relaxed">
                          Process visual or digital documents for deep knowledge extraction.
                        </p>
                      </div>
                      <div className="synth-button-primary group-hover:brightness-125">
                        Initialize Matrix Scan
                      </div>
                    </div>
                  </label>
                ) : (
                  <div className="w-full max-w-lg space-y-12 relative z-10">
                    <div className="text-center space-y-3">
                        <h4 className="text-3xl font-bold text-white tracking-tight">Conceptual Mining</h4>
                        <p className="text-white/40 text-sm font-medium">
                            Define knowledge vectors for targeted generation.
                        </p>
                    </div>

                    <div className="space-y-8">
                        <div className="relative group">
                            <input 
                                type="text"
                                value={newTopic}
                                onChange={(e) => setNewTopic(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
                                placeholder="Subject keyword or detailed concept..."
                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-5 px-8 pr-20 text-sm font-medium text-white outline-none focus:border-primary/40 focus:bg-white/[0.05] transition-all"
                            />
                            <button 
                                onClick={handleAddTopic}
                                className="absolute right-3 top-2.5 w-10 h-10 bg-primary/20 text-primary border border-primary/20 rounded-xl flex items-center justify-center hover:bg-primary/30 transition-all"
                            >
                                <Plus className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2 justify-center min-h-[44px]">
                            {topics.map((t, i) => (
                                <div key={i} className="flex items-center gap-3 bg-white/[0.03] border border-white/10 pl-5 pr-3 py-2.5 rounded-xl animate-in zoom-in duration-300">
                                    <span className="text-[13px] font-bold text-white/80">{t}</span>
                                    <button 
                                      onClick={() => handleRemoveTopic(i)} 
                                      className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/5 text-white/20 hover:text-destructive transition-all"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {topics.length > 0 && (
                            <button 
                                onClick={() => onTopicScan(topics, selectedSubject, selectedExams, selectedClass)}
                                className="w-full synth-button-primary py-5 flex items-center justify-center gap-3"
                            >
                                <Zap className="w-4 h-4" />
                                <span>Execute Synthesis</span>
                            </button>
                        )}
                    </div>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center text-center space-y-12 w-full max-w-md relative z-10">
                  <div className="relative">
                    <div className="w-40 h-40 rounded-[3.5rem] bg-card border border-white/5 flex items-center justify-center relative overflow-hidden shadow-inner">
                        <div 
                            className="absolute bottom-0 w-full bg-primary/20 transition-all duration-1000 ease-out"
                            style={{ height: `${progress}%` }}
                        />
                        {/* Recursive Scan Line for Processing state */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/20 to-transparent h-24 animate-scan opacity-40" />
                        
                        <div className="flex flex-col items-center">
                          <Boxes className="w-14 h-14 text-primary mb-2" />
                          <span className="text-xl font-black text-primary tracking-tighter">{progress}%</span>
                        </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6 w-full">
                    <div className="flex flex-col items-center gap-2">
                      <h4 className="text-2xl font-bold text-white tracking-tight uppercase">
                        {String(status || 'processing').replace('_', ' ')}
                      </h4>
                      <p className="text-[10px] font-black tracking-[0.3em] text-primary animate-pulse">ALGORITHMIC EXTRACTION ACTIVE</p>
                    </div>

                    <div className="w-full h-1.5 bg-white/[0.03] rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-primary shadow-[0_0_15px_rgba(0,255,242,0.8)] transition-all duration-700 ease-in-out" 
                            style={{ width: `${progress}%` }} 
                        />
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-white/40">
                    <div className="flex items-center gap-2">
                      <Waves className="w-4 h-4 text-accent animate-pulse" />
                      <span className="text-[10px] font-bold tracking-widest uppercase">Deep Search</span>
                    </div>
                    <div className="w-px h-3 bg-white/10" />
                    <div className="flex items-center gap-2">
                      <Binary className="w-4 h-4 text-primary animate-bounce" />
                      <span className="text-[10px] font-bold tracking-widest uppercase">AI Synthesis</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Trust Quote / Footer */}
      <footer className="pt-12 flex flex-col items-center gap-4 opacity-30 group hover:opacity-100 transition-opacity">
        <div className="h-px w-32 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/60">
          Synthetic Knowledge Framework v2.4
        </p>
      </footer>
    </div>
  );
}

