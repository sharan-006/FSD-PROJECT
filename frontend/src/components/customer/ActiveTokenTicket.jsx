import React, { useState } from 'react';
import { 
  Clock, 
  Users, 
  Activity, 
  Sparkles, 
  AlertCircle, 
  XCircle, 
  CheckCircle2, 
  Building2, 
  Volume2,
  QrCode,
  Printer 
} from 'lucide-react';
import { Badge } from '../common/StatCard';
import { formatMinutes } from '../../utils/formatters';
import { queueApi } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { playChime } from '../../utils/soundAlerts';

export function ActiveTokenTicket({ ticket, onRefresh }) {
  const [cancelling, setCancelling] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const { showToast } = useNotifications();

  if (!ticket) return null;

  const isCalling = ticket.status === 'calling' || ticket.status === 'serving';
  const isApproaching = ticket.peopleAhead !== undefined && ticket.peopleAhead <= 2 && ticket.peopleAhead > 0;

  const handleCancel = async () => {
    if (!window.confirm(`Are you sure you want to leave the queue for token ${ticket.tokenNumber}?`)) {
      return;
    }
    setCancelling(true);
    try {
      await queueApi.cancelTicket(ticket._id || ticket.id);
      showToast({
        title: 'Queue Left',
        message: `Your token ${ticket.tokenNumber} has been cancelled.`,
        type: 'info'
      });
      if (onRefresh) onRefresh();
    } catch (e) {
      showToast({
        title: 'Error',
        message: e.message || 'Could not cancel ticket',
        type: 'alert'
      });
    } finally {
      setCancelling(false);
    }
  };

  // Calculate percentage progression
  const totalInFront = (ticket.sequenceNumber || 1) - (ticket.currentToken ? parseInt(ticket.currentToken.split('-')[1] || 0) : 0);
  const progressPercent = isCalling ? 100 : Math.max(10, Math.min(95, 100 - (ticket.peopleAhead * 15)));

  return (
    <div
      className={`rounded-3xl p-6 sm:p-8 relative overflow-hidden transition-all duration-300 border ${
        isCalling
          ? 'bg-gradient-to-br from-emerald-950/80 via-slate-900/90 to-emerald-950/40 border-emerald-500/50 shadow-2xl shadow-emerald-500/20 ring-1 ring-emerald-400'
          : isApproaching
          ? 'bg-gradient-to-br from-amber-950/60 via-slate-900/90 to-blue-950/40 border-amber-500/40 shadow-2xl shadow-amber-500/10'
          : 'glass-card-ticket shadow-2xl'
      }`}
    >
      {/* Top Banner Alert if Calling */}
      {isCalling && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-emerald-400 ring-4 ring-emerald-400/30" />
            <div>
              <p className="text-sm font-extrabold text-emerald-300 tracking-wide uppercase">
                It's Your Turn! Now Serving
              </p>
              <p className="text-xs text-emerald-100">
                Please proceed directly to{' '}
                <strong className="underline decoration-emerald-400 font-bold">
                  {ticket.counterNumber || 'Counter 1'}
                </strong>
              </p>
            </div>
          </div>
          <button
            onClick={() => playChime()}
            className="p-2 bg-emerald-500/30 hover:bg-emerald-500/50 text-emerald-200 rounded-xl text-xs flex items-center gap-1 font-semibold transition-colors"
            title="Replay Alert Chime"
          >
            <Volume2 className="w-4 h-4" />
            <span className="hidden sm:inline">Chime</span>
          </button>
        </div>
      )}

      {/* Approaching Turn Alert Banner */}
      {!isCalling && isApproaching && (
        <div className="mb-6 p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center gap-3 text-amber-200">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-xs leading-relaxed">
            <strong className="text-amber-300 font-bold">Your turn is approaching!</strong> Only{' '}
            {ticket.peopleAhead} {ticket.peopleAhead === 1 ? 'customer' : 'customers'} ahead. Please be
            near the service desk.
          </div>
        </div>
      )}

      {/* Ticket Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-slate-700/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-400 uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            <span>{ticket.orgName || 'Organization'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            {ticket.serviceName || 'Service Desk'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Registered for: <span className="text-slate-200 font-medium">{ticket.customerName}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge status={ticket.queueStatus || 'active'} text="Queue Live" />
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {ticket.status?.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Hero Token Number */}
      <div className="py-8 text-center relative">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1">
          Your Token Number
        </span>
        <div className="text-5xl sm:text-7xl font-black tracking-tight text-white text-glow my-2">
          {ticket.tokenNumber}
        </div>
        <p className="text-xs text-slate-400">Keep this digital ticket open to monitor live position.</p>
      </div>

      {/* Live Metrics Grid */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 my-6">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-center">
          <span className="text-[10px] sm:text-xs font-semibold uppercase text-slate-400 block">
            Now Serving
          </span>
          <span className="text-lg sm:text-2xl font-extrabold text-brand-400 block mt-1">
            {ticket.currentToken || 'Waiting'}
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-center">
          <span className="text-[10px] sm:text-xs font-semibold uppercase text-slate-400 block">
            People Ahead
          </span>
          <span className="text-lg sm:text-2xl font-extrabold text-amber-400 block mt-1">
            {ticket.peopleAhead !== undefined ? ticket.peopleAhead : 0}
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-center">
          <span className="text-[10px] sm:text-xs font-semibold uppercase text-slate-400 block">
            Estimated Wait
          </span>
          <span className="text-lg sm:text-2xl font-extrabold text-emerald-400 block mt-1">
            {ticket.formattedWait || `${ticket.estimatedWaitMinutes || 0} min`}
          </span>
        </div>
      </div>

      {/* Real-time Progress Bar */}
      <div className="mt-4 mb-6">
        <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
          <span>Queue Position Tracker</span>
          <span className="text-slate-300 font-bold">{isCalling ? 'At Counter' : `${ticket.peopleAhead || 0} waiting before you`}</span>
        </div>
        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700/50">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isCalling
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                : 'bg-gradient-to-r from-brand-600 via-sky-500 to-emerald-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Footer Controls */}
      <div className="pt-4 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock className="w-4 h-4 text-slate-500" />
          <span>Avg. Service Time: {ticket.averageServiceTime || 5} min/person</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPassModal(true)}
            className="text-xs text-sky-400 hover:text-sky-300 hover:bg-sky-950/40 px-3 py-1.5 rounded-xl border border-sky-500/30 transition-all font-semibold flex items-center gap-1.5"
          >
            <QrCode className="w-4 h-4" />
            <span>Digital Pass</span>
          </button>

          {!isCalling && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 px-3 py-1.5 rounded-xl border border-rose-500/20 transition-all font-semibold flex items-center gap-1.5 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              {cancelling ? 'Leaving Queue...' : 'Leave Queue'}
            </button>
          )}
        </div>
      </div>

      {/* Digital Pass / QR Modal */}
      {showPassModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden animate-slide-up text-slate-100">
            {/* Pass Top Branding */}
            <div className="bg-gradient-to-r from-brand-600 to-sky-500 p-5 text-white">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-extrabold tracking-widest opacity-80">
                  Digital Service Ticket
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20">
                  VERIFIED
                </span>
              </div>
              <h3 className="text-lg font-black mt-2 leading-tight">{ticket.orgName}</h3>
              <p className="text-xs opacity-90">{ticket.serviceName}</p>
            </div>

            {/* Pass Middle Body */}
            <div className="p-6 text-center space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Priority Token
                </span>
                <div className="text-5xl font-black text-white font-mono tracking-tight my-1">
                  {ticket.tokenNumber}
                </div>
                <p className="text-xs text-slate-300 font-semibold">{ticket.customerName}</p>
              </div>

              {/* QR Code Graphic */}
              <div className="p-4 bg-white rounded-2xl mx-auto w-40 h-40 flex flex-col items-center justify-center shadow-inner">
                {/* SVG QR Code Simulation */}
                <svg className="w-32 h-32 text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                  {/* Top-left position block */}
                  <rect x="5" y="5" width="28" height="28" rx="4" fill="black" />
                  <rect x="10" y="10" width="18" height="18" fill="white" />
                  <rect x="14" y="14" width="10" height="10" fill="black" />

                  {/* Top-right position block */}
                  <rect x="67" y="5" width="28" height="28" rx="4" fill="black" />
                  <rect x="72" y="10" width="18" height="18" fill="white" />
                  <rect x="76" y="14" width="10" height="10" fill="black" />

                  {/* Bottom-left position block */}
                  <rect x="5" y="67" width="28" height="28" rx="4" fill="black" />
                  <rect x="10" y="72" width="18" height="18" fill="white" />
                  <rect x="14" y="76" width="10" height="10" fill="black" />

                  {/* Data dots */}
                  <rect x="40" y="8" width="6" height="6" />
                  <rect x="52" y="14" width="6" height="6" />
                  <rect x="40" y="24" width="6" height="6" />
                  <rect x="50" y="32" width="6" height="6" />
                  <rect x="10" y="44" width="6" height="6" />
                  <rect x="22" y="48" width="6" height="6" />
                  <rect x="36" y="42" width="6" height="6" />
                  <rect x="46" y="50" width="6" height="6" />
                  <rect x="58" y="44" width="6" height="6" />
                  <rect x="70" y="48" width="6" height="6" />
                  <rect x="84" y="42" width="6" height="6" />
                  <rect x="40" y="66" width="6" height="6" />
                  <rect x="52" y="72" width="6" height="6" />
                  <rect x="64" y="66" width="6" height="6" />
                  <rect x="76" y="76" width="6" height="6" />
                  <rect x="86" y="86" width="6" height="6" />
                  <rect x="48" y="84" width="6" height="6" />
                </svg>
              </div>

              <div className="text-[11px] text-slate-400">
                Scan at counter scanner or present to the desk executive.
              </div>
            </div>

            {/* Pass Actions */}
            <div className="p-4 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Pass</span>
              </button>

              <button
                onClick={() => setShowPassModal(false)}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
