import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './WebSocketContext';
import { getUser, isLoggedIn } from '../utils/auth';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

// Haversine formula — returns distance in km between two lat/lng points
const getDistanceKm = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const { connected, subscribe } = useWebSocket();
    const userCoordsRef = useRef(null);

    // Watch user's real-time location for distance-based push notifications
    useEffect(() => {
        if (!isLoggedIn() || !navigator.geolocation) return;

        // Setup a watch to keep coordinates updated in the background
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                userCoordsRef.current = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                };
            },
            (err) => console.log('Location not available for notifications:', err.message),
            { enableHighAccuracy: false, maximumAge: 60000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

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
            try {
                // Try to parse the incoming broadcast as JSON (it might be a Food object)
                const payload = typeof data === 'string' ? JSON.parse(data) : data;

                // Check if it's a location-based food notification
                if (payload && payload.latitude && payload.longitude) {
                    // Check if receiver disabled notifications completely
                    if (user?.notificationEnabled === false) return;

                    // If we have receiver coordinates, filter by distance
                    if (userCoordsRef.current) {
                        const dist = getDistanceKm(
                            userCoordsRef.current.lat,
                            userCoordsRef.current.lng,
                            payload.latitude,
                            payload.longitude
                        );
                        // Use receiver's defined radius, or default to 10km if not set
                        const radius = user?.notificationRadius || 10;

                        if (dist <= radius) {
                            addNotification(`New food near you: ${payload.title || 'Check it out!'}`, 'global');
                        }
                    } else {
                        // If receiver hasn't granted location permissions yet, just show it
                        addNotification(`New food posted: ${payload.title || 'Check it out!'}`, 'global');
                    }
                } else {
                    // It's a regular string message or non-location notification
                    addNotification(payload.message || JSON.stringify(payload), 'global');
                }
            } catch (err) {
                // Fallback for simple string notifications
                addNotification(typeof data === 'string' ? data : JSON.stringify(data), 'global');
            }
        }));

        // Subscribe to private notifications
        if (user?.email) {
            unsubs.push(subscribe(`/user/${user.email}/queue/notifications`, (data) => {
                const messageStr = typeof data === 'string' ? data : JSON.stringify(data);
                addNotification(messageStr, 'private');

                // Show a toast when directly notified
                toast(messageStr, {
                    icon: '🔔',
                    duration: 5000,
                    style: {
                        background: '#333',
                        color: '#fff',
                    },
                });
            }));

            // Subscribe to chat messages globally so conversations are captured
            // even when the user is NOT on the Messages page
            unsubs.push(subscribe(`/user/${user.email}/queue/messages`, (incomingMsg) => {
                const senderEmail = incomingMsg.senderEmail || '';

                // Ignore messages sent by ourselves (backend now broadcasts back to sender)
                if (senderEmail === user.email) return;

                const senderName = incomingMsg.senderName || senderEmail;
                const content = incomingMsg.content || '';

                // Update localStorage conversations so Messages page shows them
                try {
                    const saved = localStorage.getItem('chat_conversations');
                    const convs = saved ? JSON.parse(saved) : [];
                    const existingConv = convs.find(c => c.partnerEmail === senderEmail);
                    const others = convs.filter(c => c.partnerEmail !== senderEmail);
                    const updated = [
                        {
                            partnerEmail: senderEmail,
                            partnerName: senderName,
                            lastMessage: content,
                            timestamp: new Date().toISOString(),
                            foodTitle: incomingMsg.foodTitle || existingConv?.foodTitle || null,
                        },
                        ...others,
                    ];
                    localStorage.setItem('chat_conversations', JSON.stringify(updated));
                } catch { /* ignore */ }

                // Add a notification for the new message
                addNotification(`New message from ${senderName}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`, 'message');
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
