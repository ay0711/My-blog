"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiBookmark, FiTrash2, FiHome } from "react-icons/fi";

const API_URL = "http://localhost:5555";

type Post = {
  id: string;
  title: string;
  featuredImage?: string | null;
  createdAt: string;
};

export default function SavedPage() {
  const [ids, setIds] = useState<string[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("bookmarks") || "[]";
      const arr = JSON.parse(raw) as string[];
      setIds(arr);
    } catch {
      setIds([]);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const results: Post[] = [];
        for (const id of ids) {
          try {
            const res = await fetch(`${API_URL}/api/posts/${id}`);
            if (res.ok) {
              const data = await res.json();
              results.push({ id: data.id, title: data.title, featuredImage: data.featuredImage, createdAt: data.createdAt });
            }
          } catch {}
        }
        setPosts(results);
      } finally {
        setLoading(false);
      }
    };
    if (ids.length) run();
    else { setPosts([]); setLoading(false); }
  }, [ids]);

  const remove = (id: string) => {
    try {
      const raw = localStorage.getItem("bookmarks") || "[]";
      const arr = JSON.parse(raw) as string[];
      const next = arr.filter(x => x !== id);
      localStorage.setItem("bookmarks", JSON.stringify(next));
      setIds(next);
    } catch {}
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><FiBookmark /> Saved posts</h1>
        <Link href="/" className="text-indigo-600 hover:underline flex items-center gap-2"><FiHome /> Back home</Link>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading saved posts…</p>
        </div>
      ) : posts.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600">No saved posts yet.</p>
          <Link href="/" className="mt-4 inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Browse posts</Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-lg shadow overflow-hidden flex"
            >
              {p.featuredImage ? (
                <img src={p.featuredImage} alt="thumbnail" className="w-28 h-28 object-cover flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <div className="w-28 h-28 bg-gray-100 flex items-center justify-center text-gray-400">IMG</div>
              )}
              <div className="p-4 flex-1">
                <Link href={`/posts/${p.id}`} className="font-semibold hover:underline line-clamp-2">{p.title}</Link>
                <p className="text-sm text-gray-500 mt-1">{new Date(p.createdAt).toLocaleDateString()}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Link href={`/posts/${p.id}`} className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm">Read</Link>
                  <button onClick={() => remove(p.id)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm flex items-center gap-1 text-gray-700"><FiTrash2 /> Remove</button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
