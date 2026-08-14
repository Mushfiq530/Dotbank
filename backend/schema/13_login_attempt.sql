-- Table: login_attempt
CREATE TABLE login_attempt (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_type VARCHAR(20) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    device_id VARCHAR(100) NOT NULL,
    success TINYINT(1) NOT NULL,
    attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
