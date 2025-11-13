'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { fetchJSON, fetchWithFallback } from '@/lib/api';
import { FiBookmark, FiCalendar, FiHeart, FiMessageCircle, FiTrash2 } from 'react-icons/fi';
import Link from 'next/link';

type Post = {
  id: string;
  title: string;
  content: string;
  author: string;
  authorUsername?: string;
  createdAt: string;
  likes: number;
  comments?: any[];
  tags?: string[];
  featuredImage?: string;
  bookmarkedBy?: string[];
};

export default function BookmarksPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/sign-in');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      loadBookmarks();
    }
  }, [user]);

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      const data = await fetchJSON<{ posts: Post[] }>('/api/bookmarks');
      setPosts(data.posts || []);
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (postId: string) => {
    try {
      setRemoving(postId);
      const res = await fetchWithFallback(`/api/posts/${postId}/bookmark`, {
        method: 'POST',
      });

      if (res.ok) {
        setPosts(posts.filter(p => p.id !== postId));
      } else {
        alert('Failed to remove bookmark');
      }
    } catch (err) {
      console.error('Remove bookmark error:', err);
      alert('Failed to remove bookmark');
    } finally {
      setRemoving(null);
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
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <FiBookmark className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bookmarks</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'} saved
          </p>
        </motion.div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-gray-500">Loading your bookmarks...</p>
          </div>
        ) : posts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <FiBookmark className="w-20 h-20 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No bookmarks yet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Save posts to read later by clicking the bookmark button
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition font-medium"
            >
              Explore Posts
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {posts.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all p-6 relative group"
              >
                {/* Remove bookmark button */}
                <button
                  onClick={() => handleRemoveBookmark(post.id)}
                  disabled={removing === post.id}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  title="Remove bookmark"
                >
                  {removing === post.id ? (
                    <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FiTrash2 className="w-5 h-5" />
                  )}
                </button>

                <Link href={`/posts/${post.id}`}>
                  {/* Featured Image */}
                  {post.featuredImage && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition pr-10">
                    {post.title}
                  </h3>
                </Link>

                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {post.content.substring(0, 200)}...
                </p>

                {/* Author & Date */}
                <div className="flex items-center gap-3 mb-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium">
                    {post.authorUsername ? `@${post.authorUsername}` : post.author}
                  </span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <FiCalendar className="w-3.5 h-3.5" />
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                </div>

                {/* Stats & Tags */}
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-4">
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
                    <div className="flex gap-2 flex-wrap">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="px-2 py-1 text-gray-500 dark:text-gray-400 text-xs">
                          +{post.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
