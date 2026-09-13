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

    /**
     * Generates a brand-new OTP right now for (accountType, accountId,
     * purpose) and sends it over SMS. Any previous unused code for the same
     * actor+purpose is invalidated first, so at most one code is ever "live"
     * per action — codes are never pre-generated or pooled ahead of time.
     */
    public static function createOtp(string $accountType, string $accountId, string $mobile): string
    {
        return self::createAndSend(
            $accountType,
            $accountId,
            purpose: 'PASSWORD_RESET',
            channel: 'SMS',
            target: $mobile
        );
    }

    /**
     * Generates and emails a fresh OTP for a sensitive, already-logged-in
     * action (changing the password, disabling 2FA, or confirming a new
     * email address during an email change). $purpose must be one of the
     * `otp.purpose` enum values other than PASSWORD_RESET.
     */
    public static function createEmailOtp(
        string $accountType,
        string $accountId,
        string $purpose,
        string $email
    ): string {
        return self::createAndSend(
            $accountType,
            $accountId,
            $purpose,
            channel: 'EMAIL',
            target: $email
        );
    }

    /**
     * Core generation step shared by every OTP flow: invalidate whatever
     * unused code currently exists for this (actor, purpose), generate a
     * new one at this exact instant, store it, then dispatch it over the
     * requested channel.
     */
    private static function createAndSend(
        string $accountType,
        string $accountId,
        string $purpose,
        string $channel,
        string $target
    ): string {
        $conn = Database::getConnection();

        // Invalidate any earlier unused code for this actor+purpose so only
        // the code we're about to generate can ever be verified.
        $conn->prepare(
            'UPDATE otp SET used = TRUE
             WHERE account_type = ? AND account_id = ? AND purpose = ? AND used = FALSE'
        )->execute([$accountType, $accountId, $purpose]);

        $otp = self::generateOtp();

        $stmt = $conn->prepare(
            'INSERT INTO otp (account_type, account_id, purpose, channel, target, otp_code, expires_at)
             VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))'
        );
        $stmt->execute([$accountType, $accountId, $purpose, $channel, $target, $otp]);

        if ($channel === 'EMAIL') {
            MailService::sendOtpEmail($target, $otp, $purpose);
        } else {
            SmsService::sendSms($target, "Verification Code: {$otp}");
        }

        return $otp;
    }

    /**
     * Atomically verifies and consumes an OTP in one statement: marks it
     * used only if it was valid, unused, unexpired, and issued for this
     * exact purpose — returning whether that update actually applied.
     * Doing the check and the "mark used" as two separate steps would leave
     * a race where the same OTP could be verified twice in quick succession
     * before either request got around to marking it used.
     */
    public static function consumeOtp(
        string $accountType,
        string $accountId,
        string $otp,
        string $purpose = 'PASSWORD_RESET'
    ): bool {
        $stmt = Database::getConnection()->prepare(
            'UPDATE otp
             SET used = TRUE
             WHERE account_type = ?
               AND account_id = ?
               AND otp_code = ?
               AND purpose = ?
               AND used = FALSE
               AND expires_at > NOW()'
        );
        $stmt->execute([$accountType, $accountId, $otp, $purpose]);

        return $stmt->rowCount() > 0;
    }

    /**
     * For EMAIL_CHANGE_NEW_ADDRESS specifically: looks up the pending new
     * email address that was stamped onto the most recent OTP row for this
     * actor, without consuming it. Callers verify the code first (via
     * consumeOtp), then call this to find out which address to actually
     * write onto the user record.
     */
    public static function peekTarget(string $accountType, string $accountId, string $purpose, string $otp): ?string
    {
        $stmt = Database::getConnection()->prepare(
            'SELECT target FROM otp
             WHERE account_type = ? AND account_id = ? AND purpose = ? AND otp_code = ?
             ORDER BY id DESC LIMIT 1'
        );
        $stmt->execute([$accountType, $accountId, $purpose, $otp]);
        $target = $stmt->fetchColumn();

        return $target === false ? null : $target;
    }
}
