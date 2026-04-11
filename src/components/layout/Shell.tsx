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
    <div className="min-h-screen bg-background text-foreground font-sans p-6 md:p-16 relative overflow-x-hidden transition-colors duration-1000">
      {/* Organic texture overlays */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.02] mix-blend-multiply" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/sandpaper.png")' }} />
      
      <div className="max-w-6xl mx-auto relative z-10 animate-terra-in">
        <header className="mb-20 relative flex flex-col items-center">
          <div className="absolute top-0 right-0 flex items-center gap-4">
            <button 
              onClick={onOpenBuyModal} 
              className="bg-card border border-accent/20 px-4 py-2 rounded-royal-xl shadow-terra-soft flex items-center gap-2 hover:bg-muted transition-all group"
            >
              <Gem className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold tracking-tight text-foreground/80">{credits} Units</span>
            </button>
            
            <button 
              onClick={theme === 'light' ? toggleTheme : toggleTheme}
              className="p-2.5 rounded-full border border-accent/10 bg-card hover:border-accent/30 transition-all text-secondary shadow-terra-soft"
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <button onClick={onLogout} className="text-secondary/60 hover:text-destructive transition-colors p-2.5">
                <LogOut className="w-5 h-5" />
            </button>
          </div>
          
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center mb-8 rotate-3 hover:rotate-0 transition-transform duration-500">
            <FlaskConical className="w-10 h-10" />
          </div>
          
          <div className="text-center space-y-2">
            <h1 className="text-5xl md:text-7xl font-serif font-semibold tracking-tight text-primary">ChemScan</h1>
            <p className="calligraphy text-2xl text-accent opacity-80">Organic Knowledge Generation</p>
          </div>
          
          <nav className="flex flex-wrap justify-center gap-2 mt-12 bg-muted/30 p-1.5 rounded-2xl border border-primary/5">
            {["generator", "library", "classrooms"].map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t as any)}
                className={`px-8 py-3 rounded-xl text-xs font-bold capitalize transition-all duration-500 ${
                    activeTab === t 
                    ? "bg-primary text-primary-foreground shadow-terra-soft -translate-y-0.5" 
                    : "text-secondary hover:text-primary hover:bg-primary/5"
                }`}
              >
                {t}
              </button>
            ))}
          </nav>
        </header>

        <main className="pb-12">
          {children}
        </main>
      </div>
    </div>
  );
}
