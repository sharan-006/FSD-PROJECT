import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { StatCard, Badge } from '../../components/common/StatCard';
import { useSocket } from '../../context/SocketContext';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  Activity,
  Users,
  CheckCircle2,
  Clock,
  Building2,
  Sliders,
  Monitor,
  RotateCw,
  TrendingUp,
  Radio
} from 'lucide-react';

export function AdminDashboard() {
  const { socket } = useSocket();
  const [data, setData] = useState(null);
  const [queuesMonitor, setQueuesMonitor] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [analyticsRes, queuesRes] = await Promise.all([
        adminApi.getAnalytics(),
        adminApi.getQueuesMonitor()
      ]);
      if (analyticsRes.success) {
        setData(analyticsRes);
      }
      if (queuesRes.success) {
        setQueuesMonitor(queuesRes.data);
      }
    } catch (e) {
      console.error('Error fetching admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Real-time synchronization for admin dashboard
  useEffect(() => {
    if (!socket) return;

    const handleStatsUpdate = () => {
      loadData();
    };

    socket.on('stats:updated', handleStatsUpdate);
    socket.on('queue:updated', handleStatsUpdate);

    return () => {
      socket.off('stats:updated', handleStatsUpdate);
      socket.off('queue:updated', handleStatsUpdate);
    };
  }, [socket]);

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 glass-panel rounded-3xl border border-slate-800">
        <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-xs">Loading admin analytics & system KPIs...</p>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const hourlyData = data?.hourlyChart || [];
  const serviceBreakdown = data?.serviceBreakdown || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
            System Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Enterprise Analytics & Queue Command
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time throughput metrics, counter allocation, and queue load across all facilities.
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Refresh Live Data</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="ACTIVE QUEUES"
          value={kpis.activeQueues !== undefined ? kpis.activeQueues : 4}
          subtitle="Across hospitals, banks, and service centers"
          icon={Activity}
          color="brand"
        />

        <StatCard
          title="WAITING CUSTOMERS"
          value={kpis.waitingCustomers !== undefined ? kpis.waitingCustomers : 37}
          subtitle="Currently waiting in digital lines"
          icon={Users}
          color="amber"
        />

        <StatCard
          title="SERVED TODAY"
          value={kpis.servedToday !== undefined ? kpis.servedToday : 126}
          subtitle="Customers completed across all desks"
          icon={CheckCircle2}
          color="emerald"
        />

        <StatCard
          title="ACTIVE COUNTERS"
          value={kpis.activeCounters !== undefined ? kpis.activeCounters : 8}
          subtitle="Online and serving desks"
          icon={Monitor}
          color="purple"
        />
      </div>

      {/* Secondary KPI Row: Average Waiting Time, Average Service Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Average Waiting Time
            </span>
            <div className="text-3xl font-extrabold text-sky-400 mt-2">
              {kpis.avgWaitingTimeMinutes || 14.5} <span className="text-sm font-semibold text-slate-400">minutes</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">From token generation to counter call</p>
          </div>
          <div className="p-3.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Average Service Time
            </span>
            <div className="text-3xl font-extrabold text-emerald-400 mt-2">
              {kpis.avgServiceTimeMinutes || 5.2} <span className="text-sm font-semibold text-slate-400">minutes</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Desk duration per consultation / transaction</p>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Visualizations: Customers Served Per Hour Chart */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-base text-white">Queue Hourly Activity Chart</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Hourly volume of customers served vs. active waiting load
            </p>
          </div>
          <span className="text-xs text-brand-400 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
            Live Hourly Distribution
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorServed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0e8ce9" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0e8ce9" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorWaiting" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
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
              <Area
                type="monotone"
                dataKey="served"
                name="Customers Served"
                stroke="#0e8ce9"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorServed)"
              />
              <Area
                type="monotone"
                dataKey="waiting"
                name="Waiting Surge"
                stroke="#f59e0b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorWaiting)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Live Queues Monitor Across Organizations */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <h3 className="font-bold text-sm text-white">Live Queues Master Monitor</h3>
          </div>
          <span className="text-xs text-slate-400">All facilities</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-4 px-6">Organization</th>
                <th className="py-4 px-6">Service Type</th>
                <th className="py-4 px-6">Current Token</th>
                <th className="py-4 px-6">Waiting</th>
                <th className="py-4 px-6">Served Today</th>
                <th className="py-4 px-6">Avg Time</th>
                <th className="py-4 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {queuesMonitor.map((q) => (
                <tr key={q._id || q.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-6 font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-brand-400" />
                      <span>{q.orgName}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-300">{q.serviceName}</td>
                  <td className="py-4 px-6 font-mono font-bold text-white text-sm">
                    {q.currentToken ? (
                      <span className="px-2.5 py-1 rounded-md bg-brand-500/20 text-brand-300 border border-brand-500/30">
                        {q.currentToken}
                      </span>
                    ) : (
                      <span className="text-slate-500">Idle</span>
                    )}
                  </td>
                  <td className="py-4 px-6 font-bold text-amber-400">{q.waitingCount} waiting</td>
                  <td className="py-4 px-6 font-bold text-emerald-400">{q.servedCount} served</td>
                  <td className="py-4 px-6 text-slate-400">~{q.averageServiceTime} min</td>
                  <td className="py-4 px-6">
                    <Badge status={q.status} text={q.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
