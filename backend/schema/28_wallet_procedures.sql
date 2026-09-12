DELIMITER $$

-- ============================================================
-- sp_wallet_topup — move money from a real account INTO a wallet
-- ============================================================
-- p_status OUT values: 'OK' | 'INVALID_AMOUNT' | 'NOT_FOUND' | 'ACCOUNT_FROZEN'
--                     | 'WALLET_BLOCKED' | 'INSUFFICIENT'
CREATE PROCEDURE sp_wallet_topup(
    IN p_account_no VARCHAR(30),
    IN p_wallet_id VARCHAR(40),
    IN p_amount DECIMAL(14,2),
    OUT p_status VARCHAR(20),
    OUT p_wallet_txn_id INT
)
BEGIN
    DECLARE v_account_status VARCHAR(20);
    DECLARE v_account_balance DECIMAL(14,2);
    DECLARE v_wallet_status VARCHAR(20);

    SET p_wallet_txn_id = NULL;

    IF p_amount <= 0 THEN
        SET p_status = 'INVALID_AMOUNT';
    ELSE
        -- Lock the account first, then the wallet — the same fixed order
        -- every call uses for this procedure, so two concurrent top-ups
        -- (even for different account/wallet pairs) can never deadlock
        -- against each other by acquiring these two locks in reverse order.
        SELECT status, balance INTO v_account_status, v_account_balance
        FROM account WHERE account_no = p_account_no FOR UPDATE;

        SELECT status INTO v_wallet_status
        FROM wallet WHERE wallet_id = p_wallet_id FOR UPDATE;

        IF v_account_status IS NULL OR v_wallet_status IS NULL THEN
            SET p_status = 'NOT_FOUND';
        ELSEIF v_account_status <> 'ACTIVE' THEN
            SET p_status = 'ACCOUNT_FROZEN';
        ELSEIF v_wallet_status <> 'ACTIVE' THEN
            SET p_status = 'WALLET_BLOCKED';
        ELSEIF v_account_balance < p_amount THEN
            SET p_status = 'INSUFFICIENT';
        ELSE
            UPDATE account SET balance = balance - p_amount WHERE account_no = p_account_no;
            UPDATE wallet SET balance = balance + p_amount WHERE wallet_id = p_wallet_id;

            INSERT INTO transaction (account_no, transaction_type, amount, transaction_time)
            VALUES (p_account_no, 'WALLET_TOPUP', p_amount, NOW());

            INSERT INTO wallet_transaction (wallet_id, type, amount, related_account_no, created_at)
            VALUES (p_wallet_id, 'TOPUP', p_amount, p_account_no, NOW());

            SET p_wallet_txn_id = LAST_INSERT_ID();
            SET p_status = 'OK';
        END IF;
    END IF;
END$$

-- ============================================================
-- sp_wallet_withdraw — move money OUT of a wallet, back into a real account
-- ============================================================
-- p_status OUT values: 'OK' | 'INVALID_AMOUNT' | 'NOT_FOUND' | 'ACCOUNT_FROZEN'
--                     | 'WALLET_BLOCKED' | 'INSUFFICIENT'
CREATE PROCEDURE sp_wallet_withdraw(
    IN p_wallet_id VARCHAR(40),
    IN p_account_no VARCHAR(30),
    IN p_amount DECIMAL(14,2),
    OUT p_status VARCHAR(20),
    OUT p_wallet_txn_id INT
)
BEGIN
    DECLARE v_wallet_status VARCHAR(20);
    DECLARE v_wallet_balance DECIMAL(14,2);
    DECLARE v_account_status VARCHAR(20);

    SET p_wallet_txn_id = NULL;

    IF p_amount <= 0 THEN
        SET p_status = 'INVALID_AMOUNT';
    ELSE
        -- Same fixed lock order as sp_wallet_topup (account, then wallet)
        -- even though the money flows the opposite direction here — what
        -- matters for deadlock-freedom is that every procedure touching
        -- both tables always locks them in the same order, not which
        -- direction the balance moves.
        SELECT status INTO v_account_status
        FROM account WHERE account_no = p_account_no FOR UPDATE;

        SELECT status, balance INTO v_wallet_status, v_wallet_balance
        FROM wallet WHERE wallet_id = p_wallet_id FOR UPDATE;

        IF v_account_status IS NULL OR v_wallet_status IS NULL THEN
            SET p_status = 'NOT_FOUND';
        ELSEIF v_account_status <> 'ACTIVE' THEN
            SET p_status = 'ACCOUNT_FROZEN';
        ELSEIF v_wallet_status <> 'ACTIVE' THEN
            SET p_status = 'WALLET_BLOCKED';
        ELSEIF v_wallet_balance < p_amount THEN
            SET p_status = 'INSUFFICIENT';
        ELSE
            UPDATE wallet SET balance = balance - p_amount WHERE wallet_id = p_wallet_id;
            UPDATE account SET balance = balance + p_amount WHERE account_no = p_account_no;

            INSERT INTO transaction (account_no, transaction_type, amount, transaction_time)
            VALUES (p_account_no, 'WALLET_WITHDRAW', p_amount, NOW());

            INSERT INTO wallet_transaction (wallet_id, type, amount, related_account_no, created_at)
            VALUES (p_wallet_id, 'WITHDRAW', p_amount, p_account_no, NOW());

            SET p_wallet_txn_id = LAST_INSERT_ID();
            SET p_status = 'OK';
        END IF;
    END IF;
END$$

-- ============================================================
-- sp_wallet_transfer — wallet-to-wallet (peer-to-peer)
-- ============================================================
-- p_status OUT values: 'OK' | 'INVALID_AMOUNT' | 'SAME_WALLET' | 'NOT_FOUND'
--                     | 'SENDER_BLOCKED' | 'RECEIVER_BLOCKED' | 'INSUFFICIENT'
CREATE PROCEDURE sp_wallet_transfer(
    IN p_transfer_id VARCHAR(50),
    IN p_from_wallet VARCHAR(40),
    IN p_to_wallet VARCHAR(40),
    IN p_amount DECIMAL(14,2),
    OUT p_status VARCHAR(20),
    OUT p_wallet_txn_id INT
)
BEGIN
    DECLARE v_sender_status VARCHAR(20);
    DECLARE v_sender_balance DECIMAL(14,2);
    DECLARE v_receiver_status VARCHAR(20);
    DECLARE v_first VARCHAR(40);
    DECLARE v_second VARCHAR(40);

    SET p_wallet_txn_id = NULL;

    IF p_from_wallet = p_to_wallet THEN
        SET p_status = 'SAME_WALLET';
    ELSEIF p_amount <= 0 THEN
        SET p_status = 'INVALID_AMOUNT';
    ELSE
        -- Deadlock avoidance: two wallets transferring to each other at the
        -- same time (A->B and B->A concurrently) would deadlock if each
        -- transaction locked "sender first" — one holds A waiting for B,
        -- the other holds B waiting for A. Locking in a fixed order based
        -- on the wallet_id values themselves (not "who's sending") means
        -- both transactions try to lock the same wallet first, so the
        -- second one simply waits instead of deadlocking.
        IF p_from_wallet < p_to_wallet THEN
            SET v_first = p_from_wallet;
            SET v_second = p_to_wallet;
        ELSE
            SET v_first = p_to_wallet;
            SET v_second = p_from_wallet;
        END IF;

        SELECT status FROM wallet WHERE wallet_id = v_first FOR UPDATE;
        SELECT status FROM wallet WHERE wallet_id = v_second FOR UPDATE;

        SELECT status, balance INTO v_sender_status, v_sender_balance
        FROM wallet WHERE wallet_id = p_from_wallet;

        SELECT status INTO v_receiver_status
        FROM wallet WHERE wallet_id = p_to_wallet;

        IF v_sender_status IS NULL OR v_receiver_status IS NULL THEN
            SET p_status = 'NOT_FOUND';
        ELSEIF v_sender_status <> 'ACTIVE' THEN
            SET p_status = 'SENDER_BLOCKED';
        ELSEIF v_receiver_status <> 'ACTIVE' THEN
            SET p_status = 'RECEIVER_BLOCKED';
        ELSEIF v_sender_balance < p_amount THEN
            SET p_status = 'INSUFFICIENT';
        ELSE
            UPDATE wallet SET balance = balance - p_amount WHERE wallet_id = p_from_wallet;
            UPDATE wallet SET balance = balance + p_amount WHERE wallet_id = p_to_wallet;

            INSERT INTO wallet_transaction (wallet_id, type, amount, counterparty_wallet_id, created_at)
            VALUES (p_from_wallet, 'SEND', p_amount, p_to_wallet, NOW());

            INSERT INTO wallet_transaction (wallet_id, type, amount, counterparty_wallet_id, created_at)
            VALUES (p_to_wallet, 'RECEIVE', p_amount, p_from_wallet, NOW());

            SET p_wallet_txn_id = LAST_INSERT_ID();
            SET p_status = 'OK';
        END IF;
    END IF;
END$$

DELIMITER ;
