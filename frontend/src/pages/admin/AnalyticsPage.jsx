import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { StatCard } from '../../components/common/StatCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { BarChart3, Clock, TrendingUp, Users, CheckCircle2, RotateCw, Download } from 'lucide-react';

export function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    try {
      const res = await adminApi.getAnalytics();
      if (res.success) setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 glass-panel rounded-3xl border border-slate-800">
        <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-xs">Generating analytical reports...</p>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const serviceBreakdown = data?.serviceBreakdown || [];

  const handleExportCSV = () => {
    if (!serviceBreakdown || serviceBreakdown.length === 0) return;
    const headers = ['Service Department', 'Prefix', 'Target Avg Service Time (min)', 'Waiting Count', 'Served Today', 'Completion Rate (%)'];
    const rows = serviceBreakdown.map((s) => {
      const total = (s.served || 0) + (s.waiting || 0);
      const rate = total > 0 ? Math.round((s.served / total) * 100) : 100;
      return [
        `"${s.name}"`,
        `"${s.prefix}"`,
        s.averageServiceTime,
        s.waiting,
        s.served,
        `${rate}%`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `qveue_analytics_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
            Admin Console
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Analytics & Queue Performance
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational bottlenecks, throughput per department, and AI wait-time calibration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report (CSV)</span>
          </button>

          <button
            onClick={loadAnalytics}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Service Load Chart */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl">
        <h3 className="font-bold text-base text-white mb-1">Queue Load by Service Department</h3>
        <p className="text-xs text-slate-400 mb-6">
          Comparison of waiting customers versus completed tickets per service today
        </p>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={serviceBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} interval={0} angle={-15} textAnchor="end" />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#fff'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="served" name="Served Customers" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="waiting" name="Currently Waiting" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Metrics Table */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800">
          <h3 className="font-bold text-sm text-white">Departmental Throughput & Service Durations</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-4 px-6">Service Category</th>
                <th className="py-4 px-6">Token Prefix</th>
                <th className="py-4 px-6">Target Avg. Service Time</th>
                <th className="py-4 px-6">Currently Waiting</th>
                <th className="py-4 px-6">Total Served Today</th>
                <th className="py-4 px-6">Completion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {serviceBreakdown.map((s) => {
                const total = (s.served || 0) + (s.waiting || 0);
                const rate = total > 0 ? Math.round((s.served / total) * 100) : 100;
                return (
                  <tr key={s.serviceId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-white">{s.name}</td>
                    <td className="py-4 px-6 font-mono font-bold text-sky-400">{s.prefix}</td>
                    <td className="py-4 px-6 text-slate-300">~{s.averageServiceTime} minutes</td>
                    <td className="py-4 px-6 font-bold text-amber-400">{s.waiting}</td>
                    <td className="py-4 px-6 font-bold text-emerald-400">{s.served}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">{rate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
