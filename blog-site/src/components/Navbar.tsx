'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { FiHome, FiPlusCircle, FiFileText, FiBookmark, FiTrendingUp } from 'react-icons/fi';
import DarkModeToggle from './DarkModeToggle';
import AuthMenu from './auth/AuthMenu';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = 'unset'; };
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const NavLink = ({ href, icon: Icon, children }: { href: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) => {
    const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
    return (
      <Link 
        href={href}
        className={`
          group flex items-center gap-4 px-4 py-3 rounded-full transition-all
          ${isActive 
            ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold' 
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }
        `}
      >
        <Icon className={`w-6 h-6 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`} />
        <span className="text-xl">{children}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Desktop Sidebar - Only visible on lg screens and up */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-[275px] border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-40">
        <div className="flex flex-col h-full w-full px-3 py-2">
          <Link href="/" className="px-4 py-4 mb-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              ModernBlog
            </h1>
          </Link>
          
          <nav className="flex flex-col gap-2 flex-1">
            <NavLink href="/" icon={FiHome}>Home</NavLink>
            <NavLink href="/explore" icon={FiTrendingUp}>Explore</NavLink>
            <NavLink href="/news" icon={FiFileText}>News</NavLink>
            <NavLink href="/bookmarks" icon={FiBookmark}>Bookmarks</NavLink>
            <NavLink href="/create" icon={FiPlusCircle}>Create</NavLink>
          </nav>

          <div className="border-t border-gray-200 dark:border-gray-800 pt-4 space-y-4 pb-4">
            <div className="flex items-center justify-between px-4">
              <NotificationBell />
              <DarkModeToggle />
            </div>
            <AuthMenu />
          </div>
        </div>
      </aside>

      {/* Mobile Top Navbar - Only visible below lg */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 z-50 shadow-sm">
        <div className="flex items-center justify-between h-full px-4">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            ModernBlog
          </Link>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <DarkModeToggle />
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar - Only visible below lg */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_-2px_10px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-around h-full px-3 pb-safe">
          <Link 
            href="/"
            className={`flex flex-col items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all min-w-[64px] ${
              pathname === '/' 
                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50' 
                : 'text-gray-600 dark:text-gray-400 active:bg-gray-100 dark:active:bg-gray-800'
            }`}
          >
            <FiHome className="w-6 h-6" />
            <span className="text-xs font-semibold">Home</span>
          </Link>
          
          <Link 
            href="/explore"
            className={`flex flex-col items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all min-w-[64px] ${
              pathname.startsWith('/explore') 
                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50' 
                : 'text-gray-600 dark:text-gray-400 active:bg-gray-100 dark:active:bg-gray-800'
            }`}
          >
            <FiTrendingUp className="w-6 h-6" />
            <span className="text-xs font-semibold">Explore</span>
          </Link>
          
          <Link 
            href="/create"
            className="flex items-center justify-center w-14 h-14 -mt-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 active:scale-95 transition-all"
          >
            <FiPlusCircle className="w-7 h-7" />
          </Link>
          
          <Link 
            href="/news"
            className={`flex flex-col items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all min-w-[64px] ${
              pathname.startsWith('/news') 
                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50' 
                : 'text-gray-600 dark:text-gray-400 active:bg-gray-100 dark:active:bg-gray-800'
            }`}
          >
            <FiFileText className="w-6 h-6" />
            <span className="text-xs font-semibold">News</span>
          </Link>
          
          <Link 
            href="/bookmarks"
            className={`flex flex-col items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all min-w-[64px] ${
              pathname.startsWith('/bookmarks') 
                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50' 
                : 'text-gray-600 dark:text-gray-400 active:bg-gray-100 dark:active:bg-gray-800'
            }`}
          >
            <FiBookmark className="w-6 h-6" />
            <span className="text-xs font-semibold">Saved</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
