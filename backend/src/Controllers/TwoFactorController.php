<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Exceptions\AuthenticationException;
use App\Exceptions\ValidationException;
use App\Models\Admin;
use App\Models\Officer;
use App\Models\TwoFactorAuth;
use App\Models\User;
use App\Services\TotpService;

final class TwoFactorController
{
    /**
     * Step 1 of setup: generate a fresh secret (not yet active) and return
     * the QR provisioning URI. The frontend renders the QR client-side and
     * the actor scans it with their authenticator app.
     */
    public static function setup(string $actorType, string $actorId, string $accountLabel): array
    {
        $secret = TotpService::generateSecret();
        TwoFactorAuth::beginSetup($actorType, $actorId, $secret);

        return [
            'secret' => $secret, // shown as manual-entry fallback if the QR can't be scanned
            'provisioningUri' => TotpService::provisioningUri($secret, $accountLabel),
        ];
    }

    /**
     * Step 2 of setup: the actor enters the 6-digit code their app just
     * generated. Only on success do we flip enabled=1 — this proves the
     * secret actually made it into a working authenticator before we start
     * requiring it at login.
     */
    public static function confirm(string $actorType, string $actorId, string $code): void
    {
        $record = TwoFactorAuth::find($actorType, $actorId);

        if (!$record) {
            throw new ValidationException('No 2FA setup in progress for this account.');
        }

        if (!TotpService::verify($record->secret, $code)) {
            throw new AuthenticationException('Incorrect code. Check your authenticator app and try again.');
        }

        TwoFactorAuth::confirmEnabled($actorType, $actorId);
    }

    /**
     * Disabling requires the current password, not just an active session —
     * otherwise anyone who can grab a signed-in browser tab could turn off
     * the account's 2FA.
     */
    public static function disable(string $actorType, string $actorId, string $password): void
    {
        $verified = match ($actorType) {
            'USER' => (User::findById($actorId))?->verifyPassword($password) ?? false,
            'OFFICER' => (Officer::findById($actorId))?->verifyPassword($password) ?? false,
            'ADMIN' => (Admin::findById($actorId))?->verifyPassword($password) ?? false,
            default => false,
        };

        if (!$verified) {
            throw new AuthenticationException('Incorrect password.');
        }

        TwoFactorAuth::disable($actorType, $actorId);
    }

    public static function status(string $actorType, string $actorId): array
    {
        return ['enabled' => TwoFactorAuth::isEnabled($actorType, $actorId)];
    }
}
