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
    <div className="max-w-md mx-auto mt-12 md:mt-24 px-4">
      <div className="bg-card border border-primary/5 p-10 md:p-14 rounded-[2.5rem] shadow-terra-soft relative overflow-hidden">
        {/* Soft background glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex justify-center mb-8">
            <div className="p-4 bg-primary/5 rounded-3xl">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
          </div>

          <h2 className="text-4xl font-serif font-bold text-center mb-3 text-primary">
            {isLogin ? "Welcome Back" : "Begin Discovery"}
          </h2>
          <p className="text-secondary text-center text-sm mb-12 opacity-80 font-medium">
            {isLogin ? "Continue your research journey" : "Join our community of organic thinkers"}
          </p>

          {error && (
            <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-2xl text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-secondary ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@example.com"
                  className="w-full bg-muted/30 border border-primary/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-secondary ml-1">Passphrase</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/40" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-muted/30 border border-primary/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-2xl shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                  <span>{isLogin ? "Sign In" : "Create Account"}</span>
                </>
              )}
            </button>
          </form>

          <div className="my-10 flex items-center gap-4">
            <div className="h-px flex-1 bg-primary/10" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-secondary/40">Or Connect With</span>
            <div className="h-px flex-1 bg-primary/10" />
          </div>

          <button
            onClick={onGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-card border border-primary/10 py-4 rounded-2xl hover:bg-muted transition-all group"
          >
            <Chrome className="w-5 h-5 text-accent" />
            <span className="text-sm font-bold text-secondary">Google Dashboard</span>
          </button>

          <div className="mt-12 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-bold text-primary hover:text-accent transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already a member? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
