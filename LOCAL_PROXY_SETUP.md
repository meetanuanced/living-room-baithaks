# 🔧 Local CORS Proxy Setup

This is the **cleanest solution** for fixing CORS errors during local development. No third-party services needed!

---

## ✅ What This Does

The local proxy server (`cors-proxy.js`):
- Runs on **port 3001** on your machine
- Forwards requests to your Google Apps Script API
- Adds CORS headers to allow localhost access
- No rate limits, no downtime, full control!

---

## 🚀 Quick Start (3 Steps)

### Step 1: Install Node.js (if not already installed)

Check if you have Node.js:
```bash
node --version
```

If not installed, download from: https://nodejs.org (use LTS version)

### Step 2: Start the Proxy Server

Open a **new terminal** and run:

```bash
# Navigate to your project
cd living-room-baithaks

# Start the proxy server
node cors-proxy.js
```

You should see:
```
🚀 CORS Proxy Server Running!
================================
📍 Local:     http://localhost:3001
🎯 Proxying:  https://script.google.com/macros/s/...
```

**Keep this terminal open!** The proxy runs in the background.

### Step 3: Enable Local Proxy in config.js

Open `scripts/config.js` and set:

```javascript
// Line 30: Keep using API
const USE_LOCAL_DATA = false;

// Line 45: ENABLE local proxy
const USE_LOCAL_PROXY = true;

// Line 54: Disable third-party proxy
const USE_CORS_PROXY = false;
```

Save and refresh your browser. **CORS error should be gone!** ✅

---

## 🧪 Testing

### 1. Check Proxy is Running

Open a new terminal and run:
```bash
curl http://localhost:3001?action=getConcerts
```

You should see your concert data JSON.

### 2. Check Website

1. Open `index.html` in your browser
2. Open Console (F12)
3. You should see:
   ```
   ✅ Using LOCAL PROXY SERVER: http://localhost:3001
   🔄 Proxying to: https://script.google.com/macros/s/.../exec
   ```

4. Test the booking flow - it should work!

---

## 📊 Proxy Logs

The proxy server shows real-time logs:

```
📨 GET /?action=getConcerts
🔄 Proxying to: https://script.google.com/macros/s/.../exec?action=getConcerts
✅ Response sent (200)

📨 POST /?action=submitBooking
🔄 Proxying to: https://script.google.com/macros/s/.../exec?action=submitBooking
✅ Response sent (200)
```

---

## 🛑 Stopping the Proxy

In the terminal where the proxy is running:
- Press **Ctrl+C** (or **Cmd+C** on Mac)

```
👋 Shutting down proxy server...
✅ Server stopped
```

---

## 🔄 Workflow for Development

### Daily Development:

1. **Terminal 1:** Start proxy server
   ```bash
   node cors-proxy.js
   ```

2. **Terminal 2:** Start your web server (if using one)
   ```bash
   # Example with Python
   python3 -m http.server 8080

   # Or with Node.js http-server
   npx http-server -p 8080
   ```

3. **Browser:** Open `http://localhost:8080`

4. Work on your code - the proxy handles all API requests

5. **When done:** Stop both servers with Ctrl+C

### Just Viewing HTML:

If you're just opening `index.html` directly (not using a web server):

1. Start proxy: `node cors-proxy.js`
2. Open `index.html` in browser
3. Everything works!

---

## 🎯 Configuration Options

### Change Proxy Port

Edit `cors-proxy.js` line 11:

```javascript
const PORT = 3001;  // Change to any port you want
```

Then update `scripts/config.js` line 46:

```javascript
const LOCAL_PROXY_URL = 'http://localhost:3001';  // Match your port
```

### Update API URL

The proxy automatically uses your API URL from `cors-proxy.js` line 15:

```javascript
const TARGET_API = 'https://script.google.com/macros/s/YOUR_ID/exec';
```

This is already set to your current deployment.

---

## ❓ Troubleshooting

### ❌ "Cannot GET /"

**Problem:** You're visiting `http://localhost:3001` directly in browser

**Solution:** The proxy is working! Just use your website at `http://localhost:8080` (or open `index.html`)

### ❌ "EADDRINUSE: address already in use"

**Problem:** Port 3001 is already in use

**Solution:**
1. Stop the other process using port 3001
2. Or change the port in `cors-proxy.js` (line 11)

### ❌ "node: command not found"

**Problem:** Node.js not installed

**Solution:** Install from https://nodejs.org

### ❌ Still seeing CORS errors

**Check:**
1. Is proxy running? (check terminal)
2. Is `USE_LOCAL_PROXY = true` in config.js?
3. Is `USE_LOCAL_DATA = false` in config.js?
4. Clear browser cache and refresh

---

## 🎯 Comparison: Local Proxy vs Other Solutions

| Solution | Speed | Reliability | Setup | Production Ready |
|----------|-------|-------------|-------|------------------|
| **Local Proxy** | ⚡⚡⚡ Fast | ✅ 100% | 2 min | ❌ Local only |
| Third-party Proxy | 🐌 Slow | ⚠️ Can fail | 1 min | ❌ Never |
| Redeploy Apps Script | ⚡⚡⚡ Fast | ✅ 100% | 10 min | ✅ Yes |
| Deploy to real domain | ⚡⚡⚡ Fast | ✅ 100% | 30 min | ✅ Yes |

**Recommendation:**
- **Development:** Use Local Proxy (this guide)
- **Production:** Redeploy Apps Script with `doOptions()` OR deploy to real domain

---

## 📝 Summary

```bash
# Start proxy
node cors-proxy.js

# In config.js
const USE_LOCAL_PROXY = true;
const USE_LOCAL_DATA = false;

# Open your website
# Test booking flow
# Everything works!
```

That's it! No more CORS errors during development! 🎉

---

## 🔗 Next Steps

Once your website is ready for production:

1. **Deploy to a real domain** (GitHub Pages, Netlify, etc.)
2. Set `USE_LOCAL_PROXY = false` in config.js
3. CORS won't be an issue on a real domain!

OR

1. **Redeploy Code.gs** with the `doOptions()` function
2. Set `USE_LOCAL_PROXY = false` in config.js
3. API calls work directly without proxy!
