// Authentication Functions
async function handleSignup(event) {
  event.preventDefault();
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;

  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
    alert('Invalid email format!');
    return;
  }
  if (password.length < 6) {
    alert('Password must be at least 6 characters!');
    return;
  }

  const response = await fetch('http://localhost:5000/api/v1/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });

  if (response.ok) {
    window.location.href = 'login.html';
  } else {
    alert('Signup failed!');
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  const response = await fetch('http://localhost:5000/api/v1/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  if (response.ok) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('userName', data.name);
    localStorage.setItem('userRole', data.role);
    window.location.href = 'index.html';
  } else {
    alert(data.error);
  }
}

function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userName');
  localStorage.removeItem('userRole');
  updateNav();
  window.location.href = 'index.html';
}

function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token && (window.location.pathname.includes('profile.html') || window.location.pathname.includes('create-event.html'))) {
    window.location.href = 'login.html';
  }
  updateNav();
}

function updateNav() {
  const token = localStorage.getItem('token');
  const loginLink = document.getElementById('loginLink');
  const logoutLink = document.getElementById('logoutLink');
  const profileLink = document.getElementById('profileLink');
  const createEventLink = document.getElementById('createEventLink');
  const userRole = localStorage.getItem('userRole');

  if (token) {
    loginLink.style.display = 'none';
    logoutLink.style.display = 'inline';
    profileLink.textContent = `Welcome, ${localStorage.getItem('userName')}`;
    profileLink.href = 'profile.html';
    createEventLink.style.display = (userRole === 'organizer' || userRole === 'admin') ? 'inline' : 'none';
    logoutLink.addEventListener('click', handleLogout);
  } else {
    loginLink.style.display = 'inline';
    logoutLink.style.display = 'none';
    profileLink.textContent = 'Profile';
    profileLink.href = 'login.html';
    createEventLink.style.display = 'none';
  }

  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.getElementById('navLinks');
  menuToggle.addEventListener('click', () => navLinks.classList.toggle('active'));
}

// Dashboard Functions
async function loadDashboard() {
  const eventGrid = document.getElementById('eventGrid');
  const searchInput = document.getElementById('search');
  const dateFilter = document.getElementById('dateFilter');
  const categoryFilter = document.getElementById('categoryFilter');

  const response = await fetch('http://localhost:5000/api/v1/events');
  const events = await response.json();

  function renderEvents() {
    eventGrid.innerHTML = '';
    let filteredEvents = events.filter(event => 
      event.title.toLowerCase().includes(searchInput.value.toLowerCase()) &&
      (!dateFilter.value || (dateFilter.value === 'thisWeek' && new Date(event.date_time) < new Date(Date.now() + 7*24*60*60*1000)) ||
       (dateFilter.value === 'thisMonth' && new Date(event.date_time).getMonth() === new Date().getMonth())) &&
      (!categoryFilter.value || event.category === categoryFilter.value)
    );

    filteredEvents.forEach(event => {
      const card = document.createElement('div');
      card.className = 'event-card';
      card.innerHTML = `
        <h2>${event.title}</h2>
        <p>${new Date(event.date_time).toLocaleString()}</p>
        <p>Location: ${event.location}</p>
        <p>Category: ${event.category}</p>
        <a href="event-details.html?id=${event.event_id}">View Details</a>
      `;
      eventGrid.appendChild(card);
    });
  }

  renderEvents();
  searchInput.addEventListener('input', renderEvents);
  dateFilter.addEventListener('change', renderEvents);
  categoryFilter.addEventListener('change', renderEvents);
}

function setupCalendar() {
  fetch('http://localhost:5000/api/v1/events')
    .then(response => response.json())
    .then(events => {
      const calendarEl = document.getElementById('calendar');
      const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        events: events.map(event => ({
          title: event.title,
          start: event.date_time,
          url: `event-details.html?id=${event.event_id}`
        })),
        eventClick: info => {
          info.jsEvent.preventDefault();
          window.location.href = info.event.url;
        }
      });
      calendar.render();
    });
}

function setupAnalytics() {
  const token = localStorage.getItem('token');
  if (!token || (localStorage.getItem('userRole') !== 'organizer' && localStorage.getItem('userRole') !== 'admin')) return;

  fetch('http://localhost:5000/api/v1/analytics/attendance', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(response => response.json())
    .then(data => {
      const ctx = document.getElementById('analyticsChart').getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.map(e => e.title),
          datasets: [{
            label: 'Attendance',
            data: data.map(e => e.attendance_count),
            backgroundColor: '#1e90ff'
          }]
        },
        options: { scales: { y: { beginAtZero: true } } }
      });
    });
}

// Event Details Functions
async function loadEventDetails() {
  const eventDetails = document.getElementById('eventDetails');
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');

  const response = await fetch(`http://localhost:5000/api/v1/events/${eventId}`);
  const event = await response.json();

  if (event.error) {
    eventDetails.innerHTML = '<p>Event not found.</p>';
    return;
  }

  const token = localStorage.getItem('token');
  let hasRSVPd = false;
  let hasAttended = false;

  if (token) {
    const rsvpResponse = await fetch(`http://localhost:5000/api/v1/events/${eventId}/rsvp`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    hasRSVPd = (await rsvpResponse.json()).hasRSVPd;

    const attendanceResponse = await fetch(`http://localhost:5000/api/v1/events/${eventId}/check-in`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    hasAttended = (await attendanceResponse.json()).hasAttended;
  }

  eventDetails.innerHTML = `
    <h1>${event.title}</h1>
    <p>${event.description || 'No description'}</p>
    <p>Date: ${new Date(event.date_time).toLocaleString()}</p>
    <p>Location: ${event.location}</p>
    <p>Organizer: ${event.organizer || 'Unknown'}</p>
    <p>RSVPs: ${event.rsvp_count} / ${event.max_capacity}</p>
    <button class="rsvp-btn" id="rsvpBtn">${hasRSVPd ? 'Joined' : event.rsvp_count >= event.max_capacity ? 'Full' : 'Join'}</button>
  `;

  const rsvpBtn = document.getElementById('rsvpBtn');
  if (hasRSVPd) rsvpBtn.classList.add('joined');
  if (event.rsvp_count >= event.max_capacity) rsvpBtn.classList.add('full');

  rsvpBtn.addEventListener('click', async () => {
    if (!token) {
      window.location.href = 'login.html';
      return;
    }
    if (!hasRSVPd && event.rsvp_count < event.max_capacity) {
      const rsvpResponse = await fetch(`http://localhost:5000/api/v1/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (rsvpResponse.ok) {
        rsvpBtn.textContent = 'Joined';
        rsvpBtn.classList.add('joined');
        event.rsvp_count++;
        eventDetails.querySelector('p:nth-child(6)').textContent = `RSVPs: ${event.rsvp_count} / ${event.max_capacity}`;
        showNotification('RSVP confirmed!');
      } else {
        alert('RSVP failed or event is full!');
      }
    }
  });

  const feedbackForm = document.getElementById('feedbackForm');
  const checkInSection = document.getElementById('checkIn');
  if (token && hasRSVPd) {
    checkInSection.style.display = 'block';
    if (hasAttended) {
      feedbackForm.style.display = 'block';
    }
  } else {
    feedbackForm.style.display = 'none';
    checkInSection.style.display = 'none';
  }

  document.getElementById('feedbackSubmit')?.addEventListener('submit', async e => {
    e.preventDefault();
    const rating = document.getElementById('rating').value;
    const comments = document.getElementById('comments').value;
    const response = await fetch(`http://localhost:5000/api/v1/events/${eventId}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ rating, comments })
    });
    if (response.ok) {
      showNotification('Feedback submitted!');
      feedbackForm.style.display = 'none';
    } else {
      alert('Feedback submission failed!');
    }
  });

  document.getElementById('checkInBtn')?.addEventListener('click', async () => {
    const code = document.getElementById('checkInCode').value;
    const response = await fetch(`http://localhost:5000/api/v1/events/${eventId}/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ code })
    });
    if (response.ok) {
      showNotification('Checked in successfully!');
      feedbackForm.style.display = 'block';
    } else {
      alert('Invalid code or you must RSVP first!');
    }
  });
}

// Profile Functions
async function loadProfile() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  const response = await fetch('http://localhost:5000/api/v1/users/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const user = await response.json();

  document.getElementById('profileName').value = user.name;
  document.getElementById('profileEmail').value = user.email;
  document.getElementById('profileMajor').value = user.major || '';
  document.getElementById('profileYear').value = user.year || '';

  document.getElementById('editProfile').addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('profileName').value;
    const major = document.getElementById('profileMajor').value;
    const year = document.getElementById('profileYear').value;

    const response = await fetch('http://localhost:5000/api/v1/users/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, major, year })
    });
    if (response.ok) {
      showNotification('Profile updated!');
      localStorage.setItem('userName', name);
      updateNav();
    } else {
      alert('Profile update failed!');
    }
  });

  // Admin-specific functionality to add organizers/admins
  if (localStorage.getItem('userRole') === 'admin') {
    document.getElementById('adminSection').style.display = 'block';
    document.getElementById('addUserForm').addEventListener('submit', async e => {
      e.preventDefault();
      const name = document.getElementById('newUserName').value;
      const email = document.getElementById('newUserEmail').value;
      const password = document.getElementById('newUserPassword').value;
      const role = document.getElementById('newUserRole').value;

      if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        alert('Invalid email format!');
        return;
      }
      if (password.length < 6) {
        alert('Password must be at least 6 characters!');
        return;
      }

      const response = await fetch('http://localhost:5000/api/v1/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, email, password, role })
      });

      if (response.ok) {
        showNotification('User added successfully!');
        document.getElementById('addUserForm').reset();
      } else {
        alert('Failed to add user!');
      }
    });
  } else {
    document.getElementById('adminSection').style.display = 'none';
  }
}

// Create Event Function
async function handleCreateEvent(event) {
  event.preventDefault();
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  const newEvent = {
    title: document.getElementById('eventTitle').value,
    description: document.getElementById('eventDescription').value,
    date_time: document.getElementById('eventDateTime').value,
    location: document.getElementById('eventLocation').value,
    max_capacity: parseInt(document.getElementById('eventCapacity').value),
    category: document.getElementById('eventCategory').value,
    recurrence: document.getElementById('eventRecurrence').value
  };

  if (new Date(newEvent.date_time) < new Date()) {
    alert('Event date cannot be in the past!');
    return;
  }

  const response = await fetch('http://localhost:5000/api/v1/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(newEvent)
  });
  if (response.ok) {
    showNotification('Event created successfully!');
    window.location.href = 'index.html';
  } else {
    alert('Event creation failed!');
  }
}

// Notifications
function showNotification(message) {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.style.display = 'block';
  setTimeout(() => notification.style.display = 'none', 3000);
}