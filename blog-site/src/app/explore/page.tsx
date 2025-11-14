'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchJSON } from '@/lib/api';
import { FiTrendingUp, FiHash, FiUsers, FiStar } from 'react-icons/fi';
import Link from 'next/link';
import PostCard from '@/components/PostCard';
import UserCard from '@/components/UserCard';
import ErrorState from '@/components/ErrorState';
import LoadingSpinner from '@/components/LoadingSpinner';

type Post = {
  id: string;
  title: string;
  content: string;
  author: string;
  authorUsername?: string;
  createdAt: string;
  likes: number;
  comments: unknown[];
  tags?: string[];
  featuredImage?: string;
  repostCount?: number;
  bookmarkCount?: number;
};

type User = {
  uid: string;
  username: string;
  name: string;
  avatar?: string;
  bio?: string;
  followers?: string[];
  verified?: boolean;
};

export default function ExplorePage() {
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
  const [trendingTags, setTrendingTags] = useState<{ tag: string; count: number }[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'trending' | 'tags' | 'users'>('trending');
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    loadExploreData();
  }, []);

  const loadExploreData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all posts and calculate trending
      const postsData = await fetchJSON<{ posts: Post[] }>('/api/posts');
      const allPosts = postsData.posts || [];

      // Sort by engagement (likes + comments + reposts + bookmarks)
      const sortedPosts = allPosts
        .map(post => ({
          ...post,
          engagement: 
            (post.likes || 0) + 
            (post.comments?.length || 0) * 2 + 
            (post.repostCount || 0) * 3 + 
            (post.bookmarkCount || 0) * 2
        }))
        .sort((a, b) => b.engagement - a.engagement)
        .slice(0, 10);

      setPopularPosts(sortedPosts);

      // Calculate trending tags
      const tagCounts: { [key: string]: number } = {};
      allPosts.forEach(post => {
        post.tags?.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });

      const trending = Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setTrendingTags(trending);

      // Fetch suggested users
      try {
        const usersData = await fetchJSON<{ users: User[] }>('/api/users/suggested?limit=12');
        setSuggestedUsers(usersData.users || []);
      } catch (userErr) {
        console.error('Failed to load suggested users:', userErr);
        setSuggestedUsers([]);
      }

    } catch (err) {
      console.error('Failed to load explore data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load explore data');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    await loadExploreData();
    setRetrying(false);
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Discovering trending content..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <ErrorState 
            title="Failed to Load Explore Page"
            message={error}
            onRetry={handleRetry}
            retrying={retrying}
            type={error.includes('waking') || error.includes('timeout') ? 'timeout' : 'network'}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <FiTrendingUp className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Explore</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Discover trending posts, popular hashtags, and new people to follow
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('trending')}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === 'trending'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <FiStar className="w-4 h-4" />
              <span className="font-medium">Trending Posts</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('tags')}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === 'tags'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <FiHash className="w-4 h-4" />
              <span className="font-medium">Popular Tags</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <FiUsers className="w-4 h-4" />
              <span className="font-medium">Who to Follow</span>
            </div>
          </button>
        </div>

        {/* Content */}
        {activeTab === 'trending' && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {popularPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <PostCard post={post} />
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'tags' && (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {trendingTags.map((item, index) => (
              <motion.div
                key={item.tag}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={`/?tag=${encodeURIComponent(item.tag)}`}
                  className="block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-2xl">#</div>
                    <div className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-sm font-bold">
                      #{index + 1}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    #{item.tag}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.count} {item.count === 1 ? 'post' : 'posts'}
                  </p>
                </Link>
              </motion.div>
            ))}
            {trendingTags.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                <FiHash className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No trending tags yet. Be the first to add tags to your posts!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            {suggestedUsers.length > 0 ? (
              suggestedUsers.map((user, index) => (
                <motion.div
                  key={user.uid}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <UserCard user={user} onFollowChange={loadExploreData} />
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12">
                <FiUsers className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  No Suggestions Yet
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Users will appear here as more people join the platform!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
