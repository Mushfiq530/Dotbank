-- Table: admin
CREATE TABLE admin (
    admin_id VARCHAR(50) PRIMARY KEY,
    password VARCHAR(255) NOT NULL
);

-- Seed admin so you can log in immediately: admin_id "admin", password "admin123"
-- (bcrypt hash below verifies correctly against PHP's password_verify()).
-- If you ever want to change it, run this and swap the hash:
--   php -r "echo password_hash('your-new-password', PASSWORD_DEFAULT);"
INSERT INTO admin (admin_id, password) VALUES
('admin', '$2b$12$cj7yKN1/vqisTW9w52960O7Mdt3wV8f/9ODACTxtCD3IJU9VQ4pIC');
