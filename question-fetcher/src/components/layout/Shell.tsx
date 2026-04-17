import React from "react";
import { LogOut, Gem, Sun, Moon, FlaskConical, LayoutGrid, Library, FileText, Settings, ChevronRight, Activity, ShieldCheck, Database } from "lucide-react";
import { ActiveTab, Theme } from "../../lib/types";

interface ShellProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  credits: number;
  theme: Theme;
  toggleTheme: () => void;
  onLogout: () => void;
  onOpenBuyModal: () => void;
  children?: React.ReactNode;
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
  const navItems = [
    { id: "generator", label: "Synthesis Core", icon: LayoutGrid, desc: "AI Retrieval Engine" },
    { id: "history", label: "Archive", icon: Library, desc: "Personal History" },
    { id: "results", label: "Current Result", icon: FileText, desc: "Question Set Viewer" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex overflow-hidden grid-pattern">
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full" />
      </div>

      {/* Primary HUD Navigation (Sidebar) */}
      <aside className="w-80 border-r border-white/5 flex flex-col z-50 relative bg-black/20 backdrop-blur-md">
        {/* Branding & Status */}
        <div className="p-8 pb-4">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 glow-cyan">
              <FlaskConical className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white font-display uppercase italic">ChemScan</h1>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Core Reactive</span>
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3 hud-border">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-white/40">
              <span className="flex items-center gap-2"><Activity className="w-3 h-3 text-primary" /> System Load</span>
              <span className="text-primary italic">Nominal</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[32%] shadow-[0_0_10px_var(--glow-cyan)]" />
            </div>
          </div>
        </div>

        {/* Global Navigation */}
        <nav className="flex-1 px-4 py-8 space-y-2">
          <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-white/20 mb-6">Execution Modules</p>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full text-left group transition-all duration-500 relative ${
                activeTab === item.id ? "mb-4" : ""
              }`}
            >
              <div className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 relative z-10 ${
                activeTab === item.id
                  ? "bg-primary text-primary-foreground glow-cyan scale-[1.02]"
                  : "text-white/40 hover:bg-white/[0.03] hover:text-white/60"
              }`}>
                <item.icon className="w-5 h-5" />
                <div className="flex flex-col">
                  <span className="font-bold text-sm tracking-tight">{item.label}</span>
                  {activeTab === item.id && (
                    <span className="text-[10px] font-medium opacity-70 animate-in slide-in-from-left-2 duration-500">{item.desc}</span>
                  )}
                </div>
                {activeTab === item.id && <ChevronRight className="w-4 h-4 ml-auto" />}
              </div>
              {/* Active Tab Indicator Glow */}
              {activeTab === item.id && (
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full blur-[2px]" />
              )}
            </button>
          ))}
        </nav>

        {/* Resource Allocation */}
        <div className="p-6 mt-auto">
          <div className="p-6 rounded-[2rem] synth-glass space-y-4 border border-white/10 group overflow-hidden relative">
            {/* Background Grain */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none grid-pattern" />
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-white/40 tracking-widest uppercase">Discovery Units</span>
                <span className="text-3xl font-bold tracking-tighter text-white">{credits}</span>
              </div>
              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/20">
                <Gem className="w-5 h-5 text-primary" />
              </div>
            </div>
            
            <button 
                onClick={onOpenBuyModal}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all relative z-10"
            >
                Allocation Access
            </button>
          </div>
        </div>
      </aside>

      {/* Operational Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Superior HUD Bar */}
        <header className="h-28 px-12 flex items-center justify-between z-40 bg-background/40 backdrop-blur-xl border-b border-white/5">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-accent/10 border border-accent/20 rounded-full">
                <span className="text-[9px] font-black uppercase tracking-widest text-accent">Active Protocol</span>
              </div>
              <Activity className="w-3 h-3 text-primary animate-pulse" />
            </div>
            <h2 className="text-3xl font-display font-black text-white uppercase italic tracking-tight translate-x-1">
              {activeTab.replace("-", " ")}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-8 mr-8">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Network Status</span>
                <span className="text-[11px] font-bold text-primary flex items-center gap-2">
                  Encrypted <ShieldCheck className="w-3 h-3" />
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Database Sync</span>
                <span className="text-[11px] font-bold text-accent flex items-center gap-2">
                  Connected <Database className="w-3 h-3" />
                </span>
              </div>
            </div>

            <button 
                onClick={toggleTheme}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/5 transition-all text-white/60 hover:text-white"
            >
                {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            <div className="w-px h-8 bg-white/10" />

            {/* Researcher Profile */}
            <div className="relative group/profile flex items-center gap-4 h-14 pl-2 pr-4 rounded-2xl cursor-pointer hover:bg-white/[0.03] transition-all border border-transparent hover:border-white/5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden border border-white/10 glow-cyan">
                    <img 
                        src={`https://api.dicebear.com/7.x/bottts/svg?seed=${credits}`} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="hidden md:flex flex-col items-start">
                    <span className="text-xs font-bold text-white uppercase tracking-tight">Researcher Core</span>
                    <span className="text-[9px] text-white/30 font-black uppercase tracking-widest">Lvl 4 Practitioner</span>
                </div>

                {/* Profile Controls (Tactical Dropdown) */}
                <div className="absolute top-[calc(100%+12px)] right-0 w-64 p-2 synth-glass rounded-[2rem] opacity-0 translate-y-4 pointer-events-none group-hover/profile:opacity-100 group-hover/profile:translate-y-0 group-hover/profile:pointer-events-auto transition-all z-[60] border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.8)]">
                    <div className="p-4 border-b border-white/5 mb-2">
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Authorization</p>
                        <p className="text-xs font-bold text-white">session_alpha_active</p>
                    </div>
                    <div className="space-y-1">
                      <button className="w-full text-left px-4 py-3 text-[11px] font-bold text-white/60 hover:text-white hover:bg-white/5 rounded-2xl transition-all flex items-center gap-3">
                          <Settings className="w-4 h-4 text-white/40" /> Archive Preferences
                      </button>
                      <button onClick={onLogout} className="w-full text-left px-4 py-3 text-[11px] font-bold text-destructive hover:bg-destructive/10 rounded-2xl transition-all flex items-center gap-3">
                          <LogOut className="w-4 h-4" /> Terminate Link
                      </button>
                    </div>
                </div>
            </div>
          </div>
        </header>

        {/* Feature Window Container (Main Interaction) */}
        <main className="flex-1 overflow-y-auto px-12 py-10 relative">
            {/* Viewport Corners Decals */}
            <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-white/10 pointer-events-none" />
            <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-white/10 pointer-events-none" />
            <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-white/10 pointer-events-none" />
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-white/10 pointer-events-none" />

            <div className="max-w-7xl mx-auto h-full">
                {children}
            </div>
        </main>
      </div>

      {/* Aesthetic Scan-line Decal */}
      <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden opacity-[0.02]">
        <div className="w-full h-[1px] bg-primary animate-scan" />
      </div>
    </div>
  );
}


