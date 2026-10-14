import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useNotifications } from '../../context/NotificationContext';
import { queueApi } from '../../services/api';
import { StatCard, Badge } from '../../components/common/StatCard';
import { formatTime, formatMinutes } from '../../utils/formatters';
import {
  PhoneCall,
  Volume2,
  SkipForward,
  CheckCircle,
  Pause,
  Play,
  Users,
  Clock,
  Building2,
  Activity,
  AlertCircle,
  RotateCw,
  UserCheck
} from 'lucide-react';

export function StaffDashboard() {
  const { user } = useAuth();
  const { socket, joinQueueRoom } = useSocket();
  const { showToast } = useNotifications();

  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadStaffQueue = useCallback(async () => {
    try {
      const res = await queueApi.getStaffQueue();
      if (res.success && res.data) {
        setQueueData(res.data);
        if (res.data.queueId) {
          joinQueueRoom(res.data.queueId);
        }
      }
    } catch (e) {
      console.error('Failed to load staff queue:', e);
    } finally {
      setLoading(false);
    }
  }, [joinQueueRoom]);

  useEffect(() => {
    loadStaffQueue();
  }, [loadStaffQueue]);

  // Real-time synchronization
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      loadStaffQueue();
    };

    socket.on('queue:updated', handleUpdate);
    socket.on('ticket:called', handleUpdate);
    socket.on('queue:status_changed', handleUpdate);

    return () => {
      socket.off('queue:updated', handleUpdate);
      socket.off('ticket:called', handleUpdate);
      socket.off('queue:status_changed', handleUpdate);
    };
  }, [socket, loadStaffQueue]);

  // Action: Call Next Customer
  const handleCallNext = async () => {
    if (!queueData?.queueId) return;
    setActionLoading(true);
    try {
      const res = await queueApi.callNext(queueData.queueId, {
        counterNumber: queueData.counter?.counterNumber || 'Counter 1'
      });
      if (res.success) {
        showToast({
          title: 'Next Customer Called',
          message: `Now serving ${res.data.currentToken} at ${res.data.counterNumber}`,
          type: 'success'
        });
        loadStaffQueue();
      }
    } catch (e) {
      showToast({
        title: 'Call Next Error',
        message: e.message || 'No more customers in queue',
        type: 'alert'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Recall Current Customer
  const handleRecall = async () => {
    if (!queueData?.queueId || !queueData?.currentToken) {
      showToast({ title: 'Notice', message: 'No active token to recall.', type: 'warning' });
      return;
    }
    setActionLoading(true);
    try {
      await queueApi.recall(queueData.queueId, {
        counterNumber: queueData.counter?.counterNumber || 'Counter 1'
      });
      showToast({
        title: 'Customer Recalled',
        message: `Alert chime and notification resent for token ${queueData.currentToken}`,
        type: 'info'
      });
    } catch (e) {
      showToast({ title: 'Error', message: e.message, type: 'alert' });
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Skip Customer
  const handleSkip = async () => {
    if (!queueData?.queueId || !queueData?.currentToken) {
      showToast({ title: 'Notice', message: 'No active token to skip.', type: 'warning' });
      return;
    }
    if (!window.confirm(`Skip customer with token ${queueData.currentToken}?`)) return;

    setActionLoading(true);
    try {
      await queueApi.skip(queueData.queueId);
      showToast({
        title: 'Customer Skipped',
        message: `Token ${queueData.currentToken} marked as skipped.`,
        type: 'warning'
      });
      loadStaffQueue();
    } catch (e) {
      showToast({ title: 'Error', message: e.message, type: 'alert' });
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Complete Service
  const handleComplete = async () => {
    if (!queueData?.queueId || !queueData?.currentToken) {
      showToast({ title: 'Notice', message: 'No active token to complete.', type: 'warning' });
      return;
    }
    setActionLoading(true);
    try {
      await queueApi.complete(queueData.queueId);
      showToast({
        title: 'Service Completed',
        message: `Token ${queueData.currentToken} marked as completed!`,
        type: 'success'
      });
      loadStaffQueue();
    } catch (e) {
      showToast({ title: 'Error', message: e.message, type: 'alert' });
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Toggle Pause / Resume
  const handleTogglePause = async () => {
    if (!queueData?.queueId) return;
    const isPaused = queueData.queueStatus === 'paused';
    setActionLoading(true);
    try {
      if (isPaused) {
        await queueApi.resume(queueData.queueId);
        showToast({ title: 'Queue Resumed', message: 'Queue is now active.', type: 'success' });
      } else {
        await queueApi.pause(queueData.queueId);
        showToast({ title: 'Queue Paused', message: 'Queue temporarily paused.', type: 'warning' });
      }
      loadStaffQueue();
    } catch (e) {
      showToast({ title: 'Error', message: e.message, type: 'alert' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 glass-panel rounded-3xl border border-slate-800">
        <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-xs">Loading staff service desk...</p>
      </div>
    );
  }

  const isPaused = queueData?.queueStatus === 'paused';
  const nextCustomer = queueData?.waitingList && queueData.waitingList.length > 0 ? queueData.waitingList[0] : null;

  return (
    <div className="space-y-6">
      {/* Top Banner / Service Desk Info */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-400">
            <Building2 className="w-4 h-4" />
            <span>{queueData?.organization?.name || 'Organization'}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300">{queueData?.service?.name || 'Service'}</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1 flex items-center gap-3">
            Service Terminal
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-800 text-sky-400 border border-slate-700">
              {queueData?.counter?.counterNumber || 'Counter 1'}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Operator: <span className="text-white font-semibold">{user?.name}</span> ({user?.email})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            status={isPaused ? 'paused' : 'active'}
            text={isPaused ? 'Queue Paused' : 'Queue Live'}
          />

          <button
            onClick={loadStaffQueue}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Refresh Queue"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main KPI Row: CURRENT TOKEN, NEXT, WAITING, ESTIMATED WAIT */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Token */}
        <div className="glass-panel p-5 rounded-2xl border border-brand-500/30 bg-gradient-to-br from-brand-950/40 to-slate-900/80 relative overflow-hidden">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-300 block">
            Current Token
          </span>
          <div className="text-4xl sm:text-5xl font-black text-white mt-2 tracking-tight text-glow">
            {queueData?.currentToken || '--'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {queueData?.currentlyCalling?.customerName
              ? `Serving: ${queueData.currentlyCalling.customerName}`
              : 'Counter is ready'}
          </p>
        </div>

        {/* Next Customer */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Next In Line
          </span>
          <div className="text-3xl sm:text-4xl font-extrabold text-sky-400 mt-2 tracking-tight">
            {nextCustomer ? nextCustomer.tokenNumber : '--'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {nextCustomer ? nextCustomer.customerName : 'No one waiting'}
          </p>
        </div>

        {/* Waiting Count */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Waiting Customers
          </span>
          <div className="text-3xl sm:text-4xl font-extrabold text-amber-400 mt-2 tracking-tight">
            {queueData?.waitingCount !== undefined ? queueData.waitingCount : 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">People in queue</p>
        </div>

        {/* Estimated Wait */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Estimated Wait
          </span>
          <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 mt-2 tracking-tight">
            {queueData?.formattedWaitTime || `${queueData?.estimatedWaitTime || 0} min`}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Avg: {queueData?.service?.averageServiceTime || 5} min/ticket
          </p>
        </div>
      </div>

      {/* Large Ergonomic Staff Queue Controls */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-400" />
          Queue Controls
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Call Next Button (Main Primary) */}
          <button
            onClick={handleCallNext}
            disabled={actionLoading || isPaused || (queueData?.waitingCount || 0) === 0}
            className="py-4 px-4 rounded-2xl bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white font-extrabold text-sm shadow-xl shadow-brand-500/25 transition-all hover:scale-[1.02] flex flex-col items-center justify-center gap-1.5 disabled:opacity-40 disabled:hover:scale-100 col-span-1 sm:col-span-2 lg:col-span-1"
          >
            <PhoneCall className="w-5 h-5" />
            <span>Call Next</span>
            <span className="text-[10px] font-normal opacity-80">
              {nextCustomer ? nextCustomer.tokenNumber : 'None'}
            </span>
          </button>

          {/* Recall Button */}
          <button
            onClick={handleRecall}
            disabled={actionLoading || !queueData?.currentToken}
            className="py-4 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition-all hover:scale-[1.02] flex flex-col items-center justify-center gap-1.5 disabled:opacity-40 disabled:hover:scale-100"
          >
            <Volume2 className="w-5 h-5 text-sky-400" />
            <span>Recall</span>
            <span className="text-[10px] font-normal text-slate-400">Replay Chime</span>
          </button>

          {/* Skip Button */}
          <button
            onClick={handleSkip}
            disabled={actionLoading || !queueData?.currentToken}
            className="py-4 px-4 rounded-2xl bg-amber-950/30 hover:bg-amber-900/50 text-amber-200 font-bold text-sm border border-amber-500/30 transition-all hover:scale-[1.02] flex flex-col items-center justify-center gap-1.5 disabled:opacity-40 disabled:hover:scale-100"
          >
            <SkipForward className="w-5 h-5 text-amber-400" />
            <span>Skip</span>
            <span className="text-[10px] font-normal text-amber-300/70">Absent</span>
          </button>

          {/* Complete Button */}
          <button
            onClick={handleComplete}
            disabled={actionLoading || !queueData?.currentToken}
            className="py-4 px-4 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-200 font-bold text-sm border border-emerald-500/40 transition-all hover:scale-[1.02] flex flex-col items-center justify-center gap-1.5 disabled:opacity-40 disabled:hover:scale-100"
          >
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span>Complete</span>
            <span className="text-[10px] font-normal text-emerald-300/70">Done Serving</span>
          </button>

          {/* Pause / Resume Button */}
          <button
            onClick={handleTogglePause}
            disabled={actionLoading}
            className={`py-4 px-4 rounded-2xl font-bold text-sm border transition-all hover:scale-[1.02] flex flex-col items-center justify-center gap-1.5 disabled:opacity-40 disabled:hover:scale-100 ${
              isPaused
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/20'
                : 'bg-rose-950/30 hover:bg-rose-900/50 text-rose-200 border-rose-500/30'
            }`}
          >
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5 text-rose-400" />}
            <span>{isPaused ? 'Resume Queue' : 'Pause Queue'}</span>
            <span className="text-[10px] font-normal opacity-70">
              {isPaused ? 'Unblock calls' : 'Take a break'}
            </span>
          </button>
        </div>
      </div>

      {/* Live Waiting List Table */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-400" />
            <h3 className="font-bold text-sm text-white">Live Waiting Queue</h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-xs text-brand-400 font-mono">
              {queueData?.waitingList ? queueData.waitingList.length : 0} waiting
            </span>
          </div>
          <span className="text-xs text-slate-400">Order by sequence</span>
        </div>

        {(!queueData?.waitingList || queueData.waitingList.length === 0) ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No customers currently waiting in this queue.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-5">Pos</th>
                  <th className="py-3.5 px-5">Token</th>
                  <th className="py-3.5 px-5">Customer Name</th>
                  <th className="py-3.5 px-5">Phone</th>
                  <th className="py-3.5 px-5">Joined Time</th>
                  <th className="py-3.5 px-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {queueData.waitingList.map((entry, index) => (
                  <tr
                    key={entry._id || entry.id}
                    className={`hover:bg-slate-800/30 transition-colors ${
                      index === 0 ? 'bg-sky-950/20' : ''
                    }`}
                  >
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-400">
                      #{index + 1}
                    </td>
                    <td className="py-3.5 px-5 font-mono font-black text-white text-sm">
                      {entry.tokenNumber}
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-white">
                      {entry.customerName}
                    </td>
                    <td className="py-3.5 px-5 text-slate-400">
                      {entry.customerPhone || '--'}
                    </td>
                    <td className="py-3.5 px-5 text-slate-400">
                      {formatTime(entry.joinedAt)}
                    </td>
                    <td className="py-3.5 px-5">
                      <Badge
                        status={index === 0 ? 'calling' : 'waiting'}
                        text={index === 0 ? 'Next' : 'Waiting'}
                        size="sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
