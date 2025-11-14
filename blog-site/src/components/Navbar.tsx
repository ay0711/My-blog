'use client';
import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHome, FiPlusCircle, FiFileText, FiMenu, FiX, FiBookmark, FiTrendingUp } from 'react-icons/fi';
import DarkModeToggle from './DarkModeToggle';
import AuthMenu from './auth/AuthMenu';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      <Link href="/" className="flex items-center gap-2 text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition" onClick={onClick}>
        <FiHome /> <span>Home</span>
      </Link>
      <Link href="/explore" className="flex items-center gap-2 text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition" onClick={onClick}>
        <FiTrendingUp /> <span>Explore</span>
      </Link>
      <Link href="/create" className="flex items-center gap-2 text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition" onClick={onClick}>
        <FiPlusCircle /> <span>Create</span>
      </Link>
      <Link href="/news" className="flex items-center gap-2 text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition" onClick={onClick}>
        <FiFileText /> <span>News</span>
      </Link>
      <Link href="/bookmarks" className="flex items-center gap-2 text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition" onClick={onClick}>
        <FiBookmark /> <span>Bookmarks</span>
      </Link>
    </>
  );

  return (
    <motion.nav initial={{ y: -100 }} animate={{ y: 0 }} className="bg-white/90 backdrop-blur dark:bg-[#0f1430]/90 shadow-md sticky top-0 z-50 border-b border-indigo-100 dark:border-[#1b2150]">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
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

        {/* Mobile menu button */}
        <button
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
      className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {open ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"
          >
            <div className="px-4 py-3 flex flex-col gap-3">
              <NavLinks onClick={() => setOpen(false)} />
              {/* Mobile Notification Bell */}
              <div className="pt-2 flex items-center">
                <NotificationBell />
              </div>
              <div className="pt-2">
                <DarkModeToggle />
              </div>
              <div className="pt-2">
                <AuthMenu mobile />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
