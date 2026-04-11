import React from "react";
import { X, Gem, Zap, Shield, ChevronRight, Award } from "lucide-react";

interface BuyModalProps {
  onClose: () => void;
  onSelectPlan: (credits: number, amount: number) => void;
}

export function BuyModal({
  onClose,
  onSelectPlan
}: BuyModalProps) {
  const plans = [
    { credits: 5, price: 99, label: "Basic Access", icon: Zap, color: "text-emerald-500", popular: false },
    { credits: 25, price: 399, label: "Researcher Pro", icon: Gem, color: "text-amber-500", popular: true },
    { credits: 100, price: 1499, label: "Sovereign Scholar", icon: Award, color: "text-purple-500", popular: false },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl transition-opacity animate-in fade-in duration-500" onClick={onClose} />
      
      <div className="glass-card max-w-4xl w-full relative z-10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-700 shadow-2xl">
        <div className="absolute top-0 inset-x-0 h-1.5 bg-royal-gradient" />
        
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 p-3 rounded-full hover:bg-accent/5 transition-all group"
        >
          <X className="w-5 h-5 text-royal-bronze group-hover:rotate-90 transition-transform" />
        </button>

        <div className="p-12 md:p-16">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-serif text-royal-gradient">Expand Your Intelligence Capacity</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-royal-bronze opacity-60">
              Acquire premium units to power your research pipeline
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div 
                key={plan.label}
                className={`glass-card p-10 flex flex-col items-center text-center relative group hover:scale-[1.05] transition-all duration-500 ${plan.popular ? 'border-accent shadow-royal-glow ring-2 ring-accent/20' : 'border-accent/10'}`}
              >
                {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1.5 bg-accent text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-lg">
                        Recommended
                    </div>
                )}

                <div className={`p-5 rounded-royal-2xl bg-card border border-accent/10 mb-8 ${plan.color}`}>
                  <plan.icon className="w-8 h-8" />
                </div>

                <div className="space-y-2 mb-8">
                    <h3 className="text-lg font-serif">{plan.label}</h3>
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-3xl font-serif text-foreground">₹{plan.price}</span>
                    </div>
                </div>

                <div className="text-[10px] font-black text-accent uppercase tracking-widest mb-10">
                    +{plan.credits} Intelligence Units
                </div>

                <button 
                    onClick={() => onSelectPlan(plan.credits, plan.price)}
                    className={`w-full py-4 rounded-royal-xl font-black uppercase tracking-widest text-[9px] transition-all flex items-center justify-center gap-2 ${
                        plan.popular 
                        ? 'bg-primary text-primary-foreground shadow-lg' 
                        : 'bg-accent/5 border border-accent/20 text-accent hover:bg-accent/10'
                    }`}
                >
                    Acquire Now
                    <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-16 pt-12 border-t border-accent/10 flex flex-col md:flex-row items-center justify-between gap-8 opacity-40">
            <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-royal-bronze">End-to-End Encrypted Transaction</span>
            </div>
            <div className="flex items-center gap-8">
                <span className="text-[8px] font-black text-royal-bronze uppercase tracking-widest">Razorpay Powered</span>
                <span className="text-[8px] font-black text-royal-bronze uppercase tracking-widest">Instant Credit Sync</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
