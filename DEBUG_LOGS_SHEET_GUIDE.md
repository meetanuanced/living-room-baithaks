# Debug Logs Sheet Guide

## Problem: doPost Execution Logs Don't Show Up

When your website calls the Google Apps Script web app (`doPost`), the execution logs **don't appear** in the standard Apps Script execution dashboard at https://script.google.com/home/executions.

This is **normal behavior** - web app executions are logged differently than manual test runs.

---

## Solution: Debug Logs Sheet

I've added a **Debug Logs** sheet to your Google Sheets that automatically captures all `doPost` executions. This is **much easier** to view than Cloud Logging!

### How It Works:

1. **Automatic Sheet Creation**: When the first booking comes in, a new sheet called **"Debug Logs"** will be automatically created
2. **Real-Time Logging**: Every important step is logged to this sheet
3. **Easy Viewing**: Just open your Google Sheet and click the "Debug Logs" tab
4. **Auto-Cleanup**: Keeps only the last 500 log entries to prevent the sheet from getting too large

---

## How to Enable Debug Logging

### Step 1: Deploy Updated Code.gs

1. Open your Google Apps Script project
2. Copy the entire updated `Code.gs` file from your repo: `/home/user/living-room-baithaks/google_apps_script/Code.gs`
3. Paste it into your Apps Script editor (replace the old file)
4. **Deploy → Manage deployments**
5. Click ✏️ (edit) next to your Web app deployment
6. Change "Version" to **New version**
7. Add description: "Added Debug Logs sheet logging"
8. Click **Deploy**

### Step 2: Configuration (Optional)

In Code.gs, you'll see:

```javascript
const ENABLE_SHEET_LOGGING = true;  // Change to false to disable
```

- **`true`** (default): Logs written to Debug Logs sheet
- **`false`**: Only logs to Cloud Logging (harder to access)

---

## What Gets Logged

The Debug Logs sheet will show:

### When a Booking Starts:

| Timestamp | Message | Data |
|-----------|---------|------|
| 2025-11-07T10:30:00.000Z | 🌐 doPost CALLED | `{"action":"submitBooking","timestamp":"..."}` |
| 2025-11-07T10:30:00.100Z | 📥 Received data | `{"action":"submitBooking","bookingId":"LRB5454","attendeeCount":5,"seats":{"general":2,"student":3,"chairs":0}}` |
| 2025-11-07T10:30:00.200Z | 📥 submitBooking STARTED | `{"bookingId":"LRB5454","concertId":"CONC004","attendeeCount":5,"seats":{"general":2,"student":3,"chairs":0}}` |

### When Writing Attendees:

| Timestamp | Message | Data |
|-----------|---------|------|
| 2025-11-07T10:30:05.000Z | 💾 Booking_Attendees WRITE | `{"bookingId":"LRB5454","totalAttendees":5,"successfullyWritten":5,"failed":0}` |

### When Booking Succeeds:

| Timestamp | Message | Data |
|-----------|---------|------|
| 2025-11-07T10:30:06.000Z | ✅ BOOKING SUCCESS | `{"bookingId":"LRB5454","attendees":5,"general":2,"student":3,"chairs":0,"amount":3500}` |

### When Booking Fails:

| Timestamp | Message | Data |
|-----------|---------|------|
| 2025-11-07T10:30:06.000Z | ❌ BOOKING FAILED | `{"error":"Failed to save attendee data...","stack":"...","bookingId":"LRB5454"}` |

### If Only 1 Attendee Saves:

| Timestamp | Message | Data |
|-----------|---------|------|
| 2025-11-07T10:30:05.000Z | 💾 Booking_Attendees WRITE | `{"bookingId":"LRB5454","totalAttendees":5,"successfullyWritten":1,"failed":4}` |
| 2025-11-07T10:30:05.100Z | ⚠️ Partial attendee save failure | `{"bookingId":"LRB5454","saved":1,"total":5}` |

---

## How to View Debug Logs

### Method 1: In Google Sheets (Easiest)

1. Open your Living Room Baithaks Google Sheet
2. Look for a new tab called **"Debug Logs"** (will appear after first booking)
3. You'll see 3 columns:
   - **Timestamp**: When the event happened
   - **Message**: What happened (with emoji markers)
   - **Data**: Detailed JSON data

### Method 2: Filter Logs

The Debug Logs sheet is a regular Google Sheet, so you can:

- **Sort by timestamp** (newest first)
- **Filter by message** (e.g., show only "BOOKING FAILED")
- **Search for a specific bookingId** (Ctrl+F → search "LRB5454")
- **Export to CSV** for analysis

---

## Emoji Markers Reference

| Emoji | Meaning | When It Appears |
|-------|---------|-----------------|
| 🌐 | doPost CALLED | Every time website calls the backend |
| 📥 | Data received | When payload arrives from frontend |
| 📥 | submitBooking STARTED | When booking processing begins |
| 💾 | Database write | When writing to Booking_Attendees sheet |
| ✅ | SUCCESS | Booking completed successfully |
| ❌ | ERROR/FAILURE | Critical error occurred |
| ⚠️ | WARNING | Partial failure (e.g., only 1 of 5 attendees saved) |

---

## Example: Debugging "Only 1 Attendee Saved" Issue

### Scenario:
You submit a booking with 5 attendees, but only 1 row appears in Booking_Attendees sheet.

### How to Diagnose with Debug Logs:

1. **Open Debug Logs sheet**
2. **Find your booking** by searching for the bookingId (e.g., "LRB5454")
3. **Look for the "💾 Booking_Attendees WRITE" row**

**If you see:**
```json
{
  "bookingId": "LRB5454",
  "totalAttendees": 5,
  "successfullyWritten": 1,
  "failed": 4
}
```

**And:**
```json
{
  "bookingId": "LRB5454",
  "saved": 1,
  "total": 5
}
```

This means **4 out of 5 attendees failed to save**.

4. **Check the Apps Script execution logs** (the detailed Logger.log() messages) for the specific error:
   - Go to https://console.cloud.google.com/logs
   - Filter: `resource.type="app_script_function"` and `resource.labels.function_name="doPost"`
   - Look for lines like: `❌ ERROR writing Row 2: [specific error here]`

This will tell you **exactly why** rows 2-5 failed (permissions, data format, quota, etc.)

---

## Troubleshooting

### Issue: Debug Logs sheet not appearing

**Possible Causes:**
1. Code.gs not deployed yet → Deploy the new version
2. No bookings submitted yet → Sheet only created on first booking
3. `ENABLE_SHEET_LOGGING = false` → Change to `true` in Code.gs line 42

### Issue: Debug Logs sheet shows errors

**Example Error in Data column:**
```
"Debug logging error: Exception: You do not have permission to call SpreadsheetApp.openById"
```

**Solution:**
- The Apps Script doesn't have permission to write to the sheet
- Go to Apps Script → Run any function manually
- Click "Review Permissions" when prompted
- Grant access to Google Sheets

### Issue: Too many log entries (sheet getting large)

The script automatically keeps only the last 500 rows. But if you want to:

**Archive Old Logs:**
1. Select all rows in Debug Logs sheet
2. Copy → Paste into a new sheet called "Debug Logs Archive"
3. Delete old rows from Debug Logs
4. Repeat as needed

**Disable Logging:**
Change in Code.gs:
```javascript
const ENABLE_SHEET_LOGGING = false;
```

### Issue: Logs show but data column is empty

This is normal for some log messages that don't include additional data. The main info is in the Message column.

---

## Cloud Logging (Alternative Method)

If you prefer to use Google Cloud Logging instead of the Debug Logs sheet:

### Access Cloud Logging:

1. Go to: https://console.cloud.google.com/logs
2. Select your Google Cloud Project (linked to your Apps Script)
3. In the **Query builder**, enter:
   ```
   resource.type="app_script_function"
   resource.labels.function_name="doPost"
   ```
4. Click **"Run Query"**
5. You'll see all `doPost` executions with full `Logger.log()` output

### Advantages:
- More detailed (shows every `Logger.log()` line)
- Better search and filtering
- Longer retention period

### Disadvantages:
- Harder to access (need Cloud Console access)
- More complex interface
- Requires understanding of Cloud Logging syntax

---

## Best Practice: Use Both

**For Daily Use:**
- Check **Debug Logs sheet** for quick overview
- Look for ✅ SUCCESS or ❌ FAILURE markers
- Track successful writes to Booking_Attendees

**For Debugging Issues:**
- Use **Debug Logs sheet** to identify which booking had issues
- Use **Cloud Logging** to get detailed error messages
- Cloud Logging shows the full stack trace and error details

---

## Debug Log Messages Reference

All messages logged to the Debug Logs sheet:

| Message | When | Data Included |
|---------|------|---------------|
| 🌐 doPost CALLED | Every web app request | action, timestamp |
| 📥 Received data | Payload arrives | bookingId, attendeeCount, seats |
| 📥 submitBooking STARTED | Booking starts processing | bookingId, concertId, attendeeCount, seats |
| 💾 Booking_Attendees WRITE | After writing attendees | bookingId, totalAttendees, successfullyWritten, failed |
| ⚠️ Partial attendee save failure | Some attendees didn't save | bookingId, saved, total |
| ❌ CRITICAL: Zero attendees saved | All attendees failed to save | bookingId, attemptedCount |
| ✅ BOOKING SUCCESS | Booking completed | bookingId, attendees, general, student, chairs, amount |
| ❌ BOOKING FAILED | Booking failed | error, stack, bookingId |
| ❌ doPost ERROR | doPost function crashed | error, stack |

---

## Configuration Summary

**In `google_apps_script/Code.gs`:**

```javascript
// Line 30: Add Debug Logs to sheet names
const SHEET_NAMES = {
  ...
  DEBUG_LOGS: 'Debug Logs'  // ← Added
};

// Line 42: Enable/disable sheet logging
const ENABLE_SHEET_LOGGING = true;  // ← Change to false to disable

// Line 48: Helper function (automatically defined)
function debugLog(message, data = null) { ... }
```

**No changes needed to frontend code!**

---

## Summary

### Before (Problem):
- ❌ doPost logs don't show in Apps Script executions
- ❌ Hard to access Cloud Logging
- ❌ Can't tell why only 1 attendee saved
- ❌ No visibility into web app execution

### After (Solution):
- ✅ All doPost calls logged to easy-to-view sheet
- ✅ See exactly how many attendees saved (5/5 or 1/5)
- ✅ Emoji markers for quick scanning
- ✅ Automatic sheet creation and cleanup
- ✅ Can search, filter, export logs easily

---

## Next Steps

1. **Deploy updated Code.gs** (see Step 1 above)
2. **Submit a test booking** from your website
3. **Open your Google Sheet** and look for the "Debug Logs" tab
4. **Check the logs** - you should see entries like:
   - 🌐 doPost CALLED
   - 📥 Received data
   - 💾 Booking_Attendees WRITE
   - ✅ BOOKING SUCCESS

If you see logs appearing, the debug system is working! 🎉

---

**Document Version**: 1.0
**Created**: 2025-11-07
**Related**: DEBUGGING_GUIDE.md, VALIDATION_FIX_TEST.md
