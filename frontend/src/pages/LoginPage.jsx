import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Layers, Lock, Mail, ArrowRight, ShieldCheck, Stethoscope, User } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, quickDemoLogin } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      showToast({ title: 'Welcome Back', message: `Logged in as ${user.name}`, type: 'success' });
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'staff') navigate('/staff/dashboard');
      else navigate('/customer/dashboard');
    } catch (err) {
      showToast({ title: 'Login Failed', message: err.message || 'Invalid credentials', type: 'alert' });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = async (demoEmail, demoRole, targetRoute) => {
    try {
      await quickDemoLogin(demoEmail);
      showToast({ title: 'Quick Demo Access', message: `Logged in as demo ${demoRole}!`, type: 'success' });
      navigate(targetRoute);
    } catch (e) {
      showToast({ title: 'Demo Error', message: e.message, type: 'alert' });
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
            <Layers className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black text-white">QVeue</span>
        </Link>
        <h1 className="text-2xl font-black text-white tracking-tight">Sign In to Your Account</h1>
        <p className="text-xs text-slate-400 mt-1">
          Access customer queue status, staff service desks, or administrator console.
        </p>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast Logins */}
        <div className="pt-4 border-t border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 text-center">
            One-Click Demo Credentials:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoFill('shankar@example.com', 'Customer', '/customer/dashboard')}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-left border border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-1.5 text-brand-400 font-bold text-[11px]">
                <User className="w-3 h-3" />
                Customer
              </div>
              <span className="text-[10px] text-slate-400 block truncate">Shankar (Q-024)</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill('sarah.patel@citycare.org', 'Staff', '/staff/dashboard')}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-left border border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                <Stethoscope className="w-3 h-3" />
                Staff
              </div>
              <span className="text-[10px] text-slate-400 block truncate">Dr. Sarah Patel</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill('admin@qveue.com', 'Admin', '/admin/dashboard')}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-left border border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-1.5 text-purple-400 font-bold text-[11px]">
                <ShieldCheck className="w-3 h-3" />
                Admin
              </div>
              <span className="text-[10px] text-slate-400 block truncate">Eleanor Vance</span>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400">
          Don't have an account yet?{' '}
          <Link to="/register" className="text-brand-400 font-bold hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
