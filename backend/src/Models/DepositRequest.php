<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use App\Exceptions\AccountFrozenException;
use App\Exceptions\NotFoundException;
use App\Exceptions\ValidationException;
use PDO;

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

    public static function findById(string $requestId): ?array
    {
        $stmt = Database::getConnection()->prepare(
            'SELECT * FROM deposit_request WHERE request_id = ?'
        );
        $stmt->execute([$requestId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ?: null;
    }

    public static function getAll(): array
    {
        $stmt = Database::getConnection()->query(
            'SELECT * FROM deposit_request ORDER BY created_at DESC'
        );

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Delegates to sp_approve_deposit_request(), which links the request
     * to the given account_no, credits it, and marks the request APPROVED
     * — all inside one procedure call. This is the first point the
     * request is ever tied to a real account.
     */
    public static function approve(string $requestId, string $accountNo, string $officerId): void
    {
        $conn = Database::getConnection();

        $call = $conn->prepare('CALL sp_approve_deposit_request(?, ?, ?, @status)');
        $call->execute([$requestId, $accountNo, $officerId]);
        $call->closeCursor();

        $status = (string) $conn->query('SELECT @status AS status')->fetch()['status'];

        switch ($status) {
            case 'OK':
                return;
            case 'NOT_FOUND':
                throw new NotFoundException('Deposit request not found');
            case 'ALREADY_REVIEWED':
                throw new ValidationException('This request has already been reviewed.');
            case 'ACCOUNT_NOT_FOUND':
                throw new NotFoundException('Account not found');
            case 'FROZEN':
                throw new AccountFrozenException('This account is frozen. Contact an officer to reactivate it.');
            default:
                throw new \RuntimeException("Unexpected status from sp_approve_deposit_request: {$status}");
        }
    }

    public static function deny(string $requestId, string $officerId): void
    {
        $stmt = Database::getConnection()->prepare(
            "UPDATE deposit_request SET status = 'DENIED', reviewed_by = ? WHERE request_id = ?"
        );
        $stmt->execute([$officerId, $requestId]);
    }
}