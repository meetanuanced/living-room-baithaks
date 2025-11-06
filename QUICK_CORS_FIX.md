# 🚀 Quick CORS Fix (2 Minutes)

You're getting a CORS error. Here's the **fastest** way to fix it:

---

## ✅ Option 1: Use CORS Proxy (Immediate Fix)

### Step 1: Update config.js

Open `scripts/config.js` and change these lines:

```javascript
// Line 22: Add your Apps Script URL
const API_URL = 'https://script.google.com/macros/s/AKfycbx9kZ5u4wrRng9V_l2sUsc8CnnpW-sLKfZ_etnDUCJShmtY4tL-bEOa8OQj-zBbfuHo/exec';

// Line 30: Turn OFF local data mode
const USE_LOCAL_DATA = false;

// Line 45: Turn ON CORS proxy
const USE_CORS_PROXY = true;
```

### Step 2: Test

1. Refresh your browser
2. Check console - you should see: `🔄 Using CORS proxy for local testing`
3. Try booking - should work now!

**That's it!** Your CORS error should be fixed.

---

## ✅ Option 2: Redeploy Apps Script (Permanent Fix)

If you want a cleaner solution without a proxy:

### Step 1: Update Code.gs

1. Open your Apps Script project at script.google.com
2. Copy the entire `google_apps_script/Code.gs` file from this repository
3. Paste it into your Apps Script editor (replace everything)
4. The new code has a `doOptions()` function that fixes CORS

### Step 2: Create New Deployment

1. Click **Deploy** → **New deployment**
2. Click ⚙️ next to "Select type"
3. Choose **Web app**
4. Settings:
   - Description: "v2 - CORS fix"
   - Execute as: **Me**
   - Who has access: **Anyone** ← Critical!
5. Click **Deploy**
6. Copy the **NEW** Web App URL

### Step 3: Update config.js

```javascript
// Use your NEW deployment URL
const API_URL = 'YOUR_NEW_URL_HERE';

const USE_LOCAL_DATA = false;

// Turn OFF proxy (not needed anymore)
const USE_CORS_PROXY = false;
```

---

## 🧪 How to Test

Open browser console (F12) and run:

```javascript
// Test if API is working
fetch('YOUR_API_URL?action=getConcerts')
  .then(r => r.json())
  .then(d => console.log('✅ Works!', d))
  .catch(e => console.error('❌ Error:', e));
```

If you see your concert data → Success! ✅

---

## 📋 Summary

| Solution | Speed | For | Pros | Cons |
|----------|-------|-----|------|------|
| **Option 1: CORS Proxy** | ⚡ 2 min | Local testing | Quick, no redeployment needed | Adds latency, not for production |
| **Option 2: Redeploy** | ⏱️ 10 min | Production | Clean, no proxy needed | Requires redeployment |

**My Recommendation:**
- Use **Option 1** right now to test
- Use **Option 2** before going live

---

## ❓ Still Not Working?

**Check these:**

1. **Is your API URL correct?**
   - Should end with `/exec` not `/dev`

2. **Is deployment set to "Anyone"?**
   - Apps Script → Deploy → Manage deployments
   - Check "Who has access" = **Anyone**

3. **Did you clear browser cache?**
   - Press Ctrl+Shift+Delete
   - Clear cache
   - Refresh page

4. **Are you using the right URL?**
   - Open config.js
   - Verify API_URL matches your deployment URL

---

## 📖 More Details

For complete documentation, see:
- **CORS_FIX.md** - Full troubleshooting guide
- **SETUP_INSTRUCTIONS.md** - Complete setup guide

Need help? Share the error message from your console!
