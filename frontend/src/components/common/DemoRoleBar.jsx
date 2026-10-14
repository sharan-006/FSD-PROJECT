import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import { Sparkles, User, Stethoscope, ShieldCheck, Wifi } from 'lucide-react';

export function DemoRoleBar() {
  const { user, quickDemoLogin, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();

  const handleSwitch = async (roleOrEmail, targetRoute) => {
    try {
      await quickDemoLogin(roleOrEmail);
      if (targetRoute) {
        navigate(targetRoute);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-slate-950/90 border-b border-slate-800 text-xs py-1.5 px-4 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-brand-400 animate-spin-slow" />
          <span className="font-semibold text-slate-200">Demo Role Switcher:</span>
          <span className="hidden sm:inline text-slate-400">Switch instantly to test different workflows:</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Customer Button */}
          <button
            onClick={() => handleSwitch('shankar@example.com', '/customer/dashboard')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-medium ${
              user?.email === 'shankar@example.com'
                ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/50 ring-1 ring-brand-300'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <User className="w-3 h-3 text-brand-300" />
            <span>Customer (Shankar)</span>
          </button>

          {/* Staff Button */}
          <button
            onClick={() => handleSwitch('sarah.patel@citycare.org', '/staff/dashboard')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-medium ${
              user?.role === 'staff'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/50 ring-1 ring-emerald-300'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Stethoscope className="w-3 h-3 text-emerald-300" />
            <span>Staff (Dr. Sarah)</span>
          </button>

          {/* Admin Button */}
          <button
            onClick={() => handleSwitch('admin@qveue.com', '/admin/dashboard')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-medium ${
              user?.role === 'admin'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/50 ring-1 ring-purple-300'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3 h-3 text-purple-300" />
            <span>Admin (Eleanor)</span>
          </button>

          {/* WebSocket Status Indicator */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800 text-[11px]">
            <Wifi className={`w-3 h-3 ${connected ? 'text-emerald-400' : 'text-rose-400'}`} />
            <span className={connected ? 'text-emerald-400 font-medium' : 'text-rose-400'}>
              {connected ? 'Live Sync' : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
