-- Triggers for Dot Bank.
-- Depends on: login_attempt, account, officer_alert, user_log
-- (must run after all of those exist)
--
-- trg_login_attempt_after_insert replaces
-- LoginController::freezeUserAccountsAfterRepeatedFailure(), which used
-- to run manually from PHP after every failed login. Now it fires
-- automatically the moment a failed attempt is inserted into
-- login_attempt, no matter which code path does the insert.
--
-- Behavior is a 1:1 match with the old PHP method:
--   - only applies to account_type = 'USER' (officers/admins are exempt,
--     same as before)
--   - only counts FAILED attempts, across all devices (matches
--     LoginAttempt::totalFailedAttempts())
--   - freezes every ACTIVE account owned by that user once the failed
--     count reaches 3
--   - idempotent: if an account is already BLOCKED, it's skipped, so a
--     4th/5th/etc. failed attempt does not create duplicate alerts or
--     duplicate log rows for an account already frozen
--   - inserts one officer_alert + one user_log row per newly-frozen account

DELIMITER $$

CREATE TRIGGER trg_login_attempt_after_insert
AFTER INSERT ON login_attempt
FOR EACH ROW
BEGIN
    DECLARE v_failed_count INT;
    DECLARE v_done INT DEFAULT 0;
    DECLARE v_account_no VARCHAR(30);
    DECLARE v_account_status VARCHAR(20);

    DECLARE cur CURSOR FOR
        SELECT account_no, status FROM account WHERE user_id = NEW.user_id;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

    IF NEW.account_type = 'USER' AND NEW.success = 0 THEN
        SELECT COUNT(*) INTO v_failed_count
        FROM login_attempt
        WHERE account_type = 'USER' AND user_id = NEW.user_id AND success = 0;

        IF v_failed_count >= 3 THEN
            OPEN cur;

            freeze_loop: LOOP
                FETCH cur INTO v_account_no, v_account_status;
                IF v_done THEN
                    LEAVE freeze_loop;
                END IF;

                IF v_account_status = 'ACTIVE' THEN
                    UPDATE account SET status = 'BLOCKED' WHERE account_no = v_account_no;

                    INSERT INTO officer_alert (user_id, account_no, message, created_at, is_read)
                    VALUES (
                        NEW.user_id,
                        v_account_no,
                        CONCAT('Account ', v_account_no, ' was auto-frozen after 3 failed login attempts.'),
                        NOW(),
                        FALSE
                    );

                    INSERT INTO user_log (user_id, account_no, updated_by_type, updated_by_id, action_desc, logged_at)
                    VALUES (
                        NEW.user_id,
                        v_account_no,
                        'SYSTEM',
                        'SYSTEM',
                        'Account frozen after 3 failed login attempts',
                        NOW()
                    );
                END IF;
            END LOOP;

            CLOSE cur;
        END IF;
    END IF;
END$$

DELIMITER ;