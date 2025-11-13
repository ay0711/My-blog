const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const mongoose = require('mongoose');
require('dotenv').config();

const Post = require('./models/Post');
const User = require('./models/User');
const app = express();
const PORT = process.env.PORT || 5555;
const postsFilePath = path.join(__dirname, 'posts.json');

const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// CORS: allow local dev and optional production origins via env FRONTEND_ORIGIN(S)
const ALLOWED_ORIGINS = (process.env.FRONTEND_ORIGINS
  ? process.env.FRONTEND_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
  : [process.env.FRONTEND_ORIGIN || 'http://localhost:3000']
);
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const NEWSAPI_KEY = process.env.NEWSAPI_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_production';
const IS_SERVERLESS = !!process.env.VERCEL || !!process.env.SERVERLESS || process.env.NODE_ENV === 'production' && !!process.env.VERCEL;

// Nodemailer configuration
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = process.env.EMAIL_PORT || 587;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || 'ModernBlog <noreply@modernblog.com>';

let mailTransporter = null;
if (EMAIL_USER && EMAIL_PASS) {
  mailTransporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_PORT === '465',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS }
  });
  /* log removed */
} else {
  console.warn('⚠️  Email not configured. Set EMAIL_USER and EMAIL_PASS in .env');
}

let geminiClient = null;
try {
  if (GEMINI_API_KEY) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    geminiClient = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
} catch (e) {
  console.warn('Gemini client not initialized:', e.message);
}

// Auto-import configuration
const AUTO_IMPORT_ENABLED = process.env.AUTO_IMPORT_ENABLED !== 'false'; // Default: enabled
const AUTO_IMPORT_INTERVAL = parseInt(process.env.AUTO_IMPORT_INTERVAL || '3600000'); // Default: 1 hour (in ms)

// NewsAPI fetch helper
const https = require('https');
const fetchFromNewsAPI = (url) => {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'ModernBlog/1.0 (Node.js)',
      },
    };
    https.get(url, options, (resp) => {
      let data = '';
      resp.on('data', (chunk) => (data += chunk));
      resp.on('end', () => {
        const status = resp.statusCode || 0;
  /* log removed */
        try {
          const json = JSON.parse(data);
          if (status >= 400) {
            return reject(new Error(`NewsAPI error ${status}: ${JSON.stringify(json)}`));
          }
          resolve(json);
        } catch (err) {
          if (status >= 400) {
            return reject(new Error(`NewsAPI error ${status}: ${data}`));
          }
          return reject(new Error(`Parse error: ${err.message}`));
        }
      });
    }).on('error', (err) => reject(err));
  });
};

// Extract tags from article
const extractTags = (article) => {
  const stopwords = ['the','and','for','with','that','this','from','have','will','your','about'];
  const text = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
  const words = text.split(/[^a-z0-9]+/).filter(w => w.length > 3 && !stopwords.includes(w));
  const freq = {};
  words.forEach(w => freq[w] = (freq[w] || 0) + 1);
  const top = Object.keys(freq).sort((a,b) => freq[b] - freq[a]).slice(0, 3);
  if (article.source?.name) {
    top.unshift(article.source.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
  }
  return [...new Set(top)].slice(0, 4);
};

// Auto-import news function
const autoImportNews = async () => {
  if (!NEWSAPI_KEY || !mongoConnected) {
  /* log removed */
    return { skipped: true, reason: 'missing_key_or_db' };
  }

  const categories = ['technology', 'business', 'science', 'health', 'sports'];
  /* log removed */
  
  try {
    const summary = { totalImported: 0, perCategory: {} };
    for (const category of categories) {
      const params = new URLSearchParams({ 
        apiKey: NEWSAPI_KEY,
        category,
        country: 'us',
        pageSize: '5' // Import 5 latest articles per category
      });
      
      const url = `https://newsapi.org/v2/top-headlines?${params}`;
      const data = await fetchFromNewsAPI(url);
      const articles = data.articles || [];
      
  let imported = 0;
      for (const a of articles) {
        const exists = a.url ? await Post.findOne({ sourceUrl: a.url }) : null;
        if (exists) continue;
        
        const extractedTags = extractTags(a);
        const allTags = [category, ...extractedTags];
        // Remove duplicates (case-insensitive)
        const uniqueTags = [...new Set(allTags.map(t => t.toLowerCase()))];
        
        await Post.create({
          id: randomUUID(),
          title: a.title || 'Untitled',
          content: `${a.description || ''}\n\n${a.content || ''}`,
          author: a.author || a.source?.name || 'News',
          createdAt: a.publishedAt ? new Date(a.publishedAt) : new Date(),
          likes: 0,
          reactions: { like:0, love:0, laugh:0, wow:0, sad:0, angry:0 },
          comments: [],
          sourceUrl: a.url,
          tags: uniqueTags,
          featuredImage: a.urlToImage,
        });
        imported++;
      }
      
      /* log removed: per-category imported count */
      summary.perCategory[category] = imported;
      summary.totalImported += imported;
    }
  /* log removed */
    return summary;
  } catch (error) {
    console.error('❌ Auto-import failed:', error.message);
    return { error: true, message: error.message };
  }
};

// Start auto-import interval
let autoImportTimer = null;
const startAutoImport = () => {
  /* log removed */

  // Run immediately on start
  autoImportNews();

  // Then run periodically
  autoImportTimer = setInterval(autoImportNews, AUTO_IMPORT_INTERVAL);
};

// MongoDB connection - accept multiple common env names for portability
const MONGO_URI = process.env.MONGODB_URI || process.env.mongodb_uri || process.env.MONGO_URI;
let mongoConnected = false;

if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(async () => {
      mongoConnected = true;
  /* log removed */
      
      // Auto-migrate posts.json if DB empty
      const count = await Post.countDocuments();
      if (count === 0 && fs.existsSync(postsFilePath)) {
        const localPosts = JSON.parse(fs.readFileSync(postsFilePath, 'utf8') || '[]');
        for (const p of localPosts) {
          const exists = p.sourceUrl ? await Post.findOne({ sourceUrl: p.sourceUrl }) : await Post.findOne({ title: p.title });
          if (!exists) {
            await Post.create({
              id: p.id || randomUUID(),
              title: p.title || 'Untitled',
              content: p.content || '',
              author: p.author || 'Unknown',
              createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
              likes: p.likes || 0,
              comments: Array.isArray(p.comments) ? p.comments : [],
              sourceUrl: p.sourceUrl || null,
              tags: Array.isArray(p.tags) ? p.tags : [],
              featuredImage: p.featuredImage || null,
            });
          }
        }
  /* log removed */
      }
      
      // Start auto-import if enabled and not running in a serverless environment (Vercel)
      if (AUTO_IMPORT_ENABLED && NEWSAPI_KEY && !IS_SERVERLESS) {
        startAutoImport();
      } else if (AUTO_IMPORT_ENABLED && NEWSAPI_KEY && IS_SERVERLESS) {
        /* log removed */
      }
    })
    .catch(err => {
      console.error('MongoDB error:', err.message);
      mongoConnected = false;
    });
}

// File storage fallback
const readPosts = () => {
  try {
    return JSON.parse(fs.readFileSync(postsFilePath, 'utf8') || '[]');
  } catch {
    return [];
  }
};

const writePosts = (posts) => {
  if (IS_SERVERLESS) {
    console.warn('⚠️  Skipping write to posts.json in serverless/production environment');
    return;
  }
  fs.writeFileSync(postsFilePath, JSON.stringify(posts, null, 2));
};

// ========== POSTS API ==========

// GET /api/posts - list with pagination, search, filters (multi-tag, date range, sort)
app.get('/api/posts', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '10')));
    const q = req.query.q?.toString().trim();
    const singleTag = req.query.tag?.toString().trim();
    const tagsParam = req.query.tags?.toString().trim();
    const author = req.query.author?.toString().trim();
    const startDateStr = req.query.startDate?.toString();
    const endDateStr = req.query.endDate?.toString();
    const sortKey = (req.query.sort || 'newest').toString();

    const tags = tagsParam ? tagsParam.split(',').map(t => t.trim()).filter(Boolean) : [];
    if (singleTag) tags.push(singleTag);

  const sort = sortKey === 'popular' ? { isPinned: -1, likes: -1, createdAt: -1 } : { isPinned: -1, createdAt: -1 };

    if (mongoConnected) {
      const filter = {};
      if (q) filter.$text = { $search: q };
      if (tags.length) filter.tags = { $all: tags };
      if (author) filter.author = author;
      if (startDateStr || endDateStr) {
        const createdAt = {};
        if (startDateStr) {
          const sd = new Date(startDateStr);
          if (!isNaN(sd.getTime())) createdAt.$gte = sd;
        }
        if (endDateStr) {
          const ed = new Date(endDateStr);
          if (!isNaN(ed.getTime())) { ed.setHours(23,59,59,999); createdAt.$lte = ed; }
        }
        if (Object.keys(createdAt).length) filter.createdAt = createdAt;
      }
      const total = await Post.countDocuments(filter);
      const posts = await Post.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean();
      return res.json({ page, limit, total, posts });
    }

    let posts = readPosts().slice().reverse();
    if (q) {
      const ql = q.toLowerCase();
      posts = posts.filter(p => (p.title || '').toLowerCase().includes(ql) || (p.content || '').toLowerCase().includes(ql));
    }
    if (tags.length) {
      posts = posts.filter(p => {
        const set = new Set((p.tags || []).map(t => String(t)));
        return tags.every(t => set.has(t));
      });
    }
    if (author) {
      posts = posts.filter(p => (p.author || '') === author);
    }
    if (startDateStr || endDateStr) {
      const sd = startDateStr ? new Date(startDateStr) : null;
      const ed = endDateStr ? new Date(endDateStr) : null;
      posts = posts.filter(p => {
        const d = new Date(p.createdAt);
        if (sd && d < sd) return false;
        if (ed) {
          const edEnd = new Date(ed);
          edEnd.setHours(23,59,59,999);
          if (d > edEnd) return false;
        }
        return true;
      });
    }
    // Sort file-based results (pinned first, then by selected key)
    posts.sort((a, b) => {
      const now = new Date();
      const aPinned = (a.isPinned === true) || (a.pinnedUntil && new Date(a.pinnedUntil) > now);
      const bPinned = (b.isPinned === true) || (b.pinnedUntil && new Date(b.pinnedUntil) > now);
      if (aPinned !== bPinned) return aPinned ? -1 : 1;
      if (sortKey === 'popular') {
        const diff = (b.likes || 0) - (a.likes || 0);
        if (diff !== 0) return diff;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    const total = posts.length;
    return res.json({ page, limit, total, posts: posts.slice((page - 1) * limit, page * limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to get posts' });
  }
});

// GET /api/posts/:id
app.get('/api/posts/:id', async (req, res) => {
  try {
    if (mongoConnected) {
      const post = await Post.findOne({ id: req.params.id }).lean();
      return post ? res.json(post) : res.status(404).json({ message: 'Not found' });
    }
    
    const post = readPosts().find(p => p.id === req.params.id);
    post ? res.json(post) : res.status(404).json({ message: 'Not found' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/posts
app.post('/api/posts', async (req, res) => {
  const { title, content, author, tags, featuredImage, isPinned, pinnedUntil, seriesId, partNumber } = req.body;
  if (!title || !content || !author) {
    return res.status(400).json({ message: 'Title, content, author required' });
  }
  
  try {
    const doc = {
      id: randomUUID(),
      title,
      content,
      author,
      createdAt: new Date(),
      likes: 0,
      reactions: { like:0, love:0, laugh:0, wow:0, sad:0, angry:0 },
      comments: [],
      tags: Array.isArray(tags) ? tags : [],
      featuredImage: featuredImage || null,
      isPinned: typeof isPinned === 'boolean' ? isPinned : false,
      pinnedUntil: pinnedUntil ? new Date(pinnedUntil) : null,
      seriesId: seriesId || null,
      partNumber: partNumber === undefined || partNumber === null ? null : Number(partNumber),
    };
    
    if (mongoConnected) {
      const created = await Post.create(doc);
      return res.status(201).json(created);
    }
    
    const posts = readPosts();
    posts.push(doc);
    writePosts(posts);
    res.status(201).json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create' });
  }
});

// PUT /api/posts/:id
app.put('/api/posts/:id', async (req, res) => {
  const { title, content, tags, featuredImage, isPinned, pinnedUntil, seriesId, partNumber } = req.body;
  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content required' });
  }
  
  try {
    if (mongoConnected) {
      const patch = { title, content, tags: tags || [], featuredImage };
      if (typeof isPinned === 'boolean') patch.isPinned = isPinned;
      if (pinnedUntil !== undefined) patch.pinnedUntil = pinnedUntil ? new Date(pinnedUntil) : null;
      if (seriesId !== undefined) patch.seriesId = seriesId || null;
      if (partNumber !== undefined) patch.partNumber = partNumber === null ? null : Number(partNumber);
      const updated = await Post.findOneAndUpdate(
        { id: req.params.id },
        patch,
        { new: true }
      ).lean();
      return updated ? res.json(updated) : res.status(404).json({ message: 'Not found' });
    }
    
    const posts = readPosts();
    const idx = posts.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Not found' });
    
    posts[idx] = { 
      ...posts[idx], 
      title, 
      content, 
      tags: tags || posts[idx].tags, 
      featuredImage: featuredImage || posts[idx].featuredImage,
      isPinned: typeof isPinned === 'boolean' ? isPinned : (posts[idx].isPinned || false),
      pinnedUntil: pinnedUntil !== undefined ? (pinnedUntil ? new Date(pinnedUntil) : null) : (posts[idx].pinnedUntil || null),
      seriesId: seriesId !== undefined ? (seriesId || null) : (posts[idx].seriesId || null),
      partNumber: partNumber !== undefined ? (partNumber === null ? null : Number(partNumber)) : (posts[idx].partNumber ?? null),
    };
    writePosts(posts);
    res.json(posts[idx]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update' });
  }
});

// DELETE /api/posts/:id
app.delete('/api/posts/:id', async (req, res) => {
  try {
    if (mongoConnected) {
      const deleted = await Post.findOneAndDelete({ id: req.params.id });
      return deleted ? res.status(204).send() : res.status(404).json({ message: 'Not found' });
    }
    
    const posts = readPosts();
    const filtered = posts.filter(p => p.id !== req.params.id);
    if (filtered.length === posts.length) return res.status(404).json({ message: 'Not found' });
    writePosts(filtered);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete' });
  }
});

// POST /api/posts/:id/like
app.post('/api/posts/:id/like', async (req, res) => {
  try {
    if (mongoConnected) {
      const updated = await Post.findOneAndUpdate({ id: req.params.id }, { $inc: { likes: 1 } }, { new: true }).lean();
      return updated ? res.json(updated) : res.status(404).json({ message: 'Not found' });
    }
    
    const posts = readPosts();
    const idx = posts.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Not found' });
    
    posts[idx].likes = (posts[idx].likes || 0) + 1;
    writePosts(posts);
    res.json(posts[idx]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to like' });
  }
});

// POST /api/posts/:id/unlike
app.post('/api/posts/:id/unlike', async (req, res) => {
  try {
    if (mongoConnected) {
      const updated = await Post.findOneAndUpdate(
        { id: req.params.id }, 
        { $inc: { likes: -1 } }, 
        { new: true }
      ).lean();
      if (!updated) return res.status(404).json({ message: 'Not found' });
      // Ensure likes doesn't go below 0
      if (updated.likes < 0) {
        updated.likes = 0;
        await Post.findOneAndUpdate({ id: req.params.id }, { likes: 0 });
      }
      return res.json(updated);
    }
    
    const posts = readPosts();
    const idx = posts.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Not found' });
    
    posts[idx].likes = Math.max(0, (posts[idx].likes || 0) - 1);
    writePosts(posts);
    res.json(posts[idx]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to unlike' });
  }
});

// POST /api/posts/:id/comments
app.post('/api/posts/:id/comments', async (req, res) => {
  const { author, content, parentId } = req.body;
  if (!author || !content) {
    return res.status(400).json({ message: 'Author and content required' });
  }
  
  try {
    const comment = { id: randomUUID(), author, content, createdAt: new Date(), parentId: parentId || null };
    
    if (mongoConnected) {
      const updated = await Post.findOneAndUpdate({ id: req.params.id }, { $push: { comments: comment } }, { new: true }).lean();
      return updated ? res.status(201).json(comment) : res.status(404).json({ message: 'Not found' });
    }
    
    const posts = readPosts();
    const idx = posts.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Not found' });
    
    posts[idx].comments = posts[idx].comments || [];
    posts[idx].comments.push(comment);
    writePosts(posts);
    res.status(201).json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to comment' });
  }
});

// GET /api/series/:seriesId - list posts in a series, sorted by partNumber then createdAt
app.get('/api/series/:seriesId', async (req, res) => {
  try {
    const sid = req.params.seriesId;
    if (mongoConnected) {
      const posts = await Post.find({ seriesId: sid }).sort({ partNumber: 1, createdAt: 1 }).lean();
      return res.json({ seriesId: sid, total: posts.length, posts });
    }
    let posts = readPosts().filter(p => p.seriesId === sid);
    posts.sort((a,b) => (a.partNumber ?? Infinity) - (b.partNumber ?? Infinity) || (new Date(a.createdAt) - new Date(b.createdAt)));
    return res.json({ seriesId: sid, total: posts.length, posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to get series' });
  }
});

// POST /api/posts/:id/react - add/switch/remove a reaction
// Body: { type?: 'like'|'love'|'laugh'|'wow'|'sad'|'angry', prevType?: same as type }
app.post('/api/posts/:id/react', async (req, res) => {
  try {
    const allowed = ['like','love','laugh','wow','sad','angry'];
    const { type, prevType } = req.body || {};
    if (!type && !prevType) return res.status(400).json({ message: 'type or prevType required' });
    if (type && !allowed.includes(type)) return res.status(400).json({ message: 'Invalid reaction type' });
    if (prevType && !allowed.includes(prevType)) return res.status(400).json({ message: 'Invalid prevType' });

    if (mongoConnected) {
      const inc = {};
      if (type) inc[`reactions.${type}`] = 1;
      if (prevType && prevType !== type) inc[`reactions.${prevType}`] = (inc[`reactions.${prevType}`] || 0) - 1;
      if (!type && prevType) inc[`reactions.${prevType}`] = -1;

      const updated = await Post.findOneAndUpdate(
        { id: req.params.id },
        { $inc: inc },
        { new: true }
      ).lean();
      if (!updated) return res.status(404).json({ message: 'Not found' });

      // Clamp negatives to zero if any
      const r = updated.reactions || {};
      let needsClamp = false;
      for (const k of allowed) {
        if (r[k] < 0) { r[k] = 0; needsClamp = true; }
      }
      if (needsClamp) {
        await Post.findOneAndUpdate({ id: req.params.id }, { reactions: r });
        updated.reactions = r;
      }
      return res.json(updated);
    }

    // File-based
    const posts = readPosts();
    const idx = posts.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Not found' });
    const p = posts[idx];
    p.reactions = p.reactions || { like:0, love:0, laugh:0, wow:0, sad:0, angry:0 };
    if (type) p.reactions[type] = (p.reactions[type] || 0) + 1;
    if (prevType && prevType !== type) p.reactions[prevType] = Math.max(0, (p.reactions[prevType] || 0) - 1);
    if (!type && prevType) p.reactions[prevType] = Math.max(0, (p.reactions[prevType] || 0) - 1);
    posts[idx] = p;
    writePosts(posts);
    res.json(p);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to react' });
  }
});

// ========== TAGS ENDPOINTS ==========
// GET /api/tags/trending - return top tags with counts
app.get('/api/tags/trending', async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20')));

    if (mongoConnected) {
      const agg = await Post.aggregate([
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit },
      ]);
      const tags = agg.map(r => ({ tag: r._id, count: r.count }));
      return res.json({ tags });
    }

    const posts = readPosts();
    const counts = {};
    for (const p of posts) {
      for (const t of (p.tags || [])) {
        const key = String(t).toLowerCase();
        counts[key] = (counts[key] || 0) + 1;
      }
    }
    const tags = Object.entries(counts)
      .sort((a,b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));
    res.json({ tags });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to get trending tags' });
  }
});

// ========== NEWSAPI ENDPOINTS ==========

// GET /api/news/search
app.get('/api/news/search', async (req, res) => {
  try {
    if (!NEWSAPI_KEY) return res.status(500).json({ message: 'API key not configured' });

    let { q, from, to, sortBy, language } = req.query;
    // Basic sanitation per NewsAPI constraints
    const now = new Date();
    const maxPastMs = 29 * 24 * 60 * 60 * 1000; // ~29 days to stay under 30-day cap
    const clampDate = (d) => new Date(Math.min(new Date(d).getTime(), now.getTime()));
    const toDate = to ? clampDate(to) : now;
    let fromDate = from ? new Date(from) : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (isNaN(fromDate.getTime())) fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    // Enforce max lookback
    if (now.getTime() - fromDate.getTime() > maxPastMs) fromDate = new Date(now.getTime() - maxPastMs);
    // Ensure ordering
    if (fromDate > toDate) fromDate = new Date(toDate.getTime() - 24 * 60 * 60 * 1000);

    const toISO = toDate.toISOString().slice(0, 10);
    const fromISO = fromDate.toISOString().slice(0, 10);

    const params = new URLSearchParams({ apiKey: NEWSAPI_KEY });
    if (q) params.set('q', String(q).trim());
    params.set('from', fromISO);
    params.set('to', toISO);
    if (sortBy) params.set('sortBy', String(sortBy));
    if (language) params.set('language', String(language));

    const url = `https://newsapi.org/v2/everything?${params}`;
    const data = await fetchFromNewsAPI(url);
    res.json({ ...data, _sanitized: { from: fromISO, to: toISO } });
  } catch (err) {
    console.error(err);
    const match = err.message.match(/^NewsAPI error (\d+): (.*)$/s);
    if (match) {
      const status = parseInt(match[1]) || 500;
      let details = match[2];
      try { details = JSON.parse(details); } catch {}
      return res.status(status).json({ message: 'NewsAPI error', details });
    }
    res.status(500).json({ message: 'Failed to fetch news', error: err.message });
  }
});

// GET /api/news/top-headlines
app.get('/api/news/top-headlines', async (req, res) => {
  try {
    if (!NEWSAPI_KEY) return res.status(500).json({ message: 'API key not configured' });
    
    const { country, category, sources, language } = req.query;
    
    if (sources && (country || category)) {
      return res.status(400).json({ message: 'Cannot mix sources with country/category' });
    }
    
    const params = new URLSearchParams({ apiKey: NEWSAPI_KEY });
    if (country) params.set('country', country);
    if (category) params.set('category', category);
    if (sources) params.set('sources', sources);
    if (language) params.set('language', language);
    
    const url = `https://newsapi.org/v2/top-headlines?${params}`;
    const data = await fetchFromNewsAPI(url);
    res.json(data);
  } catch (err) {
    console.error(err);
    const match = err.message.match(/^NewsAPI error (\d+): (.*)$/s);
    if (match) {
      const status = parseInt(match[1]) || 500;
      let details = match[2];
      try { details = JSON.parse(details); } catch {}
      return res.status(status).json({ message: 'NewsAPI error', details });
    }
    res.status(500).json({ message: 'Failed to fetch headlines', error: err.message });
  }
});

// POST /api/news/import
app.post('/api/news/import', async (req, res) => {
  try {
    if (!NEWSAPI_KEY) return res.status(500).json({ message: 'API key not configured' });
    
    const { q, from, to, sortBy, country, category, sources } = { ...req.query, ...req.body };
    
    let url;
    if (country || category || sources) {
      if (sources && (country || category)) {
        return res.status(400).json({ message: 'Cannot mix sources with country/category' });
      }
      const params = new URLSearchParams({ apiKey: NEWSAPI_KEY });
      if (country) params.set('country', country);
      if (category) params.set('category', category);
      if (sources) params.set('sources', sources);
      url = `https://newsapi.org/v2/top-headlines?${params}`;
    } else {
      // Sanitize everything params like in /api/news/search
      const now = new Date();
      const maxPastMs = 29 * 24 * 60 * 60 * 1000;
      const clampDate = (d) => new Date(Math.min(new Date(d).getTime(), now.getTime()));
      const toDate = to ? clampDate(to) : now;
      let fromDate = from ? new Date(from) : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (isNaN(fromDate.getTime())) fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (now.getTime() - fromDate.getTime() > maxPastMs) fromDate = new Date(now.getTime() - maxPastMs);
      if (fromDate > toDate) fromDate = new Date(toDate.getTime() - 24 * 60 * 60 * 1000);

      const toISO = toDate.toISOString().slice(0, 10);
      const fromISO = fromDate.toISOString().slice(0, 10);

      const params = new URLSearchParams({ apiKey: NEWSAPI_KEY });
      if (q) params.set('q', String(q).trim());
      params.set('from', fromISO);
      params.set('to', toISO);
      if (sortBy) params.set('sortBy', String(sortBy));
      url = `https://newsapi.org/v2/everything?${params}`;
    }
    
    const data = await fetchFromNewsAPI(url);
    const articles = data.articles || [];
    const imported = [];
    
    for (const a of articles) {
      if (mongoConnected) {
        const exists = a.url ? await Post.findOne({ sourceUrl: a.url }) : await Post.findOne({ title: a.title });
        if (exists) continue;
        
        const created = await Post.create({
          id: randomUUID(),
          title: a.title || 'Untitled',
          content: `${a.description || ''}\n\n${a.content || ''}`,
          author: a.author || a.source?.name || 'News',
          createdAt: a.publishedAt ? new Date(a.publishedAt) : new Date(),
          likes: 0,
          reactions: { like:0, love:0, laugh:0, wow:0, sad:0, angry:0 },
          comments: [],
          sourceUrl: a.url,
          tags: extractTags(a),
          featuredImage: a.urlToImage,
        });
        imported.push(created);
      } else {
        const posts = readPosts();
        if (a.url && posts.some(p => p.sourceUrl === a.url)) continue;
        
        const newPost = {
          id: randomUUID(),
          title: a.title || 'Untitled',
          content: `${a.description || ''}\n\n${a.content || ''}`,
          author: a.author || a.source?.name || 'News',
          createdAt: a.publishedAt || new Date().toISOString(),
          likes: 0,
          comments: [],
          sourceUrl: a.url,
          tags: extractTags(a),
          featuredImage: a.urlToImage,
        };
        posts.push(newPost);
        imported.push(newPost);
        writePosts(posts);
      }
    }
    
    res.json({ imported: imported.length, posts: imported });
  } catch (err) {
    console.error(err);
    const match = err.message.match(/^NewsAPI error (\d+): (.*)$/s);
    if (match) {
      const status = parseInt(match[1]) || 500;
      let details = match[2];
      try { details = JSON.parse(details); } catch {}
      return res.status(status).json({ message: 'NewsAPI error', details });
    }
    res.status(500).json({ message: 'Failed to import', error: err.message });
  }
});

// POST /api/news/import-batch - serverless-friendly batch import for default categories
app.post('/api/news/import-batch', async (req, res) => {
  try {
    if (!NEWSAPI_KEY) return res.status(500).json({ message: 'API key not configured' });
    const result = await autoImportNews();
    if (result?.error) return res.status(500).json({ message: 'Batch import failed', details: result.message });
    if (result?.skipped) return res.status(200).json({ message: 'Skipped', reason: result.reason });
    return res.json({ message: 'Batch import completed', ...result });
  } catch (err) {
    console.error('Batch import error:', err.message);
    res.status(500).json({ message: 'Failed to import batch', error: err.message });
  }
});

// --- AI Routes (Gemini) ---
app.post('/api/ai/generate', async (req, res) => {
  try {
    if (!geminiClient) return res.status(500).json({ message: 'Gemini not configured' });
    const { prompt, model } = req.body || {};
    if (!prompt) return res.status(400).json({ message: 'Prompt is required' });
    const m = geminiClient.getGenerativeModel({ model: model || 'gemini-2.0-flash' });
    const out = await m.generateContent(prompt);
    const text = out.response?.text?.() || out.response?.candidates?.[0]?.content?.parts?.map(p=>p.text).join('\n') || '';
    res.json({ text });
  } catch (e) {
    console.error('AI generate failed:', e);
    res.status(500).json({ message: 'AI generate failed', error: String(e.message || e) });
  }
});

app.post('/api/ai/summarize', async (req, res) => {
  try {
    if (!geminiClient) return res.status(500).json({ message: 'Gemini not configured' });
    const { content, length } = req.body || {};
    if (!content) return res.status(400).json({ message: 'Content is required' });
    const m = geminiClient.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `Summarize the following text in ${length || 3} sentences, concise and clear.\n\n${content}`;
    const out = await m.generateContent(prompt);
    const text = out.response?.text?.() || '';
    res.json({ summary: text });
  } catch (e) {
    console.error('AI summarize failed:', e);
    res.status(500).json({ message: 'AI summarize failed', error: String(e.message || e) });
  }
});

app.post('/api/ai/tags', async (req, res) => {
  try {
    if (!geminiClient) return res.status(500).json({ message: 'Gemini not configured' });
    const { title, content } = req.body || {};
    if (!title && !content) return res.status(400).json({ message: 'Title or content required' });
    const m = geminiClient.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `Generate 5 relevant, short tags as a comma-separated list for this blog post. Avoid duplicates and generic words.\n\nTitle: ${title || ''}\n\nContent: ${(content || '').slice(0, 1500)}`;
    const out = await m.generateContent(prompt);
    const text = out.response?.text?.() || '';
    const tags = text.split(/[\n,]+/).map(t => t.trim().toLowerCase()).filter(Boolean);
    const unique = Array.from(new Set(tags)).slice(0, 8);
    res.json({ tags: unique });
  } catch (e) {
    console.error('AI tags failed:', e);
    res.status(500).json({ message: 'AI tags failed', error: String(e.message || e) });
  }
});

// ========== AUTH & USERS ==========

const setSession = (res, user) => {
  const token = jwt.sign({ uid: user.uid, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  const sameSiteOpt = (process.env.COOKIE_SAMESITE || (IS_SERVERLESS ? 'none' : 'lax')).toLowerCase();
  const sameSite = ['lax','strict','none'].includes(sameSiteOpt) ? sameSiteOpt : 'lax';
  res.cookie('session', token, {
    httpOnly: true,
    sameSite,
    secure: (process.env.NODE_ENV === 'production') || IS_SERVERLESS, // set true in production with HTTPS
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

// Helper: Send welcome email
const sendWelcomeEmail = async (email, name) => {
  if (!mailTransporter) return;
  try {
    await mailTransporter.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject: '🎉 Welcome to ModernBlog!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px;">
          <h1 style="text-align: center; margin-bottom: 20px;">Welcome to ModernBlog! 🎊</h1>
          <p style="font-size: 16px; line-height: 1.6;">Hi ${name || 'there'},</p>
          <p style="font-size: 16px; line-height: 1.6;">
            Thank you for joining ModernBlog! We're thrilled to have you as part of our community.
          </p>
          <p style="font-size: 16px; line-height: 1.6;">
            You now have full access to:
          </p>
          <ul style="font-size: 16px; line-height: 1.8;">
            <li>📰 Read unlimited news articles</li>
            <li>✍️ Create and publish your own blog posts</li>
            <li>💬 Comment on posts and engage with other readers</li>
            <li>❤️ Like and react to your favorite content</li>
            <li>👥 Follow your favorite authors</li>
          </ul>
          <p style="font-size: 16px; line-height: 1.6;">
            Start exploring and share your thoughts with the world!
          </p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="http://localhost:3000" style="display: inline-block; padding: 12px 30px; background: white; color: #667eea; text-decoration: none; border-radius: 5px; font-weight: bold;">Visit ModernBlog</a>
          </div>
          <p style="font-size: 14px; text-align: center; margin-top: 30px; opacity: 0.8;">
            Happy reading and writing! 📚✨
          </p>
        </div>
      `
    });
  /* log removed */
  } catch (err) {
    console.error('Failed to send welcome email:', err.message);
  }
};

const getUserFromReq = async (req) => {
  try {
    const token = req.cookies?.session;
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded?.uid) return null;
    
    if (mongoConnected) {
      const u = await User.findOne({ uid: decoded.uid }).lean();
      return u;
    }
    
    // file-based fallback
    const usersFile = path.join(__dirname, 'users.json');
    if (fs.existsSync(usersFile)) {
      const arr = JSON.parse(fs.readFileSync(usersFile, 'utf8') || '[]');
      return arr.find(x => x.uid === decoded.uid) || null;
    }
    return null;
  } catch {
    return null;
  }
};

// POST /api/auth/signup - email/password sign-up
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    
    const emailLower = email.toLowerCase().trim();
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    
    // Check if user already exists
    let existingUser;
    if (mongoConnected) {
      existingUser = await User.findOne({ email: emailLower });
    } else {
  const usersFile = path.join(__dirname, 'users.json');
  const arr = fs.existsSync(usersFile) ? JSON.parse(fs.readFileSync(usersFile, 'utf8') || '[]') : [];
  existingUser = arr.find(x => x.email === emailLower);
    }
    
    if (existingUser) return res.status(400).json({ message: 'Email already registered' });
    
    // Hash password
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);
    const uid = crypto.randomUUID();
    const userName = name || emailLower.split('@')[0];
    
    let user;
    if (mongoConnected) {
      user = await User.create({
        uid,
        email: emailLower,
        name: userName,
        password: hashedPassword,
        provider: 'email',
        emailVerified: false,
        followingAuthors: []
      });
      user = user.toObject();
    } else {
      user = {
        uid,
        email: emailLower,
        name: userName,
        password: hashedPassword,
        provider: 'email',
        emailVerified: false,
        followingAuthors: [],
        createdAt: new Date()
      };
      const usersFile = path.join(__dirname, 'users.json');
      const arr = fs.existsSync(usersFile) ? JSON.parse(fs.readFileSync(usersFile, 'utf8') || '[]') : [];
      arr.push(user);
      if (IS_SERVERLESS) {
        console.warn('⚠️  Skipping users.json write in serverless/production environment');
      } else {
        fs.writeFileSync(usersFile, JSON.stringify(arr, null, 2));
      }
    }
    
    // Send welcome email
    sendWelcomeEmail(emailLower, userName);
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    setSession(res, userWithoutPassword);
    return res.json({ user: userWithoutPassword });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ message: 'Sign-up failed' });
  }
});

// POST /api/auth/signin - email/password sign-in
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    
    const emailLower = email.toLowerCase().trim();
    
    let user;
    if (mongoConnected) {
      user = await User.findOne({ email: emailLower }).lean();
    } else {
  const usersFile = path.join(__dirname, 'users.json');
  const arr = fs.existsSync(usersFile) ? JSON.parse(fs.readFileSync(usersFile, 'utf8') || '[]') : [];
  user = arr.find(x => x.email === emailLower);
    }
    
    if (!user || user.provider !== 'email') {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Verify password
    const bcrypt = require('bcrypt');
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    setSession(res, userWithoutPassword);
    return res.json({ user: userWithoutPassword });
  } catch (err) {
    console.error('Sign-in error:', err.message);
    res.status(500).json({ message: 'Sign-in failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('session', { httpOnly: true, sameSite: 'lax' });
  res.status(204).send();
});

app.get('/api/auth/me', async (req, res) => {
  const user = await getUserFromReq(req);
  if (!user) return res.status(401).json({ message: 'Not authenticated' });
  res.json({ user });
});

// POST /api/users/follow - toggle following an author
app.post('/api/users/follow', async (req, res) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ message: 'Not authenticated' });
    const author = (req.body?.author || '').trim();
    if (!author) return res.status(400).json({ message: 'author required' });
    
    const toggle = (list) => {
      const has = list.includes(author);
      return has ? list.filter(a => a !== author) : [author, ...list];
    };
    
    if (mongoConnected) {
      const updated = await User.findOneAndUpdate(
        { uid: user.uid },
        { $set: { followingAuthors: toggle(user.followingAuthors || []) } },
        { new: true }
      ).lean();
      return res.json({ followingAuthors: updated.followingAuthors || [] });
    } else {
      const usersFile = path.join(__dirname, 'users.json');
      const arr = fs.existsSync(usersFile) ? JSON.parse(fs.readFileSync(usersFile, 'utf8') || '[]') : [];
      const idx = arr.findIndex(x => x.uid === user.uid);
      if (idx === -1) return res.status(404).json({ message: 'User not found' });
      arr[idx].followingAuthors = toggle(arr[idx].followingAuthors || []);
      if (IS_SERVERLESS) {
        console.warn('⚠️  Skipping users.json write in serverless/production environment');
      } else {
        fs.writeFileSync(usersFile, JSON.stringify(arr, null, 2));
      }
      return res.json({ followingAuthors: arr[idx].followingAuthors });
    }
  } catch (e) {
    console.error('Follow error:', e.message);
    res.status(500).json({ message: 'Failed to follow' });
  }
});

// GET /api/status - Check auto-import status
app.get('/api/status', (req, res) => {
  res.json({
    autoImport: {
      enabled: AUTO_IMPORT_ENABLED,
      interval: AUTO_IMPORT_INTERVAL,
      intervalMinutes: AUTO_IMPORT_INTERVAL / 1000 / 60,
      running: autoImportTimer !== null,
    },
    database: {
      connected: mongoConnected,
      type: mongoConnected ? 'MongoDB' : 'File-based',
    },
    newsAPI: {
      configured: !!NEWSAPI_KEY,
    },
    ai: {
      geminiConfigured: !!GEMINI_API_KEY,
    }
  });
});

if (!IS_SERVERLESS) {
  app.listen(PORT, () => {
    /* log removed */
  });
} else {
  module.exports = app; // Export Express app for Vercel serverless
}
