import { useState, useEffect } from "react";
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut 
} from "firebase/auth";
import { auth, db, googleProvider } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "sonner";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setLoading(true);
        try {
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
        } catch (err) {
          console.error("Profile sync error", err);
        } finally {
          setLoading(false);
        }
      } else {
        setCredits(0);
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const login = async (e: string, p: string) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, e, p);
    } catch (err: any) {
      setError(err.message);
      toast.error("Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const register = async (e: string, p: string) => {
    setLoading(true);
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, e, p);
    } catch (err: any) {
      setError(err.message);
      toast.error("Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message);
      toast.error("Google Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err: any) {
      toast.error("Logout failed.");
    }
  };

  return { user, loading, error, credits, setCredits, login, register, googleLogin, logout };
}
