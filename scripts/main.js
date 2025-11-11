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

    // Format each artist as "Name (Genre)"
    return sorted
        .map(artist => `${artist.name} (${artist.genre})`)
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
                <div style="text-align: center; padding: 100px 20px;">
                    <h2 style="font-family: 'League Spartan', sans-serif; color: var(--gold-toned); margin-bottom: 20px;">
                        No Upcoming Baithak Currently
                    </h2>
                    <p style="font-family: 'Inter', sans-serif; color: var(--text-gray);">
                        Please check back soon for our next intimate classical music gathering.
                    </p>
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
                        ${upcomingConcert.title}${upcomingConcert.sub_title || ''}
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
                        <div class="seats-count">50 Baithak Seats</div>
                        <div class="seats-text">Available</div>
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
        
        document.getElementById('heroContent').innerHTML = heroHTML;

        // Fetch and display seat availability
        fetchAndDisplaySeatAvailability(upcomingConcert.concert_id);

        // Reinitialize booking triggers for dynamically added buttons
        reinitializeBookingTriggers();
    })
    .catch(error => {
        console.error('Error loading hero data:', error);
        document.getElementById('heroContent').innerHTML = `
            <div style="text-align: center; padding: 100px 20px;">
                <p style="font-family: 'Inter', sans-serif; color: var(--orange);">
                    Unable to load upcoming baithak information. Please refresh the page.
                </p>
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
                    <div class="image-container aspect-story">
                        <img alt="${concert.image_alt || concert.title}" 
                             loading="lazy" 
                             src="${imagePath}"
                             onerror="this.src='./Images/Baithaks/default_past.jpg'"/>
                    </div>
                    <div class="past-event-info">
                        <div class="past-event-title">${concert.title}${concert.sub_title || ''}</div>
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
        }
        
        viewMoreBtn.addEventListener('click', () => {
            displayCount = pastConcerts.length;
            displayConcerts();
        });
        
        if (pastConcerts.length > 0) {
            displayConcerts();
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
async function fetchAndDisplaySeatAvailability(concertId) {
    try {
        // Get seat availability from config.js function
        const availability = await getSeatAvailability(concertId);

        // Calculate total available seats
        const totalAvailable = availability.general_seats_available + availability.student_seats_available;
        const totalSeats = availability.total_seats;

        // Update hero section
        const seatsCountEl = document.querySelector('.seats-count');
        const seatsTextEl = document.querySelector('.seats-text');
        const reserveButtons = document.querySelectorAll('.booking-trigger');

        if (seatsCountEl) {
            if (totalAvailable === 0) {
                seatsCountEl.textContent = 'Sold Out';
                seatsTextEl.textContent = 'All seats booked';
                seatsCountEl.style.color = 'var(--orange)';
                seatsCountEl.style.fontFamily = "'League Spartan', sans-serif";  // Match site font
                seatsTextEl.style.fontFamily = "'Inter', sans-serif";

                // Disable all Reserve/Book buttons when sold out
                reserveButtons.forEach(btn => {
                    btn.style.opacity = '0.5';
                    btn.style.cursor = 'not-allowed';
                    btn.style.pointerEvents = 'none';
                    btn.setAttribute('disabled', 'true');
                    btn.setAttribute('aria-disabled', 'true');
                    btn.textContent = 'Sold Out';
                });
            } else if (totalAvailable <= 5) {
                seatsCountEl.textContent = `Only ${totalAvailable} Seats Left!`;
                seatsTextEl.textContent = '';
                seatsCountEl.style.color = 'var(--orange)';
                seatsCountEl.style.fontFamily = "'League Spartan', sans-serif";
                seatsTextEl.style.fontFamily = "'Inter', sans-serif";

                // Re-enable buttons if previously disabled
                reserveButtons.forEach(btn => {
                    btn.style.opacity = '1';
                    btn.style.cursor = 'pointer';
                    btn.style.pointerEvents = 'auto';
                    btn.removeAttribute('disabled');
                    btn.removeAttribute('aria-disabled');
                    if (btn.classList.contains('mobile-sticky-btn')) {
                        btn.textContent = 'Reserve Seat';
                    } else {
                        btn.textContent = 'Reserve a Seat';
                    }
                });
            } else {
                seatsCountEl.textContent = `${totalAvailable} of ${totalSeats} Seats`;
                seatsTextEl.textContent = 'Available';
                seatsCountEl.style.fontFamily = "'League Spartan', sans-serif";
                seatsTextEl.style.fontFamily = "'Inter', sans-serif";

                // Re-enable buttons if previously disabled
                reserveButtons.forEach(btn => {
                    btn.style.opacity = '1';
                    btn.style.cursor = 'pointer';
                    btn.style.pointerEvents = 'auto';
                    btn.removeAttribute('disabled');
                    btn.removeAttribute('aria-disabled');
                    if (btn.classList.contains('mobile-sticky-btn')) {
                        btn.textContent = 'Reserve Seat';
                    } else {
                        btn.textContent = 'Reserve a Seat';
                    }
                });
            }
        }

        // Update sticky CTA
        const stickySeatsCount = document.getElementById('stickySeatsCount');
        if (stickySeatsCount) {
            if (totalAvailable === 0) {
                stickySeatsCount.textContent = 'Sold Out';
                stickySeatsCount.style.fontFamily = "'League Spartan', sans-serif";
            } else {
                stickySeatsCount.textContent = `${totalAvailable} Seats`;
                stickySeatsCount.style.fontFamily = "'League Spartan', sans-serif";
            }
        }

        console.log('✅ Seat availability loaded:', availability);

    } catch (error) {
        console.error('❌ Error fetching seat availability:', error);
        // Keep default display if fetch fails
    }
}
