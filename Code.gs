/**
 * LIVING ROOM BAITHAKS - GOOGLE APPS SCRIPT BACKEND
 *
 * This script handles:
 * - Serving concert data as JSON API
 * - Receiving booking submissions
 * - Uploading payment screenshots to Google Drive
 * - Managing seat availability
 * - Logging all transactions
 *
 * Setup: Deploy as Web App with "Anyone" access
 */

// ========================================
// CONFIGURATION
// ========================================

const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // Replace with your Google Sheet ID
const SHEET_NAMES = {
  CONCERTS: 'Concerts',
  BOOKINGS: 'Bookings',
  SEAT_TRACKING: 'Seat Tracking',
  PAYMENT_LOGS: 'Payment Logs',
  CONFIG: 'Config'
};

// ========================================
// WEB APP ENDPOINTS
// ========================================

/**
 * Handle GET requests - Serves concert data as JSON
 */
function doGet(e) {
  try {
    const action = e.parameter.action || 'getConcerts';

    switch (action) {
      case 'getConcerts':
        return getConcertsJSON();

      case 'getSeatAvailability':
        const concertId = e.parameter.concertId;
        return getSeatAvailabilityJSON(concertId);

      case 'getConfig':
        return getConfigJSON();

      default:
        return createResponse({ error: 'Invalid action' }, 400);
    }
  } catch (error) {
    Logger.log('doGet Error: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

/**
 * Handle POST requests - Receives booking submissions
 */
function doPost(e) {
  try {
    const action = e.parameter.action || 'submitBooking';

    // Parse JSON body
    const data = JSON.parse(e.postData.contents);

    switch (action) {
      case 'submitBooking':
        return submitBooking(data);

      case 'uploadScreenshot':
        return uploadPaymentScreenshot(data);

      case 'confirmBooking':
        return confirmBooking(data);

      default:
        return createResponse({ error: 'Invalid action' }, 400);
    }
  } catch (error) {
    Logger.log('doPost Error: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

// ========================================
// GET CONCERTS DATA (Replaces JSON files)
// ========================================

/**
 * Returns all concerts as JSON array
 * Format matches existing JSON structure
 */
function getConcertsJSON() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAMES.CONCERTS);
  const data = sheet.getDataRange().getValues();

  // Skip header row
  const headers = data[0];
  const concerts = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    // Parse artists JSON
    let artists = [];
    try {
      artists = JSON.parse(row[headers.indexOf('artists_json')] || '[]');
    } catch (e) {
      Logger.log('Error parsing artists for row ' + i + ': ' + e);
    }

    const concert = {
      concert_id: row[headers.indexOf('concert_id')],
      title: row[headers.indexOf('title')],
      sub_title: row[headers.indexOf('sub_title')],
      date: formatDate(row[headers.indexOf('date')]),
      display_date: row[headers.indexOf('display_date')],
      genre: row[headers.indexOf('genre')],
      image_hero: row[headers.indexOf('image_hero')],
      image_past: row[headers.indexOf('image_past')],
      image_alt: row[headers.indexOf('image_alt')],
      concert_time: row[headers.indexOf('concert_time')],
      meal_time: row[headers.indexOf('meal_time')],
      meal_order: row[headers.indexOf('meal_order')],
      meal_type: row[headers.indexOf('meal_type')],
      ticket_price_general: parseInt(row[headers.indexOf('ticket_price_general')]) || 1000,
      ticket_price_student: parseInt(row[headers.indexOf('ticket_price_student')]) || 500,
      inclusions: row[headers.indexOf('inclusions')],
      contribution_note: row[headers.indexOf('contribution_note')],
      event_status: row[headers.indexOf('event_status')],
      isCurrent: row[headers.indexOf('isCurrent')],
      artists: artists,
      duration: row[headers.indexOf('duration')]
    };

    concerts.push(concert);
  }

  return createResponse(concerts);
}

/**
 * Returns seat availability for a specific concert
 */
function getSeatAvailabilityJSON(concertId) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAMES.SEAT_TRACKING);
  const data = sheet.getDataRange().getValues();

  // Find row with matching concert_id
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === concertId) {
      return createResponse({
        concert_id: data[i][0],
        total_seats: data[i][1],
        booked_seats: data[i][2],
        available_seats: data[i][3],
        chairs_total: data[i][4],
        chairs_booked: data[i][5],
        chairs_available: data[i][4] - data[i][5]
      });
    }
  }

  // Return default if not found
  return createResponse({
    concert_id: concertId,
    total_seats: 50,
    booked_seats: 0,
    available_seats: 50,
    chairs_total: 10,
    chairs_booked: 0,
    chairs_available: 10
  });
}

/**
 * Returns configuration settings
 */
function getConfigJSON() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAMES.CONFIG);
  const data = sheet.getDataRange().getValues();

  const config = {};
  for (let i = 1; i < data.length; i++) {
    config[data[i][0]] = data[i][1];
  }

  return createResponse(config);
}

// ========================================
// SUBMIT BOOKING
// ========================================

/**
 * Receives booking submission from website
 * Expected data structure:
 * {
 *   bookingId, transactionId, timestamp, concert, seats,
 *   totalAmount, attendees, paymentScreenshot (base64)
 * }
 */
function submitBooking(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const bookingsSheet = ss.getSheetByName(SHEET_NAMES.BOOKINGS);

  try {
    // Extract data
    const bookingId = data.bookingId;
    const transactionId = data.transactionId;
    const timestamp = new Date().toISOString();
    const concertId = data.concert?.concert_id || 'UNKNOWN';
    const concertName = (data.concert?.title || '') + (data.concert?.sub_title || '');
    const generalSeats = data.seats.general || 0;
    const studentSeats = data.seats.student || 0;
    const chairsRequested = data.seats.chairs || 0;
    const totalAmount = data.totalAmount || 0;

    // Main attendee
    const mainAttendee = data.attendees.find(a => a.isMain) || data.attendees[0] || {};
    const mainName = mainAttendee.name || 'N/A';
    const mainWhatsApp = mainAttendee.whatsapp || 'N/A';
    const mainEmail = mainAttendee.email || '';

    // All attendees (names only)
    const allAttendeesNames = data.attendees.map(a => a.name).join(', ');

    // Attendees needing chairs
    const chairAttendees = data.attendees
      .filter(a => a.needsChair)
      .map(a => a.name)
      .join(', ');

    // Handle payment screenshot upload
    let screenshotUrl = '';
    if (data.paymentScreenshot) {
      screenshotUrl = uploadScreenshotToDrive(
        data.paymentScreenshot,
        `payment_${bookingId}`
      );

      // Log to Payment Logs sheet
      logPaymentScreenshot(bookingId, transactionId, `payment_${bookingId}.jpg`, screenshotUrl);
    }

    // Append to Bookings sheet
    bookingsSheet.appendRow([
      bookingId,
      transactionId,
      timestamp,
      concertId,
      concertName,
      generalSeats,
      studentSeats,
      chairsRequested,
      totalAmount,
      mainName,
      mainWhatsApp,
      mainEmail,
      allAttendeesNames,
      chairAttendees,
      screenshotUrl,
      'pending', // booking_status
      'No' // confirmation_sent
    ]);

    // Update seat availability (pending bookings don't reduce available seats yet)
    // Seats are only deducted when booking is confirmed

    // Send confirmation email/WhatsApp (optional)
    // sendConfirmationNotification(mainWhatsApp, bookingId, concertName);

    return createResponse({
      success: true,
      bookingId: bookingId,
      message: 'Booking submitted successfully. You will receive confirmation within 24 hours.'
    });

  } catch (error) {
    Logger.log('submitBooking Error: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

// ========================================
// UPLOAD PAYMENT SCREENSHOT
// ========================================

/**
 * Uploads base64 image to Google Drive
 * Returns Drive URL
 */
function uploadScreenshotToDrive(base64String, filename) {
  try {
    // Get Drive folder ID from Config
    const config = getConfig();
    const folderId = config.drive_folder_id;

    if (!folderId) {
      throw new Error('drive_folder_id not set in Config sheet');
    }

    const folder = DriveApp.getFolderById(folderId);

    // Remove data:image/xxx;base64, prefix if present
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');

    // Decode base64
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Data),
      'image/jpeg',
      filename + '.jpg'
    );

    // Upload to Drive
    const file = folder.createFile(blob);

    // Make file publicly viewable (optional)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return file.getUrl();

  } catch (error) {
    Logger.log('uploadScreenshotToDrive Error: ' + error.toString());
    return '';
  }
}

/**
 * Log payment screenshot to Payment Logs sheet
 */
function logPaymentScreenshot(bookingId, transactionId, filename, driveUrl) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAMES.PAYMENT_LOGS);

  sheet.appendRow([
    bookingId,
    transactionId,
    filename,
    driveUrl,
    new Date().toISOString()
  ]);
}

// ========================================
// CONFIRM BOOKING (Manual or Auto)
// ========================================

/**
 * Confirms a booking and updates seat availability
 * Call this manually or set up auto-confirm
 */
function confirmBooking(data) {
  const bookingId = data.bookingId;

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const bookingsSheet = ss.getSheetByName(SHEET_NAMES.BOOKINGS);
  const data = bookingsSheet.getDataRange().getValues();

  // Find booking by ID
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === bookingId) {
      const concertId = data[i][3];
      const generalSeats = data[i][5];
      const studentSeats = data[i][6];
      const chairsRequested = data[i][7];

      // Update booking status to 'confirmed'
      bookingsSheet.getRange(i + 1, 16).setValue('confirmed'); // booking_status column
      bookingsSheet.getRange(i + 1, 17).setValue('Yes'); // confirmation_sent column

      // Update seat availability
      updateSeatAvailability(concertId, generalSeats + studentSeats, chairsRequested);

      return createResponse({
        success: true,
        message: 'Booking confirmed successfully'
      });
    }
  }

  return createResponse({ error: 'Booking not found' }, 404);
}

/**
 * Updates seat availability in Seat Tracking sheet
 */
function updateSeatAvailability(concertId, seatsToBook, chairsToBook) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAMES.SEAT_TRACKING);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === concertId) {
      // Update booked seats
      const currentBookedSeats = data[i][2];
      const newBookedSeats = currentBookedSeats + seatsToBook;
      sheet.getRange(i + 1, 3).setValue(newBookedSeats); // booked_seats column

      // Calculate available seats
      const totalSeats = data[i][1];
      const availableSeats = totalSeats - newBookedSeats;
      sheet.getRange(i + 1, 4).setValue(availableSeats); // available_seats column

      // Update chairs
      const currentChairsBooked = data[i][5];
      const newChairsBooked = currentChairsBooked + chairsToBook;
      sheet.getRange(i + 1, 6).setValue(newChairsBooked); // chairs_booked column

      break;
    }
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Creates HTTP response with proper headers
 */
function createResponse(data, statusCode = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);

  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  return output;
}

/**
 * Formats date to YYYY-MM-DD
 */
function formatDate(date) {
  if (!date) return '';
  if (typeof date === 'string') return date;

  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Get configuration from Config sheet
 */
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

// ========================================
// OPTIONAL: EMAIL/WHATSAPP NOTIFICATIONS
// ========================================

/**
 * Send confirmation email
 * Requires enabling Gmail API
 */
function sendConfirmationEmail(email, bookingId, concertName) {
  if (!email) return;

  const subject = `Booking Confirmation - ${concertName}`;
  const body = `
Dear Guest,

Your booking has been confirmed!

Booking ID: ${bookingId}
Concert: ${concertName}

We'll send you reminders and directions closer to the event date.

Thank you,
Living Room Baithaks Team
  `;

  try {
    GmailApp.sendEmail(email, subject, body);
  } catch (e) {
    Logger.log('Error sending email: ' + e);
  }
}

/**
 * Send WhatsApp notification
 * Requires third-party API (Twilio, WATI, etc.)
 */
function sendWhatsAppNotification(whatsapp, bookingId, concertName) {
  // Implement using your preferred WhatsApp API
  // Example: WATI, Twilio, MessageBird

  // Placeholder - implement your WhatsApp integration
  Logger.log('WhatsApp notification would be sent to: ' + whatsapp);
}

// ========================================
// TESTING FUNCTIONS
// ========================================

/**
 * Test getConcerts endpoint
 */
function testGetConcerts() {
  const result = getConcertsJSON();
  Logger.log(result.getContent());
}

/**
 * Test seat availability endpoint
 */
function testGetSeatAvailability() {
  const result = getSeatAvailabilityJSON('CONC001');
  Logger.log(result.getContent());
}
