import React, { useState, useRef, useEffect } from "react";
import {
  Upload, Search, FileText, Download, CheckCircle2,
  Loader2, X, ChevronRight, ChevronLeft, BookOpen, Layers,
  LogOut, Coins, FlaskConical, FileBox,
  Globe, Users, GraduationCap, Share2, Sparkles, Sun, Moon
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

const EXAMS = [
  { id: "jee-mains", name: "JEE Mains" },
  { id: "jee-advanced", name: "JEE Advanced" },
  { id: "cbse-12", name: "CBSE 12" },
  { id: "cbse-10", name: "CBSE 10" },
  { id: "neet", name: "NEET" },
  { id: "icse-10", name: "ICSE 10" },
  { id: "isc-12", name: "ISC 12" },
  { id: "wbsche-12", name: "WBSCHE 12" }
];

const CLASSES = ["6", "7", "8", "9", "10", "11", "12", "Graduation"];

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
  const [targetClass, setTargetClass] = useState("12");
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
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
  const [isCroomsLoading, setIsCroomsLoading] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark") ? "dark" : "light";
    }
    return "light";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === "light" ? "dark" : "light");

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
    const q = query(collection(db, "classrooms"), where("creatorUid", "==", user.uid), orderBy("timestamp", "desc"));
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
      const scanResult = await scanSubjectNote(scanMode === "notes" ? images : [], topic, subject, selectedExams, targetClass, idToken);
      setResult(scanResult);
      setCurrentQuestionIdx(0);
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
        theme: { color: "#d4af37" },
      };
      new (window as any).Razorpay(options).open();
    } catch { toast.error("Payment failed."); }
    finally { setIsBuying(null); }
  };

  if (!isAuthReady) return <div className="h-screen flex items-center justify-center bg-royal-cream"><Loader2 className="animate-spin" /></div>;

  if (!user) return (
    <div className="h-screen flex flex-col items-center justify-center bg-royal-cream p-8 text-center">
      <div className="w-20 h-20 rounded-royal-3xl bg-royal-gold text-white flex items-center justify-center mb-8 shadow-xl">
        <FlaskConical className="w-10 h-10" />
      </div>
      <h1 className="text-5xl font-serif font-medium mb-4">ChemScan</h1>
      <p className="text-royal-muted-foreground mb-10 max-w-sm">Elevate your academic strategy with AI-driven intelligence.</p>
      <Button onClick={() => signInWithGoogle()} className="h-14 px-10 bg-royal-gold text-white rounded-royal-xl">Sign in with Google</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-royal-cream text-royal-obsidian font-sans p-4 md:p-12 relative overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        <header className="mb-20 text-center relative">
          <div className="absolute top-0 right-0 flex items-center gap-4">
            <button 
              onClick={() => setShowBuyModal(true)} 
              className="bg-card border border-royal-border-gold px-4 py-2 rounded-royal-lg shadow-sm flex items-center gap-2 hover:bg-accent/10 transition-colors"
            >
              <Coins className="w-4 h-4 text-royal-gold" />
              <span className="text-[10px] font-black tracking-widest text-royal-obsidian dark:text-royal-gold uppercase">{credits} SCANS</span>
            </button>
            
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full border border-royal-border-gold bg-card hover:bg-accent/10 transition-all text-royal-gold shadow-sm"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <button onClick={logOut} className="text-royal-bronze hover:text-royal-gold transition-colors p-2"><LogOut className="w-5 h-5" /></button>
          </div>
          <div className="inline-flex w-16 h-16 bg-royal-gold text-white rounded-royal-2xl items-center justify-center mb-6 shadow-royal-glow">
            <FlaskConical className="w-8 h-8" />
          </div>
          <h1 className="text-6xl font-serif font-medium tracking-tight mb-4">ChemScan</h1>
          <nav className="flex justify-center gap-4 mt-12 bg-white/40 p-1.5 rounded-full inline-flex border border-royal-border-gold">
            {["generator", "library", "classrooms", "map"].map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t as any)}
                className={`px-8 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${activeTab === t ? "bg-royal-gold text-white shadow-md" : "text-royal-bronze hover:text-royal-obsidian"}`}
              >
                {t}
              </button>
            ))}
          </nav>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === "generator" && (
            <motion.div key="gen" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="space-y-10">
              {/* ─── Selection Command Center ─── */}
              <Card className="border-none shadow-royal-ring glass rounded-royal-3xl overflow-hidden p-8 relative">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <Sparkles className="w-20 h-20 text-royal-gold" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
                  {/* Category: Class */}
                  <div className="space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-royal-gold/10 flex items-center justify-center">
                        <GraduationCap className="w-4 h-4 text-royal-gold" />
                      </div>
                      <Label className="uppercase text-[11px] font-black tracking-[0.25em] text-royal-obsidian">Class Selection</Label>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {CLASSES.map(c => (
                        <button
                          key={c}
                          onClick={() => setTargetClass(c)}
                          className={`px-5 py-2.5 rounded-royal-xl text-[11px] font-bold border transition-all duration-300 ${targetClass === c ? "bg-royal-gold border-royal-gold text-white shadow-lg -translate-y-0.5" : "bg-card/50 border-royal-border-gold text-royal-bronze hover:border-royal-gold/50 hover:bg-card"}`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category: Subject */}
                  <div className="space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-royal-gold/10 flex items-center justify-center">
                        <FlaskConical className="w-4 h-4 text-royal-gold" />
                      </div>
                      <Label className="uppercase text-[11px] font-black tracking-[0.25em] text-royal-obsidian">Academic Domain</Label>
                    </div>
                    <div className="max-h-[160px] overflow-y-auto pr-3 custom-scrollbar space-y-6">
                      {SUBJECTS.map(group => (
                        <div key={group.group} className="space-y-3">
                          <p className="text-[9px] uppercase font-black text-royal-bronze/40 px-1 tracking-widest">{group.group}</p>
                          <div className="flex flex-wrap gap-2">
                            {group.items.map(s => (
                              <button
                                key={s}
                                onClick={() => setSubject(s)}
                                className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold border transition-all duration-300 ${subject === s ? "bg-royal-obsidian border-royal-obsidian text-white shadow-md font-serif" : "bg-card/40 border-royal-border-gold text-royal-bronze hover:bg-royal-cream hover:border-royal-bronze/20"}`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category: Exams */}
                  <div className="space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-royal-gold/10 flex items-center justify-center">
                        <Layers className="w-4 h-4 text-royal-gold" />
                      </div>
                      <Label className="uppercase text-[11px] font-black tracking-[0.25em] text-royal-obsidian">Exam Targets <span className="opacity-30 italic font-medium lowercase tracking-normal text-[9px] ml-1">(Optional)</span></Label>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {EXAMS.map(e => (
                        <button
                          key={e.id}
                          onClick={() => {
                            setSelectedExams(prev => 
                              prev.includes(e.name) ? prev.filter(x => x !== e.name) : [...prev, e.name]
                            )
                          }}
                          className={`flex items-center justify-center px-3 py-2.5 rounded-royal-lg text-[10px] font-bold border transition-all duration-300 ${selectedExams.includes(e.name) ? "bg-royal-gold/10 border-royal-gold text-royal-gold shadow-sm font-serif" : "bg-card/40 border-royal-border-gold text-royal-muted-foreground hover:border-royal-gold/30"}`}
                        >
                          {selectedExams.includes(e.name) && <CheckCircle2 className="w-3 h-3 mr-2" />}
                          {e.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sub-Selection Status Bar */}
                <div className="mt-8 pt-6 border-t border-royal-border-gold/50 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-royal-gold animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-royal-obsidian">Active Context:</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="bg-royal-cream border-none text-[9px] font-bold px-3 py-1">CLASS {targetClass}</Badge>
                      <Badge variant="outline" className="bg-royal-cream border-none text-[9px] font-bold px-3 py-1">{subject.toUpperCase()}</Badge>
                      {selectedExams.length > 0 && (
                        <Badge variant="outline" className="bg-royal-gold/5 border-none text-royal-gold text-[9px] font-bold px-3 py-1">{selectedExams.length} EXAM TARGETS</Badge>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-[9px] font-bold text-royal-bronze hover:text-royal-gold" onClick={() => { setTargetClass("12"); setSubject("Chemistry"); setSelectedExams([]); }}>
                    RESET ALL
                  </Button>
                </div>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-4 space-y-8">
                  <Card className="border-none shadow-royal-ring bg-royal-light-emerald dark:bg-royal-deep-emerald/30 backdrop-blur-sm rounded-royal-3xl overflow-hidden">
                    <CardHeader className="p-8 pb-4">
                      <div className="flex bg-royal-cream dark:bg-royal-obsidian/50 p-1 rounded-royal-xl mb-6">
                        <button onClick={() => setScanMode("notes")} className={`flex-1 py-3 px-4 rounded-royal-lg text-[10px] font-bold uppercase tracking-widest transition-all ${scanMode === "notes" ? "bg-card text-royal-gold shadow-sm" : "text-royal-bronze"}`}>Notes Mode</button>
                        <button onClick={() => setScanMode("topics")} className={`flex-1 py-3 px-4 rounded-royal-lg text-[10px] font-bold uppercase tracking-widest transition-all ${scanMode === "topics" ? "bg-card text-royal-gold shadow-sm" : "text-royal-bronze"}`}>Topic Mode</button>
                      </div>
                      <div className="flex justify-between items-end mb-1">
                        <CardTitle className="text-3xl font-serif font-medium">Strategic Inputs</CardTitle>
                        <span className="calligraphy text-lg opacity-60 lowercase">Human-in-the-loop</span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 space-y-6">
                      {scanMode === "notes" ? (
                        <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-royal-border-gold rounded-royal-2xl p-12 text-center hover:bg-royal-cream/50 cursor-pointer transition-colors group">
                          <Upload className="w-10 h-10 mx-auto mb-4 text-royal-bronze/40 group-hover:text-royal-gold transition-colors" />
                          <p className="text-xs font-bold uppercase tracking-widest text-royal-muted-foreground">Upload Intelligence Assets</p>
                          <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleImageUpload} />
                          {images.length > 0 && <p className="mt-4 text-[10px] text-royal-gold font-bold">{images.length}/{MAX_IMAGES} Assets Prepared</p>}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Label className="uppercase text-[10px] font-bold tracking-[0.2em] text-royal-bronze ml-1">Target Subjects</Label>
                          <Input placeholder="e.g. Thermodynamics, Equilibrium..." value={topic} onChange={e => setTopic(e.target.value)} className="h-14 rounded-royal-xl border-royal-border-gold" />
                        </div>
                      )}

                      <Button onClick={handleScan} disabled={isScanning} className="w-full h-16 bg-royal-gold hover:bg-royal-gold/90 text-white font-bold rounded-royal-2xl mt-4 shadow-lg text-sm uppercase tracking-widest">
                        {isScanning ? <Loader2 className="animate-spin" /> : <Sparkles className="w-5 h-5 mr-3" />}
                        {isScanning ? "Engaging AI Synth..." : "Initiate Extraction"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-8">
                  {result ? (
                    <Card className="border-none shadow-royal-glow bg-card backdrop-blur-md rounded-royal-3xl overflow-hidden border border-royal-border-gold/10">
                      <CardHeader className="p-8 md:p-10 border-b border-royal-border-gold relative">
                        <div className="flex justify-between items-start">
                          <div>
                            <h2 className="text-4xl font-serif font-medium text-royal-obsidian mb-2">{result.topicDetected}</h2>
                            <p className="text-royal-muted-foreground italic font-serif leading-relaxed text-sm">{result.summary}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="rounded-full text-[10px] font-bold border-royal-gold text-royal-gold" onClick={() => publishToLibrary(result)}><Globe className="w-3 h-3 mr-2" />SHARE</Button>
                            <Button variant="outline" size="sm" className="rounded-full text-[10px] font-bold" onClick={() => createClassroom(result)}><Users className="w-3 h-3 mr-2" />CLASS</Button>
                          </div>
                        </div>
                        <div className="absolute -bottom-px left-10 right-10 flex gap-1">
                          {result.questions.map((_, i) => (
                            <div key={i} className={`h-1 flex-1 transition-colors ${i === currentQuestionIdx ? "bg-royal-gold" : "bg-royal-border-gold"}`} />
                          ))}
                        </div>
                      </CardHeader>
                      <CardContent className="p-10 min-h-[550px] flex flex-col justify-between">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={currentQuestionIdx}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-8"
                          >
                            <div className="p-8 bg-royal-light-emerald rounded-royal-2xl border border-royal-border-gold relative shadow-sm min-h-[350px]">
                              <div className="flex justify-between items-start mb-8">
                                <span className="px-4 py-1 bg-royal-gold text-white text-[10px] font-bold rounded-full uppercase tracking-widest">Question {currentQuestionIdx + 1} of {result.questions.length}</span>
                                <Badge variant="outline" className="uppercase tracking-widest text-[9px] font-bold">{result.questions[currentQuestionIdx].type || result.questions[currentQuestionIdx].difficulty}</Badge>
                              </div>

                              <p className="text-2xl font-medium mb-10 leading-relaxed text-royal-obsidian">
                                {result.questions[currentQuestionIdx].text || result.questions[currentQuestionIdx].question}
                              </p>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {result.questions[currentQuestionIdx].options.map((opt, j) => (
                                  <div key={j} className={`p-5 rounded-royal-xl border flex items-center gap-4 text-sm transition-all ${opt === (result.questions[currentQuestionIdx].answer || result.questions[currentQuestionIdx].correctAnswer) ? "bg-green-50/50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 glass-1 glass-green-100" : "bg-card border-royal-border-gold shadow-sm"}`}>
                                    <div className="w-8 h-8 rounded-full bg-royal-cream dark:bg-royal-obsidian flex items-center justify-center font-bold text-[11px] shadow-sm">{String.fromCharCode(65 + j)}</div>
                                    <span className="font-serif leading-snug">{opt}</span>
                                  </div>
                                ))}
                              </div>

                              <div className="mt-10 pt-6 border-t border-royal-border-gold flex justify-between items-center group">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-royal-gold bg-royal-gold/5 px-3 py-1.5 rounded-full">{result.questions[currentQuestionIdx].targetExam}</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-royal-bronze italic">{result.questions[currentQuestionIdx].source}</span>
                              </div>
                            </div>
                          </motion.div>
                        </AnimatePresence>

                        <div className="flex items-center justify-between mt-10">
                          <div className="flex gap-3">
                            <Button
                              variant="outline"
                              className="h-14 w-14 rounded-royal-xl border-royal-border-gold disabled:opacity-30"
                              disabled={currentQuestionIdx === 0}
                              onClick={() => setCurrentQuestionIdx(p => p - 1)}
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </Button>
                            <Button
                              variant="outline"
                              className="h-14 w-14 rounded-royal-xl border-royal-border-gold disabled:opacity-30"
                              disabled={currentQuestionIdx === result.questions.length - 1}
                              onClick={() => setCurrentQuestionIdx(p => p + 1)}
                            >
                              <ChevronRight className="w-5 h-5" />
                            </Button>
                          </div>

                          <div className="flex gap-4 flex-1 ml-10">
                            <Button className="flex-1 h-14 bg-royal-obsidian text-white rounded-royal-xl shadow-lg hover:shadow-royal-ring transition-all" onClick={() => generateQuestionsPDF(result.topicDetected, result.questions)}><Download className="w-5 h-5 mr-3" /> Export PDF</Button>
                            <Button variant="warm-sand" className="flex-1 h-14 rounded-royal-xl border border-royal-border-gold hover:bg-royal-light-emerald transition-all" onClick={() => generateQuestionsDocx(result.topicDetected, result.questions)}>Docx</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="h-[600px] flex flex-col items-center justify-center border-2 border-dashed border-royal-border-gold rounded-royal-3xl bg-card/30 backdrop-blur-md text-center p-8 md:p-12">
                      <div className="w-24 h-24 bg-card rounded-full flex items-center justify-center mb-8 shadow-inner border border-royal-border-gold/30"><FileText className="w-10 h-10 text-royal-gold/40" /></div>
                      <div className="space-y-2">
                        <h3 className="text-3xl font-serif text-royal-gold mb-2">Command Center</h3>
                        <p className="calligraphy text-2xl text-royal-bronze">the royal conservatory</p>
                      </div>
                      <p className="max-w-xs text-royal-muted-foreground font-serif italic text-sm mt-6 leading-relaxed">Waiting for strategic data to synthesize a high-fidelity assessment bank.</p>
                      <div className="mt-8 px-6 py-2 border-y border-royal-gold/20">
                         <p className="text-[9px] uppercase tracking-[0.4em] font-black text-royal-gold opacity-40">Ready for Deployment</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {history.length > 0 && (
                <div className="mt-24 pt-16 border-t border-royal-border-gold">
                  <h2 className="text-4xl font-serif mb-12">Tactical Archive</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {history.map((h, i) => (
                      <Card key={i} className="bg-card border-none shadow-royal-ring rounded-royal-3xl p-8 hover:shadow-royal-glow transition-all group cursor-pointer relative overflow-hidden" onClick={() => setResult(h)}>
                        <div className="absolute top-0 right-0 p-4 calligraphy text-lg opacity-10 group-hover:opacity-30 transition-opacity">Archive № {i + 1}</div>
                        <div className="flex items-center gap-6 mb-6">
                          <div className="w-14 h-14 bg-royal-gold/10 rounded-royal-xl flex items-center justify-center text-royal-gold"><FlaskConical className="w-6 h-6" /></div>
                          <div>
                            <h4 className="text-2xl font-serif font-medium group-hover:text-royal-gold transition-colors">{h.topicDetected}</h4>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-royal-bronze mt-1">{new Date(h.timestamp).toLocaleDateString()} · {h.questions.length} Items</p>
                          </div>
                        </div>
                        <p className="text-xs text-royal-muted-foreground line-clamp-2 font-serif mb-6 leading-relaxed italic">"{h.summary}"</p>
                        <div className="flex gap-2">
                          <Badge variant="secondary" className="bg-royal-gold/5 text-royal-gold text-[8px] uppercase border-none font-bold"># {h.keywords[0]}</Badge>
                          <Badge variant="secondary" className="bg-royal-gold/5 text-royal-gold text-[8px] uppercase border-none font-bold"># {h.keywords[1]}</Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "library" && (
            <motion.div key="lib" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="space-y-12">
               <div className="flex justify-between items-end border-b border-royal-border-gold pb-6">
                <div>
                  <h2 className="text-4xl font-serif">The Imperial Library</h2>
                  <p className="calligraphy text-xl text-royal-bronze mt-1 lowercase">public knowledge hub</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {libraryBanks.map((b, i) => (
                  <Card key={i} className="bg-card border-none shadow-royal-ring rounded-royal-2xl p-8 hover:-translate-y-1 transition-all cursor-pointer border border-royal-gold/10" onClick={() => { setResult(b); setActiveTab("generator"); }}>
                    <div className="flex justify-between items-start mb-6">
                      <Badge variant="outline" className="text-[9px] uppercase tracking-widest p-1.5 px-3 border-royal-gold/30 text-royal-gold font-bold">{b.subject || "Chemistry"}</Badge>
                      <Share2 className="w-4 h-4 text-royal-bronze opacity-40" />
                    </div>
                    <h4 className="text-2xl font-serif mb-2">{b.topicDetected}</h4>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-royal-gold mb-6 border-b border-royal-gold/20 pb-1 w-fit">BY {b.authorName}</p>
                    <p className="text-xs text-royal-muted-foreground line-clamp-3 font-serif italic leading-relaxed">{b.summary}</p>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "classrooms" && (
            <motion.div key="crooms" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4 }} className="max-w-4xl mx-auto space-y-16">
              <Card className="bg-royal-gold text-white border-none rounded-royal-3xl p-12 text-center relative overflow-hidden shadow-2xl">
                <div className="relative z-10">
                  <h2 className="text-4xl font-serif mb-4">Academic Collab Hub</h2>
                  <p className="opacity-80 mb-10 font-serif italic max-w-sm mx-auto">Enter the session join code to sync shared strategic assessments.</p>
                  <div className="flex gap-3 max-w-md mx-auto">
                    <Input placeholder="SCAN-CODE" value={classroomCode} onChange={e => setClassroomCode(e.target.value.toUpperCase())} className="h-16 text-center text-3xl font-mono font-bold bg-white/20 border-white/30 text-white placeholder:text-white/40 rounded-royal-2xl" />
                    <Button onClick={joinClassroom} disabled={isJoining} className="h-16 px-10 bg-white text-royal-gold font-bold rounded-royal-2xl shadow-lg">JOIN</Button>
                  </div>
                </div>
                <Users className="absolute -bottom-10 -right-10 w-64 h-64 opacity-10 rotate-12" />
              </Card>

              <div className="space-y-8">
                <div className="flex justify-between items-end border-b border-royal-border-gold pb-6">
                  <div>
                    <h3 className="text-3xl font-serif">Management Deck</h3>
                    <p className="calligraphy text-lg text-royal-bronze lowercase mt-1">orchestrate learning</p>
                  </div>
                  {result && (
                    <Button onClick={() => createClassroom(result)} className="bg-royal-obsidian dark:bg-royal-gold text-white rounded-full px-6 text-[10px] font-bold tracking-widest uppercase h-10 shadow-lg border-none">
                      Launch Class
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {myClassrooms.map((c, i) => (
                    <Card key={i} className="bg-card border-none shadow-royal-ring p-8 rounded-royal-3xl relative overflow-hidden group border border-royal-gold/10">
                      <div className="absolute top-0 right-0 p-4 font-mono font-bold text-royal-gold text-xl opacity-40">{c.code}</div>
                      <div className="w-12 h-12 bg-royal-gold/10 rounded-xl flex items-center justify-center mb-6"><Users className="w-6 h-6 text-royal-gold" /></div>
                      <h4 className="text-2xl font-serif mb-1">{c.topicDetected}</h4>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-royal-bronze mb-8">{c.subject} · {c.memberCount || 0} MEMBERS</p>
                      <Button variant="outline" className="w-full rounded-full border-royal-gold text-royal-gold font-bold text-[10px] h-12 tracking-widest uppercase hover:bg-royal-gold hover:text-white transition-all" onClick={() => { setResult(c); setActiveTab("generator"); }}>Manage Intelligence</Button>
                    </Card>
                  ))}
                </div>
              </div>

              {joinedClasses.length > 0 && (
                <div className="pt-12 border-t border-royal-border-gold">
                  <h3 className="text-2xl font-serif mb-8 flex items-center gap-3">
                    Synced Sessions
                    <span className="calligraphy text-base opacity-40 lowercase">collective wisdom</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {joinedClasses.map((cl, i) => (
                      <div key={i} onClick={() => { setResult(cl); setActiveTab("generator"); }} className="bg-card p-6 rounded-royal-2xl shadow-sm border border-royal-border-gold/30 flex justify-between items-center cursor-pointer hover:shadow-royal-ring transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-royal-gold/10 rounded-full flex items-center justify-center font-bold text-royal-gold border border-royal-gold/20">{cl.topicDetected?.[0]}</div>
                          <div>
                            <p className="font-bold text-sm truncate max-w-[120px] text-royal-obsidian dark:text-royal-gold">{cl.topicDetected}</p>
                            <p className="text-[8px] uppercase tracking-widest text-royal-bronze">{cl.creatorName || "Session Host"}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-royal-gold" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "map" && (
            <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="h-[750px] bg-card/40 backdrop-blur-md rounded-royal-3xl border border-royal-border-gold relative overflow-hidden shadow-2xl">
              <div className="absolute top-10 left-10 p-8 bg-card/80 backdrop-blur-xl border border-royal-border-gold rounded-royal-3xl max-w-sm z-10 shadow-xl">
                <h2 className="text-3xl font-serif mb-2">Knowledge Universe</h2>
                <p className="calligraphy text-xl text-royal-bronze lowercase mb-4">the royal observatory</p>
                <p className="text-xs text-royal-muted-foreground font-serif italic leading-relaxed">Live mapping of all semantic vectors and strategic assessment nodes in the global index.</p>
              </div>
              <GraphView />
            </motion.div>
          )}
        </AnimatePresence>

        {showBuyModal && (
          <div className="fixed inset-0 bg-royal-bronze backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-royal-cream rounded-royal-3xl p-10 max-w-md w-full relative shadow-2xl border border-royal-border-gold">
              <button onClick={() => setShowBuyModal(false)} className="absolute top-6 right-6 text-royal-bronze hover:text-royal-obsidian"><X /></button>
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-royal-gold/10 text-royal-gold rounded-2xl flex items-center justify-center mx-auto mb-6"><Coins className="w-8 h-8" /></div>
                <h2 className="text-3xl font-serif mb-2">Refuel Intelligence</h2>
                <p className="text-sm text-royal-muted-foreground">Select an extraction capacity to continue.</p>
              </div>
              <div className="space-y-4">
                {Object.entries(creditPacks).map(([id, p]: [string, any]) => (
                  <button key={id} onClick={() => handleBuyCredits(id)} disabled={!!isBuying} className="w-full p-6 bg-white border border-royal-border-gold rounded-royal-2xl flex justify-between items-center group hover:border-royal-gold transition-all shadow-sm">
                    <div className="text-left">
                      <p className="font-bold text-royal-obsidian group-hover:text-royal-gold">{p.name}</p>
                      <p className="text-[10px] uppercase font-bold text-royal-bronze mt-1 tracking-widest">{p.credits} Scans Available</p>
                    </div>
                    <div className="text-xl font-bold text-royal-gold">{p.display}</div>
                  </button>
                ))}
              </div>
              <p className="text-center text-[10px] font-bold text-royal-bronze uppercase tracking-[0.3em] mt-8">Secure Gateway Protected</p>
            </div>
          </div>
        )}
        <Toaster />
      </div>
    </div>
  );
}
