<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;

final class Notification
{
    /**
     * notification_id is AUTO_INCREMENT on the table, so it's never passed
     * in here — the DB assigns it.
     */
    public static function create(string $userId, string $message): void
    {
        $stmt = Database::getConnection()->prepare(
            'INSERT INTO notification (user_id, message, created_at, is_read)
             VALUES (?, ?, NOW(), FALSE)'
        );
        $stmt->execute([$userId, $message]);
    }

    public static function markAsRead(string $notificationId): void
    {
        $stmt = Database::getConnection()->prepare(
            'UPDATE notification SET is_read = TRUE WHERE notification_id = ?'
        );
        $stmt->execute([$notificationId]);
    }

    /**
     * @param int $limit  capped to avoid an unbounded result set for long-lived accounts
     */
    public static function getUserNotifications(string $userId, int $limit = 50, int $offset = 0): array
    {
        $limit = max(1, min($limit, 200));
        $offset = max(0, $offset);

        $stmt = Database::getConnection()->prepare(
            "SELECT * FROM notification
             WHERE user_id = ?
             ORDER BY created_at DESC
             LIMIT {$limit} OFFSET {$offset}"
        );
        $stmt->execute([$userId]);

        return $stmt->fetchAll();
    }
}