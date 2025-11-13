'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiMapPin, FiLink, FiCalendar, FiUserPlus, FiUserCheck } from 'react-icons/fi';
import { fetchJSON } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

interface User {
  uid: string;
  username: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  verified?: boolean;
  followers?: string[];
  following?: string[];
  createdAt: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  authorUsername?: string;
  date: string;
  likes: number;
  comments: number;
  tags: string[];
  featuredImage?: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const username = params.username as string;

  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch user data
        const userData = await fetchJSON<{ user: User }>(`/api/users/${username}`);
        setUser(userData.user);

        // Check if current user is following this user
        if (currentUser && 'following' in currentUser && Array.isArray((currentUser as { following?: string[] }).following)) {
          setIsFollowing((currentUser as { following?: string[] }).following?.includes(userData.user.uid) || false);
        }

        // Fetch user's posts
        const postsData = await fetchJSON<{ posts: Post[] }>(`/api/posts?author=${userData.user.name}`);
        setPosts(postsData.posts || []);
      } catch (err: unknown) {
        console.error('Error loading user profile:', err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(String(err) || 'Failed to load user profile');
        }
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      loadUserProfile();
    }
  }, [username, currentUser]);

  const handleFollow = async () => {
    if (!currentUser) {
      router.push('/sign-in');
      return;
    }

    try {
      setFollowLoading(true);
      const data = await fetchJSON<{ following: boolean }>(`/api/users/follow/${username}`, {
        method: 'POST',
      });
      setIsFollowing(data.following);
    } catch (err: unknown) {
      console.error('Error following user:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">User Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The user @{username} doesn&apos;t exist.</p>
          <Link href="/" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = (currentUser as { uid?: string; username?: string })?.uid === user?.uid || 
                       (currentUser as { uid?: string; username?: string })?.username === username;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-24 h-24 rounded-full border-4 border-indigo-500"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-white dark:border-gray-800">
                  {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {user.name}
                </h1>
                {user.verified && (
                  <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-3">@{user.username}</p>

              {user.bio && (
                <p className="text-gray-700 dark:text-gray-300 mb-3">{user.bio}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                {user.location && (
                  <div className="flex items-center gap-1">
                    <FiMapPin className="w-4 h-4" />
                    <span>{user.location}</span>
                  </div>
                )}
                {user.website && (
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <FiLink className="w-4 h-4" />
                    <span>{user.website}</span>
                  </a>
                )}
                <div className="flex items-center gap-1">
                  <FiCalendar className="w-4 h-4" />
                  <span>Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
              </div>

              <div className="flex items-center gap-6 mb-4">
                <div>
                  <span className="font-bold text-gray-900 dark:text-gray-100">{user.following?.length || 0}</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-1">Following</span>
                </div>
                <div>
                  <span className="font-bold text-gray-900 dark:text-gray-100">{user.followers?.length || 0}</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-1">Followers</span>
                </div>
              </div>

              {/* Follow Button */}
              {!isOwnProfile && currentUser && (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`flex items-center gap-2 px-6 py-2 rounded-full font-medium transition-all ${
                    isFollowing
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  } disabled:opacity-50`}
                >
                  {isFollowing ? <FiUserCheck className="w-4 h-4" /> : <FiUserPlus className="w-4 h-4" />}
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}

              {isOwnProfile && (
                <Link
                  href="/settings"
                  className="inline-block px-6 py-2 rounded-full font-medium bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                >
                  Edit Profile
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Posts ({posts.length})
        </h2>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No posts yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6"
              >
                <Link href={`/posts/${post.id}`}>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                    {post.title}
                  </h3>
                </Link>
                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {post.content.substring(0, 200)}...
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-4">
                    <span>{new Date(post.date).toLocaleDateString()}</span>
                    <span>❤️ {post.likes}</span>
                    <span>💬 {post.comments}</span>
                  </div>
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex gap-2">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded text-xs">
                          #{tag}
                        </span>
                      ))}
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
