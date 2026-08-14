<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use App\Exceptions\NotFoundException;
use App\Exceptions\ValidationException;

final class AccountRequest
{
    public static function create(
        string $requestId,
        string $userId,
        string $accountType,
        float $initialDeposit
    ): void {
        if ($initialDeposit < 0) {
            throw new ValidationException('Initial deposit cannot be negative.');
        }

        $stmt = Database::getConnection()->prepare(
            "INSERT INTO account_request (request_id, user_id, account_type, initial_deposit, status)
             VALUES (?, ?, ?, ?, 'PENDING')"
        );
        $stmt->execute([$requestId, $userId, $accountType, $initialDeposit]);
    }

    /**
     * Approving a request creates the account, funds it, and marks the
     * request approved. These three writes now happen inside a single DB
     * transaction — previously a failure partway through (e.g. the
     * account insert succeeding but the status update failing) could
     * leave the request stuck PENDING with an account already created.
     */
    public static function approve(string $requestId, string $officerId): string
    {
        return Database::transaction(function ($conn) use ($requestId, $officerId) {
            $stmt = $conn->prepare(
                'SELECT * FROM account_request WHERE request_id = ? FOR UPDATE'
            );
            $stmt->execute([$requestId]);
            $request = $stmt->fetch();

            if (!$request) {
                throw new NotFoundException('Request not found');
            }

            if ($request['status'] !== 'PENDING') {
                throw new ValidationException('Request has already been reviewed.');
            }

            $accountNo = Account::generateAccountNo();

            $insert = $conn->prepare(
                "INSERT INTO account (account_no, user_id, balance, account_type, status, handled_by)
                 VALUES (?, ?, ?, ?, 'ACTIVE', ?)"
            );
            $insert->execute([
                $accountNo,
                $request['user_id'],
                $request['initial_deposit'],
                $request['account_type'],
                $officerId,
            ]);

            $update = $conn->prepare(
                "UPDATE account_request SET status = 'APPROVED' WHERE request_id = ?"
            );
            $update->execute([$requestId]);

            return $accountNo;
        });
    }

    public static function deny(string $requestId): void
    {
        $stmt = Database::getConnection()->prepare(
            "UPDATE account_request SET status = 'DENIED' WHERE request_id = ?"
        );
        $stmt->execute([$requestId]);
    }
}
