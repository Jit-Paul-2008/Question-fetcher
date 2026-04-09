/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  Search, 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Camera,
  X,
  ChevronRight,
  BookOpen,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { scanChemistryNote, ScanResult } from "@/src/lib/gemini";
import { generateQuestionsPDF } from "@/src/lib/pdf";
import { generateQuestionsDocx } from "@/src/lib/docx";

const EXAM_OPTIONS = [
  { id: "jee-mains", label: "JEE Mains" },
  { id: "jee-advanced", label: "JEE Advanced" },
  { id: "cbse-12", label: "12th CBSE" },
  { id: "cbse-10", label: "10th CBSE" },
  { id: "icse-10", label: "10th ICSE" },
  { id: "isc-12", label: "12th ISC" },
  { id: "wbsche-12", label: "12th WBSCHE" },
];

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleExam = (examId: string) => {
    setSelectedExams(prev => 
      prev.includes(examId) 
        ? prev.filter(id => id !== examId) 
        : [...prev, examId]
    );
  };

  const startScan = async () => {
    if (!image) {
      toast.error("Please upload an image first");
      return;
    }
    if (!topic) {
      toast.error("Please enter a topic reference");
      return;
    }
    if (selectedExams.length === 0) {
      toast.error("Please select at least one exam");
      return;
    }

    setIsScanning(true);
    try {
      const scanResult = await scanChemistryNote(image, topic, selectedExams);
      setResult(scanResult);
      toast.success("Scan completed successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to scan image. Please try again.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleDownload = () => {
    if (result) {
      generateQuestionsPDF(result.topicDetected || topic, result.questions);
      toast.success("PDF generated and downloading...");
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans selection:bg-blue-100">
      {/* macOS-style Background Blur Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200/30 rounded-full blur-[120px]" />
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* App Version: 1.0.1 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4 px-3 py-1 border-blue-200 bg-blue-50/50 text-blue-600 font-medium tracking-wide uppercase text-[10px]">
            AI-Powered Note Analyzer
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4 bg-gradient-to-b from-[#1D1D1F] to-[#434345] bg-clip-text text-transparent">
            ChemScan
          </h1>
          <p className="text-lg text-[#86868B] max-w-2xl mx-auto">
            Transform your physical chemistry notes into a structured question bank. 
            Scan diagrams, extract topics, and find relevant exam questions instantly.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Input & Controls */}
          <div className="lg:col-span-5 space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <Card className="border-none bg-white/70 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <Camera className="w-5 h-5 text-blue-500" />
                    Upload Note
                  </CardTitle>
                  <CardDescription>Upload a clear image of your chemistry notes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative group cursor-pointer border-2 border-dashed rounded-2xl transition-all duration-300 flex flex-col items-center justify-center p-8 ${
                      image ? 'border-blue-400 bg-blue-50/30' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50/50'
                    }`}
                  >
                    {image ? (
                      <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden shadow-sm">
                        <img src={image} alt="Uploaded note" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <p className="text-white text-sm font-medium flex items-center gap-2">
                            <Upload className="w-4 h-4" /> Change Image
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                          <Upload className="w-6 h-6 text-blue-500" />
                        </div>
                        <p className="text-sm font-medium text-[#1D1D1F]">Click to upload or drag and drop</p>
                        <p className="text-xs text-[#86868B] mt-1">PNG, JPG or WEBP (max. 10MB)</p>
                      </>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                      className="hidden" 
                      accept="image/*" 
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="topic" className="text-sm font-semibold text-[#1D1D1F]">Topic Reference</Label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
                      <Input 
                        id="topic"
                        placeholder="e.g., Chemical Bonding, Thermodynamics" 
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="pl-10 bg-white/50 border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-sm font-semibold text-[#1D1D1F]">Target Exams</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {EXAM_OPTIONS.map((exam) => (
                        <div 
                          key={exam.id} 
                          onClick={() => toggleExam(exam.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                            selectedExams.includes(exam.id) 
                              ? 'bg-blue-50 border-blue-200 text-blue-700' 
                              : 'bg-white/50 border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <Checkbox 
                            id={exam.id} 
                            checked={selectedExams.includes(exam.id)}
                            onCheckedChange={() => toggleExam(exam.id)}
                            className="rounded-md border-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                          />
                          <label htmlFor={exam.id} className="text-xs font-medium cursor-pointer flex-1">
                            {exam.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button 
                    onClick={startScan}
                    disabled={isScanning}
                    className="w-full h-12 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all duration-300 active:scale-[0.98]"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Analyzing Notes...
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5 mr-2" />
                        Scan & Find Questions
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Card className="border-none bg-white/70 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] h-full flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                      <div>
                        <CardTitle className="text-2xl font-bold text-[#1D1D1F]">Analysis Result</CardTitle>
                        <CardDescription>Extracted concepts and generated questions</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleDownload}
                          className="rounded-full border-gray-200 hover:bg-gray-50 gap-2"
                        >
                          <Download className="w-4 h-4" /> PDF
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => result && generateQuestionsDocx(result.topicDetected || topic, result.questions)}
                          className="rounded-full border-gray-200 hover:bg-gray-50 gap-2"
                        >
                          <FileText className="w-4 h-4" /> DOCX
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden flex flex-col gap-6">
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {result.keywords.map((kw, i) => (
                            <Badge key={i} variant="secondary" className="bg-blue-50 text-blue-600 border-none px-3 py-1 rounded-full text-[11px] font-medium">
                              {kw}
                            </Badge>
                          ))}
                        </div>
                        <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                          <h4 className="text-sm font-bold text-[#1D1D1F] mb-2 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-blue-500" />
                            Detected Topic: {result.topicDetected}
                          </h4>
                          <p className="text-sm text-[#434345] leading-relaxed">
                            {result.summary}
                          </p>
                        </div>
                      </div>

                      <Separator className="bg-gray-100" />

                      <div className="flex-1 overflow-hidden flex flex-col">
                        <h3 className="text-lg font-bold text-[#1D1D1F] mb-4 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-500" />
                          Generated Question Bank
                        </h3>
                        <ScrollArea className="flex-1 pr-4">
                          <div className="space-y-4 pb-4">
                            {result.questions.map((q, i) => (
                              <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 group"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <Badge className={`
                                    ${q.type === 'PYQ' ? 'bg-orange-50 text-orange-600' : 
                                      q.type === 'HOTS' ? 'bg-red-50 text-red-600' : 
                                      'bg-green-50 text-green-600'} 
                                    border-none rounded-full px-2 py-0.5 text-[10px] font-bold
                                  `}>
                                    {q.type}
                                  </Badge>
                                  <span className="text-[10px] font-medium text-[#86868B] uppercase tracking-wider">
                                    {q.source} • {q.year}
                                  </span>
                                </div>
                                <p className="text-sm text-[#1D1D1F] font-medium leading-relaxed mb-3">
                                  {q.text}
                                </p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                                  {q.options.map((opt, optIdx) => (
                                    <div key={optIdx} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100 text-xs text-[#434345]">
                                      <span className="font-bold text-blue-500">{String.fromCharCode(65 + optIdx)}.</span>
                                      {opt}
                                    </div>
                                  ))}
                                </div>

                                <details className="mb-3 group/ans">
                                  <summary className="text-[11px] font-bold text-blue-600 cursor-pointer hover:text-blue-700 list-none flex items-center gap-1">
                                    <ChevronRight className="w-3 h-3 transition-transform group-open/ans:rotate-90" />
                                    Show Correct Answer
                                  </summary>
                                  <div className="mt-2 p-3 bg-green-50 rounded-xl border border-green-100 text-xs font-bold text-green-700">
                                    Answer: {q.answer}
                                  </div>
                                </details>

                                <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                  <span className="text-[11px] text-[#86868B] font-medium">{q.topic}</span>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-gray-200 rounded-[32px] bg-white/30 backdrop-blur-sm"
                >
                  <div className="w-20 h-20 bg-white rounded-3xl shadow-xl shadow-gray-200/50 flex items-center justify-center mb-6">
                    <FileText className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold text-[#1D1D1F] mb-2">No Results Yet</h3>
                  <p className="text-[#86868B] max-w-xs mx-auto">
                    Upload your chemistry notes and select target exams to generate a custom question bank.
                  </p>
                  <div className="mt-8 flex gap-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 font-bold text-xs">1</div>
                      <span className="text-[10px] font-medium text-[#86868B]">Upload</span>
                    </div>
                    <div className="w-8 h-px bg-gray-200 mt-4" />
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 font-bold text-xs">2</div>
                      <span className="text-[10px] font-medium text-[#86868B]">Select Exams</span>
                    </div>
                    <div className="w-8 h-px bg-gray-200 mt-4" />
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 font-bold text-xs">3</div>
                      <span className="text-[10px] font-medium text-[#86868B]">Scan</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-24 pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1D1D1F] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-semibold text-[#1D1D1F]">ChemScan</span>
          </div>
          <p className="text-xs text-[#86868B]">
            © 2026 ChemScan AI. Designed for Chemistry Educators & Students.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors">Privacy</a>
            <a href="#" className="text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors">Terms</a>
            <a href="#" className="text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors">Support</a>
          </div>
        </footer>
      </main>

      <Toaster position="bottom-right" toastOptions={{
        className: "rounded-2xl border-none bg-white/80 backdrop-blur-xl shadow-lg",
      }} />
    </div>
  );
}
