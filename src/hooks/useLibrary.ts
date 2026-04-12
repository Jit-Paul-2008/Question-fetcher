import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { db } from "@/src/lib/firebase";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { HistoryItem } from "../lib/types";
import { toast } from "sonner";

export function useLibrary(user: User | null, isAuthReady: boolean) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
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

  const refreshHistory = async () => {
    // Firestore realtime listener already syncs automatically
    // This method is kept for manual refresh if needed
    if (!user) return;
    setLoading(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/library", {
        headers: { "Authorization": `Bearer ${idToken}` }
      });
      if (!res.ok) throw new Error("Failed to refresh");
      const data = await res.json();
      // Update history from server response
      setHistory(data.banks || []);
      console.log(`[Library:Refreshed] Synced ${data.banks?.length || 0} items`);
    } catch (err) {
      console.error("Library refresh error:", err);
    } finally {
      setLoading(false);
    }
  };

  return { history, loading, refreshHistory };
}
