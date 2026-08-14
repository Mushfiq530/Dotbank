-- Table: bank_to_mobile
CREATE TABLE bank_to_mobile (
    transfer_id VARCHAR(50) PRIMARY KEY,
    mobile_number VARCHAR(20) NOT NULL,
    provider VARCHAR(50) NOT NULL
);
