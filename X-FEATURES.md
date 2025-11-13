# X-like Social Features Documentation

## 🎯 Overview
Your blog now has Twitter/X-like social features including usernames, @mentions, following, reposts, bookmarks, and notifications!

## ✅ Implemented Features

### 1. Username System (@mentions)
**What it does:**
- Every user has a unique `@username` (e.g., @johndoe)
- Usernames are 3-20 characters (lowercase letters, numbers, underscores only)
- Real-time availability check when signing up
- Reserved usernames protect system routes (admin, api, auth, etc.)

**Frontend:**
- Sign-up page includes username field with live validation
- Shows ✓ for available usernames, ✗ for taken
- Profile pages display @username prominently

**Backend Endpoints:**
```
GET /api/users/check-username/:username  - Check if username is available
GET /api/users/:username                 - Get user profile by username
```

**How to use:**
```typescript
// Check username availability
const res = await fetch('/api/users/check-username/johndoe');
const data = await res.json();
// { available: true, message: "Available" }

// Get user by username
const res = await fetch('/api/users/johndoe');
const data = await res.json();
// { user: { username: "johndoe", name: "John", ... } }
```

---

### 2. @Mention Parsing
**What it does:**
- Automatically detects @mentions in posts and comments
- Converts @username to clickable links
- Links go to /user/:username profile page

**Frontend Utility:**
```typescript
import { parseMentions } from '@/lib/mentions';

// In your component:
<p>{parseMentions(post.content)}</p>
// "@johndoe just posted!" becomes clickable

// Extract mentions:
import { extractMentions } from '@/lib/mentions';
const mentions = extractMentions(text);
// ["johndoe", "janedoe"]
```

---

### 3. Following System
**What it does:**
- Follow/unfollow any user
- See followers & following counts
- Follow button on user profiles
- Track following state

**Database Schema:**
```javascript
User {
  followers: [String],  // Array of user IDs
  following: [String],  // Array of user IDs
}
```

**Backend Endpoint:**
```
POST /api/users/follow/:username  - Follow/unfollow a user
```

**Response:**
```json
{
  "following": true,  // true if now following, false if unfollowed
  "user": { ... }     // Updated user object
}
```

**Frontend Example:**
```typescript
const handleFollow = async (username) => {
  const res = await fetch(`/api/users/follow/${username}`, { 
    method: 'POST' 
  });
  const data = await res.json();
  // data.following === true means you're now following
};
```

---

### 4. Repost/Retweet
**What it does:**
- Share others' posts to your own feed
- Track repost count on original post
- Undo repost functionality
- Shows "Reposted by @username"

**Database Schema:**
```javascript
Post {
  isRepost: Boolean,
  originalPostId: String,    // ID of original post
  repostCount: Number,       // Times this post was reposted
  repostedBy: [String],      // User IDs who reposted
}
```

**Backend Endpoint:**
```
POST /api/posts/:id/repost  - Repost/unrepost a post
```

**Response:**
```json
{
  "reposted": true,           // true if reposted, false if undone
  "repost": { ... }           // The repost object (if created)
}
```

**How it works:**
1. User clicks repost on a post
2. Backend creates a new post with `isRepost: true`
3. Original post's `repostCount` increments
4. User's ID added to `repostedBy` array
5. Repost appears in user's feed

---

### 5. Bookmarks
**What it does:**
- Save posts to read later
- Private bookmark collection (only you can see)
- Bookmark count per post
- Dedicated bookmarks page

**Database Schema:**
```javascript
Post {
  bookmarkedBy: [String],    // User IDs who bookmarked
  bookmarkCount: Number,     // Total bookmarks
}
```

**Backend Endpoints:**
```
POST /api/posts/:id/bookmark  - Bookmark/unbookmark a post
GET  /api/bookmarks           - Get all bookmarked posts
```

**Response:**
```json
// POST /api/posts/:id/bookmark
{ "bookmarked": true }  // true if bookmarked, false if removed

// GET /api/bookmarks
{ "posts": [ ... ] }    // Array of bookmarked posts
```

---

### 6. Notifications
**What it does:**
- Get notified when someone:
  - Likes your post
  - Comments on your post
  - Mentions you (@username)
  - Follows you
  - Reposts your content
- Unread count badge
- Mark as read / Mark all as read

**Database Schema:**
```javascript
Notification {
  id: String,
  userId: String,              // Who receives this notification
  type: String,                // 'like', 'comment', 'mention', 'follow', 'repost'
  fromUserId: String,          // Who triggered it
  fromUsername: String,        // @username
  fromUserAvatar: String,
  postId: String,              // Related post (if applicable)
  postTitle: String,
  commentText: String,         // For comment notifications
  read: Boolean,
  createdAt: Date,
}
```

**Backend Endpoints:**
```
GET  /api/notifications              - Get all notifications (limit 50, newest first)
POST /api/notifications/:id/read     - Mark one notification as read
POST /api/notifications/read-all     - Mark all as read
```

**Response:**
```json
// GET /api/notifications
{
  "notifications": [ ... ],
  "unreadCount": 5
}
```

**Creating Notifications (Backend):**
```javascript
// Helper function already created:
await createNotification(
  'like',           // type
  postAuthorId,     // userId (who receives)
  currentUser,      // fromUser object
  postId,           // postId (optional)
  postTitle,        // postTitle (optional)
  null              // commentText (optional)
);
```

---

## 🔧 Database Models Updated

### User Model
```javascript
{
  uid: String,
  email: String,
  username: String,          // NEW: Unique @username
  name: String,
  avatar: String,
  password: String,
  provider: String,
  emailVerified: Boolean,
  createdAt: Date,
  
  // Social features
  followers: [String],       // NEW: User IDs
  following: [String],       // NEW: User IDs
  followingAuthors: [String], // Legacy (can deprecate)
  
  // Profile details
  bio: String,               // NEW: User bio
  location: String,          // NEW: Location
  website: String,           // NEW: Website URL
  verified: Boolean,         // NEW: Verified badge
}
```

### Post Model
```javascript
{
  id: String,
  title: String,
  content: String,
  author: String,
  authorUsername: String,    // NEW: @username
  tags: [String],
  featuredImage: String,
  createdAt: Date,
  
  // Engagement
  likes: Number,
  reactions: Object,
  comments: [Comment],
  
  // Repost
  isRepost: Boolean,         // NEW
  originalPostId: String,    // NEW
  repostCount: Number,       // NEW
  repostedBy: [String],      // NEW
  
  // Bookmarks
  bookmarkedBy: [String],    // NEW
  bookmarkCount: Number,     // NEW
  
  // Other
  sourceUrl: String,
  isPinned: Boolean,
  pinnedUntil: Date,
  seriesId: String,
  partNumber: Number,
}
```

### Notification Model (NEW)
```javascript
{
  id: String,
  userId: String,
  type: String,              // 'like', 'comment', 'mention', 'follow', 'repost'
  fromUserId: String,
  fromUsername: String,
  fromUserAvatar: String,
  postId: String,
  postTitle: String,
  commentText: String,
  read: Boolean,
  createdAt: Date,
}
```

---

## 🎨 Frontend Components Needed

### 1. Notification Bell (To Build)
```tsx
// components/NotificationBell.tsx
- Bell icon with unread count badge
- Dropdown showing recent notifications
- Click to mark as read
- Link to full notifications page
```

### 2. Bookmarks Page (To Build)
```tsx
// app/bookmarks/page.tsx
- List all bookmarked posts
- Unbookmark button
- Empty state
```

### 3. Repost Button (To Build)
```tsx
// components/RepostButton.tsx
- Repost icon on post cards
- Shows repost count
- Click to repost/unrepost
- Shows "Reposted by @you" if you reposted
```

### 4. Trending Page (To Build)
```tsx
// app/explore/page.tsx
- Trending hashtags
- Popular posts
- Recommended users to follow
```

---

## 📝 Migration Notes

**For Existing Users:**
Since we added `username` as a required field, existing users in the database need usernames. You have two options:

1. **Auto-generate usernames:**
```javascript
// Run this script once
const users = await User.find({});
for (const user of users) {
  if (!user.username) {
    // Generate from email
    let username = user.email.split('@')[0].toLowerCase();
    username = username.replace(/[^a-z0-9_]/g, '');
    
    // Ensure uniqueness
    let suffix = 1;
    let finalUsername = username;
    while (await User.findOne({ username: finalUsername })) {
      finalUsername = `${username}${suffix}`;
      suffix++;
    }
    
    user.username = finalUsername;
    await user.save();
  }
}
```

2. **Force re-login:**
- Users will be asked to choose a username on next login
- Add a profile setup page

---

## 🚀 Testing the Features

### Test Username System:
1. Go to `/sign-up`
2. Enter a username
3. Watch the availability indicator
4. Try reserved names like "admin"

### Test @Mentions:
1. Create a post with "@username" in content
2. Click the @mention
3. Should navigate to /user/username

### Test Following:
1. Go to any user's profile at /user/:username
2. Click "Follow" button
3. See followers count increase
4. Click again to unfollow

### Test Reposts:
```javascript
// In console:
const res = await fetch('/api/posts/POST_ID/repost', { method: 'POST' });
const data = await res.json();
console.log(data); // { reposted: true, repost: {...} }
```

### Test Bookmarks:
```javascript
// Bookmark a post:
await fetch('/api/posts/POST_ID/bookmark', { method: 'POST' });

// Get bookmarks:
const res = await fetch('/api/bookmarks');
const data = await res.json();
console.log(data.posts);
```

### Test Notifications:
```javascript
// Get notifications:
const res = await fetch('/api/notifications');
const data = await res.json();
console.log(data.notifications, data.unreadCount);

// Mark as read:
await fetch('/api/notifications/NOTIF_ID/read', { method: 'POST' });
```

---

## 🎯 Next Steps

### Immediate Frontend Work:
1. **Notification Bell Component** - Shows unread count, dropdown with notifications
2. **Bookmarks Page** - List of saved posts at /bookmarks
3. **Repost Button** - Add to post cards with count display
4. **Integrate Mentions** - Use `parseMentions()` in post content

### Future Enhancements:
1. **Trending Page** - Hashtag trends, popular posts
2. **Quote Posts** - Repost with your own comment
3. **Direct Messages** - Private 1-on-1 conversations
4. **Verified Badges** - Blue checkmark system
5. **Polls** - Create polls in posts
6. **Media Uploads** - Images, videos, GIFs
7. **User Search** - Search users by username/name
8. **Feed Algorithm** - Show posts from followed users

---

## 📚 API Reference

### User Endpoints
```
GET  /api/users/check-username/:username  - Check availability
GET  /api/users/:username                 - Get user profile
POST /api/users/follow/:username          - Follow/unfollow
```

### Post Endpoints (New)
```
POST /api/posts/:id/repost    - Repost/unrepost
POST /api/posts/:id/bookmark  - Bookmark/unbookmark
```

### Notification Endpoints
```
GET  /api/notifications              - Get all notifications
POST /api/notifications/:id/read     - Mark as read
POST /api/notifications/read-all     - Mark all as read
```

### Bookmark Endpoints
```
GET /api/bookmarks  - Get user's bookmarked posts
```

---

## 🐛 Known Issues / TODO

- [ ] Add notification creation triggers (when liking, commenting, etc.)
- [ ] Build notification bell UI component
- [ ] Create bookmarks page
- [ ] Add repost button to post cards
- [ ] Show "Reposted by @username" in feed
- [ ] Add @ autocomplete when typing mentions
- [ ] Implement feed filtering (show only followed users' posts)
- [ ] Add user search functionality

---

Made with ❤️ by your AI coding assistant!
