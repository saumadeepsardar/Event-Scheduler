// Dummy data (replace with API calls)
const events = [
  { id: 1, title: 'CS Club Hackathon', date: '2025-04-10 18:00', location: 'Zoom', category: 'Tech', description: 'Join us for a coding marathon!', capacity: 50, rsvpCount: 42 },
  { id: 2, title: 'Career Workshop', date: '2025-04-12 14:00', location: 'Room 101', category: 'Career', description: 'Prepare for your future!', capacity: 30, rsvpCount: 25 },
];

// Dummy user storage (replace with actual back-end)
const users = JSON.parse(localStorage.getItem('users')) || [];

// Authentication Functions
function handleSignup(event) {
  event.preventDefault();
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;

  // Simulate API call (replace with fetch to /signup)
  if (users.some(user => user.email === email)) {
    alert('Email already registered!');
    return;
  }

  const newUser = { name, email, password }; // In real app, hash password server-side
  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));
  localStorage.setItem('loggedInUser', email);
  alert('Signup successful! Redirecting to dashboard...');
  window.location.href = 'index.html';
}

function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  // Simulate API call (replace with fetch to /login)
  const user = users.find(user => user.email === email && user.password === password);
  if (user) {
    localStorage.setItem('loggedInUser', email);
    alert('Login successful! Redirecting to dashboard...');
    window.location.href = 'index.html';
  } else {
    alert('Invalid email or password!');
  }
}

function handleLogout() {
  localStorage.removeItem('loggedInUser');
  updateNav();
  window.location.href = 'login.html';
}

function checkAuth() {
  const loggedInUser = localStorage.getItem('loggedInUser');
  if (!loggedInUser && !window.location.pathname.includes('login.html') && !window.location.pathname.includes('signup.html')) {
    window.location.href = 'login.html';
  }
  updateNav();
}

function updateNav() {
  const loggedInUser = localStorage.getItem('loggedInUser');
  const loginLink = document.getElementById('loginLink');
  const logoutLink = document.getElementById('logoutLink');
  const profileLink = document.getElementById('profileLink');

  if (loggedInUser) {
    loginLink.style.display = 'none';
    logoutLink.style.display = 'inline';
    profileLink.textContent = `Welcome, ${users.find(u => u.email === loggedInUser).name}`;
    logoutLink.addEventListener('click', handleLogout);
  } else {
    loginLink.style.display = 'inline';
    logoutLink.style.display = 'none';
    profileLink.textContent = 'Profile';
  }
}

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