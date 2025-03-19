// Dummy data (replace with API calls)
const events = [
    { id: 1, title: 'CS Club Hackathon', date: '2025-04-10 18:00', location: 'Zoom', category: 'Tech', description: 'Join us for a coding marathon!', capacity: 50, rsvpCount: 42 },
    { id: 2, title: 'Career Workshop', date: '2025-04-12 14:00', location: 'Room 101', category: 'Career', description: 'Prepare for your future!', capacity: 30, rsvpCount: 25 },
  ];
  
  // Load Dashboard
  function loadDashboard() {
    const eventGrid = document.getElementById('eventGrid');
    const searchInput = document.getElementById('search');
  
    function renderEvents(filter = '') {
      eventGrid.innerHTML = '';
      const filteredEvents = events.filter(event =>
        event.title.toLowerCase().includes(filter.toLowerCase())
      );
  
      filteredEvents.forEach(event => {
        const card = document.createElement('div');
        card.className = 'event-card';
        card.innerHTML = `
          <h2>${event.title}</h2>
          <p>${new Date(event.date).toLocaleString()}</p>
          <p>Location: ${event.location}</p>
          <p>Category: ${event.category}</p>
          <a href="event-details.html?id=${event.id}">View Details</a>
        `;
        eventGrid.appendChild(card);
      });
    }
  
    renderEvents();
    searchInput.addEventListener('input', () => renderEvents(searchInput.value));
  }
  
  // Load Event Details
  function loadEventDetails() {
    const eventDetails = document.getElementById('eventDetails');
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = parseInt(urlParams.get('id'));
    const event = events.find(e => e.id === eventId);
  
    if (!event) {
      eventDetails.innerHTML = '<p>Event not found.</p>';
      return;
    }
  
    let rsvpStatus = localStorage.getItem(`rsvp_${eventId}`) || 'Join';
  
    eventDetails.innerHTML = `
      <h1>${event.title}</h1>
      <p>${event.description}</p>
      <p>Date: ${new Date(event.date).toLocaleString()}</p>
      <p>Location: ${event.location}</p>
      <p>RSVPs: ${event.rsvpCount} / ${event.capacity}</p>
      <button class="rsvp-btn" id="rsvpBtn">${rsvpStatus}</button>
    `;
  
    const rsvpBtn = document.getElementById('rsvpBtn');
    if (rsvpStatus === 'Joined') rsvpBtn.classList.add('joined');
    if (event.rsvpCount >= event.capacity) {
      rsvpBtn.classList.add('full');
      rsvpBtn.textContent = 'Full';
    }
  
    rsvpBtn.addEventListener('click', () => {
      if (rsvpStatus === 'Join' && event.rsvpCount < event.capacity) {
        // Simulate API call here
        event.rsvpCount++;
        rsvpStatus = 'Joined';
        localStorage.setItem(`rsvp_${eventId}`, 'Joined');
        rsvpBtn.textContent = 'Joined';
        rsvpBtn.classList.add('joined');
        eventDetails.querySelector('p:nth-child(5)').textContent = `RSVPs: ${event.rsvpCount} / ${event.capacity}`;
      }
      if (event.rsvpCount >= event.capacity) {
        rsvpBtn.textContent = 'Full';
        rsvpBtn.classList.add('full');
      }
    });
  }