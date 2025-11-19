"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiTrendingUp, FiPlusCircle, FiFileText, FiBookmark } from 'react-icons/fi';

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 z-50 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.4)]">
      <div className="flex items-center justify-around h-full px-2 pb-[env(safe-area-inset-bottom)]">
        <Link 
          href="/"
          className={`flex flex-col items-center justify-center gap-1.5 px-4 py-2 rounded-2xl transition-all min-w-[70px] ${
            pathname === '/' 
              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 scale-105' 
              : 'text-gray-600 dark:text-gray-400 active:scale-95'
          }`}
        >
          <FiHome className="w-6 h-6" />
          <span className="text-xs font-semibold">Home</span>
        </Link>
        <Link 
          href="/explore"
          className={`flex flex-col items-center justify-center gap-1.5 px-4 py-2 rounded-2xl transition-all min-w-[70px] ${
            pathname.startsWith('/explore') 
              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 scale-105' 
              : 'text-gray-600 dark:text-gray-400 active:scale-95'
          }`}
        >
          <FiTrendingUp className="w-6 h-6" />
          <span className="text-xs font-semibold">Explore</span>
        </Link>
        <Link 
          href="/create"
          aria-label="Create post"
          className="flex items-center justify-center w-16 h-16 -mt-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-500/40 active:scale-95 transition-transform"
        >
          <FiPlusCircle className="w-8 h-8" />
        </Link>
        <Link 
          href="/news"
          className={`flex flex-col items-center justify-center gap-1.5 px-4 py-2 rounded-2xl transition-all min-w-[70px] ${
            pathname.startsWith('/news') 
              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 scale-105' 
              : 'text-gray-600 dark:text-gray-400 active:scale-95'
          }`}
        >
          <FiFileText className="w-6 h-6" />
          <span className="text-xs font-semibold">News</span>
        </Link>
        <Link 
          href="/bookmarks"
          className={`flex flex-col items-center justify-center gap-1.5 px-4 py-2 rounded-2xl transition-all min-w-[70px] ${
            pathname.startsWith('/bookmarks') 
              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 scale-105' 
              : 'text-gray-600 dark:text-gray-400 active:scale-95'
          }`}
        >
          <FiBookmark className="w-6 h-6" />
          <span className="text-xs font-semibold">Saved</span>
        </Link>
      </div>
    </nav>
  );
}
