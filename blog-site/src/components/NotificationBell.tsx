"use client";
import { useEffect, useState } from 'react';
import { FiBell } from 'react-icons/fi';
import Link from 'next/link';
import { fetchJSON } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function NotificationBell() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!user) { setUnread(0); return; }
      try {
        const data = await fetchJSON<{ unreadCount: number }>('/api/notifications/unread');
        if (active) setUnread(data.unreadCount || 0);
      } catch {
        if (active) setUnread(0);
      }
    };
    load();
    const id = setInterval(load, 30000);
    return () => { active = false; clearInterval(id); };
  }, [user]);

  if (!user) return null;

  return (
    <Link
      href="/notifications"
      aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
      className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors active:scale-95"
    >
      <FiBell className="w-6 h-6" />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  );
}
