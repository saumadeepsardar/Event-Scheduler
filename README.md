Virtual Event Scheduler with Attendance Insights
Overview
The Virtual Event Scheduler with Attendance Insights is a web application designed to manage and track events. Users can browse events, RSVP (requires login), check in, submit feedback, and organizers can create events and view attendance analytics. The application features a responsive front-end built with HTML, CSS, and JavaScript, a Node.js/Express back-end, and a MySQL database (EventSchedulerPublic).

Key Features
Public Access: Browse events, view details, and explore the calendar without logging in.
User Authentication: Login required for RSVPing, checking in, submitting feedback, managing profiles, and creating events.
Event Management: Filterable event grid, calendar view, RSVP system, check-in with code, and feedback submission.
Analytics: Attendance insights for organizers via a bar chart.
Responsive Design: Mobile-friendly with animations and accessibility features.
Prerequisites
Node.js (v16+ recommended): For running the back-end.
MySQL (v8+ recommended): For the database.
Web Browser: For accessing the front-end (e.g., Chrome, Firefox).
A code editor (e.g., VS Code) with a live server extension (optional).
Setup Instructions
1. Clone or Download the Project
Clone the repository or download the project files into a local directory:
bash

Collapse

Wrap

Copy
git clone <repository-url>
cd virtual-event-scheduler
2. Database Setup
Install MySQL if not already installed.
Open your MySQL client (e.g., MySQL Workbench, CLI) and run the following SQL script to create the EventSchedulerPublic database:
sql

Collapse

Wrap

Copy
-- Create Database
CREATE DATABASE EventSchedulerPublic;
USE EventSchedulerPublic;

-- Users Table
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    major VARCHAR(50),
    year INT,
    role ENUM('student', 'organizer', 'admin') DEFAULT 'student'
);

-- Events Table
CREATE TABLE Events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date_time DATETIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    category VARCHAR(50),
    max_capacity INT NOT NULL,
    organizer_id INT,
    recurrence VARCHAR(50),
    check_in_code VARCHAR(50),
    FOREIGN KEY (organizer_id) REFERENCES Users(user_id) ON DELETE SET NULL
);

-- Event_RSVPs Table
CREATE TABLE Event_RSVPs (
    rsvp_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT,
    user_id INT,
    rsvp_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES Events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    UNIQUE (event_id, user_id)
);

-- Attendance Table
CREATE TABLE Attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT,
    user_id INT,
    check_in_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES Events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    UNIQUE (event_id, user_id)
);

-- Feedback Table
CREATE TABLE Feedback (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT,
    user_id INT,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comments TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES Events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    UNIQUE (event_id, user_id)
);

-- Waitlist Table
CREATE TABLE Waitlist (
    waitlist_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT,
    user_id INT,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    position INT NOT NULL,
    FOREIGN KEY (event_id) REFERENCES Events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    UNIQUE (event_id, user_id)
);

-- Indexes
CREATE INDEX idx_date_time ON Events(date_time);
CREATE INDEX idx_category ON Events(category);
CREATE INDEX idx_user_id ON Event_RSVPs(user_id);
Update the database connection details in backend/db.js:
javascript

Collapse

Wrap

Copy
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root', // Replace with your MySQL username
  password: 'your_password', // Replace with your MySQL password
  database: 'EventSchedulerPublic'
});
3. Back-End Setup
Navigate to the backend/ directory:
bash

Collapse

Wrap

Copy
cd backend
Install dependencies:
bash

Collapse

Wrap

Copy
npm install
Start the server:
bash

Collapse

Wrap

Copy
npm start
The server will run on http://localhost:5000.
4. Front-End Setup
Navigate to the frontend/ directory:
bash

Collapse

Wrap

Copy
cd frontend
Serve the files using a local server:
If using VS Code, install the Live Server extension and open index.html with it.
Alternatively, use a simple HTTP server like http-server:
bash

Collapse

Wrap

Copy
npm install -g http-server
http-server
Access the site at http://localhost:8080 (or the port provided).
File Structure
text

Collapse

Wrap

Copy
virtual-event-scheduler/
├── backend/
│   ├── server.js         # Node.js/Express back-end
│   ├── db.js            # MySQL database connection
│   └── package.json     # Back-end dependencies
├── frontend/
│   ├── index.html       # Event dashboard with calendar and analytics
│   ├── event-details.html # Event details page with RSVP/check-in/feedback
│   ├── login.html       # Login page
│   ├── signup.html      # Signup page
│   ├── profile.html     # Profile management page
│   ├── create-event.html # Event creation page
│   ├── styles.css       # Styling for the application
│   └── script.js        # JavaScript logic (not included here)
└── README.md            # Project documentation
Usage
General Access
Browse Events: Open index.html to view the dashboard with a filterable event grid and calendar. No login required.
View Event Details: Click "View Details" on any event to see more information on event-details.html.
User Actions (Requires Login)
Sign Up: Go to signup.html, enter your details, and create an account.
Log In: Go to login.html, enter your credentials, and log in.
RSVP to an Event: On event-details.html, click "Join" (redirects to login if not authenticated), then RSVP if capacity allows.
Check-In: After RSVPing, enter the check-in code (provided by the organizer) on event-details.html.
Submit Feedback: Post-check-in, submit a rating and comments on event-details.html.
Manage Profile: Visit profile.html to update your name, major, and year (requires login).
Create Event: If an organizer, go to create-event.html to add a new event (requires login).
Organizer Features
Analytics: On index.html, organizers see a bar chart of attendance stats (requires login and organizer role).
Event Creation: Use create-event.html to schedule events (requires login and organizer role).
Notes
Database: The application uses EventSchedulerPublic with tables for users, events, RSVPs, attendance, feedback, and waitlist.
Authentication: Uses JWT tokens stored in localStorage. Login is optional for browsing but required for RSVPing and other actions.
External Libraries:
FullCalendar (index.html) for the calendar view.
Chart.js (index.html) for analytics visualization.
Security: Passwords are hashed with bcrypt in the back-end. Use HTTPS in production.
Customization:
Change the SECRET_KEY in server.js to a secure value.
Adjust the check-in code generation in server.js for production use (currently random).
Troubleshooting
Server Not Starting: Ensure MySQL is running and db.js credentials are correct.
CORS Errors: Verify the back-end is running on http://localhost:5000 and CORS is enabled.
Blank Dashboard: Check if events are in the database and the back-end API is accessible.
Login Fails: Confirm user data exists in the Users table and credentials match.
Future Enhancements
Real-Time Updates: Add WebSockets (e.g., Socket.IO) for live RSVP and attendance updates.
OAuth: Integrate Google login for easier authentication.
QR Check-In: Implement QR code scanning for in-person events.
Notifications: Add email or in-app reminders for upcoming events.
Feel free to contribute or reach out for support! Enjoy scheduling and tracking your events with this tool.