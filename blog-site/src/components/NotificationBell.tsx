'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell } from 'react-icons/fi';
import { fetchJSON } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'mention' | 'follow' | 'repost';
  fromUserId: string;
  fromUsername: string;
  fromUserAvatar?: string;
  postId?: string;
  postTitle?: string;
  commentText?: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userRef = useRef(user);

  // Update the ref whenever user changes
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    // Don't do anything if auth is still loading
    if (authLoading) {
      return;
    }
    
    // Only load notifications when user is authenticated
    if (user) {
      loadNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
    
    // If user is not authenticated, clear notifications
    setNotifications([]);
    setUnreadCount(0);
  }, [user, authLoading]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    // Don't load notifications if user is not authenticated (check the ref for latest value)
    if (!userRef.current) {
      return;
    }
    
    try {
      setLoading(true);
      const data = await fetchJSON<{ notifications: Notification[]; unreadCount: number }>('/api/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      // Silently ignore 401 errors (user not authenticated)
      if (err instanceof Error && err.message.includes('401')) {
        // Clear notifications state when unauthorized
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    
    try {
      await fetchJSON(`/api/notifications/${notificationId}/read`, { method: 'POST' });
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      await fetchJSON('/api/notifications/read-all', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getNotificationText = (notif: Notification) => {
    switch (notif.type) {
      case 'like':
        return (
          <>
            <span className="font-semibold">@{notif.fromUsername}</span> liked your post{' '}
            {notif.postTitle && <span className="italic">"{notif.postTitle}"</span>}
          </>
        );
      case 'comment':
        return (
          <>
            <span className="font-semibold">@{notif.fromUsername}</span> commented on your post
            {notif.commentText && <span className="text-gray-600 dark:text-gray-400 block text-sm mt-1">"{notif.commentText.substring(0, 50)}{notif.commentText.length > 50 ? '...' : ''}"</span>}
          </>
        );
      case 'mention':
        return (
          <>
            <span className="font-semibold">@{notif.fromUsername}</span> mentioned you in a post
          </>
        );
      case 'follow':
        return (
          <>
            <span className="font-semibold">@{notif.fromUsername}</span> started following you
          </>
        );
      case 'repost':
        return (
          <>
            <span className="font-semibold">@{notif.fromUsername}</span> reposted your post{' '}
            {notif.postTitle && <span className="italic">"{notif.postTitle}"</span>}
          </>
        );
      default:
        return 'New notification';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like': return '❤️';
      case 'comment': return '💬';
      case 'mention': return '📢';
      case 'follow': return '👤';
      case 'repost': return '🔄';
      default: return '🔔';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition"
      >
        <FiBell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <FiBell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((notif) => (
                    <Link
                      key={notif.id}
                      href={notif.postId ? `/posts/${notif.postId}` : notif.type === 'follow' ? `/user/${notif.fromUsername}` : '#'}
                      onClick={() => {
                        if (!notif.read) markAsRead(notif.id);
                        setIsOpen(false);
                      }}
                      className={`block p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${
                        !notif.read ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar or Icon */}
                        <div className="flex-shrink-0">
                          {notif.fromUserAvatar ? (
                            <img
                              src={notif.fromUserAvatar}
                              alt={notif.fromUsername}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                              {notif.fromUsername.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                              {getNotificationText(notif)}
                            </div>
                            <span className="text-2xl flex-shrink-0">
                              {getNotificationIcon(notif.type)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {getTimeAgo(notif.createdAt)}
                          </p>
                        </div>

                        {/* Unread indicator */}
                        {!notif.read && (
                          <div className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <Link
                  href="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="block text-center text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  View all notifications
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
