'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHome, FiPlusCircle, FiFileText, FiMenu, FiX, FiBookmark, FiTrendingUp } from 'react-icons/fi';
import DarkModeToggle from './DarkModeToggle';
import AuthMenu from './auth/AuthMenu';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const NavLinks = ({ onClick, mobile }: { onClick?: () => void; mobile?: boolean }) => (
    <>
      <Link href="/" className={`flex items-center gap-2 ${mobile ? 'py-3 text-lg' : ''} text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition`} onClick={onClick}>
        <FiHome /> <span>Home</span>
      </Link>
      <Link href="/explore" className={`flex items-center gap-2 ${mobile ? 'py-3 text-lg' : ''} text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition`} onClick={onClick}>
        <FiTrendingUp /> <span>Explore</span>
      </Link>
      <Link href="/create" className={`flex items-center gap-2 ${mobile ? 'py-3 text-lg' : ''} text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition`} onClick={onClick}>
        <FiPlusCircle /> <span>Create</span>
      </Link>
      <Link href="/news" className={`flex items-center gap-2 ${mobile ? 'py-3 text-lg' : ''} text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition`} onClick={onClick}>
        <FiFileText /> <span>News</span>
      </Link>
      <Link href="/bookmarks" className={`flex items-center gap-2 ${mobile ? 'py-3 text-lg' : ''} text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition`} onClick={onClick}>
        <FiBookmark /> <span>Bookmarks</span>
      </Link>
    </>
  );

  // Lock body scroll and handle Escape to close when drawer is open
  useEffect(() => {
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setOpen(false);
      };
      window.addEventListener('keydown', onKey);
      return () => {
        document.body.style.overflow = original;
        window.removeEventListener('keydown', onKey);
      };
    }
  }, [open]);

  return (
    <motion.nav initial={{ y: -100 }} animate={{ y: 0 }} className="bg-white/90 backdrop-blur dark:bg-[#0f1430]/90 shadow-md sticky top-0 z-50 border-b border-indigo-100 dark:border-[#1b2150]">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Mobile hamburger on left */}
        <button
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {open ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>

        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">ModernBlog</Link>

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
        <div className="md:hidden flex items-center gap-2">
          <NotificationBell />
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
              className="fixed inset-0 bg-black/50 z-[100] md:hidden"
            />
            {/* Drawer */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-[85vw] max-w-[360px] bg-white dark:bg-gray-900 z-[101] shadow-2xl overflow-y-auto md:hidden"
            >
              <div className="flex flex-col h-full p-6">
                <div className="flex items-center justify-between mb-8">
                  <Link href="/" onClick={() => setOpen(false)} className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">ModernBlog</Link>
                  <button onClick={() => setOpen(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100">
                    <FiX size={24} />
                  </button>
                </div>
                <div className="flex-1 flex flex-col gap-6">
                  <div className="flex flex-col gap-1">
                    <NavLinks onClick={() => setOpen(false)} mobile />
                  </div>
                  <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-800">
                    <DarkModeToggle />
                  </div>
                  <div className="pt-2">
                    <AuthMenu mobile />
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
