const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  id: { type: String, required: true },
  author: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  parentId: { type: String, default: null }, // optional for threading
});

const PostSchema = new mongoose.Schema({
  id: { type: String, required: true }, // Removed unique: true to avoid duplicate with index below
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  // tags allow simple categorization and filtering on the frontend
  tags: { type: [String], default: [] },
  // optional featured image URL for richer UI
  featuredImage: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  // pinning & series
  isPinned: { type: Boolean, default: false },
  pinnedUntil: { type: Date, default: null },
  seriesId: { type: String, default: null },
  partNumber: { type: Number, default: null },
  likes: { type: Number, default: 0 },
  reactions: {
    like: { type: Number, default: 0 },
    love: { type: Number, default: 0 },
    laugh: { type: Number, default: 0 },
    wow: { type: Number, default: 0 },
    sad: { type: Number, default: 0 },
    angry: { type: Number, default: 0 },
  },
  comments: { type: [CommentSchema], default: [] },
  sourceUrl: { type: String, default: null },
});

// Indexes for faster lookup
PostSchema.index({ id: 1 }, { unique: true });
PostSchema.index({ sourceUrl: 1 });
PostSchema.index({ title: 'text', content: 'text' });
PostSchema.index({ tags: 1 });

module.exports = mongoose.model('Post', PostSchema);
