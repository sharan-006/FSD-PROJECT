import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from './NotificationBell';
import { 
  Layers, 
  UserCheck, 
  LogIn, 
  LogOut, 
  LayoutDashboard, 
  Compass, 
  ShieldAlert, 
  Stethoscope,
  Tv,
  QrCode 
} from 'lucide-react';

export function Navbar() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="glass-panel border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                QVeue
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30 animate-pulse" />
              </span>
              <span className="text-[10px] text-slate-400 block -mt-1 tracking-wider uppercase font-semibold">
                Smart Queue System
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive('/') ? 'text-white bg-slate-800' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Home
            </Link>

            <Link
              to="/customer/join"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive('/customer/join') ? 'text-white bg-slate-800' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Join Queue
            </Link>

            <Link
              to="/display"
              target="_blank"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-400 hover:text-sky-300 hover:bg-sky-950/40 border border-sky-500/20 transition-colors flex items-center gap-1.5"
            >
              <Tv className="w-3.5 h-3.5" />
              <span>TV Display</span>
            </Link>

            <Link
              to="/customer/join"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-400 hover:text-purple-300 hover:bg-purple-950/40 border border-purple-500/20 transition-colors flex items-center gap-1.5"
              title="Join a Queue or Scan QR Code"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Join Queue</span>
            </Link>

            {user && (
              <>
                <Link
                  to="/customer/dashboard"
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive('/customer/dashboard') ? 'text-white bg-slate-800' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  My Tickets
                </Link>

                {role === 'staff' && (
                  <Link
                    to="/staff/dashboard"
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                      isActive('/staff/dashboard') ? 'text-emerald-300 bg-emerald-950/40 border border-emerald-500/30' : 'text-emerald-400 hover:bg-emerald-950/30'
                    }`}
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    Staff Desk
                  </Link>
                )}

                {role === 'admin' && (
                  <Link
                    to="/admin/dashboard"
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                      isActive('/admin/dashboard') ? 'text-purple-300 bg-purple-950/40 border border-purple-500/30' : 'text-purple-400 hover:bg-purple-950/30'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Admin Console
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Right Action / Auth Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <NotificationBell />

                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-white leading-tight">{user.name}</span>
                  <span className="text-[10px] text-brand-400 capitalize font-medium">{user.role}</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02]"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
