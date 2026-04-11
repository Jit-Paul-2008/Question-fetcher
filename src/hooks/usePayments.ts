import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { toast } from "sonner";
import { CreditPack } from "../lib/types";

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(script);
  });
}

export function usePayments(user: User | null, setCredits: (c: number | ((p: number) => number)) => void) {
  const [razorpayKeyId, setRazorpayKeyId] = useState("");
  const [creditPacks, setCreditPacks] = useState<Record<string, CreditPack>>({});
  const [isBuying, setIsBuying] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then(r => r.json())
      .then(data => {
        setRazorpayKeyId(data.razorpayKeyId || "");
        setCreditPacks(data.creditPacks || {});
      })
      .catch(() => {});
  }, []);

  const handleBuyCredits = async (packId: string) => {
    if (!user) return;
    setIsBuying(packId);
    try {
      await loadRazorpayScript();
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId, uid: user.uid }),
      });
      const { orderId, amount, currency } = await orderRes.json();
      const idToken = await user.getIdToken();
      
      const options = {
        key: razorpayKeyId,
        amount,
        currency,
        order_id: orderId,
        name: "ChemScan",
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
            body: JSON.stringify({ ...response, packId }),
          });
          const resJson = await verifyRes.json();
          if (resJson.success) {
            setCredits(prev => prev + resJson.creditsAdded);
            toast.success("Credits added!");
            return true;
          }
          return false;
        },
        theme: { color: "#d4af37" },
      };
      new (window as any).Razorpay(options).open();
    } catch {
      toast.error("Payment failed.");
    } finally {
      setIsBuying(null);
    }
  };

  return { razorpayKeyId, creditPacks, isBuying, buyCredits: handleBuyCredits };
}
