# Quick Start Guide - Living Room Baithaks Backend Setup

**Simple 4-step guide to get your automated booking system working**

---

## 📋 Overview

You'll be setting up:
1. **Google Sheet** - Your database (8 tabs)
2. **Google Apps Script** - Your backend API
3. **Website Connection** - Link website to live data

**Time needed:** 2-3 hours

---

## Step 1: Create Your Google Sheet Database (45 min)

### 1.1 Create the Spreadsheet

1. Go to https://sheets.google.com
2. Click **+ Blank** to create new spreadsheet
3. Click "Untitled spreadsheet" at top
4. Rename to: **Living Room Baithaks - Database**

### 1.2 Get Your Sheet ID

Look at the URL:
```
https://docs.google.com/spreadsheets/d/1abc123xyz789_YOUR_SHEET_ID_HERE/edit
```

**Copy the ID between `/d/` and `/edit`** - you'll need this!

Example: `1abc123xyz789_YOUR_SHEET_ID_HERE`

### 1.3 Create 8 Tabs

By default you have "Sheet1". Create 7 more tabs:

1. Rename "Sheet1" → **Concerts**
2. Click **+** button → Name it **Artists**
3. Click **+** button → Name it **Attendees**
4. Click **+** button → Name it **Bookings**
5. Click **+** button → Name it **Booking_Attendees**
6. Click **+** button → Name it **Seat Tracking**
7. Click **+** button → Name it **Payment Logs**
8. Click **+** button → Name it **Config**

**IMPORTANT:** Names must match exactly (case-sensitive)!

### 1.4 Add Column Headers

For each tab, click on it and add these headers in Row 1:

#### Tab: Concerts
```
concert_id | title | sub_title | date | display_date | genre | image_hero | image_past | image_alt | concert_time | meal_time | meal_order | meal_type | ticket_link | ticket_price_general | ticket_price_student | inclusions | contribution_note | invite_link | event_gallery_link | event_recording_link | event_status | isCurrent | booking_status | duration | max_seats | chairs_available | venue_address | venue_google_map_link | whatsapp_group_link
```

#### Tab: Artists
```
artist_id | concert_id | name | category | genre | salutation | bio | image_url | social_links | guru_name
```

#### Tab: Attendees
```
attendee_id | name | whatsapp | email | student_status | needs_chair | first_concert_id | first_concert_date | total_concerts_attended | last_concert_id | last_concert_date | notes
```

#### Tab: Bookings
```
booking_id | transaction_id | timestamp | concert_id | concert_name | general_seats | student_seats | chairs_requested | total_amount | main_contact_attendee_id | payment_screenshot_url | booking_status | confirmation_sent | booking_notes
```

#### Tab: Booking_Attendees
```
booking_id | attendee_id | seat_type | needs_chair | is_main_contact
```

#### Tab: Seat Tracking (IMPORTANT - Student Seat Tracking!)
```
concert_id | total_seats | general_seats_total | general_seats_booked | general_seats_available | student_seats_total | student_seats_booked | student_seats_available | chairs_total | chairs_booked | chairs_available
```

#### Tab: Payment Logs
```
booking_id | transaction_id | filename | drive_url | upload_timestamp
```

#### Tab: Config
```
key | value | description
```

### 1.5 Add Sample Data to Test

**In Concerts tab (Row 2):**
```
CONC001 | Test Concert | Sample Event | 2025-12-01 | Dec 2025 | Hindustani Vocal | ./Images/test.jpg | ./Images/test.jpg | Test | 18:00 | 17:00 | before | dinner | | 1000 | 500 | Meal included | Test note | | | | upcoming | Y | Open | 2 Hours | 50 | 10 | | |
```

**In Artists tab (Row 2):**
```
ARTIST001 | CONC001 | Test Artist | Primary | Vocal | | | | |
```

**In Seat Tracking tab (Row 2):**
```
CONC001 | 50 | 45 | 0 | 45 | 5 | 0 | 5 | 10 | 0 | 10
```

This means:
- 50 total seats
- 45 general seats (₹1000)
- 5 student seats (₹500) ← Your quota!
- 10 chairs available

**In Config tab (Rows 2-6):**
```
drive_folder_id | | Google Drive folder for payment screenshots
auto_confirm_bookings | No | Auto-confirm without review
booking_confirmation_email | your-email@example.com | Email for notifications
max_seats_per_booking | 10 | Max seats per booking
enable_student_pricing | Yes | Allow student discounts
```

---

## Step 2: Deploy Google Apps Script (30 min)

### 2.1 Open Apps Script Editor

1. In your Google Sheet, click **Extensions** → **Apps Script**
2. A new tab opens with a file called `Code.gs`

### 2.2 Copy Your Backend Code

**On your computer:**
```bash
# View the code
cat google_apps_script/Code.gs

# Copy to clipboard (Mac)
cat google_apps_script/Code.gs | pbcopy

# Or manually open the file and copy all content
```

### 2.3 Paste Into Apps Script

1. In the Apps Script editor, **select all** the default code (Ctrl+A / Cmd+A)
2. **Delete it**
3. **Paste** your Code.gs content
4. **Save** (Ctrl+S / Cmd+S)

### 2.4 Configure Your Sheet ID

**CRITICAL STEP:**

Find **Line 19** in the code. It looks like this:
```javascript
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // Replace with your Google Sheet ID
```

**Replace `YOUR_SPREADSHEET_ID_HERE` with your actual Sheet ID** from Step 1.2:
```javascript
const SPREADSHEET_ID = '1abc123xyz789_YOUR_ACTUAL_SHEET_ID';
```

**Save again** (Ctrl+S / Cmd+S)

### 2.5 Test in Editor

1. At the top, find the function dropdown (says "doGet")
2. Change it to **testConnection**
3. Click the **▶️ Run** button
4. If prompted to authorize:
   - Click **Review permissions**
   - Choose your Google account
   - Click **Advanced** → **Go to Untitled project (unsafe)**
   - Click **Allow**
5. Click **View** → **Logs**

**You should see:**
```
✅ Connected to: Living Room Baithaks - Database
📊 Found 8 sheets:
  - Concerts
  - Artists
  - Attendees
  - Bookings
  - Booking_Attendees
  - Seat Tracking
  - Payment Logs
  - Config
```

**If you see an error:**
- Check SPREADSHEET_ID is correct
- Check all 8 sheets exist with exact names

### 2.6 Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the **⚙️ gear icon** → Select **Web app**
3. Fill in:
   - **Description:** "LRB Booking API v1"
   - **Execute as:** Me (your email)
   - **Who has access:** **Anyone**
4. Click **Deploy**
5. **IMPORTANT: Copy the Web App URL**

It looks like:
```
https://script.google.com/macros/s/AKfycbz...long_string.../exec
```

**Save this URL somewhere safe!**

### 2.7 Test the Web App

Open your Web App URL in a browser, adding `?action=getConcerts`:
```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=getConcerts
```

**You should see JSON:**
```json
[
  {
    "concert_id": "CONC001",
    "title": "Test Concert",
    "artists": [
      {
        "id": "ARTIST001",
        "name": "Test Artist",
        ...
      }
    ]
  }
]
```

**✅ If you see this, your backend is working!**

---

## Step 3: Add Your Real Concert Data (1 hour)

Now replace the test data with your real concerts.

### 3.1 From Your JSON File

You have: `data/lrb_concerts_master_final_updated.json`

**For each concert in your JSON:**

1. **Add to Concerts tab:**
   - Copy all concert fields
   - Paste as new row in Concerts tab

2. **Add artists to Artists tab:**
   - For each artist in the concert's `artists` array
   - Add a row: `artist_id | concert_id | name | category | genre`

3. **Add to Seat Tracking tab:**
   - Add row: `concert_id | 50 | 45 | 0 | 45 | 5 | 0 | 5 | 10 | 0 | 10`
   - Adjust numbers based on your capacity and student quota

**Example:**

From JSON:
```json
{
  "concert_id": "CONC004",
  "title": "Pratah Swar",
  "artists": [
    {"id": "ARTIST007", "name": "Siddharth Belamannu", "category": "Primary", "genre": "Vocal"}
  ]
}
```

**Concerts tab:**
```
CONC004 | Pratah Swar | : Morning Baithak | 2025-11-16 | Nov 2025 | ...
```

**Artists tab:**
```
ARTIST007 | CONC004 | Siddharth Belamannu | Primary | Vocal | | | | |
```

**Seat Tracking tab:**
```
CONC004 | 50 | 45 | 0 | 45 | 5 | 0 | 5 | 10 | 0 | 10
```

### 3.2 Test Again

After adding your data, test the API again:
```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=getConcerts
```

You should see all your concerts!

---

## Step 4: Connect Your Website (30 min)

Now make your website fetch from Google Sheets instead of the local JSON file.

### 4.1 Update scripts/main.js

**Find this line (around line 200-250):**
```javascript
fetch('./data/lrb_concerts_master_final_updated.json')
```

**Replace with your Web App URL:**
```javascript
fetch('https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=getConcerts')
```

**Example:**
```javascript
// OLD
fetch('./data/lrb_concerts_master_final_updated.json')
  .then(response => response.json())
  .then(concerts => {
    // ... rest of code
  });

// NEW
fetch('https://script.google.com/macros/s/AKfycbz...YOUR_ID.../exec?action=getConcerts')
  .then(response => response.json())
  .then(concerts => {
    // ... rest of code
  });
```

### 4.2 Update scripts/booking-flow.js

**Find the API_URL constant (near the top):**
```javascript
const API_URL = 'YOUR_APPS_SCRIPT_URL_HERE';
```

**Replace with:**
```javascript
const API_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
```

### 4.3 Test Locally

1. Open `index.html` in your browser
2. Check if concerts load from Google Sheets
3. Try the booking flow (fill out form)
4. Check if booking appears in Google Sheets → Bookings tab

---

## Step 5: Deploy Your Website (Optional)

Once everything works locally, deploy to production:

### Option A: Netlify (Easiest)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd /path/to/living-room-baithaks
netlify deploy --prod

# Follow prompts
# Choose: index.html as entry point
```

### Option B: GitHub Pages

1. Push your code to GitHub
2. Go to repo Settings → Pages
3. Source: main branch, root folder
4. Save

Your site will be at: `https://yourusername.github.io/living-room-baithaks/`

---

## 🎯 Summary - What You've Built

✅ **Google Sheet** - 8-table relational database
✅ **Separate student seat tracking** - Prevents revenue loss
✅ **Master attendees table** - Tracks repeat guests
✅ **Automated bookings** - Submissions go directly to Sheets
✅ **Payment screenshots** - Auto-upload to Google Drive
✅ **Live seat availability** - Real-time updates
✅ **API backend** - No more manual JSON updates

---

## 🆘 Troubleshooting

### "Cannot read properties of undefined"
- Don't click ▶️ Run on `doGet` function
- Use test functions instead: `testConnection`, `testGetConcerts`
- Or test via Web App URL

### "Spreadsheet not found"
- Check SPREADSHEET_ID on line 19
- Make sure it matches your Sheet ID exactly

### "Sheet not found"
- Check all 8 tabs exist with exact names (case-sensitive)
- Names: Concerts, Artists, Attendees, Bookings, Booking_Attendees, Seat Tracking, Payment Logs, Config

### "API returns empty array"
- Add sample data to Concerts and Artists tabs
- Make sure data is in Row 2+ (Row 1 is headers)

### Website doesn't load concerts
- Check browser console for errors (F12)
- Verify Web App URL is correct in scripts/main.js
- Check CORS: Web App must have "Anyone" access

---

## 📁 Where Everything Is

```
living-room-baithaks/
├── index.html                       ← Your website
├── scripts/
│   ├── main.js                     ← UPDATE: Fetch URL here (Step 4.1)
│   └── booking-flow.js             ← UPDATE: API_URL here (Step 4.2)
├── data/
│   └── lrb_concerts_master_final_updated.json  ← Your source data
└── google_apps_script/
    └── Code.gs                     ← Backend code (Step 2.3)
                                      UPDATE: Line 19 SPREADSHEET_ID
```

---

## ✅ Checklist

**Google Sheet Setup:**
- [ ] Created spreadsheet
- [ ] Copied Sheet ID
- [ ] Created all 8 tabs with exact names
- [ ] Added column headers to all tabs
- [ ] Added sample/test data

**Apps Script Deployment:**
- [ ] Opened Extensions → Apps Script
- [ ] Pasted Code.gs content
- [ ] Updated SPREADSHEET_ID on line 19
- [ ] Saved code
- [ ] Ran testConnection successfully
- [ ] Deployed as Web App
- [ ] Copied Web App URL
- [ ] Tested URL in browser - returns JSON

**Data Migration:**
- [ ] Added your concerts to Concerts tab
- [ ] Added your artists to Artists tab
- [ ] Added seat tracking rows
- [ ] Tested API returns your concerts

**Website Connection:**
- [ ] Updated fetch URL in scripts/main.js
- [ ] Updated API_URL in scripts/booking-flow.js
- [ ] Tested locally - concerts load
- [ ] Tested booking flow - appears in Sheets

**Deployment:**
- [ ] Deployed website to production
- [ ] Tested live website works

---

**Need help? Check the detailed guides:**
- `GOOGLE_SHEETS_SETUP_RELATIONAL.md` - Full sheet structure details
- `STUDENT_SEATS_UPDATE.md` - Why student seat tracking matters
- `README.md` - Project overview

**You've got this!** 🚀
