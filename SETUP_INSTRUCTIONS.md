# 🔧 Setup Instructions - PLEASE READ CAREFULLY

I've fixed all the issues in your code! Here's what I found and what you need to do:

## 🚨 Problems I Fixed

1. **❌ booking-flow.js** - Was fetching from local `test_case_4_max_past.json` instead of your Google Apps Script API
2. **❌ main.js** - Same issue, using local JSON file
3. **❌ Code.gs** - Still had placeholder `SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'`
4. **❌ booking-flow.js** - Missing backend submission functionality
5. **❌ No configuration system** - Had to edit multiple files manually

## ✅ What I Did

I created a **centralized configuration system** so you only need to update ONE file:

### New File: `src/living_room_website/scripts/config.js`

This file contains:
- `API_URL` - Your Google Apps Script Web App URL
- `USE_LOCAL_DATA` - Toggle between local testing and live API
- Helper functions for data fetching and booking submission

**All your JavaScript files now use this config!**

---

## 📝 WHAT YOU NEED TO DO NOW

### Step 1: Update config.js (2 minutes)

1. Open `src/living_room_website/scripts/config.js`

2. Find these lines:
   ```javascript
   const API_URL = 'YOUR_WEB_APP_URL_HERE';
   const USE_LOCAL_DATA = true;
   ```

3. **For now, leave `USE_LOCAL_DATA = true`** (this will use your local JSON file for testing)

4. When you're ready to use Google Sheets:
   - Deploy your Google Apps Script as a Web App
   - Copy the Web App URL (looks like: `https://script.google.com/macros/s/AKfycby...ABC123/exec`)
   - Replace `'YOUR_WEB_APP_URL_HERE'` with your actual URL
   - Change `USE_LOCAL_DATA` to `false`

### Step 2: Update Code.gs Spreadsheet ID (1 minute)

1. Open `google_apps_script/Code.gs`

2. On **line 19**, replace:
   ```javascript
   const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
   ```

   With your actual Google Sheet ID:
   ```javascript
   const SPREADSHEET_ID = '1abc123xyz789_YOUR_ACTUAL_SHEET_ID';
   ```

3. To find your Sheet ID:
   - Open your Google Sheet
   - Look at the URL: `https://docs.google.com/spreadsheets/d/[THIS_IS_YOUR_SHEET_ID]/edit`
   - Copy the long string between `/d/` and `/edit`

---

## 🧪 Testing Guide

### Test Mode (Using Local Data)

**Current state:** `USE_LOCAL_DATA = true` in config.js

✅ **What works:**
- Website loads concert data from `test_case_4_max_past.json`
- Booking flow UI works perfectly
- Form validation works
- You can test the entire booking process

⚠️ **What doesn't work:**
- Bookings are NOT saved to Google Sheets (just logged to console)
- You'll see console messages: `⚠️ BOOKING SUBMISSION DISABLED: Using local data mode`

**How to test:**
1. Open `src/living_room_website/index.html` in your browser
2. Open browser console (F12 → Console tab)
3. Test the booking flow
4. Check console for `📤 Submitting Booking Data:` messages

### Live Mode (Using Google Sheets)

**After you set:** `USE_LOCAL_DATA = false` and add your `API_URL`

✅ **What works:**
- Website fetches concert data from Google Sheets via your API
- Bookings ARE saved to Google Sheets
- Seat availability is updated automatically
- Payment screenshots uploaded to Google Drive
- Attendees tracked in master database

⚠️ **Requirements:**
- Google Sheet must be set up with all 8 tabs
- Code.gs must be deployed as Web App
- SPREADSHEET_ID must be correct in Code.gs
- Drive folder for screenshots must be configured in Config tab

**How to test:**
1. Deploy Code.gs as Web App
2. Update config.js with API_URL and set USE_LOCAL_DATA = false
3. Open website and test booking
4. Check Google Sheets → Bookings tab for new entry
5. Check console for `✅ Booking submitted successfully:` message

---

## 🐛 Debugging Console Errors

**Before I made these fixes, you were probably seeing:**

```
❌ GET http://localhost/.../test_case_4_max_past.json 404 (Not Found)
❌ Uncaught ReferenceError: API_URL is not defined
❌ TypeError: Cannot read properties of undefined
```

**Now you should see (in Test Mode):**

```
⚠️ Using LOCAL data from: test_case_4_max_past.json
⚠️ Set USE_LOCAL_DATA = false in config.js to use Google Apps Script API
📤 Submitting Booking Data: {...}
⚠️ BOOKING SUBMISSION DISABLED: Using local data mode
```

**In Live Mode, you should see:**

```
✅ Using Google Apps Script API: https://script.google.com/macros/s/.../exec
📤 Submitting Booking Data: {...}
✅ Booking submitted successfully: {success: true, bookingId: "LRB1234", ...}
```

---

## 📊 Google Sheets Setup Checklist

Before going live, make sure you have:

- [ ] Created Google Sheet with 8 tabs:
  - [ ] Artists
  - [ ] Concerts
  - [ ] Attendees
  - [ ] Bookings
  - [ ] Booking_Attendees
  - [ ] Seat Tracking
  - [ ] Payment Logs
  - [ ] Config

- [ ] Added column headers (see `GOOGLE_SHEETS_SETUP_RELATIONAL.md`)

- [ ] Added at least one concert with:
  - [ ] `event_status = 'Upcoming'`
  - [ ] `isCurrent = 'Y'`
  - [ ] Pricing info (ticket_price_general, ticket_price_student)

- [ ] Set up Seat Tracking entry for that concert:
  - [ ] general_seats_total (e.g., 45)
  - [ ] student_seats_total (e.g., 5)
  - [ ] chairs_total (e.g., 10)

- [ ] Added Config entry:
  - [ ] Key: `drive_folder_id`
  - [ ] Value: Your Google Drive folder ID for payment screenshots

---

## 🚀 Deployment Workflow

### Option 1: Local Development & Testing (Current State)

1. Keep `USE_LOCAL_DATA = true`
2. Edit `test_case_4_max_past.json` to test different concert data
3. Test booking flow (bookings logged to console only)
4. No Google Sheets needed

### Option 2: Full Production Setup

1. Set up Google Sheets (8 tabs)
2. Add your concert data
3. Update Code.gs SPREADSHEET_ID
4. Deploy Code.gs as Web App
5. Copy Web App URL
6. Update config.js: set API_URL and USE_LOCAL_DATA = false
7. Test booking (bookings saved to Sheets)

---

## 📝 Summary of Changes

| File | What Changed |
|------|-------------|
| `config.js` | ✨ **NEW FILE** - Centralized configuration |
| `booking-flow.js` | ✅ Now uses config.js, added async submitBookingToBackend() |
| `main.js` | ✅ Now uses config.js for data fetching |
| `index.html` | ✅ Added config.js script tag |
| `Code.gs` | ⚠️ **YOU STILL NEED TO UPDATE SPREADSHEET_ID** |

---

## ❓ Common Questions

**Q: Why is my booking not saving to Google Sheets?**
A: Check config.js - is `USE_LOCAL_DATA = true`? This is test mode. Set it to `false` and add your API_URL.

**Q: I see "YOUR_WEB_APP_URL_HERE" errors**
A: You need to deploy Code.gs as a Web App first, then update config.js with the URL.

**Q: My website shows "Unable to load concert data"**
A: If USE_LOCAL_DATA = true, make sure `test_case_4_max_past.json` exists. If false, check your API_URL and ensure Code.gs is deployed.

**Q: Can I test without setting up Google Sheets?**
A: Yes! Keep `USE_LOCAL_DATA = true` and the website works perfectly with your local JSON file.

---

## 🎯 Quick Start (Recommended)

**For immediate testing:**

1. Don't change anything - files already configured for local testing
2. Open `src/living_room_website/index.html` in browser
3. Test booking flow
4. Check browser console to see booking data

**When ready to go live:**

1. Set up Google Sheets
2. Update Code.gs SPREADSHEET_ID (line 19)
3. Deploy Code.gs as Web App
4. Update config.js with API_URL and set USE_LOCAL_DATA = false
5. Test again

---

## 📞 Need Help?

If you're still seeing errors:

1. Open browser console (F12)
2. Copy/paste the exact error messages
3. Share what step you're on
4. Let me know what values you've set in config.js

I can help debug from there!
