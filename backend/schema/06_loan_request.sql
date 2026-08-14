-- Table: loan_request
-- Depends on: account
CREATE TABLE loan_request (
    loan_id VARCHAR(50) PRIMARY KEY,
    account_no VARCHAR(30) NOT NULL,
    amount DECIMAL(14,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reviewed_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_no) REFERENCES account(account_no)
);
