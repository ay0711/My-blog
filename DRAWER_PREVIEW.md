# Mobile Drawer Preview

## Current Implementation

The hamburger menu drawer is set to **280px wide** which should be visible on all mobile screens.

### Visual Layout (on a 375px wide phone):

```
┌─────────────────────────────────────┐
│  ☰  ModernBlog              🔔      │  <- Navbar (sticky)
├─────────────────────────────────────┤
│                                     │
│  When hamburger clicked:            │
│                                     │
│  ┌──────────────────┐               │
│  │                  │               │  <- Drawer (280px wide)
│  │  ModernBlog   ✕  │               │
│  │                  │               │
│  │  🏠 Home         │               │
│  │                  │               │
│  │  📈 Explore      │               │
│  │                  │               │
│  │  ➕ Create       │               │
│  │                  │               │
│  │  📄 News         │               │
│  │                  │               │
│  │  🔖 Bookmarks    │               │
│  │                  │               │
│  │  ───────────     │               │
│  │                  │               │
│  │  🌙 Dark Mode    │               │
│  │                  │               │
│  │  👤 Profile/Auth │               │
│  │                  │               │
│  └──────────────────┘               │
│         │                           │
│         └─> Black overlay (backdrop)
│                                     │
└─────────────────────────────────────┘
```

### Screen Size Examples:

**iPhone SE (375px):**
- Drawer: 280px (74% of screen)
- Remaining: 95px visible on right (backdrop)

**iPhone 14 (390px):**
- Drawer: 280px (72% of screen)
- Remaining: 110px visible on right

**Samsung Galaxy (360px):**
- Drawer: 280px (78% of screen)
- Remaining: 80px visible on right

## If Still Too Small

If 280px still looks too small, we can:

1. **Increase to 85% of viewport:**
   - Change from `w-[280px]` to `w-[85vw] max-w-[350px]`
   - This gives: 319px on 375px phone, 332px on 390px phone

2. **Match X/Twitter exactly:**
   - X uses approximately 85% on mobile
   - Would be `w-[85vw]` with no max-width

Let me know which option you prefer or test the current 280px implementation first!
