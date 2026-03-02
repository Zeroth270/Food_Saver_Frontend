import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './WebSocketContext';
import { getUser, isLoggedIn } from '../utils/auth';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const { connected, subscribe } = useWebSocket();

    const addNotification = useCallback((message, type = 'info') => {
        const notification = {
            id: Date.now() + Math.random(),
            message: typeof message === 'string' ? message : JSON.stringify(message),
            type,
            timestamp: new Date(),
            read: false,
        };
        setNotifications(prev => [notification, ...prev].slice(0, 50));
        setUnreadCount(prev => prev + 1);
    }, []);

    useEffect(() => {
        if (!isLoggedIn() || !connected) return;

        const user = getUser();
        const unsubs = [];

        // Subscribe to global notifications
        unsubs.push(subscribe('/topic/notifications', (data) => {
            addNotification(typeof data === 'string' ? data : JSON.stringify(data), 'global');
        }));

        // Subscribe to private notifications
        if (user?.email) {
            unsubs.push(subscribe(`/user/${user.email}/queue/notifications`, (data) => {
                addNotification(typeof data === 'string' ? data : JSON.stringify(data), 'private');
            }));
        }

        return () => unsubs.forEach(unsub => unsub && unsub());
    }, [connected, subscribe, addNotification]);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    }, []);

    const markAsRead = useCallback((id) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
        setUnreadCount(0);
    }, []);

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            connected,
            markAllAsRead,
            markAsRead,
            clearAll,
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
