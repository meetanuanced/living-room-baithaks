// ===== CONFIGURATION =====
const CONFIG = {
  SHEET_NAME_BOOKINGS: 'Bookings',
  SHEET_NAME_ATTENDEES: 'Attendees',
  SHEET_NAME_EVENTS: 'Events',
  WHATSAPP_API_KEY: '', // Add your WhatsApp Business API key if available
  ADMIN_WHATSAPP: '+919876543210' // Your number for notifications
};

// ===== MAIN ENDPOINT =====
function doPost(e) {
  try {
    // Parse incoming data
    const data = JSON.parse(e.postData.contents);
    
    // Route to appropriate handler
    switch(data.action) {
      case 'createBooking':
        return createBooking(data.booking);
      case 'getAvailability':
        return getEventAvailability(data.eventId);
      case 'verifyPayment':
        return verifyPayment(data.bookingId, data.verified);
      case 'cancelBooking':
        return cancelBooking(data.bookingId);
      default:
        return errorResponse('Invalid action');
    }
  } catch (error) {
    return errorResponse(error.toString());
  }
}

function doGet(e) {
  // Handle GET requests for testing
  const action = e.parameter.action;
  
  if (action === 'test') {
    return successResponse({ message: 'API is working!' });
  }
  
  if (action === 'availability') {
    return getEventAvailability(e.parameter.eventId);
  }
  
  return errorResponse('Use POST for booking operations');
}

// ===== CREATE BOOKING =====
function createBooking(booking) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bookingsSheet = ss.getSheetByName(CONFIG.SHEET_NAME_BOOKINGS);
  const attendeesSheet = ss.getSheetByName(CONFIG.SHEET_NAME_ATTENDEES);
  const eventsSheet = ss.getSheetByName(CONFIG.SHEET_NAME_EVENTS);
  
  // Validate required fields
  if (!booking.bookingId || !booking.booker || !booking.tickets) {
    return errorResponse('Missing required booking data');
  }
  
  // Check availability
  const eventId = booking.event.name;
  const availability = checkAvailability(eventId, booking.tickets.general + booking.tickets.student);
  
  if (!availability.available) {
    return errorResponse('Not enough seats available');
  }
  
  // Add to Bookings sheet
  const timestamp = new Date().toISOString();
  const bookingRow = [
    booking.bookingId,                      // A: Booking ID
    timestamp,                              // B: Timestamp
    booking.event.name,                     // C: Event Name
    booking.event.date,                     // D: Event Date
    booking.event.artist,                   // E: Artist Name
    booking.booker.name,                    // F: Booker Name
    booking.booker.whatsapp,               // G: WhatsApp
    booking.booker.area,                   // H: Area
    booking.tickets.general,               // I: General Tickets
    booking.tickets.student,               // J: Student Tickets
    booking.tickets.chairs,                // K: Chairs Requested
    booking.payment.amount,                // L: Total Amount
    'Pending Verification',                // M: Payment Status
    'Confirmed',                           // N: Booking Status
    booking.booker.wantsReminders,         // O: Wants Reminders
    '',                                    // P: Notes (empty)
    new Date(),                            // Q: Created Date
    ''                                     // R: Verified Date (empty)
  ];
  
  bookingsSheet.appendRow(bookingRow);
  
  // Add attendees to Attendees sheet
  booking.attendees.forEach(attendee => {
    const attendeeRow = [
      booking.bookingId,           // A: Booking ID
      attendee.name,               // B: Attendee Name
      attendee.isStudent,          // C: Is Student
      attendee.needsChair,         // D: Needs Chair
      false,                       // E: Attended (default false)
      false                        // F: Student ID Verified (default false)
    ];
    attendeesSheet.appendRow(attendeeRow);
  });
  
  // Update event seat count
  updateEventSeats(eventsSheet, eventId, booking.tickets.general + booking.tickets.student);
  
  // Send admin notification
  notifyAdmin(booking);
  
  // Send confirmation to user (if WhatsApp API configured)
  sendUserConfirmation(booking);
  
  return successResponse({
    bookingId: booking.bookingId,
    status: 'created',
    message: 'Booking received successfully. We will verify payment and confirm shortly.'
  });
}

// ===== CHECK AVAILABILITY =====
function checkAvailability(eventName, requestedSeats) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const eventsSheet = ss.getSheetByName(CONFIG.SHEET_NAME_EVENTS);
  const bookingsSheet = ss.getSheetByName(CONFIG.SHEET_NAME_BOOKINGS);
  
  // Find event
  const eventsData = eventsSheet.getDataRange().getValues();
  let totalSeats = 50; // default
  let eventFound = false;
  
  for (let i = 1; i < eventsData.length; i++) {
    if (eventsData[i][1] === eventName) { // Column B: Event Name
      totalSeats = eventsData[i][4]; // Column E: Total Seats
      eventFound = true;
      break;
    }
  }
  
  // Count booked seats
  const bookingsData = bookingsSheet.getDataRange().getValues();
  let bookedSeats = 0;
  
  for (let i = 1; i < bookingsData.length; i++) {
    if (bookingsData[i][2] === eventName && bookingsData[i][13] !== 'Cancelled') {
      // Column C: Event Name, Column N: Booking Status
      bookedSeats += bookingsData[i][8] + bookingsData[i][9]; // Columns I+J: General + Student
    }
  }
  
  const available = totalSeats - bookedSeats;
  
  return {
    available: available >= requestedSeats,
    seatsLeft: available,
    requestedSeats: requestedSeats
  };
}

function getEventAvailability(eventId) {
  const availability = checkAvailability(eventId, 0);
  return successResponse(availability);
}

// ===== UPDATE EVENT SEATS =====
function updateEventSeats(eventsSheet, eventName, seatsToAdd) {
  const data = eventsSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === eventName) { // Column B: Event Name
      const currentBooked = data[i][5] || 0; // Column F: Booked Seats
      eventsSheet.getRange(i + 1, 6).setValue(currentBooked + seatsToAdd); // Update Column F
      break;
    }
  }
}

// ===== VERIFY PAYMENT =====
function verifyPayment(bookingId, verified) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bookingsSheet = ss.getSheetByName(CONFIG.SHEET_NAME_BOOKINGS);
  const data = bookingsSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === bookingId) { // Column A: Booking ID
      const status = verified ? 'Verified' : 'Not Verified';
      bookingsSheet.getRange(i + 1, 13).setValue(status); // Column M: Payment Status
      
      if (verified) {
        bookingsSheet.getRange(i + 1, 18).setValue(new Date()); // Column R: Verified Date
      }
      
      return successResponse({ 
        bookingId: bookingId, 
        paymentStatus: status,
        message: 'Payment status updated'
      });
    }
  }
  
  return errorResponse('Booking ID not found');
}

// ===== CANCEL BOOKING =====
function cancelBooking(bookingId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bookingsSheet = ss.getSheetByName(CONFIG.SHEET_NAME_BOOKINGS);
  const data = bookingsSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === bookingId) { // Column A: Booking ID
      bookingsSheet.getRange(i + 1, 14).setValue('Cancelled'); // Column N: Booking Status
      
      // Update event seat count (free up seats)
      const eventName = data[i][2];
      const totalTickets = data[i][8] + data[i][9]; // General + Student
      const eventsSheet = ss.getSheetByName(CONFIG.SHEET_NAME_EVENTS);
      updateEventSeats(eventsSheet, eventName, -totalTickets);
      
      return successResponse({ 
        bookingId: bookingId, 
        status: 'cancelled',
        message: 'Booking cancelled successfully'
      });
    }
  }
  
  return errorResponse('Booking ID not found');
}

// ===== NOTIFICATIONS =====
function notifyAdmin(booking) {
  try {
    // Send email to admin
    const subject = `New Booking: ${booking.bookingId}`;
    const body = `
New booking received!

Booking ID: ${booking.bookingId}
Event: ${booking.event.name}
Name: ${booking.booker.name}
WhatsApp: ${booking.booker.whatsapp}
Tickets: ${booking.tickets.general} General + ${booking.tickets.student} Student
Amount: ₹${booking.payment.amount}

Action Required: Verify payment in the sheet.

View booking: ${SpreadsheetApp.getActiveSpreadsheet().getUrl()}
    `;
    
    // Send to your email (replace with your email)
    MailApp.sendEmail({
      to: 'your-email@example.com', // CHANGE THIS
      subject: subject,
      body: body
    });
    
    Logger.log('Admin notification sent');
  } catch (error) {
    Logger.log('Failed to send admin notification: ' + error);
  }
}

function sendUserConfirmation(booking) {
  // If you have WhatsApp Business API configured
  // Implement WhatsApp message sending here
  
  // For now, just log
  Logger.log('User confirmation would be sent to: ' + booking.booker.whatsapp);
  
  // You can also send email confirmation
  try {
    const subject = `Booking Confirmation - ${booking.bookingId}`;
    const body = `
Dear ${booking.booker.name},

Thank you for booking with Living Room Baithaks!

Your Booking Details:
- Booking ID: ${booking.bookingId}
- Event: ${booking.event.name}
- Date: ${booking.event.date}
- Tickets: ${booking.tickets.general + booking.tickets.student} seats
- Amount: ₹${booking.payment.amount}

We will verify your payment and send confirmation on WhatsApp shortly.

The exact venue address will be shared 24 hours before the event.

Looking forward to seeing you!

Living Room Baithaks
    `;
    
    // Note: This will send from your Google account
    // Make sure to configure a proper email address
    Logger.log('Confirmation email prepared for: ' + booking.booker.whatsapp);
    
  } catch (error) {
    Logger.log('Failed to send user confirmation: ' + error);
  }
}

// ===== UTILITY FUNCTIONS =====
function successResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(message) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: false, error: message }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===== SCHEDULED FUNCTIONS =====
// Run these manually or set up triggers

function sendEventReminders() {
  // Send reminders 24 hours before event
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bookingsSheet = ss.getSheetByName(CONFIG.SHEET_NAME_BOOKINGS);
  const data = bookingsSheet.getDataRange().getValues();
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  for (let i = 1; i < data.length; i++) {
    const eventDate = new Date(data[i][3]); // Column D: Event Date
    eventDate.setHours(0, 0, 0, 0);
    
    if (eventDate.getTime() === tomorrow.getTime() && 
        data[i][14] === true && // Column O: Wants Reminders
        data[i][13] === 'Confirmed') { // Column N: Booking Status
      
      const bookerName = data[i][5];
      const whatsapp = data[i][6];
      
      Logger.log(`Send reminder to ${bookerName} at ${whatsapp}`);
      // Implement WhatsApp reminder here
    }
  }
}

function generateDailySummary() {
  // Generate summary of bookings
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bookingsSheet = ss.getSheetByName(CONFIG.SHEET_NAME_BOOKINGS);
  const data = bookingsSheet.getDataRange().getValues();
  
  let totalBookings = 0;
  let totalRevenue = 0;
  let pendingVerification = 0;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][13] !== 'Cancelled') { // Column N: Booking Status
      totalBookings++;
      totalRevenue += data[i][11]; // Column L: Total Amount
      
      if (data[i][12] === 'Pending Verification') { // Column M: Payment Status
        pendingVerification++;
      }
    }
  }
  
  const summary = `
Daily Summary:
- Total Bookings: ${totalBookings}
- Total Revenue: ₹${totalRevenue}
- Pending Verification: ${pendingVerification}
  `;
  
  Logger.log(summary);
  // Can email this summary to admin
}

// ===== TESTING FUNCTION =====
function testAPI() {
  const testBooking = {
    action: 'createBooking',
    booking: {
      bookingId: 'TEST001',
      event: {
        name: 'Test Event',
        date: '2025-12-01',
        artist: 'Test Artist'
      },
      booker: {
        name: 'Test User',
        whatsapp: '+919999999999',
        area: 'Test Area',
        wantsReminders: true
      },
      tickets: {
        general: 2,
        student: 1,
        chairs: 2
      },
      attendees: [
        { name: 'Person 1', isStudent: false, needsChair: true },
        { name: 'Person 2', isStudent: false, needsChair: true },
        { name: 'Person 3', isStudent: true, needsChair: false }
      ],
      payment: {
        amount: 2500
      }
    }
  };
  
  const result = createBooking(testBooking.booking);
  Logger.log(result.getContent());
}
