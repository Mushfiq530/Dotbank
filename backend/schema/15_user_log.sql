-- Table: user_log
CREATE TABLE user_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    account_no VARCHAR(30),
    updated_by_type VARCHAR(20) NOT NULL,
    updated_by_id VARCHAR(50) NOT NULL,
    action_desc VARCHAR(255) NOT NULL,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
