-- Table: wallet_transaction
-- Depends on: wallet
-- One row per movement into or out of a wallet. `related_account_no` is set
-- for TOPUP/WITHDRAW (the linked bank account on the other side of the
-- movement); `counterparty_wallet_id` is set for SEND/RECEIVE (a P2P
-- transfer to/from another wallet). Exactly one of the two is populated,
-- never both, depending on `type`.
CREATE TABLE wallet_transaction (
    wallet_txn_id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_id VARCHAR(40) NOT NULL,
    type ENUM('TOPUP', 'WITHDRAW', 'SEND', 'RECEIVE') NOT NULL,
    amount DECIMAL(14,2) NOT NULL,
    related_account_no VARCHAR(30) NULL,
    counterparty_wallet_id VARCHAR(40) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallet(wallet_id)
);
