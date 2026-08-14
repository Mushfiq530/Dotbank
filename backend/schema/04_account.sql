-- Table: account
-- Depends on: user
CREATE TABLE account (
    account_no VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    balance DECIMAL(14,2) NOT NULL DEFAULT 0,
    account_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    handled_by VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES user(user_id)
);
