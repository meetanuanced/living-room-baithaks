/**
 * LIVING ROOM BAITHAKS - RELATIONAL GOOGLE APPS SCRIPT BACKEND
 *
 * This script handles:
 * - Serving concert + artist data as relational JSON API
 * - Receiving booking submissions
 * - Uploading payment screenshots to Google Drive
 * - Managing seat availability
 * - Tracking attendees across concerts
 * - Logging all transactions
 *
 * Setup: Deploy as Web App with "Anyone" access
 */

// ========================================
// CONFIGURATION
// ========================================

const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // Replace with your Google Sheet ID
const SHEET_NAMES = {
  ARTISTS: 'Artists',
  CONCERTS: 'Concerts',
  CONCERT_ARTISTS: 'Concert_Artists',
  ATTENDEES: 'Attendees',
  BOOKINGS: 'Bookings',
  BOOKING_ATTENDEES: 'Booking_Attendees',
  SEAT_TRACKING: 'Seat Tracking',
  PAYMENT_LOGS: 'Payment Logs',
  CONFIG: 'Config'
};

// ========================================
// WEB APP ENDPOINTS
// ========================================

/**
 * Handle GET requests - Serves concert data as JSON
 *
 * Available endpoints:
 * - ?action=getConcerts (default) → Returns concerts with embedded artists (website format)
 * - ?action=getConcertsRelational → Returns {concerts: [], artists: []} separate arrays
 * - ?action=getSeatAvailability&concertId=CONC001 → Returns seat availability
 * - ?action=getConfig → Returns configuration
 * - ?action=getAttendee&whatsapp=+919876543210 → Returns attendee info
 */
function doGet(e) {
  try {
    const action = e.parameter.action || 'getConcerts';

    switch (action) {
      case 'getConcerts':
        // Returns concerts with embedded artists (your website's expected format)
        return getConcertsWithArtistsEmbedded();

      case 'getConcertsRelational':
        // Returns {concerts: [], artists: []} as separate arrays
        return getConcertsJSON();

      case 'getSeatAvailability':
        const concertId = e.parameter.concertId;
        if (!concertId) {
          return createResponse({ error: 'concertId parameter required' }, 400);
        }
        return getSeatAvailabilityJSON(concertId);

      case 'getConfig':
        return getConfigJSON();

      case 'getAttendee':
        const whatsapp = e.parameter.whatsapp;
        if (!whatsapp) {
          return createResponse({ error: 'whatsapp parameter required' }, 400);
        }
        return getAttendeeByWhatsApp(whatsapp);

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

/**
 * Handle OPTIONS requests - Required for CORS preflight
 * This fixes the CORS error when testing from localhost
 */
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setContent('');
}

// ========================================
// GET CONCERTS DATA (Relational Structure)
// ========================================

/**
 * Returns concerts and artists as separate arrays
 * Matches your existing JSON format exactly
 */
function getConcertsJSON() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Get concerts
  const concertsSheet = ss.getSheetByName(SHEET_NAMES.CONCERTS);
  const concertData = concertsSheet.getDataRange().getValues();
  const concertHeaders = concertData[0];

  // Get artists
  const artistsSheet = ss.getSheetByName(SHEET_NAMES.ARTISTS);
  const artistData = artistsSheet.getDataRange().getValues();
  const artistHeaders = artistData[0];

  // Build concerts array
  const concerts = [];
  for (let i = 1; i < concertData.length; i++) {
    const row = concertData[i];
    const concert = {
      concert_id: getCell(row, concertHeaders, 'concert_id'),
      title: getCell(row, concertHeaders, 'title'),
      sub_title: getCell(row, concertHeaders, 'sub_title'),
      date: formatDate(getCell(row, concertHeaders, 'date')),
      display_date: getCell(row, concertHeaders, 'display_date'),
      genre: getCell(row, concertHeaders, 'genre'),
      image_hero: getCell(row, concertHeaders, 'image_hero'),
      image_past: getCell(row, concertHeaders, 'image_past'),
      image_alt: getCell(row, concertHeaders, 'image_alt'),
      concert_time: getCell(row, concertHeaders, 'concert_time'),
      meal_time: getCell(row, concertHeaders, 'meal_time'),
      meal_order: getCell(row, concertHeaders, 'meal_order'),
      meal_type: getCell(row, concertHeaders, 'meal_type'),
      ticket_price_general: parseInt(getCell(row, concertHeaders, 'ticket_price_general')) || 1000,
      ticket_price_student: parseInt(getCell(row, concertHeaders, 'ticket_price_student')) || 500,
      inclusions: getCell(row, concertHeaders, 'inclusions'),
      contribution_note: getCell(row, concertHeaders, 'contribution_note'),
      event_gallery_link: getCell(row, concertHeaders, 'event_gallery_link') || '',
      event_recording_link: getCell(row, concertHeaders, 'event_recording_link') || '',
      event_status: getCell(row, concertHeaders, 'event_status'),
      booking_status: getCell(row, concertHeaders, 'booking_status') || '',
      duration: getCell(row, concertHeaders, 'duration'),
      max_seats: parseInt(getCell(row, concertHeaders, 'max_seats')) || 50,
      chairs_available: getCell(row, concertHeaders, 'chairs_available') || '',
      venue_address: getCell(row, concertHeaders, 'venue_address') || '',
      venue_google_map_link: getCell(row, concertHeaders, 'venue_google_map_link') || '',
      whatsapp_group_link: getCell(row, concertHeaders, 'whatsapp_group_link') || ''
    };
    concerts.push(concert);
  }

  // Build artists array
  const artists = [];
  for (let i = 1; i < artistData.length; i++) {
    const row = artistData[i];
    const artist = {
      artist_id: getCell(row, artistHeaders, 'artist_id'),
      concert_id: getCell(row, artistHeaders, 'concert_id'),
      name: getCell(row, artistHeaders, 'name'),
      category: getCell(row, artistHeaders, 'category'),
      genre: getCell(row, artistHeaders, 'genre'),
      salutation: getCell(row, artistHeaders, 'salutation') || '',
      bio: getCell(row, artistHeaders, 'bio') || '',
      image_url: getCell(row, artistHeaders, 'image_url') || '',
      social_links: getCell(row, artistHeaders, 'social_links') || '',
      guru_name: getCell(row, artistHeaders, 'guru_name') || ''
    };
    artists.push(artist);
  }

  // Return in your exact format
  return createResponse({
    concerts: concerts,
    artists: artists
  });
}

/**
 * MAIN API ENDPOINT: Returns concerts with embedded artists array
 * This is the format your website expects
 */
function getConcertsWithArtistsEmbedded() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Get concerts
  const concertsSheet = ss.getSheetByName(SHEET_NAMES.CONCERTS);
  const concertData = concertsSheet.getDataRange().getValues();
  const concertHeaders = concertData[0];

  // Get artists
  const artistsSheet = ss.getSheetByName(SHEET_NAMES.ARTISTS);
  const artistData = artistsSheet.getDataRange().getValues();
  const artistHeaders = artistData[0];

  // Build concerts array
  const concerts = [];
  for (let i = 1; i < concertData.length; i++) {
    const row = concertData[i];
    const concertId = getCell(row, concertHeaders, 'concert_id');

    // Find all artists for this concert
    const concertArtists = [];
    for (let j = 1; j < artistData.length; j++) {
      const artistRow = artistData[j];
      if (getCell(artistRow, artistHeaders, 'concert_id') === concertId) {
        concertArtists.push({
          id: getCell(artistRow, artistHeaders, 'artist_id'),
          name: getCell(artistRow, artistHeaders, 'name'),
          category: getCell(artistRow, artistHeaders, 'category'),
          genre: getCell(artistRow, artistHeaders, 'genre'),
          salutation: getCell(artistRow, artistHeaders, 'salutation') || '',
          bio: getCell(artistRow, artistHeaders, 'bio') || '',
          image_url: getCell(artistRow, artistHeaders, 'image_url') || '',
          social_links: getCell(artistRow, artistHeaders, 'social_links') || '',
          guru_name: getCell(artistRow, artistHeaders, 'guru_name') || ''
        });
      }
    }

    const concert = {
      concert_id: concertId,
      title: getCell(row, concertHeaders, 'title'),
      sub_title: getCell(row, concertHeaders, 'sub_title'),
      date: formatDate(getCell(row, concertHeaders, 'date')),
      display_date: getCell(row, concertHeaders, 'display_date'),
      genre: getCell(row, concertHeaders, 'genre'),
      image_hero: getCell(row, concertHeaders, 'image_hero'),
      image_past: getCell(row, concertHeaders, 'image_past'),
      image_alt: getCell(row, concertHeaders, 'image_alt'),
      concert_time: getCell(row, concertHeaders, 'concert_time'),
      meal_time: getCell(row, concertHeaders, 'meal_time'),
      meal_order: getCell(row, concertHeaders, 'meal_order'),
      meal_type: getCell(row, concertHeaders, 'meal_type'),
      ticket_link: getCell(row, concertHeaders, 'ticket_link') || null,
      ticket_price_general: parseInt(getCell(row, concertHeaders, 'ticket_price_general')) || 1000,
      ticket_price_student: parseInt(getCell(row, concertHeaders, 'ticket_price_student')) || 500,
      inclusions: getCell(row, concertHeaders, 'inclusions'),
      contribution_note: getCell(row, concertHeaders, 'contribution_note'),
      invite_link: getCell(row, concertHeaders, 'invite_link') || null,
      event_gallery_link: getCell(row, concertHeaders, 'event_gallery_link') || null,
      event_recording_link: getCell(row, concertHeaders, 'event_recording_link') || null,
      event_status: getCell(row, concertHeaders, 'event_status'),
      isCurrent: getCell(row, concertHeaders, 'isCurrent') || 'N',
      booking_status: getCell(row, concertHeaders, 'booking_status') || '',
      duration: getCell(row, concertHeaders, 'duration'),
      max_seats: parseInt(getCell(row, concertHeaders, 'max_seats')) || 50,
      chairs_available: getCell(row, concertHeaders, 'chairs_available') || '',
      venue_address: getCell(row, concertHeaders, 'venue_address') || '',
      venue_google_map_link: getCell(row, concertHeaders, 'venue_google_map_link') || '',
      whatsapp_group_link: getCell(row, concertHeaders, 'whatsapp_group_link') || '',
      artists: concertArtists
    };
    concerts.push(concert);
  }

  return createResponse(concerts);
}

/**
 * Returns seat availability for a specific concert
 * NOW WITH SEPARATE STUDENT SEAT TRACKING!
 */
function getSeatAvailabilityJSON(concertId) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAMES.SEAT_TRACKING);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  // Find row with matching concert_id
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === concertId) {
      return createResponse({
        concert_id: data[i][0],
        total_seats: data[i][1],
        general_seats_total: data[i][2],
        general_seats_booked: data[i][3],
        general_seats_available: data[i][4],
        student_seats_total: data[i][5],
        student_seats_booked: data[i][6],
        student_seats_available: data[i][7],
        chairs_total: data[i][8],
        chairs_booked: data[i][9],
        chairs_available: data[i][10]
      });
    }
  }

  // Return default if not found
  return createResponse({
    concert_id: concertId,
    total_seats: 50,
    general_seats_total: 45,
    general_seats_booked: 0,
    general_seats_available: 45,
    student_seats_total: 5,
    student_seats_booked: 0,
    student_seats_available: 5,
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
// ATTENDEE MANAGEMENT
// ========================================

/**
 * Find or create attendee by WhatsApp number
 * Returns attendee_id
 */
function findOrCreateAttendee(name, whatsapp, email, studentStatus, needsChair) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAMES.ATTENDEES);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  // Search for existing attendee by WhatsApp
  for (let i = 1; i < data.length; i++) {
    if (data[i][headers.indexOf('whatsapp')] === whatsapp) {
      // Found existing attendee - return their ID
      const existingId = data[i][headers.indexOf('attendee_id')];
      const existingName = data[i][headers.indexOf('name')];
      const totalConcerts = data[i][headers.indexOf('total_concerts_attended')] || 0;
      Logger.log(`      → Found existing attendee: ${existingName} (${existingId}), attended ${totalConcerts} concerts`);
      return existingId;
    }
  }

  // Attendee not found - create new
  const attendeeId = generateAttendeeId();

  Logger.log(`      → Creating NEW attendee in ATTENDEES sheet:`);
  Logger.log(`         Row: [${attendeeId}, ${name}, ${whatsapp}, ${email || ''}, ${studentStatus || 'General'}, ${needsChair ? 'Yes' : 'No'}, '', '', 0, '', '', '']`);

  sheet.appendRow([
    attendeeId,
    name,
    whatsapp,
    email || '',
    studentStatus || 'General',
    needsChair ? 'Yes' : 'No',
    '', // first_concert_id (will be updated when booking is confirmed)
    '', // first_concert_date
    0,  // total_concerts_attended
    '', // last_concert_id
    '', // last_concert_date
    ''  // notes
  ]);

  Logger.log(`      → ✓ New attendee created with ID: ${attendeeId}`);

  return attendeeId;
}

/**
 * Generate unique attendee ID
 */
function generateAttendeeId() {
  const timestamp = new Date().getTime();
  return 'ATT_' + timestamp;
}

/**
 * Get attendee by WhatsApp number
 */
function getAttendeeByWhatsApp(whatsapp) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAMES.ATTENDEES);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  for (let i = 1; i < data.length; i++) {
    if (data[i][headers.indexOf('whatsapp')] === whatsapp) {
      return createResponse({
        attendee_id: data[i][headers.indexOf('attendee_id')],
        name: data[i][headers.indexOf('name')],
        whatsapp: data[i][headers.indexOf('whatsapp')],
        email: data[i][headers.indexOf('email')],
        total_concerts_attended: data[i][headers.indexOf('total_concerts_attended')]
      });
    }
  }

  return createResponse({ error: 'Attendee not found' }, 404);
}

/**
 * Update attendee concert history after confirmation
 */
function updateAttendeeHistory(attendeeId, concertId, concertDate) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAMES.ATTENDEES);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  for (let i = 1; i < data.length; i++) {
    if (data[i][headers.indexOf('attendee_id')] === attendeeId) {
      const rowNum = i + 1;
      const totalConcerts = data[i][headers.indexOf('total_concerts_attended')] || 0;
      const firstConcertId = data[i][headers.indexOf('first_concert_id')];

      // Update first concert if not set
      if (!firstConcertId) {
        sheet.getRange(rowNum, headers.indexOf('first_concert_id') + 1).setValue(concertId);
        sheet.getRange(rowNum, headers.indexOf('first_concert_date') + 1).setValue(concertDate);
      }

      // Update total concerts
      sheet.getRange(rowNum, headers.indexOf('total_concerts_attended') + 1).setValue(totalConcerts + 1);

      // Update last concert
      sheet.getRange(rowNum, headers.indexOf('last_concert_id') + 1).setValue(concertId);
      sheet.getRange(rowNum, headers.indexOf('last_concert_date') + 1).setValue(concertDate);

      break;
    }
  }
}

// ========================================
// SUBMIT BOOKING
// ========================================

/**
 * Receives booking submission from website
 * Expected data structure:
 * {
 *   bookingId, transactionId, timestamp, concert, seats,
 *   totalAmount, attendees (array), paymentScreenshot (base64)
 * }
 */
function submitBooking(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const bookingsSheet = ss.getSheetByName(SHEET_NAMES.BOOKINGS);
  const bookingAttendeesSheet = ss.getSheetByName(SHEET_NAMES.BOOKING_ATTENDEES);

  try {
    Logger.log('========================================');
    Logger.log('📥 BOOKING SUBMISSION STARTED');
    Logger.log('========================================');

    // Extract data
    const bookingId = data.bookingId || generateBookingId();
    const transactionId = data.transactionId;
    const timestamp = new Date().toISOString();
    const concertId = data.concert?.concert_id || 'UNKNOWN';
    const concertName = (data.concert?.title || '') + (data.concert?.sub_title || '');
    const generalSeats = data.seats.general || 0;
    const studentSeats = data.seats.student || 0;
    const chairsRequested = data.seats.chairs || 0;
    const totalAmount = data.totalAmount || 0;

    Logger.log('🎫 Booking Details:');
    Logger.log(`   Booking ID: ${bookingId}`);
    Logger.log(`   Transaction ID: ${transactionId}`);
    Logger.log(`   Concert ID: ${concertId}`);
    Logger.log(`   Concert Name: ${concertName}`);
    Logger.log(`   General Seats: ${generalSeats}`);
    Logger.log(`   Student Seats: ${studentSeats}`);
    Logger.log(`   Chairs: ${chairsRequested}`);
    Logger.log(`   Total Amount: ₹${totalAmount}`);
    Logger.log(`   Total Attendees: ${data.attendees?.length || 0}`);

    // ========================================
    // VALIDATE SEAT AVAILABILITY BEFORE ACCEPTING BOOKING
    // ========================================

    Logger.log('');
    Logger.log('🔍 Checking Seat Availability...');

    // Get current seat availability
    const availabilityResponse = getSeatAvailabilityJSON(concertId);
    const availability = JSON.parse(availabilityResponse.getContent());

    Logger.log(`   Current Availability:`);
    Logger.log(`      General: ${availability.general_seats_available} available (${availability.general_seats_total} total, ${availability.general_seats_booked} booked)`);
    Logger.log(`      Student: ${availability.student_seats_available} available (${availability.student_seats_total} total, ${availability.student_seats_booked} booked)`);
    Logger.log(`      Chairs: ${availability.chairs_available} available (${availability.chairs_total} total, ${availability.chairs_booked} booked)`);

    // Validate general seats
    if (generalSeats > availability.general_seats_available) {
      Logger.log(`❌ VALIDATION FAILED: Not enough general seats (requested ${generalSeats}, available ${availability.general_seats_available})`);
      return createResponse({
        success: false,
        error: `Only ${availability.general_seats_available} general seats available. You requested ${generalSeats}.`
      }, 400);
    }

    // Validate student seats (CRITICAL - prevents revenue loss!)
    if (studentSeats > availability.student_seats_available) {
      Logger.log(`❌ VALIDATION FAILED: Not enough student seats (requested ${studentSeats}, available ${availability.student_seats_available})`);
      return createResponse({
        success: false,
        error: `Only ${availability.student_seats_available} student seats available. You requested ${studentSeats}.`
      }, 400);
    }

    // Validate chairs
    if (chairsRequested > availability.chairs_available) {
      Logger.log(`❌ VALIDATION FAILED: Not enough chairs (requested ${chairsRequested}, available ${availability.chairs_available})`);
      return createResponse({
        success: false,
        error: `Only ${availability.chairs_available} chairs available. You requested ${chairsRequested}.`
      }, 400);
    }

    Logger.log('✅ Seat availability validated - sufficient seats available');

    // All validations passed - proceed with booking
    // ========================================

    // Find main attendee
    const mainAttendee = data.attendees.find(a => a.isMain) || data.attendees[0] || {};

    Logger.log('');
    Logger.log('👥 Processing Attendees...');

    // Create or find all attendees in master table
    const attendeeIds = [];
    let mainContactAttendeeId = '';

    for (let i = 0; i < data.attendees.length; i++) {
      const attendee = data.attendees[i];
      Logger.log(`   Attendee ${i + 1}:`);
      Logger.log(`      Name: ${attendee.name}`);
      Logger.log(`      WhatsApp: ${attendee.whatsapp}`);
      Logger.log(`      Seat Type: ${attendee.seatType || 'General'}`);
      Logger.log(`      Needs Chair: ${attendee.needsChair ? 'Yes' : 'No'}`);
      Logger.log(`      Is Main Contact: ${attendee.isMain ? 'Yes' : 'No'}`);

      const attendeeId = findOrCreateAttendee(
        attendee.name,
        attendee.whatsapp,
        attendee.email,
        attendee.seatType,
        attendee.needsChair
      );

      Logger.log(`      ✓ Attendee ID: ${attendeeId}`);

      attendeeIds.push({
        attendeeId: attendeeId,
        seatType: attendee.seatType || 'General',
        needsChair: attendee.needsChair || false,
        isMain: attendee.isMain || false
      });

      if (attendee.isMain) {
        mainContactAttendeeId = attendeeId;
      }
    }

    // If no main contact, use first attendee
    if (!mainContactAttendeeId && attendeeIds.length > 0) {
      mainContactAttendeeId = attendeeIds[0].attendeeId;
      attendeeIds[0].isMain = true;
      Logger.log(`   ⚠ No main contact specified, using first attendee as main contact`);
    }

    Logger.log(`   Main Contact Attendee ID: ${mainContactAttendeeId}`);

    // Handle payment screenshot upload
    let screenshotUrl = '';
    if (data.paymentScreenshot) {
      Logger.log('');
      Logger.log('📸 Uploading Payment Screenshot...');
      screenshotUrl = uploadScreenshotToDrive(
        data.paymentScreenshot,
        `payment_${bookingId}`
      );

      if (screenshotUrl) {
        Logger.log(`   ✓ Screenshot uploaded: ${screenshotUrl}`);
        // Log to Payment Logs sheet
        logPaymentScreenshot(bookingId, transactionId, `payment_${bookingId}.jpg`, screenshotUrl);
        Logger.log(`   ✓ Screenshot logged to Payment Logs sheet`);
      } else {
        Logger.log(`   ⚠ Screenshot upload failed or skipped`);
      }
    } else {
      Logger.log('');
      Logger.log('📸 No payment screenshot provided');
    }

    Logger.log('');
    Logger.log('💾 Writing to Excel Sheets...');

    // Append to Bookings sheet
    Logger.log('   ✍ Writing to BOOKINGS sheet:');
    Logger.log(`      Row data: [${bookingId}, ${transactionId}, ${timestamp}, ${concertId}, ${concertName}, `
              + `${generalSeats}, ${studentSeats}, ${chairsRequested}, ${totalAmount}, ${mainContactAttendeeId}, `
              + `${screenshotUrl ? 'screenshot_url' : 'no_screenshot'}, pending, No, '']`);

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
      mainContactAttendeeId,
      screenshotUrl,
      'pending', // booking_status
      'No',      // confirmation_sent
      ''         // booking_notes
    ]);
    Logger.log(`   ✓ Added 1 row to BOOKINGS sheet`);

    // Append to Booking_Attendees junction table
    Logger.log('   ✍ Writing to BOOKING_ATTENDEES sheet:');
    for (let i = 0; i < attendeeIds.length; i++) {
      const attendeeInfo = attendeeIds[i];
      Logger.log(`      Row ${i + 1}: [${bookingId}, ${attendeeInfo.attendeeId}, ${attendeeInfo.seatType}, `
                + `${attendeeInfo.needsChair ? 'Yes' : 'No'}, ${attendeeInfo.isMain ? 'Yes' : 'No'}]`);

      bookingAttendeesSheet.appendRow([
        bookingId,
        attendeeInfo.attendeeId,
        attendeeInfo.seatType,
        attendeeInfo.needsChair ? 'Yes' : 'No',
        attendeeInfo.isMain ? 'Yes' : 'No'
      ]);
    }
    Logger.log(`   ✓ Added ${attendeeIds.length} rows to BOOKING_ATTENDEES sheet`);

    // ========================================
    // UPDATE SEAT AVAILABILITY IMMEDIATELY
    // ========================================
    Logger.log('');
    Logger.log('📊 Updating Seat Availability in SEAT TRACKING sheet...');
    Logger.log(`   Reducing: ${generalSeats} general seats, ${studentSeats} student seats, ${chairsRequested} chairs`);

    updateSeatAvailability(concertId, generalSeats, studentSeats, chairsRequested);

    Logger.log(`   ✓ Seat availability updated successfully`);

    // Send confirmation email/WhatsApp (optional)
    // sendConfirmationNotification(mainAttendee.whatsapp, bookingId, concertName);

    Logger.log('');
    Logger.log('========================================');
    Logger.log('✅ BOOKING COMPLETED SUCCESSFULLY');
    Logger.log('========================================');
    Logger.log(`Booking ID: ${bookingId}`);
    Logger.log(`Concert: ${concertName}`);
    Logger.log(`Total Attendees: ${attendeeIds.length}`);
    Logger.log(`Seats Booked: ${generalSeats} general + ${studentSeats} student = ${generalSeats + studentSeats} total`);
    Logger.log(`Chairs: ${chairsRequested}`);
    Logger.log(`Amount: ₹${totalAmount}`);
    Logger.log('========================================');

    return createResponse({
      success: true,
      bookingId: bookingId,
      message: 'Booking submitted successfully. Seats have been reserved for you!'
    });

  } catch (error) {
    Logger.log('========================================');
    Logger.log('❌ BOOKING FAILED');
    Logger.log('========================================');
    Logger.log('Error: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
    Logger.log('========================================');
    return createResponse({ error: error.toString() }, 500);
  }
}

/**
 * Generate unique booking ID
 */
function generateBookingId() {
  const timestamp = new Date().getTime();
  return 'BK_' + timestamp;
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
 * Also updates attendee history
 */
function confirmBooking(data) {
  const bookingId = data.bookingId;

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const bookingsSheet = ss.getSheetByName(SHEET_NAMES.BOOKINGS);
  const bookingData = bookingsSheet.getDataRange().getValues();
  const bookingHeaders = bookingData[0];

  // Find booking by ID
  for (let i = 1; i < bookingData.length; i++) {
    if (bookingData[i][0] === bookingId) {
      const concertId = bookingData[i][bookingHeaders.indexOf('concert_id')];
      const generalSeats = bookingData[i][bookingHeaders.indexOf('general_seats')];
      const studentSeats = bookingData[i][bookingHeaders.indexOf('student_seats')];
      const chairsRequested = bookingData[i][bookingHeaders.indexOf('chairs_requested')];

      // Update booking status to 'confirmed'
      bookingsSheet.getRange(i + 1, bookingHeaders.indexOf('booking_status') + 1).setValue('confirmed');
      bookingsSheet.getRange(i + 1, bookingHeaders.indexOf('confirmation_sent') + 1).setValue('Yes');

      // Update seat availability (pass general and student separately!)
      updateSeatAvailability(concertId, generalSeats, studentSeats, chairsRequested);

      // Update attendee history
      const bookingAttendeesSheet = ss.getSheetByName(SHEET_NAMES.BOOKING_ATTENDEES);
      const baData = bookingAttendeesSheet.getDataRange().getValues();
      const baHeaders = baData[0];

      // Get concert date
      const concertsSheet = ss.getSheetByName(SHEET_NAMES.CONCERTS);
      const concertData = concertsSheet.getDataRange().getValues();
      const concertHeaders = concertData[0];
      let concertDate = '';

      for (let j = 1; j < concertData.length; j++) {
        if (concertData[j][concertHeaders.indexOf('concert_id')] === concertId) {
          concertDate = concertData[j][concertHeaders.indexOf('date')];
          break;
        }
      }

      // Update all attendees in this booking
      for (let j = 1; j < baData.length; j++) {
        if (baData[j][baHeaders.indexOf('booking_id')] === bookingId) {
          const attendeeId = baData[j][baHeaders.indexOf('attendee_id')];
          updateAttendeeHistory(attendeeId, concertId, concertDate);
        }
      }

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
 * NOW HANDLES GENERAL AND STUDENT SEATS SEPARATELY!
 *
 * @param {string} concertId - Concert ID
 * @param {number} generalSeatsToBook - Number of general seats to book
 * @param {number} studentSeatsToBook - Number of student seats to book
 * @param {number} chairsToBook - Number of chairs to book
 */
function updateSeatAvailability(concertId, generalSeatsToBook, studentSeatsToBook, chairsToBook) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAMES.SEAT_TRACKING);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === concertId) {
      const rowNum = i + 1;

      // Column indices (based on new structure)
      const generalBookedCol = 4;  // Column D: general_seats_booked
      const generalAvailCol = 5;   // Column E: general_seats_available
      const studentBookedCol = 7;  // Column G: student_seats_booked
      const studentAvailCol = 8;   // Column H: student_seats_available
      const chairsBookedCol = 10;  // Column J: chairs_booked
      const chairsAvailCol = 11;   // Column K: chairs_available

      // Get BEFORE values
      const currentGeneralBooked = data[i][generalBookedCol - 1];
      const currentGeneralAvail = data[i][generalAvailCol - 1];
      const currentStudentBooked = data[i][studentBookedCol - 1];
      const currentStudentAvail = data[i][studentAvailCol - 1];
      const currentChairsBooked = data[i][chairsBookedCol - 1];
      const currentChairsAvail = data[i][chairsAvailCol - 1];

      Logger.log('   📊 BEFORE Update (Row ' + rowNum + ' in SEAT TRACKING sheet):');
      Logger.log(`      General: ${currentGeneralBooked} booked, ${currentGeneralAvail} available`);
      Logger.log(`      Student: ${currentStudentBooked} booked, ${currentStudentAvail} available`);
      Logger.log(`      Chairs: ${currentChairsBooked} booked, ${currentChairsAvail} available`);

      // Calculate NEW values
      const newGeneralBooked = currentGeneralBooked + generalSeatsToBook;
      const newStudentBooked = currentStudentBooked + studentSeatsToBook;
      const newChairsBooked = currentChairsBooked + chairsToBook;

      const generalTotal = data[i][2];  // Column C: general_seats_total
      const studentTotal = data[i][5];  // Column F: student_seats_total
      const chairsTotal = data[i][8];   // Column I: chairs_total

      const newGeneralAvail = generalTotal - newGeneralBooked;
      const newStudentAvail = studentTotal - newStudentBooked;
      const newChairsAvail = chairsTotal - newChairsBooked;

      // Update GENERAL seats
      sheet.getRange(rowNum, generalBookedCol).setValue(newGeneralBooked);
      sheet.getRange(rowNum, generalAvailCol).setValue(newGeneralAvail);

      // Update STUDENT seats
      sheet.getRange(rowNum, studentBookedCol).setValue(newStudentBooked);
      sheet.getRange(rowNum, studentAvailCol).setValue(newStudentAvail);

      // Update CHAIRS
      sheet.getRange(rowNum, chairsBookedCol).setValue(newChairsBooked);
      sheet.getRange(rowNum, chairsAvailCol).setValue(newChairsAvail);

      Logger.log('   📊 AFTER Update:');
      Logger.log(`      General: ${newGeneralBooked} booked (+${generalSeatsToBook}), ${newGeneralAvail} available (-${generalSeatsToBook})`);
      Logger.log(`      Student: ${newStudentBooked} booked (+${studentSeatsToBook}), ${newStudentAvail} available (-${studentSeatsToBook})`);
      Logger.log(`      Chairs: ${newChairsBooked} booked (+${chairsToBook}), ${newChairsAvail} available (-${chairsToBook})`);

      break;
    }
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Get cell value by column name
 */
function getCell(row, headers, columnName) {
  const index = headers.indexOf(columnName);
  return index >= 0 ? row[index] : '';
}

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
// TESTING FUNCTIONS (RUN THESE IN EDITOR)
// ========================================

/**
 * Test getConcerts endpoint
 * Run this with the ▶️ button to test if data loads correctly
 */
function testGetConcerts() {
  try {
    const result = getConcertsWithArtistsEmbedded();
    const concerts = JSON.parse(result.getContent());
    Logger.log('✅ SUCCESS! Found ' + concerts.length + ' concerts');
    Logger.log(JSON.stringify(concerts, null, 2));
    return concerts;
  } catch (error) {
    Logger.log('❌ ERROR: ' + error.toString());
  }
}

/**
 * Test seat availability endpoint
 * Replace 'CONC001' with your actual concert ID
 */
function testGetSeatAvailability() {
  try {
    const result = getSeatAvailabilityJSON('CONC001');
    const availability = JSON.parse(result.getContent());
    Logger.log('✅ Seat Availability:');
    Logger.log(JSON.stringify(availability, null, 2));
    return availability;
  } catch (error) {
    Logger.log('❌ ERROR: ' + error.toString());
  }
}

/**
 * Test if SPREADSHEET_ID is set correctly
 */
function testConnection() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    Logger.log('✅ Connected to: ' + ss.getName());

    // List all sheets
    const sheets = ss.getSheets();
    Logger.log('📊 Found ' + sheets.length + ' sheets:');
    sheets.forEach(sheet => Logger.log('  - ' + sheet.getName()));

    return true;
  } catch (error) {
    Logger.log('❌ ERROR connecting to spreadsheet:');
    Logger.log('Check that SPREADSHEET_ID is correct on line 19');
    Logger.log(error.toString());
    return false;
  }
}
