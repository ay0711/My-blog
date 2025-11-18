"use client";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiTrash2, FiX } from 'react-icons/fi';
import { fetchJSON } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

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

  // Keep user ref in sync
  useEffect(() => { userRef.current = user; }, [user]);

  // Poll notifications when authenticated
  useEffect(() => {
    if (authLoading) return;
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
    setNotifications([]);
    setUnreadCount(0);
  }, [user, authLoading]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Lock scroll when mobile panel is open
  useEffect(() => {
    if (isOpen && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    if (!userRef.current) return;
    try {
      setLoading(true);
      const data = await fetchJSON<{ notifications: Notification[]; unreadCount: number }>('/api/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      if (err instanceof Error && err.message.includes('401')) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    if (!user) return;
    try {
      await fetchJSON(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) { console.error('Failed to mark as read:', e); }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await fetchJSON('/api/notifications/read-all', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) { console.error('Failed to mark all as read:', e); }
  };

  const clearAll = async () => {
    if (!user) return;
    try {
      await fetchJSON('/api/notifications', { method: 'DELETE' });
      setNotifications([]);
      setUnreadCount(0);
      setIsOpen(false);
    } catch (e) { console.error('Failed to clear all:', e); }
  };

  const deleteNotification = async (id: string) => {
    if (!user) return;
    try {
      await fetchJSON(`/api/notifications/${id}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n.id !== id));
      const wasUnread = notifications.find(n => n.id === id)?.read === false;
      if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) { console.error('Failed to delete notification:', e); }
  };

  const getNotificationText = (n: Notification) => {
    switch (n.type) {
      case 'like':
        return (
          <>
            <span className="font-bold text-gray-900 dark:text-white">@{n.fromUsername}</span>
            {' liked your post'}
            {n.postTitle && <span className="block text-gray-600 dark:text-gray-400 text-sm mt-0.5 line-clamp-1">&ldquo;{n.postTitle}&rdquo;</span>}
          </>
        );
      case 'comment':
        return (
          <>
            <span className="font-bold text-gray-900 dark:text-white">@{n.fromUsername}</span>
            {' commented on your post'}
            {n.commentText && (
              <span className="block text-gray-600 dark:text-gray-400 text-sm mt-0.5 line-clamp-2">
                &ldquo;{n.commentText.substring(0, 80)}{n.commentText.length > 80 ? '...' : ''}&rdquo;
              </span>
            )}
          </>
        );
      case 'mention':
        return (
          <>
            <span className="font-bold text-gray-900 dark:text-white">@{n.fromUsername}</span>
            {' mentioned you in a post'}
          </>
        );
      case 'follow':
        return (
          <>
            <span className="font-bold text-gray-900 dark:text-white">@{n.fromUsername}</span>
            {' started following you'}
          </>
        );
      case 'repost':
        return (
          <>
            <span className="font-bold text-gray-900 dark:text-white">@{n.fromUsername}</span>
            {' reposted your post'}
            {n.postTitle && <span className="block text-gray-600 dark:text-gray-400 text-sm mt-0.5 line-clamp-1">&ldquo;{n.postTitle}&rdquo;</span>}
          </>
        );
      default:
        return 'New notification';
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons = {
      like: '❤️',
      comment: '💬',
      mention: '📢',
      follow: '👤',
      repost: '🔄'
    };
    return icons[type as keyof typeof icons] || '🔔';
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleNotificationClick = (n: Notification) => {
    if (!n.read) markAsRead(n.id);
    setIsOpen(false);
    
    if (n.postId) {
      window.location.href = `/posts/${n.postId}`;
    } else if (n.type === 'follow') {
      window.location.href = `/user/${n.fromUsername}`;
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        className="relative p-2 lg:p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-all active:scale-95 group"
      >
        <FiBell className="w-6 h-6 lg:w-5 lg:h-5 transition-transform group-hover:scale-110" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 lg:top-0.5 lg:right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`
                fixed lg:absolute
                bottom-0 lg:bottom-auto
                left-0 right-0 lg:left-auto lg:right-0
                lg:top-full lg:mt-2
                lg:w-[420px] xl:w-[460px]
                max-h-[85vh] lg:max-h-[600px]
                bg-white dark:bg-gray-900
                lg:rounded-2xl rounded-t-3xl lg:rounded-b-2xl
                shadow-2xl border-t lg:border border-gray-200 dark:border-gray-800
                overflow-hidden
                z-[101]
              `}
            >
              {/* Header */}
              <div className="sticky top-0 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between px-4 lg:px-5 py-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notifications</h2>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors lg:hidden"
                    aria-label="Close"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>

                {/* Action Buttons */}
                {(unreadCount > 0 || notifications.length > 0) && (
                  <div className="flex items-center gap-3 px-4 lg:px-5 pb-3">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAll}
                        className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: 'calc(85vh - 140px)' }}>
                {loading ? (
                  // Skeleton Loading
                  <div className="p-4 space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex gap-3 animate-pulse">
                        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 flex-shrink-0" />
                        <div className="flex-1 space-y-2.5 py-1">
                          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  // Empty State
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950/50 dark:to-purple-950/50 flex items-center justify-center mb-4">
                      <FiBell className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No notifications yet
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                      When someone interacts with your posts, you&apos;ll see it here
                    </p>
                  </div>
                ) : (
                  // Notifications List
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`
                          relative flex gap-3 p-4 cursor-pointer transition-colors group
                          ${!n.read 
                            ? 'bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/30' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          }
                        `}
                      >
                        {/* Unread Indicator */}
                        {!n.read && (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-500" />
                        )}

                        {/* Avatar */}
                        <div className="relative flex-shrink-0 ml-3">
                          {n.fromUserAvatar ? (
                            <img
                              src={n.fromUserAvatar}
                              alt={n.fromUsername}
                              className="w-12 h-12 rounded-full object-cover ring-2 ring-white dark:ring-gray-900"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg ring-2 ring-white dark:ring-gray-900">
                              {n.fromUsername.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {/* Type Icon Badge */}
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center shadow-sm ring-2 ring-white dark:ring-gray-900">
                            <span className="text-xs">{getNotificationIcon(n.type)}</span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-1">
                            {getNotificationText(n)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            {getTimeAgo(n.createdAt)}
                          </div>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(n.id);
                          }}
                          className="flex-shrink-0 p-2 opacity-0 group-hover:opacity-100 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all"
                          aria-label="Delete notification"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
