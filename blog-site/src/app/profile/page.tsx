'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { fetchJSON, fetchWithFallback } from '@/lib/api';
import { FiEdit2, FiTrash2, FiCalendar, FiHeart, FiMessageCircle } from 'react-icons/fi';
import Link from 'next/link';

type Post = {
    id: string;
    title: string;
    content: string;
    author: string;
    createdAt: string;
    likes: number;
    comments?: unknown[];
    tags?: string[];
    featuredImage?: string;
};

export default function ProfilePage() {
    const router = useRouter();
    const { user, loading: authLoading, isAuthenticated } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/sign-in');
        }
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        if (user) {
            loadUserPosts();
        }
    }, [user]);

    const loadUserPosts = async () => {
        try {
            setLoading(true);
            // Fetch posts by the current user's author name
            const data = await fetchJSON<{ posts: Post[] }>(`/api/posts?author=${encodeURIComponent(user!.name)}`);
            setPosts(data.posts || []);
        } catch (err) {
            console.error('Failed to load posts:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (postId: string) => {
        if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
            return;
        }

        try {
            setDeleting(postId);
            const res = await fetchWithFallback(`/api/posts/${postId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setPosts(posts.filter(p => p.id !== postId));
            } else {
                alert('Failed to delete post');
            }
        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to delete post');
        } finally {
            setDeleting(null);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Profile Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8"
                >
                    <div className="flex items-center gap-6">
                        {user.avatar ? (
                            <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-20 h-20 rounded-full border-4 border-indigo-200 dark:border-purple-500"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl border-4 border-indigo-200 dark:border-purple-500">
                                {user.name.substring(0, 2).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
                            <p className="text-gray-600 dark:text-gray-400">@{(user as { username?: string }).username || user.email.split('@')[0]}</p>
                            <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">{user.email}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                {posts.length} {posts.length === 1 ? 'post' : 'posts'} published
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Posts Section */}
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Posts</h2>
                    <Link
                        href="/create"
                        className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition font-medium"
                    >
                        Create New Post
                    </Link>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="text-gray-500">Loading your posts...</div>
                    </div>
                ) : posts.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center"
                    >
                        <div className="text-gray-400 text-lg mb-4">You haven&apos;t created any posts yet</div>
                        <Link
                            href="/create"
                            className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition font-medium"
                        >
                            Create Your First Post
                        </Link>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        {posts.map((post, index) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:shadow-xl transition"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <Link href={`/posts/${post.id}`}>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer mb-2">
                                                {post.title}
                                            </h3>
                                        </Link>

                                        <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                                            {post.content.substring(0, 200)}...
                                        </p>

                                        <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <FiCalendar className="w-4 h-4" />
                                                <span>{formatDate(post.createdAt)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <FiHeart className="w-4 h-4" />
                                                <span>{post.likes || 0}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <FiMessageCircle className="w-4 h-4" />
                                                <span>{post.comments?.length || 0}</span>
                                            </div>
                                        </div>

                                        {post.tags && post.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {post.tags.slice(0, 4).map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs"
                                                    >
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col gap-2">
                                        <Link
                                            href={`/posts/${post.id}/edit`}
                                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition flex items-center gap-2 text-sm font-medium"
                                        >
                                            <FiEdit2 className="w-4 h-4" />
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(post.id)}
                                            disabled={deleting === post.id}
                                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <FiTrash2 className="w-4 h-4" />
                                            {deleting === post.id ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
