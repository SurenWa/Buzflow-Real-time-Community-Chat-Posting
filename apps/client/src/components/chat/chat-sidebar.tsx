'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { subscribedUsers, type MockUser } from '@/lib/mock-data';

type ChatSidebarProps = {
    selectedUserId: string | null;
    onSelectUser: (user: MockUser) => void;
};

export default function ChatSidebar({ selectedUserId, onSelectUser }: ChatSidebarProps) {
    return (
        <aside className="w-72 border-r bg-white flex flex-col shrink-0">
            <div className="p-3 border-b">
                <h2 className="font-semibold text-sm text-gray-700">Subscriptions</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                    {subscribedUsers.length} users
                </p>
            </div>
            <ScrollArea className="flex-1">
                {subscribedUsers.map((user) => (
                    <button
                        key={user._id}
                        onClick={() => onSelectUser(user)}
                        className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left ${selectedUserId === user._id ? 'bg-gray-100' : ''
                            }`}
                    >
                        {/* Avatar with online indicator */}
                        <div className="relative">
                            <Avatar className="h-9 w-9">
                                <AvatarFallback className="text-xs bg-gray-200">
                                    {user.avatar}
                                </AvatarFallback>
                            </Avatar>
                            {/* Green dot — only shown if user is online */}
                            {user.isOnline && (
                                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {user.name}
                            </p>
                            <p className="text-xs text-gray-400">
                                {user.isOnline ? 'Online' : 'Offline'}
                            </p>
                        </div>
                    </button>
                ))}
            </ScrollArea>
        </aside>
    );
}