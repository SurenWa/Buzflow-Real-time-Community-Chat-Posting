'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/signin');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <p className="text-gray-400">Loading...</p>
            </div>
        );
    }

    if (!user) return null;

    return <>{children}</>;
}