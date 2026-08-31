import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { store } from '../services/store';
import {
  ShieldCheck,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Coins,
  Cpu,
  DoorOpen,
  Utensils,
  Zap,
  Award
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await store.loginAdminApi(username.trim(), password);
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

  const setCredentials = (user: string, pass: string = '123') => {
    setUsername(user);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-[85dvh] flex flex-col justify-center items-center px-gutter py-fluid-8 select-none">
      <div className="w-full max-w-md space-y-fluid-5">

        {/* Brand Header */}
        <div className="text-center space-y-fluid-2">
          <div className="inline-flex max-w-full items-center justify-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-2xs font-mono text-cyan-400 font-semibold tracking-wider uppercase">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="min-w-0">ZINNIA '26 ADMINISTRATIVE ACCESS</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-wider font-mono">
            PORTAL SIGN-IN
          </h1>
          <p className="text-xs text-slate-400 font-light">
            Authorized access for Treasurer verification & symposium staff
          </p>
        </div>

        {/* Card */}
        <div className="p-fluid-6 rounded-fluid-xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-fluid-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

          {error && (
            <div className="p-fluid-3 rounded-fluid bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="min-w-0 break-token">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-fluid-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                <label className="block text-xs font-mono text-slate-300 font-medium uppercase tracking-wider">
                  Username
                </label>
                <span className="text-2xs font-mono text-cyan-400 break-token">
                  treasurer / admin / entry / food...
                </span>
              </div>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full min-h-touch pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-fluid text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                <label className="block text-xs font-mono text-slate-300 font-medium uppercase tracking-wider">
                  Password
                </label>
                <span className="text-2xs font-mono text-emerald-400 break-token">
                  Password is: 123
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password (e.g. 123)"
                  className="w-full min-h-touch pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-fluid text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-touch mt-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold font-mono text-xs rounded-fluid shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>AUTHENTICATING TELEMETRY...</span>
              ) : (
                <>
                  <span>SIGN IN TO PORTAL</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </>
              )}
            </button>
          </form>

          {/* Quick Role Fillers (1-Click Login Setup) */}
          <div className="pt-fluid-4 border-t border-slate-800/80 space-y-fluid-2">
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-2xs font-mono text-slate-500 uppercase tracking-widest">
              <span>Quick Fill Role Credentials</span>
              <span className="text-emerald-400 font-semibold">pass: 123</span>
            </div>

            <div className="grid grid-cols-1 xs:grid-cols-2 gap-fluid-2">
              {/* Treasurer */}
              <button
                type="button"
                onClick={() => setCredentials('treasurer', '123')}
                className="min-h-touch p-fluid-2 flex flex-col justify-center bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 rounded-fluid text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400 font-bold">
                  <Coins className="w-3.5 h-3.5 shrink-0" />
                  <span className="min-w-0 break-token">Treasurer</span>
                </div>
                <div className="text-2xs text-slate-400 font-mono mt-0.5 break-token">user: treasurer</div>
              </button>

              {/* Super Admin */}
              <button
                type="button"
                onClick={() => setCredentials('admin', '123')}
                className="min-h-touch p-fluid-2 flex flex-col justify-center bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 rounded-fluid text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 font-bold">
                  <Cpu className="w-3.5 h-3.5 shrink-0" />
                  <span className="min-w-0 break-token">Super Admin</span>
                </div>
                <div className="text-2xs text-slate-400 font-mono mt-0.5 break-token">user: admin</div>
              </button>

              {/* Gate Entry */}
              <button
                type="button"
                onClick={() => setCredentials('entry', '123')}
                className="min-h-touch p-fluid-2 flex flex-col justify-center bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 rounded-fluid text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-bold">
                  <DoorOpen className="w-3.5 h-3.5 shrink-0" />
                  <span className="min-w-0 break-token">Gate Entry</span>
                </div>
                <div className="text-2xs text-slate-400 font-mono mt-0.5 break-token">user: entry</div>
              </button>

              {/* Food Staff */}
              <button
                type="button"
                onClick={() => setCredentials('food', '123')}
                className="min-h-touch p-fluid-2 flex flex-col justify-center bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/50 rounded-fluid text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 text-xs font-mono text-rose-400 font-bold">
                  <Utensils className="w-3.5 h-3.5 shrink-0" />
                  <span className="min-w-0 break-token">Food Counter</span>
                </div>
                <div className="text-2xs text-slate-400 font-mono mt-0.5 break-token">user: food</div>
              </button>

              {/* Event Coordinator */}
              <button
                type="button"
                onClick={() => setCredentials('event', '123')}
                className="min-h-touch p-fluid-2 flex flex-col justify-center bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 rounded-fluid text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 text-xs font-mono text-purple-400 font-bold">
                  <Zap className="w-3.5 h-3.5 shrink-0" />
                  <span className="min-w-0 break-token">Events Admin</span>
                </div>
                <div className="text-2xs text-slate-400 font-mono mt-0.5 break-token">user: event</div>
              </button>

              {/* Certificates */}
              <button
                type="button"
                onClick={() => setCredentials('cert', '123')}
                className="min-h-touch p-fluid-2 flex flex-col justify-center bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 rounded-fluid text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 text-xs font-mono text-blue-400 font-bold">
                  <Award className="w-3.5 h-3.5 shrink-0" />
                  <span className="min-w-0 break-token">Certificates</span>
                </div>
                <div className="text-2xs text-slate-400 font-mono mt-0.5 break-token">user: cert</div>
              </button>
            </div>
          </div>

        </div>

        {/* Security Notice */}
        <p className="text-center text-2xs text-slate-600 font-mono break-token">
          Strictly for Zinnia 2026 authorized organizers &bull; Simple credentials active
        </p>

      </div>
    </div>
  );
};

export default LoginPage;
