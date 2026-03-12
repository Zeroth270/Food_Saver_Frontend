import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    MessageCircle, Send, ArrowLeft, Search, User, Wifi,
    WifiOff, Loader2, AlertCircle, Clock, Utensils, Trash2, MoreVertical
} from 'lucide-react';
import { useWebSocket } from '../context/WebSocketContext';
import { getUser, isLoggedIn } from '../utils/auth';
import API_BASE_URL from '../config';
import { useSearchParams } from 'react-router-dom';

const Messages = () => {
    const { connected, subscribe, sendMessage: wsSend } = useWebSocket();
    const user = getUser();
    const [searchParams] = useSearchParams();

    // State
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null); // { name, email }
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    // No REST endpoint for conversations — managed client-side from messages
    const [loadingConversations, setLoadingConversations] = useState(false);

    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showMobileChat, setShowMobileChat] = useState(false);
    const [menuOpenId, setMenuOpenId] = useState(null);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to latest message
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Close conversation menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.conv-menu-container')) {
                setMenuOpenId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch conversations from backend
    const fetchConversations = useCallback(async () => {
        if (!user?.email) return;
        try {
            const response = await fetch(`${API_BASE_URL}/chat/conversations?email=${encodeURIComponent(user.email)}`);
            if (response.ok) {
                const data = await response.json();

                // The backend now returns List<ConversationDTO> instead of raw chats.
                // Expected fields: partnerEmail, partnerName, lastMessage, lastTimestamp, foodTitle
                const formattedConvs = data.map(conv => ({
                    id: conv.id || conv.conversationId || conv.convId, // defensively map ID
                    partnerEmail: conv.partnerEmail,
                    partnerName: conv.partnerName || conv.partnerEmail || 'Unknown User',
                    lastMessage: conv.lastMessage || '',
                    timestamp: conv.lastTimestamp || conv.timestamp || new Date().toISOString(),
                    foodTitle: conv.foodTitle || null,
                    foodPostId: conv.foodPostId || null,
                })).filter(c => c.partnerEmail); // Filter out any completely null DTOs just in case

                // Sort by newest first
                formattedConvs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                setConversations(formattedConvs);
                localStorage.setItem('chat_conversations', JSON.stringify(formattedConvs));
            }
        } catch (err) {
            console.error('Error fetching conversations:', err);
        } finally {
            setLoadingConversations(false);
        }
    }, [user?.email]);

    // Load conversations from localStorage immediately for fast UI, then fetch fresh ones
    useEffect(() => {
        try {
            const saved = localStorage.getItem('chat_conversations');
            if (saved) setConversations(JSON.parse(saved));
        } catch { /* ignore */ }

        fetchConversations();
    }, [fetchConversations]);

    // Persist optimistic conversation updates to UI and localStorage immediately 
    // without waiting for the next backend poll
    const upsertConversation = useCallback((partnerEmail, partnerName, lastMessage, foodTitle) => {
        setConversations(prev => {
            const existingConv = prev.find(c => c.partnerEmail === partnerEmail);
            const others = prev.filter(c => c.partnerEmail !== partnerEmail);

            // If we have an existing conversation with a real name (not an email), and the new partnerName is an email, keep the existing name
            const finalPartnerName = (existingConv && existingConv.partnerName && existingConv.partnerName !== existingConv.partnerEmail && partnerName === partnerEmail)
                ? existingConv.partnerName
                : (partnerName || existingConv?.partnerName || 'User');

            const updated = [
                {
                    partnerEmail,
                    partnerName: finalPartnerName,
                    lastMessage: lastMessage || existingConv?.lastMessage || '',
                    timestamp: new Date().toISOString(),
                    // Keep existing foodTitle/foodPostId if not provided in this call
                    foodTitle: foodTitle || existingConv?.foodTitle || null,
                    foodPostId: existingConv?.foodPostId || null,
                },
                ...others,
            ];
            // Sort by newest first
            updated.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            localStorage.setItem('chat_conversations', JSON.stringify(updated));
            return updated;
        });
    }, []);

    // Track whether we already auto-sent the intro for this food context
    const introSentRef = useRef(new Set());

    // Handle URL params for opening a chat directly
    useEffect(() => {
        const receiverName = searchParams.get('name');
        const receiverEmail = searchParams.get('email');
        const foodTitle = searchParams.get('foodTitle');
        const foodId = searchParams.get('foodId');
        if (receiverEmail) {
            setActiveChat({
                name: receiverName || 'User',
                email: receiverEmail,
                foodTitle: foodTitle || null,
                foodId: foodId || null,
            });
            setShowMobileChat(true);

            // Store food context in conversation if present
            if (foodTitle) {
                upsertConversation(receiverEmail, receiverName || 'User', `Interested in: ${foodTitle}`, foodTitle);
            }
        }
    }, [searchParams, upsertConversation]);

    // Fetch chat history from backend when switching chats (silent = no loading spinner)
    const fetchMessages = useCallback(async (partnerEmail, silent = false) => {
        if (!user?.email || !partnerEmail) return;
        if (!silent) {
            setLoadingMessages(true);
            setError('');
        }
        try {
            const response = await fetch(
                `${API_BASE_URL}/chat/history?sender=${encodeURIComponent(user.email)}&receiver=${encodeURIComponent(partnerEmail)}`
            );
            if (response.ok) {
                const data = await response.json();
                const sorted = (Array.isArray(data) ? data : []).sort(
                    (a, b) => new Date(a.timestamp || a.createdAt) - new Date(b.timestamp || b.createdAt)
                );

                // If this is a silent fetch (polling), we need to carefully merge so we don't
                // overwrite optimistic messages that haven't been saved to the DB yet.
                // We assume optimistic messages have an `id` that is very large (Date.now()) or don't exist in DB.
                // Actually, the simplest approach for now is to just replace, but if we just sent an optimistic msg,
                // the DB might be slightly behind.
                setMessages(prev => {
                    if (!silent) return sorted;

                    // Find optimistic messages (sent by us in the last 2 seconds) that might not be in the sorted DB list yet
                    const recentOptimistic = prev.filter(p => {
                        if (p.id > 1000000000000) return true; // It's an optimistic timestamp ID
                        return false;
                    });

                    if (recentOptimistic.length > 0) {
                        // Create a map of DB message contents to avoid duplicates
                        const dbContents = new Set(sorted.map(m => m.content.trim()));
                        const missingOptimistic = recentOptimistic.filter(m => !dbContents.has(m.content.trim()));

                        // If the DB caught up and has our message, return just DB.
                        // If the DB missed it, return DB + the missing optimistic message.
                        if (missingOptimistic.length > 0) {
                            return [...sorted, ...missingOptimistic].sort(
                                (a, b) => new Date(a.timestamp || a.createdAt) - new Date(b.timestamp || b.createdAt)
                            );
                        }
                    }

                    return sorted;
                });
            } else if (!silent) {
                setMessages([]);
            }
        } catch (err) {
            console.error('Error fetching chat history:', err);
            if (!silent) setMessages([]);
        } finally {
            if (!silent) setLoadingMessages(false);
        }
    }, [user?.email]);

    // Load messages when switching chats
    useEffect(() => {
        if (activeChat?.email) {
            fetchMessages(activeChat.email);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [activeChat?.email, fetchMessages]);

    // Poll for new messages every 5 seconds (REST fallback for WebSocket)
    useEffect(() => {
        if (!activeChat?.email) return;
        const interval = setInterval(() => {
            fetchMessages(activeChat.email, true); // silent fetch
        }, 5000);
        return () => clearInterval(interval);
    }, [activeChat?.email, fetchMessages]);

    // Poll for new conversations every 10 seconds (so donor sees new chats appear)
    useEffect(() => {
        const interval = setInterval(() => {
            fetchConversations();
        }, 10000);
        return () => clearInterval(interval);
    }, [fetchConversations]);

    // Auto-send intro message when receiver opens chat from a food post
    // Removed because the "Request Food" button now handles the initial context through the Contact APIs.
    // The chat now naturally follows after an Accept/Reject flow.
    useEffect(() => {
        if (!activeChat?.foodTitle || !activeChat?.email || !user?.email) return;
        // Build a unique key so we only auto-send once per food + partner combo
        const key = `${activeChat.email}__${activeChat.foodId || activeChat.foodTitle}`;
        if (introSentRef.current.has(key)) return;
        introSentRef.current.add(key);
        // Intro auto-send intentionally commented out. Flow has shifted to Request System.
    }, [activeChat?.foodTitle, activeChat?.foodId, activeChat?.email, activeChat?.name, connected, user?.email, wsSend, upsertConversation, fetchMessages]);

    // Subscribe to incoming messages via WebSocket
    useEffect(() => {
        if (!connected || !user?.email) return;

        const unsub = subscribe(`/user/${user.email}/queue/messages`, (incomingMsg) => {
            const msgSenderEmail = incomingMsg.senderEmail || '';

            // Ignore messages sent by ourselves (backend broadcasts them back)
            if (msgSenderEmail === user.email) return;

            // If from active chat partner, add to displayed messages
            if (activeChat?.email === msgSenderEmail) {
                setMessages(prev => [...prev, incomingMsg]);
            }

            // Update conversations list
            upsertConversation(msgSenderEmail, msgSenderEmail, incomingMsg.content || '');
        });

        return () => { if (unsub) unsub(); };
    }, [connected, user?.email, activeChat?.email, subscribe, upsertConversation]);

    // Send a message via WebSocket + REST API backup
    const handleSend = async () => {
        if (!newMessage.trim() || !activeChat || sending) return;

        const messagePayload = {
            senderEmail: user.email,
            receiverEmail: activeChat.email,
            content: newMessage.trim(),
        };

        setSending(true);

        // Optimistically add to local messages
        const optimisticMsg = {
            ...messagePayload,
            id: Date.now(), // High ID to identify as optimistic
            timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimisticMsg]);
        const sentText = newMessage.trim();
        setNewMessage('');

        // Update conversations list immediately
        upsertConversation(activeChat.email, activeChat.name, sentText);

        // Send via WebSocket if connected.
        // The updated backend now saves WebSocket messages to DB automatically.
        // If disconnected, fallback to REST API.
        if (connected) {
            wsSend('/app/send', messagePayload, activeChat.foodId ? { foodPostId: activeChat.foodId.toString() } : {});
        } else if (activeChat.foodId) {
            try {
                await fetch(`${API_BASE_URL}/chat/send/${activeChat.foodId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(messagePayload), // Make sure all expected backend fields are sent
                });
            } catch (err) {
                console.error('REST send failed:', err);
            }
        } else {
            console.warn('No foodId available for REST fallback, sending via generic fallback...');
            // Backup generic REST send if foodPostId is not strict
            try {
                await fetch(`${API_BASE_URL}/chat/send`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(messagePayload),
                });
            } catch (err) {
                console.error('Generic REST send failed:', err);
            }
        }

        setSending(false);

        // Re-fetch from DB after a short delay to sync with saved version
        setTimeout(() => fetchMessages(activeChat.email, true), 1000);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const openChat = (conv) => {
        setActiveChat({
            name: conv.partnerName || conv.partnerEmail || 'User',
            email: conv.partnerEmail,
            foodTitle: conv.foodTitle || null,
            foodId: conv.foodPostId || null,
        });
        setShowMobileChat(true);
    };

    const handleDeleteConversation = async (convEmailOrId, e) => {
        if (e) {
            e.stopPropagation(); // prevent opening the chat if clicking delete on list
        }

        // We try to find the actual `id` from the conversation if we only have the email
        const targetConv = conversations.find(c => c.partnerEmail === convEmailOrId || c.id === convEmailOrId);
        const convId = targetConv?.id || convEmailOrId; // fallback if it's already the ID

        if (!convId || isNaN(convId)) {
            alert('Cannot delete conversation: Server ID is missing. Try sending a message first or refresh.');
            return;
        }

        if (!window.confirm('Are you sure you want to delete this conversation? This action cannot be undone for you.')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/chat/delete/${convId}`, {
                method: 'DELETE',
            });

            if (response.ok || response.status === 200 || response.status === 204) {
                // Completely remove from local state using partnerEmail or id
                setConversations(prev => {
                    const updated = prev.filter(c => c.partnerEmail !== convEmailOrId && c.id !== convEmailOrId);
                    localStorage.setItem('chat_conversations', JSON.stringify(updated));
                    return updated;
                });
                // If it was the active chat, clear it
                if (activeChat?.email === convEmailOrId || activeChat?.id === convEmailOrId) {
                    setActiveChat(null);
                    setMessages([]);
                    setShowMobileChat(false);
                }
            } else {
                throw new Error('Failed to delete');
            }
        } catch (err) {
            console.error('Error deleting conversation:', err);
            alert('An error occurred while deleting the conversation.');
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        if (diff < 86400000) {
            return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        }
        if (diff < 604800000) {
            return date.toLocaleDateString('en-IN', { weekday: 'short' });
        }
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    const formatMessageTime = (timestamp) => {
        if (!timestamp) return '';
        return new Date(timestamp).toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit'
        });
    };

    const filteredConversations = conversations.filter(conv => {
        if (!searchTerm) return true;
        return (conv.partnerName || '').toLowerCase().includes(searchTerm.toLowerCase());
    });

    const getPartnerName = (conv) => conv.partnerName || 'User';

    const getPartnerInitial = (name) => {
        return (name || 'U').charAt(0).toUpperCase();
    };

    if (!isLoggedIn()) {
        return (
            <div className="container py-20 text-center">
                <MessageCircle size={48} className="mx-auto mb-4 text-text-muted/40" />
                <h2 className="text-xl font-bold text-text-main mb-2">Sign in to view messages</h2>
                <p className="text-text-light">You need to be logged in to send and receive messages.</p>
            </div>
        );
    }

    return (
        <div className="container py-6" style={{ height: 'calc(100vh - 140px)' }}>
            <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden flex h-full">

                {/* Conversation List (Left Panel) */}
                <div className={`w-full md:w-[340px] border-r border-border flex flex-col shrink-0 ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
                    {/* Header */}
                    <div className="p-4 border-b border-border">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-bold text-text-main">Messages</h2>
                            <div className="flex items-center gap-1">
                                {connected ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-green-600 font-medium px-2 py-0.5 bg-green-50 rounded-full">
                                        <Wifi size={10} /> Live
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-text-muted font-medium px-2 py-0.5 bg-border/50 rounded-full">
                                        <WifiOff size={10} /> Offline
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                            />
                        </div>
                    </div>

                    {/* Conversations */}
                    <div className="flex-grow overflow-y-auto">
                        {loadingConversations ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 size={24} className="animate-spin text-primary" />
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-4">
                                <MessageCircle size={36} className="text-text-muted/30 mb-3" />
                                <p className="text-sm text-text-muted font-medium">
                                    {searchTerm ? 'No conversations found' : 'No conversations yet'}
                                </p>
                                <p className="text-xs text-text-muted/70 mt-1 text-center">
                                    Start a conversation from the Discover page
                                </p>
                            </div>
                        ) : (
                            filteredConversations.map((conv, index) => {
                                const partnerName = getPartnerName(conv);
                                const isActive = activeChat?.email === conv.partnerEmail;

                                return (
                                    <div
                                        key={conv.partnerEmail || index}
                                        onClick={() => openChat(conv)}
                                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-border/30 ${isActive
                                            ? 'bg-primary/8 border-l-2 border-l-primary'
                                            : 'hover:bg-background'
                                            }`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                            {getPartnerInitial(partnerName)}
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold text-sm text-text-main truncate">
                                                    {partnerName}
                                                </p>
                                                <span className="text-[11px] text-text-muted shrink-0 ml-2">
                                                    {formatTime(conv.timestamp)}
                                                </span>
                                            </div>
                                            {conv.foodTitle && (
                                                <p className="text-[11px] text-primary font-medium truncate mt-0.5 flex items-center gap-1">
                                                    <Utensils size={10} className="shrink-0" />
                                                    {conv.foodTitle}
                                                </p>
                                            )}
                                            <p className="text-xs text-text-light truncate mt-0.5">
                                                {conv.lastMessage || 'Start a conversation'}
                                            </p>
                                        </div>
                                        {/* Three dot menu option */}
                                        {conv.id && (
                                            <div className="relative conv-menu-container self-start shrink-0">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setMenuOpenId(menuOpenId === conv.id ? null : conv.id);
                                                    }}
                                                    className="p-1 focus:outline-none text-text-muted hover:text-text-main hover:bg-border/50 rounded-md transition-all"
                                                    title="More Options"
                                                >
                                                    <MoreVertical size={18} />
                                                </button>
                                                
                                                {menuOpenId === conv.id && (
                                                    <div className="absolute right-0 top-full mt-1 w-32 bg-surface border border-border rounded-lg shadow-lg z-10 py-1 overflow-hidden">
                                                        <button
                                                            onClick={(e) => {
                                                                setMenuOpenId(null);
                                                                handleDeleteConversation(conv.id, e);
                                                            }}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
                                                        >
                                                            <Trash2 size={14} />
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Chat Window (Right Panel) */}
                <div className={`flex-grow flex flex-col ${!showMobileChat && !activeChat ? 'hidden md:flex' : 'flex'}`}>
                    {activeChat ? (
                        <>
                            {/* Chat Header */}
                            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface">
                                <button
                                    onClick={() => { setShowMobileChat(false); setActiveChat(null); }}
                                    className="md:hidden p-1 rounded-md hover:bg-border transition-colors cursor-pointer"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                    {getPartnerInitial(activeChat.name)}
                                </div>
                                <div className="flex-grow min-w-0">
                                    <p className="font-semibold text-sm text-text-main truncate">{activeChat.name}</p>
                                    {activeChat.email && (
                                        <p className="text-xs text-text-muted truncate">{activeChat.email}</p>
                                    )}
                                </div>
                            </div>
                            {/* Food context banner */}
                            {activeChat.foodTitle && (
                                <div className="px-4 py-2 bg-primary/5 border-b border-primary/15 flex items-center gap-2">
                                    <Utensils size={14} className="text-primary shrink-0" />
                                    <span className="text-xs font-medium text-primary truncate">
                                        Regarding: {activeChat.foodTitle}
                                    </span>
                                </div>
                            )}

                            {/* Messages Area */}
                            <div className="flex-grow overflow-y-auto px-4 py-4 space-y-1 bg-background/50">
                                {loadingMessages ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 size={28} className="animate-spin text-primary" />
                                    </div>
                                ) : error ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center">
                                            <AlertCircle size={32} className="mx-auto mb-2 text-red-400" />
                                            <p className="text-sm text-red-500">{error}</p>
                                            <button onClick={() => fetchMessages(activeChat.email)} className="text-xs text-primary underline mt-1 cursor-pointer">
                                                Retry
                                            </button>
                                        </div>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center">
                                            <MessageCircle size={40} className="mx-auto mb-3 text-text-muted/30" />
                                            <p className="text-sm text-text-muted font-medium">No messages yet</p>
                                            <p className="text-xs text-text-muted/70 mt-1">
                                                Send a message to start the conversation
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {messages.map((msg, index) => {
                                            const isOwn = (msg.senderEmail || '').trim().toLowerCase() === (user.email || '').trim().toLowerCase();
                                            const showDate = index === 0 || (
                                                new Date(msg.timestamp || msg.createdAt).toDateString() !==
                                                new Date(messages[index - 1]?.timestamp || messages[index - 1]?.createdAt).toDateString()
                                            );

                                            return (
                                                <React.Fragment key={msg.chatId || msg.id || index}>
                                                    {showDate && (
                                                        <div className="flex items-center justify-center py-3">
                                                            <span className="text-[11px] text-text-muted bg-background px-3 py-1 rounded-full border border-border">
                                                                {new Date(msg.timestamp || msg.createdAt).toLocaleDateString('en-IN', {
                                                                    weekday: 'long', day: 'numeric', month: 'short'
                                                                })}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
                                                        <div
                                                            className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${isOwn
                                                                ? 'bg-surface border border-border text-text-main rounded-br-md shadow-sm'
                                                                : 'bg-surface border border-border text-text-main rounded-bl-md'
                                                                }`}
                                                        >
                                                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                                            <p className={`text-[10px] mt-1 text-right text-text-muted`}>
                                                                {formatMessageTime(msg.timestamp || msg.createdAt)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </React.Fragment>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </>
                                )}
                            </div>

                            {/* Message Input */}
                            <div className="border-t border-border p-3 bg-surface">
                                <div className="flex items-end gap-2">
                                    <textarea
                                        ref={inputRef}
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Type a message..."
                                        rows={1}
                                        className="flex-grow resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text-main placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                        style={{ maxHeight: '120px' }}
                                        onInput={(e) => {
                                            e.target.style.height = 'auto';
                                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                                        }}
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={!newMessage.trim() || sending}
                                        className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${newMessage.trim() && !sending
                                            ? 'bg-primary text-white hover:bg-primary-dark shadow-sm'
                                            : 'bg-border text-text-muted cursor-not-allowed'
                                            }`}
                                    >
                                        {sending ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <Send size={18} />
                                        )}
                                    </button>
                                </div>
                                <p className="text-[10px] text-text-muted mt-1.5 ml-1">
                                    Press Enter to send, Shift+Enter for new line
                                </p>
                            </div>
                        </>
                    ) : (
                        /* Empty State — no chat selected */
                        <div className="flex-grow flex items-center justify-center bg-background/30">
                            <div className="text-center">
                                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <MessageCircle size={36} className="text-primary/40" />
                                </div>
                                <h3 className="text-lg font-bold text-text-main mb-1">Your Messages</h3>
                                <p className="text-sm text-text-light max-w-[280px]">
                                    Select a conversation or start a new one from the Discover page
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Messages;
