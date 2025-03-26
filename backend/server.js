const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const SECRET_KEY = 'your_secret_key'; // Replace with a secure key

// Middleware to verify JWT (for protected routes only)
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Login required' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// User Registration
app.post('/api/v1/register', async (req, res) => {
  const { name, email, password, major, year } = req.body;
  const password_hash = await bcrypt.hash(password, 10);

  try {
    const [result] = await db.execute(
      'INSERT INTO Users (name, email, password_hash, major, year, role) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, password_hash, major || null, year || null, 'student']
    );
    res.status(201).json({ user_id: result.insertId });
  } catch (err) {
    res.status(400).json({ error: 'Email already exists' });
  }
});

// User Login
app.post('/api/v1/login', async (req, res) => {
  const { email, password } = req.body;

  const [rows] = await db.execute('SELECT * FROM Users WHERE email = ?', [email]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ user_id: user.user_id, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
  res.json({ token, name: user.name, role: user.role });
});

// Get User Profile (Protected)
app.get('/api/v1/users/me', authenticateToken, async (req, res) => {
  const [rows] = await db.execute('SELECT * FROM Users WHERE user_id = ?', [req.user.user_id]);
  res.json(rows[0]);
});

// Update User Profile (Protected)
app.put('/api/v1/users/me', authenticateToken, async (req, res) => {
  const { name, major, year } = req.body;
  await db.execute(
    'UPDATE Users SET name = ?, major = ?, year = ? WHERE user_id = ?',
    [name, major || null, year || null, req.user.user_id]
  );
  res.json({ message: 'Profile updated' });
});

// Get All Events (Public)
app.get('/api/v1/events', async (req, res) => {
  const [rows] = await db.execute(
    'SELECT e.*, COUNT(r.rsvp_id) as rsvp_count, u.name as organizer FROM Events e LEFT JOIN Event_RSVPs r ON e.event_id = r.event_id LEFT JOIN Users u ON e.organizer_id = u.user_id GROUP BY e.event_id'
  );
  res.json(rows);
});

// Get Event Details (Public)
app.get('/api/v1/events/:id', async (req, res) => {
  const [rows] = await db.execute(
    'SELECT e.*, COUNT(r.rsvp_id) as rsvp_count, u.name as organizer FROM Events e LEFT JOIN Event_RSVPs r ON e.event_id = r.event_id LEFT JOIN Users u ON e.organizer_id = u.user_id WHERE e.event_id = ? GROUP BY e.event_id',
    [req.params.id]
  );
  res.json(rows[0] || { error: 'Event not found' });
});

// Create Event (Protected, Organizer Only)
app.post('/api/v1/events', authenticateToken, async (req, res) => {
  if (req.user.role !== 'organizer') return res.status(403).json({ error: 'Forbidden' });

  const { title, description, date_time, location, category, max_capacity, recurrence } = req.body;
  const check_in_code = Math.random().toString(36).substring(2, 15); // Random code

  const [result] = await db.execute(
    'INSERT INTO Events (title, description, date_time, location, category, max_capacity, organizer_id, recurrence, check_in_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [title, description, date_time, location, category, max_capacity, req.user.user_id, recurrence || null, check_in_code]
  );
  res.status(201).json({ event_id: result.insertId });
});

// RSVP to Event (Protected)
app.post('/api/v1/events/:id/rsvp', authenticateToken, async (req, res) => {
  const eventId = req.params.id;
  const userId = req.user.user_id;

  const [event] = await db.execute('SELECT max_capacity, (SELECT COUNT(*) FROM Event_RSVPs WHERE event_id = ?) as rsvp_count FROM Events WHERE event_id = ?', [eventId, eventId]);
  if (!event[0]) return res.status(404).json({ error: 'Event not found' });

  if (event[0].rsvp_count >= event[0].max_capacity) {
    await db.execute('INSERT INTO Waitlist (event_id, user_id, position) VALUES (?, ?, ?)', [eventId, userId, event[0].rsvp_count + 1]);
    return res.status(201).json({ message: 'Added to waitlist' });
  }

  try {
    await db.execute('INSERT INTO Event_RSVPs (event_id, user_id) VALUES (?, ?)', [eventId, userId]);
    res.status(201).json({ message: 'RSVP successful' });
  } catch (err) {
    res.status(400).json({ error: 'Already RSVPed' });
  }
});

// Check RSVP Status (Protected)
app.get('/api/v1/events/:id/rsvp', authenticateToken, async (req, res) => {
  const [rows] = await db.execute('SELECT * FROM Event_RSVPs WHERE event_id = ? AND user_id = ?', [req.params.id, req.user.user_id]);
  res.json({ hasRSVPd: rows.length > 0 });
});

// Check-In to Event (Protected)
app.post('/api/v1/events/:id/check-in', authenticateToken, async (req, res) => {
  const eventId = req.params.id;
  const userId = req.user.user_id;
  const { code } = req.body;

  const [event] = await db.execute('SELECT check_in_code FROM Events WHERE event_id = ?', [eventId]);
  if (!event[0] || code !== event[0].check_in_code) return res.status(400).json({ error: 'Invalid code' });

  const [rsvp] = await db.execute('SELECT * FROM Event_RSVPs WHERE event_id = ? AND user_id = ?', [eventId, userId]);
  if (!rsvp[0]) return res.status(403).json({ error: 'Must RSVP first' });

  try {
    await db.execute('INSERT INTO Attendance (event_id, user_id) VALUES (?, ?)', [eventId, userId]);
    res.json({ message: 'Checked in' });
  } catch (err) {
    res.status(400).json({ error: 'Already checked in' });
  }
});

// Check Attendance Status (Protected)
app.get('/api/v1/events/:id/check-in', authenticateToken, async (req, res) => {
  const [rows] = await db.execute('SELECT * FROM Attendance WHERE event_id = ? AND user_id = ?', [req.params.id, req.user.user_id]);
  res.json({ hasAttended: rows.length > 0 });
});

// Submit Feedback (Protected)
app.post('/api/v1/events/:id/feedback', authenticateToken, async (req, res) => {
  const eventId = req.params.id;
  const userId = req.user.user_id;
  const { rating, comments } = req.body;

  const [attendance] = await db.execute('SELECT * FROM Attendance WHERE event_id = ? AND user_id = ?', [eventId, userId]);
  if (!attendance[0]) return res.status(403).json({ error: 'Must attend to submit feedback' });

  try {
    await db.execute('INSERT INTO Feedback (event_id, user_id, rating, comments) VALUES (?, ?, ?, ?)', [eventId, userId, rating, comments || null]);
    res.json({ message: 'Feedback submitted' });
  } catch (err) {
    res.status(400).json({ error: 'Feedback already submitted' });
  }
});

// Get Analytics (Protected, Organizer Only)
app.get('/api/v1/analytics/attendance', authenticateToken, async (req, res) => {
  if (req.user.role !== 'organizer') return res.status(403).json({ error: 'Forbidden' });

  const [rows] = await db.execute(
    'SELECT e.title, COUNT(a.attendance_id) as attendance_count FROM Events e LEFT JOIN Attendance a ON e.event_id = a.event_id GROUP BY e.event_id'
  );
  res.json(rows);
});

app.listen(5000, () => console.log('Server running on port 5000'));