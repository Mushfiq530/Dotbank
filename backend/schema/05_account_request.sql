-- Table: account_request
-- Depends on: user
CREATE TABLE account_request (
    request_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    account_type VARCHAR(20) NOT NULL,
    initial_deposit DECIMAL(14,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(user_id)
);
