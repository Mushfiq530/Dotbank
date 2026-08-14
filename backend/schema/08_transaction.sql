-- Table: transaction
-- Depends on: account
CREATE TABLE transaction (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    account_no VARCHAR(30) NOT NULL,
    transaction_type VARCHAR(30) NOT NULL,
    amount DECIMAL(14,2) NOT NULL,
    transaction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    review_status VARCHAR(20) NOT NULL DEFAULT 'APPROVED',
    verified_by VARCHAR(50),
    FOREIGN KEY (account_no) REFERENCES account(account_no)
);
