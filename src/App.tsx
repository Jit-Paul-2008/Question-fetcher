import React, { useState, useRef, useEffect } from "react";
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
  Layers,
  LogOut,
  Crown
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
import { auth, db, signInWithGoogle, logOut } from "@/src/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, getDoc, setDoc } from "firebase/firestore";

interface HistoryItem extends ScanResult {
  id?: string;
  image?: string;
  imageUrl?: string;
  timestamp: number;
}

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
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      
      if (currentUser) {
        // Check for Stripe success/cancel params
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success') === 'true') {
          toast.success("Payment successful! You are now a Premium member.", { duration: 5000 });
          // Update Firestore profile (in a real app, use a Stripe Webhook)
          await setDoc(doc(db, `users/${currentUser.uid}/profile`, 'data'), { isPremium: true }, { merge: true });
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } else if (urlParams.get('canceled') === 'true') {
          toast.error("Payment was canceled.");
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        // Fetch premium status
        const profileDoc = await getDoc(doc(db, `users/${currentUser.uid}/profile`, 'data'));
        if (profileDoc.exists() && profileDoc.data().isPremium) {
          setIsPremium(true);
        }
      } else {
        setIsPremium(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !user) {
      setHistory([]);
      return;
    }

    const q = query(
      collection(db, `users/${user.uid}/history`),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const historyData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          topicDetected: data.topicDetected,
          summary: data.summary,
          keywords: data.keywords,
          questions: JSON.parse(data.questions),
          imageUrl: data.imageUrl,
          timestamp: data.timestamp,
        } as HistoryItem;
      });
      setHistory(historyData);
    }, (error) => {
      console.error("Firestore Error: ", error);
      toast.error("Failed to load history.");
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  const handleUpgrade = async () => {
    setIsCheckingOut(true);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnUrl: window.location.origin + window.location.pathname })
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Failed to initiate checkout");
      }
    } catch (err) {
      toast.error("Error connecting to payment server");
    } finally {
      setIsCheckingOut(false);
    }
  };

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
      
      if (user) {
        try {
          await addDoc(collection(db, `users/${user.uid}/history`), {
            userId: user.uid,
            topicDetected: scanResult.topicDetected,
            summary: scanResult.summary,
            keywords: scanResult.keywords,
            questions: JSON.stringify(scanResult.questions),
            imageUrl: image, // Note: Storing base64 directly, ensure it's < 1MB or use Storage
            timestamp: Date.now()
          });
        } catch (dbError) {
          console.error("Failed to save to history", dbError);
          toast.error("Analysis complete, but failed to save to history.");
        }
      } else {
        // Fallback to local state if not logged in (though we'll require login)
        setHistory(prev => [{ ...scanResult, image, timestamp: Date.now() }, ...prev]);
      }

      toast.success("Scan completed successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to scan image. Please try again.");
    } finally {
      setIsScanning(false);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 rounded-3xl bg-blue-600 text-white flex items-center justify-center mb-8 shadow-xl shadow-blue-200">
          <Camera className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4 text-center">Welcome to ChemScan</h1>
        <p className="text-lg text-[#86868B] max-w-md text-center mb-8">
          Sign in to analyze your chemistry notes, generate question banks, and save your history securely.
        </p>
        <Button 
          onClick={() => signInWithGoogle().catch(console.error)}
          className="h-12 px-8 rounded-xl bg-white text-gray-900 hover:bg-gray-50 border border-gray-200 shadow-sm font-semibold text-base"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign in with Google
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 relative">
          <div className="absolute right-0 top-0 flex items-center gap-4">
            {!isPremium && (
              <Button 
                onClick={handleUpgrade} 
                disabled={isCheckingOut}
                className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white border-none shadow-md shadow-orange-200"
              >
                {isCheckingOut ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Crown className="w-4 h-4 mr-2" />}
                Upgrade to Premium
              </Button>
            )}
            {isPremium && (
              <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-none shadow-sm px-3 py-1">
                <Crown className="w-3 h-3 mr-1" /> Premium
              </Badge>
            )}
            <div className="text-sm font-medium text-gray-600 hidden sm:block">
              {user.email}
            </div>
            <Button variant="outline" size="sm" onClick={() => logOut()} className="rounded-xl">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white mb-6 shadow-xl shadow-blue-200">
              <Camera className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">ChemScan</h1>
            <p className="text-xl text-[#86868B] max-w-2xl mx-auto">
              Analyze chemistry notes and diagrams with AI. Generate exam-ready question banks instantly.
            </p>
          </div>
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

        {history.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Analysis History</h2>
            <div className="space-y-4">
              {history.map((item, i) => (
                <details key={i} className="group bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <summary className="p-6 cursor-pointer list-none flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img src={item.imageUrl || item.image} alt="Note" className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                      <div>
                        <h3 className="font-bold">{item.topicDetected}</h3>
                        <p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="p-6 border-t border-gray-100 space-y-4">
                    <p className="text-sm text-gray-600">{item.summary}</p>
                    <div className="flex flex-wrap gap-2">
                      {item.keywords.map((kw, j) => (
                        <Badge key={j} variant="secondary" className="text-[10px]">{kw}</Badge>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500">
                      Questions: {item.questions.length}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}
      </div>
      <Toaster />
    </div>
  );
}
