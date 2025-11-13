'use client';


import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PostCard from '@/components/PostCard';
import FeaturedCarousel from '@/components/FeaturedCarousel';
import Sidebar from '@/components/Sidebar';
import { FiSearch } from 'react-icons/fi';
import { fetchJSON, fetchWithFallback } from '@/lib/api';

// API base is resolved by fetchJSON using NEXT_PUBLIC_API_URLS/NEXT_PUBLIC_API_URL

type Post = {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  likes: number;
  comments: unknown[];
  tags?: string[];
  featuredImage?: string;
};

type TrendingTag = {
  tag: string;
  count: number;
};

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [trending, setTrending] = useState<Post[]>([]);
  const [featured, setFeatured] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sort, setSort] = useState<'newest' | 'popular'>('newest');
  const [trendingTags, setTrendingTags] = useState<TrendingTag[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [seeding, setSeeding] = useState(false);

  const handleCategoryClick = (category: string) => {
    setSelectedTag(category);
    setSelectedTags([]);
    setStartDate('');
    setEndDate('');
    setSort('newest');
    setPage(1);
    setSearch(''); // Clear search when filtering by category
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleTag = (tag: string) => {
    setSelectedTag('');
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
    setPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    fetchPosts();
    fetchTrending();
    fetchFeatured();
  }, [page, search, selectedTag, selectedTags.join(','), startDate, endDate, sort]);

  useEffect(() => {
    fetchTrendingTags();
    // Only check for auto-seed if posts haven't been fetched yet
    const checkAndSeed = async () => {
      try {
        // Check if we have any posts in database
        const data = await fetchJSON<{ total: number }>('/api/posts?limit=1');
        if (data.total === 0) {
          // No posts found, trigger batch import
          console.log('📥 Database is empty. Auto-importing news articles...');
          setSeeding(true);
          try {
            const result = await fetchWithFallback('/api/news/import-batch', { method: 'POST' });
            const importData = await result.json();
            console.log('✅ Auto-import completed:', importData);
            // Refresh all data after successful import
            await Promise.all([fetchPosts(), fetchTrending(), fetchFeatured(), fetchTrendingTags()]);
          } catch (importError) {
            console.error('❌ Auto-import failed:', importError);
          } finally {
            setSeeding(false);
          }
        } else {
          console.log(`✅ Database has ${data.total} posts ready to display`);
        }
      } catch (error) {
        console.warn('⚠️ Auto-seed check skipped:', error);
      }
    };
    checkAndSeed();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '9',
        sort,
      });
      if (search) params.set('q', search);
      if (selectedTag) params.set('tag', selectedTag);
      if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const data = await fetchJSON<{ posts: Post[]; total: number }>(`/api/posts?${params}`);
      setPosts(data.posts || []);
      setTotal(data.total || 0);
      setTotalPages(Math.ceil((data.total || 0) / 9));
      
      console.log(`📚 Loaded ${data.posts?.length || 0} posts (Page ${page} of ${Math.ceil((data.total || 0) / 9)})`);
    } catch (error) {
      console.error('❌ Failed to fetch posts:', error);
      setPosts([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingTags = async () => {
    try {
      const data = await fetchJSON<{ tags: TrendingTag[] }>(`/api/tags/trending?limit=20`);
      setTrendingTags(data.tags || []);
    } catch (error) {
      console.error('Failed to fetch trending tags:', error);
    }
  };

  const fetchTrending = async () => {
    try {
      const data = await fetchJSON<{ posts: Post[] }>(`/api/posts?sort=popular&limit=5`);
      setTrending(data.posts || []);
    } catch (error) {
      console.error('Failed to fetch trending:', error);
    }
  };

  const fetchFeatured = async () => {
    try {
      // Fetch one top post from each category
      const categories = ['technology', 'business', 'science', 'health', 'sports'];
      const featuredPosts: Post[] = [];
      
      for (const category of categories) {
        const data = await fetchJSON<{ posts: Post[] }>(`/api/posts?tag=${category}&limit=1&sort=popular`);
        if (data.posts && data.posts.length > 0) {
          featuredPosts.push(data.posts[0]);
        }
      }
      
      setFeatured(featuredPosts);
    } catch (error) {
      console.error('Failed to fetch featured:', error);
    }
  };

  const gridPosts = posts;

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-[#0b1020] dark:via-[#1a1240] dark:to-[#0f1329] min-h-screen">
      {/* Featured Carousel */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-4 pt-8"
      >
        <FeaturedCarousel posts={featured} />
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search & Filter */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8 flex flex-col md:flex-row gap-4"
        >
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search posts..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-indigo-200 dark:border-purple-500/30 bg-white dark:bg-[#0f1329] text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
            />
          </div>
        </motion.div>

        {/* Filters: tags, date range, sort */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 space-y-3"
        >
          {/* Active filters chips */}
          {(selectedTag || selectedTags.length > 0 || startDate || endDate || sort !== 'newest') && (
            <div className="flex flex-wrap gap-2">
              {selectedTag && (
                <button
                  onClick={() => setSelectedTag('')}
                  className="px-3 py-1 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-purple-900/50 dark:to-indigo-900/50 text-indigo-700 dark:text-purple-200 border border-indigo-300 dark:border-purple-500/30 hover:from-indigo-200 hover:to-purple-200 dark:hover:from-purple-800/50 dark:hover:to-indigo-800/50"
                >
                  Category: {selectedTag} ×
                </button>
              )}
              {selectedTags.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleTag(t)}
                  className="px-3 py-1 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-700"
                >
                  {t} ×
                </button>
              ))}
              {(startDate || endDate) && (
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600">
                  Date: {startDate || '…'} – {endDate || '…'}
                </span>
              )}
              <button
                onClick={() => {
                  setSelectedTag('');
                  setSelectedTags([]);
                  setStartDate('');
                  setEndDate('');
                  setSort('newest');
                  setPage(1);
                }}
                className="px-3 py-1 rounded-full bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/50 dark:to-pink-900/50 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-500/30 hover:from-red-200 hover:to-pink-200 dark:hover:from-red-800/50 dark:hover:to-pink-800/50"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Trending tags + date + sort */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
            <div className="flex-1 flex flex-wrap gap-2">
              {trendingTags.map((tt) => (
                <button
                  key={tt.tag}
                  onClick={() => toggleTag(tt.tag)}
                  className={`px-3 py-1 rounded-full border transition shadow-sm ${
                    selectedTags.includes(tt.tag)
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent'
                      : 'bg-white dark:bg-[#0f1329] text-gray-800 dark:text-gray-200 border-indigo-200 dark:border-purple-500/30 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-purple-900/30 dark:hover:to-indigo-900/30'
                  }`}
                  title={`${tt.count} posts`}
                >
                  {tt.tag}
                </button>
              ))}
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-indigo-200 dark:border-purple-500/30 bg-white dark:bg-[#0f1329] text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-purple-500 transition shadow-sm"
              />
              <span className="self-center text-gray-600 dark:text-gray-400">–</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-indigo-200 dark:border-purple-500/30 bg-white dark:bg-[#0f1329] text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-purple-500 transition shadow-sm"
              />
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value as 'newest' | 'popular'); setPage(1); }}
                className="px-3 py-2 border border-indigo-200 dark:border-purple-500/30 rounded-lg bg-white dark:bg-[#0f1329] text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-purple-500 transition shadow-sm"
              >
                <option value="newest">Newest</option>
                <option value="popular">Most liked</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Main Grid + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Posts Grid */}
          <div className="lg:col-span-2">
            {seeding ? (
              <div className="text-center py-16 px-4">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Welcome to ModernBlog! 🎉
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  We&apos;re importing fresh news articles for you...
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  This will only take a moment
                </p>
              </div>
            ) : loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading posts...</p>
              </div>
            ) : gridPosts.length > 0 ? (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {gridPosts.map((post, i) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        delay: i * 0.08,
                        duration: 0.5,
                        ease: [0.25, 0.46, 0.45, 0.94]
                      }}
                    >
                      <PostCard post={post} onTagClick={toggleTag} />
                    </motion.div>
                  ))}
                </motion.div>

                {/* Pagination */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="mt-8 flex flex-wrap justify-center items-center gap-2"
                >
                  <button
                    onClick={() => handlePageChange(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-white dark:bg-[#0f1329] text-gray-800 dark:text-gray-200 border border-indigo-200 dark:border-purple-500/30 rounded-lg hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-purple-900/30 dark:hover:to-indigo-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                  >
                    Previous
                  </button>
                  
                  {/* Page Numbers - Sliding Window of 5 */}
                  <div className="flex gap-2">
                    {(() => {
                      const maxVisible = 5;
                      let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
                      const endPage = Math.min(totalPages, startPage + maxVisible - 1);
                      
                      // Adjust if we're near the end
                      if (endPage - startPage + 1 < maxVisible) {
                        startPage = Math.max(1, endPage - maxVisible + 1);
                      }
                      
                      const pageNumbers = [];
                      
                      // Show first page if not in range
                      if (startPage > 1) {
                        pageNumbers.push(
                          <button
                            key={1}
                            onClick={() => handlePageChange(1)}
                            className="px-4 py-2 bg-white dark:bg-[#0f1329] text-gray-800 dark:text-gray-200 border border-indigo-200 dark:border-purple-500/30 rounded-lg hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-purple-900/30 dark:hover:to-indigo-900/30 transition shadow-sm"
                          >
                            1
                          </button>
                        );
                        if (startPage > 2) {
                          pageNumbers.push(<span key="ellipsis-start" className="px-2 py-2">...</span>);
                        }
                      }
                      
                      // Show visible range
                      for (let i = startPage; i <= endPage; i++) {
                        pageNumbers.push(
                          <button
                            key={i}
                            onClick={() => handlePageChange(i)}
                            className={`px-4 py-2 rounded-lg border transition shadow-sm ${
                              i === page
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-lg shadow-purple-500/30'
                                : 'bg-white dark:bg-[#0f1329] text-gray-800 dark:text-gray-200 border-indigo-200 dark:border-purple-500/30 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-purple-900/30 dark:hover:to-indigo-900/30'
                            }`}
                          >
                            {i}
                          </button>
                        );
                      }
                      
                      // Show last page if not in range
                      if (endPage < totalPages) {
                        if (endPage < totalPages - 1) {
                          pageNumbers.push(<span key="ellipsis-end" className="px-2 py-2 text-gray-600 dark:text-gray-400">...</span>);
                        }
                        pageNumbers.push(
                          <button
                            key={totalPages}
                            onClick={() => handlePageChange(totalPages)}
                            className="px-4 py-2 bg-white dark:bg-[#0f1329] text-gray-800 dark:text-gray-200 border border-indigo-200 dark:border-purple-500/30 rounded-lg hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-purple-900/30 dark:hover:to-indigo-900/30 transition shadow-sm"
                          >
                            {totalPages}
                          </button>
                        );
                      }
                      
                      return pageNumbers;
                    })()}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages}
                    className="px-4 py-2 bg-white dark:bg-[#0f1329] text-gray-800 dark:text-gray-200 border border-indigo-200 dark:border-purple-500/30 rounded-lg hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-purple-900/30 dark:hover:to-indigo-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                  >
                    Next
                  </button>
                </motion.div>
              </>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center py-16 px-6 bg-white dark:bg-[#0f1329] border border-indigo-200 dark:border-purple-500/30 rounded-lg shadow-lg"
              >
                <div className="mb-6">
                  <div className="text-6xl mb-4">📰</div>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                    No Posts Yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Get started by importing news articles or creating your own content!
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="/news"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all font-medium"
                  >
                    📥 Import News
                  </a>
                  <a
                    href="/create"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-indigo-600 dark:text-purple-400 border-2 border-indigo-600 dark:border-purple-500 rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all font-medium"
                  >
                    ✍️ Create Post
                  </a>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-1"
          >
            <Sidebar posts={trending} onCategoryClick={handleCategoryClick} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
