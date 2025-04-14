# Virtual Event Scheduler with Attendance Insights

## Overview
The Virtual Event Scheduler with Attendance Insights is a web application for managing events, tracking attendance, and collecting feedback. It features a frontend (HTML, CSS, JavaScript) and a backend (Node.js with MySQL). Users can register, create events, RSVP, check in, join waitlists, and provide feedback.

This project runs locally at `http://localhost:5000`. The repository includes:
- `frontend/`: Static files (HTML, CSS, `script.js`).
- `backend/`: Node.js server (`server.js`, `db.js`).
- Documentation: LaTeX guide with setup instructions and ER diagram (`er_diagram.png`).

## Features
- User authentication (register, login).
- Event creation and management.
- RSVP and waitlist functionality.
- Check-in system with codes.
- Feedback submission with ratings.
- Dashboard with event listings.

## Prerequisites
Before setting up, install:
- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org) (v18+ with npm)
- [MySQL](https://dev.mysql.com/downloads/):
  - Windows: Use XAMPP.
  - macOS: `brew install mysql`.
  - Linux: `sudo apt-get install mysql-server`.
- A text editor (e.g., [VS Code](https://code.visualstudio.com)).
- A web browser.

## Setup Instructions
Follow these steps to clone and run the project locally.

### 1. Clone the Repository
```bash
git clone <repository-url>
cd event-scheduler
```
Replace `<repository-url>` with this repository’s URL (e.g., `https://github.com/username/event-scheduler.git`).

### 2. Install Backend Dependencies
```bash
cd backend
npm install express mysql2 bcrypt jsonwebtoken cors
```

### 3. Set Up MySQL Database
1. Start MySQL:
   - macOS:
     ```bash
     mysql.server start
     ```
   - Windows: Start MySQL in XAMPP Control Panel.
   - Linux:
     ```bash
     sudo systemctl start mysql
     ```
2. Log in to MySQL:
   ```bash
   mysql -u root -p
   ```
   Enter your root password (leave blank if none).
3. Create the database:
   ```sql
   CREATE DATABASE EventSchedulerPublic;
   ```
4. Create tables:
   ```sql
   USE EventSchedulerPublic;
   CREATE TABLE Users (
       user_id INT AUTO_INCREMENT PRIMARY KEY,
       name VARCHAR(255),
       email VARCHAR(255) UNIQUE,
       password_hash VARCHAR(255),
       role ENUM('attendee', 'organizer', 'admin') DEFAULT 'attendee',
       major VARCHAR(100),
       year VARCHAR(50)
   );
   CREATE TABLE Events (
       event_id INT AUTO_INCREMENT PRIMARY KEY,
       title VARCHAR(255) NOT NULL,
       description TEXT,
       date_time DATETIME NOT NULL,
       location VARCHAR(255),
       category VARCHAR(100),
       max_capacity INT,
       organizer_id INT,
       recurrence VARCHAR(50),
       check_in_code VARCHAR(50)
   );
   CREATE TABLE Event_RSVPs (
       rsvp_id INT AUTO_INCREMENT PRIMARY KEY,
       event_id INT,
       user_id INT
   );
   CREATE TABLE Attendance (
       attendance_id INT AUTO_INCREMENT PRIMARY KEY,
       event_id INT,
       user_id INT
   );
   CREATE TABLE Waitlist (
       waitlist_id INT AUTO_INCREMENT PRIMARY KEY,
       event_id INT,
       user_id INT,
       position INT
   );
   CREATE TABLE Feedback (
       feedback_id INT AUTO_INCREMENT PRIMARY KEY,
       event_id INT,
       user_id INT,
       rating INT,
       comments TEXT
   );
   ```
5. Insert test data:
   ```sql
   INSERT INTO Users (name, email, password_hash, role)
   VALUES ('Admin', 'admin@example.com', '$2b$10$examplehash', 'admin');
   INSERT INTO Events (title, date_time, location, category, max_capacity, organizer_id, check_in_code)
   VALUES ('Test Event', '2025-04-20 10:00:00', 'Online', 'Workshop', 50, 1, 'test123');
   ```
6. Exit MySQL:
   ```sql
   EXIT;
   ```

### 4. Configure Backend
Ensure `backend/db.js` is:
```javascript
const mysql = require('mysql2/promise');
module.exports = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', // Update with your MySQL password
    database: 'EventSchedulerPublic'
});
```
Update `password` if your MySQL root has one.

### 5. Start Backend
```bash
node server.js
```
Output: `Server running on port 5000`.

Test the API:
- Open `http://localhost:5000/api/v1/events` in a browser.
- Expect: `[]` or `[{"event_id": 1, "title": "Test Event", ...}]`.

### 6. Set Up Frontend
```bash
cd ../frontend
npm install -g http-server
http-server -p 5000
```
If permission denied (macOS/Linux):
```bash
sudo npm install -g http-server
```

Open `http://localhost:5000` in a browser.

### 7. Verify
- Dashboard should show events (e.g., "Test Event") or "No events found".
- Open Developer Tools (F12):
  - **Network**: Check `api/v1/events` has status `200`.
  - **Console**: No errors.

### Troubleshooting
- **Backend Fails**:
  - Reinstall: `npm install`.
  - Check `db.js` credentials.
- **Database Errors**:
  - Verify MySQL:
    ```bash
    mysql -u root -p
    SHOW DATABASES;
    ```
  - Check tables:
    ```sql
    USE EventSchedulerPublic;
    SHOW TABLES;
    ```
- **CORS Errors**:
  - Use `http-server -p 5000`, not `file://`.
- **"Failed to load events!"**:
  - Ensure backend is running.
  - Verify `Events` table:
    ```sql
    SELECT * FROM Events;
    ```

## Documentation
A detailed LaTeX document (`project_documentation.tex`) is included, covering:
- Setup instructions.
- Database schema with ER diagram (`er_diagram.png`).
- Key code and user flow.

To compile:
```bash
pdflatex project_documentation.tex
```
Ensure `er_diagram.png` is in the same directory.

## Usage
- Register/login at `http://localhost:5000`.
- Create/view events.
- RSVP, check in, or submit feedback.

## Notes
- The test admin user (`admin@example.com`) has a placeholder password hash. Register a new user to log in.
- Keep backend and frontend servers running in separate terminals.
- Contact maintainers for support.
