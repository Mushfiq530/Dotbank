-- Table: large_transaction_request
-- Depends on: user, account
-- A withdrawal / bank transfer / mobile transfer / bill payment whose amount
-- exceeds 1,00,000 and therefore needs officer approval before the money
-- actually moves. Nothing is debited from the account until an officer
-- approves the request (see TransactionController::approveLargeTransaction).
CREATE TABLE large_transaction_request (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_type VARCHAR(20) NOT NULL,   -- BANK_TRANSFER | MOBILE_TRANSFER | BILL_PAYMENT
    user_id VARCHAR(50) NOT NULL,
    account_no VARCHAR(30) NOT NULL,
    amount DECIMAL(14,2) NOT NULL,
    payload TEXT NOT NULL,               -- JSON: receiver bank/account, mobile/provider, or bill type
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reviewed_by VARCHAR(50),
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(user_id),
    FOREIGN KEY (account_no) REFERENCES account(account_no)
);