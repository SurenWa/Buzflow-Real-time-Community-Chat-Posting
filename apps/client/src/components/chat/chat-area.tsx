'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useSocket } from '@/context/socket-context';
import { useAuth } from '@/context/auth-context';
import type { SubscribedUser } from '@/components/chat/chat-sidebar';

type Message = {
    _id: string;
    senderId: string;
    receiverId: string;
    content: string;
    createdAt: string;
};

type ChatAreaProps = {
    selectedUser: SubscribedUser | null;
};

function getInitials(name: string): string {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string): string {
    const colors = [
        'hsl(220, 90%, 56%)', 'hsl(152, 69%, 45%)', 'hsl(280, 67%, 55%)',
        'hsl(350, 80%, 55%)', 'hsl(32, 90%, 55%)', 'hsl(190, 80%, 45%)',
        'hsl(330, 70%, 55%)', 'hsl(210, 70%, 50%)',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

function formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateSeparator(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ChatArea({ selectedUser }: ChatAreaProps) {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedUserOnline, setSelectedUserOnline] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setSelectedUserOnline(selectedUser?.isOnline ?? false);
    }, [selectedUser]);

    useEffect(() => {
        if (!selectedUser || !user) { setMessages([]); return; }
        const fetchMessages = async () => {
            setLoading(true);
            try {
                const msgs = await api<Message[]>(`/messages/${selectedUser._id}`);
                setMessages(msgs);
            } catch { setMessages([]); }
            finally { setLoading(false); }
        };
        fetchMessages();
    }, [selectedUser, user]);

    useEffect(() => {
        if (!socket || !user) return;
        const handleNewMessage = (message: Message) => {
            if (!selectedUser) return;
            const isRelevant =
                (message.senderId === user._id && message.receiverId === selectedUser._id) ||
                (message.senderId === selectedUser._id && message.receiverId === user._id);
            if (isRelevant) {
                setMessages((prev) => {
                    if (prev.some((m) => m._id === message._id)) return prev;
                    return [...prev, message];
                });
            }
        };
        socket.on('newMessage', handleNewMessage);
        return () => { socket.off('newMessage', handleNewMessage); };
    }, [socket, user, selectedUser]);

    useEffect(() => {
        if (!socket || !selectedUser) return;
        const handlePresence = (data: { userId: string; isOnline: boolean }) => {
            if (data.userId === selectedUser._id) setSelectedUserOnline(data.isOnline);
        };
        socket.on('presenceUpdate', handlePresence);
        return () => { socket.off('presenceUpdate', handlePresence); };
    }, [socket, selectedUser]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (!selectedUser) {
        return (
            <div className="flex-1 flex items-center justify-center" style={{ background: 'hsl(220, 20%, 97%)' }}>
                <div className="text-center animate-fade-in-up">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ background: 'hsl(220, 14%, 92%)' }}>
                        <MessageSquare className="w-7 h-7" style={{ color: 'hsl(220, 14%, 60%)' }} />
                    </div>
                    <p className="text-lg font-semibold text-gray-800">Select a conversation</p>
                    <p className="text-sm text-gray-400 mt-1">Choose from your subscriptions on the left</p>
                </div>
            </div>
        );
    }

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !user || !socket) return;
        const content = input.trim();
        setInput('');
        socket.emit('sendMessage', { receiverId: selectedUser._id, content });
    };

    // Group messages by date for separators
    const getDateKey = (dateStr: string) => new Date(dateStr).toDateString();

    let lastDateKey = '';

    return (
        <div className="flex-1 flex flex-col bg-white">
            {/* Chat header */}
            <div className="h-14 border-b px-5 flex items-center gap-3 shrink-0 bg-white/80 backdrop-blur-sm">
                <div className="relative">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: getAvatarColor(selectedUser.name) }}>
                        {getInitials(selectedUser.name)}
                    </div>
                    {selectedUserOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white"
                            style={{ background: 'hsl(152, 69%, 53%)' }} />
                    )}
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-900">{selectedUser.name}</p>
                    <p className={`text-xs font-medium ${selectedUserOnline ? '' : 'text-gray-400'}`}
                        style={selectedUserOnline ? { color: 'hsl(152, 69%, 53%)' } : {}}>
                        {selectedUserOnline ? 'Online' : 'Offline'}
                    </p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4" style={{ background: 'hsl(220, 20%, 97%)' }}>
                <div className="space-y-1 max-w-3xl mx-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                            <p className="text-sm text-gray-400 mt-3">Loading messages...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-16 animate-fade-in-up">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                                style={{ background: 'hsl(220, 14%, 92%)' }}>
                                <MessageSquare className="w-5 h-5" style={{ color: 'hsl(220, 14%, 60%)' }} />
                            </div>
                            <p className="text-sm font-medium text-gray-600">No messages yet</p>
                            <p className="text-xs text-gray-400 mt-1">Send a message to start the conversation</p>
                        </div>
                    ) : (
                        messages.map((msg, i) => {
                            const isMe = msg.senderId === user?._id;
                            const dateKey = getDateKey(msg.createdAt);
                            let showDateSeparator = false;
                            if (dateKey !== lastDateKey) {
                                showDateSeparator = true;
                                lastDateKey = dateKey;
                            }

                            // Check if consecutive message from same sender (compact mode)
                            const prevMsg = messages[i - 1];
                            const isConsecutive = prevMsg
                                && prevMsg.senderId === msg.senderId
                                && !showDateSeparator
                                && (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime()) < 120000;

                            return (
                                <div key={msg._id}>
                                    {showDateSeparator && (
                                        <div className="flex items-center gap-3 py-4">
                                            <div className="flex-1 h-px bg-gray-200" />
                                            <span className="text-xs font-medium text-gray-400 px-1">
                                                {formatDateSeparator(msg.createdAt)}
                                            </span>
                                            <div className="flex-1 h-px bg-gray-200" />
                                        </div>
                                    )}

                                    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mt-0.5' : 'mt-3'}`}>
                                        <div className={`max-w-[70%] ${isMe ? 'order-1' : 'order-1'}`}>
                                            <div
                                                className={`
                          px-4 py-2.5 text-sm leading-relaxed
                          ${isMe
                                                        ? 'text-white rounded-2xl rounded-br-md'
                                                        : 'text-gray-800 rounded-2xl rounded-bl-md border border-gray-100'
                                                    }
                        `}
                                                style={{
                                                    background: isMe ? 'hsl(220, 90%, 56%)' : 'white',
                                                }}
                                            >
                                                {msg.content}
                                            </div>
                                            {!isConsecutive && (
                                                <p className={`text-[10px] mt-1 px-1 ${isMe ? 'text-right text-gray-400' : 'text-gray-400'}`}>
                                                    {formatTime(msg.createdAt)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={bottomRef} />
                </div>
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="px-4 py-3 border-t bg-white shrink-0">
                <div className="flex items-center gap-2 max-w-3xl mx-auto">
                    <input
                        placeholder="Type a message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-1 h-10 px-4 rounded-xl text-sm bg-gray-50 border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all placeholder:text-gray-400"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-blue-500/25"
                        style={{ background: 'hsl(220, 90%, 56%)' }}
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </form>
        </div>
    );
}