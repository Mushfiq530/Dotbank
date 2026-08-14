<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;

final class UserLog
{
    public static function log(
        string $userId,
        ?string $accountNo,
        string $updatedByType,
        string $updatedById,
        string $action
    ): void {
        $stmt = Database::getConnection()->prepare(
            'INSERT INTO user_log (user_id, account_no, updated_by_type, updated_by_id, action_desc, logged_at)
             VALUES (?, ?, ?, ?, ?, NOW())'
        );
        $stmt->execute([$userId, $accountNo, $updatedByType, $updatedById, $action]);
    }

    public static function getLogs(string $userId, int $limit = 100, int $offset = 0): array
    {
        $limit = max(1, min($limit, 500));
        $offset = max(0, $offset);

        $stmt = Database::getConnection()->prepare(
            "SELECT * FROM user_log
             WHERE user_id = ?
             ORDER BY logged_at DESC
             LIMIT {$limit} OFFSET {$offset}"
        );
        $stmt->execute([$userId]);

        return $stmt->fetchAll();
    }

    /**
     * All user_log rows across every user, for the officer/admin log viewer.
     * Joined with the user's name so the UI doesn't need a second lookup.
     */
    public static function getAllLogs(int $limit = 200, int $offset = 0): array
    {
        $limit = max(1, min($limit, 500));
        $offset = max(0, $offset);

        $stmt = Database::getConnection()->prepare(
            "SELECT ul.*, u.name AS user_name
             FROM user_log ul
             LEFT JOIN user u ON u.user_id = ul.user_id
             ORDER BY ul.logged_at DESC
             LIMIT {$limit} OFFSET {$offset}"
        );
        $stmt->execute();

        return $stmt->fetchAll();
    }
}