'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { ImageIcon, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import ProtectedRoute from '@/components/auth/protected-route';

type PostAuthor = {
    _id: string;
    name: string;
    email: string;
};

type Post = {
    _id: string;
    authorId: PostAuthor | string;
    content: string;
    createdAt: string;
};

function getInitials(name: string): string {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string): string {
    const colors = [
        'hsl(220, 90%, 56%)', 'hsl(152, 69%, 45%)', 'hsl(280, 67%, 55%)',
        'hsl(350, 80%, 55%)', 'hsl(32, 90%, 55%)', 'hsl(190, 80%, 45%)',
        'hsl(330, 70%, 55%)', 'hsl(210, 70%, 50%)',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

function timeAgo(dateStr: string): string {
    const now = Date.now();
    const date = new Date(dateStr).getTime();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function PostsPage() {
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const data = await api<Post[]>('/posts/feed');
                setPosts(data);
            } catch { /* ignore */ }
            finally { setLoading(false); }
        };
        fetchPosts();
    }, []);

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || !user) return;
        setPosting(true);
        try {
            const newPost = await api<Post>('/posts', {
                method: 'POST',
                body: JSON.stringify({ content: content.trim() }),
            });
            const postWithAuthor: Post = {
                ...newPost,
                authorId: { _id: user._id, name: user.name, email: user.email },
            };
            setPosts((prev) => [postWithAuthor, ...prev]);
            setContent('');
        } catch { /* ignore */ }
        finally { setPosting(false); }
    };

    const getAuthorInfo = (authorId: PostAuthor | string) => {
        if (typeof authorId === 'object' && authorId !== null) {
            return { name: authorId.name, initials: getInitials(authorId.name) };
        }
        return { name: 'Unknown', initials: '??' };
    };

    return (
        <ProtectedRoute>
            <div className="h-screen flex flex-col bg-gray-50/50">
                <Header />
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-xl mx-auto py-6 px-4 space-y-4">
                        {/* Create Post */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in-up">
                            <form onSubmit={handleCreatePost}>
                                <div className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5"
                                            style={{ background: user ? getAvatarColor(user.name) : 'hsl(220, 14%, 80%)' }}>
                                            {user ? getInitials(user.name) : '??'}
                                        </div>
                                        <textarea
                                            placeholder="What's on your mind?"
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            rows={3}
                                            className="flex-1 resize-none text-sm text-gray-800 placeholder:text-gray-400 outline-none leading-relaxed bg-transparent"
                                        />
                                    </div>
                                </div>
                                <div className="px-4 py-3 border-t border-gray-50 flex items-center justify-end">
                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={!content.trim() || posting}
                                        className="rounded-xl px-5 font-semibold text-xs h-8 transition-all duration-200 hover:shadow-md hover:shadow-blue-500/20"
                                        style={{ background: 'hsl(220, 90%, 56%)' }}
                                    >
                                        {posting ? (
                                            <span className="flex items-center gap-1.5">
                                                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                Posting
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5">
                                                <Send className="w-3 h-3" />
                                                Post
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>

                        {/* Feed */}
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-9 h-9 rounded-full bg-gray-200" />
                                            <div className="space-y-1.5">
                                                <div className="h-3 w-28 rounded bg-gray-200" />
                                                <div className="h-2.5 w-16 rounded bg-gray-100" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="h-3 w-full rounded bg-gray-100" />
                                            <div className="h-3 w-3/4 rounded bg-gray-100" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : posts.length === 0 ? (
                            <div className="text-center py-16 animate-fade-in">
                                <p className="text-sm text-gray-400">No posts yet. Be the first to share something!</p>
                            </div>
                        ) : (
                            posts.map((post, i) => {
                                const author = getAuthorInfo(post.authorId);
                                return (
                                    <div
                                        key={post._id}
                                        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-shadow hover:shadow-md animate-fade-in-up"
                                        style={{ animationDelay: `${i * 50}ms` }}
                                    >
                                        <div className="p-5">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                                    style={{ background: getAvatarColor(author.name) }}>
                                                    {author.initials}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{author.name}</p>
                                                    <p className="text-xs text-gray-400">{timeAgo(post.createdAt)}</p>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-700 leading-relaxed">{post.content}</p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}