import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { store } from '../services/store';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  Coins, 
  Cpu, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await store.loginAdminApi(email.trim(), password);
    setLoading(false);

    if (res.success) {
      if (res.user?.role === 'TREASURER') {
        navigate('/payments');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(res.message || 'Login failed. Please check credentials.');
    }
  };

  const handleQuickTreasurer = () => {
    setEmail('treasurer@zinnia2026.edu');
    setPassword('Treasurer@Zinnia2026');
  };

  const handleQuickAdmin = () => {
    setEmail('admin@zinnia2026.edu');
    setPassword('Admin@Zinnia2026');
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-12 select-none">
      <div className="w-full max-w-md space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-[10px] font-mono text-cyan-400 font-semibold tracking-wider uppercase">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ZINNIA '26 ADMINISTRATIVE ACCESS</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-wider font-mono">
            PORTAL SIGN-IN
          </h1>
          <p className="text-xs text-slate-400 font-light">
            Authorized access for Treasurer verification & symposium staff
          </p>
        </div>

        {/* Card */}
        <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono text-slate-300 font-medium uppercase tracking-wider">
                Official Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="treasurer@zinnia2026.edu"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono text-slate-300 font-medium uppercase tracking-wider">
                Access Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold font-mono text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>AUTHENTICATING TELEMETRY...</span>
              ) : (
                <>
                  <span>SIGN IN TO PORTAL</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Credential Fillers for Demo / Rapid Testing */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <div className="text-[10px] font-mono text-slate-500 text-center uppercase tracking-widest">
              Quick Fill Demo Credentials
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleQuickTreasurer}
                className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 rounded-xl text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 font-bold">
                  <Coins className="w-3.5 h-3.5" />
                  <span>Treasurer</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">treasurer@...</div>
              </button>

              <button
                type="button"
                onClick={handleQuickAdmin}
                className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 font-bold">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Super Admin</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">admin@...</div>
              </button>
            </div>
          </div>

        </div>

        {/* Security Notice */}
        <p className="text-center text-[10px] text-slate-600 font-mono">
          Strictly for Zinnia 2026 authorized organizers &bull; All sessions logged
        </p>

      </div>
    </div>
  );
};

export default LoginPage;
