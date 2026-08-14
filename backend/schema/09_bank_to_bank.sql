-- Table: bank_to_bank
CREATE TABLE bank_to_bank (
    transfer_id VARCHAR(50) PRIMARY KEY,
    receiver_bank VARCHAR(100) NOT NULL,
    receiver_account VARCHAR(30) NOT NULL
);
