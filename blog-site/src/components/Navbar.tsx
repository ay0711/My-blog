"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { FiHome, FiPlusCircle, FiFileText, FiBookmark, FiTrendingUp, FiUser } from 'react-icons/fi';
import DarkModeToggle from './DarkModeToggle';
import AuthMenu from './auth/AuthMenu';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [mobileMenuOpen]);

  const NavLink = ({ 
    href, 
    icon: Icon, 
    children, 
    mobile 
  }: { 
    href: string; 
    icon: React.ComponentType<{ className?: string }>; 
    children: React.ReactNode;
    mobile?: boolean;
  }) => {
    const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
    
    if (mobile) {
      return (
        <Link 
          href={href}
          className={`
            flex items-center gap-4 px-5 py-4 rounded-2xl transition-all
            ${isActive 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }
          `}
        >
          <Icon className="w-6 h-6" />
          <span className="text-lg font-semibold">{children}</span>
        </Link>
      );
    }

    return (
      <Link 
        href={href}
        className={`
          group flex items-center gap-4 px-5 py-3 rounded-full transition-all
          ${isActive 
            ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold' 
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }
        `}
        title={children as string}
      >
        <Icon className={`w-6 h-6 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400'} transition-colors`} />
        <span className="xl:inline hidden text-[17px]">{children}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-[88px] xl:w-[275px] border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-50">
        <div className="flex flex-col h-full w-full py-4">
          {/* Logo */}
          <Link href="/" className="px-5 xl:px-6 py-3 mb-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent xl:block hidden">
              ModernBlog
            </h1>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl xl:hidden shadow-lg">
              M
            </div>
          </Link>
          
          {/* Navigation Links */}
          <nav className="flex flex-col gap-2 flex-1 px-3">
            <NavLink href="/" icon={FiHome}>Home</NavLink>
            <NavLink href="/explore" icon={FiTrendingUp}>Explore</NavLink>
            <NavLink href="/news" icon={FiFileText}>News</NavLink>
            <NavLink href="/bookmarks" icon={FiBookmark}>Bookmarks</NavLink>
            <NavLink href="/create" icon={FiPlusCircle}>Create</NavLink>
          </nav>

          {/* Bottom Actions */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-4 px-3 space-y-4">
            <div className="flex items-center justify-center xl:justify-start gap-3 px-2">
              <NotificationBell />
              <div className="xl:block hidden">
                <DarkModeToggle />
              </div>
            </div>
            <AuthMenu />
          </div>
        </div>
      </aside>

      {/* Mobile Top Navbar */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 z-50 shadow-sm">
        <div className="flex items-center justify-between h-full px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
              M
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              ModernBlog
            </h1>
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <DarkModeToggle />
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 z-50 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-around h-full px-2 pb-safe">
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
    </>
  );
}
