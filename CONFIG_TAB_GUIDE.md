# Config Tab Guide

## What is the Config Tab?

The **Config** tab in your Google Sheet is a key-value configuration store that allows you to manage application settings without editing the Apps Script code. This makes it easier to update settings and keep sensitive information separate from your code.

## Current Structure

The Config tab has 2 columns:
- **Column A (key)**: Configuration parameter name
- **Column B (value)**: Configuration parameter value

Example:
```
| key              | value                                    |
|------------------|------------------------------------------|
| drive_folder_id  | 1ABcDefGH1234567890ijk_lmnopQRST       |
| booking_email    | bookings@livingroombaithaks.com         |
| max_seats_limit  | 50                                       |
```

## Required Configuration Entries

### 1. `drive_folder_id` (REQUIRED)

**Purpose**: Specifies which Google Drive folder to upload payment screenshots to.

**Why it's needed**: When users submit bookings with payment screenshots, the Apps Script needs to know where to save these images.

**How to set it up**:
1. Create a Google Drive folder for payment screenshots (or use an existing one)
2. Open the folder in Google Drive
3. Look at the URL: `https://drive.google.com/drive/folders/[FOLDER_ID_HERE]`
4. Copy the FOLDER_ID from the URL
5. Add to Config tab:
   ```
   key: drive_folder_id
   value: [YOUR_FOLDER_ID]
   ```

**Example**:
```
key: drive_folder_id
value: 1ABcDefGH1234567890ijk_lmnopQRST
```

## Optional Configuration Entries

You can add any custom configuration parameters you want. Here are some useful examples:

### 2. `booking_email`
**Purpose**: Email address where booking notifications should be sent

**Example**:
```
key: booking_email
value: bookings@livingroombaithaks.com
```

### 3. `whatsapp_notification_enabled`
**Purpose**: Toggle WhatsApp notifications on/off

**Example**:
```
key: whatsapp_notification_enabled
value: true
```

### 4. `max_seats_per_booking`
**Purpose**: Limit the maximum number of seats a single booking can reserve

**Example**:
```
key: max_seats_per_booking
value: 10
```

### 5. `booking_cutoff_hours`
**Purpose**: How many hours before a concert to stop accepting bookings

**Example**:
```
key: booking_cutoff_hours
value: 24
```

## How Apps Script Accesses Config

The Apps Script code includes a helper function `getConfig()` that reads the Config tab and returns it as a JavaScript object:

```javascript
function getConfig() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAMES.CONFIG);
  const data = sheet.getDataRange().getValues();

  const config = {};
  for (let i = 1; i < data.length; i++) {
    config[data[i][0]] = data[i][1];
  }

  return config;
}
```

## How to Use Config Values in Code

Example usage in your Apps Script:

```javascript
function uploadScreenshotToDrive(base64String, filename) {
  // Get Drive folder ID from Config
  const config = getConfig();
  const folderId = config.drive_folder_id;

  if (!folderId) {
    throw new Error('drive_folder_id not set in Config sheet');
  }

  const folder = DriveApp.getFolderById(folderId);
  // ... rest of upload logic
}
```

## Benefits of Using Config Tab

1. **No Code Changes**: Update settings without touching Apps Script code
2. **No Redeployment**: Changes take effect immediately (no need to redeploy the web app)
3. **Easier Management**: Non-technical users can update settings
4. **Separation of Concerns**: Keep sensitive IDs and configuration separate from logic
5. **Environment-Specific Settings**: Use different Config values for dev/prod environments

## Important Notes

⚠️ **Security**: While the Config tab makes it easier to manage settings, be careful not to store highly sensitive credentials here (like API keys or passwords). For those, consider using Google Apps Script's Properties Service:

```javascript
// More secure for API keys:
PropertiesService.getScriptProperties().setProperty('API_KEY', 'your_secret_key');
const apiKey = PropertiesService.getScriptProperties().getProperty('API_KEY');
```

## Viewing Logs

To see the comprehensive logs from your booking submissions:

1. Open your Google Apps Script project
2. Click **Executions** in the left sidebar
3. Click on any execution to see its logs
4. You'll see detailed logs showing:
   - All booking details
   - Seat availability before/after
   - What was written to each sheet
   - Before/after values for seat tracking
   - Success/failure status

This makes debugging and tracking bookings much easier!
