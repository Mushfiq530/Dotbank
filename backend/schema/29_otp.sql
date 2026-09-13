-- One-time codes used for SMS-based password reset AND email-based
-- verification of sensitive actions (disabling 2FA, changing password,
-- confirming an email change).
--
-- NOTE: this table was previously referenced by App\Services\OtpService
-- but had no schema file anywhere, so it never actually got created by
-- run_all.sql. This file fixes that gap and extends the original design
-- with `purpose` and `channel`/`target`, so a code issued for one action
-- (e.g. disabling 2FA) can never be replayed against a different action
-- (e.g. changing the email) even if it belongs to the same account.
--
-- Every code is single-use (`used`) and short-lived (`expires_at`). Codes
-- are never pre-generated: application code always generates a brand-new
-- one at the exact moment an action is requested, and invalidates any
-- previous unused code for the same (actor, purpose) first.
CREATE TABLE IF NOT EXISTS otp (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    account_type ENUM('USER', 'OFFICER', 'ADMIN') NOT NULL,
    account_id VARCHAR(64) NOT NULL,

    -- What this code is for. 'PASSWORD_RESET' is the original SMS forgot-
    -- password flow. The others are new, email-delivered, and only apply
    -- to an already-logged-in actor confirming a sensitive action.
    purpose ENUM(
        'PASSWORD_RESET',
        'PASSWORD_CHANGE',
        'TWO_FACTOR_DISABLE',
        'EMAIL_CHANGE_NEW_ADDRESS'
    ) NOT NULL,

    channel ENUM('SMS', 'EMAIL') NOT NULL DEFAULT 'SMS',

    -- Where the code was actually sent (mobile number or email address) at
    -- the moment it was generated. Kept for audit purposes and, for
    -- EMAIL_CHANGE_NEW_ADDRESS, this doubles as the pending new email: once
    -- the code is verified, the caller copies this value onto user.email.
    target VARCHAR(191) NOT NULL,

    otp_code VARCHAR(6) NOT NULL,
    used TINYINT(1) NOT NULL DEFAULT 0,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    KEY idx_otp_lookup (account_type, account_id, purpose, used, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
