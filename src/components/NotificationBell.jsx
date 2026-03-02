import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, Wifi, WifiOff } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const NotificationBell = () => {
    const { notifications, unreadCount, connected, markAllAsRead, markAsRead, clearAll } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef(null);

    // Close panel on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const togglePanel = () => {
        setIsOpen(prev => !prev);
    };

    const formatTime = (date) => {
        const now = new Date();
        const diff = now - new Date(date);
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell Button */}
            <button
                onClick={togglePanel}
                className="relative p-2 rounded-full text-text-main hover:bg-border transition-colors duration-200 cursor-pointer"
                title="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-[360px] max-h-[440px] bg-surface border border-border rounded-xl shadow-2xl overflow-hidden z-[100] animate-in">
                    {/* Header */}
                    <div className="sticky top-0 bg-surface border-b border-border px-4 py-3 flex items-center justify-between z-10">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-text-main text-sm">Notifications</h3>
                            {connected ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-green-600 font-medium">
                                    <Wifi size={10} /> Live
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] text-text-muted font-medium">
                                    <WifiOff size={10} /> Offline
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="p-1.5 rounded-md text-text-muted hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer"
                                    title="Mark all as read"
                                >
                                    <CheckCheck size={16} />
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button
                                    onClick={clearAll}
                                    className="p-1.5 rounded-md text-text-muted hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                                    title="Clear all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="overflow-y-auto max-h-[360px]">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-4">
                                <Bell size={36} className="text-text-muted/30 mb-3" />
                                <p className="text-sm text-text-muted font-medium">No notifications yet</p>
                                <p className="text-xs text-text-muted/70 mt-1">
                                    You'll see updates about food listings here
                                </p>
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    onClick={() => markAsRead(notification.id)}
                                    className={`px-4 py-3 border-b border-border/50 cursor-pointer transition-colors duration-150 hover:bg-primary/5 ${!notification.read ? 'bg-primary/5' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Indicator */}
                                        <div className="mt-1.5 shrink-0">
                                            {!notification.read ? (
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                            ) : (
                                                <div className="w-2 h-2 rounded-full bg-transparent" />
                                            )}
                                        </div>
                                        {/* Content */}
                                        <div className="flex-grow min-w-0">
                                            <p className={`text-sm leading-snug ${!notification.read ? 'text-text-main font-medium' : 'text-text-light'}`}>
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[11px] text-text-muted">
                                                    {formatTime(notification.timestamp)}
                                                </span>
                                                {notification.type === 'private' && (
                                                    <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                                        For you
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {/* Read check */}
                                        {notification.read && (
                                            <Check size={14} className="text-text-muted/50 shrink-0 mt-1" />
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <style>{`
                        .animate-in {
                            animation: dropIn 0.2s ease-out;
                        }
                        @keyframes dropIn {
                            from { opacity: 0; transform: translateY(-8px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
