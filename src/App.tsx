import React, { useState, useRef } from "react";
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

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white mb-6 shadow-xl shadow-blue-200">
            <Camera className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">ChemScan</h1>
          <p className="text-xl text-[#86868B] max-w-2xl mx-auto">
            Analyze chemistry notes and diagrams with AI. Generate exam-ready question banks instantly.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-none shadow-2xl shadow-gray-200/50 bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-600" />
                  Upload Notes
                </CardTitle>
                <CardDescription>Upload a photo of your chemistry notes or diagrams</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative aspect-video rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-6 ${
                    image ? 'border-blue-400 bg-blue-50/30' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  {image ? (
                    <img src={image} alt="Uploaded note" className="w-full h-full object-contain rounded-lg" referrerPolicy="no-referrer" />
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <Upload className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG or WEBP (max. 10MB)</p>
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

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="topic" className="text-sm font-semibold">Topic Reference</Label>
                    <Input 
                      id="topic"
                      placeholder="e.g. Organic Chemistry, Thermodynamics..."
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="rounded-xl border-gray-200 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Target Exams</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {EXAM_OPTIONS.map((exam) => (
                        <div key={exam.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={exam.id} 
                            checked={selectedExams.includes(exam.id)}
                            onCheckedChange={() => toggleExam(exam.id)}
                          />
                          <label 
                            htmlFor={exam.id}
                            className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {exam.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={startScan}
                  disabled={isScanning || !image}
                  className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing Note...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Scan & Generate
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-7">
            {result ? (
              <div className="space-y-6">
                <Card className="border-none shadow-2xl shadow-gray-200/50 bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-2xl flex items-center gap-2">
                          <CheckCircle2 className="w-6 h-6 text-green-500" />
                          Analysis Complete
                        </CardTitle>
                        <CardDescription>Detected Topic: <span className="font-bold text-[#1D1D1F]">{result.topicDetected}</span></CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-xl border-gray-200"
                          onClick={() => generateQuestionsPDF(result.topicDetected, result.questions)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          PDF
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-xl border-gray-200"
                          onClick={() => generateQuestionsDocx(result.topicDetected, result.questions)}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          DOCX
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100/50">
                      <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Summary
                      </h4>
                      <p className="text-sm text-blue-800/80 leading-relaxed">{result.summary}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {result.keywords.map((kw, i) => (
                        <Badge key={i} variant="secondary" className="bg-white border-gray-100 text-gray-600 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold">
                          {kw}
                        </Badge>
                      ))}
                    </div>

                    <Separator className="bg-gray-100" />

                    <div className="space-y-4">
                      <h4 className="text-lg font-bold flex items-center gap-2">
                        <Layers className="w-5 h-5 text-blue-600" />
                        Generated Question Bank
                      </h4>
                      <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-4">
                          {result.questions.map((q, i) => (
                            <div key={i} className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                              <div className="flex items-start justify-between mb-3">
                                <Badge className="bg-blue-50 text-blue-600 border-none rounded-lg text-[10px] font-bold">
                                  {q.type}
                                </Badge>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{q.year}</span>
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
                                <Separator orientation="vertical" className="h-3 bg-gray-200" />
                                <span className="text-[11px] text-[#86868B] font-medium">{q.source}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12 rounded-3xl border-2 border-dashed border-gray-200 bg-white/50">
                <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center mb-6">
                  <FileText className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-2xl font-bold text-gray-400 mb-2">No Analysis Yet</h3>
                <p className="text-gray-400 max-w-xs mx-auto">
                  Upload your notes and click scan to generate your chemistry question bank.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
