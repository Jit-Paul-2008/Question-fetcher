import { useEffect, useRef } from "react";
import { User } from "firebase/auth";
import { toast } from "sonner";
import { scanSubjectNote, ScanResult } from "../lib/gemini";
import { useScannerContext } from "../context/ScannerContext";

export function useScanner(user: User | null, credits: number, setCredits?: (c: number) => void) {
  const { 
    status, setStatus, 
    progress, setProgress, 
    progressMsg, setProgressMsg,
    result, setResult, 
    error, setError,
    reset 
  } = useScannerContext();
  
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
  }, [status, setProgress]);

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

    setError(null);
    setStatus("uploading");
    setProgress(10);
    setProgressMsg("Establishing secure connection...");

    try {
      const idToken = await user.getIdToken();
      let scanResult: ScanResult;

      if (mode === "notes" && data instanceof File) {
          setProgressMsg("Transmitting orbital data...");
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(data);
          });
          const base64 = await base64Promise;
          
          setStatus("processing");
          setProgress(40);
          setProgressMsg("Analyzing molecular structure...");
          scanResult = await scanSubjectNote([base64], "", subject, exams, targetClass, idToken);
      } else if (mode === "topics" && Array.isArray(data)) {
          setStatus("processing");
          setProgress(40);
          setProgressMsg("Querying tactical databases...");
          scanResult = await scanSubjectNote([], data.join(", "), subject, exams, targetClass, idToken);
      } else {
          throw new Error("Invalid scan mode or data");
      }

      setResult(scanResult);
      setProgress(100);
      setStatus("success");
      setProgressMsg("Synthesis complete.");
      toast.success("Discovery Complete");
    } catch (err: any) {
      setStatus("failed");
      setProgress(0);
      setProgressMsg("Critical error encountered.");
      setError(err.message || "Synthesis failed");
      toast.error(err.message || "Synthesis failed");
    } finally {
      // Auto-reset state back to idle after a while if not success
      if (status !== "success") {
        setTimeout(() => setStatus("idle"), 3000);
      }
    }
  };

  const scanFile = (file: File, subject?: string, exams?: string[], targetClass?: string) => 
    performScan("notes", file, subject, exams, targetClass);
    
  const scanTopics = (topics: string[], subject?: string, exams?: string[], targetClass?: string) => 
    performScan("topics", topics, subject, exams, targetClass);

  return { status, progress, progressMsg, scanFile, scanTopics, result, reset, error };
}

