'use client';
import { motion } from 'framer-motion';
import { FiHeart, FiMessageCircle, FiCalendar, FiClock, FiBookmark, FiBookmark as FiBookmarkFilled } from 'react-icons/fi';

type Post = {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  likes: number;
  comments: any[];
  tags?: string[];
  featuredImage?: string;
  isPinned?: boolean;
  pinnedUntil?: string | null;
};

export default function PostCard({ post, onTagClick }: { post: Post; onTagClick?: (tag: string) => void }) {
  const excerpt = post.content.slice(0, 150) + '...';
  const words = post.content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="bg-white dark:bg-[#0f1329] border border-indigo-100 dark:border-[#1b2150] rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow"
    >
      <a href={`/posts/${post.id}`}>
        <motion.div 
          className="overflow-hidden"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.4 }}
        >
          <img
            src={post.featuredImage || `https://picsum.photos/seed/${post.id}/400/250`}
            alt={post.title}
            className="w-full h-44 md:h-48 object-cover"
            onError={(e) => {
              e.currentTarget.src = `https://picsum.photos/seed/${post.id}/400/250`;
              e.currentTarget.onerror = null; // Prevent infinite loop
            }}
          />
        </motion.div>
      </a>
      
      <div className="p-4">
        {((post.isPinned === true) || (post.pinnedUntil && new Date(post.pinnedUntil) > new Date())) && (
          <span className="inline-block mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded">Pinned</span>
        )}
        <a href={`/posts/${post.id}`}>
          <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-slate-100 hover:text-indigo-600 transition">{post.title}</h3>
        </a>
        
  <p className="text-gray-700 dark:text-gray-200 text-sm mb-4">{excerpt}</p>
        
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.slice(0, 3).map((tag, idx) => (
              <motion.button
                key={`${post.id}-${tag}-${idx}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.1, backgroundColor: 'rgb(224, 231, 255)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onTagClick?.(tag)}
                className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs rounded hover:bg-indigo-100 transition"
              >
                #{tag}
              </motion.button>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <FiHeart /> {post.likes}
            </span>
            <span className="flex items-center gap-1">
              <FiMessageCircle /> {post.comments?.length || 0}
            </span>
            <span className="hidden sm:flex items-center gap-1">
              <FiClock /> {minutes} min read
            </span>
          </div>
          <span className="flex items-center gap-1">
            <FiCalendar /> {new Date(post.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
