'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
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
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export default function ChatArea({ selectedUser }: ChatAreaProps) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Fetch conversation history when selected user changes
    useEffect(() => {
        if (!selectedUser || !user) {
            setMessages([]);
            return;
        }

        const fetchMessages = async () => {
            setLoading(true);
            try {
                const msgs = await api<Message[]>(`/messages/${selectedUser._id}`);
                setMessages(msgs);
            } catch {
                setMessages([]);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
    }, [selectedUser, user]);

    // ─── Listen for real-time messages via Socket.IO ─────
    useEffect(() => {
        const socket = getSocket();
        if (!socket || !user) return;

        const handleNewMessage = (message: Message) => {
            // Only add to current conversation if it's between us and selectedUser
            if (!selectedUser) return;

            const isRelevant =
                (message.senderId === user._id && message.receiverId === selectedUser._id) ||
                (message.senderId === selectedUser._id && message.receiverId === user._id);

            if (isRelevant) {
                setMessages((prev) => {
                    // Avoid duplicates (the sender also receives their own message via room)
                    if (prev.some((m) => m._id === message._id)) return prev;
                    return [...prev, message];
                });
            }
        };

        socket.on('newMessage', handleNewMessage);

        // Cleanup: remove listener when selectedUser changes or component unmounts
        return () => {
            socket.off('newMessage', handleNewMessage);
        };
    }, [user, selectedUser]);

    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (!selectedUser) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center text-gray-400">
                    <p className="text-lg font-medium">Select a user to start chatting</p>
                    <p className="text-sm mt-1">
                        Choose from your subscriptions on the left
                    </p>
                </div>
            </div>
        );
    }

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !user) return;

        const content = input.trim();
        setInput('');

        const socket = getSocket();
        if (!socket) return;

        // Emit the message through WebSocket
        // The server will:
        // 1. Save it to DB
        // 2. Emit 'newMessage' to both sender and receiver rooms
        // 3. We'll receive it back via the 'newMessage' listener above
        socket.emit('sendMessage', {
            senderId: user._id,
            receiverId: selectedUser._id,
            content,
        });
    };

    return (
        <div className="flex-1 flex flex-col bg-white">
            {/* Chat header */}
            <div className="h-14 border-b px-4 flex items-center gap-3 shrink-0">
                <div className="relative">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-gray-200">
                            {getInitials(selectedUser.name)}
                        </AvatarFallback>
                    </Avatar>
                    {selectedUser.isOnline && (
                        <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 ring-2 ring-white" />
                    )}
                </div>
                <div>
                    <p className="text-sm font-semibold">{selectedUser.name}</p>
                    <p className="text-xs text-gray-400">
                        {selectedUser.isOnline ? 'Online' : 'Offline'}
                    </p>
                </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                    {loading ? (
                        <p className="text-center text-gray-400 text-sm py-8">
                            Loading messages...
                        </p>
                    ) : messages.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm py-8">
                            No messages yet. Say hello!
                        </p>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.senderId === user?._id;
                            return (
                                <div
                                    key={msg._id}
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-900'
                                            }`}
                                    >
                                        <p className="text-sm">{msg.content}</p>
                                        <p
                                            className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'
                                                }`}
                                        >
                                            {new Date(msg.createdAt).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={bottomRef} />
                </div>
            </ScrollArea>

            {/* Message input */}
            <form
                onSubmit={handleSend}
                className="p-3 border-t flex items-center gap-2 shrink-0"
            >
                <Input
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1"
                />
                <Button type="submit" size="icon" disabled={!input.trim()}>
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </div>
    );
}