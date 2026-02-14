'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare } from 'lucide-react';

export default function SignInPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left panel — branding */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center"
                style={{ background: 'hsl(228, 20%, 12%)' }}>
                {/* Decorative circles */}
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, hsl(220, 90%, 56%) 0%, transparent 70%)' }} />
                <div className="absolute bottom-[-15%] right-[-5%] w-[600px] h-[600px] rounded-full opacity-8"
                    style={{ background: 'radial-gradient(circle, hsl(152, 69%, 53%) 0%, transparent 70%)' }} />

                <div className="relative z-10 text-center px-12 animate-fade-in-up">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-8"
                        style={{ background: 'hsl(220, 90%, 56%)' }}>
                        <MessageSquare className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tight mb-4">Buzzline</h1>
                    <p className="text-lg max-w-md mx-auto" style={{ color: 'hsl(220, 14%, 55%)' }}>
                        Real-time conversations, instant notifications, and a connected community — all in one place.
                    </p>
                    <div className="mt-12 flex items-center justify-center gap-8">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-white">50+</div>
                            <div className="text-sm" style={{ color: 'hsl(220, 14%, 50%)' }}>Users</div>
                        </div>
                        <div className="w-px h-10" style={{ background: 'hsl(228, 15%, 22%)' }} />
                        <div className="text-center">
                            <div className="text-2xl font-bold text-white">Real-time</div>
                            <div className="text-sm" style={{ color: 'hsl(220, 14%, 50%)' }}>Chat & Notifications</div>
                        </div>
                        <div className="w-px h-10" style={{ background: 'hsl(228, 15%, 22%)' }} />
                        <div className="text-center">
                            <div className="text-2xl font-bold text-white">WebSocket</div>
                            <div className="text-sm" style={{ color: 'hsl(220, 14%, 50%)' }}>Powered</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right panel — form */}
            <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
                <div className="w-full max-w-sm animate-fade-in-up">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl"
                            style={{ background: 'hsl(220, 90%, 56%)' }}>
                            <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-gray-900">Buzzline</span>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back</h2>
                        <p className="text-sm text-gray-500 mt-1.5">Sign in to continue to Buzzline</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl animate-fade-in">
                                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label htmlFor="email" className="text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="alice@test.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-11 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white transition-colors"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="password" className="text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-11 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white transition-colors"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 rounded-xl font-semibold text-sm transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25"
                            style={{ background: 'hsl(220, 90%, 56%)' }}
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Signing in...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </Button>

                        <p className="text-xs text-center text-gray-400 pt-2">
                            Test credentials: <span className="font-mono text-gray-500">alice@test.com</span> / <span className="font-mono text-gray-500">password123</span>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}