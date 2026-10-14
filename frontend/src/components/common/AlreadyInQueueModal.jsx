import React from 'react';
import { AlertCircle, Clock, Users, ArrowRight, X, Sparkles, Hash } from 'lucide-react';

export function AlreadyInQueueModal({ isOpen, onClose, onViewQueue, duplicateData }) {
  if (!isOpen || !duplicateData) return null;

  const existingToken = duplicateData.existingToken || duplicateData.ticket?.tokenNumber || 'Token';
  const position = duplicateData.position ?? (duplicateData.ticket?.position || 1);
  const peopleAhead = duplicateData.peopleAhead ?? (duplicateData.ticket?.peopleAhead || 0);
  const estimatedWait = duplicateData.formattedWaitTime || 
    (duplicateData.estimatedWaitTime !== undefined ? `${duplicateData.estimatedWaitTime} min` : '5 min');
  const currentServingToken = duplicateData.currentServingToken || duplicateData.ticket?.currentToken || 'Waiting';
  const serviceName = duplicateData.ticket?.serviceName || duplicateData.serviceName || 'Requested Service';
  const orgName = duplicateData.ticket?.orgName || duplicateData.orgName || 'QVeue';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-500/10 text-slate-100 animate-slide-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-inner">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Active Queue Found
            </span>
            <p className="text-xs text-slate-400">{orgName} • {serviceName}</p>
          </div>
        </div>

        {/* Title & Prompt Message */}
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          You're already in this queue.
        </h2>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
          You are already in this queue with token <span className="text-amber-400 font-mono font-bold">{existingToken}</span>. A duplicate ticket was not generated.
        </p>

        {/* Token Hero Display */}
        <div className="my-5 p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">
            Existing Token
          </span>
          <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight text-glow">
            {existingToken}
          </div>
          <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Active in Line
          </span>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-xs mb-6">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
              <Hash className="w-3.5 h-3.5 text-sky-400" />
              <span>Current Position</span>
            </div>
            <span className="text-lg font-bold text-white">#{position}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>People Ahead</span>
            </div>
            <span className="text-lg font-bold text-amber-400">{peopleAhead}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Estimated Wait</span>
            </div>
            <span className="text-lg font-bold text-emerald-400">{estimatedWait}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Now Serving</span>
            </div>
            <span className="text-base font-mono font-bold text-brand-300">{currentServingToken}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors"
          >
            Dismiss
          </button>

          <button
            type="button"
            onClick={onViewQueue}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 group"
          >
            <span>View My Queue</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
