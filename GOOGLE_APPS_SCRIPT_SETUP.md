# Google Apps Script Setup Guide

## Prerequisites

✅ Complete Google Sheets setup (see `GOOGLE_SHEETS_SETUP.md`)
✅ Have your Google Sheet ID ready

---

## Step 1: Open Google Apps Script Editor

1. Open your **Living Room Baithaks - Master Database** Google Sheet
2. Click **Extensions** → **Apps Script**
3. A new tab will open with the Apps Script editor

---

## Step 2: Create the Script

1. Delete any default code in the editor
2. Copy all contents from `Code.gs` file (in this repository)
3. Paste into the Apps Script editor
4. Click the **💾 Save** icon or press `Ctrl+S`
5. Name the project: **"LRB Backend API"**

---

## Step 3: Configure the Script

At the top of `Code.gs`, find this line:

```javascript
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
```

Replace with your actual Spreadsheet ID:

**How to find your Spreadsheet ID:**

Your Google Sheet URL looks like:
```
https://docs.google.com/spreadsheets/d/1abc123XYZ456_SPREADSHEET_ID_HERE/edit
```

Copy the ID between `/d/` and `/edit`.

Example:
```javascript
const SPREADSHEET_ID = '1abc123XYZ456def789GHI012jkl';
```

**Save the file** after updating.

---

## Step 4: Test the Script

Before deploying, test the functions:

1. Select function **`testGetConcerts`** from dropdown at top
2. Click **▶ Run**
3. **First time only:** Click **Review Permissions** → Choose your Google account → **Advanced** → **Go to LRB Backend API (unsafe)** → **Allow**
4. Check the **Execution log** at bottom - should show concert JSON data
5. Repeat for **`testGetSeatAvailability`** function

If tests pass, you're ready to deploy!

---

## Step 5: Deploy as Web App

1. Click **Deploy** button (top right) → **New deployment**
2. Click **⚙️ Settings icon** next to "Select type"
3. Choose **Web app**
4. Fill in deployment settings:

   **Description:** `LRB Booking API v1`

   **Execute as:** `Me (your email)`

   **Who has access:** `Anyone` ⚠️ IMPORTANT: Must be "Anyone" for website to access

5. Click **Deploy**
6. Click **Authorize access** → Choose your account → **Allow**
7. **Copy the Web App URL** - it looks like:
   ```
   https://script.google.com/macros/s/AKfycby.../exec
   ```

**SAVE THIS URL!** You'll need it for website integration.

---

## Step 6: Test the Web App

Test the deployed API in your browser:

### Test 1: Get Concerts

Open this URL in a new tab:
```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=getConcerts
```

**Expected result:** JSON array of all concerts

### Test 2: Get Seat Availability

```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=getSeatAvailability&concertId=CONC001
```

**Expected result:** JSON object with seat availability

### Test 3: Get Config

```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=getConfig
```

**Expected result:** JSON object with configuration settings

If all three tests return valid JSON, your API is working! 🎉

---

## Step 7: Update Website to Use the API

Now update your website JavaScript to fetch data from the Google Apps Script instead of static JSON files.

### Edit `scripts/main.js`

Find this line (around line 50):
```javascript
fetch('test_case_4_max_past.json')
```

Replace with:
```javascript
const GAS_API_URL = 'YOUR_WEB_APP_URL_HERE/exec';

fetch(GAS_API_URL + '?action=getConcerts')
```

Example:
```javascript
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycby.../exec';

fetch(GAS_API_URL + '?action=getConcerts')
```

Do this for **both** fetch calls in `main.js` (hero section + past events section).

### Edit `scripts/booking-flow.js`

Find this line (around line 88):
```javascript
fetch('test_case_4_max_past.json')
```

Replace with:
```javascript
fetch(GAS_API_URL + '?action=getConcerts')
```

Also update the booking submission function `confirmBooking()` (around line 160):

```javascript
function confirmBooking() {
    // ... existing code ...

    // NEW: Send to Google Apps Script
    fetch(GAS_API_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'submitBooking',
            ...bookingData
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            // Show confirmation
            populateConfirmationStep();
            goToStep(6);
        } else {
            alert('Booking submission failed. Please try again.');
        }
    })
    .catch(error => {
        console.error('Booking Error:', error);
        alert('Unable to submit booking. Please check your connection.');
    });
}
```

---

## Step 8: Deploy Updated Website

1. Upload updated `scripts/main.js` and `scripts/booking-flow.js` to your web server
2. Clear browser cache
3. Test website - concerts should load from Google Sheets now!

---

## Step 9: Dynamic Seat Availability (Optional)

To show real-time seat availability on the hero section:

### Update `scripts/main.js`

After fetching concert data, fetch seat availability:

```javascript
fetch(GAS_API_URL + '?action=getConcerts')
    .then(response => response.json())
    .then(data => {
        const upcomingConcert = data.find(c => c.isCurrent === 'Y');

        if (upcomingConcert) {
            // Fetch seat availability
            fetch(GAS_API_URL + `?action=getSeatAvailability&concertId=${upcomingConcert.concert_id}`)
                .then(res => res.json())
                .then(seats => {
                    // Update UI with dynamic seat count
                    document.querySelector('.seats-count').textContent = `${seats.available_seats} Baithak Seats`;
                    document.getElementById('stickySeatsCount').textContent = `${seats.available_seats} Seats`;
                });

            // Render hero section
            // ... rest of rendering code ...
        }
    });
```

---

## Step 10: Test End-to-End Booking Flow

1. Open your website
2. Click **"Reserve a Seat"**
3. Complete all 6 steps of booking flow
4. Upload payment screenshot
5. Submit booking
6. Check **Bookings** sheet in Google Sheets - your booking should appear!
7. Check **Payment Logs** sheet - screenshot URL should be logged
8. Check Google Drive folder - screenshot should be uploaded

---

## Maintenance & Updates

### To Update the Script:

1. Edit code in Apps Script editor
2. Save changes
3. Click **Deploy** → **Manage deployments**
4. Click **✏️ Edit** on your deployment
5. Change **Version** to "New version"
6. Click **Deploy**
7. Your website will automatically use the updated code

### To View Logs:

1. Apps Script editor → **Executions** (left sidebar)
2. View all script executions, errors, and logs
3. Useful for debugging

---

## Security Considerations

### Current Setup (Good for 50 bookings/month):
- ✅ API is public but doesn't expose sensitive data
- ✅ Booking data stored securely in Google Sheets
- ✅ Payment screenshots in private Google Drive folder
- ✅ No credit card/bank details stored

### For Higher Security (If Needed):
1. **Add API Key:** Require API key in requests
2. **Rate Limiting:** Limit requests per IP
3. **reCAPTCHA:** Add to booking form
4. **Webhook Verification:** Verify requests are from your domain

---

## Troubleshooting

### Problem: "Authorization required"
**Solution:** Redeploy with "Anyone" access. Your deployment must be accessible without login.

### Problem: "Script function not found"
**Solution:** Make sure you saved the script and deployed the latest version.

### Problem: "CORS error in browser"
**Solution:** The script already has CORS headers. Clear browser cache and try again.

### Problem: Bookings not appearing in sheet
**Solution:**
- Check **Executions** log for errors
- Verify sheet names match `SHEET_NAMES` constant
- Test `testGetConcerts()` function

### Problem: Payment screenshot not uploading
**Solution:**
- Check `drive_folder_id` in **Config** sheet
- Verify Drive folder permissions (anyone with link can view)
- Check file size < 5MB

---

## API Endpoints Summary

| Endpoint | Method | Parameters | Returns |
|---|---|---|---|
| `?action=getConcerts` | GET | - | All concerts JSON array |
| `?action=getSeatAvailability` | GET | `concertId` | Seat availability object |
| `?action=getConfig` | GET | - | Configuration object |
| `?action=submitBooking` | POST | Booking data (JSON body) | Success/error response |
| `?action=confirmBooking` | POST | `{ bookingId }` (JSON body) | Success/error response |

---

## Next Steps

After completing this setup:

1. ✅ Google Apps Script deployed
2. ✅ Website connected to API
3. ⏭️ Test booking flow thoroughly
4. ⏭️ Set up automatic confirmation emails (optional)
5. ⏭️ Integrate WhatsApp notifications (optional)

---

**Your booking system is now fully functional!** 🚀🎵

All bookings will flow directly into your Google Sheet, and you can manage everything from there.
