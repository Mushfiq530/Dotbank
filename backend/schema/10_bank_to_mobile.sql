-- Table: bank_to_mobile
-- Depends on: transaction
-- NOTE: must be sourced AFTER 08_transaction.sql (see run_all.sql).
CREATE TABLE bank_to_mobile (
    transfer_id VARCHAR(50) PRIMARY KEY,
    transaction_id INT NOT NULL,
    mobile_number VARCHAR(20) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    FOREIGN KEY (transaction_id) REFERENCES transaction(transaction_id)
);