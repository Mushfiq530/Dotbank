<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;

/**
 * Tracks failed login attempts per (account type, account id, device).
 *
 * The original code only rate-limited regular users; officer and admin
 * logins had no brute-force protection at all. This version covers all
 * three actor types via an `account_type` column.
 *
 * Requires an `account_type VARCHAR(10) NOT NULL DEFAULT 'USER'` column
 * on the `login_attempt` table (see README for the migration).
 */
final class LoginAttempt
{
    public static function record(
        string $accountType,
        string $accountId,
        string $deviceId,
        bool $success
    ): void {
        $stmt = Database::getConnection()->prepare(
            'INSERT INTO login_attempt (account_type, user_id, device_id, success, attempt_time)
             VALUES (?, ?, ?, ?, NOW())'
        );
        $stmt->execute([$accountType, $accountId, $deviceId, $success]);
    }

    public static function failedAttempts(
        string $accountType,
        string $accountId,
        string $deviceId
    ): int {
        $stmt = Database::getConnection()->prepare(
            'SELECT COUNT(*) total FROM login_attempt
             WHERE account_type = ? AND user_id = ? AND device_id = ? AND success = FALSE'
        );
        $stmt->execute([$accountType, $accountId, $deviceId]);

        return (int) $stmt->fetch()['total'];
    }

    /**
     * Failed attempts for this account across ALL devices — used for the
     * "freeze the account after 3 wrong passwords" rule, since limiting
     * this to a single device would let someone bypass it just by
     * switching devices/browsers between attempts.
     */
    public static function totalFailedAttempts(
        string $accountType,
        string $accountId
    ): int {
        $stmt = Database::getConnection()->prepare(
            'SELECT COUNT(*) total FROM login_attempt
             WHERE account_type = ? AND user_id = ? AND success = FALSE'
        );
        $stmt->execute([$accountType, $accountId]);

        return (int) $stmt->fetch()['total'];
    }

    public static function clearAttempts(
        string $accountType,
        string $accountId,
        string $deviceId
    ): void {
        $stmt = Database::getConnection()->prepare(
            'DELETE FROM login_attempt WHERE account_type = ? AND user_id = ? AND device_id = ?'
        );
        $stmt->execute([$accountType, $accountId, $deviceId]);
    }
}