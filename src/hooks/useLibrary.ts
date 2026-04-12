import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { db } from "@/src/lib/firebase";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { HistoryItem } from "../lib/types";
import { toast } from "sonner";

export function useLibrary(user: User | null, isAuthReady: boolean) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [libraryBanks, setLibraryBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthReady || !user) {
      setHistory([]);
      return;
    }
    const q = query(collection(db, `users/${user.uid}/history`), orderBy("timestamp", "desc"));
    return onSnapshot(q, (snap) => {
      setHistory(snap.docs.map(d => {
        const data = d.data();
        const parsedQuestions = (typeof data.questions === 'string' ? JSON.parse(data.questions) : data.questions) || [];
        
        // Map legacy 'question' -> 'text' for each question node
        const normalizedQuestions = parsedQuestions.map((q: any) => ({
          ...q,
          text: q.text || q.question
        }));

        return {
          id: d.id,
          ...data,
          questions: normalizedQuestions
        } as HistoryItem;
      }));
    });
  }, [user, isAuthReady]);

  const fetchLibrary = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/library");
      const data = await res.json();
      setLibraryBanks(data.banks || []);
    } catch {
      toast.error("Failed to load library");
    } finally {
      setLoading(false);
    }
  };

  const refreshHistory = async () => {
    // Manual refresh of library banks if needed
    await fetchLibrary();
  };

  return { history, libraryBanks, loading, fetchLibrary, refreshHistory };
}
