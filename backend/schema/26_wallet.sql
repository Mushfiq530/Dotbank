-- Table: wallet
-- Depends on: user
-- Each user has at most one DotBank Wallet — an internal e-wallet balance
-- separate from their bank account(s). Money moves between a wallet and a
-- real account via top-up/withdraw, or between two wallets directly
-- (person-to-person, no bank account details needed on either side).
CREATE TABLE wallet (
    wallet_id VARCHAR(40) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL UNIQUE,
    balance DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    status ENUM('ACTIVE', 'BLOCKED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(user_id)
);
