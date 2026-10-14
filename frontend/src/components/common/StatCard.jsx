import React from 'react';
import { getStatusColor } from '../../utils/formatters';

export function Badge({ status, text, size = 'md', className = '' }) {
  const config = getStatusColor(status || text);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${sizeClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span className="capitalize">{text || status}</span>
    </span>
  );
}

export function StatCard({ title, value, subtitle, icon: Icon, color = 'brand', trend }) {
  const colorMap = {
    brand: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  };

  const selectedColor = colorMap[color] || colorMap.brand;

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden transition-all duration-200 hover:border-slate-700 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-xl border ${selectedColor}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold tracking-tight text-white">{value}</span>
        {trend && (
          <span className="text-xs font-medium text-emerald-400 flex items-center">
            {trend}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
}
