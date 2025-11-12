'use client';

import { motion } from 'framer-motion';
import { FaTwitter, FaGithub, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-indigo-50 dark:bg-[#0b1020] text-slate-700 dark:text-slate-300 py-8 mt-16 border-t border-indigo-100 dark:border-[#1b2150]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <div className="flex justify-center gap-6 mb-4 text-xl">
          <a href="https://x.com/Ayanfe0102?t=cq_LBP2NCJGIMfI6HbwS7g&s=08" className="hover:text-blue-500 transition-colors"><FaTwitter size={24} /></a>
          <a href="https://github.com/ay0711" className="hover:text-blue-500 transition-colors"><FaGithub size={24} /></a>
          <a href="https://www.linkedin.com/in/oladiran-ayanfe-019229355?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" className="hover:text-blue-500 transition-colors"><FaLinkedin size={24} /></a>
        </div>
        <p className="text-sm sm:text-base">&copy; {new Date().getFullYear()} ModernBlog. All Rights Reserved.</p>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">Built with Next.js, TypeScript & Express — Powered by NewsAPI.</p>
      </div>
    </motion.footer>
  );
};

export default Footer;
