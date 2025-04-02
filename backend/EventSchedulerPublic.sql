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