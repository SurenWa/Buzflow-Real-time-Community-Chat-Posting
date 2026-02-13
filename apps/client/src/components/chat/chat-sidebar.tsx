'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context';

export type SubscribedUser = {
    _id: string;
    name: string;
    email: string;
    isOnline: boolean;
    lastSeen: string | null;
};

type ChatSidebarProps = {
    selectedUserId: string | null;
    onSelectUser: (user: SubscribedUser) => void;
};

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export default function ChatSidebar({ selectedUserId, onSelectUser }: ChatSidebarProps) {
    const { user } = useAuth();
    const [subscribedUsers, setSubscribedUsers] = useState<SubscribedUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchSubscriptions = async () => {
            try {
                const users = await api<SubscribedUser[]>('/subscriptions/mine');
                setSubscribedUsers(users);
            } catch {
                // ignore
            } finally {
                setLoading(false);
            }
        };

        fetchSubscriptions();
    }, [user]);

    return (
        <aside className="w-72 border-r bg-white flex flex-col shrink-0">
            <div className="p-3 border-b">
                <h2 className="font-semibold text-sm text-gray-700">Subscriptions</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                    {subscribedUsers.length} users
                </p>
            </div>
            <ScrollArea className="flex-1">
                {loading ? (
                    <p className="p-4 text-sm text-gray-400 text-center">Loading...</p>
                ) : subscribedUsers.length === 0 ? (
                    <p className="p-4 text-sm text-gray-400 text-center">
                        No subscriptions yet
                    </p>
                ) : (
                    subscribedUsers.map((su) => (
                        <button
                            key={su._id}
                            onClick={() => onSelectUser(su)}
                            className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left ${selectedUserId === su._id ? 'bg-gray-100' : ''
                                }`}
                        >
                            <div className="relative">
                                <Avatar className="h-9 w-9">
                                    <AvatarFallback className="text-xs bg-gray-200">
                                        {getInitials(su.name)}
                                    </AvatarFallback>
                                </Avatar>
                                {su.isOnline && (
                                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {su.name}
                                </p>
                                <p className="text-xs text-gray-400">
                                    {su.isOnline ? 'Online' : 'Offline'}
                                </p>
                            </div>
                        </button>
                    ))
                )}
            </ScrollArea>
        </aside>
    );
}