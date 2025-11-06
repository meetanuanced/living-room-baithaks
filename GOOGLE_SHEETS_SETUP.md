# Google Sheets Setup Guide

## Overview

This Google Sheet will serve as the backend database for your Living Room Baithaks website, handling:
- Concert data (replaces Excel + JSON workflow)
- Booking management
- Seat availability tracking
- Payment screenshot storage

---

## Step 1: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it: **"Living Room Baithaks - Master Database"**

---

## Step 2: Create Sheet Tabs

Create these 5 sheets (tabs) in your Google Sheet:

### Sheet 1: **Concerts** (Master concert data)
### Sheet 2: **Bookings** (All booking submissions)
### Sheet 3: **Seat Tracking** (Real-time seat availability)
### Sheet 4: **Payment Logs** (Payment screenshot references)
### Sheet 5: **Config** (System configuration)

---

## Step 3: Sheet Structures

### 📅 **Sheet 1: Concerts**

This replaces your Excel master data.

**Column Headers (Row 1):**

| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| concert_id | title | sub_title | date | display_date | genre | image_hero | image_past | image_alt | concert_time | meal_time | meal_order | meal_type | ticket_price_general | ticket_price_student | inclusions | contribution_note | event_status |

| S | T | U |
|---|---|---|
| isCurrent | artists_json | duration |

**Sample Data (Row 2):**
```
CONC001 | Guided Listening | : Kishori Amonkar | 2025-08-02 | Aug 2025 | Guided Listening | ./Images/Baithaks/CONC001_hero.jpg | ./Images/Baithaks/CONC001_past.jpg | Kishori Amonkar Session | 10:30 | 13:00 | after | lunch | 1000 | 500 | Home-cooked meal & Baithak | Your contribution... | upcoming | Y | [{"name":"Vid Mowna","category":"Primary","genre":"Vocal"}] | 2Hours
```

**Notes:**
- `isCurrent`: Use "Y" for the upcoming concert to display on hero
- `event_status`: "upcoming" or "past"
- `artists_json`: JSON string of artists array

---

### 📝 **Sheet 2: Bookings**

Stores all booking submissions from the website.

**Column Headers (Row 1):**

| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| booking_id | transaction_id | timestamp | concert_id | concert_name | general_seats | student_seats | chairs_requested | total_amount | main_contact_name | main_contact_whatsapp | main_contact_email |

| M | N | O | P |
|---|---|---|---|
| all_attendees | payment_screenshot_url | booking_status | confirmation_sent |

**Sample Data (Row 2):**
```
LRB5432 | LRB5432 | 2025-01-15 10:30:00 | CONC001 | Guided Listening: Kishori Amonkar | 2 | 1 | 1 | 2500 | John Doe | +919876543210 | john@example.com | John Doe, Jane Doe, Student Name | https://drive.google.com/file/d/... | pending | No
```

**Booking Status Values:**
- `pending`: Awaiting confirmation
- `confirmed`: Confirmed and seat allocated
- `cancelled`: Booking cancelled
- `refunded`: Payment refunded

---

### 🪑 **Sheet 3: Seat Tracking**

Real-time seat availability per concert.

**Column Headers (Row 1):**

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| concert_id | total_seats | booked_seats | available_seats | chairs_total | chairs_booked |

**Sample Data (Row 2):**
```
CONC001 | 50 | 15 | 35 | 10 | 3
```

**Notes:**
- `available_seats` = `total_seats` - `booked_seats` (can be calculated automatically)
- Update `booked_seats` when bookings are confirmed

---

### 💰 **Sheet 4: Payment Logs**

Tracks payment screenshots uploaded to Google Drive.

**Column Headers (Row 1):**

| A | B | C | D | E |
|---|---|---|---|---|
| booking_id | transaction_id | screenshot_filename | drive_url | upload_timestamp |

**Sample Data (Row 2):**
```
LRB5432 | LRB5432 | payment_LRB5432.jpg | https://drive.google.com/file/d/... | 2025-01-15 10:35:00
```

---

### ⚙️ **Sheet 5: Config**

System configuration and settings.

**Column Headers (Row 1):**

| A | B |
|---|---|
| setting_key | setting_value |

**Sample Data:**
```
Row 2: upi_id | livingroombaithaks@upi
Row 3: venue_name | Sadashivnagar, Bangalore
Row 4: confirmation_whatsapp | +919880803110
Row 5: drive_folder_id | [Your Google Drive folder ID for uploads]
Row 6: default_total_seats | 50
Row 7: default_chairs_available | 10
Row 8: auto_confirm_bookings | No
```

---

## Step 4: Set Up Google Drive Folder

1. Create a folder in Google Drive: **"LRB Payment Screenshots"**
2. Right-click folder → Get link → Copy link
3. Extract folder ID from URL: `https://drive.google.com/drive/folders/[FOLDER_ID]`
4. Add folder ID to **Config** sheet (setting_key: `drive_folder_id`)

---

## Step 5: Share Permissions

1. Share the Google Sheet with your email (Editor access)
2. Share the Google Drive folder (Editor access)
3. These will be accessed by Google Apps Script

---

## Step 6: Initial Data Migration

Copy your existing concert data from `LRB_Master_Data.xlsx` to the **Concerts** sheet:

1. Open your Excel file
2. Copy concert data
3. Paste into **Concerts** sheet starting from Row 2
4. Adjust columns to match the structure above

For upcoming concerts:
- Set `event_status` = "upcoming"
- Set `isCurrent` = "Y" for the concert to display on hero

For past concerts:
- Set `event_status` = "past"
- Set `isCurrent` = "N"

---

## Step 7: Initialize Seat Tracking

For each concert in the **Concerts** sheet, add a row to **Seat Tracking**:

```
CONC001 | 50 | 0 | 50 | 10 | 0
CONC002 | 50 | 0 | 50 | 10 | 0
```

---

## Next Steps

After setting up the sheets:

1. ✅ Google Sheets structure complete
2. ⏭️ Install Google Apps Script (see `GOOGLE_APPS_SCRIPT_SETUP.md`)
3. ⏭️ Connect website to Google Apps Script API
4. ⏭️ Test booking flow end-to-end

---

## Sheet URL

Once created, your sheet URL will look like:
```
https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
```

Save this ID - you'll need it for Google Apps Script setup!

---

## Maintenance

### Adding a New Concert:
1. Add row to **Concerts** sheet
2. Set `isCurrent` = "Y" (and set previous concert to "N")
3. Add row to **Seat Tracking** sheet
4. Website will auto-update within seconds!

### Viewing Bookings:
- All bookings appear in **Bookings** sheet in real-time
- Filter by `booking_status` to see pending/confirmed bookings
- Download as CSV for offline analysis

### Checking Seat Availability:
- View **Seat Tracking** sheet for live availability
- `available_seats` updates automatically when bookings confirmed

---

## Troubleshooting

**Q: Concert not appearing on website?**
- Check `isCurrent` = "Y" in **Concerts** sheet
- Check `event_status` = "upcoming"
- Only ONE concert should have `isCurrent` = "Y"

**Q: Seat count not updating?**
- Check **Seat Tracking** sheet has row for that concert_id
- Check Google Apps Script is deployed correctly

**Q: Payment screenshot not saving?**
- Check Drive folder permissions
- Check `drive_folder_id` in **Config** sheet

---

**Ready for Google Apps Script setup!** 🚀
