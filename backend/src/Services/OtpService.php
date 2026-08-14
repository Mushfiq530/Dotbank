<?php

declare(strict_types=1);

namespace App\Services;

use App\Config\Database;

final class OtpService
{
    public static function generateOtp(): string
    {
        return (string) random_int(100000, 999999);
    }

    public static function createOtp(string $accountType, string $accountId, string $mobile): string
    {
        $otp = self::generateOtp();

        $stmt = Database::getConnection()->prepare(
            'INSERT INTO otp (account_type, account_id, otp_code, expires_at)
             VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))'
        );
        $stmt->execute([$accountType, $accountId, $otp]);

        SmsService::sendSms($mobile, "Verification Code: {$otp}");

        return $otp;
    }

    /**
     * Atomically verifies and consumes an OTP in one statement: marks it
     * used only if it was valid, unused, and unexpired, returning whether
     * that update actually applied. Doing the check and the "mark used"
     * as two separate steps (as the original code did) left a race where
     * the same OTP could be verified twice in quick succession before
     * either request got around to marking it used.
     */
    public static function consumeOtp(string $accountType, string $accountId, string $otp): bool
    {
        $stmt = Database::getConnection()->prepare(
            'UPDATE otp
             SET used = TRUE
             WHERE account_type = ?
               AND account_id = ?
               AND otp_code = ?
               AND used = FALSE
               AND expires_at > NOW()'
        );
        $stmt->execute([$accountType, $accountId, $otp]);

        return $stmt->rowCount() > 0;
    }
}
