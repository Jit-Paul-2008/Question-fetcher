import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { db } from "@/src/lib/firebase";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { toast } from "sonner";

export function useClassrooms(user: User | null, isAuthReady: boolean) {
  const [myClassrooms, setMyClassrooms] = useState<any[]>([]);
  const [joinedClasses, setJoinedClasses] = useState<any[]>([]);
  const [isCroomsLoading, setIsCroomsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!isAuthReady || !user) {
      setMyClassrooms([]);
      return;
    }
    setIsCroomsLoading(true);
    const q = query(
      collection(db, "classrooms"),
      where("creatorUid", "==", user.uid),
      orderBy("timestamp", "desc")
    );
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

  const joinClassroom = async (code: string) => {
    if (!user || !code) return;
    setIsJoining(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/classroom/join", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.success) {
        setJoinedClasses(prev => [data, ...prev.filter(c => c.topicDetected !== data.topicDetected)]);
        toast.success("Enrolled successfully!");
        return data;
      }
      throw new Error(data.message || "Join failed");
    } catch (err: any) {
      toast.error(err.message || "Error joining.");
      return null;
    } finally {
      setIsJoining(false);
    }
  };

  const createClassroom = async (bank: any) => {
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
        return data.code;
      }
    } catch {
      toast.error("Error creating class.");
    }
    return null;
  };

  return { myClassrooms, joinedClasses, isCroomsLoading, isJoining, joinClassroom, createClassroom };
}
