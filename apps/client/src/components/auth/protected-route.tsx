'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { MessageSquare } from 'lucide-react';

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
            <div className="h-screen flex flex-col items-center justify-center bg-white">
                <div className="animate-fade-in-up text-center">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ background: 'hsl(220, 90%, 56%)' }}>
                        <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto" />
                </div>
            </div>
        );
    }

    if (!user) return null;

    return <>{children}</>;
}