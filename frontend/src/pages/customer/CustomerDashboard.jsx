import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { queueApi } from '../../services/api';
import { ActiveTokenTicket } from '../../components/customer/ActiveTokenTicket';
import { 
  PlusCircle, 
  Ticket, 
  History, 
  Sparkles, 
  Compass, 
  RotateCw, 
  BellRing,
  Coffee,
  ShieldCheck
} from 'lucide-react';

export function CustomerDashboard() {
  const { user } = useAuth();
  const { socket, joinQueueRoom } = useSocket();
  const [activeTickets, setActiveTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadActiveTickets = useCallback(async () => {
    try {
      const res = await queueApi.getMyActiveTickets();
      if (res.success && res.data) {
        setActiveTickets(res.data);
        // Subscribe to socket rooms for active queues
        res.data.forEach((ticket) => {
          if (ticket.queueId) {
            joinQueueRoom(ticket.queueId);
          }
        });
      }
    } catch (e) {
      console.error('Failed to load active tickets', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [joinQueueRoom]);

  useEffect(() => {
    loadActiveTickets();
  }, [loadActiveTickets]);

  // Real-time listener for updates on active tickets
  useEffect(() => {
    if (!socket) return;

    const handleQueueUpdate = () => {
      // Refresh tickets when any queue update occurs
      loadActiveTickets();
    };

    socket.on('queue:updated', handleQueueUpdate);
    socket.on('ticket:called', handleQueueUpdate);

    return () => {
      socket.off('queue:updated', handleQueueUpdate);
      socket.off('ticket:called', handleQueueUpdate);
    };
  }, [socket, loadActiveTickets]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadActiveTickets();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
            Live Ticket Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Where are you in the queue?
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time status, people ahead, and dynamic waiting time tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Refresh Status"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            to="/customer/join"
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-500/20 transition-all hover:scale-[1.02] flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Join Another Queue</span>
          </Link>
        </div>
      </div>

      {/* Active Tickets List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 glass-panel rounded-3xl border border-slate-800">
          <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-xs">Fetching active queue tickets...</p>
        </div>
      ) : activeTickets.length > 0 ? (
        <div className="space-y-6">
          {activeTickets.map((ticket) => (
            <ActiveTokenTicket
              key={ticket._id || ticket.id}
              ticket={ticket}
              onRefresh={loadActiveTickets}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="p-8 sm:p-12 text-center glass-panel rounded-3xl border border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mx-auto">
            <Ticket className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No Active Queue Tickets</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
              You are currently not waiting in any digital queue. Pick an organization and service to receive an instant token and avoid standing in lines!
            </p>
          </div>
          <div>
            <Link
              to="/customer/join"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-xl shadow-brand-500/20 transition-all hover:scale-105"
            >
              <PlusCircle className="w-4 h-4" />
              Join a Queue Now
            </Link>
          </div>
        </div>
      )}

      {/* Convenience Tips Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/40 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 shrink-0">
            <Coffee className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Freedom to Roam</span>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              No need to stay locked in the waiting lobby. Step outside for fresh air or a beverage.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/40 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
            <BellRing className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Smart Proactive Chimes</span>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              We send you audio and notification updates when 2 people remain ahead of you.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/40 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Zero Line Jumping</span>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Fair, tamper-proof sequential token ordering verified in real-time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
