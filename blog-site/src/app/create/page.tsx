'use client';
import { useState, useEffect } from 'react';
import { FiZap, FiLoader } from 'react-icons/fi';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

const API_URL = 'http://localhost:5555';

export default function CreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  
  const [form, setForm] = useState({
    title: '',
    content: '',
    author: '',
    tags: '',
    featuredImage: '',
    isPinned: false,
    pinnedUntil: '',
    seriesId: '',
    partNumber: '' as string | number,
  });
  const [loading, setLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (editId) {
      fetchPost();
    }
  }, [editId]);

  const fetchPost = async () => {
    try {
      const res = await fetch(`${API_URL}/api/posts/${editId}`);
      const data = await res.json();
      setForm({
        title: data.title,
        content: data.content,
        author: data.author,
        tags: data.tags?.join(', ') || '',
        featuredImage: data.featuredImage || '',
        isPinned: !!data.isPinned,
        pinnedUntil: data.pinnedUntil ? String(data.pinnedUntil).slice(0,10) : '',
        seriesId: data.seriesId || '',
        partNumber: data.partNumber ?? '',
      });
    } catch (error) {
      console.error('Failed to fetch post:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const body = {
      title: form.title,
      content: form.content,
      author: form.author,
      featuredImage: form.featuredImage,
      tags,
      isPinned: !!form.isPinned,
      pinnedUntil: form.pinnedUntil || null,
      seriesId: form.seriesId || null,
      partNumber: form.partNumber === '' ? null : Number(form.partNumber),
    };

    try {
      const url = editId ? `${API_URL}/api/posts/${editId}` : `${API_URL}/api/posts`;
      const method = editId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to save post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt.trim(), maxOutputTokens: 1024 }),
      });
      const data = await res.json();
      if (data?.text) {
        setForm((prev) => ({
          ...prev,
          title: prev.title || data.text.split('\n')[0].replace(/^#+\s*/, '').slice(0, 120),
          content: prev.content ? prev.content + "\n\n" + data.text : data.text,
        }));
        // Try to auto-suggest tags
        try {
          const tRes = await fetch(`${API_URL}/api/ai/tags`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: data.text }),
          });
          const tJson = await tRes.json();
          if (Array.isArray(tJson?.tags) && tJson.tags.length) {
            const existing = form.tags ? form.tags.split(',').map((t) => t.trim()) : [];
            const merged = Array.from(new Set([...existing, ...tJson.tags])).join(',');
            setForm((prev) => ({ ...prev, tags: merged }));
          }
        } catch {}
      }
    } catch (e) {
      console.error('AI generate failed:', e);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-[#0b1020] dark:via-[#1a1240] dark:to-[#0f1329] py-8">
      <div className="max-w-3xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 backdrop-blur dark:bg-[#0f1329]/95 border border-indigo-200 dark:border-purple-500/30 rounded-xl shadow-2xl p-8"
        >
          <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">{editId ? 'Edit Post' : 'Create New Post'}</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-slate-100">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2 border border-indigo-200 dark:border-[#1b2150] bg-white dark:bg-[#0f1329] text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <input
                  type="checkbox"
                  checked={!!form.isPinned}
                  onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-semibold">Pin this post</span>
              </label>
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-slate-100">Pin until (optional)</label>
                <input
                  type="date"
                  value={form.pinnedUntil}
                  onChange={(e) => setForm({ ...form, pinnedUntil: e.target.value })}
                  className="w-full px-4 py-2 border border-indigo-200 dark:border-[#1b2150] bg-white dark:bg-[#0f1329] text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-slate-100">Series ID (optional)</label>
                <input
                  type="text"
                  value={form.seriesId}
                  onChange={(e) => setForm({ ...form, seriesId: e.target.value })}
                  className="w-full px-4 py-2 border border-indigo-200 dark:border-[#1b2150] bg-white dark:bg-[#0f1329] text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., nextjs-animations"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-slate-100">Part number (optional)</label>
                <input
                  type="number"
                  value={String(form.partNumber)}
                  onChange={(e) => setForm({ ...form, partNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-indigo-200 dark:border-[#1b2150] bg-white dark:bg-[#0f1329] text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-slate-100">Author</label>
              <input
                type="text"
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                className="w-full px-4 py-2 border border-indigo-200 dark:border-[#1b2150] bg-white dark:bg-[#0f1329] text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-slate-100">Featured Image URL (optional)</label>
              <input
                type="url"
                value={form.featuredImage}
                onChange={(e) => setForm({ ...form, featuredImage: e.target.value })}
                className="w-full px-4 py-2 border border-indigo-200 dark:border-[#1b2150] bg-white dark:bg-[#0f1329] text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="https://example.com/image.jpg"
              />
              {form.featuredImage && (
                <img src={form.featuredImage} alt="Preview" className="mt-2 w-full h-48 object-cover rounded-lg" />
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-slate-100">Tags (comma separated)</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="w-full px-4 py-2 border border-indigo-200 dark:border-[#1b2150] bg-white dark:bg-[#0f1329] text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="technology, news, tutorial"
              />
            </div>

            {/* AI Assist */}
            <div className="p-4 rounded-lg border border-purple-200 dark:border-purple-500/30 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-purple-900/20 dark:to-indigo-900/20">
              <div className="flex items-center gap-2 mb-2 font-medium text-slate-900 dark:text-purple-200"><FiZap className="text-purple-600 dark:text-purple-400" /> Generate with AI</div>
              <div className="flex flex-col md:flex-row gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g., Write a concise post about advances in sports AI"
                  className="flex-1 px-4 py-2 border border-purple-200 dark:border-purple-500/30 bg-white dark:bg-[#1a1240] text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={handleAIGenerate}
                  disabled={aiLoading}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 inline-flex items-center gap-2 shadow-lg"
                >
                  {aiLoading ? (<><FiLoader className="animate-spin" /> Generating…</>) : 'Generate'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-slate-100">Content</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="w-full px-4 py-2 border border-indigo-200 dark:border-[#1b2150] bg-white dark:bg-[#0f1329] text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 h-64 resize-none"
                required
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 shadow-lg"
              >
                {loading ? 'Saving...' : editId ? 'Update Post' : 'Create Post'}
              </button>
              <a
                href="/"
                className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-slate-700 dark:text-slate-200 px-8 py-3 rounded-lg font-semibold hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-700 transition shadow"
              >
                Cancel
              </a>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
