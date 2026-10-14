import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Clock } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { formatTime } from '../../utils/formatters';

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white ring-2 ring-slate-900 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl glass-panel shadow-2xl border border-slate-800 overflow-hidden z-50 animate-slide-up">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-900/60">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 text-xs font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/40">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                No notifications yet. You will be alerted when your turn arrives!
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id || n.id}
                  onClick={() => !n.read && markAsRead(n._id || n.id)}
                  className={`p-3.5 hover:bg-slate-800/40 cursor-pointer transition-colors flex items-start gap-3 ${
                    !n.read ? 'bg-brand-950/20' : ''
                  }`}
                >
                  <div
                    className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${
                      !n.read ? 'bg-brand-400 ring-2 ring-brand-400/30' : 'bg-slate-700'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-200">{n.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                    <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(n.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
