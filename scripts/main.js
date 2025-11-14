// Mobile Menu Toggle
const menuToggle = document.querySelector('.menu-toggle');
const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
const body = document.body;

menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    menuToggle.classList.toggle('active');
    mobileMenuOverlay.classList.toggle('active');
    body.style.overflow = mobileMenuOverlay.classList.contains('active') ? 'hidden' : '';
});

mobileMenuOverlay.addEventListener('click', (e) => {
    if (e.target === mobileMenuOverlay) {
        menuToggle.classList.remove('active');
        mobileMenuOverlay.classList.remove('active');
        body.style.overflow = '';
    }
});

document.querySelectorAll('.mobile-menu-content a').forEach(link => {
    link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        mobileMenuOverlay.classList.remove('active');
        body.style.overflow = '';
    });
});

// ========================================
// HELPER FUNCTIONS FOR FORMATTING
// ========================================

/**
 * Get ordinal suffix for day (1st, 2nd, 3rd, 4th, etc.)
 */
function getOrdinalSuffix(day) {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}

/**
 * Format date as "16th November 2025, Saturday"
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];

    const day = date.getDate();
    const dayOfWeek = days[date.getDay()];
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day}${getOrdinalSuffix(day)} ${month} ${year}, ${dayOfWeek}`;
}

/**
 * Convert 24hr time to 12hr with AM/PM
 * Example: "10:00" -> "10:00 AM", "14:30" -> "2:30 PM"
 */
function formatTime12Hr(time24) {
    if (!time24) return '';

    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12; // Convert 0 to 12

    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format artists sorted by category with genre mapping
 * Returns HTML string with each artist on new line
 * Primary artists: larger, bold, gold-toned
 * Accompanists: smaller, regular, white
 */
function formatArtists(artists) {
    if (!artists || artists.length === 0) return 'Various Artists';

    // Sort: Primary artists first, then Accompanists
    const sorted = [...artists].sort((a, b) => {
        const categoryOrder = { 'Primary': 0, 'Accompanist': 1 };
        const orderA = categoryOrder[a.category] ?? 2;
        const orderB = categoryOrder[b.category] ?? 2;
        return orderA - orderB;
    });

    // Format each artist with category-based styling
    return sorted
        .map(artist => {
            const cssClass = artist.category === 'Primary' ? 'artist-primary' : 'artist-accompanist';
            return `<span class="${cssClass}">${artist.name} (${artist.genre})</span>`;
        })
        .join('<br>');
}

function formatTimeBlock(concert) {
  if (!concert.concert_time) return "";

  const mealType = concert.meal_type
    ? concert.meal_type.charAt(0).toUpperCase() + concert.meal_type.slice(1).toLowerCase()
    : "";

  // Convert times to 12hr format with AM/PM
  const concertTime = formatTime12Hr(concert.concert_time);
  const mealTime = concert.meal_time ? formatTime12Hr(concert.meal_time) : '';

  if (!concert.meal_time || !concert.meal_order) {
    return `${concertTime} — Baithak Begins`;
  }

  if (concert.meal_order.toLowerCase() === "before") {
    return `
      ${mealTime} — ${mealType} followed by Baithak<br/>
      ${concertTime} — Baithak Begins
    `;
  }

  return `
    ${concertTime} — Baithak<br/>
    ${mealTime} — ${mealType}
  `;
}

// Use config.js to get the correct data source
const dataURL = getDataSourceURL();

fetch(dataURL)
    .then(response => response.json())
    .then(data => {
        const upcomingConcert = data.find(concert =>
            concert.event_status &&
            concert.event_status.toLowerCase() === 'upcoming'
        );
        
        if (!upcomingConcert) {
            document.getElementById('heroContent').innerHTML = `
                <div class="message-empty">
                    <h2>No Upcoming Baithak Currently</h2>
                    <p>Please check back soon for our next intimate classical music gathering.</p>
                </div>
            `;
            return;
        }
        
        // Format artists with Primary first, each on new line with genre
        const artistDisplay = formatArtists(upcomingConcert.artists);
        
        const heroHTML = `
            <div class="hero-grid">
                <div class="hero-image-container">
                    <div class="hero-image image-container aspect-portrait">
                        <img src="${upcomingConcert.image_hero}" 
                             alt="${upcomingConcert.image_alt || upcomingConcert.title}"
                             loading="eager"
                             onerror="this.src='./Images/Baithaks/default_hero.jpg'">
                    </div>
                </div>
                
                <div class="hero-content">
                    <div class="hero-label">UPCOMING BAITHAK</div>
                    
                    <div class="hero-artists">
                        <span class="artist-name">${artistDisplay}</span>
                    </div>
                    
                    <h1 class="hero-title">
                        ${upcomingConcert.title}${upcomingConcert.sub_title ? ` — ${upcomingConcert.sub_title}` : ''}
                    </h1>
                    
                    <div class="event-details">
                        <div class="detail-row">
                            <div class="icon-dot"></div>
                            <strong>Date</strong>
                            <span>${formatDate(upcomingConcert.date)}</span>
                        </div>
                       <div class="detail-row">
                            <div class="icon-dot"></div>
                            <strong>Time</strong>
                            <span>${formatTimeBlock(upcomingConcert)}</span>
                        </div>
                        <div class="detail-row">
                            <div class="icon-dot"></div>
                            <strong>Venue</strong>
                            <span>Sadashivnagar, Bangalore</span>
                        </div>
                        <div class="detail-row">
                            <div class="icon-dot"></div>
                            <strong>Includes</strong>
                            <span>${upcomingConcert.inclusions || 'Home-cooked meal & Raagdhari mehfil'}</span>
                        </div>
                        <div class="detail-row">
                            <div class="icon-dot"></div>
                            <strong>Price</strong>
                            <span>₹${upcomingConcert.ticket_price_general || 1000} (General) • ₹${upcomingConcert.ticket_price_student || 500} (Students)</span>
                        </div>
                    </div>
                    
                    <div style="font-family: 'Inter', sans-serif; font-size: 0.85em; color: var(--text-gray); margin-bottom: 25px; line-height: 1.6;">
                        ${upcomingConcert.contribution_note || 'Your contribution goes entirely toward the artists and their music.'}
                    </div>
                    
                    <div class="seats-urgency">
                        <div class="seats-count">Loading...</div>
                        <div class="seats-text"></div>
                    </div>
                    
                    <div class="hero-cta-group">
                        <a href="#" class="btn btn-primary booking-trigger">Reserve a Seat</a>
                        <a href="#past-events" class="btn btn-secondary">See Past Baithaks</a>
                    </div>
                    
                    <div class="hero-quick-links">
                        <a href="#how-it-works">Reservation Process</a>
                        <a href="#faq">FAQ</a>
                    </div>
                </div>
            </div>
        `;
        
        // Store concert data globally for seat availability updates
        window.currentConcert = upcomingConcert;

        document.getElementById('heroContent').innerHTML = heroHTML;

        // Fetch and display seat availability (will rebuild hero if urgency mode)
        fetchAndDisplaySeatAvailability(upcomingConcert);

        // Set up auto-refresh for seat availability (every 60 seconds)
        // Only refresh when hero section is visible (not in booking flow)
        if (window.seatAvailabilityInterval) {
            clearInterval(window.seatAvailabilityInterval);
        }
        window.seatAvailabilityInterval = setInterval(() => {
            const heroSection = document.getElementById('hero');
            const bookingFlow = document.getElementById('booking-flow');

            // Only refresh if hero is visible and booking flow is not active
            if (heroSection && heroSection.style.display !== 'none' &&
                (!bookingFlow || !bookingFlow.classList.contains('active'))) {
                console.log('🔄 Auto-refreshing seat availability...');
                fetchAndDisplaySeatAvailability(upcomingConcert);
            }
        }, 60000); // 60 seconds

        console.log('✅ Seat availability auto-refresh enabled (60s interval)');

        // Reinitialize booking triggers for dynamically added buttons
        reinitializeBookingTriggers();
    })
    .catch(error => {
        console.error('Error loading hero data:', error);
        document.getElementById('heroContent').innerHTML = `
            <div class="message-error">
                <p>Unable to load upcoming baithak information. Please refresh the page.</p>
            </div>
        `;
    });

// Use config.js to get the correct data source (reuse dataURL from above)
fetch(dataURL)
    .then(response => response.json())
    .then(data => {
        const container = document.getElementById('pastEventsGrid');
        const viewMoreBtn = document.getElementById('viewMoreBtn');

        let pastConcerts = data.filter(c =>
            c.event_status &&
            c.event_status.toLowerCase() === 'past'
        );
        
        pastConcerts.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA;
        });
        
        const INITIAL_DISPLAY = 4;
        let displayCount = INITIAL_DISPLAY;
        
        function displayConcerts() {
            container.innerHTML = '';
            
            const concertsToShow = pastConcerts.slice(0, displayCount);
            
            concertsToShow.forEach((concert, index) => {
                // Get only Primary artists for past baithaks display
                const primaryArtists = concert.artists?.filter(a => a.category === 'Primary') || [];
                const artistNames = primaryArtists.length > 0
                    ? primaryArtists.map(a => a.name).join(', ')
                    : 'Various Artists';
                
                const imagePath = concert.image_past || './Images/Baithaks/default_past.jpg';
                
                const viewMoreLink = concert.event_gallery_link || 
                                   concert.event_recording_link || 
                                   'https://instagram.com/livingroombaithaks';
                
                const card = document.createElement('div');
                card.className = 'past-event-card';
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                card.style.transition = 'opacity 0.5s, transform 0.5s';
                
                card.innerHTML = `
                    <a href="${imagePath}"
                       class="glightbox"
                       data-gallery="past-baithaks"
                       data-title="${concert.title}${concert.sub_title ? ' ' + concert.sub_title : ''}"
                       data-description="${artistNames} • ${concert.display_date || concert.date}">
                        <div class="image-container aspect-story">
                            <img alt="${concert.image_alt || concert.title}"
                                 loading="lazy"
                                 src="${imagePath}"
                                 onerror="this.src='./Images/Baithaks/default_past.jpg'"/>
                        </div>
                    </a>
                    <div class="past-event-info">
                        <div class="past-event-title">${concert.title}${concert.sub_title ? ' ' + concert.sub_title : ''}</div>
                        <div class="past-event-artist">${artistNames}</div>
                        <div class="past-event-date">${concert.display_date || concert.date}</div>
                        ${(concert.event_gallery_link || concert.event_recording_link) ?
                            `<a href="${viewMoreLink}"
                                target="_blank"
                                style="display: inline-block; margin-top: 12px; color: var(--orange); text-decoration: none; font-family: 'Inter', sans-serif; font-size: 0.85em; font-weight: 600; transition: color 0.3s;"
                                onmouseover="this.style.color='var(--gold-bright)'"
                                onmouseout="this.style.color='var(--orange)'">
                               View Gallery/Recording →
                             </a>`
                            : ''}
                    </div>
                `;
                
                container.appendChild(card);
                
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 100);
            });
            
            if (pastConcerts.length > displayCount) {
                viewMoreBtn.style.display = 'inline-flex';
            } else {
                viewMoreBtn.style.display = 'none';
            }

            // Initialize or refresh GLightbox for new images
            if (window.lightbox) {
                window.lightbox.reload();
            }
        }

        viewMoreBtn.addEventListener('click', () => {
            displayCount = pastConcerts.length;
            displayConcerts();
        });

        if (pastConcerts.length > 0) {
            displayConcerts();

            // Initialize GLightbox after first render
            setTimeout(() => {
                window.lightbox = GLightbox({
                    touchNavigation: true,
                    loop: true,
                    autoplayVideos: true
                });
            }, 500);
        } else {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; font-family: 'Inter', sans-serif; color: var(--text-gray);">
                    <p style="font-size: 1.1em; margin-bottom: 15px;">No past baithaks to display yet.</p>
                    <p style="font-size: 0.9em;">Check back soon for recordings and photos from our concerts!</p>
                </div>
            `;
        }
    })
    .catch(error => {
        console.error('Error loading past concerts:', error);
        document.getElementById('pastEventsGrid').innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; font-family: 'Inter', sans-serif; color: var(--text-gray);">
                <p style="font-size: 1.1em; color: var(--orange);">Unable to load past baithaks.</p>
                <p style="font-size: 0.9em; margin-top: 10px;">Please try refreshing the page.</p>
            </div>
        `;
    });

// Fetch and display seat availability
async function fetchAndDisplaySeatAvailability(concert) {
    try {
        // Get seat availability from config.js function
        const availability = await getSeatAvailability(concert.concert_id);

        // Calculate total available seats
        const totalAvailable = availability.general_seats_available + availability.student_seats_available;
        const totalSeats = availability.total_seats;

        // Format artists
        const artistDisplay = formatArtists(concert.artists);

        // Decide which hero layout to build based on seat availability
        if (totalAvailable <= 15 && totalAvailable > 0) {
            // URGENCY MODE - Rebuild entire hero
            buildUrgencyHero(concert, totalAvailable);
        } else if (totalAvailable === 0) {
            // SOLD OUT MODE - Update existing hero
            updateSoldOutState();
        } else {
            // NORMAL MODE - Just update seat display (hero already built)
            updateNormalSeatsDisplay(totalAvailable, totalSeats);
        }

        // Update mobile sticky CTA regardless of mode
        updateMobileStickyCTA(totalAvailable);

        //Reinitialize booking triggers
        reinitializeBookingTriggers();

        console.log('✅ Seat availability loaded:', availability);

    } catch (error) {
        console.error('❌ Error fetching seat availability:', error);
        // Keep default display if fetch fails
    }
}

// Helper function to build URGENCY hero layout
function buildUrgencyHero(concert, totalAvailable) {
    const artistDisplay = formatArtists(concert.artists);
    const seatWord = totalAvailable === 1 ? 'seat' : 'seats';

    const urgencyHTML = `
        <div class="hero-grid">
            <div class="hero-image-container">
                <div class="hero-image image-container aspect-portrait">
                    <img src="${concert.image_hero}"
                         alt="${concert.image_alt || concert.title}"
                         loading="eager"
                         onerror="this.src='./Images/Baithaks/default_hero.jpg'">
                </div>
            </div>

            <div class="hero-content">
                <div class="hero-label">UPCOMING BAITHAK</div>

                <div class="hero-artists">
                    <span class="artist-name">${artistDisplay}</span>
                </div>

                <h1 class="hero-title">
                    ${concert.title}${concert.sub_title ? ` — ${concert.sub_title}` : ''}
                </h1>

                <div class="seats-terracotta-box">
                    <span class="seats-terracotta-text">Filling up • <span class="seats-terracotta-count">${totalAvailable} ${seatWord} left</span></span>
                </div>

                <div class="event-details">
                    <div class="detail-row">
                        <div class="icon-dot"></div>
                        <strong>Date</strong>
                        <span>${formatDate(concert.date)}</span>
                    </div>
                    <div class="detail-row">
                        <div class="icon-dot"></div>
                        <strong>Time</strong>
                        <span>${formatTimeBlock(concert)}</span>
                    </div>
                    <div class="detail-row">
                        <div class="icon-dot"></div>
                        <strong>Venue</strong>
                        <span>Sadashivnagar, Bangalore</span>
                    </div>
                    <div class="detail-row">
                        <div class="icon-dot"></div>
                        <strong>Includes</strong>
                        <span>${concert.inclusions || 'Home-cooked meal & Raagdhari mehfil'}</span>
                    </div>
                    <div class="detail-row">
                        <div class="icon-dot"></div>
                        <strong>Price</strong>
                        <span>₹${concert.ticket_price_general || 1000} (General) • ₹${concert.ticket_price_student || 500} (Students)</span>
                    </div>
                </div>

                <div style="font-family: 'Inter', sans-serif; font-size: 0.85em; color: var(--text-gray); margin-bottom: 25px; line-height: 1.6;">
                    ${concert.contribution_note || 'Your contribution goes entirely toward the artists and their music.'}
                </div>

                <div class="hero-cta-group">
                    <a href="#" class="btn btn-primary booking-trigger">Reserve Your Seat</a>
                    <a href="#past-events" class="btn btn-secondary">See Past Baithaks</a>
                </div>

                <div class="hero-quick-links">
                    <a href="#how-it-works">Reservation Process</a>
                    <a href="#faq">FAQ</a>
                </div>
            </div>
        </div>
    `;

    document.getElementById('heroContent').innerHTML = urgencyHTML;
}

// Helper function to update normal seats display
function updateNormalSeatsDisplay(totalAvailable, totalSeats) {
    const seatsCountEl = document.querySelector('.seats-count');
    const seatsTextEl = document.querySelector('.seats-text');

    if (seatsCountEl) {
        seatsCountEl.textContent = `${totalAvailable} of ${totalSeats} Seats`;
        seatsTextEl.textContent = 'Available';
        seatsCountEl.style.fontFamily = "'League Spartan', sans-serif";
        seatsTextEl.style.fontFamily = "'Inter', sans-serif";
    }
}

// Helper function to update sold out state
function updateSoldOutState() {
    const seatsUrgencyEl = document.querySelector('.seats-urgency');
    const heroImageContainer = document.querySelector('.hero-image-container');
    const reserveButtons = document.querySelectorAll('.booking-trigger');

    // Replace seats-urgency with sold-out badge
    if (seatsUrgencyEl) {
        seatsUrgencyEl.outerHTML = `
            <div class="sold-out-badge">
                <span class="sold-out-text">This baithak is sold out</span>
            </div>
        `;
    }

    // Dim the hero image
    if (heroImageContainer) {
        heroImageContainer.classList.add('sold-out');
    }

    // Change Reserve buttons to Join WhatsApp Community when sold out
    reserveButtons.forEach(btn => {
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.style.pointerEvents = 'auto';
        btn.removeAttribute('disabled');
        btn.removeAttribute('aria-disabled');
        btn.textContent = 'Join WhatsApp Community';
        btn.href = 'https://chat.whatsapp.com/CfZlxIz3yKZBLSMKMyFBX2';
        btn.target = '_blank';
        btn.classList.remove('booking-trigger');
        btn.classList.add('btn-secondary');
    });
}

// Helper function to update mobile sticky CTA
function updateMobileStickyCTA(totalAvailable) {
    const stickySeatsCount = document.getElementById('stickySeatsCount');
    const stickyBookBtn = document.getElementById('stickyBookBtn');

    if (stickySeatsCount) {
        if (totalAvailable === 0) {
            stickySeatsCount.textContent = 'Sold Out';
            stickySeatsCount.style.fontFamily = "'League Spartan', sans-serif";

            // Update sticky button to link to WhatsApp
            if (stickyBookBtn) {
                stickyBookBtn.textContent = 'Join Community';
                stickyBookBtn.href = 'https://chat.whatsapp.com/CfZlxIz3yKZBLSMKMyFBX2';
                stickyBookBtn.target = '_blank';
                stickyBookBtn.classList.remove('booking-trigger');
            }
        } else {
            stickySeatsCount.textContent = `${totalAvailable} Seats`;
            stickySeatsCount.style.fontFamily = "'League Spartan', sans-serif";

            // Reset sticky button to booking trigger
            if (stickyBookBtn) {
                stickyBookBtn.textContent = 'Reserve Seat';
                stickyBookBtn.href = '#';
                stickyBookBtn.removeAttribute('target');
                stickyBookBtn.classList.add('booking-trigger');
            }
        }
    }
}

// ===========================
// FAQ FUNCTIONALITY
// ===========================

/**
 * Load FAQ from JSON file and render to page
 */
async function loadFAQ() {
    try {
        const response = await fetch('./data/faq.json');
        const faqData = await response.json();

        const faqContainer = document.getElementById('faqContainer');
        if (!faqContainer) return;

        let faqHTML = '';

        faqData.categories.forEach(category => {
            // Add category header
            faqHTML += `<h3 class="faq-category-header">${category.name}</h3>`;

            // Add questions in this category
            category.questions.forEach(q => {
                const keywords = q.keywords ? q.keywords.join(' ') : '';
                faqHTML += `
                    <div class="faq-item" data-keywords="${keywords}">
                        <div class="faq-question">
                            <span>${q.question}</span>
                            <span class="faq-toggle">▼</span>
                        </div>
                        <div class="faq-answer">${q.answer}</div>
                    </div>
                `;
            });
        });

        faqContainer.innerHTML = faqHTML;

        // Initialize FAQ toggle functionality after loading
        initFAQToggle();

        console.log('✅ FAQ loaded from JSON successfully');

    } catch (error) {
        console.error('❌ Error loading FAQ:', error);
        const faqContainer = document.getElementById('faqContainer');
        if (faqContainer) {
            faqContainer.innerHTML = `
                <div class="message-error">
                    <p>Unable to load FAQ. Please refresh the page.</p>
                </div>
            `;
        }
    }
}

/**
 * Initialize FAQ toggle functionality
 */
function initFAQToggle() {
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', () => {
            const faqItem = question.parentElement;
            const isActive = faqItem.classList.contains('active');

            // Close all FAQ items
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });

            // Open clicked item if it wasn't active
            if (!isActive) {
                faqItem.classList.add('active');
            }
        });
    });
}

// Load FAQ when page loads
loadFAQ();

// FAQ Search with Synonyms
const faqSearchInput = document.getElementById('faqSearch');
const noResultsDiv = document.getElementById('noResults');

// Synonym mapping for intelligent search
const synonymMap = {
    'length': ['duration', 'long', 'hours'],
    'duration': ['length', 'long', 'hours'],
    'long': ['duration', 'length', 'hours'],
    'hours': ['duration', 'length', 'long'],
    'hour': ['duration', 'length', 'long'],
    'cost': ['contribution', 'price', 'fee', 'payment'],
    'contribution': ['cost', 'price', 'fee', 'payment'],
    'price': ['cost', 'contribution', 'fee', 'payment'],
    'payment': ['cost', 'contribution', 'fee', 'price'],
    'fee': ['cost', 'contribution', 'price', 'payment'],
    'pay': ['payment', 'contribution', 'cost'],
    'book': ['booking', 'reserve', 'reservation'],
    'booking': ['book', 'reserve', 'reservation'],
    'reserve': ['booking', 'book', 'reservation'],
    'reservation': ['booking', 'book', 'reserve'],
    'location': ['venue', 'address', 'where'],
    'venue': ['location', 'address', 'where'],
    'address': ['location', 'venue', 'where'],
    'where': ['location', 'venue', 'address'],
    'time': ['timing', 'when', 'schedule'],
    'timing': ['time', 'when', 'schedule'],
    'when': ['time', 'timing', 'schedule'],
    'schedule': ['time', 'timing', 'when'],
    'food': ['meal', 'dinner', 'lunch', 'breakfast'],
    'meal': ['food', 'dinner', 'lunch', 'breakfast'],
    'dinner': ['meal', 'food'],
    'lunch': ['meal', 'food'],
    'breakfast': ['meal', 'food'],
    'seating': ['seat'],
    'seat': ['seating'],
    'sitting': ['seating', 'seat'],
    'chair': ['seating', 'seat'],
    'floor': ['seating'],
    'photo': ['photography', 'picture', 'camera'],
    'photography': ['photo', 'picture', 'camera'],
    'picture': ['photo', 'photography'],
    'record': ['recording', 'video'],
    'recording': ['record', 'video'],
    'camera': ['photo', 'photography'],
    'video': ['recording', 'record'],
    'kids': ['children', 'child'],
    'children': ['kids', 'child'],
    'child': ['children', 'kids'],
    'cancel': ['cancellation'],
    'cancellation': ['cancel'],
    'refund': ['cancel', 'cancellation'],
    'guest': ['friend', 'bring'],
    'friend': ['guest', 'bring'],
    'bring': ['guest'],
    'arrive': ['arrival'],
    'arrival': ['arrive'],
    'dress': ['wear', 'clothing', 'attire'],
    'wear': ['dress', 'clothing', 'attire'],
    'clothing': ['dress', 'wear', 'attire'],
    'clothes': ['dress', 'wear', 'attire'],
    'contact': ['phone', 'email'],
    'phone': ['contact'],
    'email': ['contact'],
    'concert': ['baithak', 'performance'],
    'baithak': ['concert', 'performance'],
    'performance': ['concert', 'baithak'],
    'show': ['concert', 'baithak', 'performance']
};

// Get all synonyms for a word
function getSynonyms(word) {
    word = word.toLowerCase();
    return synonymMap[word] || [];
}

// Helper function to check if a word exists with word boundaries
function wordBoundaryMatch(text, word) {
    const regex = new RegExp('\\b' + word + '\\b', 'i');
    return regex.test(text);
}

// Helper function for intelligent matching with synonyms
function smartMatch(text, searchTerm) {
    text = text.toLowerCase();
    searchTerm = searchTerm.toLowerCase();
    
    const keywords = searchTerm.split(' ').filter(word => word.length >= 3);
    
    if (keywords.length === 0) {
        return text.includes(searchTerm);
    }
    
    return keywords.every(keyword => {
        if (wordBoundaryMatch(text, keyword)) return true;
        
        const synonyms = getSynonyms(keyword);
        if (synonyms.length === 0) return false;
        
        return synonyms.some(syn => wordBoundaryMatch(text, syn));
    });
}

if (faqSearchInput) {
    faqSearchInput.addEventListener('input', function() {
        const searchTerm = this.value.trim();
        const faqItems = document.querySelectorAll('.faq-item');
        const categoryHeaders = document.querySelectorAll('.faq-category-header');
        let visibleCount = 0;

        if (searchTerm === '') {
            faqItems.forEach(item => item.classList.remove('hidden'));
            categoryHeaders.forEach(header => header.classList.remove('hidden'));
            noResultsDiv.classList.remove('show');
            return;
        }

        const visibleCategories = new Set();

        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question span:first-child').textContent;
            const answer = item.querySelector('.faq-answer').textContent;
            const combinedText = question + ' ' + answer;
            
            if (smartMatch(combinedText, searchTerm)) {
                item.classList.remove('hidden');
                visibleCount++;
                
                let previousElement = item.previousElementSibling;
                while (previousElement) {
                    if (previousElement.classList.contains('faq-category-header')) {
                        visibleCategories.add(previousElement);
                        break;
                    }
                    previousElement = previousElement.previousElementSibling;
                }
            } else {
                item.classList.add('hidden');
            }
        });

        categoryHeaders.forEach(header => {
            if (visibleCategories.has(header)) {
                header.classList.remove('hidden');
            } else {
                header.classList.add('hidden');
            }
        });

        if (visibleCount === 0) {
            noResultsDiv.classList.add('show');
        } else {
            noResultsDiv.classList.remove('show');
        }
    });
}