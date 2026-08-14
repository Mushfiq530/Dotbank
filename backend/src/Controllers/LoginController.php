<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Exceptions\AuthenticationException;
use App\Models\Account;
use App\Models\Admin;
use App\Models\LoginAttempt;
use App\Models\Officer;
use App\Models\OfficerAlert;
use App\Models\User;
use App\Models\UserLog;
use App\Support\SessionManager;

final class LoginController
{
    private const MAX_FAILED_ATTEMPTS = 5;

    // A regular user's account gets frozen after this many wrong passwords
    // (counted across all devices, not just one — see LoginAttempt::totalFailedAttempts).
    private const MAX_USER_FAILED_ATTEMPTS_BEFORE_FREEZE = 3;

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
            $userId,
            self::freezeUserAccountsAfterRepeatedFailure(...)
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
     * success. The original code only rate-limited regular users and
     * never regenerated the session id after login.
     *
     * @template T
     * @param callable(): ?T $find
     * @param callable(T): bool $verify
     * @param (callable(string): void)|null $onFailure  extra hook run after
     *        a failed attempt is recorded (currently only used to freeze a
     *        user's account after repeated failures — see userLogin()).
     */
    private static function attemptLogin(
        string $accountType,
        string $accountId,
        string $deviceId,
        callable $find,
        callable $verify,
        string $sessionKey,
        string $sessionValue,
        ?callable $onFailure = null
    ): bool {
        SessionManager::start();

        if (LoginAttempt::failedAttempts($accountType, $accountId, $deviceId) >= self::MAX_FAILED_ATTEMPTS) {
            throw new AuthenticationException('Too many failed attempts. Try again later or reset your password.');
        }

        $account = $find();

        if (!$account || !$verify($account)) {
            LoginAttempt::record($accountType, $accountId, $deviceId, false);

            if ($onFailure) {
                $onFailure($accountId);
            }

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

    /**
     * After 3 wrong passwords (across any device) for a regular user,
     * freeze every account that user owns and raise an alert for
     * officers/admins to review. Idempotent: if the account is already
     * frozen (e.g. the user kept retrying after the freeze already fired),
     * this does nothing further so officers aren't spammed with duplicate
     * alerts for the same lockout.
     */
    private static function freezeUserAccountsAfterRepeatedFailure(string $userId): void
    {
        $failed = LoginAttempt::totalFailedAttempts('USER', $userId);

        if ($failed < self::MAX_USER_FAILED_ATTEMPTS_BEFORE_FREEZE) {
            return;
        }

        $accounts = Account::findAllByUserId($userId);
        $frozenAccountNos = [];

        foreach ($accounts as $account) {
            if ($account->status === 'ACTIVE') {
                $account->block();
                $frozenAccountNos[] = $account->accountNo;
            }
        }

        if ($frozenAccountNos === []) {
            // Nothing to freeze — either the user has no accounts yet,
            // or everything they have was already frozen. Don't re-alert.
            return;
        }

        foreach ($frozenAccountNos as $accountNo) {
            OfficerAlert::create(
                $userId,
                $accountNo,
                "Account {$accountNo} was auto-frozen after 3 failed login attempts."
            );

            try {
                UserLog::log($userId, $accountNo, 'SYSTEM', 'SYSTEM', 'Account frozen after 3 failed login attempts');
            } catch (\Throwable $e) {
                error_log('UserLog::log failed during auto-freeze: ' . $e->getMessage());
            }
        }
    }

    public static function logout(): void
    {
        SessionManager::logout();
    }
}