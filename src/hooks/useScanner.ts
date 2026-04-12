import { useState, useEffect, useRef } from "react";
import { User } from "firebase/auth";
import { db } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { toast } from "sonner";
import { scanSubjectNote, ScanResult } from "../lib/gemini";
import { ScanStatus } from "../lib/types";

export function useScanner(user: User | null, credits: number, setCredits?: (c: number) => void) {
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (status === "processing") {
      progressTimerRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 98) return 98;
          // Unpredictable growth: smaller increments as it gets higher
          const growth = prev < 80 ? (Math.random() * 2 + 0.5) : (Math.random() * 0.5);
          return Math.min(98, prev + growth);
        });
      }, 800);
    } else {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    }
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [status]);

  const performScan = async (
    mode: "notes" | "topics", 
    data: string[] | File,
    subject: string = "Science",
    exams: string[] = [],
    targetClass: string = "General"
  ) => {
    if (!user) return;
    if (credits <= 0) {
      toast.error("Low discovery units. Please top up.");
      return;
    }

    setStatus("uploading");
    setProgress(30);

    try {
      const idToken = await user.getIdToken();
      let scanResult: ScanResult;

      if (mode === "notes" && data instanceof File) {
          // Convert file to base64 for the API
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(data);
          });
          const base64 = await base64Promise;
          
          setStatus("processing");
          setProgress(60);
          scanResult = await scanSubjectNote([base64], "", subject, exams, targetClass, idToken);
      } else if (mode === "topics" && Array.isArray(data)) {
          setStatus("processing");
          setProgress(60);
          scanResult = await scanSubjectNote([], data.join(", "), subject, exams, targetClass, idToken);
      } else {
          throw new Error("Invalid scan mode or data");
      }


      setResult(scanResult);
      setProgress(90);
      
      if (setCredits) setCredits(credits - 1);

      setStatus("success");
      setProgress(100);
      toast.success("Discovery Complete");
    } catch (err: any) {
      setStatus("failed");
      setProgress(0);
      toast.error(err.message || "Synthesis failed");
    } finally {
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const scanFile = (file: File, subject?: string, exams?: string[], targetClass?: string) => 
    performScan("notes", file, subject, exams, targetClass);
    
  const scanTopics = (topics: string[], subject?: string, exams?: string[], targetClass?: string) => 
    performScan("topics", topics, subject, exams, targetClass);

  return { status, progress, scanFile, scanTopics, result };
}
