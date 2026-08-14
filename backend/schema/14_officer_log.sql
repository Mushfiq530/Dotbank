-- Table: officer_log
CREATE TABLE officer_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    officer_id VARCHAR(50) NOT NULL,
    officer_name VARCHAR(150) NOT NULL,
    action_desc VARCHAR(255) NOT NULL,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
