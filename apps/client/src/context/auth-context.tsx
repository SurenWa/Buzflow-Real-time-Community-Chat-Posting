'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api, setAccessToken } from '@/lib/api';

type User = {
    _id: string;
    name: string;
    email: string;
};

type AuthContextType = {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const restoreSession = async () => {
            try {
                const data = await api<{ accessToken: string }>('/auth/refresh', {
                    method: 'POST',
                    skipAuth: true,
                });
                setAccessToken(data.accessToken);

                const me = await api<User>('/auth/me', { method: 'POST' });
                setUser(me);
            } catch {
                setAccessToken(null);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        restoreSession();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const data = await api<{ accessToken: string }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            skipAuth: true,
        });

        setAccessToken(data.accessToken);

        const me = await api<User>('/auth/me', { method: 'POST' });
        setUser(me);
        router.push('/chat');
    }, [router]);

    const logout = useCallback(async () => {
        try {
            await api('/auth/logout', { method: 'POST' });
        } catch {
            // ignore
        }
        setAccessToken(null);
        setUser(null);
        router.push('/signin');
    }, [router]);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}