import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { notificationApi } from '../services/api';
import { playChime, playAlertBeep } from '../utils/soundAlerts';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((toastData) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 4);
    const newToast = {
      id,
      title: toastData.title || 'Notification',
      message: toastData.message || '',
      type: toastData.type || 'info', // info, success, warning, alert
      timestamp: new Date()
    };

    setToasts((prev) => [newToast, ...prev].slice(0, 5));

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  }, []);

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await notificationApi.getMy();
      if (res.success) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount);
      }
    } catch (e) {
      console.warn('Could not fetch notifications:', e);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Listen for real-time notifications on socket
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (data) => {
      // Audio chime trigger
      if (data.type === 'called') {
        playChime();
      } else if (data.type === 'turn_approaching') {
        playAlertBeep();
      } else {
        playChime();
      }

      showToast({
        title: data.title || 'Queue Alert',
        message: data.message,
        type: data.type === 'called' ? 'success' : data.type === 'turn_approaching' ? 'warning' : 'info'
      });

      setUnreadCount((c) => c + 1);
      if (data.notification) {
        setNotifications((prev) => [data.notification, ...prev]);
      }
    };

    const handleTicketCalled = (data) => {
      // Global ticket broadcast announcement for public display
      if (data.tokenNumber) {
        playChime();
      }
    };

    socket.on('notification:new', handleNewNotification);
    socket.on('ticket:called', handleTicketCalled);

    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.off('ticket:called', handleTicketCalled);
    };
  }, [socket, showToast]);

  const markAsRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id || n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (user) {
        await notificationApi.markAllRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toasts,
        showToast,
        dismissToast,
        markAsRead,
        markAllAsRead,
        reloadNotifications: loadNotifications,
      }}
    >
      {children}
      
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl border backdrop-blur-md animate-slide-up transition-all ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100'
                : toast.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500/40 text-amber-100'
                : toast.type === 'alert'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-100'
                : 'bg-slate-900/95 border-brand-500/40 text-white'
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wide">{toast.title}</span>
                <span className="text-[10px] opacity-75">Just now</span>
              </div>
              <p className="text-xs mt-1 leading-relaxed opacity-90">{toast.message}</p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-xs opacity-60 hover:opacity-100 p-1 -mr-1 transition-opacity"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
