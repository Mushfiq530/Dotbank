<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use App\Exceptions\NotFoundException;
use App\Exceptions\ValidationException;
use PDO;

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
     * Account number generation stays here in PHP (it's an app-layer
     * format concern, not a database one) and is passed into
     * sp_approve_account_request(), which then does the account INSERT
     * and the request UPDATE inside one procedure call.
     */
    public static function approve(string $requestId, string $officerId): string
    {
        return Database::transaction(function (PDO $conn) use ($requestId, $officerId) {
            $accountNo = Account::generateAccountNo();

            $call = $conn->prepare('CALL sp_approve_account_request(?, ?, ?, @status)');
            $call->execute([$requestId, $officerId, $accountNo]);
            $call->closeCursor();

            $status = (string) $conn->query('SELECT @status AS status')->fetch()['status'];

            switch ($status) {
                case 'OK':
                    return $accountNo;
                case 'NOT_FOUND':
                    throw new NotFoundException('Request not found');
                case 'ALREADY_REVIEWED':
                    throw new ValidationException('Request has already been reviewed.');
                default:
                    throw new \RuntimeException("Unexpected status from sp_approve_account_request: {$status}");
            }
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