import React, { createContext, useContext, useEffect, useState } from 'react';
import { socket } from '../services/socket.js';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './ToastContext.jsx';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const { user, activeIdentity, isStaff } = useAuth();
  const { toast } = useToast();
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (activeIdentity?.id) {
      socket.emit('join:identity', activeIdentity.id);
    }
    if (isStaff) {
      socket.emit('join:admin');
    }

    const handleNewNotification = (data) => {
      setUnreadNotifications(prev => prev + 1);
      toast.info(`🔔 ${data.title || "New notification"}: ${data.content || ""}`);
    };

    const handleModerationAlert = (data) => {
      if (isStaff) {
        toast.warning(`🛡️ Safety Trigger: ${data.targetType} flagged (${data.riskLevel} risk)`);
      }
    };

    socket.on('notification:new', handleNewNotification);
    socket.on('moderation:new_report', handleModerationAlert);

    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.off('moderation:new_report', handleModerationAlert);
    };
  }, [activeIdentity, isStaff, toast]);

  return (
    <SocketContext.Provider value={{ socket, unreadNotifications, setUnreadNotifications }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
