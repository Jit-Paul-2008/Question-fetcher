import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Upload, Search, FileText, Download, CheckCircle2,
  Loader2, Camera, X, ChevronRight, BookOpen, Layers,
  LogOut, Coins, ShoppingCart, FlaskConical, FileBox,
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
import { scanSubjectNote, ScanResult } from "@/src/lib/gemini";
import { generateQuestionsPDF } from "@/src/lib/pdf";
import { generateQuestionsDocx } from "@/src/lib/docx";
import { auth, db, signInWithGoogle, logOut } from "@/src/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, addDoc, onSnapshot, query, orderBy, doc, getDoc, setDoc } from "firebase/firestore";

// ─── Constants ────────────────────────────────────────────────────────────────

interface HistoryItem extends ScanResult {
  id?: string;
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

const SUBJECTS = [
  { group: "Science", items: ["Physics", "Chemistry", "Biology", "Mathematics", "Computer Science", "Environmental Science"] },
  { group: "Commerce", items: ["Business Studies", "Accountancy", "Economics"] },
  { group: "Humanities", items: ["History", "Geography", "Political Science", "Sociology", "Psychology", "Philosophy"] },
  { group: "Languages", items: ["English", "Hindi", "Sanskrit", "Bengali"] },
];
const ALL_SUBJECTS = SUBJECTS.flatMap(g => g.items);

interface CreditPack {
  credits: number;
  amount: number;
  name: string;
  display: string;
}

// ─── Razorpay loader ──────────────────────────────────────────────────────────
function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).Razorpay) { resolve(); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(script);
  });
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [credits, setCredits] = useState(0);
  const [scanMode, setScanMode] = useState<"notes" | "topics">("notes");
  const [images, setImages] = useState<string[]>([]);
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("Chemistry");
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [isBuying, setIsBuying] = useState<string | null>(null);
  const [razorpayKeyId, setRazorpayKeyId] = useState("");
  const [creditPacks, setCreditPacks] = useState<Record<string, CreditPack>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_IMAGES = 8;
  const MAX_TOPICS = 5;

  const getTopicsCount = (str: string) => str.split(/[,|\n]+/).map(t => t.trim()).filter(t => t.length > 0).length;
  const topicsCount = getTopicsCount(topic);


  // ─── Fetch public config (Razorpay key, packs) ──────────────────────────
  useEffect(() => {
    fetch("/api/config")
      .then(r => r.json())
      .then(data => {
        setRazorpayKeyId(data.razorpayKeyId || "");
        setCreditPacks(data.creditPacks || {});
      })
      .catch(() => { });
  }, []);

  // ─── Auth + profile ───────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);

      if (currentUser) {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("canceled") === "true") {
          toast.error("Payment was canceled.");
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        const profileRef = doc(db, `users/${currentUser.uid}/profile`, "data");
        const profileDoc = await getDoc(profileRef);

        const data = profileDoc.exists() ? profileDoc.data() : null;

        if (data && typeof data.credits === "number") {
          setCredits(data.credits);
        } else {
          // First time initialized or missing credit field → grant free welcome credits
          const freeCredits = 3;
          await setDoc(profileRef, { credits: freeCredits }, { merge: true });
          setCredits(freeCredits);
          toast.success(`Welcome! You have ${freeCredits} free scans to get started.`, { duration: 5000 });
        }
      } else {
        setCredits(0);
      }
    });
    return () => unsub();
  }, []);

  // ─── History listener ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthReady || !user) { setHistory([]); return; }
    const q = query(collection(db, `users/${user.uid}/history`), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setHistory(snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          topicDetected: data.topicDetected,
          summary: data.summary,
          keywords: data.keywords,
          questions: JSON.parse(data.questions),
          timestamp: data.timestamp,
        } as HistoryItem;
      }));
    }, () => toast.error("Failed to load history."));
    return () => unsub();
  }, [user, isAuthReady]);

  // ─── File upload (Images, PDF, DOCX) ─────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} files per scan.`);
      return;
    }
    Array.from(files).slice(0, remaining).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => setImages(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
    if (files.length > remaining) {
      toast.warning(`Only ${remaining} more file(s) added. Maximum is ${MAX_IMAGES}.`);
    }
    e.target.value = "";
  };

  const removeImage = (idx: number) => setImages(prev => prev.filter((_, i) => i !== idx));

  const toggleExam = (examId: string) => {
    setSelectedExams(prev =>
      prev.includes(examId) ? prev.filter(id => id !== examId) : [...prev, examId]
    );
  };

  // ─── Scan ─────────────────────────────────────────────────────────────────
  const startScan = async () => {
    if (scanMode === "notes" && images.length === 0) { 
      toast.error("Please upload at least one image or document."); 
      return; 
    }
    if (!topic || topic.trim() === "") { 
      toast.error("Please enter at least one topic."); 
      return; 
    }
    if (topicsCount > MAX_TOPICS) {
      toast.error(`Please limit your scan to ${MAX_TOPICS} topics at a time.`);
      return;
    }
    if (selectedExams.length === 0) { 
      toast.error("Please select at least one target exam."); 
      return; 
    }
    if (credits <= 0) { setShowBuyModal(true); return; }

    setIsScanning(true);
    try {
      const idToken = await user!.getIdToken();
      // In topics mode, we send empty images array to trigger text-only analysis
      const scanImages = scanMode === "notes" ? images : [];
      const scanResult = await scanSubjectNote(scanImages, topic, subject, selectedExams, idToken);

      // Credit was deducted server-side atomically — update local UI
      setCredits(prev => Math.max(0, prev - 1));
      setResult(scanResult);

      // Save text-only history to Firestore (no images stored)
      if (user) {
        try {
          await addDoc(collection(db, `users/${user.uid}/history`), {
            userId: user.uid,
            topicDetected: scanResult.topicDetected,
            summary: scanResult.summary,
            keywords: scanResult.keywords,
            questions: JSON.stringify(scanResult.questions),
            timestamp: Date.now(),
          });
        } catch { /* non-critical */ }
      }

      toast.success("Scan completed! Question bank ready.");
    } catch (err: any) {
      if (err.message?.includes("Insufficient credits")) {
        setCredits(0);
        setShowBuyModal(true);
        toast.error("No credits left. Please buy a pack to continue.");
      } else {
        toast.error(err.message || "Scan failed. Please try again.");
      }
      // Note: server auto-refunds credit if scan failed after deduction
    } finally {
      setIsScanning(false);
    }
  };

  // ─── Razorpay checkout ────────────────────────────────────────────────────
  const handleBuyCredits = async (packId: string) => {
    if (!user) { toast.error("Please sign in first"); return; }
    setIsBuying(packId);
    try {
      await loadRazorpayScript();

      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      const { orderId, amount, currency } = await orderRes.json();

      const idToken = await user.getIdToken();

      const options = {
        key: razorpayKeyId,
        amount,
        currency,
        order_id: orderId,
        name: "ChemScan",
        description: creditPacks[packId]?.name || "Credit Pack",
        image: "/favicon.ico",
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                packId,
              }),
            });
            const result = await verifyRes.json();
            if (result.success) {
              setCredits(prev => prev + result.creditsAdded);
              setShowBuyModal(false);
              toast.success(`✅ ${result.creditsAdded} credits added! Happy scanning.`, { duration: 5000 });
            } else {
              toast.error("Payment verification failed. Contact support.");
            }
          } catch {
            toast.error("Failed to verify payment. Contact support if amount was deducted.");
          }
        },
        theme: { color: "#2563EB" },
        modal: { ondismiss: () => setIsBuying(null) },
      };

      new (window as any).Razorpay(options).open();
    } catch (err: any) {
      toast.error(err.message || "Payment failed");
      setIsBuying(null);
    }
  };

  // ─── Render: Loading ─────────────────────────────────────────────────────
  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // ─── Render: Sign In ─────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 rounded-3xl bg-blue-600 text-white flex items-center justify-center mb-8 shadow-xl shadow-blue-200">
          <FlaskConical className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-2 text-center">ChemScan</h1>
        <p className="text-base text-[#86868B] mb-1 text-center">AI-powered question bank generator</p>
        <p className="text-sm text-blue-600 font-medium mb-8 text-center">Physics · Chemistry · Biology · Maths · and more</p>
        <Button
          onClick={() => signInWithGoogle().catch(console.error)}
          className="h-12 px-8 rounded-xl bg-white text-gray-900 hover:bg-gray-50 border border-gray-200 shadow-sm font-semibold text-base"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign in with Google — get 3 free scans
        </Button>
      </div>
    );
  }

  // ─── Render: Main App ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <header className="mb-10 relative">
          <div className="absolute right-0 top-0 flex items-center gap-3">
            {/* Credit balance */}
            <button
              onClick={() => setShowBuyModal(true)}
              className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold shadow-sm hover:bg-gray-50 transition-colors"
            >
              <Coins className="w-4 h-4 text-amber-500" />
              <span className={credits === 0 ? "text-red-500" : "text-gray-800"}>{credits} credits</span>
            </button>
            <div className="text-sm font-medium text-gray-600 hidden sm:block">{user.email}</div>
            <Button variant="outline" size="sm" onClick={() => logOut()} className="rounded-xl">
              <LogOut className="w-4 h-4 mr-2" />Sign Out
            </Button>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white mb-5 shadow-xl shadow-blue-200">
              <FlaskConical className="w-7 h-7" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">ChemScan</h1>
            <p className="text-lg text-[#86868B]">
              Upload your notes → get a real question bank from PYQs, Sample Papers & HOTS
            </p>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left: Upload Panel */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-none shadow-2xl shadow-gray-200/50 bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex bg-gray-100 p-1 rounded-2xl mb-4">
                  <button
                    onClick={() => setScanMode("notes")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-[11px] font-bold transition-all ${scanMode === "notes" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Scan Notes
                  </button>
                  <button
                    onClick={() => { setScanMode("topics"); setImages([]); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-[11px] font-bold transition-all ${scanMode === "topics" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    <Search className="w-3.5 h-3.5" />
                    Search Topics
                  </button>
                </div>
                <CardTitle className="flex items-center gap-2">
                  {scanMode === "notes" ? <FileText className="w-5 h-5 text-blue-600" /> : <BookOpen className="w-5 h-5 text-blue-600" />}
                  {scanMode === "notes" ? "Upload Notes" : "Topic Search"}
                </CardTitle>
                <CardDescription>
                  {scanMode === "notes" ? `Extract questions from your images/PDFs` : `Find questions based on chapters only`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">

                {/* Image drop zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-5 ${images.length > 0 ? "border-blue-400 bg-blue-50/30" : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                    }`}
                >
                  {images.length > 0 ? (
                    <div className="w-full space-y-3">
                       <div className="flex flex-wrap gap-2 justify-center">
                        {images.map((fileData, idx) => {
                          const isImage = fileData.startsWith("data:image/");
                          const isPDF = fileData.startsWith("data:application/pdf");
                          
                          return (
                            <div key={idx} className="relative group">
                              {isImage ? (
                                <img src={fileData} alt={`File ${idx + 1}`} className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                              ) : (
                                <div className={`w-16 h-16 flex flex-col items-center justify-center rounded-lg border border-gray-200 ${isPDF ? "bg-red-50" : "bg-blue-50"}`}>
                                  {isPDF ? <FileText className="w-8 h-8 text-red-500" /> : <FileBox className="w-8 h-8 text-blue-500" />}
                                  <span className="text-[8px] font-bold mt-1 uppercase text-gray-500">{isPDF ? "PDF" : "DOCX"}</span>
                                </div>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xs text-center text-blue-600 font-medium">
                        {images.length}/{MAX_IMAGES} files — click to add more
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                        <Upload className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">Click to upload or drag & drop</p>
                      <p className="text-xs text-gray-400 mt-1">Images, PDF or DOCX — select multiple files at once</p>
                    </>
                  )}
                  <input
                    type="file" ref={fileInputRef} onChange={handleFileUpload}
                    className="hidden" accept="image/*,.pdf,.docx" multiple
                  />
                </div>

                {/* Subject selector */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Subject</Label>
                  <select
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {SUBJECTS.map(group => (
                      <optgroup key={group.group} label={group.group}>
                        {group.items.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Topic input */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="topic" className="text-sm font-semibold">
                      {scanMode === "notes" ? "Chapter/Topic Reference" : "Target Topics (Max 5)"}
                    </Label>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${topicsCount > MAX_TOPICS ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-400"}`}>
                      {topicsCount}/{MAX_TOPICS} topics
                    </span>
                  </div>
                  <Input
                    id="topic"
                    placeholder={scanMode === "notes" 
                      ? `e.g. ${subject === "Physics" ? "Electrostatics, Work Energy" : "Organic Chemistry"} ...`
                      : "Enter up to 5 topics separated by commas..."
                    }
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    className={`rounded-xl border-gray-200 focus:ring-blue-500 ${topicsCount > MAX_TOPICS ? "border-red-300 ring-1 ring-red-300" : ""}`}
                  />
                  {topicsCount > MAX_TOPICS && (
                    <p className="text-[10px] text-red-500 font-bold mt-1">Please remove {topicsCount - MAX_TOPICS} topic(s) to continue.</p>
                  )}
                </div>

                {/* Exam selector */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Target Exams</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {EXAM_OPTIONS.map(exam => (
                      <div key={exam.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={exam.id}
                          checked={selectedExams.includes(exam.id)}
                          onCheckedChange={() => toggleExam(exam.id)}
                        />
                        <label htmlFor={exam.id} className="text-xs font-medium leading-none cursor-pointer">
                          {exam.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scan button */}
                <Button
                  onClick={startScan}
                  disabled={isScanning || (scanMode === "notes" && images.length === 0) || topicsCount > MAX_TOPICS || !topic.trim()}
                  className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
                >
                  {isScanning ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</>
                  ) : credits <= 0 ? (
                    <><ShoppingCart className="w-4 h-4 mr-2" />Buy Credits to Scan</>
                  ) : (
                    <><Search className="w-4 h-4 mr-2" />{scanMode === "notes" ? "Scan Notes & Generate" : "Search Topics & Generate"} ({credits} credit{credits !== 1 ? "s" : ""} left)</>
                  )}
                </Button>

                {credits <= 0 && (
                  <p className="text-xs text-center text-red-500">No credits remaining. <button onClick={() => setShowBuyModal(true)} className="underline font-semibold">Buy a pack →</button></p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Results Panel */}
          <div className="lg:col-span-7">
            {result ? (
              <div className="space-y-6">
                <Card className="border-none shadow-2xl shadow-gray-200/50 bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          Question Bank Ready
                        </CardTitle>
                        <CardDescription>
                          <span className="font-bold text-blue-600">{subject}</span> · {result.topicDetected}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="rounded-xl border-gray-200"
                          onClick={() => generateQuestionsPDF(result.topicDetected, result.questions, subject)}>
                          <Download className="w-4 h-4 mr-2" />PDF
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl border-gray-200"
                          onClick={() => generateQuestionsDocx(result.topicDetected, result.questions, subject)}>
                          <FileText className="w-4 h-4 mr-2" />DOCX
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100/50">
                      <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />Summary
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
                        {result.questions.length} Questions Found
                      </h4>
                      <ScrollArea className="h-[420px] pr-4">
                        <div className="space-y-4">
                          {result.questions.map((q, i) => (
                            <div key={i} className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
                              <div className="flex items-start justify-between mb-3">
                                <Badge className={`border-none rounded-lg text-[10px] font-bold ${q.type === "PYQ" ? "bg-purple-50 text-purple-600" :
                                  q.type === "HOTS" ? "bg-orange-50 text-orange-600" :
                                    q.type === "Sample Paper" ? "bg-green-50 text-green-600" :
                                      "bg-blue-50 text-blue-600"
                                  }`}>
                                  {q.type}
                                </Badge>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{q.year}</span>
                              </div>
                              <p className="text-sm text-[#1D1D1F] font-medium leading-relaxed mb-3">{q.text}</p>
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
                                  Show Answer
                                </summary>
                                <div className="mt-2 p-3 bg-green-50 rounded-xl border border-green-100 text-xs font-bold text-green-700">
                                  Answer: {q.answer}
                                </div>
                              </details>
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                <span className="text-[11px] text-[#86868B] font-medium">{q.topic}</span>
                                <Separator orientation="vertical" className="h-3 bg-gray-200" />
                                <span className="text-[11px] text-[#86868B] font-medium truncate max-w-[200px]">{q.source}</span>
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
                <h3 className="text-2xl font-bold text-gray-400 mb-2">No Results Yet</h3>
                <p className="text-gray-400 max-w-xs">
                  Upload your {subject} notes and click scan.
                </p>
                {credits > 0 && (
                  <p className="text-sm text-blue-500 mt-3 font-medium">{credits} scan{credits !== 1 ? "s" : ""} available</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Scan History</h2>
            <div className="space-y-4">
              {history.map((item, i) => (
                <details key={i} className="group bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <summary className="p-5 cursor-pointer list-none flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm">{item.topicDetected}</h3>
                        <p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{item.questions.length} questions</span>
                      <ChevronRight className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-90" />
                    </div>
                  </summary>
                  <div className="p-5 border-t border-gray-100 space-y-3">
                    <p className="text-sm text-gray-600">{item.summary}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.keywords.map((kw, j) => (
                        <Badge key={j} variant="secondary" className="text-[10px]">{kw}</Badge>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl"
                      onClick={() => generateQuestionsDocx(item.topicDetected, item.questions)}>
                      <FileText className="w-4 h-4 mr-2" />Download DOCX
                    </Button>
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── Buy Credits Modal ─────────────────────────────────────────────── */}
      {showBuyModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Buy Credits</h2>
                <p className="text-sm text-gray-500 mt-1">1 credit = 1 scan · up to 15 questions per scan</p>
              </div>
              <button onClick={() => setShowBuyModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {credits > 0 && (
              <div className="mb-5 p-3 bg-blue-50 rounded-xl text-sm text-blue-700 font-medium">
                You currently have <strong>{credits}</strong> credit{credits !== 1 ? "s" : ""} remaining.
              </div>
            )}

            <div className="space-y-3">
              {Object.entries(creditPacks).map(([packId, packData]) => {
                const pack = packData as CreditPack;
                return (
                  <button
                    key={packId}
                    onClick={() => handleBuyCredits(packId)}
                    disabled={!!isBuying}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-gray-100 hover:border-blue-300 hover:bg-blue-50/30 transition-all disabled:opacity-60 text-left"
                  >
                    <div>
                      <p className="font-bold text-gray-900">{pack.name}</p>
                      <p className="text-sm text-gray-500">{pack.credits} scans · {Math.round(pack.amount / pack.credits / 100)} ₹/scan</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-blue-600">{pack.display}</p>
                      {isBuying === packId && <Loader2 className="w-4 h-4 animate-spin text-blue-600 ml-auto mt-1" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-gray-400 text-center mt-5">
              Secure payment via <span className="font-semibold">Razorpay</span> · UPI · Cards · Netbanking
            </p>
          </div>
        </div>
      )}

      <Toaster />
    </div>
  );
}
