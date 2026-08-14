-- Table: bill_payment
-- Depends on: account
CREATE TABLE bill_payment (
    payment_id VARCHAR(50) PRIMARY KEY,
    account_no VARCHAR(30) NOT NULL,
    bill_type VARCHAR(30) NOT NULL,
    amount DECIMAL(14,2) NOT NULL,
    payment_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_no) REFERENCES account(account_no)
);
