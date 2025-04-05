const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(express.json());
app.use(cors());

const SECRET_KEY = 'your-secret-key'; // Replace with a secure key
const PORT = 5000;

// Middleware to authenticate token
function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
}

// Register (Public)
app.post('/api/v1/register', async (req, res) => {
  const { name, email, password } = req.body;

  // Validate input
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const password_hash = await bcrypt.hash(password, 10);

  try {
    const [result] = await db.execute(
      'INSERT INTO Users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, password_hash]
    );
    res.status(201).json({ user_id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Server error during signup' });
    }
  }
});

// Login (Public)
app.post('/api/v1/login', async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const [rows] = await db.execute('SELECT * FROM Users WHERE email = ?', [email]);
  const user = rows[0];

  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  if (!(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  const token = jwt.sign({ user_id: user.user_id, role: user.role }, SECRET_KEY);
  res.json({ token, name: user.name, role: user.role });
});

// Admin: Add Organizer/Admin (Protected, Admin Only)
app.post('/api/v1/admin/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden - Admin only' });

  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required' });
  }
  if (!['organizer', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role - must be organizer or admin' });
  }

  const password_hash = await bcrypt.hash(password, 10);

  try {
    const [result] = await db.execute(
      'INSERT INTO Users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, password_hash, role]
    );
    res.status(201).json({ user_id: result.insertId, message: 'User added successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Server error during user creation' });
    }
  }
});

// Get User Profile (Protected)
app.get('/api/v1/users/me', authenticateToken, async (req, res) => {
  const [rows] = await db.execute('SELECT user_id, name, email, major, year, role FROM Users WHERE user_id = ?', [req.user.user_id]);
  res.json(rows[0]);
});

// Update User Profile (Protected)
app.put('/api/v1/users/me', authenticateToken, async (req, res) => {
  const { name, major, year } = req.body;
  await db.execute(
    'UPDATE Users SET name = ?, major = ?, year = ? WHERE user_id = ?',
    [name, major || null, year || null, req.user.user_id]
  );
  res.status(200).json({ message: 'Profile updated' });
});

// Create Event (Protected, Organizer or Admin Only)
app.post('/api/v1/events', authenticateToken, async (req, res) => {
  if (req.user.role !== 'organizer' && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  const { title, description, date_time, location, category, max_capacity, recurrence } = req.body;
  const check_in_code = Math.random().toString(36).substring(2, 15); // Random code

  const [result] = await db.execute(
    'INSERT INTO Events (title, description, date_time, location, category, max_capacity, organizer_id, recurrence, check_in_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [title, description, date_time, location, category, max_capacity, req.user.user_id, recurrence || null, check_in_code]
  );
  res.status(201).json({ event_id: result.insertId });
});

// Get All Events (Public)
app.get('/api/v1/events', async (req, res) => {
  const [rows] = await db.execute(`
    SELECT e.*, COUNT(r.rsvp_id) as rsvp_count, u.name as organizer
    FROM Events e
    LEFT JOIN Event_RSVPs r ON e.event_id = r.event_id
    LEFT JOIN Users u ON e.organizer_id = u.user_id
    GROUP BY e.event_id
  `);
  res.json(rows);
});

// Get Event Details (Public)
app.get('/api/v1/events/:id', async (req, res) => {
  const [rows] = await db.execute(
    'SELECT e.*, COUNT(r.rsvp_id) as rsvp_count, u.name as organizer FROM Events e LEFT JOIN Event_RSVPs r ON e.event_id = r.event_id LEFT JOIN Users u ON e.organizer_id = u.user_id WHERE e.event_id = ? GROUP BY e.event_id',
    [req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Event not found' });
  res.json(rows[0]);
});

// RSVP to Event (Protected)
app.post('/api/v1/events/:id/rsvp', authenticateToken, async (req, res) => {
  const eventId = req.params.id;
  const userId = req.user.user_id;

  const [eventRows] = await db.execute('SELECT max_capacity, (SELECT COUNT(*) FROM Event_RSVPs WHERE event_id = ?) as rsvp_count FROM Events WHERE event_id = ?', [eventId, eventId]);
  if (eventRows[0].rsvp_count >= eventRows[0].max_capacity) return res.status(400).json({ error: 'Event is full' });

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
  const { code } = req.body;
  const [eventRows] = await db.execute('SELECT check_in_code FROM Events WHERE event_id = ?', [req.params.id]);
  if (eventRows[0].check_in_code !== code) return res.status(400).json({ error: 'Invalid check-in code' });

  try {
    await db.execute('INSERT INTO Attendance (event_id, user_id) VALUES (?, ?)', [req.params.id, req.user.user_id]);
    res.status(201).json({ message: 'Checked in successfully' });
  } catch (err) {
    res.status(400).json({ error: 'Already checked in or must RSVP first' });
  }
});

// Check Attendance Status (Protected)
app.get('/api/v1/events/:id/check-in', authenticateToken, async (req, res) => {
  const [rows] = await db.execute('SELECT * FROM Attendance WHERE event_id = ? AND user_id = ?', [req.params.id, req.user.user_id]);
  res.json({ hasAttended: rows.length > 0 });
});

// Submit Feedback (Protected)
app.post('/api/v1/events/:id/feedback', authenticateToken, async (req, res) => {
  const { rating, comments } = req.body;
  try {
    await db.execute(
      'INSERT INTO Feedback (event_id, user_id, rating, comments) VALUES (?, ?, ?, ?)',
      [req.params.id, req.user.user_id, rating, comments || null]
    );
    res.status(201).json({ message: 'Feedback submitted' });
  } catch (err) {
    res.status(400).json({ error: 'Feedback already submitted' });
  }
});

// Get Attendance Analytics (Protected, Organizer/Admin Only)
app.get('/api/v1/analytics/attendance', authenticateToken, async (req, res) => {
  if (req.user.role !== 'organizer' && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  const [rows] = await db.execute(`
    SELECT e.title, COUNT(a.attendance_id) as attendance_count
    FROM Events e
    LEFT JOIN Attendance a ON e.event_id = a.event_id
    WHERE e.organizer_id = ?
    GROUP BY e.event_id, e.title
  `, [req.user.user_id]);
  res.json(rows);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));