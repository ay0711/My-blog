const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  id: { type: String, required: true },
  userId: { type: String, required: true }, // User who receives the notification
  type: { 
    type: String, 
    required: true,
    enum: ['like', 'comment', 'mention', 'follow', 'repost'] 
  },
  fromUserId: { type: String, required: true }, // User who triggered the notification
  fromUsername: { type: String, required: true },
  fromUserAvatar: { type: String, default: null },
  postId: { type: String, default: null }, // Related post (if applicable)
  postTitle: { type: String, default: null },
  commentText: { type: String, default: null }, // For comment notifications
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ id: 1 }, { unique: true });

module.exports = mongoose.model('Notification', NotificationSchema);
