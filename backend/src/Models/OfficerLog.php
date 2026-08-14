<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use PDO;

final class OfficerLog
{
    public static function log(string $officerId, string $officerName, string $action): void
    {
        $stmt = Database::getConnection()->prepare(
            'INSERT INTO officer_log (officer_id, officer_name, action_desc, logged_at)
             VALUES (?, ?, ?, NOW())'
        );
        $stmt->execute([$officerId, $officerName, $action]);
    }

    public static function getLogs(int $limit = 100, int $offset = 0): array
    {
        $limit = max(1, min($limit, 500));
        $offset = max(0, $offset);

        $stmt = Database::getConnection()->prepare(
            "SELECT * FROM officer_log ORDER BY logged_at DESC LIMIT {$limit} OFFSET {$offset}"
        );
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
