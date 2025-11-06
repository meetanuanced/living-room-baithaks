# Where to Insert Your URLs and IDs

**Quick reference for the 3 places you need to update**

---

## 1️⃣ Google Apps Script - SPREADSHEET_ID

**File:** `google_apps_script/Code.gs`
**Line:** 19

### What to Change:

```javascript
// FIND THIS (Line 19):
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';

// CHANGE TO:
const SPREADSHEET_ID = '1abc123xyz789_YOUR_ACTUAL_SHEET_ID';
```

### How to Get Your Sheet ID:

1. Open your Google Sheet
2. Look at the URL:
   ```
   https://docs.google.com/spreadsheets/d/1abc123xyz789_THIS_IS_YOUR_ID/edit
   ```
3. Copy the part between `/d/` and `/edit`

**Example:**
```javascript
const SPREADSHEET_ID = '1aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890';
```

---

## 2️⃣ Website - Main Concert Fetch

**File:** `scripts/main.js`
**Line:** ~200-250 (search for "fetch")

### What to Change:

```javascript
// FIND THIS:
fetch('./data/lrb_concerts_master_final_updated.json')

// CHANGE TO:
fetch('https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=getConcerts')
```

### How to Get Your Web App URL:

1. In Google Apps Script editor, click **Deploy** → **Manage deployments**
2. Copy the **Web app** URL
3. It looks like: `https://script.google.com/macros/s/AKfycbz...long_string.../exec`

**Example:**
```javascript
fetch('https://script.google.com/macros/s/AKfycbzXyZ123_longstring_ABC/exec?action=getConcerts')
  .then(response => response.json())
  .then(concerts => {
    // ... existing code
  });
```

---

## 3️⃣ Website - Booking API

**File:** `scripts/booking-flow.js`
**Line:** ~10-20 (near the top, search for "API_URL")

### What to Change:

```javascript
// FIND THIS:
const API_URL = 'YOUR_APPS_SCRIPT_URL_HERE';

// CHANGE TO:
const API_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
```

**Same URL as #2, but WITHOUT the `?action=getConcerts` part**

**Example:**
```javascript
const API_URL = 'https://script.google.com/macros/s/AKfycbzXyZ123_longstring_ABC/exec';
```

---

## 📋 Quick Checklist

- [ ] Got my Google Sheet ID
- [ ] Updated `google_apps_script/Code.gs` line 19 with Sheet ID
- [ ] Deployed Apps Script as Web App
- [ ] Got my Web App URL
- [ ] Updated `scripts/main.js` fetch URL (with `?action=getConcerts`)
- [ ] Updated `scripts/booking-flow.js` API_URL (without `?action=`)
- [ ] Tested: Website loads concerts from Google Sheets
- [ ] Tested: Booking form submits to Google Sheets

---

## 🔍 How to Find These Lines

### In Code.gs:
```bash
# Search for SPREADSHEET_ID
grep -n "SPREADSHEET_ID" google_apps_script/Code.gs
```

### In main.js:
```bash
# Search for fetch
grep -n "fetch.*json" scripts/main.js
```

### In booking-flow.js:
```bash
# Search for API_URL
grep -n "API_URL" scripts/booking-flow.js
```

---

## ✅ Test Your Setup

### Test 1: Apps Script Connection
```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=getConcerts
```
**Should return:** JSON with your concerts

### Test 2: Website Loads Concerts
1. Open `index.html` in browser
2. Open Developer Console (F12)
3. Check for errors
4. Concerts should appear on the page

### Test 3: Booking Submission
1. Fill out booking form
2. Submit
3. Check Google Sheets → **Bookings** tab
4. New row should appear

---

**That's it! Just 3 places to update.** 🎯
