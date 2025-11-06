# 🔧 CORS Error Fix for Google Apps Script

## The Problem

You're getting this error:
```
Access to fetch at 'https://script.google.com/macros/s/.../exec' from origin 'http://localhost:8080'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

This happens because Google Apps Script Web Apps have special CORS handling requirements.

---

## ✅ Solution 1: Redeploy Apps Script (RECOMMENDED)

I've added a `doOptions()` function to Code.gs to handle CORS preflight requests. You need to **redeploy** your Apps Script:

### Steps:

1. **Open your Apps Script project** (script.google.com)

2. **Copy the updated Code.gs:**
   - Copy the entire content from `google_apps_script/Code.gs` in this repository
   - Paste it into your Apps Script editor (replacing the old code)
   - The new code includes the `doOptions()` function at line 118

3. **Create a NEW deployment:**
   - Click **Deploy** → **New deployment**
   - Click the gear icon ⚙️ next to "Select type"
   - Choose **Web app**
   - Settings:
     - Description: "v2 - Added CORS support"
     - Execute as: **Me**
     - Who has access: **Anyone** ← CRITICAL!
   - Click **Deploy**

4. **Copy the NEW Web App URL**

5. **Update config.js:**
   ```javascript
   const API_URL = 'YOUR_NEW_WEB_APP_URL_HERE';
   const USE_LOCAL_DATA = false;  // Use API instead of local
   ```

6. **Test again**

---

## ✅ Solution 2: CORS Proxy (Quick Fix for Testing)

If you need a quick fix without redeploying, use a CORS proxy:

### Option A: Update config.js with Proxy

Open `scripts/config.js` and modify the `submitBookingToBackend()` function:

```javascript
async function submitBookingToBackend(bookingData) {
    if (USE_LOCAL_DATA || API_URL === 'YOUR_WEB_APP_URL_HERE') {
        // ... existing code ...
    }

    // Add CORS proxy for local testing
    const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
    const url = CORS_PROXY + API_URL + '?action=submitBooking';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookingData)
        });

        // ... rest of code ...
    } catch (error) {
        console.error('❌ Error submitting booking:', error);
        throw error;
    }
}
```

### Option B: Use a Different CORS Proxy

Popular CORS proxies:
- `https://cors-anywhere.herokuapp.com/` (limited, request access)
- `https://corsproxy.io/?` (add before your URL)
- `https://api.allorigins.win/raw?url=` (add before your URL)

**Example:**
```javascript
const url = 'https://corsproxy.io/?' + API_URL + '?action=submitBooking';
```

⚠️ **WARNING:** CORS proxies should only be used for testing, not production!

---

## ✅ Solution 3: Deploy Your Website (Production)

CORS errors only happen when testing locally. Once you deploy your website to a real domain, CORS won't be an issue.

### Deployment Options:

1. **GitHub Pages** (Free)
   - Push your code to GitHub
   - Settings → Pages → Enable
   - Your site will be at `https://yourusername.github.io/living-room-baithaks`

2. **Netlify** (Free)
   - Drag and drop your folder at netlify.com
   - Instant deployment

3. **Vercel** (Free)
   - Connect your GitHub repo
   - Auto-deploys on every push

4. **Firebase Hosting** (Free)
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init hosting
   firebase deploy
   ```

Once deployed, Google Apps Script will allow requests from your actual domain.

---

## ✅ Solution 4: Use Live Server with Custom Headers (Advanced)

If you're using VS Code with Live Server:

1. Install **Live Server** extension
2. Create `.vscode/settings.json`:
   ```json
   {
     "liveServer.settings.port": 8080,
     "liveServer.settings.proxy": {
       "enable": true,
       "baseUri": "/api",
       "proxyUri": "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"
     }
   }
   ```

3. Update your config.js to use `/api` instead of full URL

---

## 🔍 Verify Your Deployment Settings

Make sure your Apps Script deployment has these settings:

1. **Execute as:** Me (your Google account)
2. **Who has access:** **Anyone** ← This is critical!

If it's set to "Only myself" or another option, CORS will fail.

### To Check:
1. Apps Script → Deploy → Manage deployments
2. Click the ✏️ edit icon on your active deployment
3. Verify "Who has access" = **Anyone**

---

## 🧪 Test if CORS is Fixed

Open your browser console and run:

```javascript
fetch('YOUR_WEB_APP_URL?action=getConcerts')
  .then(r => r.json())
  .then(d => console.log('✅ CORS works!', d))
  .catch(e => console.error('❌ Still blocked:', e));
```

If you see `✅ CORS works!` and your concert data, you're good!

---

## 🎯 Recommended Approach

**For testing right now:**
1. Use Solution 1 (Redeploy with doOptions)
2. If that doesn't work, use Solution 2 (CORS proxy temporarily)

**For production:**
1. Deploy your website to a real domain (Solution 3)
2. No CORS proxy needed!

---

## ❓ Common Issues

**Q: I redeployed but still getting CORS error**
- Make sure you copied the **new** deployment URL (not the old one)
- Clear your browser cache (Ctrl+Shift+Delete)
- Try in an incognito window

**Q: The CORS proxy isn't working**
- Some proxies require API keys or have rate limits
- Try a different proxy from the list above

**Q: Should I use CORS proxy in production?**
- No! Only for local testing. Deploy to a real domain instead.

---

## 📝 Summary

1. ✅ I added `doOptions()` to Code.gs
2. ✅ You need to redeploy your Apps Script
3. ✅ Make sure deployment is set to "Anyone"
4. ✅ Update config.js with new URL
5. ✅ For production, deploy to a real domain

Let me know which solution works for you!
