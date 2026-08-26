-- Table: deposit_request
-- Depends on: account
-- A walk-in cash deposit an officer takes in at the counter. The
-- depositor may not be a Dot Bank user themselves (hence requester_name
-- as free text, not a user FK) — an officer records the intake, and a
-- second officer/admin matches it to the actual account_no and approves
-- it, crediting that account. account_no is NULL until approval.
CREATE TABLE deposit_request (
    request_id VARCHAR(50) PRIMARY KEY,
    requester_name VARCHAR(150) NOT NULL,
    source VARCHAR(100) NOT NULL,
    amount DECIMAL(14,2) NOT NULL,
    account_no VARCHAR(30),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reviewed_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_no) REFERENCES account(account_no)
);