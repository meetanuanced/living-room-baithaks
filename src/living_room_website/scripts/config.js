// ========================================
// LIVING ROOM BAITHAKS - CONFIGURATION
// ========================================
//
// INSTRUCTIONS:
// 1. Replace the placeholder values below with your actual values
// 2. Save this file
// 3. The website will automatically use these values
//
// ========================================

/**
 * Google Apps Script Web App URL
 *
 * To find this:
 * 1. Open your Google Apps Script project
 * 2. Click "Deploy" → "Manage deployments"
 * 3. Copy the Web App URL
 *
 * Example: 'https://script.google.com/macros/s/AKfycby...ABC123/exec'
 */
const API_URL = 'YOUR_WEB_APP_URL_HERE';

/**
 * Use local JSON for testing?
 *
 * Set to true to use local test_case_4_max_past.json file
 * Set to false to use Google Apps Script API
 */
const USE_LOCAL_DATA = true;

/**
 * Local JSON file path (for testing only)
 */
const LOCAL_DATA_PATH = 'test_case_4_max_past.json';

// ========================================
// DO NOT EDIT BELOW THIS LINE
// ========================================

/**
 * Get the data source URL based on configuration
 */
function getDataSourceURL() {
    if (USE_LOCAL_DATA) {
        console.warn('⚠️ Using LOCAL data from:', LOCAL_DATA_PATH);
        console.warn('⚠️ Set USE_LOCAL_DATA = false in config.js to use Google Apps Script API');
        return LOCAL_DATA_PATH;
    }

    if (API_URL === 'YOUR_WEB_APP_URL_HERE') {
        console.error('❌ ERROR: API_URL not configured in config.js');
        console.error('Please update config.js with your Google Apps Script Web App URL');
        return LOCAL_DATA_PATH; // Fallback to local
    }

    console.log('✅ Using Google Apps Script API:', API_URL);
    return API_URL + '?action=getConcerts';
}

/**
 * Submit booking to backend
 */
async function submitBookingToBackend(bookingData) {
    if (USE_LOCAL_DATA || API_URL === 'YOUR_WEB_APP_URL_HERE') {
        console.warn('⚠️ BOOKING SUBMISSION DISABLED: Using local data mode or API_URL not configured');
        console.log('📋 Booking data (not submitted):', bookingData);
        return {
            success: true,
            bookingId: bookingData.bookingId,
            message: 'Test mode - booking not actually submitted to backend'
        };
    }

    try {
        const response = await fetch(API_URL + '?action=submitBooking', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookingData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;

    } catch (error) {
        console.error('❌ Error submitting booking:', error);
        throw error;
    }
}

/**
 * Get seat availability for a concert
 */
async function getSeatAvailability(concertId) {
    if (USE_LOCAL_DATA || API_URL === 'YOUR_WEB_APP_URL_HERE') {
        console.warn('⚠️ Using mock seat availability data');
        return {
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
        };
    }

    try {
        const response = await fetch(`${API_URL}?action=getSeatAvailability&concertId=${concertId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;

    } catch (error) {
        console.error('❌ Error getting seat availability:', error);
        throw error;
    }
}
