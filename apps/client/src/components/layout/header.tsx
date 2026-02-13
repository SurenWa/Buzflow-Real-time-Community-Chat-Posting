'use client';

import { useState } from 'react';
import { Bell, LogOut, MessageSquare, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { mockNotifications, getUserById } from '@/lib/mock-data';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [notifications, setNotifications] = useState(mockNotifications);
    const unreadCount = notifications.filter((n) => !n.read).length;

    const markAllRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    return (
        <header className="h-14 border-b bg-white px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-6">
                <h1 className="text-lg font-bold text-gray-900">Buzzline</h1>
                <nav className="flex items-center gap-1">
                    <Link href="/chat">
                        <Button
                            variant={pathname === '/chat' ? 'default' : 'ghost'}
                            size="sm"
                            className="gap-2"
                        >
                            <MessageSquare className="h-4 w-4" />
                            Chat
                        </Button>
                    </Link>
                    <Link href="/posts">
                        <Button
                            variant={pathname === '/posts' ? 'default' : 'ghost'}
                            size="sm"
                            className="gap-2"
                        >
                            <FileText className="h-4 w-4" />
                            Posts
                        </Button>
                    </Link>
                </nav>
            </div>

            <div className="flex items-center gap-2">
                {/* User name */}
                {user && (
                    <span className="text-sm text-gray-600 mr-2">{user.name}</span>
                )}

                {/* Notification Bell */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                                    {unreadCount}
                                </Badge>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="end">
                        <div className="flex items-center justify-between p-3 border-b">
                            <h3 className="font-semibold text-sm">Notifications</h3>
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs h-auto p-1"
                                    onClick={markAllRead}
                                >
                                    Mark all read
                                </Button>
                            )}
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <p className="p-4 text-sm text-gray-500 text-center">
                                    No notifications
                                </p>
                            ) : (
                                notifications.map((n) => (
                                    <div
                                        key={n._id}
                                        className={`p-3 border-b last:border-0 text-sm ${n.read ? 'bg-white' : 'bg-blue-50'
                                            }`}
                                    >
                                        <p className="text-gray-900">{n.message}</p>
                                        <p className="text-gray-400 text-xs mt-1">
                                            {new Date(n.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Logout */}
                <Button variant="ghost" size="icon" onClick={logout}>
                    <LogOut className="h-5 w-5" />
                </Button>
            </div>
        </header>
    );
}