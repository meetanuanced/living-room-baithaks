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
    concertData: null
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
    document.getElementById('step2Continue').addEventListener('click', () => {
        generateAttendeeForms();
        goToStep(3);
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

function loadConcertData() {
    // Use config.js to get the correct data source
    const dataURL = getDataSourceURL();

    fetch(dataURL)
        .then(response => response.json())
        .then(data => {
            const upcomingConcert = data.find(concert =>
                concert.event_status &&
                concert.event_status.toLowerCase() === 'upcoming'
            );

            if (upcomingConcert) {
                bookingState.concertData = upcomingConcert;
                bookingState.generalPrice = upcomingConcert.ticket_price_general || 1000;
                bookingState.studentPrice = upcomingConcert.ticket_price_student || 500;

                // Update prices in UI (seat selector displays)
                document.querySelectorAll('#generalPriceDisplay').forEach(el => {
                    el.textContent = bookingState.generalPrice;
                });
                document.querySelectorAll('#studentPriceDisplay').forEach(el => {
                    el.textContent = bookingState.studentPrice;
                });
            }
        })
        .catch(error => console.error('Error loading concert data:', error));
}

function startBookingFlow() {
    // Hide hero and main sticky CTA
    document.getElementById('hero').style.display = 'none';
    document.getElementById('mobileStickyCTA').style.display = 'none';
    
    // Show booking flow and its sticky CTA
    const bookingFlow = document.getElementById('booking-flow');
    bookingFlow.classList.add('active');
    bookingFlow.style.display = 'block';
    
    document.getElementById('navBackBtn').classList.add('visible');
    
    // Show booking sticky on mobile
    if (window.innerWidth <= 968) {
        document.getElementById('bookingStickyCTA').classList.add('active');
    }
    
    // Reset to step 1
    goToStep(1);
    
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        if (bookingState.generalSeats < 10) {
            bookingState.generalSeats++;
            updateSeatDisplay();
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
        if (bookingState.studentSeats < 10) {
            bookingState.studentSeats++;
            updateSeatDisplay();
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
        if (bookingState.chairs < totalSeats && bookingState.chairs < 5) {
            bookingState.chairs++;
            updateSeatDisplay();
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
    
    // Update button states
    document.getElementById('generalMinus').disabled = bookingState.generalSeats === 0;
    document.getElementById('studentMinus').disabled = bookingState.studentSeats === 0;
    document.getElementById('chairMinus').disabled = bookingState.chairs === 0;
    
    // Calculate total
    bookingState.totalAmount = 
        (bookingState.generalSeats * bookingState.generalPrice) + 
        (bookingState.studentSeats * bookingState.studentPrice);
    
    const totalSeats = bookingState.generalSeats + bookingState.studentSeats;
    
    document.getElementById('totalAmount').textContent = bookingState.totalAmount;
    document.getElementById('totalSeats').textContent = totalSeats;
    
    // Enable/disable continue button
    document.getElementById('step2Continue').disabled = totalSeats === 0;
    
    // Highlight selectors with selections (using minimal classes)
    const generalSelector = document.getElementById('generalSeatSelector');
    const studentSelector = document.getElementById('studentSeatSelector');
    const chairSelector = document.getElementById('chairSeatSelector');
    
    if (generalSelector) {
        generalSelector.classList.toggle('has-selection', bookingState.generalSeats > 0);
    }
    if (studentSelector) {
        studentSelector.classList.toggle('has-selection', bookingState.studentSeats > 0);
    }
    if (chairSelector) {
        chairSelector.classList.toggle('has-selection', bookingState.chairs > 0);
    }
    
    updateStickyCTA();
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
        <div class="field-checkboxes">
            ${bookingState.studentSeats > 0 ? `
                <label class="checkbox-label">
                    <input type="checkbox" class="attendee-student" data-index="0">
                    <span>Student Ticket (₹${bookingState.studentPrice})</span>
                </label>
            ` : ''}
            ${bookingState.chairs > 0 ? `
                <label class="checkbox-label">
                    <input type="checkbox" class="attendee-chair" data-index="0">
                    <span>Needs Chair</span>
                </label>
            ` : ''}
        </div>
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

        const headerText = totalSeats === 2 ? '1 seat' : `${totalSeats - 1} seats`;
        additionalCard.innerHTML = `
            <div class="header">Additional Attendees (${headerText})</div>
        `;

        for (let i = 1; i < totalSeats; i++) {
            const row = createAttendeeRow(i);
            additionalCard.appendChild(row);
        }

        container.appendChild(additionalCard);
    }

    // Add event listeners for checkboxes
    attachCheckboxListeners();
}

function createAttendeeRow(index) {
    const row = document.createElement('div');
    row.className = 'attendee-row';

    row.innerHTML = `
        <div class="attendee-row-header">
            <div class="person-number">Person ${index + 1}</div>
        </div>
        <div class="attendee-row-content">
            <input type="text" class="attendee-name" data-index="${index}" placeholder="Full name" required>
            <div class="attendee-row-checkboxes">
                ${bookingState.studentSeats > 0 ? `
                    <label class="checkbox-label">
                        <input type="checkbox" class="attendee-student" data-index="${index}">
                        <span>Student</span>
                    </label>
                ` : ''}
                ${bookingState.chairs > 0 ? `
                    <label class="checkbox-label">
                        <input type="checkbox" class="attendee-chair" data-index="${index}">
                        <span>Chair</span>
                    </label>
                ` : ''}
            </div>
        </div>
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
        });
    });

    // Chair checkboxes
    const chairCheckboxes = document.querySelectorAll('.attendee-chair');
    chairCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            validateChairSelection(this);
        });
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
    
    // Get all name inputs
    const nameInputs = document.querySelectorAll('.attendee-name');
    nameInputs.forEach(input => {
        const index = parseInt(input.dataset.index);
        const name = input.value.trim();
        
        if (!name) {
            input.style.borderColor = 'var(--orange)';
            isValid = false;
        } else {
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
    
    if (!isValid) {
        alert('Please fill in all required fields');
    }
    
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
    
    const artistNames = bookingState.concertData?.artists?.map(a => a.name).join(', ') || 'Various Artists';
    const concertDate = bookingState.concertData?.display_date || bookingState.concertData?.date || 'TBA';
    
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

    // Prepare booking data
    const bookingData = {
        bookingId: bookingState.bookingId,
        transactionId: bookingState.transactionId,
        timestamp: new Date().toISOString(),
        concert: bookingState.concertData,
        seats: {
            general: bookingState.generalSeats,
            student: bookingState.studentSeats,
            chairs: bookingState.chairs
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

        console.log('✅ Booking submitted successfully:', result);

        // Show confirmation
        populateConfirmationStep();
        goToStep(6);

    } catch (error) {
        console.error('❌ Error submitting booking:', error);
        alert('There was an error submitting your booking. Please try again or contact support.');
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
    const artistNames = bookingState.concertData?.artists?.map(a => a.name).join(', ') || 'Various Artists';
    const concertDate = bookingState.concertData?.display_date || bookingState.concertData?.date || 'TBA';
    
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
