-- Table: bank_to_bank
-- Depends on: transaction
-- NOTE: must be sourced AFTER 08_transaction.sql (see run_all.sql).
CREATE TABLE bank_to_bank (
    transfer_id VARCHAR(50) PRIMARY KEY,
    transaction_id INT NOT NULL,
    receiver_bank VARCHAR(100) NOT NULL,
    receiver_account VARCHAR(30) NOT NULL,
    FOREIGN KEY (transaction_id) REFERENCES transaction(transaction_id)
);