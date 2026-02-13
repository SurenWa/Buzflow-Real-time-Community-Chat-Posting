'use client';

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    mockMessages,
    currentUser,
    getUserById,
    type MockUser,
    type MockMessage,
} from '@/lib/mock-data';

type ChatAreaProps = {
    selectedUser: MockUser | null;
};

export default function ChatArea({ selectedUser }: ChatAreaProps) {
    const [messages, setMessages] = useState<MockMessage[]>(mockMessages);
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when messages change
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

    // Filter messages for this conversation
    const conversationMessages = messages.filter(
        (m) =>
            (m.senderId === currentUser._id && m.receiverId === selectedUser._id) ||
            (m.senderId === selectedUser._id && m.receiverId === currentUser._id)
    );

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const newMessage: MockMessage = {
            _id: `m${Date.now()}`,
            senderId: currentUser._id,
            receiverId: selectedUser._id,
            content: input.trim(),
            createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, newMessage]);
        setInput('');
    };

    return (
        <div className="flex-1 flex flex-col bg-white">
            {/* Chat header */}
            <div className="h-14 border-b px-4 flex items-center gap-3 shrink-0">
                <div className="relative">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-gray-200">
                            {selectedUser.avatar}
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
                    {conversationMessages.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm py-8">
                            No messages yet. Say hello!
                        </p>
                    ) : (
                        conversationMessages.map((msg) => {
                            const isMe = msg.senderId === currentUser._id;
                            const sender = getUserById(msg.senderId);
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