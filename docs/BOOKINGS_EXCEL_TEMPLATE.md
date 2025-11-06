# Bookings Excel Template Structure

## Overview

This document describes the structure for `LRB_Master_BookingsData_Latest.xlsx` that will be migrated to Google Sheets.

If you're currently tracking bookings in Excel, this guide will help you understand how to structure your data before migrating to Google Sheets.

---

## Current Excel Structure (To Be Migrated)

### Sheet 1: Concerts

| concert_id | title | sub_title | date | display_date | genre | image_hero | image_past | image_alt | concert_time | meal_time | meal_order | meal_type | ticket_price_general | ticket_price_student | inclusions | contribution_note | event_gallery_link | event_recording_link | event_status | booking_status | duration | max_seats | chairs_available | venue_address | venue_google_map_link | whatsapp_group_link |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

**Example Data:**
```
CONC004 | Pratah Swar | : Morning Baithak | 2025-11-16 | Nov 2025 | Hindustani Vocal | ./Images/Baithaks/CONC004_hero.jpg | ./Images/Baithaks/CONC004_past.jpg | Siddharth Morning Baithak | 10:00 | 09:00 | before | breakfast | 1000 | 500 | Home-cooked meal & Raagdhari Baithak | Support the artists and music. | | | upcoming | Open | 1.5 Hours | 50 | 10 | 123 Main St, Bangalore | https://maps.google.com/... | https://chat.whatsapp.com/...
```

---

### Sheet 2: Artists

| artist_id | concert_id | name | category | genre | salutation | bio | image_url | social_links | guru_name |
|---|---|---|---|---|---|---|---|---|---|

**Example Data:**
```
ARTIST007 | CONC004 | Siddharth Belamannu | Primary | Vocal | Sri | Siddharth is a talented vocalist from Bangalore... | ./Images/Artists/ARTIST007.jpg | https://instagram.com/siddharth | Pt. XYZ
ARTIST008 | CONC004 | Udayraj Karpur | Accompanist | Tabla | Sri | Udayraj is an accomplished tabla player... | ./Images/Artists/ARTIST008.jpg | | Ustad ABC
```

**Note:** Each row represents one artist for one concert. If a concert has 3 artists (1 vocalist + 2 accompanists), you'll have 3 rows all with the same `concert_id`.

---

### Sheet 3: Bookings (If you're tracking these in Excel)

| booking_id | transaction_id | timestamp | concert_id | concert_name | general_seats | student_seats | chairs_requested | total_amount | main_contact_name | main_contact_whatsapp | main_contact_email | payment_screenshot_url | booking_status | confirmation_sent | booking_notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

**Example Data:**
```
BK_1699876543210 | TXN123456 | 2025-11-15 10:30:45 | CONC004 | Pratah Swar: Morning Baithak | 2 | 1 | 1 | 2500 | Rajesh Kumar | +919876543210 | rajesh@example.com | https://drive.google.com/... | confirmed | Yes | Late arrival expected
```

---

### Sheet 4: Booking Details (Individual Attendees)

| booking_id | attendee_name | whatsapp | email | seat_type | needs_chair | is_main_contact |
|---|---|---|---|---|---|---|

**Example Data:**
```
BK_1699876543210 | Rajesh Kumar | +919876543210 | rajesh@example.com | General | No | Yes
BK_1699876543210 | Priya Kumar | +919876543211 | priya@example.com | General | No | No
BK_1699876543210 | Amit Sharma | +919876543212 | amit@example.com | Student | Yes | No
```

This structure captures each individual attendee in a group booking.

---

## Comparison: Excel vs Google Sheets Structure

### Excel Approach (Current - Manual)

**Pros:**
- Familiar interface
- Works offline
- Easy to share via email

**Cons:**
- Manual JSON conversion required
- No API access for website
- Version control issues
- Can't update website dynamically
- Prone to data loss if file corrupts
- No automatic seat availability tracking

### Google Sheets Approach (Proposed - Automated)

**Pros:**
- Direct API access via Google Apps Script
- Website can fetch live data automatically
- Real-time seat availability updates
- Multiple people can edit simultaneously
- Auto-save and version history
- Payment screenshots upload to Google Drive automatically
- Master Attendees table for tracking repeat guests
- No manual JSON conversion needed

**Cons:**
- Requires internet connection
- Initial setup time (one-time)
- Slight learning curve for Apps Script

---

## Migration Path

### Option 1: Full Migration (Recommended)

**Stop using Excel completely → Move everything to Google Sheets**

**Steps:**
1. Create Google Sheet with structure from `GOOGLE_SHEETS_SETUP_RELATIONAL.md`
2. Copy all data from Excel to Google Sheets (one-time copy-paste)
3. Deploy `Code_Relational.gs` as Web App
4. Update website to fetch from Google Apps Script URL instead of local JSON
5. Delete or archive Excel files

**Benefits:**
- Single source of truth
- No manual work after initial setup
- Real-time website updates

---

### Option 2: Hybrid (Keep Python Script)

**Keep Python script but read from Google Sheets instead of Excel**

**Steps:**
1. Create Google Sheet with your data
2. Update Python script to use `gspread` library:
```python
import gspread
from oauth2client.service_account import ServiceAccountCredentials

# Authenticate
scope = ['https://spreadsheets.google.com/feeds']
creds = ServiceAccountCredentials.from_json_keyfile_name('credentials.json', scope)
client = gspread.authorize(creds)

# Open sheet
sheet = client.open('Living Room Baithaks - Master Database')

# Read concerts
concerts_sheet = sheet.worksheet('Concerts')
concerts = concerts_sheet.get_all_records()

# Read artists
artists_sheet = sheet.worksheet('Artists')
artists = artists_sheet.get_all_records()

# Generate JSON same as before
# ... your existing JSON generation logic
```

3. Deploy Google Apps Script separately for booking submissions
4. Python script generates JSON for website reading

**Benefits:**
- Keep existing Python transformation logic
- Eliminate manual Excel file management
- Still get Google Sheets benefits (collaboration, version control)

---

### Option 3: Excel + Manual JSON (Current Setup - Not Recommended)

**Keep everything as-is**

**Steps:**
- Continue using Excel
- Continue running Python script manually
- Continue copying JSON to website folder
- Deploy Google Apps Script only for booking submissions

**Drawbacks:**
- Still requires manual work for every concert update
- Website doesn't show live seat availability
- Prone to errors from manual processes

---

## Recommended Approach for Your Workflow

Based on your requirements:

**Phase 1: Set up Google Sheets backend (Now)**
1. Create Google Sheet with 8 tabs (Artists, Concerts, Attendees, Bookings, Booking_Attendees, Seat Tracking, Payment Logs, Config)
2. Migrate your Excel data to Google Sheets (one-time copy-paste)
3. Deploy `Code_Relational.gs` as Web App
4. Test API endpoints

**Phase 2: Connect website to Google Apps Script (Next)**
1. Update website to fetch from Apps Script URL:
```javascript
// Old way (static JSON file)
fetch('./lrb_concerts_master_final_updated.json')

// New way (live from Google Sheets)
fetch('https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=getConcerts')
```

2. Update booking submission to use Apps Script API
3. Test end-to-end flow

**Phase 3: Retire Python script (Optional - Later)**
1. Once Google Sheets is working smoothly, decide if Python script is still needed
2. If not needed, archive it
3. If still needed for complex transformations, update it to read from Google Sheets

---

## Data Validation Recommendations

### For Concerts Sheet

Add dropdown validation in Google Sheets:

- **event_status**: List = `past, upcoming`
- **booking_status**: List = `Open, Closed, Sold Out`
- **meal_order**: List = `before, after`
- **meal_type**: List = `breakfast, lunch, dinner, snacks`

### For Artists Sheet

- **category**: List = `Primary, Accompanist`
- **genre**: List = `Vocal, Flute, Tabla, Harmonium, Violin, Sarangi, Sitar, Sarod`

### For Bookings Sheet

- **booking_status**: List = `pending, confirmed, cancelled`
- **confirmation_sent**: List = `Yes, No`

---

## Next Steps

1. ✅ Read this document thoroughly
2. ✅ Review your current Excel file structure
3. ✅ Compare with proposed Google Sheets structure
4. ✅ Decide on migration approach (Full/Hybrid/Current)
5. ⏭️ Follow `MIGRATION_GUIDE.md` for step-by-step setup
6. ⏭️ Deploy `Code_Relational.gs` as Web App
7. ⏭️ Test with sample data
8. ⏭️ Update website to fetch from Apps Script

---

## Questions to Consider

Before migrating, answer these questions:

1. **Do you want to keep your Python script?**
   - Yes → Use Hybrid approach
   - No → Use Full Migration approach

2. **Do you need artists and concerts as separate tables?**
   - Yes → Use relational structure (Artists sheet has `concert_id` column)
   - No → Could simplify, but relational is more flexible

3. **Do you want a master Attendees table?**
   - Yes → Helps track repeat guests, lifetime stats
   - No → Just store attendee names in booking records

4. **How often do you update concert data?**
   - Weekly → Manual Excel may be acceptable
   - Multiple times per week → Automate with Google Sheets

5. **Do you want live seat availability on website?**
   - Yes → Must use Google Apps Script API
   - No → Can continue with static JSON

---

**Ready to migrate?** See `MIGRATION_GUIDE.md` for detailed step-by-step instructions.
