import React, { useState } from "react";
import { Mail, Lock, LogIn, UserPlus, Github, Chrome, Sparkles } from "lucide-react";

interface AuthWindowProps {
  onLogin: (email: string, pass: string) => Promise<void>;
  onRegister: (email: string, pass: string) => Promise<void>;
  onGoogleLogin: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function AuthWindow({
  onLogin,
  onRegister,
  onGoogleLogin,
  loading,
  error
}: AuthWindowProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      await onLogin(email, password);
    } else {
      await onRegister(email, password);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 md:mt-24">
      <div className="glass-card p-10 md:p-14 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 -mr-16 -mt-16 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
        
        <div className="relative z-10">
          <div className="flex justify-center mb-8">
            <div className="p-4 bg-primary/10 rounded-royal-2xl border border-primary/20">
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            </div>
          </div>

          <h2 className="text-4xl font-serif font-medium text-center mb-2 text-royal-gradient">
            {isLogin ? "Welcome Back" : "Royal Access"}
          </h2>
          <p className="text-royal-bronze text-center text-sm mb-12 opacity-60 font-light tracking-wide uppercase text-[10px]">
            {isLogin ? "Sign in to your dashboard" : "Join the elite group of researchers"}
          </p>

          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-royal-lg text-center animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-royal-bronze block ml-1 opacity-60">Credentials ID</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-royal-bronze/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="scholar@chemscan.com"
                  className="w-full bg-background/30 border border-accent/20 rounded-royal-xl py-4 pl-12 pr-4 text-sm focus:border-accent/40 focus:ring-4 focus:ring-accent/5 transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-royal-bronze block ml-1 opacity-60">Access Secret</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-royal-bronze/40" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-background/30 border border-accent/20 rounded-royal-xl py-4 pl-12 pr-4 text-sm focus:border-accent/40 focus:ring-4 focus:ring-accent/5 transition-all outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] text-[10px] py-4 rounded-royal-xl shadow-royal-glow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {isLogin ? "Authenticate" : "Create Account"}
                </>
              )}
            </button>
          </form>

          <div className="my-10 flex items-center gap-4">
            <div className="h-px flex-1 bg-accent/10" />
            <span className="text-[8px] font-black uppercase tracking-widest text-royal-bronze opacity-30 whitespace-nowrap">Unified Passport</span>
            <div className="h-px flex-1 bg-accent/10" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={onGoogleLogin}
              className="flex items-center justify-center gap-3 bg-card/60 border border-accent/10 py-3.5 rounded-royal-xl hover:bg-card transition-all group"
            >
              <Chrome className="w-4 h-4 text-royal-bronze group-hover:text-amber-500 transition-colors" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-royal-bronze">Google</span>
            </button>
            <button
              className="flex items-center justify-center gap-3 bg-card/60 border border-accent/10 py-3.5 rounded-royal-xl hover:bg-card transition-all group"
              onClick={() => {}} // GitHub login not implemented in previous App.tsx
            >
              <Github className="w-4 h-4 text-royal-bronze group-hover:text-foreground transition-colors" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-royal-bronze">Github</span>
            </button>
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] font-black uppercase tracking-widest text-accent hover:text-accent-secondary transition-colors"
            >
              {isLogin ? "Need a new identity? register" : "Already have access? login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
