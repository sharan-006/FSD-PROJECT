import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { counterApi, orgApi } from '../../services/api';
import { Monitor, CheckCircle, XCircle, Clock, ShieldCheck } from 'lucide-react';
import { Badge } from '../../components/common/StatCard';

export function CounterManagementPage() {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [counters, setCounters] = useState([]);
  const [loading, setLoading] = useState(true);

  const orgId = user?.organizationId;

  const loadCounters = async () => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    try {
      const res = await counterApi.getByOrg(orgId);
      if (res.success && res.data) {
        setCounters(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCounters();
  }, [orgId]);

  const handleStatusChange = async (counterId, newStatus) => {
    try {
      await counterApi.updateStatus(counterId, { status: newStatus });
      showToast({ title: 'Counter Updated', message: `Counter is now ${newStatus}.`, type: 'info' });
      loadCounters();
    } catch (e) {
      showToast({ title: 'Error', message: e.message, type: 'alert' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
          Terminal Operations
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
          Counter Management
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          View and control counter readiness, status, and service station occupancy.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 glass-panel rounded-3xl border border-slate-800">
          <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-xs">Loading counters...</p>
        </div>
      ) : counters.length === 0 ? (
        <div className="p-12 text-center glass-panel rounded-3xl border border-slate-800">
          <Monitor className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Counters Found</h3>
          <p className="text-xs text-slate-400 mt-1">No counters are configured for your organization.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {counters.map((counter) => (
            <div
              key={counter._id || counter.id}
              className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-slate-800 text-sky-400">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-base text-white">{counter.counterNumber}</span>
                </div>
                <Badge status={counter.status} text={counter.status} />
              </div>

              <div className="text-xs text-slate-400 space-y-1">
                <p>
                  Assigned Staff:{' '}
                  <span className="text-white font-medium">
                    {counter.staff ? counter.staff.name : 'Unassigned'}
                  </span>
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => handleStatusChange(counter._id || counter.id, 'open')}
                  disabled={counter.status === 'open'}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 font-semibold text-xs border border-emerald-500/30 transition-colors disabled:opacity-30"
                >
                  Open
                </button>
                <button
                  onClick={() => handleStatusChange(counter._id || counter.id, 'busy')}
                  disabled={counter.status === 'busy'}
                  className="flex-1 py-2 px-3 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 font-semibold text-xs border border-amber-500/30 transition-colors disabled:opacity-30"
                >
                  Busy
                </button>
                <button
                  onClick={() => handleStatusChange(counter._id || counter.id, 'closed')}
                  disabled={counter.status === 'closed'}
                  className="flex-1 py-2 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-semibold text-xs border border-rose-500/30 transition-colors disabled:opacity-30"
                >
                  Close
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
