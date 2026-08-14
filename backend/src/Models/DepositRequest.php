<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use App\Exceptions\NotFoundException;
use App\Exceptions\ValidationException;

/**
 * NOTE: the uploaded source only showed `DepositRequest::create(...)` being
 * called (from `UserController::requestDeposit`); the class body itself
 * wasn't in the file you sent. This is reconstructed to match that call
 * site and the review/approve pattern used by AccountRequest and LoanReq
 * elsewhere in the codebase. Check it against your actual schema/original
 * file before relying on it, and adjust the `account_no` handling below
 * if your real version ties a deposit request to an account up front.
 */
final class DepositRequest
{
    public static function create(
        string $requestId,
        string $requesterName,
        string $source,
        float $amount
    ): void {
        if ($amount <= 0) {
            throw new ValidationException('Deposit amount must be greater than zero.');
        }

        $stmt = Database::getConnection()->prepare(
            "INSERT INTO deposit_request (request_id, requester_name, source, amount, status)
             VALUES (?, ?, ?, ?, 'PENDING')"
        );
        $stmt->execute([$requestId, $requesterName, $source, $amount]);
    }

    /**
     * Approving credits the given account and records a transaction,
     * atomically with the status update.
     */
    public static function approve(string $requestId, string $accountNo, string $officerId): void
    {
        Database::transaction(function ($conn) use ($requestId, $accountNo, $officerId) {
            $stmt = $conn->prepare(
                'SELECT * FROM deposit_request WHERE request_id = ? FOR UPDATE'
            );
            $stmt->execute([$requestId]);
            $request = $stmt->fetch();

            if (!$request) {
                throw new NotFoundException('Deposit request not found');
            }

            if ($request['status'] !== 'PENDING') {
                throw new ValidationException('Request has already been reviewed.');
            }

            $account = Account::findByAccountNo($accountNo);

            if (!$account) {
                throw new NotFoundException('Account not found');
            }

            $account->deposit((float) $request['amount']);
            Transaction::create($accountNo, 'DEPOSIT', (float) $request['amount']);

            $update = $conn->prepare(
                "UPDATE deposit_request SET status = 'APPROVED', reviewed_by = ? WHERE request_id = ?"
            );
            $update->execute([$officerId, $requestId]);
        });
    }

    public static function deny(string $requestId, string $officerId): void
    {
        $stmt = Database::getConnection()->prepare(
            "UPDATE deposit_request SET status = 'DENIED', reviewed_by = ? WHERE request_id = ?"
        );
        $stmt->execute([$officerId, $requestId]);
    }
}
