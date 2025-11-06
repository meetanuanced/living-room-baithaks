# How to Update booking-flow.js for Google Apps Script

## Option 1: Quick Manual Update (5 minutes)

### Step 1: Add API_URL constant at the top

**Open:** `src/living_room_website/scripts/booking-flow.js`

**Find line 5 (after the comment):**
```javascript
// Booking state
```

**Add BEFORE that line:**
```javascript
// Google Apps Script API URL - UPDATE THIS AFTER DEPLOYMENT
const API_URL = 'YOUR_APPS_SCRIPT_URL_HERE';  // Replace with your Web App URL

```

### Step 2: Update loadConcertData() function

**Find line ~107:**
```javascript
function loadConcertData() {
    fetch('test_case_4_max_past.json')
```

**Replace the fetch line with:**
```javascript
function loadConcertData() {
    // Fetch from Google Apps Script API or fallback to local JSON for testing
    const dataSource = API_URL !== 'YOUR_APPS_SCRIPT_URL_HERE'
        ? `${API_URL}?action=getConcerts`
        : 'test_case_4_max_past.json';

    fetch(dataSource)
```

This way it will:
- Use test JSON when API_URL is not configured (for testing)
- Use Google Apps Script API once you configure it

### Step 3: Update confirmBooking() to submit to backend

**Find the confirmBooking() function (around line 681)**

**Find this line:**
```javascript
    // TODO: Send to backend/email
```

**Replace with:**
```javascript
    // Submit to Google Apps Script backend (if API_URL is configured)
    if (API_URL !== 'YOUR_APPS_SCRIPT_URL_HERE') {
        submitBookingToBackend(bookingData);
        return; // Don't go to step 6 yet - wait for backend response
    } else {
        console.warn('API_URL not configured - booking not submitted to backend');
    }
```

**Then ADD this new function at the end of the file (before the last closing brace):**

```javascript
// Submit booking to Google Apps Script backend
function submitBookingToBackend(bookingData) {
    // Convert payment screenshot to base64 if present
    if (bookingState.paymentScreenshot) {
        const reader = new FileReader();
        reader.onload = function(e) {
            bookingData.paymentScreenshot = e.target.result; // base64 string

            // Send to backend
            fetch(`${API_URL}?action=submitBooking`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bookingData)
            })
            .then(response => response.json())
            .then(result => {
                console.log('Booking submitted successfully:', result);
                if (result.success) {
                    populateConfirmationStep();
                    goToStep(6);
                } else {
                    alert('Booking submission failed: ' + (result.error || 'Unknown error'));
                }
            })
            .catch(error => {
                console.error('Error submitting booking:', error);
                alert('Failed to submit booking. Please try again.');
            });
        };
        reader.readAsDataURL(bookingState.paymentScreenshot);
    } else {
        // No screenshot - send without it
        fetch(`${API_URL}?action=submitBooking`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookingData)
        })
        .then(response => response.json())
        .then(result => {
            console.log('Booking submitted successfully:', result);
            if (result.success) {
                populateConfirmationStep();
                goToStep(6);
            } else {
                alert('Booking submission failed: ' + (result.error || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error submitting booking:', error);
            alert('Failed to submit booking. Please try again.');
        });
    }
}
```

---

## Option 2: Use Updated File (Easier)

I can create an updated version of the entire file for you to replace. Let me know if you want that.

---

## After Making Changes

### Test Without API (Local):
1. Open `index.html` in browser
2. Booking flow should still work with test data
3. Check console for: "API_URL not configured - booking not submitted to backend"

### After Deploying Google Apps Script:
1. Get your Web App URL: `https://script.google.com/macros/s/ABC123.../exec`
2. Update Line 6 in booking-flow.js:
   ```javascript
   const API_URL = 'https://script.google.com/macros/s/ABC123.../exec';
   ```
3. Save and reload website
4. Now bookings will submit to Google Sheets!

---

## Summary of Changes

1. **Line ~6:** Add `const API_URL = 'YOUR_APPS_SCRIPT_URL_HERE';`
2. **Line ~107:** Change `fetch('test_case_4_max_past.json')` to use API or fallback
3. **Line ~695:** Update to call `submitBookingToBackend()` if API is configured
4. **End of file:** Add new `submitBookingToBackend()` function

**Total:** 3 small edits + 1 new function

---

**Need the complete updated file instead?** Let me know!
