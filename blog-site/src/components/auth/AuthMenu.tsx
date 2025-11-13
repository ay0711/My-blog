"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchJSON } from '@/lib/api';

type User = {
  uid: string;
  email: string;
  name: string;
  avatar?: string;
  followingAuthors?: string[];
};

// Function to get user initials
const getInitials = (name: string, email: string): string => {
  if (name && name.trim()) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  if (email) {
    return email.substring(0, 2).toUpperCase();
  }
  return 'U';
};

// Function to generate a random avatar color based on user ID
const getAvatarColor = (uid: string): string => {
  const colors = [
    'from-indigo-500 to-purple-500',
    'from-pink-500 to-rose-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-amber-500',
    'from-violet-500 to-fuchsia-500',
    'from-teal-500 to-green-500',
    'from-red-500 to-pink-500',
  ];
  
  // Generate a consistent index based on UID
  const hash = uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

export default function AuthMenu({ mobile }: { mobile?: boolean }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    // Check backend auth
    const checkBackendAuth = async () => {
      try {
        const data = await fetchJSON<{ user: User | null }>('/api/auth/me');
        setUser(data.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkBackendAuth();
  }, []);

  const handleSignOut = async () => {
    try {
      // Sign out from backend
      await fetchJSON('/api/auth/logout', { method: 'POST' });
      setUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  if (loading) return <div className="text-sm text-gray-500">Loading...</div>;

  if (!user) {
    return (
      <Link
        href="/sign-in"
        className={`px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition text-sm font-medium ${mobile ? 'w-full text-center' : ''}`}
      >
        Sign In
      </Link>
    );
  }

  // Use backend avatar or initials
  const avatarUrl = user.avatar;
  const initials = getInitials(user.name || '', user.email || '');
  const avatarColor = getAvatarColor(user.uid);

  // For mobile view
  if (mobile) {
    return (
      <div className="flex flex-col gap-3 w-full pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={avatarUrl} 
              alt={user.name || user.email} 
              className="w-10 h-10 rounded-full border-2 border-indigo-200 dark:border-purple-500" 
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${avatarColor} flex items-center justify-center text-white font-bold text-sm border-2 border-indigo-200 dark:border-purple-500`}>
              {initials}
            </div>
          )}
          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">{user.name || 'User'}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
          </div>
        </div>
        <Link
          href="/profile"
          className="w-full px-4 py-2 text-sm bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition text-center font-medium"
        >
          My Profile
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          Sign Out
        </button>
      </div>
    );
  }

  // For desktop view with dropdown
  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 hover:opacity-80 transition"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={avatarUrl} 
            alt={user.name || user.email} 
            className="w-9 h-9 rounded-full border-2 border-indigo-200 dark:border-purple-500 hover:border-indigo-400 dark:hover:border-purple-400 transition" 
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className={`w-9 h-9 rounded-full bg-gradient-to-r ${avatarColor} flex items-center justify-center text-white font-bold text-sm border-2 border-indigo-200 dark:border-purple-500 hover:border-indigo-400 dark:hover:border-purple-400 transition shadow-md`}>
            {initials}
          </div>
        )}
      </button>

      {dropdownOpen && (
        <>
          {/* Backdrop to close dropdown */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setDropdownOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-20">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={avatarUrl} 
                    alt={user.name || user.email} 
                    className="w-12 h-12 rounded-full border-2 border-indigo-200 dark:border-purple-500" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${avatarColor} flex items-center justify-center text-white font-bold border-2 border-indigo-200 dark:border-purple-500`}>
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name || 'User'}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</div>
                </div>
              </div>
            </div>
            
            <div className="px-2 py-2">
              <Link
                href="/profile"
                onClick={() => setDropdownOpen(false)}
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition"
              >
                My Profile
              </Link>
              <button
                onClick={() => {
                  handleSignOut();
                  setDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
