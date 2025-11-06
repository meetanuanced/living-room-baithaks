# Google Sheets Setup - Relational Structure

## Overview

This setup maintains separate tables for Artists, Concerts, and Attendees with proper relationships, matching your existing workflow while eliminating manual Excel-to-JSON conversion.

---

## Sheet 1: Artists

**Purpose:** All artists linked to concerts (relational structure)

| Column Name | Type | Description | Example |
|---|---|---|---|
| artist_id | Text | Unique artist identifier | ARTIST001 |
| concert_id | Text | Foreign key to Concerts | CONC001 |
| name | Text | Full name of artist | Vid Mowna Ramachandra |
| category | Text | Primary/Accompanist | Primary |
| genre | Text | Artist's genre/instrument | Vocal |
| salutation | Text | Title (Vid, Sri, etc.) | Vid |
| bio | Text | Artist biography | ... |
| image_url | Text | Artist photo path | ./Images/Artists/ARTIST001.jpg |
| social_links | Text | Social media links (comma-separated) | https://instagram.com/artist |
| guru_name | Text | Name of guru/teacher | Pt. XYZ |

**Sample Data:**
```
artist_id  | concert_id | name                     | category     | genre      | salutation |
ARTIST001  | CONC001    | Vid Mowna Ramachandra    | Primary      | Vocal      | Vid        |
ARTIST002  | CONC002    | Aniruddh Aithal          | Primary      | Vocal      |            |
ARTIST005  | CONC002    | Yogeesh Bhat             | Accompanist  | Tabla      |            |
ARTIST006  | CONC002    | Gaurav Gadiyar           | Accompanist  | Harmonium  |            |
ARTIST007  | CONC003    | Ashwin Srinivasan        | Primary      | Flute      | Sri        |
ARTIST008  | CONC003    | Udayraj Karpur           | Accompanist  | Tabla      | Sri        |
```

**Note:** Each artist appears once per concert. For concerts with multiple artists (vocalist + accompanists), add separate rows for each artist.

---

## Sheet 2: Concerts

**Purpose:** Concert/event details

| Column Name | Type | Description | Example |
|---|---|---|---|
| concert_id | Text | Unique concert identifier | CONC001 |
| title | Text | Concert title | Guided Listening |
| sub_title | Text | Subtitle or theme | : Kishori Amonkar |
| date | Date | Event date | 2025-08-02 |
| display_date | Text | Display format | Aug 2025 |
| genre | Text | Music genre | Guided Listening |
| image_hero | Text | Hero section image path | ./Images/Baithaks/CONC001_hero.jpg |
| image_past | Text | Past events image path | ./Images/Baithaks/CONC001_past.jpg |
| image_alt | Text | Image alt text for accessibility | Kishori Amonkar Guided Listening |
| concert_time | Text | Start time (HH:MM) | 10:30 |
| meal_time | Text | Meal time (HH:MM) | 13:00 |
| meal_order | Text | before/after | after |
| meal_type | Text | breakfast/lunch/dinner | lunch |
| ticket_price_general | Number | General admission price | 500 |
| ticket_price_student | Number | Student price | 300 |
| inclusions | Text | What's included | Home-cooked meal & Raagdhari Baithak |
| contribution_note | Text | Pricing explanation | Your contribution goes entirely toward... |
| event_gallery_link | Text | Photos link | https://photos.app.goo.gl/samplelink1 |
| event_recording_link | Text | Recording link | null |
| event_status | Text | past/upcoming | past |
| booking_status | Text | Open/Closed/Sold Out | Closed |
| duration | Text | Event duration | 2 Hours |
| max_seats | Number | Total capacity | 50 |
| chairs_available | Number | Chairs available | 20 |
| venue_address | Text | Full venue address | 123 Main St, Bangalore |
| venue_google_map_link | Text | Google Maps link | https://maps.google.com/... |
| whatsapp_group_link | Text | WhatsApp group invite link | https://chat.whatsapp.com/... |

**Sample Data:**
```
concert_id | title              | sub_title              | date       | event_status | booking_status | max_seats |
CONC001    | Guided Listening   | Kishori Amonkar        | 2025-08-02 | past         | Closed         | 30        |
CONC002    | Nava Swar          | Emerging Young Talent  | 2025-09-06 | past         | Closed         | 50        |
CONC004    | Pratah Swar        | Morning Baithak        | 2025-11-16 | upcoming     | Sold Out       | 50        |
```

---

## Sheet 3: Attendees (Master Table)

**Purpose:** Master list of all people who have attended or booked any concert

| Column Name | Type | Description | Example |
|---|---|---|---|
| attendee_id | Text | Unique ID (auto-generated) | ATT001 |
| name | Text | Full name | Rajesh Kumar |
| whatsapp | Text | WhatsApp number with country code | +919876543210 |
| email | Text | Email address | rajesh@example.com |
| student_status | Text | Student/General/Unknown | General |
| needs_chair | Text | Yes/No (default preference) | No |
| first_concert_id | Text | First concert attended | CONC001 |
| first_concert_date | Date | Date of first attendance | 2025-08-02 |
| total_concerts_attended | Number | Count of concerts | 3 |
| last_concert_id | Text | Most recent concert | CONC004 |
| last_concert_date | Date | Date of last attendance | 2025-11-16 |
| notes | Text (optional) | Internal notes | Allergic to peanuts |

**Sample Data:**
```
attendee_id | name           | whatsapp       | email              | total_concerts_attended |
ATT001      | Rajesh Kumar   | +919876543210  | rajesh@example.com | 3                       |
ATT002      | Priya Sharma   | +919876543211  | priya@example.com  | 1                       |
```

**Benefits of Master Attendees Table:**
- Track repeat attendees across concerts
- Identify loyal audience members
- Send targeted communications
- Analyze attendance patterns
- Pre-fill forms for returning guests
- Track lifetime value

---

## Sheet 4: Bookings

**Purpose:** All booking submissions

| Column Name | Type | Description | Example |
|---|---|---|---|
| booking_id | Text | Unique booking ID | BK_1699876543210 |
| transaction_id | Text | Payment reference | TXN123456 |
| timestamp | Datetime | Submission time | 2025-11-15 10:30:45 |
| concert_id | Text | Foreign key to Concerts | CONC004 |
| concert_name | Text | Concert title (denormalized) | Pratah Swar: Morning Baithak |
| general_seats | Number | General admission count | 2 |
| student_seats | Number | Student admission count | 1 |
| chairs_requested | Number | Total chairs needed | 1 |
| total_amount | Number | Total payment | 2500 |
| main_contact_attendee_id | Text | Foreign key to Attendees | ATT001 |
| payment_screenshot_url | Text | Google Drive link | https://drive.google.com/... |
| booking_status | Text | pending/confirmed/cancelled | confirmed |
| confirmation_sent | Text | Yes/No | Yes |
| booking_notes | Text (optional) | Special requests | Late arrival expected |

**Sample Data:**
```
booking_id          | concert_id | main_contact_attendee_id | general_seats | student_seats | total_amount |
BK_1699876543210    | CONC004    | ATT001                   | 2             | 1             | 2500         |
```

---

## Sheet 5: Booking_Attendees (Junction Table)

**Purpose:** Links bookings with all attendees (captures each person in a group booking)

| Column Name | Type | Description | Example |
|---|---|---|---|
| booking_id | Text | Foreign key to Bookings | BK_1699876543210 |
| attendee_id | Text | Foreign key to Attendees | ATT001 |
| seat_type | Text | General/Student | General |
| needs_chair | Text | Yes/No | No |
| is_main_contact | Text | Yes/No | Yes |

**Sample Data:**
```
booking_id          | attendee_id | seat_type | needs_chair | is_main_contact |
BK_1699876543210    | ATT001      | General   | No          | Yes             |
BK_1699876543210    | ATT002      | General   | No          | No              |
BK_1699876543210    | ATT003      | Student   | Yes         | No              |
```

---

## Sheet 6: Seat Tracking

**Purpose:** Real-time seat availability per concert

| Column Name | Type | Description | Example |
|---|---|---|---|
| concert_id | Text | Foreign key to Concerts | CONC004 |
| total_seats | Number | Total capacity | 50 |
| booked_seats | Number | Confirmed bookings | 15 |
| available_seats | Number | Formula: =B2-C2 | 35 |
| chairs_total | Number | Total chairs available | 10 |
| chairs_booked | Number | Chairs confirmed | 3 |
| chairs_available | Number | Formula: =E2-F2 | 7 |

**Formula Setup:**
- Column D (available_seats): `=B2-C2`
- Column G (chairs_available): `=E2-F2`

**Sample Data:**
```
concert_id | total_seats | booked_seats | available_seats | chairs_total | chairs_booked |
CONC004    | 50          | 15           | 35              | 10           | 3             |
```

---

## Sheet 7: Payment Logs

**Purpose:** Audit trail for payment screenshots

| Column Name | Type | Description | Example |
|---|---|---|---|
| booking_id | Text | Foreign key to Bookings | BK_1699876543210 |
| transaction_id | Text | Payment reference | TXN123456 |
| filename | Text | Screenshot filename | payment_BK_1699876543210.jpg |
| drive_url | Text | Google Drive file URL | https://drive.google.com/... |
| upload_timestamp | Datetime | When uploaded | 2025-11-15 10:31:00 |

---

## Sheet 8: Config

**Purpose:** System configuration settings

| Key | Value | Description |
|---|---|---|
| drive_folder_id | 1abc123XYZ... | Google Drive folder ID for screenshots |
| auto_confirm_bookings | No | Auto-confirm without manual review (Yes/No) |
| booking_confirmation_email | host@example.com | Email for booking notifications |
| max_seats_per_booking | 10 | Maximum seats in one booking |
| enable_student_pricing | Yes | Allow student discounts (Yes/No) |

---

## Setup Instructions

### Step 1: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create new spreadsheet
3. Name it: **"Living Room Baithaks - Master Database"**

### Step 2: Create All Sheets

Create 8 sheets (tabs) with these exact names:
- Artists
- Concerts
- Attendees
- Bookings
- Booking_Attendees
- Seat Tracking
- Payment Logs
- Config

**Note:** We removed the `Concert_Artists` junction table because your data structure already links artists to concerts via `concert_id` in the Artists sheet itself.

### Step 3: Set Up Headers

For each sheet, add the column headers from the tables above.

### Step 4: Migrate Your Existing Data

**From your Excel file:**

1. **Artists sheet:** Copy all artist data
2. **Concerts sheet:** Copy all concert data
3. **Concert_Artists sheet:** Create relationships between concerts and artists
4. **Seat Tracking:** Add row for each concert with capacity

### Step 5: Set Up Google Drive Folder

1. Create folder: **"LRB Payment Screenshots"**
2. Right-click → **Get link** → Copy the folder ID (between `/folders/` and end of URL)
3. Add to **Config** sheet → `drive_folder_id` row

### Step 6: Add Data Validation (Optional but Recommended)

**Artists sheet:**
- `category`: List of "Primary, Accompanist"
- `genre`: List of "Vocal, Flute, Tabla, Harmonium, Violin, Sarangi"

**Concerts sheet:**
- `meal_order`: List of "before, after"
- `meal_type`: List of "breakfast, lunch, dinner"
- `event_status`: List of "past, upcoming"
- `isCurrent`: List of "Y, N"

**Bookings sheet:**
- `booking_status`: List of "pending, confirmed, cancelled"
- `confirmation_sent`: List of "Yes, No"

---

## Migration from Excel

If you want to keep using your Python script:

**Option 1:** Update script to read from Google Sheets instead of Excel
- Use `gspread` Python library
- Read from Google Sheets API
- Generate JSON same as before

**Option 2:** Manually migrate once, then use Google Apps Script
- One-time copy of Excel data to Google Sheets
- Disable Python script
- Use Apps Script for all future updates

**Option 3:** Hybrid approach
- Keep Python script for complex transformations
- Script reads from Google Sheets instead of Excel
- Script writes JSON or updates Google Sheets

---

## Benefits of This Structure

### 1. Normalized Data (No Duplication)
- Each artist stored once, referenced many times
- Update artist name in one place → updates everywhere

### 2. Master Attendees Table
- Track repeat attendees
- Lifetime analytics
- Targeted communications
- Pre-filled forms for returning guests

### 3. Flexible Concert-Artist Relationships
- Support multiple artists per concert
- Support guest artists
- Track accompanists separately

### 4. Complete Booking Details
- Every attendee captured individually
- Chair requests per person
- Easy to generate reports

### 5. Real-time Seat Management
- Automatic availability updates
- Prevents overbooking
- Accurate counts

---

## Sample Queries You Can Run

With this structure, you can easily answer questions like:

- "How many times has Rajesh Kumar attended?" → Query Attendees table
- "Which concerts did ARTIST002 perform at?" → Query Concert_Artists junction table
- "How many chairs are booked for CONC004?" → Query Seat Tracking
- "Who are the repeat attendees (3+ concerts)?" → Query Attendees where total_concerts_attended >= 3
- "Total revenue from CONC004?" → SUM(total_amount) WHERE concert_id = CONC004

---

## Next Steps

1. ✅ Create Google Sheet with all 9 tabs
2. ✅ Add column headers
3. ✅ Migrate data from your Excel file
4. ⏭️ Deploy updated Google Apps Script (see Code_Relational.gs)
5. ⏭️ Update website to use new API

---

**Your relational database is ready!** This structure gives you much better control and tracking than a flat file approach.
