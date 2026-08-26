<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Exceptions\AuthenticationException;
use App\Models\Admin;
use App\Models\LoginAttempt;
use App\Models\Officer;
use App\Models\User;
use App\Support\SessionManager;

final class LoginController
{
    private const MAX_FAILED_ATTEMPTS = 5;

    public static function userLogin(string $userId, string $password, string $deviceId): bool
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

    public static function officerLogin(string $officerId, string $password, string $deviceId = 'web'): bool
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

    public static function adminLogin(string $adminId, string $password, string $deviceId = 'web'): bool
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
     */
    private static function attemptLogin(
        string $accountType,
        string $accountId,
        string $deviceId,
        callable $find,
        callable $verify,
        string $sessionKey,
        string $sessionValue
    ): bool {
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
        SessionManager::regenerate();

        // Clear any leftover role from a previous login in this browser
        // session before setting the new one — otherwise currentRole()
        // in index.php picks whichever role key it checks first.
        unset($_SESSION['user_id'], $_SESSION['officer_id'], $_SESSION['admin_id']);
        $_SESSION[$sessionKey] = $sessionValue;

        return true;
    }

    public static function logout(): void
    {
        SessionManager::logout();
    }
}