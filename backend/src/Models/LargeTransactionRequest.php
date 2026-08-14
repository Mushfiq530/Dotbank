<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;

/**
 * A withdrawal / transfer / bill payment whose amount exceeds the bank's
 * single-transaction limit (1,00,000). Nothing is debited from the account
 * when this is created — an officer must approve it first (see
 * TransactionController::approveLargeTransaction), which is what actually
 * performs the withdrawal.
 */
final class LargeTransactionRequest
{
    public static function create(
        string $requestType,
        string $userId,
        string $accountNo,
        float $amount,
        array $payload
    ): int {
        $conn = Database::getConnection();

        $stmt = $conn->prepare(
            "INSERT INTO large_transaction_request
                (request_type, user_id, account_no, amount, payload, status, created_at)
             VALUES (?, ?, ?, ?, ?, 'PENDING', NOW())"
        );
        $stmt->execute([$requestType, $userId, $accountNo, $amount, json_encode($payload)]);

        return (int) $conn->lastInsertId();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public static function getPending(): array
    {
        $stmt = Database::getConnection()->query(
            "SELECT ltr.*, u.name AS user_name
             FROM large_transaction_request ltr
             LEFT JOIN user u ON u.user_id = ltr.user_id
             WHERE ltr.status = 'PENDING'
             ORDER BY ltr.created_at ASC"
        );

        return array_map(
            function (array $row) {
                $row['payload'] = json_decode((string) $row['payload'], true) ?? [];
                return $row;
            },
            $stmt->fetchAll()
        );
    }

    /**
     * Locks the row (FOR UPDATE) so two officers can't both approve the same
     * request at once. Only safe to call from inside Database::transaction().
     */
    public static function findByIdForUpdate(int $id): ?array
    {
        $stmt = Database::getConnection()->prepare(
            'SELECT * FROM large_transaction_request WHERE id = ? FOR UPDATE'
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch();

        if (!$row) {
            return null;
        }

        $row['payload'] = json_decode((string) $row['payload'], true) ?? [];

        return $row;
    }

    public static function findById(int $id): ?array
    {
        $stmt = Database::getConnection()->prepare(
            'SELECT * FROM large_transaction_request WHERE id = ?'
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch();

        if (!$row) {
            return null;
        }

        $row['payload'] = json_decode((string) $row['payload'], true) ?? [];

        return $row;
    }

    public static function markReviewed(int $id, string $status, string $officerId): void
    {
        $stmt = Database::getConnection()->prepare(
            "UPDATE large_transaction_request
             SET status = ?, reviewed_by = ?, reviewed_at = NOW()
             WHERE id = ?"
        );
        $stmt->execute([$status, $officerId, $id]);
    }
}