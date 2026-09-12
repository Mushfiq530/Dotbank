-- Table: support_ticket
-- Depends on: user
-- A ticket belongs to exactly one user; officers/admins reply to it without
-- "owning" it themselves — any officer/admin can see and respond to any ticket.
CREATE TABLE support_ticket (
    ticket_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    subject VARCHAR(150) NOT NULL,
    status ENUM('OPEN', 'ANSWERED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(user_id)
);
