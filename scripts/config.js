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
const API_URL = 'https://script.google.com/macros/s/AKfycbx9kZ5u4wrRng9V_l2sUsc8CnnpW-sLKfZ_etnDUCJShmtY4tL-bEOa8OQj-zBbfuHo/exec';

/**
 * Use local JSON for testing?
 *
 * Set to true to use local data/lrb_concerts_master_final_updated.json file
 * Set to false to use Google Apps Script API
 */
const USE_LOCAL_DATA = false;

/**
 * Local JSON file path (for testing only)
 */
const LOCAL_DATA_PATH = './data/lrb_concerts_master_final_updated.json';

/**
 * Local Proxy Server (RECOMMENDED for local testing)
 *
 * Run the local proxy server: node cors-proxy.js
 * Then set USE_LOCAL_PROXY = true
 *
 * This is better than third-party CORS proxies!
 */
const USE_LOCAL_PROXY = false;
const LOCAL_PROXY_URL = 'http://localhost:3001';

/**
 * Third-party CORS Proxy (backup option)
 *
 * If you don't want to run a local proxy, set USE_CORS_PROXY = true
 * ⚠️ Only use for local testing! Disable for production.
 */
const USE_CORS_PROXY = false;
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

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

    // Use local proxy server (recommended for development)
    if (USE_LOCAL_PROXY) {
        console.log('✅ Using LOCAL PROXY SERVER:', LOCAL_PROXY_URL);
        console.log('🔄 Proxying to:', API_URL);
        return LOCAL_PROXY_URL + '?action=getConcerts';
    }

    const baseUrl = API_URL + '?action=getConcerts';

    // Use third-party CORS proxy (backup option)
    if (USE_CORS_PROXY) {
        console.warn('🔄 Using third-party CORS proxy:', CORS_PROXY);
        console.warn('⚠️ Remember to disable USE_CORS_PROXY in production!');
        return CORS_PROXY + encodeURIComponent(baseUrl);
    }

    console.log('✅ Using Google Apps Script API directly:', API_URL);
    return baseUrl;
}

/**
 * Submit booking to backend
 */
async function submitBookingToBackend(bookingData) {
    console.log('========================================');
    console.log('📤 BOOKING SUBMISSION STARTING');
    console.log('========================================');
    console.log('Config:');
    console.log('   USE_LOCAL_DATA:', USE_LOCAL_DATA);
    console.log('   API_URL:', API_URL);
    console.log('   USE_LOCAL_PROXY:', USE_LOCAL_PROXY);
    console.log('   USE_CORS_PROXY:', USE_CORS_PROXY);

    if (USE_LOCAL_DATA || API_URL === 'YOUR_WEB_APP_URL_HERE') {
        console.error('========================================');
        console.error('❌ BOOKING SUBMISSION DISABLED!');
        console.error('========================================');
        console.error('Reason: Using local data mode or API_URL not configured');
        console.error('To fix:');
        console.error('  1. Set USE_LOCAL_DATA = false in config.js');
        console.error('  2. Set API_URL to your Google Apps Script Web App URL');
        console.error('  3. Redeploy your Apps Script as a web app');
        console.error('========================================');
        console.log('📋 Booking data (NOT SAVED TO EXCEL):', bookingData);
        alert('⚠️ TEST MODE: Booking not saved! Check console for details.');
        return {
            success: true,
            bookingId: bookingData.bookingId,
            message: 'Test mode - booking not actually submitted to backend'
        };
    }

    try {
        let url;

        // Use local proxy server
        if (USE_LOCAL_PROXY) {
            url = LOCAL_PROXY_URL + '?action=submitBooking';
            console.log('📤 Submitting booking via LOCAL PROXY SERVER:', url);
        }
        // Use third-party CORS proxy
        else if (USE_CORS_PROXY) {
            url = CORS_PROXY + encodeURIComponent(API_URL + '?action=submitBooking');
            console.warn('🔄 Using THIRD-PARTY CORS PROXY:', url);
        }
        // Direct API call
        else {
            url = API_URL + '?action=submitBooking';
            console.log('📤 Submitting booking DIRECTLY to Apps Script:', url);
        }

        console.log('🔄 Sending POST request to:', url);
        console.log('📦 Payload:', JSON.stringify(bookingData, null, 2));

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookingData)
        });

        console.log('📡 Response status:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Response error body:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('✅ Response received:', result);
        console.log('========================================');
        return result;

    } catch (error) {
        console.error('========================================');
        console.error('❌ BOOKING SUBMISSION FAILED');
        console.error('========================================');
        console.error('Error:', error);
        console.error('Stack:', error.stack);
        console.error('========================================');
        throw error;
    }
}

/**
 * Get seat availability for a concert
 */
async function getSeatAvailability(concertId) {
    console.log('🔍 Getting seat availability for concert:', concertId);

    if (USE_LOCAL_DATA || API_URL === 'YOUR_WEB_APP_URL_HERE') {
        console.error('========================================');
        console.error('⚠️ USING MOCK SEAT AVAILABILITY DATA!');
        console.error('========================================');
        console.error('This is NOT real data from Excel!');
        console.error('To get real seat data:');
        console.error('  1. Set USE_LOCAL_DATA = false in config.js');
        console.error('  2. Set API_URL to your Google Apps Script Web App URL');
        console.error('========================================');
        const mockData = {
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
        console.log('📊 Mock seat data:', mockData);
        return mockData;
    }

    try {
        let url;

        // Use local proxy server
        if (USE_LOCAL_PROXY) {
            url = `${LOCAL_PROXY_URL}?action=getSeatAvailability&concertId=${concertId}`;
            console.log('🔄 Fetching via LOCAL PROXY:', url);
        }
        // Use third-party CORS proxy
        else if (USE_CORS_PROXY) {
            url = CORS_PROXY + encodeURIComponent(`${API_URL}?action=getSeatAvailability&concertId=${concertId}`);
            console.log('🔄 Fetching via THIRD-PARTY CORS PROXY:', url);
        }
        // Direct API call
        else {
            url = `${API_URL}?action=getSeatAvailability&concertId=${concertId}`;
            console.log('🔄 Fetching DIRECTLY from Apps Script:', url);
        }

        const response = await fetch(url);
        console.log('📡 Seat availability response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Real seat availability from Excel:', result);
        return result;

    } catch (error) {
        console.error('❌ Error getting seat availability:', error);
        console.error('Stack:', error.stack);
        throw error;
    }
}
