<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Exceptions\AuthenticationException;
use App\Models\Admin;
use App\Models\LoginAttempt;
use App\Models\Officer;
use App\Models\TwoFactorAuth;
use App\Models\User;
use App\Support\SessionManager;

final class LoginController
{
    private const MAX_FAILED_ATTEMPTS = 5;

    public static function userLogin(string $userId, string $password, string $deviceId): bool|string
    {
        return self::attemptLogin(
            'USER',
            $userId,
            $deviceId,
            fn () => User::findById($userId),
            function (User $user) use ($password) {
                return $user->verifyPassword($password);
            },
            'user_id',
            $userId
        );
    }

    public static function officerLogin(string $officerId, string $password, string $deviceId = 'web'): bool|string
    {
        return self::attemptLogin(
            'OFFICER',
            $officerId,
            $deviceId,
            fn () => Officer::findById($officerId),
            function (Officer $officer) use ($password) {
                return $officer->verifyPassword($password);
            },
            'officer_id',
            $officerId
        );
    }

    public static function adminLogin(string $adminId, string $password, string $deviceId = 'web'): bool|string
    {
        return self::attemptLogin(
            'ADMIN',
            $adminId,
            $deviceId,
            fn () => Admin::findById($adminId),
            function (Admin $admin) use ($password) {
                return $admin->verifyPassword($password);
            },
            'admin_id',
            $adminId
        );
    }

    /**
     * Shared login flow for all three actor types: consistent brute-force
     * lockout, and session-fixation protection via ID regeneration on
     * success.
     *
     * Note: the "freeze a user's account after 3 failed attempts" logic
     * that used to run from here (see the old
     * freezeUserAccountsAfterRepeatedFailure() private method) has moved
     * to trg_login_attempt_after_insert in the database (21_triggers.sql).
     * It now fires automatically the moment LoginAttempt::record() inserts
     * a failed attempt below — this method no longer needs to trigger it
     * manually.
     *
     * @template T
     * @param callable(): ?T $find
     * @param callable(T): bool $verify
     * @return bool|string true = fully logged in, false = wrong credentials,
     *                      '2fa_required' = password correct, waiting on a TOTP code
     */
    private static function attemptLogin(
        string $accountType,
        string $accountId,
        string $deviceId,
        callable $find,
        callable $verify,
        string $sessionKey,
        string $sessionValue
    ): bool|string {
        SessionManager::start();

        if (LoginAttempt::failedAttempts($accountType, $accountId, $deviceId) >= self::MAX_FAILED_ATTEMPTS) {
            throw new AuthenticationException('Too many failed attempts. Try again later or reset your password.');
        }

        $account = $find();

        if (!$account || !$verify($account)) {
            LoginAttempt::record($accountType, $accountId, $deviceId, false);

            return false;
        }

        LoginAttempt::clearAttempts($accountType, $accountId, $deviceId);

        if (TwoFactorAuth::isEnabled($accountType, $accountId)) {
            // Password is correct, but don't grant a real session yet —
            // stash a pending marker and make the frontend collect a TOTP
            // code before we call regenerate()/set the session key below.
            SessionManager::regenerate();
            unset($_SESSION['user_id'], $_SESSION['officer_id'], $_SESSION['admin_id']);
            $_SESSION['pending_2fa'] = [
                'type' => $accountType,
                'sessionKey' => $sessionKey,
                'sessionValue' => $sessionValue,
            ];

            return '2fa_required';
        }

        SessionManager::regenerate();

        // Clear any leftover role from a previous login in this browser
        // session before setting the new one — otherwise currentRole()
        // in index.php picks whichever role key it checks first.
        unset($_SESSION['user_id'], $_SESSION['officer_id'], $_SESSION['admin_id']);
        $_SESSION[$sessionKey] = $sessionValue;

        return true;
    }

    /**
     * Completes a login that was paused for 2FA. Called from
     * POST /login/verify-2fa once the actor submits their code.
     */
    public static function verifyTwoFactor(string $code): bool
    {
        SessionManager::start();

        $pending = $_SESSION['pending_2fa'] ?? null;
        if (!$pending) {
            throw new AuthenticationException('No login is waiting for a 2FA code.');
        }

        $record = \App\Models\TwoFactorAuth::find($pending['type'], $pending['sessionValue']);
        if (!$record || !\App\Services\TotpService::verify($record->secret, $code)) {
            return false;
        }

        unset($_SESSION['pending_2fa']);
        $_SESSION[$pending['sessionKey']] = $pending['sessionValue'];

        return true;
    }

    public static function logout(): void
    {
        SessionManager::logout();
    }
}