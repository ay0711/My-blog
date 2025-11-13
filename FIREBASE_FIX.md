# Fix for Google Sign-In 401 Error

## ✅ COMPLETED
- [x] Added FIREBASE_SERVICE_ACCOUNT to local .env file
- [x] Uploaded FIREBASE_SERVICE_ACCOUNT to Vercel

## ⏳ TODO: Upload to Render

### Steps:

1. Go to: https://dashboard.render.com

2. Find and click your backend service (my-blog)

3. Click "Environment" in the left sidebar

4. Click "Add Environment Variable"

5. Add the variable:
   - **Key**: `FIREBASE_SERVICE_ACCOUNT`
   - **Value**: Copy the entire JSON from your .env file
     (The long string after `FIREBASE_SERVICE_ACCOUNT=`)
     
6. Click "Save Changes"

7. Render will automatically restart (wait 1-2 minutes)

### The Value to Copy:

Open `blog-backend/.env` and copy everything after `FIREBASE_SERVICE_ACCOUNT=`

It should start with:
```
{"type":"service_account","project_id":"blog-d852d"...
```

And end with:
```
..."universe_domain":"googleapis.com"}
```

**Important**: Copy the ENTIRE JSON string (it's very long - that's normal!)

---

## After Both Are Updated

✅ Wait 1-2 minutes for both services to restart

✅ Go to your blog site and try Google Sign-in

✅ You should see:
- No more 401 errors
- Successful Google authentication
- Your Google profile picture in the navbar

---

## Troubleshooting

**Still getting 401 errors?**
- Make sure the JSON is copied completely (no line breaks added)
- Verify it's added to BOTH Render AND Vercel
- Wait for services to fully restart (check deployment logs)
- Clear browser cache and try again

**Cross-Origin-Opener-Policy warning in console?**
- This is just a browser warning, not an error
- It doesn't prevent sign-in from working
- It's caused by Firebase's popup authentication

---

## Files Modified

1. `blog-backend/.env` - Added FIREBASE_SERVICE_ACCOUNT
2. `blog-backend/upload-firebase.ps1` - Script to upload to Vercel
3. Vercel Production Environment - FIREBASE_SERVICE_ACCOUNT uploaded ✅
4. Render Production Environment - **Needs manual upload** ⏳
