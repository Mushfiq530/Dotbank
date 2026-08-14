<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;

/**
 * System-generated alerts shown to officers/admins — e.g. "this user's
 * account was auto-frozen after 3 failed login attempts". Separate from
 * `notification`, which is the user-facing one.
 */
final class OfficerAlert
{
    public static function create(string $userId, ?string $accountNo, string $message): void
    {
        $stmt = Database::getConnection()->prepare(
            'INSERT INTO officer_alert (user_id, account_no, message, created_at, is_read)
             VALUES (?, ?, ?, NOW(), FALSE)'
        );
        $stmt->execute([$userId, $accountNo, $message]);
    }

    public static function getAll(int $limit = 100, int $offset = 0): array
    {
        $limit = max(1, min($limit, 500));
        $offset = max(0, $offset);

        $stmt = Database::getConnection()->prepare(
            "SELECT oa.*, u.name AS user_name
             FROM officer_alert oa
             LEFT JOIN user u ON u.user_id = oa.user_id
             ORDER BY oa.created_at DESC
             LIMIT {$limit} OFFSET {$offset}"
        );
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public static function markAsRead(int $alertId): void
    {
        $stmt = Database::getConnection()->prepare(
            'UPDATE officer_alert SET is_read = TRUE WHERE id = ?'
        );
        $stmt->execute([$alertId]);
    }

    public static function unreadCount(): int
    {
        $stmt = Database::getConnection()->query(
            'SELECT COUNT(*) total FROM officer_alert WHERE is_read = FALSE'
        );

        return (int) $stmt->fetch()['total'];
    }
}