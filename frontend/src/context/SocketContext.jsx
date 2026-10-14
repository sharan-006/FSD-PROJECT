import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Connect to backend websocket
    const socketInstance = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      // console.log('[Socket] Connected to server, ID:', socketInstance.id);
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      // console.log('[Socket] Disconnected from server');
      setConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Update room subscriptions whenever user changes
  useEffect(() => {
    if (!socket || !connected) return;

    if (user) {
      const uid = user._id || user.id;
      socket.emit('join:user', uid);

      if (user.role === 'staff') {
        socket.emit('join:staff', {
          staffId: uid,
          orgId: user.organizationId,
        });
      } else if (user.role === 'admin') {
        socket.emit('join:admin');
      }
    }
  }, [socket, connected, user]);

  const joinQueueRoom = (queueId) => {
    if (socket && queueId) {
      socket.emit('join:queue', queueId);
    }
  };

  const leaveQueueRoom = (queueId) => {
    if (socket && queueId) {
      socket.emit('leave:queue', queueId);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        joinQueueRoom,
        leaveQueueRoom,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
