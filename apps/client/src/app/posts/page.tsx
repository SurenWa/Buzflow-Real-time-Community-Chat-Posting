'use client';

import { useState } from 'react';
import Header from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    mockPosts,
    currentUser,
    getUserById,
    type MockPost,
} from '@/lib/mock-data';
import ProtectedRoute from '@/components/auth/protected-route';

export default function PostsPage() {
    const [posts, setPosts] = useState<MockPost[]>(mockPosts);
    const [content, setContent] = useState('');

    const handleCreatePost = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        const newPost: MockPost = {
            _id: `p${Date.now()}`,
            authorId: currentUser._id,
            content: content.trim(),
            createdAt: new Date().toISOString(),
        };

        setPosts((prev) => [newPost, ...prev]);
        setContent('');
    };

    return (
        <ProtectedRoute>
            <div className="h-screen flex flex-col">
                <Header />
                <ScrollArea className="flex-1">
                    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
                        <Card>
                            <CardContent className="pt-6">
                                <form onSubmit={handleCreatePost} className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-9 w-9 mt-1">
                                            <AvatarFallback className="text-xs bg-gray-200">
                                                {currentUser.avatar}
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
                                        <Button type="submit" size="sm" disabled={!content.trim()}>
                                            Post
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        {posts.map((post) => {
                            const author = getUserById(post.authorId);
                            return (
                                <Card key={post._id}>
                                    <CardContent className="pt-6">
                                        <div className="flex items-start gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarFallback className="text-xs bg-gray-200">
                                                    {author?.avatar ?? '??'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-semibold">
                                                        {author?.name ?? 'Unknown'}
                                                    </p>
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
                        })}
                    </div>
                </ScrollArea>
            </div>
        </ProtectedRoute>
    );
}