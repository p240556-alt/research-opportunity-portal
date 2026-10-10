-- Research Opportunity Portal: database setup
-- Run this file once in MySQL Workbench to create the database and table.

CREATE DATABASE IF NOT EXISTS research_portal;

USE research_portal;

CREATE TABLE IF NOT EXISTS opportunities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    research_area VARCHAR(100) NOT NULL,
    faculty_name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    required_skills VARCHAR(255) NOT NULL,
    available_positions INT NOT NULL,
    application_deadline DATE NOT NULL,
    status ENUM('Open', 'Closed') NOT NULL DEFAULT 'Open'
);