import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { db } from "@/src/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { HistoryItem } from "../lib/types";

function normalizeHistoryItem(doc: any): HistoryItem {
  const data = doc.data ? doc.data() : doc;
  const parsedQuestions = (typeof data.questions === "string" ? JSON.parse(data.questions) : data.questions) || [];

  const normalizedQuestions = parsedQuestions.map((question: any) => ({
    ...question,
    text: question.text || question.question,
  }));

  return {
    id: doc.id,
    ...data,
    questions: normalizedQuestions,
    reportSettings: data.reportSettings || { includeAnswers: true, brandLabel: "Question Fetcher" },
  } as HistoryItem;
}

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
      setHistory(snap.docs.map(normalizeHistoryItem));
    });
  }, [user, isAuthReady]);

  const refreshHistory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/library", {
        headers: { "Authorization": `Bearer ${idToken}` }
      });
      if (!res.ok) throw new Error("Failed to refresh");
      const data = await res.json();
      setHistory((data.banks || []).map(normalizeHistoryItem));
      console.log(`[Library:Refreshed] Synced ${data.banks?.length || 0} items`);
    } catch (err) {
      console.error("Library refresh error:", err);
    } finally {
      setLoading(false);
    }
  };

  return { history, loading, refreshHistory };
}
