import React, { useState } from "react";
import { Upload, Plus, X, Cpu, FileText, Send, Loader2, Binary, GraduationCap, Target } from "lucide-react";
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
    <div className="max-w-5xl mx-auto space-y-12 animate-terra-in">
      <div className="flex flex-col lg:flex-row gap-8 items-stretch">
        {/* Control Panel (Tonal Background, No Borders) */}
        <div className="w-full lg:w-96 space-y-6">
          <div className="terra-card-tonal space-y-8 h-full">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary/60 mb-6">Discovery Mode</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveMode("scan")}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 ${
                    activeMode === "scan" 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" 
                    : "hover:bg-primary/10 text-secondary"
                  }`}
                >
                  <FileText className="w-5 h-5 opacity-80" />
                  <span className="text-sm font-bold">Document Scan</span>
                </button>
                <button
                  onClick={() => setActiveMode("topic")}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 ${
                    activeMode === "topic" 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" 
                    : "hover:bg-primary/10 text-secondary"
                  }`}
                >
                  <Cpu className="w-5 h-5 opacity-80" />
                  <span className="text-sm font-bold">Concept Mining</span>
                </button>
              </div>
            </div>

            {/* Parameter Selection (Embedded Tonal Layers) */}
            <div className="pt-8 space-y-8">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary/60 mb-4 flex items-center gap-2">
                  <Binary className="w-3 h-3" /> Academy Domain
                </h3>
                <select 
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full bg-background/50 border-none rounded-xl py-3.5 px-4 text-[13px] font-bold text-secondary shadow-sm hover:shadow-md transition-all cursor-pointer focus:ring-2 focus:ring-primary/20 appearance-none"
                >
                  {SUBJECTS.map(group => (
                    <optgroup key={group.group} label={group.group}>
                      {group.items.map(item => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary/60 mb-4 flex items-center gap-2">
                  <Target className="w-3 h-3" /> Targeting Exams
                </h3>
                <div className="flex flex-wrap gap-2">
                  {EXAMS.map(exam => (
                    <button
                      key={exam.id}
                      onClick={() => handleToggleExam(exam.id)}
                      className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all duration-300 ${
                        selectedExams.includes(exam.id)
                        ? "bg-accent text-accent-foreground shadow-sm ring-2 ring-accent/20"
                        : "bg-background text-secondary/50 hover:bg-secondary/5"
                      }`}
                    >
                      {exam.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary/60 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-3 h-3" /> Scholastic Grade
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {CLASSES.map(cls => (
                    <button
                      key={cls}
                      onClick={() => setSelectedClass(cls)}
                      className={`py-2 rounded-lg text-[10px] font-black transition-all ${
                        selectedClass === cls
                        ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20"
                        : "bg-background text-secondary/50 hover:bg-secondary/5"
                      }`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>
            </div>
        </div>

        {/* Main Interaction Area */}
        <div className="flex-1">
          <div className="bg-card min-h-[480px] flex flex-col rounded-[3rem] shadow-terra-soft p-2">
            <div className="flex-1 flex flex-col items-center justify-center p-14 relative bg-muted/20 rounded-[2.8rem]">
              {isIdle ? (
                activeMode === "scan" ? (
                  <label className="w-full cursor-pointer group">
                    <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                    <div className="flex flex-col items-center text-center space-y-10">
                      <div className="w-28 h-28 rounded-[2.5rem] bg-white flex items-center justify-center group-hover:scale-105 group-hover:rotate-3 transition-all duration-700 shadow-terra-soft">
                        <Upload className="w-12 h-12 text-primary" />
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-3xl font-serif font-bold text-primary">Ingest Research</h4>
                        <p className="text-secondary opacity-70 max-w-xs mx-auto leading-relaxed font-medium">
                          Upload handwritten notes or PDFs for organic knowledge synthesis.
                        </p>
                      </div>
                      <div className="px-10 py-3.5 rounded-2xl bg-primary text-primary-foreground text-sm font-bold shadow-lg group-hover:opacity-90 transition-all">
                        Select Research Files
                      </div>
                    </div>
                  </label>
                ) : (
                  <div className="w-full space-y-12">
                    <div className="text-center space-y-4">
                        <h4 className="text-3xl font-serif font-bold text-primary">Topic Synthesis</h4>
                        <p className="text-secondary opacity-70 max-w-xs mx-auto font-medium">
                            Define specific knowledge domains for deep extraction.
                        </p>
                    </div>

                    <div className="max-w-md mx-auto space-y-8">
                        <div className="relative">
                            <input 
                                type="text"
                                value={newTopic}
                                onChange={(e) => setNewTopic(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
                                placeholder="Enter a subject area..."
                                className="w-full bg-white rounded-3xl py-5 px-8 pr-20 text-sm outline-none focus:ring-8 focus:ring-primary/5 transition-all shadow-sm"
                            />
                            <button 
                                onClick={handleAddTopic}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-12 h-12 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                            >
                                <Plus className="w-7 h-7" />
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-3 justify-center min-h-[44px]">
                            {topics.map((t, i) => (
                                <div key={i} className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl shadow-sm animate-terra-in">
                                    <span className="text-sm font-bold text-secondary">{t}</span>
                                    <button onClick={() => handleRemoveTopic(i)} className="text-destructive hover:scale-125 transition-transform">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {topics.length > 0 && (
                            <button 
                                onClick={() => onTopicScan(topics, selectedSubject, selectedExams, selectedClass)}
                                className="w-full bg-primary text-primary-foreground py-5 rounded-3xl font-bold shadow-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                            >
                                <Send className="w-5 h-5" />
                                <span>Begin Synthesis</span>
                            </button>
                        )}
                    </div>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center text-center space-y-14 w-full max-w-sm">
                  <div className="relative">
                    <div className="w-36 h-36 rounded-[3rem] flex items-center justify-center overflow-hidden bg-white shadow-terra-soft">
                        <div 
                            className="absolute bottom-0 w-full bg-primary/10 transition-all duration-1000 ease-out"
                            style={{ height: `${progress}%` }}
                        />
                        <Cpu className={`w-14 h-14 text-primary relative z-10 ${status === 'processing' ? 'animate-pulse' : ''}`} />
                    </div>
                  </div>
                  
                  <div className="space-y-6 w-full">
                    <h4 className="text-2xl font-serif font-bold text-primary capitalize">{String(status || 'processing').replace('_', ' ')}...</h4>
                    <div className="w-full h-3 bg-white rounded-full overflow-hidden shadow-inner">
                        <div 
                            className="h-full bg-primary transition-all duration-700 ease-in-out" 
                            style={{ width: `${progress}%` }} 
                        />
                    </div>
                    <p className="text-sm font-bold text-secondary/60">
                        {progress}% Synthesis Complete
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-3 px-8 py-4 bg-white rounded-3xl shadow-sm">
                    <Loader2 className="w-5 h-5 text-accent animate-spin" />
                    <span className="text-sm font-bold text-accent">Aligning Knowledge Paths</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trust Quote */}
      <div className="flex flex-col items-center justify-center gap-4 opacity-50">
        <div className="h-px w-24 bg-primary/10" />
        <p className="text-xs font-serif italic text-secondary text-center max-w-xs">
          "The aim of science is not to open the door to infinite wisdom, but to set a limit to infinite error."
        </p>
        <div className="h-px w-24 bg-primary/10" />
      </div>
    </div>
  );
}
