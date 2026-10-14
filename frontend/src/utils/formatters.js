export function formatMinutes(mins) {
  if (mins === undefined || mins === null) return '--';
  if (mins <= 0) return 'Immediate (Next)';
  if (mins === 1) return '1 minute';
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remaining = mins % 60;
    return remaining > 0 ? `${hours}h ${remaining}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  return `${mins} minutes`;
}

export function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getStatusColor(status) {
  switch (status?.toLowerCase()) {
    case 'waiting':
      return {
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        dot: 'bg-amber-400'
      };
    case 'calling':
    case 'serving':
      return {
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse',
        dot: 'bg-emerald-400'
      };
    case 'completed':
      return {
        bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        dot: 'bg-blue-400'
      };
    case 'skipped':
    case 'cancelled':
      return {
        bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        dot: 'bg-rose-400'
      };
    case 'paused':
      return {
        bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        dot: 'bg-amber-400'
      };
    case 'active':
    case 'open':
      return {
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        dot: 'bg-emerald-400'
      };
    default:
      return {
        bg: 'bg-slate-700/40 text-slate-300 border-slate-600',
        dot: 'bg-slate-400'
      };
  }
}
