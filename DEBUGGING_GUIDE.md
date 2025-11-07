# Debugging Guide: Why Excel is Not Updating & Chair Validation Not Working

## 🚨 **Problem Identified**

Your booking form is running in **TEST MODE** with mock data! That's why:
1. ❌ **Nothing updates in Excel** - bookings aren't being sent to Google Apps Script
2. ❌ **Chair validation doesn't work** - you're seeing mock data (10 chairs always available)
3. ❌ **Logs don't show up** - because the real API isn't being called

## 🔍 How to Diagnose

**Open your browser console (F12) and look for these messages when loading the page:**

### If you see this - YOU'RE IN TEST MODE:
```
⚠️ USING MOCK SEAT AVAILABILITY DATA!
This is NOT real data from Excel!
```

And when submitting a booking:
```
❌ BOOKING SUBMISSION DISABLED!
Reason: Using local data mode or API_URL not configured
📋 Booking data (NOT SAVED TO EXCEL)
```

Plus you'll see an alert: `⚠️ TEST MODE: Booking not saved! Check console for details.`

## 🔧 How to Fix

### Step 1: Check Your config.js Settings

Open `scripts/config.js` and look for these settings at the top:

```javascript
const USE_LOCAL_DATA = false;  // ← Must be FALSE for production
const API_URL = 'YOUR_WEB_APP_URL_HERE';  // ← Must be your actual Web App URL

const USE_LOCAL_PROXY = false;  // Set to true if using local proxy
const LOCAL_PROXY_URL = 'http://localhost:3001';

const USE_CORS_PROXY = false;  // Set to true if needed
```

**What should they be?**

**Option A: Using Local Proxy (Recommended for Development)**
```javascript
const USE_LOCAL_DATA = false;
const API_URL = 'https://script.google.com/macros/s/YOUR_ACTUAL_ID/exec';
const USE_LOCAL_PROXY = true;
const USE_CORS_PROXY = false;
```

**Option B: Direct API Access (Production)**
```javascript
const USE_LOCAL_DATA = false;
const API_URL = 'https://script.google.com/macros/s/YOUR_ACTUAL_ID/exec';
const USE_LOCAL_PROXY = false;
const USE_CORS_PROXY = false;
```

**Your API URL should look like:**
```
https://script.google.com/macros/s/AKfycbx9kZ5u4wrRng9V_l2sUsc8CnnpW-sLKfZ_etnDUCJShmtY4tL-bEOa8OQj-zBbfuHo/exec
```

### Step 2: Update Code.gs SPREADSHEET_ID

Open `google_apps_script/Code.gs` and check line 19:

```javascript
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';  // ← Replace with YOUR Google Sheet ID
```

**Where to find your spreadsheet ID:**
1. Open your Google Sheet
2. Look at the URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit`
3. Copy the ID from the URL
4. Paste it in Code.gs

Example:
```javascript
const SPREADSHEET_ID = '1Abc123XYZdefghijklmnopQRSTUVWXYZ';
```

### Step 3: Redeploy Your Web App

After updating SPREADSHEET_ID in Code.gs:

1. Open your Google Apps Script project
2. Click **Deploy** → **Manage deployments**
3. Click the ✏️ **Edit** icon next to your existing deployment
4. Under "Version", select **New version**
5. Add a description like "Fixed seat tracking and added logging"
6. Click **Deploy**
7. **Copy the Web App URL** (it looks like the API_URL above)
8. Paste this URL into your `scripts/config.js` as the `API_URL`

### Step 4: If Using Local Proxy

If you set `USE_LOCAL_PROXY = true`, make sure the proxy is running:

```bash
cd /path/to/your/project
node cors-proxy.js
```

You should see:
```
🚀 Local CORS proxy server running on http://localhost:3001
🎯 Proxying to: https://script.google.com/macros/s/.../exec
```

### Step 5: Test with Console Open

1. Open your website
2. Press F12 to open Developer Console
3. Go to the **Console** tab
4. Refresh the page

**You should now see:**

When page loads:
```
🔄 Loading concert data from: ...
📦 Concert data received: 1 concerts
🎵 Upcoming concert: CONC001 Hindustani Classical Night
🔍 Getting seat availability for concert: CONC001
✅ Real seat availability from Excel: {
   general_seats_available: 4,
   student_seats_available: 0,
   chairs_available: 0,
   ...
}
💺 Seat Availability loaded:
   General: 4 of 45
   Student: 0 of 5
   Chairs: 0 of 10
```

When submitting booking:
```
========================================
📤 BOOKING SUBMISSION STARTING
========================================
Config:
   USE_LOCAL_DATA: false
   API_URL: https://script.google.com/...
   USE_LOCAL_PROXY: true
📤 Submitting booking via LOCAL PROXY SERVER: http://localhost:3001?action=submitBooking
🔄 Sending POST request to: ...
📡 Response status: 200 OK
✅ Response received: { success: true, bookingId: "BK_..." }
```

## 📊 Viewing Apps Script Logs

**Why you can't see logs from HTML execution:**

When you access your website via browser, the execution happens under YOUR user account (whoever deployed the web app). The logs go to the OWNER's execution log, not the general logs.

**How to view them:**

### Option 1: Executions Page (Best Method)
1. Open your Google Apps Script project
2. Click **⏱️ Executions** in the left sidebar
3. You'll see a list of all executions
4. Click on ANY row to see the detailed logs
5. Look for our emoji markers:
   - 📥 BOOKING SUBMISSION STARTED
   - 🔍 Checking Seat Availability
   - 📊 BEFORE/AFTER Update

**IMPORTANT**: Executions appear grouped by user:
- If you deployed as "Execute as: Me", logs appear under the OWNER's account
- Filter by date/time to find recent bookings

### Option 2: Real-Time Console Logs
While testing in browser:
1. Open Developer Console (F12)
2. All our detailed logging will appear in the browser console
3. This shows everything happening in the frontend

### Option 3: Logger Stackdriver (Legacy)
1. In Apps Script editor, click **View** → **Stackdriver Logging**
2. This shows execution logs with timestamps
3. Filter by "Recent" to see latest executions

## 🧪 Testing Checklist

After fixing config.js and redeploying:

- [ ] Open website with console open (F12)
- [ ] Verify you see "Real seat availability from Excel" (not "MOCK")
- [ ] Check that chair/student limits match your Excel data
- [ ] Try selecting more chairs than available - should show alert
- [ ] Complete a test booking
- [ ] Check console for "Response status: 200 OK"
- [ ] Check Excel - should see new row in Bookings sheet
- [ ] Check Excel - should see updated booked_seats in Seat Tracking
- [ ] Check Apps Script Executions - should see new execution log

## 🔑 Quick Reference

### Excel Column Formulas Needed

In your **Seat Tracking** sheet, add these formulas:

**Row 2** (and copy down for all concerts):
```excel
E2: =C2-D2    (general_seats_available = total - booked)
H2: =F2-G2    (student_seats_available = total - booked)
K2: =I2-J2    (chairs_available = total - booked)
```

### Configuration Files to Check

1. **scripts/config.js**
   - USE_LOCAL_DATA = false
   - API_URL = your web app URL
   - USE_LOCAL_PROXY = true (if using proxy)

2. **google_apps_script/Code.gs**
   - SPREADSHEET_ID = your actual sheet ID
   - Must be redeployed after changes

3. **cors-proxy.js**
   - Must be running if USE_LOCAL_PROXY = true
   - Run with: `node cors-proxy.js`

## 💡 Common Issues

### Issue: "chairs_available: 10" always shows in console
**Cause**: Using mock data (USE_LOCAL_DATA = true or API_URL not set)
**Fix**: Set USE_LOCAL_DATA = false and configure API_URL

### Issue: Alert says "TEST MODE: Booking not saved!"
**Cause**: API_URL is still 'YOUR_WEB_APP_URL_HERE'
**Fix**: Deploy your web app and copy the actual URL to config.js

### Issue: "CORS policy" error
**Cause**: Browser blocking direct API calls
**Fix**: Use local proxy (set USE_LOCAL_PROXY = true and run cors-proxy.js)

### Issue: Logs show up for test functions but not web app
**Cause**: Web app logs go to Executions page, not general logs
**Fix**: Check Executions page, filter by your deployment account

### Issue: Excel not updating even with correct config
**Cause**: Old web app deployment is cached
**Fix**: Create NEW deployment version (not "Test deployment")

## 📞 If Still Not Working

Check console and share screenshots showing:
1. The config settings being logged on page load
2. The booking submission console output
3. The Apps Script Executions page
4. Your Excel Seat Tracking sheet (just the headers + 1 data row)

The new detailed logging will show exactly where the problem is!
