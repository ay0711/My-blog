'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiMapPin, FiLink, FiCalendar, FiUserPlus, FiUserCheck } from 'react-icons/fi';
import { fetchJSON } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import ErrorState from '@/components/ErrorState';
import LoadingSpinner from '@/components/LoadingSpinner';
import Toast from '@/components/Toast';
import { AnimatePresence } from 'framer-motion';

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
  const [activeTab, setActiveTab] = useState<'posts' | 'followers' | 'following'>('posts');
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [tabLoading, setTabLoading] = useState(false);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [followingLoading, setFollowingLoading] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

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
          // Set the list of users the current user is following
          setFollowingUsers(new Set((currentUser as { following?: string[] }).following || []));
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

  const handleFollow = async (e?: React.MouseEvent) => {
    // Prevent any default behavior or form submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
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
      
      // Show success toast
      setToast({
        message: data.following ? `You are now following ${user?.name}` : `You unfollowed ${user?.name}`,
        type: 'success'
      });
      
      // Reload user data to update follower count
      const userData = await fetchJSON<{ user: User }>(`/api/users/${username}`);
      setUser(userData.user);
    } catch (err: unknown) {
      console.error('Error following user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to follow user';
      
      setToast({
        message: errorMessage.includes('waking up') || errorMessage.includes('taking too long')
          ? 'Server is waking up. Please try again in 30-60 seconds.'
          : 'Failed to follow user. Please check your connection and try again.',
        type: 'error'
      });
    } finally {
      setFollowLoading(false);
    }
  };

  const handleFollowUser = async (targetUsername: string, targetUid: string) => {
    if (!currentUser) {
      router.push('/sign-in');
      return;
    }

    try {
      setFollowingLoading(prev => new Set(prev).add(targetUid));
      const data = await fetchJSON<{ following: boolean }>(`/api/users/follow/${targetUsername}`, {
        method: 'POST',
      });
      
      // Update the followingUsers set
      setFollowingUsers(prev => {
        const newSet = new Set(prev);
        if (data.following) {
          newSet.add(targetUid);
        } else {
          newSet.delete(targetUid);
        }
        return newSet;
      });

      // Show success toast
      setToast({
        message: data.following ? `Following @${targetUsername}` : `Unfollowed @${targetUsername}`,
        type: 'success'
      });

      // Reload current user data to update their following list
      if (currentUser && 'uid' in currentUser) {
        const updatedCurrentUser = await fetchJSON<{ user: User }>(`/api/auth/me`);
        if (updatedCurrentUser.user) {
          setFollowingUsers(new Set(updatedCurrentUser.user.following || []));
        }
      }
    } catch (err: unknown) {
      console.error('Error following user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to follow user';
      
      setToast({
        message: errorMessage.includes('waking up') || errorMessage.includes('taking too long')
          ? 'Server is waking up. Please try again in 30-60 seconds.'
          : 'Failed to follow user. Please check your connection and try again.',
        type: 'error'
      });
    } finally {
      setFollowingLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(targetUid);
        return newSet;
      });
    }
  };

  const loadFollowers = async () => {
    if (followers.length > 0) return; // Already loaded
    try {
      setTabLoading(true);
      const data = await fetchJSON<{ followers: User[] }>(`/api/users/${username}/followers`);
      setFollowers(data.followers || []);
    } catch (err) {
      console.error('Error loading followers:', err);
    } finally {
      setTabLoading(false);
    }
  };

  const loadFollowing = async () => {
    if (following.length > 0) return; // Already loaded
    try {
      setTabLoading(true);
      const data = await fetchJSON<{ following: User[] }>(`/api/users/${username}/following`);
      setFollowing(data.following || []);
    } catch (err) {
      console.error('Error loading following:', err);
    } finally {
      setTabLoading(false);
    }
  };

  const handleTabChange = (tab: 'posts' | 'followers' | 'following') => {
    setActiveTab(tab);
    if (tab === 'followers' && followers.length === 0) {
      loadFollowers();
    } else if (tab === 'following' && following.length === 0) {
      loadFollowing();
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading user profile..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <ErrorState 
            title="Failed to Load Profile"
            message={error}
            onRetry={() => window.location.reload()}
            type={error.includes('waking') || error.includes('timeout') ? 'timeout' : 'network'}
          />
        </div>
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
                <button
                  onClick={() => handleTabChange('following')}
                  className="hover:underline cursor-pointer transition-colors"
                >
                  <span className="font-bold text-gray-900 dark:text-gray-100">{user.following?.length || 0}</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-1">Following</span>
                </button>
                <button
                  onClick={() => handleTabChange('followers')}
                  className="hover:underline cursor-pointer transition-colors"
                >
                  <span className="font-bold text-gray-900 dark:text-gray-100">{user.followers?.length || 0}</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-1">Followers</span>
                </button>
              </div>

              {/* Follow Button */}
              {!isOwnProfile && currentUser && (
                <button
                  type="button"
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

      {/* Tabs and Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            onClick={() => handleTabChange('posts')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'posts'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Posts ({posts.length})
          </button>
          <button
            onClick={() => handleTabChange('followers')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'followers'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Followers ({user?.followers?.length || 0})
          </button>
          <button
            onClick={() => handleTabChange('following')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'following'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Following ({user?.following?.length || 0})
          </button>
        </div>

        {/* Tab Content */}
        {tabLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <>
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
              </>
            )}

            {/* Followers Tab */}
            {activeTab === 'followers' && (
              <>
                {followers.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600 dark:text-gray-400">No followers yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {followers.map((follower) => (
                      <motion.div
                        key={follower.uid}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6"
                      >
                        <div className="flex items-center gap-4">
                          <Link href={`/user/${follower.username}`}>
                            {follower.avatar ? (
                              <img src={follower.avatar} alt={follower.name} className="w-12 h-12 rounded-full" />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                {follower.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </Link>
                          <div className="flex-1">
                            <Link href={`/user/${follower.username}`} className="font-bold text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400">
                              {follower.name}
                            </Link>
                            <p className="text-sm text-gray-600 dark:text-gray-400">@{follower.username}</p>
                            {follower.bio && <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{follower.bio}</p>}
                          </div>
                          {currentUser && follower.uid !== (currentUser as { uid?: string }).uid && (
                            <button
                              onClick={() => handleFollowUser(follower.username, follower.uid)}
                              disabled={followingLoading.has(follower.uid)}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                followingUsers.has(follower.uid)
                                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
                                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
                              } disabled:opacity-50`}
                            >
                              {followingLoading.has(follower.uid) ? 'Loading...' : followingUsers.has(follower.uid) ? 'Following' : 'Follow'}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Following Tab */}
            {activeTab === 'following' && (
              <>
                {following.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600 dark:text-gray-400">Not following anyone yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {following.map((followedUser) => (
                      <motion.div
                        key={followedUser.uid}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6"
                      >
                        <div className="flex items-center gap-4">
                          <Link href={`/user/${followedUser.username}`}>
                            {followedUser.avatar ? (
                              <img src={followedUser.avatar} alt={followedUser.name} className="w-12 h-12 rounded-full" />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                {followedUser.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </Link>
                          <div className="flex-1">
                            <Link href={`/user/${followedUser.username}`} className="font-bold text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400">
                              {followedUser.name}
                            </Link>
                            <p className="text-sm text-gray-600 dark:text-gray-400">@{followedUser.username}</p>
                            {followedUser.bio && <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{followedUser.bio}</p>}
                          </div>
                          {currentUser && followedUser.uid !== (currentUser as { uid?: string }).uid && (
                            <button
                              onClick={() => handleFollowUser(followedUser.username, followedUser.uid)}
                              disabled={followingLoading.has(followedUser.uid)}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                followingUsers.has(followedUser.uid)
                                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
                                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
                              } disabled:opacity-50`}
                            >
                              {followingLoading.has(followedUser.uid) ? 'Loading...' : followingUsers.has(followedUser.uid) ? 'Unfollow' : 'Follow'}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
