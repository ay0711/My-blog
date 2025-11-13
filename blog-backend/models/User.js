const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  uid: { type: String, required: true }, // Removed unique: true to avoid duplicate with index below
  email: { type: String, required: true }, // Removed unique: true to avoid duplicate with index below
  username: { type: String, required: true }, // Unique @username for mentions
  name: { type: String, default: '' },
  avatar: { type: String, default: '' },
  password: { type: String }, // For email/password auth (hashed)
  provider: { type: String, default: 'email' }, // 'google', 'email'
  emailVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  followingAuthors: { type: [String], default: [] },
  followers: { type: [String], default: [] }, // Array of user IDs who follow this user
  following: { type: [String], default: [] }, // Array of user IDs this user follows
  bio: { type: String, default: '' }, // User bio/description
  location: { type: String, default: '' },
  website: { type: String, default: '' },
  verified: { type: Boolean, default: false }, // Verified badge
});

UserSchema.index({ uid: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true });

module.exports = mongoose.model('User', UserSchema);
