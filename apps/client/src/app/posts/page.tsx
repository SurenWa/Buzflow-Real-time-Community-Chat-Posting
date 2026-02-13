'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
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
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
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
            } catch {
                // ignore
            } finally {
                setLoading(false);
            }
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

            // Add to top of feed with user info
            const postWithAuthor: Post = {
                ...newPost,
                authorId: { _id: user._id, name: user.name, email: user.email },
            };
            setPosts((prev) => [postWithAuthor, ...prev]);
            setContent('');
        } catch {
            // ignore
        } finally {
            setPosting(false);
        }
    };

    const getAuthorInfo = (authorId: PostAuthor | string) => {
        if (typeof authorId === 'object' && authorId !== null) {
            return { name: authorId.name, initials: getInitials(authorId.name) };
        }
        return { name: 'Unknown', initials: '??' };
    };

    return (
        <ProtectedRoute>
            <div className="h-screen flex flex-col">
                <Header />
                <ScrollArea className="flex-1">
                    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
                        {/* Create Post */}
                        <Card>
                            <CardContent className="pt-6">
                                <form onSubmit={handleCreatePost} className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-9 w-9 mt-1">
                                            <AvatarFallback className="text-xs bg-gray-200">
                                                {user ? getInitials(user.name) : '??'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <textarea
                                            placeholder="What's on your mind?"
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            rows={3}
                                            className="flex-1 resize-none rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <Button type="submit" size="sm" disabled={!content.trim() || posting}>
                                            {posting ? 'Posting...' : 'Post'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Feed */}
                        {loading ? (
                            <p className="text-center text-gray-400 text-sm py-8">Loading posts...</p>
                        ) : posts.length === 0 ? (
                            <p className="text-center text-gray-400 text-sm py-8">No posts yet.</p>
                        ) : (
                            posts.map((post) => {
                                const author = getAuthorInfo(post.authorId);
                                return (
                                    <Card key={post._id}>
                                        <CardContent className="pt-6">
                                            <div className="flex items-start gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarFallback className="text-xs bg-gray-200">
                                                        {author.initials}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-semibold">{author.name}</p>
                                                        <span className="text-xs text-gray-400">
                                                            {new Date(post.createdAt).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-700 mt-1">{post.content}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>
            </div>
        </ProtectedRoute>
    );
}