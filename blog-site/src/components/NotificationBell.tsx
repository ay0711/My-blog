"use client";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell } from 'react-icons/fi';
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
        className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md"
      >
        <FiBell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: isMobile ? 8 : -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isMobile ? 8 : -8 }}
            className={isMobile
              ? 'fixed inset-0 top-16 z-50 flex flex-col bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700'
              : 'absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50'}
          >
            <div className={isMobile ? 'px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95' : 'flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700'}>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Notifications</h3>
              <div className="flex items-center gap-2">
                {isMobile && (
                  <button onClick={() => setIsOpen(false)} aria-label="Close notifications" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none p-2">✕</button>
                )}
              </div>
            </div>
            <div className={isMobile ? 'flex-1 overflow-y-auto overscroll-contain' : 'max-h-[600px] overflow-y-auto'}>
              {loading ? (
                <div className="flex items-center justify-center p-12"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
              ) : notifications.length === 0 ? (
                <div className="p-12 text-center text-gray-500 dark:text-gray-400"><FiBell className="w-16 h-16 mx-auto mb-4 opacity-30" /><p className="text-lg font-medium">No notifications yet</p><p className="text-sm mt-1">When someone interacts with your posts, you'll see it here.</p></div>
              ) : (
                <div>
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      className={`relative border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition cursor-pointer ${!n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'bg-white dark:bg-gray-900'}`}
                      onClick={() => {
                        if (!n.read) markAsRead(n.id);
                        setIsOpen(false);
                        window.location.href = n.postId ? `/posts/${n.postId}` : n.type === 'follow' ? `/user/${n.fromUsername}` : '#';
                      }}
                    >
                      <div className="p-3 flex gap-3">
                        <div className="flex-shrink-0 pt-1">
                          {n.fromUserAvatar ? (
                            <img src={n.fromUserAvatar} alt={n.fromUsername} className="w-10 h-10 rounded-full" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">{n.fromUsername.charAt(0).toUpperCase()}</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-[15px] leading-5 text-gray-900 dark:text-gray-100">{getNotificationText(n)}</p>
                              <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">{getTimeAgo(n.createdAt)}</p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(n.id);
                              }}
                              className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition"
                              aria-label="Delete notification"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M16 6v12a2 2 0 01-2 2H10a2 2 0 01-2-2V6m4 0V4m0 0h2m-2 0H10m8 2h2M4 6h2"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10v6m6-6v6"></path>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                      {!n.read && <div className="absolute top-4 right-3 w-2 h-2 bg-blue-500 rounded-full" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
