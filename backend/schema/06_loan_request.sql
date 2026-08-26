-- Table: loan_request
-- Depends on: account, transaction
-- NOTE: must be sourced AFTER 08_transaction.sql now (see run_all.sql) —
-- repayment_transaction_id references transaction(transaction_id).
CREATE TABLE loan_request (
    loan_id VARCHAR(50) PRIMARY KEY,
    account_no VARCHAR(30) NOT NULL,
    amount DECIMAL(14,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reviewed_by VARCHAR(50),
    repayment_transaction_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_no) REFERENCES account(account_no),
    FOREIGN KEY (repayment_transaction_id) REFERENCES transaction(transaction_id)
);