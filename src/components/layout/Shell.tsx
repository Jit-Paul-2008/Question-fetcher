import React from "react";
import { LogOut, Gem, Sun, Moon, FlaskConical } from "lucide-react";
import { ActiveTab, Theme } from "../../lib/types";

interface ShellProps {
  children: React.ReactNode;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  credits: number;
  theme: Theme;
  toggleTheme: () => void;
  onLogout: () => void;
  onOpenBuyModal: () => void;
}

export function Shell({
  children,
  activeTab,
  setActiveTab,
  credits,
  theme,
  toggleTheme,
  onLogout,
  onOpenBuyModal
}: ShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-4 md:p-12 relative overflow-x-hidden transition-colors duration-700">
      <div className="fixed inset-0 pointer-events-none z-[100] premium-grain opacity-[0.03] dark:opacity-[0.05]" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <header className="mb-24 text-center relative">
          <div className="absolute top-0 right-0 flex items-center gap-5">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="calligraphy text-xl leading-none text-accent lowercase">royal scholar</span>
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-royal-bronze opacity-40">premium access</span>
            </div>

            <button 
              onClick={onOpenBuyModal} 
              className="glass-gold px-5 py-2.5 rounded-royal-lg shadow-sm flex items-center gap-2.5 hover:bg-amber-100/20 transition-all group"
            >
              <Gem className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black tracking-widest text-accent uppercase">{credits} UNITS</span>
            </button>
            
            <button 
              onClick={toggleTheme}
              className="p-3 rounded-full border border-accent/20 glass-gold hover:border-accent/50 transition-all text-accent shadow-sm"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <button onClick={onLogout} className="text-royal-bronze hover:text-accent transition-colors p-2.5 hover:rotate-12 transition-transform">
                <LogOut className="w-5 h-5" />
            </button>
          </div>
          
          <div className="inline-flex w-16 h-16 bg-primary text-primary-foreground rounded-royal-2xl items-center justify-center mb-6 shadow-royal-glow">
            <FlaskConical className="w-8 h-8" />
          </div>
          
          <h1 className="text-6xl font-serif font-medium tracking-tight mb-4 text-royal-gradient">ChemScan</h1>
          
          <nav className="flex justify-center gap-2 mt-12 bg-card/40 backdrop-blur-md p-1.5 rounded-full inline-flex border border-accent/20">
            {["generator", "library", "classrooms", "map"].map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t as any)}
                className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === t 
                    ? "bg-primary text-primary-foreground shadow-lg scale-105" 
                    : "text-royal-bronze hover:text-foreground opacity-60 hover:opacity-100"
                }`}
              >
                {t}
              </button>
            ))}
          </nav>
        </header>

        <main>
          {children}
        </main>
      </div>
    </div>
  );
}
