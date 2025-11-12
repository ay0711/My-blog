"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiCalendar, FiHeart, FiUser, FiClock, FiShare2, FiBookmark, FiLock } from "react-icons/fi";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

const API_URL = "http://localhost:5555";

type Comment = { id: string; author: string; content: string; createdAt: string; parentId?: string | null };

type Post = {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  likes: number;
  comments: Comment[];
  tags?: string[];
  featuredImage?: string | null;
  reactions?: { like:number; love:number; laugh:number; wow:number; sad:number; angry:number };
  isPinned?: boolean;
  pinnedUntil?: string | null;
  seriesId?: string | null;
  partNumber?: number | null;
};

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const id = useMemo(() => {
    const raw = (params as any)?.id;
    return Array.isArray(raw) ? raw[0] : (raw as string | undefined);
  }, [params]);

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [author, setAuthor] = useState("");
  const [comment, setComment] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [bookmarked, setBookmarked] = useState(false);
  const [headings, setHeadings] = useState<Array<{ id: string; text: string; level: number }>>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [reaction, setReaction] = useState<null | 'like'|'love'|'laugh'|'wow'|'sad'|'angry'>(null);
  const [seriesPosts, setSeriesPosts] = useState<Post[]>([]);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [following, setFollowing] = useState<boolean>(false);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/posts/${id}`);
        if (!res.ok) throw new Error(`Failed to fetch post ${id}`);
        const data: Post = await res.json();
        setPost(data);
        
        // Check if user has already liked this post
        const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
        setIsLiked(likedPosts.includes(id));

        // Load saved reaction
        try {
          const map = JSON.parse(localStorage.getItem('postReactions') || '{}');
          if (map && typeof map === 'object' && map[data.id]) setReaction(map[data.id]);
        } catch {}

        // Save reading history
        try {
          const raw = localStorage.getItem('readingHistory') || '[]';
          const arr = JSON.parse(raw) as Array<{id:string; title:string}>;
          const next = [{ id: data.id, title: data.title }, ...arr.filter(x => x.id !== data.id)].slice(0, 20);
          localStorage.setItem('readingHistory', JSON.stringify(next));
        } catch {}

        // Bookmark state
        try {
          const b = JSON.parse(localStorage.getItem('bookmarks') || '[]') as string[];
          setBookmarked(b.includes(data.id));
        } catch {}

        // Extract headings from markdown-like content
        const hs: Array<{id:string; text:string; level:number}> = [];
        (data.content || '').split('\n').forEach(line => {
          const m3 = line.match(/^###\s+(.+)/);
          const m2 = line.match(/^##\s+(.+)/);
          const m1 = line.match(/^#\s+(.+)/);
          if (m3) { const text=m3[1].trim(); hs.push({ id: slugify(text), text, level:3 }); }
          else if (m2) { const text=m2[1].trim(); hs.push({ id: slugify(text), text, level:2 }); }
          else if (m1) { const text=m1[1].trim(); hs.push({ id: slugify(text), text, level:1 }); }
        });
        setHeadings(hs);
      } catch (error) {
        console.error("Failed to fetch post:", error);
        setPost(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  // Load series posts if applicable
  useEffect(() => {
    const loadSeries = async () => {
      if (!post?.seriesId) { setSeriesPosts([]); return; }
      try {
        const res = await fetch(`${API_URL}/api/series/${post.seriesId}`);
        const data = await res.json();
        setSeriesPosts(Array.isArray(data.posts) ? data.posts : []);
      } catch {}
    };
    loadSeries();
  }, [post?.seriesId]);

  useEffect(() => {
    if (typeof window !== 'undefined') setShareUrl(window.location.href);
  }, []);

  // Check following status if logged in
  useEffect(() => {
    const check = async () => {
      if (!post?.author) return;
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, { credentials: 'include' });
        if (!res.ok) { setFollowing(false); return; }
        const data = await res.json();
        const list: string[] = data.user?.followingAuthors || [];
        setFollowing(list.includes(post.author));
      } catch { setFollowing(false); }
    };
    check();
  }, [post?.author]);

  // Progress bar on scroll
  useEffect(() => {
    const onScroll = () => {
      const el = document.getElementById('post-content');
      if (!el) return;
      const max = el.scrollHeight - window.innerHeight;
      const pct = Math.min(1, Math.max(0, window.scrollY / Math.max(1, max)));
      const bar = document.getElementById('read-progress');
      if (bar) (bar as HTMLDivElement).style.width = `${pct * 100}%`;
    };
    window.addEventListener('scroll', onScroll, { passive: true } as any);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');

  const handleLike = async () => {
    if (!post) return;
    if (!isAuthenticated) {
      router.push('/sign-in');
      return;
    }
    
    try {
      const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
      
      if (isLiked) {
        // Unlike: remove from localStorage and decrease likes
        const updatedLikes = likedPosts.filter((postId: string) => postId !== post.id);
        localStorage.setItem('likedPosts', JSON.stringify(updatedLikes));
        setIsLiked(false);
        setPost({ ...post, likes: Math.max(0, (post.likes || 0) - 1) });
        
        // Send unlike request to server
        const res = await fetch(`${API_URL}/api/posts/${post.id}/unlike`, { method: "POST" });
        if (res.ok) {
          const updated: Post = await res.json();
          setPost(updated);
        }
      } else {
        // Like: add to localStorage and increase likes
        likedPosts.push(post.id);
        localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
        setIsLiked(true);
        setPost({ ...post, likes: (post.likes || 0) + 1 });
        
        // Send like request to server
        const res = await fetch(`${API_URL}/api/posts/${post.id}/like`, { method: "POST" });
        if (res.ok) {
          const updated: Post = await res.json();
          setPost(updated);
        }
      }
    } catch (error) {
      console.error("Failed to toggle like:", error);
    }
  };

  const handleReact = async (type: 'like'|'love'|'laugh'|'wow'|'sad'|'angry') => {
    if (!post) return;
    if (!isAuthenticated) {
      router.push('/sign-in');
      return;
    }
    const prev = reaction;
    const switching = prev && prev !== type;
    const removing = prev && prev === type;
    try {
      // optimistic update
      const nextReactions = { ...(post.reactions || { like:0,love:0,laugh:0,wow:0,sad:0,angry:0 }) };
      if (removing) {
        nextReactions[type] = Math.max(0, (nextReactions[type] || 0) - 1);
      } else if (switching) {
        if (prev) nextReactions[prev] = Math.max(0, (nextReactions[prev] || 0) - 1);
        nextReactions[type] = (nextReactions[type] || 0) + 1;
      } else {
        nextReactions[type] = (nextReactions[type] || 0) + 1;
      }
      setPost({ ...post, reactions: nextReactions });

      const res = await fetch(`${API_URL}/api/posts/${post.id}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: removing ? undefined : type, prevType: prev || undefined })
      });
      if (res.ok) {
        const updated: Post = await res.json();
        setPost(updated);
      }

      // update localStorage map
      const raw = localStorage.getItem('postReactions') || '{}';
      const map = JSON.parse(raw);
      if (removing) {
        delete map[post.id];
        setReaction(null);
      } else {
        map[post.id] = type;
        setReaction(type);
      }
      localStorage.setItem('postReactions', JSON.stringify(map));
    } catch (e) {
      console.error('Failed to react:', e);
    }
  };

  const toggleBookmark = () => {
    if (!post) return;
    try {
      const raw = localStorage.getItem('bookmarks') || '[]';
      const arr = JSON.parse(raw) as string[];
      let next: string[];
      if (arr.includes(post.id)) {
        next = arr.filter(x => x !== post.id);
        setBookmarked(false);
      } else {
        next = [post.id, ...arr];
        setBookmarked(true);
      }
      localStorage.setItem('bookmarks', JSON.stringify(next));
    } catch {}
  };

  const shareTo = (platform: 'twitter'|'facebook'|'linkedin'|'whatsapp') => {
    if (!post) return;
    const text = encodeURIComponent(post.title);
    const url = encodeURIComponent(shareUrl || '');
    const map = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      whatsapp: `https://api.whatsapp.com/send?text=${text}%20${url}`,
    } as const;
    window.open(map[platform], '_blank');
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !author.trim() || !comment.trim()) return;
    if (!isAuthenticated) {
      router.push('/sign-in');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: author.trim(), content: comment.trim(), parentId: replyTo || null }),
      });
      if (res.ok) {
        setAuthor("");
        setComment("");
        setReplyTo(null);
        const r = await fetch(`${API_URL}/api/posts/${post.id}`);
        const data: Post = await r.json();
        setPost(data);
      }
    } catch (error) {
      console.error("Failed to submit comment:", error);
    }
  };

  const buildCommentTree = (list: Comment[]) => {
    const map = new Map<string, any>();
    const roots: any[] = [];
    list.forEach(c => map.set(c.id, { ...c, children: [] }));
    list.forEach(c => {
      const node = map.get(c.id);
      if (c.parentId && map.has(c.parentId)) map.get(c.parentId).children.push(node);
      else roots.push(node);
    });
    return roots;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Post not found</h1>
          <a href="/" className="text-indigo-600 hover:underline">
            Go back home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen py-6 sm:py-8">
      <div id="read-progress" className="fixed top-0 left-0 h-1.5 bg-indigo-600 z-[60]" style={{ width: 0 }} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <motion.a
          href="/"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-indigo-600 mb-4 sm:mb-6"
        >
          <FiArrowLeft /> Back to posts
        </motion.a>

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden"
        >
          {post.featuredImage && (
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-56 sm:h-72 md:h-96 object-cover"
            />
          )}

          <div className="p-4 sm:p-6" id="post-content">
            <h1 className="text-2xl sm:text-3xl font-bold mb-3">{post.title}</h1>
            {((post.isPinned === true) || (post.pinnedUntil && new Date(post.pinnedUntil) > new Date())) && (
              <div className="mb-3 inline-flex items-center text-xs font-semibold uppercase tracking-wide text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded">Pinned</div>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
              <span className="inline-flex items-center gap-2">
                <FiUser /> {post.author}
              </span>
              <span className="inline-flex items-center gap-2">
                <FiCalendar /> {new Date(post.createdAt).toLocaleDateString()}
              </span>
              <span className="inline-flex items-center gap-2">
                <FiClock /> {Math.max(1, Math.ceil((post.content?.trim().split(/\s+/).length || 0) / 200))} min read
              </span>
              <button
                onClick={handleLike}
                className={`ml-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-lg transition ${
                  isLiked 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                }`}
              >
                <FiHeart className={isLiked ? 'fill-current' : ''} /> 
                {isLiked ? 'Liked' : 'Like'} ({post.likes || 0})
              </button>
              <button
                onClick={toggleBookmark}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg transition ${bookmarked ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <FiBookmark /> {bookmarked ? 'Saved' : 'Save'}
              </button>
              {post.author && (
                <button
                  onClick={async () => {
                    try {
                      const r = await fetch(`${API_URL}/api/users/follow`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ author: post.author })
                      });
                      if (r.ok) {
                        const j = await r.json();
                        setFollowing((j.followingAuthors || []).includes(post.author));
                      } else {
                        alert('Please sign in to follow authors');
                      }
                    } catch {}
                  }}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg transition text-sm ${following ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {following ? '✓ Following' : 'Follow'}
                </button>
              )}
            </div>

            {/* Share buttons */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <button onClick={() => shareTo('twitter')} className="px-3 py-1.5 rounded bg-sky-100 text-sky-700 hover:bg-sky-200 text-sm"><FiShare2 className="inline mr-1"/>Twitter</button>
              <button onClick={() => shareTo('facebook')} className="px-3 py-1.5 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm">Facebook</button>
              <button onClick={() => shareTo('linkedin')} className="px-3 py-1.5 rounded bg-indigo-100 text-indigo-700 hover:bg-indigo-200 text-sm">LinkedIn</button>
              <button onClick={() => shareTo('whatsapp')} className="px-3 py-1.5 rounded bg-green-100 text-green-700 hover:bg-green-200 text-sm">WhatsApp</button>
              <button onClick={() => { try { navigator.clipboard?.writeText(shareUrl); } catch(e) {} }} className="px-3 py-1.5 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm">Copy link</button>
            </div>

            {/* Table of Contents */}
            {headings.length > 0 && (
              <div className="mb-6 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <h3 className="font-semibold mb-2">Contents</h3>
                <ul className="space-y-1 text-sm">
                  {headings.map(h => (
                    <li key={h.id} className={h.level > 2 ? 'pl-4' : ''}>
                      <a href={`#${h.id}`} className="text-indigo-600 hover:underline">{h.text}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reaction bar */}
            <div className="mb-6 flex flex-wrap gap-2">
              {([
                { key:'like', label:'👍' },
                { key:'love', label:'❤️' },
                { key:'laugh', label:'😂' },
                { key:'wow', label:'😮' },
                { key:'sad', label:'😢' },
                { key:'angry', label:'😡' },
              ] as const).map(r => (
                <button
                  key={r.key}
                  onClick={() => handleReact(r.key)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition ${reaction === r.key ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                >
                  <span className="mr-1">{r.label}</span>
                  {post.reactions?.[r.key] || 0}
                </button>
              ))}
            </div>

            {/* Series navigation */}
            {post.seriesId && seriesPosts.length > 0 && (
              <div className="mb-6 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <h3 className="font-semibold mb-2">In this series</h3>
                <ol className="list-decimal pl-5 space-y-1">
                  {seriesPosts.map((sp) => (
                    <li key={sp.id} className={sp.id === post.id ? 'font-semibold text-indigo-700' : ''}>
                      {sp.id === post.id ? (
                        <span>{sp.partNumber ? `Part ${sp.partNumber}: ` : ''}{sp.title}</span>
                      ) : (
                        <a href={`/posts/${sp.id}`} className="text-indigo-600 hover:underline">
                          {sp.partNumber ? `Part ${sp.partNumber}: ` : ''}{sp.title}
                        </a>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {post.tags && post.tags.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {post.tags.map((t) => (
                  <span key={t} className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">
                    #{t}
                  </span>
                ))}
              </div>
            )}

            <div className="prose prose-indigo dark:prose-invert max-w-none relative">
              {!isAuthenticated ? (
                <>
                  {/* Show preview (first 200 chars) with blur */}
                  <div className="relative">
                    <div className="filter blur-sm select-none pointer-events-none">
                      {post.content.substring(0, 200).split("\n").map((line, i) => (
                        <p key={i} className="leading-7 text-gray-800 dark:text-gray-200">{line}</p>
                      ))}
                    </div>
                    {/* Auth gate overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white dark:via-gray-900/50 dark:to-gray-900 flex items-center justify-center">
                      <div className="text-center bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md mx-4 border border-gray-200 dark:border-gray-700">
                        <div className="mb-4 flex justify-center">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                            <FiLock className="text-white text-2xl" />
                          </div>
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">Sign in to read more</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                          Create a free account to read the full article, comment, like, and follow authors.
                        </p>
                        <div className="flex gap-3">
                          <Link
                            href="/sign-in"
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all shadow-lg"
                          >
                            Sign In
                          </Link>
                          <Link
                            href="/sign-up"
                            className="flex-1 px-6 py-3 border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg font-medium transition-all"
                          >
                            Sign Up
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                // Show full content for authenticated users
                post.content.split("\n").map((line, i) => {
                  const h3 = line.match(/^###\s+(.+)/);
                  const h2 = line.match(/^##\s+(.+)/);
                  const h1 = line.match(/^#\s+(.+)/);
                  if (h1) return <h1 id={slugify(h1[1])} key={i}>{h1[1]}</h1>;
                  if (h2) return <h2 id={slugify(h2[1])} key={i}>{h2[1]}</h2>;
                  if (h3) return <h3 id={slugify(h3[1])} key={i}>{h3[1]}</h3>;
                  return <p key={i} className="leading-7 text-gray-800 dark:text-gray-200">{line}</p>;
                })
              )}
            </div>

            <hr className="my-8" />

            <section>
              <h2 className="text-xl font-semibold mb-4">Comments ({post.comments?.length || 0})</h2>
              <div className="space-y-4 mb-6">
                {(post.comments && post.comments.length > 0) ? (
                  <div>
                    {buildCommentTree(post.comments).map((node) => (
                      <CommentNode key={node.id} node={node} onReply={(id)=>{ setReplyTo(id); const el = document.getElementById('comment-form'); el?.scrollIntoView({ behavior: 'smooth' }); }} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No comments yet. Be the first to comment!</p>
                )}
              </div>

              <form id="comment-form" onSubmit={handleCommentSubmit} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6 space-y-4">
                {replyTo && (
                  <div className="flex items-center justify-between text-xs text-gray-600 bg-yellow-50 border border-yellow-200 px-3 py-2 rounded">
                    <span>Replying to comment</span>
                    <button type="button" className="text-yellow-700 hover:underline" onClick={()=>setReplyTo(null)}>Cancel</button>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Your name</label>
                  <input
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700"
                    placeholder="Jane Doe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Comment</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 h-28 dark:bg-gray-800 dark:border-gray-700"
                    placeholder="Write your comment..."
                    required
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center px-5 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition w-full sm:w-auto"
                  >
                    Add Comment
                  </button>
                  <a
                    href="/"
                    className="inline-flex items-center justify-center px-5 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition w-full sm:w-auto"
                  >
                    Back Home
                  </a>
                </div>
              </form>
            </section>
          </div>
        </motion.article>
      </div>
    </div>
  );
}

// Recursive comment node component
function CommentNode({ node, onReply }: { node: any; onReply: (id: string) => void }) {
  return (
    <div className="border border-gray-200 rounded-lg p-3 sm:p-4 mb-3">
      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
        <span className="font-medium text-gray-700">{node.author}</span>
        <span>{new Date(node.createdAt).toLocaleString()}</span>
      </div>
      <p className="text-sm text-gray-700 whitespace-pre-line mb-2">{node.content}</p>
      <button onClick={() => onReply(node.id)} className="text-xs text-indigo-600 hover:underline">Reply</button>
      {node.children && node.children.length > 0 && (
        <div className="mt-3 space-y-3 pl-4 border-l-2 border-gray-200">
          {node.children.map((child: any) => (
            <CommentNode key={child.id} node={child} onReply={onReply} />
          ))}
        </div>
      )}
    </div>
  );
}




