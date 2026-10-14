import React, { useState, useEffect } from 'react';
import { queueApi } from '../../services/api';
import { Badge } from '../../components/common/StatCard';
import { formatDate, formatTime } from '../../utils/formatters';
import { History, Building2, Clock, CheckCircle2, Ticket } from 'lucide-react';

export function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await queueApi.getMyHistory();
        if (res.success && res.data) {
          setHistory(res.data);
        }
      } catch (e) {
        console.error('Failed to load history', e);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
          Activity Records
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
          Queue Visit History
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Review your past served, completed, or cancelled digital queue tokens.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 glass-panel rounded-3xl border border-slate-800">
          <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-xs">Loading queue history...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="p-12 text-center glass-panel rounded-3xl border border-slate-800">
          <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Previous Visits Recorded</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Once you join queues and complete service at counters, your visit history will appear here.
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6">Token</th>
                  <th className="py-4 px-6">Organization & Service</th>
                  <th className="py-4 px-6">Joined Date</th>
                  <th className="py-4 px-6">Served / Ended</th>
                  <th className="py-4 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.map((item) => (
                  <tr key={item._id || item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-white text-sm">
                      {item.tokenNumber}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white">{item.serviceName}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-brand-400" />
                        {item.orgName}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-400">
                      <div>{formatDate(item.joinedAt)}</div>
                      <div className="text-[10px] text-slate-500">{formatTime(item.joinedAt)}</div>
                    </td>
                    <td className="py-4 px-6 text-slate-400">
                      {item.completedAt ? (
                        <>
                          <div>{formatDate(item.completedAt)}</div>
                          <div className="text-[10px] text-slate-500">{formatTime(item.completedAt)}</div>
                        </>
                      ) : (
                        <span className="text-slate-500">--</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <Badge status={item.status} text={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
