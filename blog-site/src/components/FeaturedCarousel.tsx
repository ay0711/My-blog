'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Post = {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  likes: number;
  tags?: string[];
  featuredImage?: string;
};

type FeaturedCarouselProps = {
  posts: Post[];
};

export default function FeaturedCarousel({ posts }: FeaturedCarouselProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (posts.length === 0) return;
    
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % posts.length);
    }, 10000); // Auto-advance every 8 seconds

    return () => clearInterval(timer);
  }, [posts.length]);

  if (posts.length === 0) return null;

  const currentPost = posts[current];

  return (
    <div className="relative bg-white rounded-lg shadow-lg overflow-hidden mb-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPost.id}
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -300 }}
          transition={{ 
            duration: 0.7,
            ease: [0.43, 0.13, 0.23, 0.96]
          }}
          className="relative"
        >
          <a href={`/posts/${currentPost.id}`} className="block">
            <div className="relative h-64 md:h-96 overflow-hidden">
              <motion.img
                src={currentPost.featuredImage || `https://picsum.photos/seed/${currentPost.id}/1200/600`}
                alt={currentPost.title}
                className="w-full h-full object-cover"
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 8 }}
                onError={(e) => {
                  e.currentTarget.src = `https://picsum.photos/seed/${currentPost.id}/1200/600`;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              
              <motion.div 
                className="absolute bottom-0 left-0 right-0 p-8 text-white"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                {currentPost.tags && currentPost.tags.length > 0 && (
                  <motion.span 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="inline-block px-3 py-1 bg-indigo-600 text-xs font-semibold rounded-full mb-3"
                  >
                    {currentPost.tags[0]}
                  </motion.span>
                )}
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-3xl md:text-4xl font-bold mb-3 line-clamp-2"
                >
                  {currentPost.title}
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-gray-200 text-sm md:text-base line-clamp-2 max-w-3xl"
                >
                  {currentPost.content.slice(0, 200)}...
                </motion.p>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="flex items-center gap-4 mt-4 text-sm"
                >
                  <span>{currentPost.author}</span>
                  <span>•</span>
                  <span>{new Date(currentPost.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{currentPost.likes} likes</span>
                </motion.div>
              </motion.div>
            </div>
          </a>
        </motion.div>
      </AnimatePresence>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {posts.map((_, idx) => (
          <motion.button
            key={idx}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCurrent(idx)}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === current ? 'bg-white w-8 ring-2 ring-white/80' : 'bg-white/80 w-2 ring-1 ring-white/70 hover:bg-white'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
