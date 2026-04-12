import React, { useState } from "react";
import { Mail, Lock, LogIn, UserPlus, Chrome, Sparkles, Shield, Database, Terminal } from "lucide-react";

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
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-cyan/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-violet/5 blur-[150px] rounded-full" />
      </div>

      <div className="w-full max-w-lg relative z-10 animate-in fade-in zoom-in-95 duration-1000">
        <div className="synth-glass rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
          {/* Header Console */}
          <div className="p-8 pb-4 border-b border-white/5 bg-white/5 relative group">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-neon-cyan/10 rounded-xl flex items-center justify-center border border-neon-cyan/20">
                        <Shield className="w-5 h-5 text-neon-cyan" />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Identity Protocol</span>
                        <div className="flex items-center gap-2">
                             <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse shadow-[0_0_8px_rgba(0,255,242,0.6)]" />
                             <h2 className="text-xl font-black text-white italic tracking-tight uppercase">Gatekeeper_{isLogin ? 'Login' : 'Origin'}</h2>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <span className="block text-[8px] font-mono text-white/20 uppercase">Auth_Node: 0xA4F2</span>
                    <span className="block text-[10px] font-mono font-bold text-neon-violet">STABLE_CONNECTED</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="w-1/3 h-full bg-neon-cyan/40 animate-slide-x" />
                </div>
                <Database className="w-3.5 h-3.5 text-white/10" />
            </div>
          </div>

          <div className="p-10 md:p-14 space-y-10">
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-4 animate-in slide-in-from-top-2">
                    <Terminal className="w-4 h-4 text-red-500" />
                    <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider">{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8">
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Primary_Uplink</label>
                    <span className="text-[8px] font-mono text-neon-cyan/40">RFC_5322</span>
                </div>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-neon-cyan transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="IDENTIFIER@LAB.CORE"
                    className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-4 pl-14 pr-6 text-sm text-white placeholder:text-white/10 outline-none focus:border-neon-cyan/30 focus:ring-4 focus:ring-neon-cyan/5 transition-all font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Secure_Sequence</label>
                    <span className="text-[8px] font-mono text-neon-violet/40">AES_256_GCM</span>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-neon-violet transition-colors" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-4 pl-14 pr-6 text-sm text-white placeholder:text-white/10 outline-none focus:border-neon-violet/30 focus:ring-4 focus:ring-neon-violet/5 transition-all font-mono"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full h-14 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-neon-cyan/30 rounded-xl transition-all duration-500 overflow-hidden disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/0 via-neon-cyan/5 to-neon-cyan/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                
                <div className="relative z-10 flex items-center justify-center gap-3">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/10 border-t-neon-cyan rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="text-[11px] font-black text-white uppercase tracking-[0.4em]">{isLogin ? "Execute login" : "Initialize sequence"}</span>
                      {isLogin ? <LogIn className="w-4 h-4 text-neon-cyan" /> : <UserPlus className="w-4 h-4 text-neon-cyan" />}
                    </>
                  )}
                </div>
              </button>
            </form>

            <div className="flex items-center gap-6">
                <div className="h-px flex-1 bg-white/5" />
                <span className="text-[9px] uppercase tracking-[0.3em] font-black text-white/15 whitespace-nowrap">External_Bridge</span>
                <div className="h-px flex-1 bg-white/5" />
            </div>

            <button
              onClick={onGoogleLogin}
              className="w-full py-4 rounded-xl bg-zinc-900/50 border border-white/5 hover:border-white/10 transition-all flex items-center justify-center gap-4 group"
            >
              <Chrome className="w-4 h-4 text-white/30 group-hover:text-neon-violet transition-colors" />
              <span className="text-[10px] font-black text-white/40 group-hover:text-white uppercase tracking-[0.2em]">Synch_with_Google</span>
            </button>

            <div className="pt-4 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-[10px] font-black text-white/20 hover:text-neon-cyan uppercase tracking-[0.3em] transition-colors"
              >
                {isLogin ? "Request Access_ID [/Signup]" : "Establish Origin [/Signin]"}
              </button>
            </div>
          </div>
        </div>
        
        {/* Footer Meta */}
        <div className="mt-8 flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-neon-cyan" />
                    <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">ENCRYPTED_LINK_v3</span>
                </div>
            </div>
            <span className="text-[8px] font-mono text-white/10 uppercase">CORE_ADDR: chemscan.protocol.live</span>
        </div>
      </div>
    </div>
  );
}

