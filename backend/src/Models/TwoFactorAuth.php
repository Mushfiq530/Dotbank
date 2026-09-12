<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use PDO;

final class TwoFactorAuth
{
    public function __construct(
        public readonly string $actorType,
        public readonly string $actorId,
        public readonly string $secret,
        public readonly bool $enabled,
    ) {
    }

    public static function find(string $actorType, string $actorId): ?self
    {
        $stmt = Database::getConnection()->prepare(
            'SELECT actor_type, actor_id, secret, enabled FROM two_factor_auth
             WHERE actor_type = ? AND actor_id = ?'
        );
        $stmt->execute([$actorType, $actorId]);
        $row = $stmt->fetch();

        return $row ? new self($row['actor_type'], $row['actor_id'], $row['secret'], (bool) $row['enabled']) : null;
    }

    public static function isEnabled(string $actorType, string $actorId): bool
    {
        $row = self::find($actorType, $actorId);
        return $row !== null && $row->enabled;
    }

    /**
     * Creates or replaces a not-yet-enabled secret for this actor. Called
     * when starting setup — safe to call again if the user abandons setup
     * and restarts, since it overwrites any unconfirmed previous attempt.
     */
    public static function beginSetup(string $actorType, string $actorId, string $secret): void
    {
        $stmt = Database::getConnection()->prepare(
            'INSERT INTO two_factor_auth (actor_type, actor_id, secret, enabled)
             VALUES (?, ?, ?, 0)
             ON DUPLICATE KEY UPDATE secret = VALUES(secret), enabled = 0, verified_at = NULL'
        );
        $stmt->execute([$actorType, $actorId, $secret]);
    }

    public static function confirmEnabled(string $actorType, string $actorId): void
    {
        $stmt = Database::getConnection()->prepare(
            'UPDATE two_factor_auth SET enabled = 1, verified_at = NOW()
             WHERE actor_type = ? AND actor_id = ?'
        );
        $stmt->execute([$actorType, $actorId]);
    }

    public static function disable(string $actorType, string $actorId): void
    {
        $stmt = Database::getConnection()->prepare(
            'DELETE FROM two_factor_auth WHERE actor_type = ? AND actor_id = ?'
        );
        $stmt->execute([$actorType, $actorId]);
    }
}
