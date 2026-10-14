import React from 'react';
import { Layers, ShieldCheck, Heart, Sparkles, Activity } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/60 mt-auto py-8 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-xs">
              Q
            </div>
            <span className="font-bold text-slate-200">QVeue</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Next-Generation Smart Queue Management</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Activity className="w-3.5 h-3.5" />
              Real-Time WebSocket Core Online
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Dynamic AI Wait-Time Engine
            </span>
          </div>

          <p className="text-slate-500 text-[11px]">
            &copy; {new Date().getFullYear()} QVeue Systems Inc. Enterprise-Grade SaaS Architecture.
          </p>
        </div>
      </div>
    </footer>
  );
}
