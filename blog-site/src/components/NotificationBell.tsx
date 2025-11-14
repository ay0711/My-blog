"use client";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiTrash2 } from 'react-icons/fi';
import Link from 'next/link';
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
  const [isMobile, setIsMobile] = useState(false);

  // Track viewport width
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      case 'like': return (<><span className="font-semibold">@{n.fromUsername}</span> liked your post {n.postTitle && <span className="italic">&ldquo;{n.postTitle}&rdquo;</span>}</>);
      case 'comment': return (<><span className="font-semibold">@{n.fromUsername}</span> commented on your post {n.commentText && <span className="text-gray-600 dark:text-gray-400 block text-sm mt-1">&ldquo;{n.commentText.substring(0,50)}{n.commentText.length>50?'...':''}&rdquo;</span>}</>);
      case 'mention': return (<><span className="font-semibold">@{n.fromUsername}</span> mentioned you in a post</>);
      case 'follow': return (<><span className="font-semibold">@{n.fromUsername}</span> started following you</>);
      case 'repost': return (<><span className="font-semibold">@{n.fromUsername}</span> reposted your post {n.postTitle && <span className="italic">&ldquo;{n.postTitle}&rdquo;</span>}</>);
      default: return 'New notification';
    }
  };

  const getNotificationIcon = (t: string) => ({ like:'❤️', comment:'💬', mention:'📢', follow:'👤', repost:'🔄' }[t] || '🔔');
  const getTimeAgo = (d: string) => {
    const date = new Date(d); const secs = Math.floor((Date.now() - date.getTime())/1000);
    if (secs<60) return 'just now'; if (secs<3600) return `${Math.floor(secs/60)}m ago`; if (secs<86400) return `${Math.floor(secs/3600)}h ago`; if (secs<604800) return `${Math.floor(secs/86400)}d ago`; return date.toLocaleDateString();
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Notifications"
        onClick={() => setIsOpen(o => !o)}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
      >
        <FiBell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center text-[11px] font-bold text-white bg-indigo-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <>
            {isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-black/50 z-[60] lg:hidden"
              />
            )}
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={
                isMobile
                  ? 'fixed inset-x-0 top-14 bottom-16 mx-auto max-w-lg z-[70] bg-white dark:bg-gray-900 shadow-2xl overflow-hidden lg:hidden'
                  : 'absolute right-0 top-full mt-2 w-[400px] max-h-[600px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden'
              }
            >
              {/* Header */}
              <div className="sticky top-0 z-10 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Notifications</h2>
                  {isMobile && (
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                      aria-label="Close"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                {(unreadCount > 0 || notifications.length > 0) && (
                  <div className="flex gap-3 mt-3 text-sm">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAll}
                        className="text-gray-600 dark:text-gray-400 hover:underline"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="overflow-y-auto" style={{ maxHeight: isMobile ? 'calc(100vh - 14rem - 4rem)' : '550px' }}>
                {loading ? (
                  <div className="p-4 space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex gap-3 animate-pulse">
                        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                      <FiBell className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">No notifications yet</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">When you get notifications, they&apos;ll show up here</p>
                  </div>
                ) : (
                  <div>
                    {notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => {
                          if (!n.read) markAsRead(n.id);
                          setIsOpen(false);
                          window.location.href = n.postId ? `/posts/${n.postId}` : n.type === 'follow' ? `/user/${n.fromUsername}` : '#';
                        }}
                        className={`
                          relative flex gap-3 p-4 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0
                          ${!n.read ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}
                        `}
                      >
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          {n.fromUserAvatar ? (
                            <img src={n.fromUserAvatar} alt={n.fromUsername} className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                              {n.fromUsername.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center">
                            <span className="text-sm">{getNotificationIcon(n.type)}</span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-900 dark:text-gray-100 leading-snug mb-1">
                            {getNotificationText(n)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {getTimeAgo(n.createdAt)}
                          </div>
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(n.id);
                          }}
                          className="flex-shrink-0 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 transition-colors"
                          aria-label="Delete notification"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>

                        {/* Unread indicator */}
                        {!n.read && (
                          <div className="absolute top-1/2 -translate-y-1/2 left-2 w-2 h-2 rounded-full bg-indigo-600" />
                        )}
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
