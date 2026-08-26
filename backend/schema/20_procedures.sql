-- Stored procedures for Dot Bank.
-- Depends on: account, money_transfer, bank_to_bank, bank_to_mobile,
--             bill_payment, transaction, loan_request, account_request,
--             deposit_request
-- (must run after all of those exist — see run_all.sql for the required order)
--
-- Every procedure returns an OUT status code instead of raising a SQL
-- error, so PHP can map it to the exact same exception classes it already
-- throws today (AccountFrozenException, InsufficientFundsException, etc.)
-- without needing to parse MySQL error messages.
--
-- NOTE on transaction.review_status: sp_transfer_internal, sp_bank_transfer,
-- sp_mobile_transfer, sp_pay_bill, and sp_repay_loan all just INSERT into
-- `transaction` and let its DEFAULT 'APPROVED' apply. They do NOT set
-- review_status to 'PENDING' for large amounts — that decision already
-- happened in TransactionController (see holdForApproval()/
-- LargeTransactionRequest), so by the time these procedures run, either
-- the amount was under threshold, or an officer already approved it via
-- large_transaction_request. Re-flagging an approved transaction as
-- PENDING here would be a bug, not a feature.

DELIMITER $$

-- ============================================================
-- sp_deposit / sp_withdraw
-- ============================================================

-- p_status OUT values: 'OK' | 'NOT_FOUND' | 'FROZEN' | 'INVALID_AMOUNT'
CREATE PROCEDURE sp_deposit(
    IN p_account_no VARCHAR(30),
    IN p_amount DECIMAL(14,2),
    OUT p_status VARCHAR(20)
)
BEGIN
    DECLARE v_status VARCHAR(20);

    IF p_amount <= 0 THEN
        SET p_status = 'INVALID_AMOUNT';
    ELSE
        SELECT status INTO v_status
        FROM account
        WHERE account_no = p_account_no
        FOR UPDATE;

        IF v_status IS NULL THEN
            SET p_status = 'NOT_FOUND';
        ELSEIF v_status <> 'ACTIVE' THEN
            SET p_status = 'FROZEN';
        ELSE
            UPDATE account
            SET balance = balance + p_amount
            WHERE account_no = p_account_no;

            SET p_status = 'OK';
        END IF;
    END IF;
END$$

-- p_status OUT values: 'OK' | 'NOT_FOUND' | 'FROZEN' | 'INSUFFICIENT' | 'INVALID_AMOUNT'
CREATE PROCEDURE sp_withdraw(
    IN p_account_no VARCHAR(30),
    IN p_amount DECIMAL(14,2),
    OUT p_status VARCHAR(20)
)
BEGIN
    DECLARE v_rows INT;
    DECLARE v_status VARCHAR(20);

    IF p_amount <= 0 THEN
        SET p_status = 'INVALID_AMOUNT';
    ELSE
        UPDATE account
        SET balance = balance - p_amount
        WHERE account_no = p_account_no
          AND balance >= p_amount
          AND status = 'ACTIVE';

        SET v_rows = ROW_COUNT();

        IF v_rows = 0 THEN
            SELECT status INTO v_status
            FROM account
            WHERE account_no = p_account_no;

            IF v_status IS NULL THEN
                SET p_status = 'NOT_FOUND';
            ELSEIF v_status <> 'ACTIVE' THEN
                SET p_status = 'FROZEN';
            ELSE
                SET p_status = 'INSUFFICIENT';
            END IF;
        ELSE
            SET p_status = 'OK';
        END IF;
    END IF;
END$$

-- ============================================================
-- sp_transfer_internal (own-bank account -> account)
-- ============================================================

-- p_status OUT values: 'OK' | 'SAME_ACCOUNT' | 'INVALID_AMOUNT' | 'NOT_FOUND'
--                      | 'SENDER_FROZEN' | 'INSUFFICIENT' | 'RECEIVER_FROZEN'
CREATE PROCEDURE sp_transfer_internal(
    IN p_transfer_id VARCHAR(50),
    IN p_from_account VARCHAR(30),
    IN p_to_account VARCHAR(30),
    IN p_amount DECIMAL(14,2),
    OUT p_status VARCHAR(20),
    OUT p_transaction_id INT
)
BEGIN
    DECLARE v_sender_status VARCHAR(20);
    DECLARE v_sender_balance DECIMAL(14,2);
    DECLARE v_receiver_status VARCHAR(20);

    SET p_transaction_id = NULL;

    IF p_from_account = p_to_account THEN
        SET p_status = 'SAME_ACCOUNT';
    ELSEIF p_amount <= 0 THEN
        SET p_status = 'INVALID_AMOUNT';
    ELSE
        SELECT status, balance INTO v_sender_status, v_sender_balance
        FROM account WHERE account_no = p_from_account FOR UPDATE;

        SELECT status INTO v_receiver_status
        FROM account WHERE account_no = p_to_account FOR UPDATE;

        IF v_sender_status IS NULL OR v_receiver_status IS NULL THEN
            SET p_status = 'NOT_FOUND';
        ELSEIF v_sender_status <> 'ACTIVE' THEN
            SET p_status = 'SENDER_FROZEN';
        ELSEIF v_sender_balance < p_amount THEN
            SET p_status = 'INSUFFICIENT';
        ELSEIF v_receiver_status <> 'ACTIVE' THEN
            SET p_status = 'RECEIVER_FROZEN';
        ELSE
            UPDATE account SET balance = balance - p_amount WHERE account_no = p_from_account;
            UPDATE account SET balance = balance + p_amount WHERE account_no = p_to_account;

            INSERT INTO money_transfer (transfer_id, from_account_no, to_account_no, amount, transfer_time)
            VALUES (p_transfer_id, p_from_account, p_to_account, p_amount, NOW());

            INSERT INTO transaction (account_no, transaction_type, amount, transaction_time)
            VALUES (p_from_account, 'TRANSFER', p_amount, NOW());

            SET p_transaction_id = LAST_INSERT_ID();
            SET p_status = 'OK';
        END IF;
    END IF;
END$$

-- ============================================================
-- sp_bank_transfer (withdrawal to another bank)
-- ============================================================

-- p_status OUT values: 'OK' | 'INVALID_AMOUNT' | 'NOT_FOUND' | 'FROZEN' | 'INSUFFICIENT'
CREATE PROCEDURE sp_bank_transfer(
    IN p_transfer_id VARCHAR(50),
    IN p_from_account VARCHAR(30),
    IN p_receiver_bank VARCHAR(100),
    IN p_receiver_account VARCHAR(30),
    IN p_amount DECIMAL(14,2),
    OUT p_status VARCHAR(20),
    OUT p_transaction_id INT
)
BEGIN
    DECLARE v_rows INT;
    DECLARE v_status VARCHAR(20);

    SET p_transaction_id = NULL;

    IF p_amount <= 0 THEN
        SET p_status = 'INVALID_AMOUNT';
    ELSE
        UPDATE account
        SET balance = balance - p_amount
        WHERE account_no = p_from_account
          AND balance >= p_amount
          AND status = 'ACTIVE';

        SET v_rows = ROW_COUNT();

        IF v_rows = 0 THEN
            SELECT status INTO v_status FROM account WHERE account_no = p_from_account;

            IF v_status IS NULL THEN
                SET p_status = 'NOT_FOUND';
            ELSEIF v_status <> 'ACTIVE' THEN
                SET p_status = 'FROZEN';
            ELSE
                SET p_status = 'INSUFFICIENT';
            END IF;
        ELSE
            INSERT INTO transaction (account_no, transaction_type, amount, transaction_time)
            VALUES (p_from_account, 'TRANSFER', p_amount, NOW());

            SET p_transaction_id = LAST_INSERT_ID();

            INSERT INTO bank_to_bank (transfer_id, transaction_id, receiver_bank, receiver_account)
            VALUES (p_transfer_id, p_transaction_id, p_receiver_bank, p_receiver_account);

            SET p_status = 'OK';
        END IF;
    END IF;
END$$

-- ============================================================
-- sp_mobile_transfer (withdrawal to mobile wallet)
-- ============================================================

-- p_status OUT values: 'OK' | 'INVALID_AMOUNT' | 'NOT_FOUND' | 'FROZEN' | 'INSUFFICIENT'
CREATE PROCEDURE sp_mobile_transfer(
    IN p_transfer_id VARCHAR(50),
    IN p_from_account VARCHAR(30),
    IN p_mobile_number VARCHAR(20),
    IN p_provider VARCHAR(50),
    IN p_amount DECIMAL(14,2),
    OUT p_status VARCHAR(20),
    OUT p_transaction_id INT
)
BEGIN
    DECLARE v_rows INT;
    DECLARE v_status VARCHAR(20);

    SET p_transaction_id = NULL;

    IF p_amount <= 0 THEN
        SET p_status = 'INVALID_AMOUNT';
    ELSE
        UPDATE account
        SET balance = balance - p_amount
        WHERE account_no = p_from_account
          AND balance >= p_amount
          AND status = 'ACTIVE';

        SET v_rows = ROW_COUNT();

        IF v_rows = 0 THEN
            SELECT status INTO v_status FROM account WHERE account_no = p_from_account;

            IF v_status IS NULL THEN
                SET p_status = 'NOT_FOUND';
            ELSEIF v_status <> 'ACTIVE' THEN
                SET p_status = 'FROZEN';
            ELSE
                SET p_status = 'INSUFFICIENT';
            END IF;
        ELSE
            INSERT INTO transaction (account_no, transaction_type, amount, transaction_time)
            VALUES (p_from_account, 'TRANSFER', p_amount, NOW());

            SET p_transaction_id = LAST_INSERT_ID();

            INSERT INTO bank_to_mobile (transfer_id, transaction_id, mobile_number, provider)
            VALUES (p_transfer_id, p_transaction_id, p_mobile_number, p_provider);

            SET p_status = 'OK';
        END IF;
    END IF;
END$$

-- ============================================================
-- sp_pay_bill
-- ============================================================

-- p_status OUT values: 'OK' | 'INVALID_AMOUNT' | 'NOT_FOUND' | 'FROZEN' | 'INSUFFICIENT'
CREATE PROCEDURE sp_pay_bill(
    IN p_payment_id VARCHAR(50),
    IN p_account_no VARCHAR(30),
    IN p_bill_type VARCHAR(30),
    IN p_amount DECIMAL(14,2),
    OUT p_status VARCHAR(20),
    OUT p_transaction_id INT
)
BEGIN
    DECLARE v_rows INT;
    DECLARE v_status VARCHAR(20);

    SET p_transaction_id = NULL;

    IF p_amount <= 0 THEN
        SET p_status = 'INVALID_AMOUNT';
    ELSE
        UPDATE account
        SET balance = balance - p_amount
        WHERE account_no = p_account_no
          AND balance >= p_amount
          AND status = 'ACTIVE';

        SET v_rows = ROW_COUNT();

        IF v_rows = 0 THEN
            SELECT status INTO v_status FROM account WHERE account_no = p_account_no;

            IF v_status IS NULL THEN
                SET p_status = 'NOT_FOUND';
            ELSEIF v_status <> 'ACTIVE' THEN
                SET p_status = 'FROZEN';
            ELSE
                SET p_status = 'INSUFFICIENT';
            END IF;
        ELSE
            INSERT INTO bill_payment (payment_id, account_no, bill_type, amount, payment_time)
            VALUES (p_payment_id, p_account_no, p_bill_type, p_amount, NOW());

            INSERT INTO transaction (account_no, transaction_type, amount, transaction_time)
            VALUES (p_account_no, 'BILL_PAYMENT', p_amount, NOW());

            SET p_transaction_id = LAST_INSERT_ID();
            SET p_status = 'OK';
        END IF;
    END IF;
END$$

-- ============================================================
-- sp_approve_loan / sp_repay_loan
-- ============================================================

-- p_status OUT values: 'OK' | 'NOT_FOUND' | 'ALREADY_REVIEWED' | 'ACCOUNT_NOT_FOUND' | 'FROZEN'
CREATE PROCEDURE sp_approve_loan(
    IN p_loan_id VARCHAR(50),
    IN p_officer_id VARCHAR(50),
    OUT p_status VARCHAR(20)
)
BEGIN
    DECLARE v_loan_status VARCHAR(20);
    DECLARE v_account_no VARCHAR(30);
    DECLARE v_amount DECIMAL(14,2);
    DECLARE v_account_status VARCHAR(20);

    SELECT status, account_no, amount
    INTO v_loan_status, v_account_no, v_amount
    FROM loan_request
    WHERE loan_id = p_loan_id
    FOR UPDATE;

    IF v_loan_status IS NULL THEN
        SET p_status = 'NOT_FOUND';
    ELSEIF v_loan_status <> 'PENDING' THEN
        SET p_status = 'ALREADY_REVIEWED';
    ELSE
        SELECT status INTO v_account_status FROM account WHERE account_no = v_account_no FOR UPDATE;

        IF v_account_status IS NULL THEN
            SET p_status = 'ACCOUNT_NOT_FOUND';
        ELSEIF v_account_status <> 'ACTIVE' THEN
            SET p_status = 'FROZEN';
        ELSE
            UPDATE account SET balance = balance + v_amount WHERE account_no = v_account_no;

            UPDATE loan_request
            SET status = 'APPROVED', reviewed_by = p_officer_id
            WHERE loan_id = p_loan_id;

            SET p_status = 'OK';
        END IF;
    END IF;
END$$

-- p_status OUT values: 'OK' | 'NOT_FOUND' | 'NOT_APPROVED' | 'ACCOUNT_NOT_FOUND'
--                      | 'NOT_OWNER' | 'FROZEN' | 'INSUFFICIENT'
CREATE PROCEDURE sp_repay_loan(
    IN p_loan_id VARCHAR(50),
    IN p_user_id VARCHAR(50),
    OUT p_status VARCHAR(20)
)
BEGIN
    DECLARE v_loan_status VARCHAR(20);
    DECLARE v_account_no VARCHAR(30);
    DECLARE v_amount DECIMAL(14,2);
    DECLARE v_account_user_id VARCHAR(50);
    DECLARE v_account_status VARCHAR(20);
    DECLARE v_account_balance DECIMAL(14,2);
    DECLARE v_transaction_id INT;

    SELECT status, account_no, amount
    INTO v_loan_status, v_account_no, v_amount
    FROM loan_request
    WHERE loan_id = p_loan_id
    FOR UPDATE;

    IF v_loan_status IS NULL THEN
        SET p_status = 'NOT_FOUND';
    ELSEIF v_loan_status <> 'APPROVED' THEN
        SET p_status = 'NOT_APPROVED';
    ELSE
        SELECT user_id, status, balance
        INTO v_account_user_id, v_account_status, v_account_balance
        FROM account
        WHERE account_no = v_account_no
        FOR UPDATE;

        IF v_account_user_id IS NULL THEN
            SET p_status = 'ACCOUNT_NOT_FOUND';
        ELSEIF v_account_user_id <> p_user_id THEN
            SET p_status = 'NOT_OWNER';
        ELSEIF v_account_status <> 'ACTIVE' THEN
            SET p_status = 'FROZEN';
        ELSEIF v_account_balance < v_amount THEN
            SET p_status = 'INSUFFICIENT';
        ELSE
            UPDATE account SET balance = balance - v_amount WHERE account_no = v_account_no;

            INSERT INTO transaction (account_no, transaction_type, amount, transaction_time)
            VALUES (v_account_no, 'LOAN_REPAYMENT', v_amount, NOW());

            SET v_transaction_id = LAST_INSERT_ID();

            UPDATE loan_request
            SET status = 'REPAID', repayment_transaction_id = v_transaction_id
            WHERE loan_id = p_loan_id;

            SET p_status = 'OK';
        END IF;
    END IF;
END$$

-- ============================================================
-- sp_approve_account_request
-- ============================================================

-- p_status OUT values: 'OK' | 'NOT_FOUND' | 'ALREADY_REVIEWED'
CREATE PROCEDURE sp_approve_account_request(
    IN p_request_id VARCHAR(50),
    IN p_officer_id VARCHAR(50),
    IN p_account_no VARCHAR(30),
    OUT p_status VARCHAR(20)
)
BEGIN
    DECLARE v_status VARCHAR(20);
    DECLARE v_user_id VARCHAR(50);
    DECLARE v_account_type VARCHAR(20);
    DECLARE v_initial_deposit DECIMAL(14,2);

    SELECT status, user_id, account_type, initial_deposit
    INTO v_status, v_user_id, v_account_type, v_initial_deposit
    FROM account_request
    WHERE request_id = p_request_id
    FOR UPDATE;

    IF v_status IS NULL THEN
        SET p_status = 'NOT_FOUND';
    ELSEIF v_status <> 'PENDING' THEN
        SET p_status = 'ALREADY_REVIEWED';
    ELSE
        INSERT INTO account (account_no, user_id, balance, account_type, status, handled_by)
        VALUES (p_account_no, v_user_id, v_initial_deposit, v_account_type, 'ACTIVE', p_officer_id);

        UPDATE account_request SET status = 'APPROVED' WHERE request_id = p_request_id;

        SET p_status = 'OK';
    END IF;
END$$

-- ============================================================
-- sp_mark_all_read
-- ============================================================

CREATE PROCEDURE sp_mark_all_read(
    IN p_user_id VARCHAR(50)
)
BEGIN
    UPDATE notification
    SET is_read = TRUE
    WHERE user_id = p_user_id AND is_read = FALSE;
END$$

-- ============================================================
-- sp_approve_deposit_request
-- ============================================================

-- Matches a pending walk-in deposit request to a real account_no and
-- credits it, atomically with the status update — the account link is
-- only ever made here, at approval time.
-- p_status OUT values: 'OK' | 'NOT_FOUND' | 'ALREADY_REVIEWED' | 'ACCOUNT_NOT_FOUND' | 'FROZEN'
CREATE PROCEDURE sp_approve_deposit_request(
    IN p_request_id VARCHAR(50),
    IN p_account_no VARCHAR(30),
    IN p_officer_id VARCHAR(50),
    OUT p_status VARCHAR(20)
)
BEGIN
    DECLARE v_status VARCHAR(20);
    DECLARE v_amount DECIMAL(14,2);
    DECLARE v_account_status VARCHAR(20);

    SELECT status, amount
    INTO v_status, v_amount
    FROM deposit_request
    WHERE request_id = p_request_id
    FOR UPDATE;

    IF v_status IS NULL THEN
        SET p_status = 'NOT_FOUND';
    ELSEIF v_status <> 'PENDING' THEN
        SET p_status = 'ALREADY_REVIEWED';
    ELSE
        SELECT status INTO v_account_status FROM account WHERE account_no = p_account_no FOR UPDATE;

        IF v_account_status IS NULL THEN
            SET p_status = 'ACCOUNT_NOT_FOUND';
        ELSEIF v_account_status <> 'ACTIVE' THEN
            SET p_status = 'FROZEN';
        ELSE
            UPDATE account SET balance = balance + v_amount WHERE account_no = p_account_no;

            INSERT INTO transaction (account_no, transaction_type, amount, transaction_time)
            VALUES (p_account_no, 'DEPOSIT', v_amount, NOW());

            UPDATE deposit_request
            SET status = 'APPROVED', account_no = p_account_no, reviewed_by = p_officer_id
            WHERE request_id = p_request_id;

            SET p_status = 'OK';
        END IF;
    END IF;
END$$

DELIMITER ;