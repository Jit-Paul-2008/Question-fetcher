import { useState, useEffect } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/src/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "sonner";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [credits, setCredits] = useState(0);

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

  return { user, isAuthReady, credits, setCredits };
}
