import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { db } from "@/src/lib/firebase";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { HistoryItem } from "../lib/types";
import { toast } from "sonner";

export function useLibrary(user: User | null, isAuthReady: boolean) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [libraryBanks, setLibraryBanks] = useState<any[]>([]);
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);

  useEffect(() => {
    if (!isAuthReady || !user) {
      setHistory([]);
      return;
    }
    const q = query(collection(db, `users/${user.uid}/history`), orderBy("timestamp", "desc"));
    return onSnapshot(q, (snap) => {
      setHistory(snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        questions: typeof d.data().questions === 'string' ? JSON.parse(d.data().questions) : d.data().questions
      } as HistoryItem)));
    });
  }, [user, isAuthReady]);

  const fetchLibrary = async () => {
    setIsLibraryLoading(true);
    try {
      const res = await fetch("/api/library");
      const data = await res.json();
      setLibraryBanks(data.banks || []);
    } catch {
      toast.error("Failed to load library");
    } finally {
      setIsLibraryLoading(false);
    }
  };

  return { history, libraryBanks, isLibraryLoading, fetchLibrary };
}
