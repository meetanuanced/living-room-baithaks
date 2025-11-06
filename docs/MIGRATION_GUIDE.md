# Migration Guide: Excel → Google Sheets + Apps Script

## Overview

This guide walks you through migrating from your current Excel + Python JSON workflow to an automated Google Sheets + Apps Script system.

**Time Required:** 2-3 hours for initial setup
**Technical Level:** Intermediate (copy-paste, basic Google Apps Script)
**Result:** Fully automated booking system with live seat availability

---

## Before You Start

### What You'll Need

- [ ] Your existing `LRB_Master_Data.xlsx` file
- [ ] Your existing `LRB_Master_BookingsData_Latest.xlsx` file (if you have one)
- [ ] Google Account (you already have this)
- [ ] Web browser
- [ ] 2-3 hours of focused time

### What You'll Get

✅ Single source of truth in Google Sheets
✅ Website automatically fetches latest concert data
✅ Booking submissions go directly to Google Sheets
✅ Payment screenshots auto-upload to Google Drive
✅ Master attendees table for tracking repeat guests
✅ Real-time seat availability
✅ No more manual JSON conversion
✅ No more Python script needed (optional)

---

## Phase 1: Create Google Sheet Structure

### Step 1.1: Create New Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **+ Blank** to create new spreadsheet
3. Click "Untitled spreadsheet" at top-left
4. Rename to: **Living Room Baithaks - Master Database**
5. Note the Sheet ID from URL:
   ```
   https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit
   ```
   Copy `YOUR_SHEET_ID_HERE` — you'll need this later

### Step 1.2: Create Sheet Tabs

By default, you have 1 tab called "Sheet1". Let's create all tabs:

1. **Rename Sheet1 → Artists**
   - Right-click "Sheet1" → Rename → Type "Artists"

2. **Create remaining 7 tabs:**
   - Click the **+** button at bottom-left (7 times)
   - Rename each tab:
     - Sheet2 → **Concerts**
     - Sheet3 → **Attendees**
     - Sheet4 → **Bookings**
     - Sheet5 → **Booking_Attendees**
     - Sheet6 → **Seat Tracking**
     - Sheet7 → **Payment Logs**
     - Sheet8 → **Config**

You should now have 8 tabs. Order them as listed above for consistency.

### Step 1.3: Add Column Headers

For each tab, add the column headers from below. Just type them in Row 1.

#### Tab 1: Artists

```
artist_id | concert_id | name | category | genre | salutation | bio | image_url | social_links | guru_name
```

#### Tab 2: Concerts

```
concert_id | title | sub_title | date | display_date | genre | image_hero | image_past | image_alt | concert_time | meal_time | meal_order | meal_type | ticket_price_general | ticket_price_student | inclusions | contribution_note | event_gallery_link | event_recording_link | event_status | booking_status | duration | max_seats | chairs_available | venue_address | venue_google_map_link | whatsapp_group_link | isCurrent
```

**Tip:** Copy the text above, click cell A1, paste, then use **Data → Split text to columns** to automatically split by `|`.

#### Tab 3: Attendees

```
attendee_id | name | whatsapp | email | student_status | needs_chair | first_concert_id | first_concert_date | total_concerts_attended | last_concert_id | last_concert_date | notes
```

#### Tab 4: Bookings

```
booking_id | transaction_id | timestamp | concert_id | concert_name | general_seats | student_seats | chairs_requested | total_amount | main_contact_attendee_id | payment_screenshot_url | booking_status | confirmation_sent | booking_notes
```

#### Tab 5: Booking_Attendees

```
booking_id | attendee_id | seat_type | needs_chair | is_main_contact
```

#### Tab 6: Seat Tracking

```
concert_id | total_seats | booked_seats | available_seats | chairs_total | chairs_booked | chairs_available
```

#### Tab 7: Payment Logs

```
booking_id | transaction_id | filename | drive_url | upload_timestamp
```

#### Tab 8: Config

```
key | value | description
```

---

## Phase 2: Migrate Your Data

### Step 2.1: Migrate Concert Data

1. Open your `LRB_Master_Data.xlsx` in Excel/Numbers/LibreOffice
2. If you have a "Concerts" sheet:
   - Select all data rows (not header)
   - Copy
   - Go to Google Sheet → **Concerts** tab → Click cell A2
   - Paste

3. If you DON'T have a separate Concerts sheet:
   - Manually enter your concert data in Google Sheet
   - Use your JSON file as reference (`lrb_concerts_master_final_updated.json`)
   - Example row:
     ```
     CONC004 | Pratah Swar | : Morning Baithak | 2025-11-16 | Nov 2025 | Hindustani Vocal | ./Images/Baithaks/CONC004_hero.jpg | ./Images/Baithaks/CONC004_past.jpg | Siddharth Morning Baithak | 10:00 | 09:00 | before | breakfast | 1000 | 500 | Home-cooked meal & Raagdhari Baithak | Support the artists and music. | | | upcoming | Open | 1.5 Hours | 50 | 10 | | | | Y
     ```

### Step 2.2: Migrate Artist Data

Your JSON has artists embedded in concerts like this:
```json
"artists": [
  {
    "id": "ARTIST007",
    "name": "Siddharth Belamannu",
    "category": "Primary",
    "genre": "Vocal"
  }
]
```

You need to convert this to relational format:

**For each concert in your JSON:**
1. Go to **Artists** tab in Google Sheet
2. Add one row per artist
3. Include the `concert_id` in each row

**Example:**

From JSON:
```json
{
  "concert_id": "CONC004",
  "artists": [
    { "id": "ARTIST007", "name": "Siddharth Belamannu", "category": "Primary", "genre": "Vocal" }
  ]
}
```

To Google Sheet (Artists tab, Row 2):
```
ARTIST007 | CONC004 | Siddharth Belamannu | Primary | Vocal | Sri | | | |
```

**Repeat for all concerts and artists from your JSON.**

If a concert has 3 artists (vocalist + tabla + harmonium), you'll have 3 rows in the Artists tab, all with the same `concert_id`.

### Step 2.3: Set Up Seat Tracking

1. Go to **Seat Tracking** tab
2. For each concert, add a row:

```
concert_id | total_seats | booked_seats | available_seats | chairs_total | chairs_booked | chairs_available
CONC001    | 30          | 30           | 0               | 10           | 10            | 0
CONC002    | 50          | 42           | 8               | 15           | 12            | 3
CONC004    | 50          | 0            | 50              | 10           | 0             | 10
```

**Set up formulas for auto-calculation:**

- Click cell **D2** (available_seats)
- Type: `=B2-C2`
- Drag down to apply to all rows

- Click cell **G2** (chairs_available)
- Type: `=E2-F2`
- Drag down to apply to all rows

Now seat availability will auto-update when you change booked counts!

### Step 2.4: Set Up Config

Go to **Config** tab and add these rows:

```
key                           | value                    | description
drive_folder_id               | YOUR_FOLDER_ID_HERE      | Google Drive folder for payment screenshots
auto_confirm_bookings         | No                       | Auto-confirm without manual review
booking_confirmation_email    | your-email@example.com   | Email for booking notifications
max_seats_per_booking         | 10                       | Maximum seats in one booking
enable_student_pricing        | Yes                      | Allow student discounts
```

**To get your Drive folder ID:**
1. Go to [Google Drive](https://drive.google.com)
2. Create a folder: **LRB Payment Screenshots**
3. Open the folder
4. Copy the ID from URL:
   ```
   https://drive.google.com/drive/folders/YOUR_FOLDER_ID_HERE
   ```
5. Paste into Config sheet → drive_folder_id row

### Step 2.5: Migrate Bookings (Optional - If You Have Historical Data)

If you have a `LRB_Master_BookingsData_Latest.xlsx` with past bookings:

1. Open it in Excel
2. Copy booking data
3. Paste into Google Sheet → **Bookings** tab

Otherwise, leave the Bookings tab empty (bookings will be added by the website form).

---

## Phase 3: Deploy Google Apps Script

### Step 3.1: Open Script Editor

1. In your Google Sheet, click **Extensions** → **Apps Script**
2. A new tab opens with `Code.gs` file
3. Delete any default code in the editor

### Step 3.2: Add the Script

1. Go to your project folder: `/home/user/living-room-baithaks/`
2. Open file: **Code_Relational.gs**
3. Copy ALL the code (1000+ lines)
4. Paste into the Apps Script editor

### Step 3.3: Configure the Script

Find this line near the top:
```javascript
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
```

Replace `YOUR_SPREADSHEET_ID_HERE` with your actual Sheet ID from Step 1.1.

Example:
```javascript
const SPREADSHEET_ID = '1abc123XYZ789-YOUR-ACTUAL-ID';
```

### Step 3.4: Save the Script

1. Click the **💾 Save** icon (or Ctrl+S / Cmd+S)
2. Name it: **LRB Booking Backend**

### Step 3.5: Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ → Select **Web app**
3. Configure:
   - **Description:** "LRB Public API v1"
   - **Execute as:** Me (your email)
   - **Who has access:** **Anyone** (important!)
4. Click **Deploy**
5. **Authorize the app:**
   - Click **Authorize access**
   - Choose your Google account
   - Click **Advanced** → **Go to LRB Booking Backend (unsafe)** (it's safe, it's your own script)
   - Click **Allow**

6. **Copy the Web App URL:**
   ```
   https://script.google.com/macros/s/AKfycbz.../exec
   ```
   **Save this URL** — you'll need it to connect the website!

### Step 3.6: Test the API

Open your Web App URL in a browser:
```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=getConcerts
```

You should see JSON output with all your concerts and embedded artists!

Example response:
```json
[
  {
    "concert_id": "CONC004",
    "title": "Pratah Swar",
    "sub_title": ": Morning Baithak",
    "date": "2025-11-16",
    ...
    "artists": [
      {
        "id": "ARTIST007",
        "name": "Siddharth Belamannu",
        "category": "Primary",
        "genre": "Vocal"
      }
    ]
  }
]
```

**If you see this JSON output, congratulations! Your backend is live! 🎉**

---

## Phase 4: Connect Website to Google Apps Script

### Step 4.1: Update JavaScript to Fetch from API

1. Open: `src/living_room_website/scripts/main.js`

2. Find the line that fetches JSON (around line 200):
```javascript
fetch('./lrb_concerts_master_final_updated.json')
```

3. Replace with your Apps Script URL:
```javascript
fetch('https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=getConcerts')
```

### Step 4.2: Update Booking Submission

1. Open: `src/living_room_website/scripts/booking-flow.js`

2. Find the `submitBookingToBackend()` function

3. Update the API URL to your Apps Script deployment:
```javascript
const API_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

async function submitBookingToBackend(bookingData) {
  const response = await fetch(`${API_URL}?action=submitBooking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData)
  });
  return response.json();
}
```

### Step 4.3: Test Locally

1. Open `index.html` in your browser
2. Check if concerts are loading from Google Sheets
3. Try the booking flow:
   - Select a concert
   - Fill in attendee details
   - Upload payment screenshot
   - Submit booking

4. **Check Google Sheets:**
   - Go to **Bookings** tab → New row should appear
   - Go to **Attendees** tab → New attendees should appear
   - Go to **Booking_Attendees** tab → Junction records should appear
   - Go to **Payment Logs** tab → Screenshot upload record should appear

---

## Phase 5: Deploy Website

### Option A: Deploy to Netlify (Recommended)

1. **Install Netlify CLI:**
```bash
npm install -g netlify-cli
```

2. **Navigate to website folder:**
```bash
cd /home/user/living-room-baithaks/src/living_room_website
```

3. **Deploy:**
```bash
netlify deploy --prod
```

4. Follow prompts:
   - Authorize Netlify
   - Choose "Create & configure a new site"
   - Site name: `lrb-baithaks` (or your choice)
   - Publish directory: `.` (current folder)

5. **Your site is live!**
   ```
   https://lrb-baithaks.netlify.app
   ```

### Option B: Deploy to GitHub Pages

1. **Push code to GitHub:**
```bash
git add .
git commit -m "Connect website to Google Apps Script backend"
git push origin main
```

2. **Enable GitHub Pages:**
   - Go to your repo on GitHub
   - Settings → Pages
   - Source: `main` branch
   - Folder: `/src/living_room_website`
   - Save

3. **Your site is live!**
   ```
   https://yourusername.github.io/living-room-baithaks/
   ```

---

## Phase 6: Retire Old Workflow (Optional)

Now that everything is automated, you can retire manual processes:

### What to Keep:
- ✅ Google Sheet (your new single source of truth)
- ✅ Google Apps Script (your backend API)
- ✅ Website code (now connected to live data)

### What to Archive:
- 📦 `LRB_Master_Data.xlsx` → Archive to `archive/` folder
- 📦 `LRB_Master_BookingsData_Latest.xlsx` → Archive
- 📦 Python JSON generation script → Archive (no longer needed)
- 📦 `lrb_concerts_master_final_updated.json` → Archive (now fetched live)

### How to Archive:

```bash
cd /home/user/living-room-baithaks

# Create archive folder
mkdir -p archive/old_workflow

# Move old files
mv src/excel_input/LRB_Master_Data.xlsx archive/old_workflow/
mv src/living_room_website/lrb_concerts_master_final_updated.json archive/old_workflow/

# Commit changes
git add .
git commit -m "Archive old Excel+JSON workflow files"
git push
```

---

## Maintenance & Operations

### Adding a New Concert

**Old way (manual):**
1. Update Excel
2. Run Python script
3. Copy JSON to website folder
4. Push to GitHub
5. Deploy website

**New way (automated):**
1. Go to Google Sheet → **Concerts** tab
2. Add new row with concert details
3. Go to **Artists** tab → Add artist row(s) with same `concert_id`
4. Go to **Seat Tracking** tab → Add seat availability row
5. **Done!** Website automatically shows new concert.

### Viewing Bookings

1. Go to Google Sheet → **Bookings** tab
2. See all bookings with timestamps, amounts, status
3. Filter/sort as needed
4. Download CSV if needed for accounting

### Confirming a Booking

When a booking comes in:

1. Go to **Bookings** tab
2. Find the booking row
3. Check payment screenshot (link in `payment_screenshot_url` column)
4. If payment is valid:
   - Change `booking_status` from "pending" to "confirmed"
   - Change `confirmation_sent` to "Yes"
   - The script will auto-update seat availability

5. Send confirmation to the guest (manually or set up email automation)

### Tracking Repeat Attendees

1. Go to **Attendees** tab
2. Sort by `total_concerts_attended` (descending)
3. See your most loyal audience members!
4. Use this for:
   - Priority invites
   - Loyalty rewards
   - Targeted communications

---

## Troubleshooting

### Problem: API returns empty array

**Solution:**
- Check if you added data to Google Sheets
- Check if `SPREADSHEET_ID` in Code.gs matches your actual Sheet ID
- Check if sheet tab names match exactly (case-sensitive)

### Problem: Booking submission fails

**Solution:**
- Check if `drive_folder_id` is set in Config sheet
- Check if you gave "Anyone" access when deploying Web App
- Check browser console for error messages

### Problem: Special characters showing as �

**Solution:**
- Make sure your Google Sheet uses UTF-8 encoding (default)
- Check if your website has `<meta charset="UTF-8">` in HTML

### Problem: Seat availability not updating

**Solution:**
- Check formulas in **Seat Tracking** sheet
- Ensure `available_seats` formula is: `=B2-C2`
- Ensure `chairs_available` formula is: `=E2-F2`

---

## Support & Resources

- **Google Sheets Setup:** `GOOGLE_SHEETS_SETUP_RELATIONAL.md`
- **Apps Script Code:** `Code_Relational.gs`
- **Excel Template:** `BOOKINGS_EXCEL_TEMPLATE.md`
- **Website Integration:** `src/living_room_website/scripts/`

---

## Checklist: Migration Complete ✅

- [ ] Created Google Sheet with 8 tabs
- [ ] Added column headers to all tabs
- [ ] Migrated concert data from Excel
- [ ] Migrated artist data to relational format
- [ ] Set up Seat Tracking with formulas
- [ ] Configured Config sheet with Drive folder ID
- [ ] Copied Code_Relational.gs to Apps Script
- [ ] Updated SPREADSHEET_ID in script
- [ ] Deployed as Web App
- [ ] Tested API endpoint (returns JSON)
- [ ] Updated website JavaScript with Apps Script URL
- [ ] Tested booking submission locally
- [ ] Deployed website to production
- [ ] Archived old Excel/JSON files
- [ ] Submitted test booking and verified in Google Sheets

---

**Congratulations! You've successfully migrated to a fully automated booking system! 🎉**

Your workflow is now:
1. Add concert to Google Sheet → Website updates automatically
2. Guest submits booking → Appears in Google Sheets automatically
3. Review booking → Confirm → Seat availability updates automatically
4. Track repeat attendees → Use Attendees master table

No more manual JSON conversion. No more Python scripts. No more file copying.

**Everything just works!** ✨
