'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiBell, FiHeart, FiMessageCircle, FiRepeat, FiUserPlus, FiAtSign, FiSettings } from 'react-icons/fi';
import { fetchJSON } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'repost' | 'follow' | 'mention';
  fromUserId: string;
  fromUsername: string;
  fromUserAvatar?: string;
  postId?: string;
  postTitle?: string;
  commentText?: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (!user) {
      router.push('/sign-in');
      return;
    }
    loadNotifications();
  }, [user, router]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await fetchJSON<{ notifications: Notification[] }>('/api/notifications');
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetchJSON(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetchJSON('/api/notifications/read-all', {
        method: 'POST',
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <FiHeart className="w-5 h-5 text-red-500" />;
      case 'comment':
        return <FiMessageCircle className="w-5 h-5 text-blue-500" />;
      case 'repost':
        return <FiRepeat className="w-5 h-5 text-green-500" />;
      case 'follow':
        return <FiUserPlus className="w-5 h-5 text-purple-500" />;
      case 'mention':
        return <FiAtSign className="w-5 h-5 text-orange-500" />;
      default:
        return <FiBell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case 'like':
        return (
          <>
            <strong>{notification.fromUsername}</strong> liked your post{' '}
            {notification.postTitle && (
              <Link href={`/posts/${notification.postId}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                &ldquo;{notification.postTitle}&rdquo;
              </Link>
            )}
          </>
        );
      case 'comment':
        return (
          <>
            <strong>{notification.fromUsername}</strong> commented on your post{' '}
            {notification.postTitle && (
              <Link href={`/posts/${notification.postId}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                &ldquo;{notification.postTitle}&rdquo;
              </Link>
            )}
            {notification.commentText && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 italic">&ldquo;{notification.commentText}&rdquo;</p>
            )}
          </>
        );
      case 'repost':
        return (
          <>
            <strong>{notification.fromUsername}</strong> reposted your post{' '}
            {notification.postTitle && (
              <Link href={`/posts/${notification.postId}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                &ldquo;{notification.postTitle}&rdquo;
              </Link>
            )}
          </>
        );
      case 'follow':
        return (
          <>
            <strong>
              <Link href={`/user/${notification.fromUsername}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                {notification.fromUsername}
              </Link>
            </strong>{' '}
            started following you
          </>
        );
      case 'mention':
        return (
          <>
            <strong>{notification.fromUsername}</strong> mentioned you in a post{' '}
            {notification.postTitle && (
              <Link href={`/posts/${notification.postId}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                &ldquo;{notification.postTitle}&rdquo;
              </Link>
            )}
          </>
        );
      default:
        return <span>New notification from <strong>{notification.fromUsername}</strong></span>;
    }
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => !n.read);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <FiBell className="w-8 h-8" />
            Notifications
          </h1>
          <Link
            href="/settings"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            <FiSettings className="w-4 h-4" />
            Settings
          </Link>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Unread ({notifications.filter(n => !n.read).length})
          </button>
          {notifications.some(n => !n.read) && (
            <button
              onClick={markAllAsRead}
              className="ml-auto text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <FiBell className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              No notifications
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'unread' ? 'You&apos;re all caught up!' : 'You don&apos;t have any notifications yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => !notification.read && markAsRead(notification.id)}
                className={`p-4 rounded-lg transition-all cursor-pointer ${
                  notification.read
                    ? 'bg-white dark:bg-gray-800'
                    : 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-600'
                } hover:shadow-md`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Avatar */}
                  <Link href={`/user/${notification.fromUsername}`} className="flex-shrink-0">
                    {notification.fromUserAvatar ? (
                      <img
                        src={notification.fromUserAvatar}
                        alt={notification.fromUsername}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {notification.fromUsername.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Link>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {getNotificationText(notification)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(notification.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* Unread Indicator */}
                  {!notification.read && (
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
