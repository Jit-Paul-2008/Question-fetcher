import React, { useState, useRef, useEffect } from "react";
import {
  Upload, Search, FileText, Download, CheckCircle2,
  Loader2, X, ChevronRight, BookOpen, Layers,
  LogOut, Coins, FlaskConical, FileBox,
  Globe, Users, GraduationCap, Share2, Sparkles,
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
import GraphView from "./GraphView";
import { generateQuestionsDocx } from "@/src/lib/docx";
import { auth, db, logOut, signInWithGoogle } from "@/src/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, addDoc, onSnapshot, query, orderBy, doc, getDoc, setDoc, where } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

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
  const [activeTab, setActiveTab] = useState<"generator" | "library" | "classrooms" | "map">("generator");
  const [libraryBanks, setLibraryBanks] = useState<any[]>([]);
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);
  const [classroomCode, setClassroomCode] = useState("");
  const [joinedClasses, setJoinedClasses] = useState<any[]>([]);
  const [isJoining, setIsJoining] = useState(false);
  const [myClassrooms, setMyClassrooms] = useState<any[]>([]);
  const [isCroomsLoading, setIsCroomsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_IMAGES = 8;
  const MAX_TOPICS = 5;

  const getTopicsCount = (str: string) => str.split(/[,|\n]+/).map(t => t.trim()).filter(t => t.length > 0).length;
  const topicsCount = getTopicsCount(topic);

  // ─── Fetch public config ──────────────────────────────────────────────────
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
        const profileRef = doc(db, `users/${currentUser.uid}/profile`, "data");
        const profileDoc = await getDoc(profileRef);
        if (profileDoc.exists()) {
          setCredits(profileDoc.data().credits || 0);
        } else {
          const freeCredits = 3;
          await setDoc(profileRef, { credits: freeCredits }, { merge: true });
          setCredits(freeCredits);
          toast.success(`Welcome! You have ${freeCredits} free scans.`, { duration: 5000 });
        }
      } else {
        setCredits(0);
      }
    });
    return () => unsub();
  }, []);

  // ─── Listeners ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthReady || !user) { setHistory([]); return; }
    const q = query(collection(db, `users/${user.uid}/history`), orderBy("timestamp", "desc"));
    return onSnapshot(q, (snap) => {
      setHistory(snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        questions: JSON.parse(d.data().questions)
      } as HistoryItem)));
    });
  }, [user, isAuthReady]);

  useEffect(() => {
    if (!isAuthReady || !user) { setMyClassrooms([]); return; }
    setIsCroomsLoading(true);
    const q = query(collection(db, "classrooms"), where("teacherId", "==", user.uid), orderBy("timestamp", "desc"));
    return onSnapshot(q, (snap) => {
      setMyClassrooms(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsCroomsLoading(false);
    });
  }, [user, isAuthReady]);

  useEffect(() => {
    const saved = localStorage.getItem("joined_classes");
    if (saved) setJoinedClasses(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("joined_classes", JSON.stringify(joinedClasses));
  }, [joinedClasses]);

  const fetchLibrary = async () => {
    setIsLibraryLoading(true);
    try {
      const res = await fetch("/api/library");
      const data = await res.json();
      setLibraryBanks(data.banks || []);
    } catch { toast.error("Failed to load library"); }
    finally { setIsLibraryLoading(false); }
  };

  useEffect(() => {
    if (activeTab === "library") fetchLibrary();
  }, [activeTab]);

  // ─── Logic ────────────────────────────────────────────────────────────────
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file: any) => {
      const reader = new FileReader();
      reader.onloadend = () => setImages(prev => [...prev, reader.result as string].slice(0, MAX_IMAGES));
      reader.readAsDataURL(file);
    });
  };

  const handleScan = async () => {
    if (credits <= 0) { setShowBuyModal(true); return; }
    setIsScanning(true);
    try {
      const idToken = await user!.getIdToken();
      const scanResult = await scanSubjectNote(scanMode === "notes" ? images : [], topic, subject, selectedExams, idToken);
      setResult(scanResult);
      setCredits(prev => prev - 1);
      await addDoc(collection(db, `users/${user!.uid}/history`), {
        topicDetected: scanResult.topicDetected,
        summary: scanResult.summary,
        keywords: scanResult.keywords,
        questions: JSON.stringify(scanResult.questions),
        timestamp: Date.now(),
      });
      toast.success("Extraction complete!");
    } catch (err: any) {
      toast.error(err.message || "Scan failed.");
    } finally { setIsScanning(false); }
  };

  const publishToLibrary = async (bank: ScanResult) => {
    if (!user) return;
    const isAnon = confirm("Publish as Anonymous? Cancel to show your name.");
    try {
      const idToken = await user.getIdToken();
      await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
        body: JSON.stringify({ bank: { ...bank, authorName: isAnon ? "Anonymous" : user.displayName || "Admin" } }),
      });
      toast.success("Live in global library!");
    } catch { toast.error("Failed to publish."); }
  };

  const createClassroom = async (bank: ScanResult) => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/classroom/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
        body: JSON.stringify({ bank }),
      });
      const data = await res.json();
      if (data.code) {
        toast.success(`Classroom Code: ${data.code}`);
        navigator.clipboard.writeText(data.code);
      }
    } catch { toast.error("Error creating class."); }
  };

  const joinClassroom = async () => {
    if (!user || !classroomCode) return;
    setIsJoining(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/classroom/join", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
        body: JSON.stringify({ code: classroomCode }),
      });
      const data = await res.json();
      if (data.success) {
        setJoinedClasses(prev => [data, ...prev.filter(c => c.topicDetected !== data.topicDetected)]);
        setResult(data);
        setActiveTab("generator");
        toast.success("Enrolled successfully!");
      }
    } catch { toast.error("Error joining."); }
    finally { setIsJoining(false); setClassroomCode(""); }
  };

  const handleBuyCredits = async (packId: string) => {
    if (!user) return;
    setIsBuying(packId);
    try {
      await loadRazorpayScript();
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId, uid: user.uid }),
      });
      const { orderId, amount, currency } = await orderRes.json();
      const idToken = await user.getIdToken();
      const options = {
        key: razorpayKeyId,
        amount, currency, order_id: orderId, name: "ChemScan",
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
            body: JSON.stringify({ ...response, packId }),
          });
          const resJson = await verifyRes.json();
          if (resJson.success) {
            setCredits(prev => prev + resJson.creditsAdded);
            setShowBuyModal(false);
            toast.success("Credits added!");
          }
        },
        theme: { color: "#E05D44" },
      };
      new (window as any).Razorpay(options).open();
    } catch { toast.error("Payment failed."); }
    finally { setIsBuying(null); }
  };

  if (!isAuthReady) return <div className="h-screen flex items-center justify-center bg-claude-parchment"><Loader2 className="animate-spin" /></div>;

  if (!user) return (
    <div className="h-screen flex flex-col items-center justify-center bg-claude-parchment p-8 text-center">
      <div className="w-20 h-20 rounded-claude-3xl bg-claude-terracotta text-white flex items-center justify-center mb-8 shadow-xl">
        <FlaskConical className="w-10 h-10" />
      </div>
      <h1 className="text-5xl font-serif font-medium mb-4">ChemScan</h1>
      <p className="text-claude-olive-gray mb-10 max-w-sm">Elevate your academic strategy with AI-driven intelligence.</p>
      <Button onClick={() => signInWithGoogle()} className="h-14 px-10 bg-claude-terracotta text-white rounded-claude-xl">Sign in with Google</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-claude-parchment text-claude-near-black font-sans p-4 md:p-12 relative overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        <header className="mb-20 text-center relative">
          <div className="absolute top-0 right-0 flex items-center gap-4">
             <button onClick={() => setShowBuyModal(true)} className="bg-white border border-claude-border-cream px-4 py-2 rounded-claude-lg shadow-sm flex items-center gap-2 hover:bg-claude-ivory transition-colors">
                <Coins className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-sm">{credits} Credits</span>
             </button>
             <Button variant="ghost" size="sm" onClick={() => logOut()} className="text-claude-stone-gray"><LogOut className="w-4 h-4" /></Button>
          </div>
          <div className="inline-flex w-16 h-16 bg-claude-terracotta text-white rounded-claude-2xl items-center justify-center mb-6 shadow-claude-whisper">
            <FlaskConical className="w-8 h-8" />
          </div>
          <h1 className="text-6xl font-serif font-medium tracking-tight mb-4">ChemScan</h1>
          <nav className="flex justify-center gap-4 mt-12 bg-white/40 p-1.5 rounded-full inline-flex border border-claude-border-cream">
            {["generator", "library", "classrooms", "map"].map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t as any)}
                className={`px-8 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${activeTab === t ? "bg-claude-terracotta text-white shadow-md" : "text-claude-stone-gray hover:text-claude-near-black"}`}
              >
                {t}
              </button>
            ))}
          </nav>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === "generator" && (
            <motion.div key="gen" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-5 space-y-8">
                  <Card className="border-none shadow-claude-ring bg-claude-ivory rounded-claude-3xl overflow-hidden">
                    <CardHeader className="p-8 pb-4">
                      <div className="flex bg-claude-parchment p-1 rounded-claude-xl mb-6">
                        <button onClick={() => setScanMode("notes")} className={`flex-1 py-3 px-4 rounded-claude-lg text-[10px] font-bold uppercase tracking-widest ${scanMode === "notes" ? "bg-white text-claude-terracotta shadow-sm" : "text-claude-stone-gray"}`}>Notes Mode</button>
                        <button onClick={() => setScanMode("topics")} className={`flex-1 py-3 px-4 rounded-claude-lg text-[10px] font-bold uppercase tracking-widest ${scanMode === "topics" ? "bg-white text-claude-terracotta shadow-sm" : "text-claude-stone-gray"}`}>Topic Mode</button>
                      </div>
                      <CardTitle className="text-3xl font-serif font-medium">Strategic Inputs</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 space-y-6">
                      {scanMode === "notes" ? (
                        <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-claude-border-cream rounded-claude-2xl p-12 text-center hover:bg-claude-parchment/50 cursor-pointer transition-colors group">
                           <Upload className="w-10 h-10 mx-auto mb-4 text-claude-stone-gray/40 group-hover:text-claude-terracotta transition-colors" />
                           <p className="text-xs font-bold uppercase tracking-widest text-claude-olive-gray">Upload Intelligence Assets</p>
                           <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleImageUpload} />
                           {images.length > 0 && <p className="mt-4 text-[10px] text-claude-terracotta font-bold">{images.length}/{MAX_IMAGES} Assets Prepared</p>}
                        </div>
                      ) : (
                        <div className="space-y-2">
                           <Label className="uppercase text-[10px] font-bold tracking-[0.2em] text-claude-stone-gray ml-1">Target Subjects</Label>
                           <Input placeholder="e.g. Thermodynamics, Equilibrium..." value={topic} onChange={e => setTopic(e.target.value)} className="h-14 rounded-claude-xl border-claude-border-cream" />
                        </div>
                      )}
                      <div className="space-y-2">
                         <Label className="uppercase text-[10px] font-bold tracking-[0.2em] text-claude-stone-gray ml-1">Knowledge Vertical</Label>
                         <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full h-14 bg-white rounded-claude-xl border border-claude-border-cream px-4 font-serif">
                            {SUBJECTS.flatMap(g => g.items).map(s => <option key={s} value={s}>{s}</option>)}
                         </select>
                      </div>
                      <Button onClick={handleScan} disabled={isScanning} className="w-full h-16 bg-claude-terracotta hover:bg-claude-terracotta/90 text-white font-bold rounded-claude-2xl mt-4 shadow-lg text-sm uppercase tracking-widest">
                        {isScanning ? <Loader2 className="animate-spin" /> : <Sparkles className="w-5 h-5 mr-3" />}
                        {isScanning ? "Engaging AI Synth..." : "Initiate Extraction"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-7">
                  {result ? (
                    <Card className="border-none shadow-claude-whisper bg-white rounded-claude-3xl overflow-hidden">
                       <CardHeader className="p-10 border-b border-claude-border-cream">
                          <div className="flex justify-between items-start">
                             <div>
                                <h2 className="text-4xl font-serif font-medium text-claude-near-black mb-2">{result.topicDetected}</h2>
                                <p className="text-claude-olive-gray italic font-serif leading-relaxed text-sm">{result.summary}</p>
                             </div>
                             <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="rounded-full text-[10px] font-bold border-claude-terracotta text-claude-terracotta" onClick={() => publishToLibrary(result)}><Globe className="w-3 h-3 mr-2" />SHARE</Button>
                                <Button variant="outline" size="sm" className="rounded-full text-[10px] font-bold" onClick={() => createClassroom(result)}><Users className="w-3 h-3 mr-2" />CLASS</Button>
                             </div>
                          </div>
                       </CardHeader>
                       <CardContent className="p-10 space-y-8">
                          {result.questions.map((q, i) => (
                             <div key={i} className="p-8 bg-claude-ivory rounded-claude-2xl border border-claude-border-cream relative group shadow-sm">
                                <span className="absolute -top-3 left-8 px-4 py-1 bg-claude-terracotta text-white text-[10px] font-bold rounded-full">QUESTION {i+1}</span>
                                <p className="text-xl font-medium mb-6 leading-relaxed">{q.question}</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   {q.options.map((opt, j) => (
                                      <div key={j} className={`p-4 rounded-claude-xl border flex items-center gap-4 text-sm ${opt === q.correctAnswer ? "bg-green-50 border-green-200 text-green-800" : "bg-white border-claude-border-cream"}`}>
                                         <div className="w-6 h-6 rounded-full bg-claude-parchment flex items-center justify-center font-bold text-[10px]">{String.fromCharCode(65+j)}</div>
                                         {opt}
                                      </div>
                                   ))}
                                </div>
                                <div className="mt-8 pt-6 border-t border-claude-border-cream flex justify-between items-center opacity-60">
                                   <Badge variant="outline" className="uppercase tracking-widest text-[9px] font-bold">{q.difficulty}</Badge>
                                   <span className="text-[10px] font-bold uppercase tracking-widest text-claude-terracotta">{q.targetExam}</span>
                                </div>
                             </div>
                          ))}
                          <div className="flex gap-4">
                             <Button className="flex-1 h-14 bg-claude-near-black text-white rounded-claude-xl" onClick={() => generateQuestionsPDF(result.topicDetected, result.questions)}><Download className="w-5 h-5 mr-3" /> Export PDF</Button>
                             <Button variant="warm-sand" className="flex-1 h-14 rounded-claude-xl" onClick={() => generateQuestionsDocx(result.topicDetected, result.questions)}>Download DOCX</Button>
                          </div>
                       </CardContent>
                    </Card>
                  ) : (
                    <div className="h-[600px] flex flex-col items-center justify-center border-2 border-dashed border-claude-border-cream rounded-claude-3xl bg-white/30 text-center p-12">
                       <div className="w-24 h-24 bg-claude-parchment rounded-full flex items-center justify-center mb-8 shadow-inner"><FileText className="w-10 h-10 text-claude-stone-gray/30" /></div>
                       <h3 className="text-3xl font-serif text-claude-stone-gray mb-4">Command Center Idle</h3>
                       <p className="max-w-xs text-claude-olive-gray font-serif italic italic text-sm">Waiting for strategic data to synthesize a high-fidelity assessment bank.</p>
                    </div>
                  )}
                </div>
              </div>
              
              {history.length > 0 && (
                <div className="mt-24 pt-16 border-t border-claude-border-cream">
                  <h2 className="text-4xl font-serif mb-12">Tactical Archive</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {history.map((h, i) => (
                      <Card key={i} className="bg-white border-none shadow-claude-ring rounded-claude-3xl p-8 hover:shadow-claude-whisper transition-all group cursor-pointer" onClick={() => setResult(h)}>
                        <div className="flex items-center gap-6 mb-6">
                           <div className="w-14 h-14 bg-claude-parchment rounded-claude-xl flex items-center justify-center text-claude-terracotta"><FlaskConical className="w-6 h-6" /></div>
                           <div>
                              <h4 className="text-2xl font-serif font-medium group-hover:text-claude-terracotta transition-colors">{h.topicDetected}</h4>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-claude-stone-gray mt-1">{new Date(h.timestamp).toLocaleDateString()} · {h.questions.length} Items</p>
                           </div>
                        </div>
                        <p className="text-xs text-claude-olive-gray line-clamp-2 font-serif mb-6 leading-relaxed italic">"{h.summary}"</p>
                        <div className="flex gap-2">
                           <Badge variant="secondary" className="bg-claude-parchment text-claude-olive-gray text-[8px] uppercase">{h.keywords[0]}</Badge>
                           <Badge variant="secondary" className="bg-claude-parchment text-claude-olive-gray text-[8px] uppercase">{h.keywords[1]}</Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "library" && (
            <motion.div key="lib" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {libraryBanks.map((b, i) => (
                <Card key={i} className="bg-white border-none shadow-claude-ring rounded-claude-2xl p-8 hover:-translate-y-1 transition-all cursor-pointer" onClick={() => { setResult(b); setActiveTab("generator"); }}>
                   <div className="flex justify-between items-start mb-6">
                      <Badge variant="outline" className="text-[9px] uppercase tracking-widest p-1.5 px-3">{b.subject || "Chemistry"}</Badge>
                      <Share2 className="w-4 h-4 text-claude-stone-gray opacity-40" />
                   </div>
                   <h4 className="text-2xl font-serif mb-2">{b.topicDetected}</h4>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-claude-terracotta mb-6">BY {b.authorName}</p>
                   <p className="text-xs text-claude-olive-gray line-clamp-3 font-serif italic leading-relaxed">{b.summary}</p>
                </Card>
              ))}
            </motion.div>
          )}

          {activeTab === "classrooms" && (
            <motion.div key="crooms" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="max-w-4xl mx-auto space-y-16">
               <Card className="bg-claude-terracotta text-white border-none rounded-claude-3xl p-12 text-center relative overflow-hidden shadow-2xl">
                  <div className="relative z-10">
                     <h2 className="text-4xl font-serif mb-4">Classroom Portal</h2>
                     <p className="opacity-80 mb-10 font-serif italic italic max-w-sm mx-auto">Enter your teacher's command key to sync shared strategic assessments.</p>
                     <div className="flex gap-3 max-w-md mx-auto">
                        <Input placeholder="SCAN-CODE" value={classroomCode} onChange={e => setClassroomCode(e.target.value.toUpperCase())} className="h-16 text-center text-3xl font-mono font-bold bg-white/20 border-white/30 text-white placeholder:text-white/40 rounded-claude-2xl" />
                        <Button onClick={joinClassroom} disabled={isJoining} className="h-16 px-10 bg-white text-claude-terracotta font-bold rounded-claude-2xl shadow-lg">JOIN</Button>
                     </div>
                  </div>
                  <Users className="absolute -bottom-10 -right-10 w-64 h-64 opacity-10 rotate-12" />
               </Card>

               <div className="space-y-8">
                  <div className="flex justify-between items-end border-b border-claude-border-cream pb-6">
                     <h3 className="text-3xl font-serif">Management Deck</h3>
                     {result && (
                       <Button onClick={() => createClassroom(result)} className="bg-claude-near-black text-white rounded-full px-6 text-[10px] font-bold tracking-widest uppercase h-10 shadow-lg">
                          Launch "{result.topicDetected}" as Class
                       </Button>
                     )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {myClassrooms.map((c, i) => (
                        <Card key={i} className="bg-white border-none shadow-claude-ring p-8 rounded-claude-3xl relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-4 font-mono font-bold text-claude-terracotta text-xl">{c.code}</div>
                           <div className="w-12 h-12 bg-claude-parchment rounded-xl flex items-center justify-center mb-6"><Users className="w-6 h-6 text-claude-terracotta" /></div>
                           <h4 className="text-2xl font-serif mb-1">{c.topicDetected}</h4>
                           <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-claude-stone-gray mb-8">{c.subject} · {c.memberCount || 0} MEMBERS</p>
                           <Button variant="outline" className="w-full rounded-full border-claude-terracotta text-claude-terracotta font-bold text-[10px] h-12 tracking-widest uppercase" onClick={() => { setResult(c); setActiveTab("generator"); }}>Manage Intelligence</Button>
                        </Card>
                     ))}
                  </div>
               </div>

               {joinedClasses.length > 0 && (
                 <div className="pt-12 border-t border-claude-border-cream">
                    <h3 className="text-2xl font-serif mb-8">Synced Sessions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {joinedClasses.map((cl, i) => (
                          <div key={i} onClick={() => { setResult(cl); setActiveTab("generator"); }} className="bg-white p-6 rounded-claude-2xl shadow-sm border border-claude-border-cream flex justify-between items-center cursor-pointer hover:shadow-claude-ring transition-all">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-claude-parchment rounded-full flex items-center justify-center font-bold text-claude-terracotta">{cl.topicDetected?.[0]}</div>
                                <div>
                                   <p className="font-bold text-sm truncate max-w-[120px]">{cl.topicDetected}</p>
                                   <p className="text-[8px] uppercase tracking-widest text-claude-stone-gray">{cl.teacherName || "Verified Teacher"}</p>
                                </div>
                             </div>
                             <ChevronRight className="w-4 h-4 text-claude-stone-gray" />
                          </div>
                       ))}
                    </div>
                 </div>
               )}
            </motion.div>
          )}

          {activeTab === "map" && (
            <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-[750px] bg-white/40 backdrop-blur-md rounded-claude-3xl border border-claude-border-cream relative overflow-hidden shadow-2xl">
               <div className="absolute top-10 left-10 p-8 bg-white/80 backdrop-blur-xl border border-claude-border-cream rounded-claude-3xl max-w-sm z-10 shadow-xl">
                  <h2 className="text-3xl font-serif mb-2">Knowledge Universe</h2>
                  <p className="text-xs text-claude-olive-gray font-serif italic italic leading-relaxed">Live mapping of all semantic vectors and strategic assessment nodes in the global index.</p>
               </div>
               <GraphView />
            </motion.div>
          )}
        </AnimatePresence>

        {showBuyModal && (
          <div className="fixed inset-0 bg-claude-near-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-claude-parchment rounded-claude-3xl p-10 max-w-md w-full relative shadow-2xl border border-claude-border-cream">
               <button onClick={() => setShowBuyModal(false)} className="absolute top-6 right-6 text-claude-stone-gray hover:text-claude-near-black"><X /></button>
               <div className="text-center mb-10">
                  <div className="w-16 h-16 bg-claude-terracotta/10 text-claude-terracotta rounded-2xl flex items-center justify-center mx-auto mb-6"><Coins className="w-8 h-8" /></div>
                  <h2 className="text-3xl font-serif mb-2">Refuel Intelligence</h2>
                  <p className="text-sm text-claude-olive-gray">Select an extraction capacity to continue.</p>
               </div>
               <div className="space-y-4">
                  {Object.entries(creditPacks).map(([id, p]: [string, any]) => (
                    <button key={id} onClick={() => handleBuyCredits(id)} disabled={!!isBuying} className="w-full p-6 bg-white border border-claude-border-cream rounded-claude-2xl flex justify-between items-center group hover:border-claude-terracotta transition-all shadow-sm">
                       <div className="text-left">
                          <p className="font-bold text-claude-near-black group-hover:text-claude-terracotta">{p.name}</p>
                          <p className="text-[10px] uppercase font-bold text-claude-stone-gray mt-1 tracking-widest">{p.credits} Scans Available</p>
                       </div>
                       <div className="text-xl font-bold text-claude-terracotta">{p.display}</div>
                    </button>
                  ))}
               </div>
               <p className="text-center text-[10px] font-bold text-claude-stone-gray uppercase tracking-[0.3em] mt-8">Secure Gateway Protected</p>
            </div>
          </div>
        )}
        <Toaster />
      </div>
    </div>
  );
}
