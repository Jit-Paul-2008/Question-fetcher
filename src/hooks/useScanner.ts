import { useState } from "react";
import { User } from "firebase/auth";
import { db } from "@/src/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { toast } from "sonner";
import { scanSubjectNote, ScanResult } from "@/src/lib/gemini";
import { ScanMode } from "../lib/types";

export function useScanner(user: User | null, credits: number, setCredits: (c: number | ((p: number) => number)) => void) {
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

  const handleScan = async (scanMode: ScanMode, images: string[], topic: string, subject: string, selectedExams: string[], targetClass: string) => {
    if (!user) return;
    if (credits <= 0) {
       toast.error("Insufficient units. Please top up.");
       return "NEED_CREDITS";
    }
    
    setIsScanning(true);
    try {
      const idToken = await user.getIdToken();
      const scanResult = await scanSubjectNote(scanMode === "notes" ? images : [], topic, subject, selectedExams, targetClass, idToken);
      
      setResult(scanResult);
      setCurrentQuestionIdx(0);
      setCredits(prev => prev - 1);
      
      await addDoc(collection(db, `users/${user.uid}/history`), {
        topicDetected: scanResult.topicDetected,
        summary: scanResult.summary,
        keywords: scanResult.keywords,
        questions: JSON.stringify(scanResult.questions),
        timestamp: Date.now(),
      });
      
      toast.success("Extraction complete!");
      return "SUCCESS";
    } catch (err: any) {
      toast.error(err.message || "Scan failed.");
      return "FAILED";
    } finally {
      setIsScanning(false);
    }
  };

  return { isScanning, result, setResult, currentQuestionIdx, setCurrentQuestionIdx, handleScan };
}
