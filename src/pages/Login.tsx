import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { store } from '../services/store';
import {
  ShieldCheck,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      } else if (res.user?.role === 'EVENT_COORDINATOR') {
        navigate('/events');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(res.message || 'Login failed. Please verify credentials.');
    }
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
          <h1 className="text-3xl font-black text-white tracking-wider font-mono uppercase">
            ORGANIZER PORTAL
          </h1>
          <p className="text-xs text-slate-400 font-light">
            Authorized sign-in for Symposium Coordinators &amp; Administrators
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
              <label className="block text-xs font-mono text-slate-300 font-medium uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter authorized username"
                  autoComplete="username"
                  className="w-full min-h-touch pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-fluid text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-slate-300 font-medium uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter portal password"
                  autoComplete="current-password"
                  className="w-full min-h-touch pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-fluid text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
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
        </div>

        {/* Security Notice */}
        <p className="text-center text-2xs text-slate-600 font-mono break-token">
          Strictly for Zinnia 2026 authorized organizers &bull; Role-based cryptographic access enforced
        </p>

      </div>
    </div>
  );
};

export default LoginPage;
