# Google Apps Script Backend

This folder contains the Google Apps Script code that serves as the backend API for the Living Room Baithaks website.

## Files

- **Code.gs** - Main Google Apps Script file (deploy this to your Google Sheet)

## What This Script Does

1. **Serves Concert Data as JSON API**
   - Reads from Google Sheets (Concerts + Artists tables)
   - Returns JSON in the exact format your website expects
   - Supports both embedded format and relational format

2. **Handles Booking Submissions**
   - Receives booking forms from website
   - Stores in Bookings table
   - Uploads payment screenshots to Google Drive
   - Tracks attendees in master Attendees table
   - Links attendees to bookings via junction table

3. **Manages Seat Availability**
   - Tracks available seats per concert
   - Updates when bookings are confirmed
   - Prevents overbooking

4. **Attendee Management**
   - Creates master Attendees records
   - Tracks repeat attendees
   - Updates attendance history

## API Endpoints

### GET Endpoints

**Get Concerts (Website Format - Default)**
```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=getConcerts
```
Returns concerts with embedded artists array (matches your JSON format)

**Get Concerts (Relational Format)**
```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=getConcertsRelational
```
Returns `{concerts: [], artists: []}` as separate arrays

**Get Seat Availability**
```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=getSeatAvailability&concertId=CONC001
```
Returns seat availability for specific concert

**Get Config**
```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=getConfig
```
Returns configuration settings

**Get Attendee**
```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=getAttendee&whatsapp=+919876543210
```
Returns attendee info by WhatsApp number

### POST Endpoints

**Submit Booking**
```javascript
POST https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=submitBooking
Content-Type: application/json

{
  "bookingId": "BK_1699876543210",
  "transactionId": "TXN123456",
  "concert": { "concert_id": "CONC004", "title": "Pratah Swar" },
  "seats": { "general": 2, "student": 1, "chairs": 1 },
  "totalAmount": 2500,
  "attendees": [
    {
      "name": "Rajesh Kumar",
      "whatsapp": "+919876543210",
      "email": "rajesh@example.com",
      "seatType": "General",
      "needsChair": false,
      "isMain": true
    }
  ],
  "paymentScreenshot": "data:image/jpeg;base64,..."
}
```

**Upload Screenshot (Standalone)**
```javascript
POST https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=uploadScreenshot

{
  "bookingId": "BK_1699876543210",
  "paymentScreenshot": "data:image/jpeg;base64,..."
}
```

**Confirm Booking**
```javascript
POST https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=confirmBooking

{
  "bookingId": "BK_1699876543210"
}
```

## Deployment Instructions

### Initial Setup

1. **Open your Google Sheet**
   - Go to your "Living Room Baithaks - Master Database" sheet

2. **Open Apps Script Editor**
   - Click **Extensions** → **Apps Script**

3. **Copy the Code**
   - Open `Code.gs` from this folder
   - Copy ALL the code
   - Paste into the Apps Script editor (replace any existing code)

4. **Configure Sheet ID**
   - Find this line near the top:
     ```javascript
     const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
     ```
   - Replace with your actual Sheet ID from the URL

5. **Save the Script**
   - Click Save icon (or Ctrl+S / Cmd+S)
   - Name it: "LRB Booking Backend"

6. **Deploy as Web App**
   - Click **Deploy** → **New deployment**
   - Click gear icon → Select **Web app**
   - Configure:
     - Description: "LRB Public API v1"
     - Execute as: Me
     - Who has access: **Anyone**
   - Click **Deploy**
   - Authorize when prompted
   - Copy the Web App URL

### Testing

Run these test functions in the Apps Script editor:

- **testGetConcerts()** - Test concert data retrieval
- **testGetSeatAvailability()** - Test seat availability
- **testGetConcertsEmbedded()** - Test embedded artists format

To run:
1. Select function from dropdown at top
2. Click ▶️ Run button
3. View logs: Click **View** → **Logs**

### Updating the Script

When you make changes to Code.gs:

1. Copy updated code to Apps Script editor
2. Click **Save**
3. Click **Deploy** → **Manage deployments**
4. Click **✏️ Edit** on existing deployment
5. Change **Version** to "New version"
6. Click **Deploy**
7. Note: URL stays the same, so website code doesn't need updating

### Security Notes

- The script runs as YOU, so it has access to your Google Sheet and Drive
- Anyone can call the public API, but they can only:
  - Read concert data (public info anyway)
  - Submit bookings (which is intended)
- They CANNOT:
  - Edit or delete existing data
  - Access your email or other Google services
  - See attendee personal info (unless they know the WhatsApp number)

### Troubleshooting

**Error: "SPREADSHEET_ID not set"**
- You forgot to update the `SPREADSHEET_ID` constant
- Copy your Sheet ID from the URL and paste it in Code.gs

**Error: "Cannot read property 'getDataRange' of null"**
- Sheet tab name mismatch (case-sensitive)
- Check that your tabs are named exactly:
  - Artists
  - Concerts
  - Attendees
  - Bookings
  - Booking_Attendees
  - Seat Tracking
  - Payment Logs
  - Config

**Error: "drive_folder_id not set"**
- Go to Config sheet
- Add row: `drive_folder_id | YOUR_FOLDER_ID | Drive folder for screenshots`

**Bookings not appearing in sheet**
- Check that POST requests are being sent correctly
- Check browser console for errors
- Test with a simple curl command:
  ```bash
  curl -X POST "YOUR_WEB_APP_URL?action=submitBooking" \
    -H "Content-Type: application/json" \
    -d '{"test": "data"}'
  ```

### Monitoring

- **Executions:** Apps Script dashboard → Executions (see all API calls)
- **Logs:** View → Logs (see debug output)
- **Quotas:** Check your [Google Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas)

---

## Sheet Structure Required

This script expects 8 sheets with specific column headers:

1. **Artists:** artist_id, concert_id, name, category, genre, salutation, bio, image_url, social_links, guru_name
2. **Concerts:** concert_id, title, sub_title, date, display_date, genre, image_hero, image_past, image_alt, concert_time, meal_time, meal_order, meal_type, ticket_price_general, ticket_price_student, inclusions, contribution_note, event_gallery_link, event_recording_link, event_status, booking_status, duration, max_seats, chairs_available, venue_address, venue_google_map_link, whatsapp_group_link, isCurrent
3. **Attendees:** attendee_id, name, whatsapp, email, student_status, needs_chair, first_concert_id, first_concert_date, total_concerts_attended, last_concert_id, last_concert_date, notes
4. **Bookings:** booking_id, transaction_id, timestamp, concert_id, concert_name, general_seats, student_seats, chairs_requested, total_amount, main_contact_attendee_id, payment_screenshot_url, booking_status, confirmation_sent, booking_notes
5. **Booking_Attendees:** booking_id, attendee_id, seat_type, needs_chair, is_main_contact
6. **Seat Tracking:** concert_id, total_seats, booked_seats, available_seats, chairs_total, chairs_booked, chairs_available
7. **Payment Logs:** booking_id, transaction_id, filename, drive_url, upload_timestamp
8. **Config:** key, value, description

See `GOOGLE_SHEETS_SETUP_RELATIONAL.md` for detailed structure.

---

## Version History

- **v1.0** (2025-11-06) - Initial release with full booking management
  - Concert data API (embedded format)
  - Booking submissions
  - Payment screenshot uploads
  - Master attendees tracking
  - Seat availability management

---

**Ready to deploy?** Follow the steps above and see `MIGRATION_GUIDE.md` for full migration instructions.
