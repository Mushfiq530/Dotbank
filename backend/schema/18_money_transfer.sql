-- Table: money_transfer
-- Depends on: account
-- Records internal (Dot Bank account -> Dot Bank account) transfers.
-- Referenced by MoneyTransfer::transfer() in the backend, which INSERTs
-- into this table as part of a single DB transaction alongside the
-- sender's withdrawal, the receiver's deposit, and a matching row in
-- `transaction`. This table was previously missing from the schema
-- entirely — no CREATE TABLE existed for it anywhere.
CREATE TABLE money_transfer (
    transfer_id VARCHAR(50) PRIMARY KEY,
    from_account_no VARCHAR(30) NOT NULL,
    to_account_no VARCHAR(30) NOT NULL,
    amount DECIMAL(14,2) NOT NULL,
    transfer_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_account_no) REFERENCES account(account_no),
    FOREIGN KEY (to_account_no) REFERENCES account(account_no)
);