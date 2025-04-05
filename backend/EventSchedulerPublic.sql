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
    FOREIGN KEY (organizer_id) REFERENCES Users(user_id) ON DELETE SET NULL,
    INDEX idx_date_time (date_time),
    INDEX idx_category (category)
);

-- Event_RSVPs Table
CREATE TABLE Event_RSVPs (
    rsvp_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT,
    user_id INT,
    rsvp_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES Events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_rsvp (event_id, user_id)
);

-- Attendance Table
CREATE TABLE Attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT,
    user_id INT,
    check_in_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES Events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_attendance (event_id, user_id)
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
    UNIQUE KEY unique_feedback (event_id, user_id)
);

-- Waitlist Table (Updated)
CREATE TABLE Waitlist (
    waitlist_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT,
    user_id INT,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    position INT NOT NULL AUTO_INCREMENT, -- Position in queue, auto-incremented per event
    FOREIGN KEY (event_id) REFERENCES Events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_waitlist (event_id, user_id),
    INDEX idx_event_position (event_id, position) -- For efficient retrieval of first in line
) AUTO_INCREMENT = 1;

-- Trigger to Move Waitlist User to RSVP on Unjoin
DELIMITER //
CREATE TRIGGER after_rsvp_delete
AFTER DELETE ON Event_RSVPs
FOR EACH ROW
BEGIN
    DECLARE next_user_id INT;
    DECLARE event_capacity INT;
    DECLARE current_rsvp_count INT;

    -- Get event capacity and current RSVP count
    SELECT max_capacity INTO event_capacity FROM Events WHERE event_id = OLD.event_id;
    SELECT COUNT(*) INTO current_rsvp_count FROM Event_RSVPs WHERE event_id = OLD.event_id;

    -- If there's space after deletion
    IF current_rsvp_count < event_capacity THEN
        -- Get the first user from waitlist
        SELECT user_id INTO next_user_id
        FROM Waitlist
        WHERE event_id = OLD.event_id
        ORDER BY position ASC
        LIMIT 1;

        -- If there's a user in waitlist
        IF next_user_id IS NOT NULL THEN
            -- Add them to RSVP
            INSERT INTO Event_RSVPs (event_id, user_id)
            VALUES (OLD.event_id, next_user_id);
            -- Remove them from waitlist
            DELETE FROM Waitlist WHERE event_id = OLD.event_id AND user_id = next_user_id;
        END IF;
    END IF;
END//
DELIMITER ;