const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  uid: { type: String, required: true }, // Removed unique: true to avoid duplicate with index below
  email: { type: String, required: true }, // Removed unique: true to avoid duplicate with index below
  name: { type: String, default: '' },
  avatar: { type: String, default: '' },
  password: { type: String }, // For email/password auth (hashed)
  provider: { type: String, default: 'email' }, // 'google', 'email'
  emailVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  followingAuthors: { type: [String], default: [] },
});

UserSchema.index({ uid: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('User', UserSchema);
