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
    { credits: 5, price: 99, label: "Seed Access", icon: Zap, color: "text-primary", popular: false },
    { credits: 25, price: 399, label: "Cultivator Pro", icon: Gem, color: "text-accent", popular: true },
    { credits: 100, price: 1499, label: "Harvest Master", icon: Award, color: "text-primary", popular: false },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-secondary/20 backdrop-blur-md transition-opacity animate-terra-in" onClick={onClose} />
      
      <div className="bg-card max-w-4xl w-full relative z-10 overflow-hidden animate-terra-in rounded-[3.5rem] shadow-2xl">
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-primary via-accent to-primary opacity-20" />
        
        <button 
          onClick={onClose}
          className="absolute top-10 right-10 p-4 rounded-2xl bg-muted hover:bg-primary/5 transition-all group shadow-sm"
        >
          <X className="w-6 h-6 text-secondary group-hover:rotate-90 transition-transform" />
        </button>

        <div className="p-16 md:p-24">
          <div className="text-center space-y-6 mb-20">
            <h2 className="text-5xl font-serif font-bold text-primary">Expand Your Potential</h2>
            <p className="text-sm font-bold text-secondary/40 uppercase tracking-[0.3em]">
              Acquire intelligence units to fuel your cognitive journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {plans.map((plan) => (
              <div
                key={plan.label}
                className={`bg-card p-12 flex flex-col items-center text-center relative group hover:shadow-2xl transition-all duration-700 rounded-[3rem] ${plan.popular ? 'bg-muted/30 shadow-xl' : 'shadow-terra-soft'}`}
              >
                {plan.popular && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-8 py-2 bg-accent text-white text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-lg">
                        Recommended Choice
                    </div>
                )}

                <div className={`p-6 rounded-[2rem] bg-muted mb-10 ${plan.color} transform group-hover:scale-110 transition-transform duration-500`}>
                  <plan.icon className="w-10 h-10" />
                </div>

                <div className="space-y-3 mb-10">
                    <h3 className="text-xl font-serif font-bold text-primary">{plan.label}</h3>
                    <div className="flex items-center justify-center gap-1">
                        <span className="text-4xl font-serif font-bold text-secondary">₹{plan.price}</span>
                    </div>
                </div>

                <div className="text-xs font-bold text-accent uppercase tracking-widest mb-12">
                    +{plan.credits} Intelligent Units
                </div>

                <button 
                    onClick={() => onSelectPlan(plan.credits, plan.price)}
                    className={`w-full py-5 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3 ${
                        plan.popular 
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90' 
                        : 'bg-muted text-primary hover:bg-primary/5'
                    }`}
                >
                    Acquire Units
                    <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-20 pt-16 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex items-center gap-4">
                <Shield className="w-6 h-6 text-primary/40" />
                <span className="text-xs font-bold text-secondary/40 uppercase tracking-widest italic">Organic Secure Protocol</span>
            </div>
            <div className="flex items-center gap-12">
                <span className="text-[10px] font-bold text-secondary/30 uppercase tracking-[0.2em]">Tier-1 Processing</span>
                <span className="text-[10px] font-bold text-secondary/30 uppercase tracking-[0.2em]">Verified Synthesis</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
