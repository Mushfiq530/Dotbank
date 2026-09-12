-- Table: support_message
-- Depends on: support_ticket
-- One row per message in a ticket's thread. sender_type/sender_id together
-- identify who wrote it (a user, or the officer/admin who replied) without
-- needing three separate nullable foreign keys.
CREATE TABLE support_message (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id VARCHAR(50) NOT NULL,
    sender_type ENUM('USER', 'OFFICER', 'ADMIN') NOT NULL,
    sender_id VARCHAR(50) NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES support_ticket(ticket_id) ON DELETE CASCADE
);
