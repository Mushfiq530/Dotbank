<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Models\AccountRequest;
use App\Models\LoanReq;
use App\Models\Notification;
use App\Models\OfficerLog;
use App\Models\Transaction;

final class OfficerController
{
    public static function approveAccount(string $requestId, string $officerId, string $officerName): void
    {
        $userId = self::getAccountRequestUserId($requestId);
        $accountNo = AccountRequest::approve($requestId, $officerId);
        OfficerLog::log($officerId, $officerName, 'Approved account request');

        if ($userId) {
            self::notifySafely($userId, "Your account request was approved. New account: {$accountNo}.");
        }
    }

    public static function denyAccount(string $requestId, string $officerId, string $officerName): void
    {
        $userId = self::getAccountRequestUserId($requestId);
        AccountRequest::deny($requestId);
        OfficerLog::log($officerId, $officerName, 'Denied account request');

        if ($userId) {
            self::notifySafely($userId, 'Your account request was denied.');
        }
    }

    public static function approveLoan(string $loanId, string $officerId, string $officerName): void
    {
        $accountNo = self::getLoanAccountNo($loanId);
        LoanReq::approve($loanId, $officerId);
        OfficerLog::log($officerId, $officerName, 'Approved loan');

        if ($accountNo) {
            self::notifyByAccountNo($accountNo, "Your loan request ({$loanId}) was approved and credited to account {$accountNo}.");
        }
    }

    public static function denyLoan(string $loanId, string $officerId, string $officerName): void
    {
        $accountNo = self::getLoanAccountNo($loanId);
        LoanReq::deny($loanId, $officerId);
        OfficerLog::log($officerId, $officerName, 'Denied loan');

        if ($accountNo) {
            self::notifyByAccountNo($accountNo, "Your loan request ({$loanId}) was denied.");
        }
    }

    public static function approveTransaction(int $transactionId, string $officerId): void
    {
        Transaction::approve($transactionId, $officerId);
    }

    private static function getAccountRequestUserId(string $requestId): ?string
    {
        $stmt = Database::getConnection()->prepare('SELECT user_id FROM account_request WHERE request_id = ?');
        $stmt->execute([$requestId]);
        $row = $stmt->fetch();

        return $row['user_id'] ?? null;
    }

    private static function getLoanAccountNo(string $loanId): ?string
    {
        $stmt = Database::getConnection()->prepare('SELECT account_no FROM loan_request WHERE loan_id = ?');
        $stmt->execute([$loanId]);
        $row = $stmt->fetch();

        return $row['account_no'] ?? null;
    }

    private static function notifyByAccountNo(string $accountNo, string $message): void
    {
        $stmt = Database::getConnection()->prepare('SELECT user_id FROM account WHERE account_no = ?');
        $stmt->execute([$accountNo]);
        $row = $stmt->fetch();

        if ($row) {
            self::notifySafely($row['user_id'], $message);
        }
    }

    private static function notifySafely(string $userId, string $message): void
    {
        try {
            Notification::create($userId, $message);
        } catch (\Throwable $e) {
            error_log('Notification::create failed: ' . $e->getMessage());
        }
    }
}