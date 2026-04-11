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
          <div className="absolute top-0 right-0 flex items-center gap-6">
            <button 
              onClick={onOpenBuyModal} 
              className="bg-card px-5 py-2.5 rounded-2xl shadow-terra-soft flex items-center gap-3 hover:bg-muted transition-all group"
            >
              <Gem className="w-4 h-4 text-accent" />
              <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] font-black uppercase tracking-widest text-secondary/40">Units</span>
                <span className="text-sm font-bold text-secondary">{credits}</span>
              </div>
            </button>
            
            <div className="flex items-center gap-2 bg-card p-1 rounded-2xl shadow-terra-soft">
                <button 
                    onClick={theme === 'light' ? toggleTheme : toggleTheme}
                    className="p-2.5 rounded-xl hover:bg-primary/5 transition-all text-secondary"
                >
                    {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </button>

                <div className="w-px h-6 bg-primary/5" />

                <div className="relative group/profile flex items-center gap-3 pl-2 pr-4 py-1.5 cursor-pointer hover:bg-primary/5 rounded-xl transition-all">
                    <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center overflow-hidden">
                        <img 
                            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${credits}`} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="hidden md:flex flex-col items-start leading-none">
                        <span className="text-[10px] font-black uppercase tracking-widest text-secondary/40">Researcher</span>
                        <span className="text-xs font-bold text-secondary">Settings</span>
                    </div>

                    {/* Simple Dropdown Overlay */}
                    <div className="absolute top-full right-0 mt-2 w-48 bg-card rounded-2xl shadow-xl opacity-0 translate-y-2 pointer-events-none group-hover/profile:opacity-100 group-hover/profile:translate-y-0 group-hover/profile:pointer-events-auto transition-all z-50 p-2">
                        <button className="w-full text-left px-4 py-2.5 text-xs font-bold text-secondary hover:bg-primary/5 rounded-xl transition-all">Account Profile</button>
                        <button className="w-full text-left px-4 py-2.5 text-xs font-bold text-secondary hover:bg-primary/5 rounded-xl transition-all">Subscription</button>
                        <div className="h-px bg-primary/5 my-1" />
                        <button onClick={onLogout} className="w-full text-left px-4 py-2.5 text-xs font-bold text-destructive hover:bg-destructive/5 rounded-xl transition-all flex items-center gap-2">
                            <LogOut className="w-3 h-3" /> Logout
                        </button>
                    </div>
                </div>
            </div>
          </div>
          
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center mb-8 rotate-3 hover:rotate-0 transition-transform duration-500">
            <FlaskConical className="w-10 h-10" />
          </div>
          
          <div className="text-center space-y-2">
            <h1 className="text-5xl md:text-7xl font-serif font-semibold tracking-tight text-primary">ChemScan</h1>
            <p className="calligraphy text-2xl text-accent opacity-80">Organic Knowledge Generation</p>
          </div>
          
          <nav className="flex flex-wrap justify-center gap-2 mt-12 bg-muted/30 p-1.5 rounded-2xl">
            {["generator", "library", "classrooms", "map"].map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t as any)}
                className={`px-8 py-3 rounded-xl text-xs font-bold capitalize transition-all duration-500 ${
                    activeTab === t 
                    ? "bg-primary text-primary-foreground shadow-terra-soft -translate-y-0.5" 
                    : "text-secondary hover:text-primary hover:bg-primary/5"
                }`}
              >
                {t === 'map' ? 'Knowledge Map' : t}
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
