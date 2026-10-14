import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DemoRoleBar } from '../components/common/DemoRoleBar';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import {
  LayoutDashboard,
  Users,
  Building2,
  Sliders,
  Monitor,
  History,
  Settings,
  Ticket,
  ChevronRight,
  Stethoscope,
  BarChart3,
  QrCode
} from 'lucide-react';

export function DashboardLayout({ requiredRole }) {
  const { user, role } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  // Role-based sidebar nav items
  const adminNav = [
    { label: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'QR Code Management', path: '/admin/qr-codes', icon: QrCode },
    { label: 'Organizations', path: '/admin/organizations', icon: Building2 },
    { label: 'Services', path: '/admin/services', icon: Sliders },
    { label: 'Counters', path: '/admin/counters', icon: Monitor },
    { label: 'Staff & Users', path: '/admin/users', icon: Users },
    { label: 'Analytics & KPIs', path: '/admin/analytics', icon: BarChart3 },
  ];

  const staffNav = [
    { label: 'Service Desk', path: '/staff/dashboard', icon: Stethoscope },
    { label: 'Counter Controls', path: '/staff/counters', icon: Monitor },
  ];

  const customerNav = [
    { label: 'Active Tickets', path: '/customer/dashboard', icon: Ticket },
    { label: 'Join New Queue', path: '/customer/join', icon: Sliders },
    { label: 'Visit History', path: '/customer/history', icon: History },
  ];

  const navItems = role === 'admin' ? adminNav : role === 'staff' ? staffNav : customerNav;

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      <DemoRoleBar />
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <aside className="w-full md:w-64 shrink-0">
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 sticky top-24">
              <div className="pb-3 mb-3 border-b border-slate-800/80">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {role === 'admin' ? 'Admin Portal' : role === 'staff' ? 'Staff Terminal' : 'Customer Hub'}
                </span>
                <p className="text-xs text-white font-semibold mt-0.5 truncate">{user?.name || 'User'}</p>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        active
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 opacity-60 ${active ? 'opacity-100' : ''}`} />
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
