// ========================================
// BOOKING FLOW JAVASCRIPT
// ========================================

// Booking state
const bookingState = {
    currentStep: 1,
    totalSteps: 6,
    generalSeats: 0,
    studentSeats: 0,
    chairs: 0,
    generalPrice: 1000,
    studentPrice: 500,
    totalAmount: 0,
    attendees: [],
    paymentScreenshot: null,
    transactionId: '',
    bookingId: '',
    concertData: null,
    seatAvailability: null  // Will be populated when concert data loads
};

// Initialize booking flow
function initBookingFlow() {
    // Get all booking trigger elements
    const reserveButtons = document.querySelectorAll('.booking-trigger');
    
    reserveButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            startBookingFlow();
        });
    });

    // Back button
    document.getElementById('navBackBtn').addEventListener('click', (e) => {
        e.preventDefault();
        exitBookingFlow();
    });

    // Step 1: Guidelines
    const agreeCheckbox = document.getElementById('agreeGuidelines');
    const step1Continue = document.getElementById('step1Continue');
    
    agreeCheckbox.addEventListener('change', () => {
        step1Continue.disabled = !agreeCheckbox.checked;
        updateStickyCTA();
    });

    step1Continue.addEventListener('click', () => goToStep(2));
    document.getElementById('step1Cancel').addEventListener('click', exitBookingFlow);

    // Step 2: Seat selection
    setupSeatSelectors();
    document.getElementById('step2Back').addEventListener('click', () => goToStep(1));
    document.getElementById('step2Continue').addEventListener('click', async () => {
        // Re-validate seat availability before proceeding
        // (Someone else might have booked seats while user was selecting)
        await revalidateAndProceedToStep3();
    });

    // Step 3: Attendee details
    document.getElementById('step3Back').addEventListener('click', () => goToStep(2));
    document.getElementById('step3Continue').addEventListener('click', () => {
        if (validateAttendeeDetails()) {
            populatePaymentStep();
            goToStep(4);
        }
    });

    // Step 4: Payment
    setupPaymentUpload();
    document.getElementById('copyUpiBtn').addEventListener('click', copyUpiId);
    document.getElementById('step4Back').addEventListener('click', () => goToStep(3));
    document.getElementById('step4Continue').addEventListener('click', () => {
        populateReviewStep();
        goToStep(5);
    });

    // Step 5: Review
    document.getElementById('step5Back').addEventListener('click', () => goToStep(4));
    document.getElementById('step5Confirm').addEventListener('click', confirmBooking);

    // Step 6: Confirmation
    document.getElementById('returnHome').addEventListener('click', exitBookingFlow);

    // Sticky CTA
    document.getElementById('stickyNextBtn').addEventListener('click', handleStickyNext);

    // Load concert data from JSON
    loadConcertData();
}

// Helper function to reinitialize booking triggers for dynamically added content
function reinitializeBookingTriggers() {
    const newTriggers = document.querySelectorAll('.booking-trigger');
    newTriggers.forEach(btn => {
        // Remove any existing listeners by cloning
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        // Add fresh listener
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            startBookingFlow();
        });
    });
}

async function loadConcertData() {
    // Use config.js to get the correct data source
    const dataURL = getDataSourceURL();

    console.log('🔄 Loading concert data from:', dataURL);

    try {
        const response = await fetch(dataURL);
        const data = await response.json();

        console.log('📦 Concert data received:', data?.length || 0, 'concerts');

        const upcomingConcert = data.find(concert =>
            concert.event_status &&
            concert.event_status.toLowerCase() === 'upcoming'
        );

        if (upcomingConcert) {
            bookingState.concertData = upcomingConcert;
            bookingState.generalPrice = upcomingConcert.ticket_price_general || 1000;
            bookingState.studentPrice = upcomingConcert.ticket_price_student || 500;

            console.log('🎵 Upcoming concert:', upcomingConcert.concert_id, upcomingConcert.title);

            // Fetch seat availability from config.js
            console.log('🔄 Fetching seat availability for:', upcomingConcert.concert_id);
            const availability = await getSeatAvailability(upcomingConcert.concert_id);
            bookingState.seatAvailability = availability;

            console.log('💺 Seat Availability loaded:');
            console.log('   General: ' + availability.general_seats_available + ' of ' + availability.general_seats_total);
            console.log('   Student: ' + availability.student_seats_available + ' of ' + availability.student_seats_total);
            console.log('   Chairs: ' + availability.chairs_available + ' of ' + availability.chairs_total);

            // Update prices in UI (seat selector displays)
            document.querySelectorAll('#generalPriceDisplay').forEach(el => {
                el.textContent = bookingState.generalPrice;
            });
            document.querySelectorAll('#studentPriceDisplay').forEach(el => {
                el.textContent = bookingState.studentPrice;
            });
        } else {
            console.warn('⚠️ No upcoming concert found in data');
        }
    } catch (error) {
        console.error('❌ Error loading concert data:', error);
        console.error('Stack:', error.stack);
        alert('Error loading concert information. Please refresh the page and check console.');
    }
}

// Debouncing flag to prevent double-clicks on booking triggers
let isBookingFlowStarting = false;

async function startBookingFlow() {
    console.log('========================================');
    console.log('🎫 STARTING BOOKING FLOW');
    console.log('========================================');

    // Prevent double-clicks / rapid multiple starts
    if (isBookingFlowStarting) {
        console.warn('⚠️ Booking flow already starting, ignoring duplicate request');
        return;
    }

    isBookingFlowStarting = true;

    try {
        // 1. Validate concert data is loaded
        if (!bookingState.concertData) {
            console.warn('⚠️ Concert data not yet loaded, waiting...');

            // Wait up to 5 seconds for data to load
            let attempts = 0;
            while (!bookingState.concertData && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
                attempts++;
            }

            if (!bookingState.concertData) {
                console.error('❌ Concert data failed to load after 5 seconds');
                alert('Unable to load concert information. Please refresh the page and try again.');
                isBookingFlowStarting = false;
                return;
            }

            console.log('✅ Concert data loaded after waiting');
        }

        console.log('📋 Concert:', bookingState.concertData.concert_id, bookingState.concertData.title);

        // 2. Fetch FRESH seat availability
        console.log('🔄 Fetching fresh seat availability...');
        console.log('   Previous availability:', bookingState.seatAvailability);

        const freshAvailability = await getSeatAvailability(bookingState.concertData.concert_id);

        console.log('   Fresh availability:', freshAvailability);

        // 3. Check if sold out
        const totalAvailable = freshAvailability.general_seats_available +
                               freshAvailability.student_seats_available;

        console.log('   Total seats available:', totalAvailable);

        if (totalAvailable === 0) {
            console.warn('⚠️ Concert is SOLD OUT');
            alert('Sorry, this baithak is completely sold out.\n\nPlease check back for future events.');
            isBookingFlowStarting = false;
            return;
        }

        // 4. Update state with fresh data
        bookingState.seatAvailability = freshAvailability;
        console.log('✅ Updated seat availability in booking state');

        // 5. Reset booking selections (fresh start)
        bookingState.generalSeats = 0;
        bookingState.studentSeats = 0;
        bookingState.chairs = 0;
        bookingState.totalAmount = 0;
        bookingState.attendees = [];
        bookingState.paymentScreenshot = null;
        bookingState.transactionId = '';
        console.log('✅ Reset booking selections');

        // 6. Show booking flow UI
        document.getElementById('hero').style.display = 'none';
        document.getElementById('mobileStickyCTA').style.display = 'none';

        const bookingFlow = document.getElementById('booking-flow');
        bookingFlow.classList.add('active');
        bookingFlow.style.display = 'block';

        document.getElementById('navBackBtn').classList.add('visible');

        if (window.innerWidth <= 968) {
            document.getElementById('bookingStickyCTA').classList.add('active');
        }

        // 7. Reset UI elements
        document.getElementById('agreeGuidelines').checked = false;
        updateSeatDisplay(); // This will also update button states based on new availability

        // 8. Go to Step 1
        goToStep(1);

        // 9. Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        console.log('========================================');
        console.log('✅ BOOKING FLOW STARTED SUCCESSFULLY');
        console.log('========================================');
        console.log('Fresh availability:');
        console.log('  General:', freshAvailability.general_seats_available, 'of', freshAvailability.general_seats_total);
        console.log('  Student:', freshAvailability.student_seats_available, 'of', freshAvailability.student_seats_total);
        console.log('  Chairs:', freshAvailability.chairs_available, 'of', freshAvailability.chairs_total);
        console.log('========================================');

    } catch (error) {
        console.error('========================================');
        console.error('❌ ERROR STARTING BOOKING FLOW');
        console.error('========================================');
        console.error('Error:', error);
        console.error('Stack:', error.stack);
        console.error('========================================');

        alert('Unable to start booking. Please check your internet connection and try again.\n\nIf the problem persists, please refresh the page.');
    } finally {
        // Always reset the debouncing flag
        isBookingFlowStarting = false;
    }
}

function exitBookingFlow() {
    // Show hero and main sticky CTA
    document.getElementById('hero').style.display = 'flex';
    if (window.innerWidth <= 968) {
        document.getElementById('mobileStickyCTA').style.display = 'block';
    }

    // Hide booking flow
    document.getElementById('booking-flow').classList.remove('active');
    document.getElementById('booking-flow').style.display = 'none';
    document.getElementById('navBackBtn').classList.remove('visible');
    document.getElementById('bookingStickyCTA').classList.remove('active');

    // Refresh seat availability in case booking was completed
    if (typeof fetchAndDisplaySeatAvailability === 'function' && bookingState.concertData?.concert_id) {
        fetchAndDisplaySeatAvailability(bookingState.concertData.concert_id);
    }

    // Reset booking state
    resetBookingState();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetBookingState() {
    bookingState.currentStep = 1;
    bookingState.generalSeats = 0;
    bookingState.studentSeats = 0;
    bookingState.chairs = 0;
    bookingState.totalAmount = 0;
    bookingState.attendees = [];
    bookingState.paymentScreenshot = null;
    bookingState.transactionId = '';
    
    // Reset UI
    document.getElementById('agreeGuidelines').checked = false;
    updateSeatDisplay();
}

function goToStep(stepNumber) {
    // Update state
    bookingState.currentStep = stepNumber;
    
    // Hide all steps
    document.querySelectorAll('.booking-step').forEach(step => {
        step.classList.remove('active');
    });
    
    // Show current step
    const currentStepEl = document.querySelector(`.booking-step[data-step="${stepNumber}"]`);
    if (currentStepEl) {
        setTimeout(() => {
            currentStepEl.classList.add('active');
        }, 50);
    }
    
    // Update progress dots
    document.querySelectorAll('.progress-dot').forEach((dot, index) => {
        const dotStep = index + 1;
        dot.classList.remove('active', 'completed');
        
        if (dotStep === stepNumber) {
            dot.classList.add('active');
        } else if (dotStep < stepNumber) {
            dot.classList.add('completed');
        }
    });
    
    // Update sticky CTA
    updateStickyCTA();
    
    // Scroll to top of booking section
    document.getElementById('booking-flow').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setupSeatSelectors() {
    // General seats
    document.getElementById('generalPlus').addEventListener('click', () => {
        // Use ?? instead of || to handle 0 correctly (0 is falsy but valid!)
        const maxGeneral = bookingState.seatAvailability?.general_seats_available ?? 10;

        if (bookingState.generalSeats < maxGeneral && bookingState.generalSeats < 10) {
            bookingState.generalSeats++;
            updateSeatDisplay();
        } else if (bookingState.generalSeats >= maxGeneral) {
            alert(`Only ${maxGeneral} general seat${maxGeneral !== 1 ? 's' : ''} available`);
        }
    });

    document.getElementById('generalMinus').addEventListener('click', () => {
        if (bookingState.generalSeats > 0) {
            bookingState.generalSeats--;
            updateSeatDisplay();
        }
    });

    // Student seats
    document.getElementById('studentPlus').addEventListener('click', () => {
        // Use ?? instead of || to handle 0 correctly (0 is falsy but valid!)
        const maxStudent = bookingState.seatAvailability?.student_seats_available ?? 10;

        if (bookingState.studentSeats < maxStudent && bookingState.studentSeats < 10) {
            bookingState.studentSeats++;
            updateSeatDisplay();
        } else if (bookingState.studentSeats >= maxStudent) {
            alert(`Only ${maxStudent} student seat${maxStudent !== 1 ? 's' : ''} available`);
        }
    });

    document.getElementById('studentMinus').addEventListener('click', () => {
        if (bookingState.studentSeats > 0) {
            bookingState.studentSeats--;
            updateSeatDisplay();
        }
    });

    // Chairs
    document.getElementById('chairPlus').addEventListener('click', () => {
        const totalSeats = bookingState.generalSeats + bookingState.studentSeats;
        // Use ?? instead of || to handle 0 correctly (0 is falsy but valid!)
        const maxChairs = bookingState.seatAvailability?.chairs_available ?? 5;

        if (bookingState.chairs < totalSeats && bookingState.chairs < maxChairs && bookingState.chairs < 5) {
            bookingState.chairs++;
            updateSeatDisplay();
        } else if (bookingState.chairs >= maxChairs) {
            alert(`Only ${maxChairs} chair${maxChairs !== 1 ? 's' : ''} available`);
        } else if (bookingState.chairs >= totalSeats) {
            alert(`You can't request more chairs than seats (${totalSeats} seats selected)`);
        }
    });

    document.getElementById('chairMinus').addEventListener('click', () => {
        if (bookingState.chairs > 0) {
            bookingState.chairs--;
            updateSeatDisplay();
        }
    });
}

function updateSeatDisplay() {
    // Update counts
    document.getElementById('generalCount').textContent = bookingState.generalSeats;
    document.getElementById('studentCount').textContent = bookingState.studentSeats;
    document.getElementById('chairCount').textContent = bookingState.chairs;

    // Get availability (use ?? to handle 0 correctly)
    const generalAvailable = bookingState.seatAvailability?.general_seats_available ?? 10;
    const studentAvailable = bookingState.seatAvailability?.student_seats_available ?? 10;
    const chairsAvailable = bookingState.seatAvailability?.chairs_available ?? 10;

    // Update minus button states
    document.getElementById('generalMinus').disabled = bookingState.generalSeats === 0;
    document.getElementById('studentMinus').disabled = bookingState.studentSeats === 0;
    document.getElementById('chairMinus').disabled = bookingState.chairs === 0;

    // Update plus button states - disable if 0 available OR already at max
    const generalPlus = document.getElementById('generalPlus');
    const studentPlus = document.getElementById('studentPlus');
    const chairPlus = document.getElementById('chairPlus');

    const totalSeats = bookingState.generalSeats + bookingState.studentSeats;

    // Disable general + if 0 available or already selected all available
    generalPlus.disabled = (generalAvailable === 0) ||
                           (bookingState.generalSeats >= generalAvailable) ||
                           (bookingState.generalSeats >= 10);

    // Disable student + if 0 available or already selected all available
    studentPlus.disabled = (studentAvailable === 0) ||
                           (bookingState.studentSeats >= studentAvailable) ||
                           (bookingState.studentSeats >= 10);

    // Disable chair + if 0 available or already selected all available or more chairs than seats
    chairPlus.disabled = (chairsAvailable === 0) ||
                         (bookingState.chairs >= chairsAvailable) ||
                         (bookingState.chairs >= totalSeats) ||
                         (bookingState.chairs >= 5);

    // Add visual disabled state to selectors
    const generalSelector = document.getElementById('generalSeatSelector');
    const studentSelector = document.getElementById('studentSeatSelector');
    const chairSelector = document.getElementById('chairSeatSelector');

    if (generalSelector) {
        generalSelector.classList.toggle('unavailable', generalAvailable === 0);
        generalSelector.classList.toggle('has-selection', bookingState.generalSeats > 0);

        // Get controls element
        const generalControls = generalSelector.querySelector('.seat-controls-minimal');

        // Add/remove unavailability message and hide/show controls
        let generalMsg = generalSelector.querySelector('.unavailable-message');
        if (generalAvailable === 0) {
            // Hide controls when sold out
            if (generalControls) {
                generalControls.style.display = 'none';
            }
            // Add sold out message
            if (!generalMsg) {
                generalMsg = document.createElement('div');
                generalMsg.className = 'unavailable-message';
                generalMsg.textContent = 'Sold out';
                generalSelector.appendChild(generalMsg);
            }
        } else {
            // Show controls when available
            if (generalControls) {
                generalControls.style.display = 'flex';
            }
            // Remove sold out message
            if (generalMsg) {
                generalMsg.remove();
            }
        }
    }
    if (studentSelector) {
        studentSelector.classList.toggle('unavailable', studentAvailable === 0);
        studentSelector.classList.toggle('has-selection', bookingState.studentSeats > 0);

        // Get controls element
        const studentControls = studentSelector.querySelector('.seat-controls-minimal');

        // Add/remove unavailability message and hide/show controls
        let studentMsg = studentSelector.querySelector('.unavailable-message');
        if (studentAvailable === 0) {
            // Hide controls when sold out
            if (studentControls) {
                studentControls.style.display = 'none';
            }
            // Add unavailable message
            if (!studentMsg) {
                studentMsg = document.createElement('div');
                studentMsg.className = 'unavailable-message';
                studentMsg.textContent = 'Not available';
                studentSelector.appendChild(studentMsg);
            }
        } else {
            // Show controls when available
            if (studentControls) {
                studentControls.style.display = 'flex';
            }
            // Remove unavailable message
            if (studentMsg) {
                studentMsg.remove();
            }
        }
    }
    if (chairSelector) {
        chairSelector.classList.toggle('unavailable', chairsAvailable === 0);
        chairSelector.classList.toggle('has-selection', bookingState.chairs > 0);

        // Get controls element
        const chairControls = chairSelector.querySelector('.seat-controls-minimal');

        // Add/remove unavailability message and hide/show controls
        let chairMsg = chairSelector.querySelector('.unavailable-message');
        if (chairsAvailable === 0) {
            // Hide controls when unavailable
            if (chairControls) {
                chairControls.style.display = 'none';
            }
            // Add unavailable message
            if (!chairMsg) {
                chairMsg = document.createElement('div');
                chairMsg.className = 'unavailable-message';
                chairMsg.textContent = 'None available';
                chairSelector.appendChild(chairMsg);
            }
        } else {
            // Show controls when available
            if (chairControls) {
                chairControls.style.display = 'flex';
            }
            // Remove unavailable message
            if (chairMsg) {
                chairMsg.remove();
            }
        }
    }

    // Calculate total
    bookingState.totalAmount =
        (bookingState.generalSeats * bookingState.generalPrice) +
        (bookingState.studentSeats * bookingState.studentPrice);

    document.getElementById('totalAmount').textContent = bookingState.totalAmount;
    document.getElementById('totalSeats').textContent = totalSeats;

    // Enable/disable continue button
    document.getElementById('step2Continue').disabled = totalSeats === 0;

    updateStickyCTA();
}

/**
 * Re-validate seat availability before proceeding to Step 3
 * Handles scenario where seats get booked by someone else while user is on Step 2
 */
async function revalidateAndProceedToStep3() {
    console.log('🔄 Re-validating seat availability before proceeding...');

    try {
        // Fetch latest seat availability from backend
        const latestAvailability = await getSeatAvailability(bookingState.concertData.concert_id);

        console.log('📊 Latest availability from server:', latestAvailability);

        // Check if user's selections are still valid
        const generalRequested = bookingState.generalSeats;
        const studentRequested = bookingState.studentSeats;
        const chairsRequested = bookingState.chairs;

        const generalAvailable = latestAvailability.general_seats_available;
        const studentAvailable = latestAvailability.student_seats_available;
        const chairsAvailable = latestAvailability.chairs_available;

        let errors = [];

        if (generalRequested > generalAvailable) {
            errors.push(`Only ${generalAvailable} general seat${generalAvailable !== 1 ? 's' : ''} available (you selected ${generalRequested})`);
        }

        if (studentRequested > studentAvailable) {
            errors.push(`Only ${studentAvailable} student seat${studentAvailable !== 1 ? 's' : ''} available (you selected ${studentRequested})`);
        }

        if (chairsRequested > chairsAvailable) {
            errors.push(`Only ${chairsAvailable} chair${chairsAvailable !== 1 ? 's' : ''} available (you selected ${chairsRequested})`);
        }

        if (errors.length > 0) {
            // Availability changed - show error and reset selections
            console.error('❌ Seat availability changed:', errors);

            alert(`⚠️ Seat Availability Changed!\n\n${errors.join('\n')}\n\nSomeone else booked seats while you were selecting. Your selections have been reset.\n\nPlease select again with the updated availability.`);

            // Update stored availability
            bookingState.seatAvailability = latestAvailability;

            // Reset selections to 0
            bookingState.generalSeats = 0;
            bookingState.studentSeats = 0;
            bookingState.chairs = 0;
            updateSeatDisplay();

            // Stay on Step 2
            return;
        }

        // Validation passed - update availability and proceed
        console.log('✅ Seat availability validated - proceeding to Step 3');
        bookingState.seatAvailability = latestAvailability;

        generateAttendeeForms();
        goToStep(3);

    } catch (error) {
        console.error('❌ Error validating seat availability:', error);
        alert('Error checking seat availability. Please try again.');
    }
}

function generateAttendeeForms() {
    const container = document.getElementById('attendeeFormsContainer');
    container.innerHTML = '';

    bookingState.attendees = [];

    const totalSeats = bookingState.generalSeats + bookingState.studentSeats;

    // Main Attendee Card (full form with student and chair checkboxes)
    const mainCard = document.createElement('div');
    mainCard.className = 'main-attendee-card';
    mainCard.innerHTML = `
        <div class="header">Main Attendee (Primary Contact)</div>
        <div class="field-grid">
            <div class="field">
                <label>Full Name *</label>
                <input type="text" class="attendee-name" data-index="0" placeholder="Enter your full name" required>
            </div>
            <div class="field">
                <label>WhatsApp Number *</label>
                <input type="tel" class="attendee-whatsapp" data-index="0" placeholder="+91 XXXXX XXXXX" required>
            </div>
            <div class="field">
                <label>Email (Optional)</label>
                <input type="email" class="attendee-email" data-index="0" placeholder="your@email.com">
            </div>
        </div>
        ${(bookingState.studentSeats > 0 || bookingState.seatAvailability?.student_seats_available > 0 ||
           bookingState.chairs > 0 || bookingState.seatAvailability?.chairs_available > 0) ? `
            <div class="field-checkboxes">
                ${(bookingState.studentSeats > 0 || bookingState.seatAvailability?.student_seats_available > 0) ? `
                    <label class="checkbox-label">
                        <input type="checkbox" class="attendee-student" data-index="0">
                        <span>Student Ticket</span>
                    </label>
                ` : ''}
                ${(bookingState.chairs > 0 || bookingState.seatAvailability?.chairs_available > 0) ? `
                    <label class="checkbox-label">
                        <input type="checkbox" class="attendee-chair" data-index="0">
                        <span>Need a Chair</span>
                    </label>
                ` : ''}
            </div>
        ` : ''}
    `;

    bookingState.attendees.push({
        index: 0,
        type: 'General',
        isMain: true,
        name: '',
        whatsapp: '',
        email: '',
        needsChair: false
    });

    container.appendChild(mainCard);

    // Additional Attendees (with student and chair checkboxes)
    if (totalSeats > 1) {
        const additionalCard = document.createElement('div');
        additionalCard.className = 'additional-attendees-card';

        const headerText = totalSeats === 2 ? '1 Seat' : `${totalSeats - 1} Seats`;
        additionalCard.innerHTML = `
            <div class="header">Additional Attendees (${headerText})</div>
        `;

        for (let i = 1; i < totalSeats; i++) {
            const row = createAttendeeRow(i);
            additionalCard.appendChild(row);
        }

        container.appendChild(additionalCard);
    }

    // Add event listeners for checkboxes and name inputs
    attachCheckboxListeners();
    attachNameCapitalization();
}

function createAttendeeRow(index) {
    const row = document.createElement('div');
    row.className = 'attendee-row';

    row.innerHTML = `
        <div class="attendee-row-header">
            <div class="person-label">Attendee ${index + 1}</div>
        </div>
        <div class="attendee-row-field">
            <input type="text" class="attendee-name" data-index="${index}" placeholder="Enter full name" required>
        </div>
        ${(bookingState.studentSeats > 0 || bookingState.seatAvailability?.student_seats_available > 0 ||
           bookingState.chairs > 0 || bookingState.seatAvailability?.chairs_available > 0) ? `
            <div class="attendee-row-checkboxes">
                ${(bookingState.studentSeats > 0 || bookingState.seatAvailability?.student_seats_available > 0) ? `
                    <label class="checkbox-label">
                        <input type="checkbox" class="attendee-student" data-index="${index}">
                        <span>Student Ticket</span>
                    </label>
                ` : ''}
                ${(bookingState.chairs > 0 || bookingState.seatAvailability?.chairs_available > 0) ? `
                    <label class="checkbox-label">
                        <input type="checkbox" class="attendee-chair" data-index="${index}">
                        <span>Need a Chair</span>
                    </label>
                ` : ''}
            </div>
        ` : ''}
    `;

    // Store reference
    bookingState.attendees.push({
        index,
        type: 'General',
        isMain: false,
        name: '',
        whatsapp: '',
        email: '',
        needsChair: false
    });

    return row;
}

function attachCheckboxListeners() {
    // Student checkboxes
    const studentCheckboxes = document.querySelectorAll('.attendee-student');
    studentCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            validateStudentSelection(this);
            updateCheckboxStates();  // Update disabled states after each change
        });
    });

    // Chair checkboxes
    const chairCheckboxes = document.querySelectorAll('.attendee-chair');
    chairCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            validateChairSelection(this);
            updateCheckboxStates();  // Update disabled states after each change
        });
    });

    // Initial state update
    updateCheckboxStates();
}

/**
 * Capitalizes first letter of each word in a name
 * Example: "meeta gangrade" -> "Meeta Gangrade"
 */
function capitalizeWords(str) {
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Attach name capitalization to all name inputs
 */
function attachNameCapitalization() {
    const nameInputs = document.querySelectorAll('.attendee-name');
    nameInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value.trim()) {
                this.value = capitalizeWords(this.value.trim());
            }
        });
    });
}

/**
 * Update checkbox disabled states based on current selections
 * Disables checkboxes when limits are reached
 */
function updateCheckboxStates() {
    const selectedStudents = document.querySelectorAll('.attendee-student:checked').length;
    const selectedChairs = document.querySelectorAll('.attendee-chair:checked').length;

    // Disable student checkboxes if limit reached
    const studentCheckboxes = document.querySelectorAll('.attendee-student');
    studentCheckboxes.forEach(checkbox => {
        if (!checkbox.checked && selectedStudents >= bookingState.studentSeats) {
            checkbox.disabled = true;
            checkbox.closest('.checkbox-label')?.classList.add('disabled');
        } else {
            checkbox.disabled = false;
            checkbox.closest('.checkbox-label')?.classList.remove('disabled');
        }
    });

    // Disable chair checkboxes if limit reached
    const chairCheckboxes = document.querySelectorAll('.attendee-chair');
    chairCheckboxes.forEach(checkbox => {
        if (!checkbox.checked && selectedChairs >= bookingState.chairs) {
            checkbox.disabled = true;
            checkbox.closest('.checkbox-label')?.classList.add('disabled');
        } else {
            checkbox.disabled = false;
            checkbox.closest('.checkbox-label')?.classList.remove('disabled');
        }
    });
}

function validateStudentSelection(checkbox) {
    const index = parseInt(checkbox.dataset.index);
    const isChecked = checkbox.checked;

    // Count currently selected students
    const selectedStudents = document.querySelectorAll('.attendee-student:checked').length;

    if (isChecked && selectedStudents > bookingState.studentSeats) {
        // Exceeded limit - uncheck
        checkbox.checked = false;
        alert(`You can only select ${bookingState.studentSeats} student ticket${bookingState.studentSeats > 1 ? 's' : ''}. ${bookingState.studentSeats} already selected.`);
        return;
    }

    // Update attendee type
    bookingState.attendees[index].type = isChecked ? 'Student' : 'General';
}

function validateChairSelection(checkbox) {
    const index = parseInt(checkbox.dataset.index);
    const isChecked = checkbox.checked;

    // Count currently selected chairs
    const selectedChairs = document.querySelectorAll('.attendee-chair:checked').length;

    if (isChecked && selectedChairs > bookingState.chairs) {
        // Exceeded limit - uncheck
        checkbox.checked = false;
        alert(`You can only select ${bookingState.chairs} chair${bookingState.chairs > 1 ? 's' : ''}. ${bookingState.chairs} already selected.`);
        return;
    }

    // Update attendee needsChair
    bookingState.attendees[index].needsChair = isChecked;
}

function validateAttendeeDetails() {
    let isValid = true;

    console.log('========================================');
    console.log('🔍 VALIDATING ATTENDEE DETAILS');
    console.log('========================================');

    // Get all name inputs
    const nameInputs = document.querySelectorAll('.attendee-name');
    nameInputs.forEach(input => {
        const index = parseInt(input.dataset.index);
        let name = input.value.trim();

        if (!name) {
            input.style.borderColor = 'var(--orange)';
            isValid = false;
        } else {
            // Capitalize name before saving
            name = capitalizeWords(name);
            input.value = name;  // Update input to show capitalized version
            input.style.borderColor = '';
            bookingState.attendees[index].name = name;
        }
    });

    // Get main attendee WhatsApp with Indian number validation
    const whatsappInput = document.querySelector('.attendee-whatsapp');
    if (whatsappInput) {
        let whatsapp = whatsappInput.value.trim();

        // Remove spaces and dashes
        whatsapp = whatsapp.replace(/[\s-]/g, '');

        // If doesn't start with +91, add it
        if (!whatsapp.startsWith('+91')) {
            if (whatsapp.startsWith('91')) {
                whatsapp = '+' + whatsapp;
            } else if (whatsapp.length === 10) {
                whatsapp = '+91' + whatsapp;
            }
        }

        // Validate: Must be +91 followed by exactly 10 digits
        const indianMobileRegex = /^\+91[6-9]\d{9}$/;

        if (!indianMobileRegex.test(whatsapp)) {
            whatsappInput.style.borderColor = 'var(--orange)';
            alert('Please enter a valid Indian mobile number (10 digits starting with 6-9)');
            isValid = false;
        } else {
            whatsappInput.style.borderColor = '';
            bookingState.attendees[0].whatsapp = whatsapp;
        }
    }

    // Get main attendee email (optional)
    const emailInput = document.querySelector('.attendee-email');
    if (emailInput) {
        bookingState.attendees[0].email = emailInput.value.trim();
    }

    // ========================================
    // CRITICAL VALIDATION: Chair and Student Allocation
    // ========================================

    // Count actual selections from checkboxes
    const actualStudentSeats = bookingState.attendees.filter(a => a.type === 'Student').length;
    const actualChairsAllocated = bookingState.attendees.filter(a => a.needsChair).length;

    console.log('📊 Allocation Check:');
    console.log(`   Selected in Step 2: ${bookingState.studentSeats} student, ${bookingState.chairs} chairs`);
    console.log(`   Allocated in Step 3: ${actualStudentSeats} student, ${actualChairsAllocated} chairs`);

    // Validate student seat allocation
    if (bookingState.studentSeats > 0 && actualStudentSeats !== bookingState.studentSeats) {
        console.error(`❌ Student seat mismatch: Expected ${bookingState.studentSeats}, got ${actualStudentSeats}`);

        const message = actualStudentSeats < bookingState.studentSeats
            ? `You selected ${bookingState.studentSeats} student seat${bookingState.studentSeats > 1 ? 's' : ''} in Step 2, but only marked ${actualStudentSeats} attendee${actualStudentSeats !== 1 ? 's' : ''} as student.\n\nPlease check the "Student Ticket" box for exactly ${bookingState.studentSeats} attendee${bookingState.studentSeats > 1 ? 's' : ''}.`
            : `You marked ${actualStudentSeats} attendee${actualStudentSeats > 1 ? 's' : ''} as student, but only selected ${bookingState.studentSeats} student seat${bookingState.studentSeats > 1 ? 's' : ''} in Step 2.\n\nPlease uncheck some "Student Ticket" boxes or go back to Step 2 to select more student seats.`;

        alert(message);
        isValid = false;
    }

    // Validate chair allocation
    if (bookingState.chairs > 0 && actualChairsAllocated !== bookingState.chairs) {
        console.error(`❌ Chair allocation mismatch: Expected ${bookingState.chairs}, got ${actualChairsAllocated}`);

        const message = actualChairsAllocated < bookingState.chairs
            ? `You selected ${bookingState.chairs} chair${bookingState.chairs > 1 ? 's' : ''} in Step 2, but only allocated ${actualChairsAllocated} chair${actualChairsAllocated !== 1 ? 's' : ''}.\n\nPlease check the "Need a Chair" box for exactly ${bookingState.chairs} attendee${bookingState.chairs > 1 ? 's' : ''}.`
            : `You allocated ${actualChairsAllocated} chair${actualChairsAllocated > 1 ? 's' : ''}, but only selected ${bookingState.chairs} chair${bookingState.chairs > 1 ? 's' : ''} in Step 2.\n\nPlease uncheck some "Need a Chair" boxes or go back to Step 2 to select more chairs.`;

        alert(message);
        isValid = false;
    }

    // Validate: Cannot allocate more student seats than total seats
    const totalSeats = bookingState.generalSeats + bookingState.studentSeats;
    if (actualStudentSeats > totalSeats) {
        console.error(`❌ More student tickets than total seats: ${actualStudentSeats} > ${totalSeats}`);
        alert(`You cannot have more student tickets (${actualStudentSeats}) than total seats (${totalSeats}).\n\nPlease uncheck some "Student Ticket" boxes.`);
        isValid = false;
    }

    // Validate: Cannot allocate more chairs than attendees
    if (actualChairsAllocated > totalSeats) {
        console.error(`❌ More chairs than attendees: ${actualChairsAllocated} > ${totalSeats}`);
        alert(`You cannot allocate more chairs (${actualChairsAllocated}) than total attendees (${totalSeats}).\n\nPlease uncheck some "Need a Chair" boxes.`);
        isValid = false;
    }

    if (!isValid) {
        console.log('❌ Validation failed');
        if (nameInputs.length > 0 && !nameInputs[0].value.trim()) {
            alert('Please fill in all required fields');
        }
    } else {
        console.log('✅ All validations passed');
    }

    console.log('========================================');

    return isValid;
}

function populatePaymentStep() {
    document.getElementById('paymentAmount').textContent = bookingState.totalAmount;

    // Generate transaction ID if not already generated
    if (!bookingState.transactionId) {
        bookingState.transactionId = 'LRB' + Math.floor(1000 + Math.random() * 9000);
    }

    // Display transaction ID
    document.getElementById('displayTransactionId').textContent = bookingState.transactionId;

    // Setup copy transaction ID button
    document.getElementById('copyTransactionIdBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        const transId = bookingState.transactionId;
        navigator.clipboard.writeText(transId).then(() => {
            const btn = e.target;
            const originalText = btn.textContent;
            btn.textContent = '✓ Copied!';
            btn.style.background = 'var(--gold-bright)';

            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 2000);
        });
    });

    // Payment screenshot is now optional - enable continue button by default
    document.getElementById('step4Continue').disabled = false;
    updateStickyCTA();
}

function setupPaymentUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('paymentScreenshot');
    const previewContainer = document.getElementById('previewContainer');
    
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.background = 'rgba(255, 136, 0, 0.1)';
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.background = '';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.background = '';
        
        if (e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });
}

function handleFileUpload(file) {
    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    
    if (!validTypes.includes(file.type)) {
        alert('Please upload a JPG, PNG, or PDF file');
        return;
    }
    
    if (file.size > maxSize) {
        alert('File size must be less than 5MB');
        return;
    }
    
    // Store file
    bookingState.paymentScreenshot = file;
    
    // Show preview
    const uploadArea = document.getElementById('uploadArea');
    const previewContainer = document.getElementById('previewContainer');
    
    uploadArea.classList.add('has-file');
    uploadArea.querySelector('.upload-text').textContent = `✓ ${file.name}`;
    uploadArea.querySelector('.upload-hint').textContent = 'Click to change file';
    
    // Show image preview if it's an image
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewContainer.innerHTML = `<img src="${e.target.result}" class="preview-image" alt="Payment screenshot">`;
        };
        reader.readAsDataURL(file);
    }
    
    // Enable continue button
    document.getElementById('step4Continue').disabled = false;
    updateStickyCTA();
}

function copyUpiId() {
    const upiId = document.getElementById('upiId').textContent;
    navigator.clipboard.writeText(upiId).then(() => {
        const btn = document.getElementById('copyUpiBtn');
        const originalText = btn.textContent;
        btn.textContent = '✓ Copied!';
        btn.style.background = 'var(--gold-bright)';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 2000);
    });
}

function populateReviewStep() {
    const reviewSummary = document.getElementById('reviewSummary');
    const mainAttendee = bookingState.attendees.find(a => a.isMain);

    // Get only Primary artists for display
    const primaryArtists = bookingState.concertData?.artists?.filter(a => a.category === 'Primary') || [];
    const artistNames = primaryArtists.length > 0
        ? primaryArtists.map(a => a.name).join(', ')
        : 'Various Artists';

    // Use formatDate function for full date with day of week
    const concertDate = bookingState.concertData?.date
        ? formatDate(bookingState.concertData.date)
        : 'TBA';
    
    reviewSummary.innerHTML = `
        <div class="summary-row">
            <span class="summary-label">Baithak</span>
            <span class="summary-value">${artistNames}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Date</span>
            <span class="summary-value">${concertDate}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">General Seats</span>
            <span class="summary-value">${bookingState.generalSeats}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Student Seats</span>
            <span class="summary-value">${bookingState.studentSeats}</span>
        </div>
        ${bookingState.chairs > 0 ? `
        <div class="summary-row">
            <span class="summary-label">Chairs Requested</span>
            <span class="summary-value">${bookingState.chairs}</span>
        </div>
        ` : ''}
        <div class="summary-row">
            <span class="summary-label">Total Amount</span>
            <span class="summary-value">₹${bookingState.totalAmount}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Main Contact</span>
            <span class="summary-value">${mainAttendee?.name || 'N/A'}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">WhatsApp</span>
            <span class="summary-value">${mainAttendee?.whatsapp || 'N/A'}</span>
        </div>
        ${mainAttendee?.email ? `
        <div class="summary-row">
            <span class="summary-label">Email</span>
            <span class="summary-value">${mainAttendee.email}</span>
        </div>
        ` : ''}
        <div class="summary-row">
            <span class="summary-label">Attendees</span>
            <span class="summary-value">${bookingState.attendees.map(a => a.name).join(', ')}</span>
        </div>
    `;
}

async function confirmBooking() {
    // Use the transaction ID that was already generated in step 4
    bookingState.bookingId = bookingState.transactionId; // Use same ID for consistency

    // Convert payment screenshot to base64 if present
    let paymentScreenshotBase64 = null;
    if (bookingState.paymentScreenshot) {
        try {
            paymentScreenshotBase64 = await fileToBase64(bookingState.paymentScreenshot);
        } catch (error) {
            console.error('Error converting screenshot to base64:', error);
        }
    }

    // Count ACTUAL student and general seats from attendee selections (not from Step 2)
    const actualGeneralSeats = bookingState.attendees.filter(a => a.type === 'General').length;
    const actualStudentSeats = bookingState.attendees.filter(a => a.type === 'Student').length;
    const actualChairsRequested = bookingState.attendees.filter(a => a.needsChair).length;

    console.log('📊 Seat Breakdown:');
    console.log(`   From Step 2: ${bookingState.generalSeats} general, ${bookingState.studentSeats} student`);
    console.log(`   Actual selections: ${actualGeneralSeats} general, ${actualStudentSeats} student, ${actualChairsRequested} chairs`);

    // Prepare booking data
    const bookingData = {
        bookingId: bookingState.bookingId,
        transactionId: bookingState.transactionId,
        timestamp: new Date().toISOString(),
        concert: bookingState.concertData,
        seats: {
            general: actualGeneralSeats,      // Use ACTUAL count from checkboxes
            student: actualStudentSeats,      // Use ACTUAL count from checkboxes
            chairs: actualChairsRequested     // Use ACTUAL count from checkboxes
        },
        totalAmount: bookingState.totalAmount,
        attendees: bookingState.attendees.map(a => ({
            name: a.name,
            whatsapp: a.whatsapp || '',
            email: a.email || '',
            seatType: a.type,
            needsChair: a.needsChair,
            isMain: a.isMain
        })),
        paymentScreenshot: paymentScreenshotBase64
    };

    console.log('📤 Submitting Booking Data:', bookingData);

    try {
        // Submit to backend (uses config.js function)
        const result = await submitBookingToBackend(bookingData);

        console.log('📡 Backend response:', result);

        // CHECK if booking was successful
        if (result.success) {
            console.log('✅ Booking confirmed successfully!');

            // Refresh seat availability on hero section (from main.js)
            if (typeof fetchAndDisplaySeatAvailability === 'function' && bookingState.concertData?.concert_id) {
                console.log('🔄 Refreshing seat availability...');
                fetchAndDisplaySeatAvailability(bookingState.concertData.concert_id);
            }

            // Show confirmation
            populateConfirmationStep();
            goToStep(6);

        } else {
            // Booking failed due to validation error
            console.error('❌ Booking rejected by server:', result.error);

            const errorMessage = result.error || 'Unknown error occurred';

            // Show detailed error message
            alert(`❌ Booking Failed!\n\n${errorMessage}\n\nThis usually means:\n- Someone else booked seats while you were filling the form\n- Seat availability changed\n\nPlease go back to Step 2 and select fewer seats, then try again.`);

            // Refresh seat availability to get latest data
            if (typeof fetchAndDisplaySeatAvailability === 'function' && bookingState.concertData?.concert_id) {
                const latestAvailability = await getSeatAvailability(bookingState.concertData.concert_id);
                bookingState.seatAvailability = latestAvailability;
                console.log('🔄 Updated seat availability:', latestAvailability);
            }

            // Go back to Step 2 so user can adjust selections
            goToStep(2);
        }

    } catch (error) {
        console.error('❌ Error submitting booking:', error);
        alert('There was a network error submitting your booking.\n\nPlease check your internet connection and try again.\n\nIf the problem persists, contact support.');

        // Go back to Step 2
        goToStep(2);
    }
}

/**
 * Helper function to convert file to base64
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

function populateConfirmationStep() {
    document.getElementById('confirmationBookingId').textContent = bookingState.bookingId;

    const confirmationSummary = document.getElementById('confirmationSummary');
    const mainAttendee = bookingState.attendees.find(a => a.isMain);

    // Get only Primary artists for display
    const primaryArtists = bookingState.concertData?.artists?.filter(a => a.category === 'Primary') || [];
    const artistNames = primaryArtists.length > 0
        ? primaryArtists.map(a => a.name).join(', ')
        : 'Various Artists';

    // Use formatDate function for full date with day of week
    const concertDate = bookingState.concertData?.date
        ? formatDate(bookingState.concertData.date)
        : 'TBA';
    
    confirmationSummary.innerHTML = `
        <div class="summary-row">
            <span class="summary-label">Baithak</span>
            <span class="summary-value">${artistNames}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Date</span>
            <span class="summary-value">${concertDate}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Seats</span>
            <span class="summary-value">${bookingState.generalSeats} General, ${bookingState.studentSeats} Student</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Amount Paid</span>
            <span class="summary-value">₹${bookingState.totalAmount}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Main Contact</span>
            <span class="summary-value">${mainAttendee?.name || 'N/A'}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">WhatsApp</span>
            <span class="summary-value">${mainAttendee?.whatsapp || 'N/A'}</span>
        </div>
    `;
}

function updateStickyCTA() {
    const stickyStepInfo = document.getElementById('stickyStepInfo');
    const stickyTotalAmount = document.getElementById('stickyTotalAmount');
    const stickyNextBtn = document.getElementById('stickyNextBtn');
    
    stickyStepInfo.textContent = `Step ${bookingState.currentStep} of ${bookingState.totalSteps}`;
    stickyTotalAmount.textContent = `Total: ₹${bookingState.totalAmount}`;
    
    // Update button state based on current step
    let canProceed = false;
    let buttonText = 'Continue';
    
    switch (bookingState.currentStep) {
        case 1:
            canProceed = document.getElementById('agreeGuidelines').checked;
            break;
        case 2:
            canProceed = (bookingState.generalSeats + bookingState.studentSeats) > 0;
            break;
        case 3:
            canProceed = true;
            buttonText = 'Continue to Payment';
            break;
        case 4:
            canProceed = true; // Payment screenshot is optional
            break;
        case 5:
            canProceed = true;
            buttonText = 'Confirm Booking';
            break;
        case 6:
            canProceed = false;
            stickyNextBtn.style.display = 'none';
            return;
    }
    
    stickyNextBtn.disabled = !canProceed;
    stickyNextBtn.textContent = buttonText;
    stickyNextBtn.style.display = 'flex';
}

function handleStickyNext() {
    const currentStep = bookingState.currentStep;
    
    switch (currentStep) {
        case 1:
            document.getElementById('step1Continue').click();
            break;
        case 2:
            document.getElementById('step2Continue').click();
            break;
        case 3:
            document.getElementById('step3Continue').click();
            break;
        case 4:
            document.getElementById('step4Continue').click();
            break;
        case 5:
            document.getElementById('step5Confirm').click();
            break;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBookingFlow);
} else {
    initBookingFlow();
}
