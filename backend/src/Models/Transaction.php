<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;

final class Transaction
{
    private const LARGE_TRANSACTION_THRESHOLD = 100_000.0;

    public static function create(string $accountNo, string $transactionType, float $amount): int
    {
        $reviewStatus = $amount > self::LARGE_TRANSACTION_THRESHOLD ? 'PENDING' : 'APPROVED';

        $conn = Database::getConnection();

        $stmt = $conn->prepare(
            'INSERT INTO transaction (account_no, transaction_type, amount, transaction_time, review_status)
             VALUES (?, ?, ?, NOW(), ?)'
        );
        $stmt->execute([$accountNo, $transactionType, $amount, $reviewStatus]);

        return (int) $conn->lastInsertId();
    }

    public static function approve(int $transactionId, string $officerId): void
    {
        $stmt = Database::getConnection()->prepare(
            "UPDATE transaction SET review_status = 'APPROVED', verified_by = ? WHERE transaction_id = ?"
        );
        $stmt->execute([$officerId, $transactionId]);
    }

    public static function deny(int $transactionId, string $officerId): void
    {
        $stmt = Database::getConnection()->prepare(
            "UPDATE transaction SET review_status = 'DENIED', verified_by = ? WHERE transaction_id = ?"
        );
        $stmt->execute([$officerId, $transactionId]);
    }

    public static function getPendingTransactions(): array
    {
        $stmt = Database::getConnection()->query(
            "SELECT * FROM transaction WHERE review_status = 'PENDING'"
        );

        return $stmt->fetchAll();
    }
}
