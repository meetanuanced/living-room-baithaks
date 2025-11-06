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

function formatTimeBlock(concert) {
  if (!concert.concert_time) return "";

  const mealType = concert.meal_type
    ? concert.meal_type.charAt(0).toUpperCase() + concert.meal_type.slice(1).toLowerCase()
    : "";

  if (!concert.meal_time || !concert.meal_order) {
    return `${concert.concert_time} — Baithak Begins`;
  }

  if (concert.meal_order.toLowerCase() === "before") {
    return `
      ${concert.meal_time} — ${mealType} followed by Baithak<br/>
      ${concert.concert_time} — Baithak Begins
    `;
  }

  return `
    ${concert.concert_time} — Baithak<br/>
    ${concert.meal_time} — ${mealType}
  `;
}

// Use config.js to get the correct data source
const dataURL = getDataSourceURL();

fetch(dataURL)
    .then(response => response.json())
    .then(data => {
        const upcomingConcert = data.find(concert =>
            concert.event_status &&
            concert.event_status.toLowerCase() === 'upcoming' &&
            concert.isCurrent === 'Y'
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
        
        const artistNames = upcomingConcert.artists && upcomingConcert.artists.length > 0
            ? upcomingConcert.artists.map(a => a.name).join(', ')
            : 'Various Artists';
        
        const artistRoles = upcomingConcert.artists && upcomingConcert.artists.length > 0
            ? upcomingConcert.artists.map(a => a.genre).join(', ')
            : '';
        
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
                        <span class="artist-name">${artistNames}</span>
                        ${artistRoles ? `<br><span class="artist-role">(${artistRoles})</span>` : ''}
                    </div>
                    
                    <h1 class="hero-title">
                        ${upcomingConcert.title}${upcomingConcert.sub_title || ''}
                    </h1>
                    
                    <div class="event-details">
                        <div class="detail-row">
                            <div class="icon-dot"></div>
                            <strong>Date</strong>
                            <span>${upcomingConcert.display_date || upcomingConcert.date}</span>
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
                            <strong>Contribution</strong>
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
                        <a href="#past-events">Past Baithaks</a>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('heroContent').innerHTML = heroHTML;
        document.getElementById('stickySeatsCount').textContent = '50 Seats';
        
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
                const artistNames = concert.artists && concert.artists.length > 0
                    ? concert.artists.map(a => a.name).join(', ')
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
