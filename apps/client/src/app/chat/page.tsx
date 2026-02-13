'use client';

import { useState } from 'react';
import Header from '@/components/layout/header';
import ChatSidebar from '@/components/chat/chat-sidebar';
import ChatArea from '@/components/chat/chat-area';
import ProtectedRoute from '@/components/auth/protected-route';
import type { SubscribedUser } from '@/components/chat/chat-sidebar';

export default function ChatPage() {
    const [selectedUser, setSelectedUser] = useState<SubscribedUser | null>(null);

    return (
        <ProtectedRoute>
            <div className="h-screen flex flex-col">
                <Header />
                <div className="flex-1 flex overflow-hidden">
                    <ChatSidebar
                        selectedUserId={selectedUser?._id ?? null}
                        onSelectUser={setSelectedUser}
                    />
                    <ChatArea selectedUser={selectedUser} />
                </div>
            </div>
        </ProtectedRoute>
    );
}