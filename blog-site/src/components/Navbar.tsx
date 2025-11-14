'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHome, FiPlusCircle, FiFileText, FiMenu, FiX, FiBookmark, FiTrendingUp } from 'react-icons/fi';
import DarkModeToggle from './DarkModeToggle';
import AuthMenu from './auth/AuthMenu';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  const NavLinks = ({ onClick, mobile }: { onClick?: () => void; mobile?: boolean }) => (
    <>
      <Link href="/" ref={mobile ? firstLinkRef : undefined} className={`flex items-center gap-2 ${mobile ? 'py-3 text-lg' : ''} ${pathname === '/' ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-gray-900 dark:text-gray-100'} hover:text-indigo-600 dark:hover:text-indigo-400 transition`} onClick={onClick}>
        <FiHome /> <span>Home</span>
      </Link>
      <Link href="/explore" className={`flex items-center gap-2 ${mobile ? 'py-3 text-lg' : ''} ${pathname.startsWith('/explore') ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-gray-900 dark:text-gray-100'} hover:text-indigo-600 dark:hover:text-indigo-400 transition`} onClick={onClick}>
        <FiTrendingUp /> <span>Explore</span>
      </Link>
      <Link href="/create" className={`flex items-center gap-2 ${mobile ? 'py-3 text-lg' : ''} ${pathname.startsWith('/create') ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-gray-900 dark:text-gray-100'} hover:text-indigo-600 dark:hover:text-indigo-400 transition`} onClick={onClick}>
        <FiPlusCircle /> <span>Create</span>
      </Link>
      <Link href="/news" className={`flex items-center gap-2 ${mobile ? 'py-3 text-lg' : ''} ${pathname.startsWith('/news') ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-gray-900 dark:text-gray-100'} hover:text-indigo-600 dark:hover:text-indigo-400 transition`} onClick={onClick}>
        <FiFileText /> <span>News</span>
      </Link>
      <Link href="/bookmarks" className={`flex items-center gap-2 ${mobile ? 'py-3 text-lg' : ''} ${pathname.startsWith('/bookmarks') ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-gray-900 dark:text-gray-100'} hover:text-indigo-600 dark:hover:text-indigo-400 transition`} onClick={onClick}>
        <FiBookmark /> <span>Bookmarks</span>
      </Link>
    </>
  );

  // Lock body scroll and handle Escape to close when drawer is open
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, []);

  useEffect(() => {
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setOpen(false);
      };
      window.addEventListener('keydown', onKey);
      // focus first link
      setTimeout(() => firstLinkRef.current?.focus(), 0);
      return () => {
        document.body.style.overflow = original;
        window.removeEventListener('keydown', onKey);
      };
    }
  }, [open]);

  return (
    <motion.nav role="navigation" aria-label="Primary" initial={{ y: -100 }} animate={{ y: 0 }} className="bg-white/90 backdrop-blur dark:bg-[#0f1430]/90 shadow-md sticky top-0 z-50 border-b border-indigo-100 dark:border-[#1b2150] h-14">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Mobile hamburger on left */}
        <button
          aria-label="Toggle navigation"
          aria-expanded={open}
          ref={menuButtonRef}
          onClick={() => setOpen(!open)}
          className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {open ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>

        <Link href="/" className="text-[22px] font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">ModernBlog</Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex gap-6">
            <NavLinks />
          </div>
          <NotificationBell />
          <DarkModeToggle />
          <AuthMenu />
        </div>

        {/* Mobile right side icons */}
        <div className="md:hidden flex items-center gap-3">
          <NotificationBell />
          <DarkModeToggle />
          <AuthMenu />
        </div>
      </div>

      {/* Mobile side drawer (X-style) */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[100] md:hidden"
            />
            {/* Drawer */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="fixed top-0 left-0 bottom-0 w-[85vw] max-w-[320px] bg-white dark:bg-gray-900 z-[101] shadow-2xl overflow-y-auto md:hidden"
            >
              <div className="flex flex-col h-full p-5">
                <div className="flex items-center justify-between mb-8">
                  <Link href="/" onClick={() => setOpen(false)} className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">ModernBlog</Link>
                  <button onClick={() => setOpen(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100" aria-label="Close menu">
                    <FiX size={22} />
                  </button>
                </div>
                <nav className="flex-1 flex flex-col">
                  <div className="flex flex-col gap-2">
                    <NavLinks onClick={() => setOpen(false)} mobile />
                  </div>
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
