'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, LogOut, MessageSquare, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { useAuth } from '@/context/auth-context';
import { useSocket } from '@/context/socket-context';
import { api } from '@/lib/api';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NotificationFromUser = {
    _id: string;
    name: string;
};

type Notification = {
    _id: string;
    fromUserId: NotificationFromUser | string;
    type: string;
    message: string;
    read: boolean;
    createdAt: string;
};

function getInitials(name: string): string {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function timeAgo(dateStr: string): string {
    const now = Date.now();
    const date = new Date(dateStr).getTime();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

export default function Header() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const { socket } = useSocket();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        try {
            const [notifs, countData] = await Promise.all([
                api<Notification[]>('/notifications'),
                api<{ count: number }>('/notifications/unread-count'),
            ]);
            setNotifications(notifs);
            setUnreadCount(countData.count);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        if (user) fetchNotifications();
    }, [user, fetchNotifications]);

    useEffect(() => {
        if (!socket || !user) return;

        const handleNewNotification = (notification: Notification) => {
            setNotifications((prev) => [notification, ...prev]);
            setUnreadCount((prev) => prev + 1);
        };

        socket.on('newNotification', handleNewNotification);
        return () => { socket.off('newNotification', handleNewNotification); };
    }, [socket, user]);

    const markAllRead = async () => {
        try {
            await api('/notifications/read-all', { method: 'PATCH' });
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch { /* ignore */ }
    };

    const navItems = [
        { href: '/chat', label: 'Chat', icon: MessageSquare },
        { href: '/posts', label: 'Posts', icon: FileText },
    ];

    return (
        <header className="h-14 border-b bg-white/80 backdrop-blur-md px-4 flex items-center justify-between shrink-0 sticky top-0 z-50">
            {/* Left: Logo + Nav */}
            <div className="flex items-center gap-6">
                <Link href="/chat" className="flex items-center gap-2.5 group">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
                        style={{ background: 'hsl(220, 90%, 56%)' }}>
                        <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-lg font-bold text-gray-900 tracking-tight hidden sm:block">Buzzline</span>
                </Link>

                <nav className="flex items-center gap-0.5 ml-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link key={item.href} href={item.href}>
                                <button
                                    className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive
                                            ? 'text-blue-600 bg-blue-50'
                                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                        }
                  `}
                                >
                                    <Icon className="w-4 h-4" />
                                    {item.label}
                                </button>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Right: Notifications + User + Logout */}
            <div className="flex items-center gap-1.5">
                {/* Bell */}
                <Popover>
                    <PopoverTrigger asChild>
                        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200">
                            <Bell className="w-[18px] h-[18px]" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1 animate-fade-in"
                                    style={{ background: 'hsl(0, 84%, 60%)' }}>
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[360px] p-0 rounded-xl shadow-xl border border-gray-100" align="end" sideOffset={8}>
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                            <h3 className="font-semibold text-sm text-gray-900">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                                    onClick={markAllRead}
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>
                        <div className="max-h-[380px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="py-12 text-center">
                                    <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-400">No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map((n, i) => (
                                    <div
                                        key={n._id}
                                        className={`
                      flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 transition-colors
                      ${n.read ? 'bg-white' : 'bg-blue-50/60'}
                      animate-fade-in
                    `}
                                        style={{ animationDelay: `${i * 30}ms` }}
                                    >
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold text-white mt-0.5"
                                            style={{ background: 'hsl(220, 90%, 56%)' }}>
                                            {typeof n.fromUserId === 'object' ? getInitials(n.fromUserId.name) : '??'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-800 leading-snug">{n.message}</p>
                                            <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                                        </div>
                                        {!n.read && (
                                            <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ background: 'hsl(220, 90%, 56%)' }} />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </PopoverContent>
                </Popover>

                {/* User pill */}
                {user && (
                    <div className="flex items-center gap-2 pl-2 ml-1 border-l border-gray-100">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                            style={{ background: 'hsl(220, 90%, 56%)' }}>
                            {getInitials(user.name)}
                        </div>
                        <span className="text-sm font-medium text-gray-700 hidden md:block max-w-[120px] truncate">
                            {user.name}
                        </span>
                    </div>
                )}

                {/* Logout */}
                <button
                    onClick={logout}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                    title="Sign out"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </div>
        </header>
    );
}