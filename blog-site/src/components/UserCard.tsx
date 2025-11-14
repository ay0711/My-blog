'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUserPlus, FiUserCheck, FiUsers } from 'react-icons/fi';
import Link from 'next/link';
import { fetchJSON } from '@/lib/api';
import { toast } from 'react-toastify';

interface User {
  uid: string;
  username: string;
  name: string;
  avatar?: string;
  bio?: string;
  followers?: string[];
  following?: string[];
}

interface UserCardProps {
  user: User;
  onFollowChange?: () => void;
}

export default function UserCard({ user, onFollowChange }: UserCardProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    setLoading(true);
    try {
      const response = await fetchJSON<{ following: boolean }>(`/api/users/follow/${user.username}`, {
        method: 'POST',
      });
      
      setIsFollowing(response.following);
      toast.success(response.following ? `You're now following ${user.name}` : `Unfollowed ${user.name}`);
      
      if (onFollowChange) {
        onFollowChange();
      }
    } catch (error) {
      console.error('Follow error:', error);
      toast.error('Failed to update follow status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Link href={`/profile/${user.username}`} className="flex-shrink-0">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-indigo-100 dark:ring-indigo-900"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center ring-2 ring-indigo-100 dark:ring-indigo-900">
              <span className="text-white text-xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </Link>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${user.username}`} className="group">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {user.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              @{user.username}
            </p>
          </Link>

          {user.bio && (
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
              {user.bio}
            </p>
          )}

          {/* Stats */}
          <div className="mt-3 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <FiUsers className="w-4 h-4" />
              <span>{user.followers?.length || 0} followers</span>
            </div>
          </div>
        </div>

        {/* Follow Button */}
        <button
          onClick={handleFollow}
          disabled={loading}
          className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-colors ${
            isFollowing
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : isFollowing ? (
            <div className="flex items-center gap-2">
              <FiUserCheck className="w-4 h-4" />
              <span>Following</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <FiUserPlus className="w-4 h-4" />
              <span>Follow</span>
            </div>
          )}
        </button>
      </div>
    </motion.div>
  );
}
