<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Exceptions\AuthenticationException;
use App\Exceptions\NotFoundException;
use App\Exceptions\ValidationException;
use App\Models\TwoFactorAuth;
use App\Models\User;
use App\Services\TotpService;
use App\Support\Validator;

/**
 * Change-email flow for a logged-in user.
 *
 * Blocked entirely unless 2FA is already enabled on the account. Once
 * enabled, a valid authenticator (TOTP) code is enough to change the email
 * immediately — no separate emailed OTP step. (An earlier version of this
 * also emailed a confirmation code to the new address and gated password
 * changes / 2FA disable behind emailed OTPs; that was intentionally
 * simplified back out.)
 */
final class SecurityController
{
    private const ACTOR_TYPE = 'USER';

    public static function changeEmail(string $userId, string $totpCode, string $newEmail): void
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
