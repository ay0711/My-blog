'use client';

import { motion } from 'framer-motion';
import { FiArrowRight, FiCalendar, FiUser } from 'react-icons/fi';

type Post = {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  featuredImage?: string;
};

export default function Hero({ post }: { post: Post }) {
  const excerpt = post.content.slice(0, 200) + '...';
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white overflow-hidden"
    >
      <div className="absolute inset-0 bg-black opacity-20"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <motion.span
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-block bg-white/20 px-4 py-1 rounded-full text-sm mb-4"
            >
              Featured Story
            </motion.span>
            
            <motion.h1
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              {post.title}
            </motion.h1>
            
            <motion.p
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-lg mb-6 opacity-90"
            >
              {excerpt}
            </motion.p>
            
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-6 text-sm mb-6"
            >
              <span className="flex items-center gap-2">
                <FiUser /> {post.author}
              </span>
              <span className="flex items-center gap-2">
                <FiCalendar /> {new Date(post.createdAt).toLocaleDateString()}
              </span>
            </motion.div>
            
            <motion.a
              href={`/posts/${post.id}`}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="inline-flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Read Full Story <FiArrowRight />
            </motion.a>
          </div>
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="hidden md:block"
          >
            <img
              src={post.featuredImage || `https://picsum.photos/seed/${post.id}/600/400`}
              alt={post.title}
              className="rounded-lg shadow-2xl"
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
