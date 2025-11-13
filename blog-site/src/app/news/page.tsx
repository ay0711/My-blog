'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { fetchWithFallback } from '@/lib/api';
import { FiSearch, FiDownload } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// API base is resolved by fetchWithFallback using NEXT_PUBLIC_API_URLS/NEXT_PUBLIC_API_URL

type Article = {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: { name: string };
  author: string;
};

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<Set<number>>(new Set());
  const defaultFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [form, setForm] = useState({
    q: 'tesla',
    from: defaultFrom,
    sortBy: 'publishedAt',
  });

  const fetchNews = async () => {
    setLoading(true);
    try {
      // Client-side clamp: ensure 'from' not older than 29 days and not after today
      const now = new Date();
      const maxPast = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);
      let fromDate = new Date(form.from);
      if (isNaN(fromDate.getTime())) fromDate = new Date(defaultFrom);
      if (fromDate < maxPast) fromDate = maxPast;
      if (fromDate > now) fromDate = now;

      const params = new URLSearchParams({ ...form, from: fromDate.toISOString().slice(0, 10) });
      const res = await fetchWithFallback(`/api/news/search?${params}`);
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.details?.message || data?.message || 'Unknown error';
        throw new Error(msg);
      }
      setArticles(data.articles || []);
    } catch (error) {
      console.error('Failed to fetch news:', error);
      toast.error(`Failed to fetch news: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const importArticle = async (article: Article, index: number) => {
    setImporting(new Set(importing).add(index));
    try {
      const res = await fetchWithFallback(`/api/news/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: article.title,
          from: form.from,
        }),
      });
      if (res.ok) {
        toast.success('Article imported successfully!');
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Import failed');
      }
    } catch (error) {
      console.error('Failed to import:', error);
      toast.error(`Failed to import: ${(error as Error).message}`);
    } finally {
      setImporting((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  const importAll = async () => {
    setLoading(true);
    try {
      const res = await fetchWithFallback(`/api/news/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Batch import failed');
      }
      const data = await res.json();
      toast.success(`Successfully imported ${data.imported || 0} articles!`);
    } catch (error) {
      console.error('Failed to import all:', error);
      toast.error(`Failed to import articles: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-[#0b1020] dark:via-[#1a1240] dark:to-[#0f1329] min-h-screen py-8">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 backdrop-blur dark:bg-[#0f1329]/95 border border-indigo-200 dark:border-purple-500/30 rounded-xl shadow-2xl p-6 mb-8"
        >
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">Import News from NewsAPI</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Search and import news articles to create blog posts automatically</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">Search Query</label>
              <input
                type="text"
                value={form.q}
                onChange={(e) => setForm({ ...form, q: e.target.value })}
                className="w-full px-4 py-2 border border-indigo-200 dark:border-purple-500/30 bg-white dark:bg-[#0f1329] text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-purple-500 transition shadow-sm"
                placeholder="e.g., tesla, technology"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">From Date <span className="text-gray-500 dark:text-gray-400 text-xs">(last 30 days)</span></label>
              <input
                type="date"
                value={form.from}
                onChange={(e) => setForm({ ...form, from: e.target.value })}
                className="w-full px-4 py-2 border border-indigo-200 dark:border-purple-500/30 bg-white dark:bg-[#0f1329] text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-purple-500 transition shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">Sort By</label>
              <select
                value={form.sortBy}
                onChange={(e) => setForm({ ...form, sortBy: e.target.value })}
                className="w-full px-4 py-2 border border-indigo-200 dark:border-purple-500/30 bg-white dark:bg-[#0f1329] text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-purple-500 transition shadow-sm"
              >
                <option value="publishedAt">Published Date</option>
                <option value="relevancy">Relevancy</option>
                <option value="popularity">Popularity</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={fetchNews}
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition disabled:opacity-50 shadow-md"
            >
              <FiSearch /> {loading ? 'Searching...' : 'Search News'}
            </button>
            {articles.length > 0 && (
              <button
                onClick={importAll}
                disabled={loading}
                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 rounded-lg hover:shadow-lg hover:shadow-green-500/30 transition disabled:opacity-50 shadow-md"
              >
                <FiDownload /> Import All ({articles.length})
              </button>
            )}
          </div>
        </motion.div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-purple-500"></div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-[#0f1329] border border-indigo-100 dark:border-purple-500/30 rounded-lg shadow-lg hover:shadow-xl hover:shadow-purple-500/20 dark:hover:shadow-purple-500/30 overflow-hidden transition-all"
            >
              {article.urlToImage && (
                <div className="relative w-full h-48 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20">
                  <img
                    src={article.urlToImage}
                    alt={article.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2 line-clamp-2 text-gray-900 dark:text-gray-100">{article.title}</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">{article.description}</p>

                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-4">
                  <span className="font-medium">{article.source.name}</span>
                  <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                </div>

                <div className="flex gap-2">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center px-4 py-2 border border-indigo-600 dark:border-purple-500 text-indigo-600 dark:text-purple-400 rounded hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-purple-900/30 dark:hover:to-indigo-900/30 transition text-sm"
                  >
                    Read Original
                  </a>
                  <button
                    onClick={() => importArticle(article, index)}
                    disabled={importing.has(index)}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded hover:shadow-lg hover:shadow-purple-500/30 transition text-sm disabled:opacity-50"
                  >
                    {importing.has(index) ? 'Importing...' : 'Import'}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {!loading && articles.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-[#0f1329] border border-indigo-200 dark:border-purple-500/30 rounded-lg shadow-lg">
            <p className="text-gray-600 dark:text-gray-300">No articles yet. Try searching for news above!</p>
          </div>
        )}
      </div>
    </div>
  );
}
