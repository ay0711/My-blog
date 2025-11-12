'use client';
import { useEffect, useState } from 'react';
import Trending from './Trending';

type Post = {
  id: string;
  title: string;
  likes?: number;
  createdAt?: string;
  featuredImage?: string;
};

type SidebarProps = {
  posts: Post[];
  onCategoryClick?: (category: string) => void;
};

export default function Sidebar({ posts, onCategoryClick }: SidebarProps) {
  const categories = ['Technology', 'Business', 'Science', 'Health', 'Sports'];
  const [history, setHistory] = useState<Array<{id:string; title:string}>>([]);

  useEffect(() => {
    try {
      const arr = JSON.parse(localStorage.getItem('readingHistory') || '[]');
      setHistory(arr.slice(0, 5));
    } catch {}
  }, []);

  const clearHistory = () => {
    localStorage.removeItem('readingHistory');
    setHistory([]);
  };
  
  return (
    <div className="space-y-6">
      <Trending posts={posts} />
      
      <div className="bg-white dark:bg-[#0f1329] border border-indigo-100 dark:border-[#1b2150] rounded-lg shadow-sm p-4">
        <h4 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">Categories</h4>
        <div className="space-y-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => onCategoryClick?.(cat.toLowerCase())}
              className="w-full text-left block px-3 py-2 text-sm text-gray-800 border border-gray-300 bg-white hover:bg-indigo-50 hover:text-indigo-700 rounded transition"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Reading history */}
      {history.length > 0 && (
        <div className="bg-white dark:bg-[#0f1329] border border-indigo-100 dark:border-[#1b2150] rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">Recently Viewed</h4>
            <button onClick={clearHistory} className="text-xs text-gray-500 hover:text-red-600">Clear</button>
          </div>
          <ul className="space-y-2 text-sm">
            {history.map(h => (
              <li key={h.id} className="truncate">
                <a href={`/posts/${h.id}`} className="text-indigo-600 hover:underline">
                  {h.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-lg shadow p-6 text-center">
        <h4 className="font-semibold mb-2">Import News</h4>
        <p className="text-sm mb-4 opacity-90">Get the latest articles from NewsAPI</p>
        <a
          href="/news"
          className="inline-block bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
        >
          Browse News
        </a>
      </div>
    </div>
  );
}
