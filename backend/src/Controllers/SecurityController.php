<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Exceptions\AuthenticationException;
use App\Exceptions\NotFoundException;
use App\Exceptions\ValidationException;
use App\Models\TwoFactorAuth;
use App\Models\User;
use App\Services\OtpService;
use App\Services\TotpService;
use App\Support\Validator;

/**
 * Email-OTP-gated flows for sensitive, already-logged-in user actions.
 * Regular login is deliberately untouched by any of this — these only
 * apply once someone is already signed in and wants to change something
 * that matters (password, 2FA, or the email address itself).
 *
 * Scoped to USER accounts only for now: Officer has an email but no
 * existing self-service "change password"/2FA-management surface, and
 * Admin has no email column at all, so extending this to those actor
 * types would need its own design pass.
 */
final class SecurityController
{
    private const ACTOR_TYPE = 'USER';

    // ---------- Change password ----------

    public static function requestPasswordChangeOtp(string $userId): void
    {
        $user = self::findUserOrFail($userId);
        OtpService::createEmailOtp(self::ACTOR_TYPE, $userId, 'PASSWORD_CHANGE', $user->email);
    }

    public static function confirmPasswordChange(
        string $userId,
        string $otp,
        string $newPassword,
        string $confirmPassword
    ): void {
        Validator::matches($newPassword, $confirmPassword, 'New passwords do not match.');
        Validator::passwordStrength($newPassword);

        if (!OtpService::consumeOtp(self::ACTOR_TYPE, $userId, $otp, 'PASSWORD_CHANGE')) {
            throw new AuthenticationException('Invalid or expired code.');
        }

        $user = self::findUserOrFail($userId);
        $user->resetPassword($newPassword);
    }

    // ---------- Disable 2FA ----------
    // (On top of the existing password check in TwoFactorController::disable —
    // this adds the email-OTP step in front of it.)

    public static function requestTwoFactorDisableOtp(string $userId): void
    {
        $user = self::findUserOrFail($userId);
        OtpService::createEmailOtp(self::ACTOR_TYPE, $userId, 'TWO_FACTOR_DISABLE', $user->email);
    }

    public static function confirmTwoFactorDisable(string $userId, string $password, string $otp): void
    {
        $user = self::findUserOrFail($userId);

        if (!$user->verifyPassword($password)) {
            throw new AuthenticationException('Incorrect password.');
        }

        if (!OtpService::consumeOtp(self::ACTOR_TYPE, $userId, $otp, 'TWO_FACTOR_DISABLE')) {
            throw new AuthenticationException('Invalid or expired code.');
        }

        TwoFactorAuth::disable(self::ACTOR_TYPE, $userId);
    }

    // ---------- Change email ----------
    // Step 1: verify the user's existing 2FA code (proves it's really them).
    // Step 2: send a fresh OTP to the NEW address (proves it's reachable/real).
    // Only after both succeed does the email actually change.

    /**
     * Step 1. Blocked entirely if 2FA isn't enabled yet — the user must set
     * that up first. On success, generates and emails the OTP to $newEmail;
     * nothing on the account changes yet.
     */
    public static function requestEmailChange(string $userId, string $totpCode, string $newEmail): void
    {
        $twoFactor = TwoFactorAuth::find(self::ACTOR_TYPE, $userId);

        if ($twoFactor === null || !$twoFactor->enabled) {
            throw new ValidationException(
                'Two-factor authentication must be enabled before you can change your email.'
            );
        }

        if (!TotpService::verify($twoFactor->secret, $totpCode)) {
            throw new AuthenticationException('Incorrect authenticator code.');
        }

        Validator::email($newEmail);

        $user = self::findUserOrFail($userId);
        if (strcasecmp($newEmail, $user->email) === 0) {
            throw new ValidationException('That is already your current email address.');
        }

        OtpService::createEmailOtp(self::ACTOR_TYPE, $userId, 'EMAIL_CHANGE_NEW_ADDRESS', $newEmail);
    }

    /**
     * Step 2. Verifies the code that was sent to the new address, and only
     * then writes it onto the user's account.
     */
    public static function confirmEmailChange(string $userId, string $otp): void
    {
        if (!OtpService::consumeOtp(self::ACTOR_TYPE, $userId, $otp, 'EMAIL_CHANGE_NEW_ADDRESS')) {
            throw new AuthenticationException('Invalid or expired code.');
        }

        $newEmail = OtpService::peekTarget(self::ACTOR_TYPE, $userId, 'EMAIL_CHANGE_NEW_ADDRESS', $otp);
        if ($newEmail === null) {
            // Shouldn't happen (consumeOtp just succeeded for this code),
            // but fail safe rather than write a null/empty email.
            throw new AuthenticationException('Could not determine the pending email address. Please try again.');
        }

        $user = self::findUserOrFail($userId);
        $user->updateEmail($newEmail);
    }

    private static function findUserOrFail(string $userId): User
    {
        $user = User::findById($userId);
        if (!$user) {
            throw new NotFoundException('User not found.');
        }
        return $user;
    }
}
