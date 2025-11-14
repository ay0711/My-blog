"use client";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiTrash2, FiX } from 'react-icons/fi';
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
        <FiBell className="w-5 h-5 md:w-6 md:h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900">
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
              ? 'fixed inset-0 top-14 z-50 flex flex-col bg-white dark:bg-gray-900'
              : 'absolute right-0 mt-2 w-[95vw] max-w-[420px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50'}
          >
            <div className={isMobile ? 'px-4 py-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-0 z-10' : 'flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur sticky top-0'}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline focus:outline-none px-2 py-1">Mark all read</button>
                )}
                {notifications.length > 0 && (
                  <button onClick={clearAll} className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline focus:outline-none px-2 py-1">Clear</button>
                )}
                {isMobile && (
                  <button onClick={() => setIsOpen(false)} aria-label="Close" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none p-1.5 ml-1">
                    <FiX size={20} />
                  </button>
                )}
              </div>
            </div>
            <div className={isMobile ? 'flex-1 overflow-y-auto overscroll-contain pb-safe' : 'max-h-[70vh] overflow-y-auto'}>
              {loading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                  <FiBell className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="text-sm font-medium">No notifications yet</p>
                  <p className="text-xs mt-2 text-gray-400 dark:text-gray-500">Activity on your posts will appear here.</p>
                </div>
              ) : (
                <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map(n => (
                    <li
                      key={n.id}
                      role="listitem"
                      className={`group relative px-4 py-3.5 flex gap-3 transition ${!n.read ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-white dark:bg-gray-900'} hover:bg-gray-50 dark:hover:bg-gray-800/50 active:bg-gray-100 dark:active:bg-gray-800`}
                    >
                      <button
                        onClick={() => {
                          if (!n.read) markAsRead(n.id);
                          setIsOpen(false);
                          window.location.href = n.postId ? `/posts/${n.postId}` : n.type === 'follow' ? `/user/${n.fromUsername}` : '#';
                        }}
                        className="absolute inset-0"
                        aria-label="Open notification"
                      />
                      <div className="relative z-10 flex-shrink-0">
                        {n.fromUserAvatar ? (
                          <img src={n.fromUserAvatar} alt={n.fromUsername} className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-base">{n.fromUsername.charAt(0).toUpperCase()}</div>
                        )}
                        {!n.read && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-indigo-500 rounded-full ring-2 ring-white dark:ring-gray-900" />}
                      </div>
                      <div className="relative z-10 flex-1 min-w-0 flex flex-col">
                        <div className="text-sm leading-5 text-gray-800 dark:text-gray-100">
                          {getNotificationText(n)}
                        </div>
                        <div className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                          <span>{getTimeAgo(n.createdAt)}</span>
                          <span className="select-none">•</span>
                          <span className="text-xs">{getNotificationIcon(n.type)}</span>
                        </div>
                      </div>
                      <div className="relative z-10 flex-shrink-0 self-start">
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                          aria-label="Delete notification"
                          className="p-1.5 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
