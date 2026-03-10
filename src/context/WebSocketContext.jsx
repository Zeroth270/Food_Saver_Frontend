import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import API_BASE_URL from '../config';
import { getUser, isLoggedIn } from '../utils/auth';

const WebSocketContext = createContext();

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
    const [connected, setConnected] = useState(false);
    const clientRef = useRef(null);
    const subscriptionsRef = useRef(new Map()); // uniqueKey -> { destination, callback, stompSub }
    const subIdCounter = useRef(0);

    useEffect(() => {
        if (!isLoggedIn()) return;

        const user = getUser();
        const wsUrl = API_BASE_URL.replace(/^http/, 'http') + '/ws';

        const client = new Client({
            webSocketFactory: () => new SockJS(wsUrl),
            connectHeaders: {
                email: user?.email || '',
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,

            onConnect: () => {
                setConnected(true);
                console.log('[WS] Connected');

                // Re-subscribe all registered subscribers on reconnect
                subscriptionsRef.current.forEach((entry, key) => {
                    const stompSub = client.subscribe(entry.destination, (msg) => {
                        try {
                            entry.callback(JSON.parse(msg.body));
                        } catch {
                            entry.callback(msg.body);
                        }
                    });
                    entry.stompSub = stompSub;
                });
            },

            onDisconnect: () => {
                setConnected(false);
                console.log('[WS] Disconnected');
            },

            onStompError: (frame) => {
                console.error('[WS] STOMP error:', frame.headers['message']);
            },
        });

        client.activate();
        clientRef.current = client;

        return () => {
            if (clientRef.current) {
                clientRef.current.deactivate();
                clientRef.current = null;
            }
        };
    }, []);

    const subscribe = useCallback((destination, callback) => {
        // Generate a unique key so multiple subscribers to the same destination coexist
        const subKey = `${destination}__${++subIdCounter.current}`;

        const entry = { destination, callback, stompSub: null };
        subscriptionsRef.current.set(subKey, entry);

        if (clientRef.current?.connected) {
            entry.stompSub = clientRef.current.subscribe(destination, (msg) => {
                try {
                    callback(JSON.parse(msg.body));
                } catch {
                    callback(msg.body);
                }
            });
        }

        // Return unsubscribe function
        return () => {
            if (entry.stompSub) {
                try { entry.stompSub.unsubscribe(); } catch { /* ignore */ }
            }
            subscriptionsRef.current.delete(subKey);
        };
    }, []);

    const sendMessage = useCallback((destination, body, headers = {}) => {
        if (clientRef.current?.connected) {
            clientRef.current.publish({
                destination,
                body: typeof body === 'string' ? body : JSON.stringify(body),
                headers,
            });
        }
    }, []);

    return (
        <WebSocketContext.Provider value={{ connected, subscribe, sendMessage }}>
            {children}
        </WebSocketContext.Provider>
    );
};
