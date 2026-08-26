-- Table: officer_alert
-- Depends on: user
-- System-generated alerts for officers/admins (e.g. an account auto-frozen
-- after repeated failed login attempts). Distinct from `notification`,
-- which is user-facing.
CREATE TABLE officer_alert (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    account_no VARCHAR(30),
    message VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES user(user_id)
);