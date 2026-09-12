<?php

declare(strict_types=1);

namespace App\Support;

use App\Config\Database;
use PDO;

/**
 * Fixed-window rate limiter backed by the `rate_limit` table.
 *
 * Usage:
 *   RateLimiter::check('login', $username, maxAttempts: 5, windowSeconds: 60);
 * Throws a RateLimitExceededException if the caller has exceeded the limit
 * for this bucket+identifier within the current window.
 */
final class RateLimiter
{
    /**
     * @throws \App\Exceptions\RateLimitExceededException
     */
    public static function check(
        string $bucket,
        string $identifier,
        int $maxAttempts,
        int $windowSeconds
    ): void {
        $conn = Database::getConnection();

        // Round the current time down to the start of the current window,
        // so all requests within the same window share one row.
        $windowStart = (int) (floor(time() / $windowSeconds) * $windowSeconds);
        $windowStartSql = date('Y-m-d H:i:s', $windowStart);

        // Upsert: increment if the (bucket, identifier, window) row already
        // exists, insert a fresh one otherwise. Atomic at the database level,
        // so concurrent requests can't race past the limit.
        $stmt = $conn->prepare(
            'INSERT INTO rate_limit (bucket, identifier, window_start, attempt_count)
             VALUES (:bucket, :identifier, :window_start, 1)
             ON DUPLICATE KEY UPDATE attempt_count = attempt_count + 1'
        );
        $stmt->execute([
            'bucket' => $bucket,
            'identifier' => $identifier,
            'window_start' => $windowStartSql,
        ]);

        $check = $conn->prepare(
            'SELECT attempt_count FROM rate_limit
             WHERE bucket = :bucket AND identifier = :identifier AND window_start = :window_start'
        );
        $check->execute([
            'bucket' => $bucket,
            'identifier' => $identifier,
            'window_start' => $windowStartSql,
        ]);
        $count = (int) $check->fetchColumn();

        if ($count > $maxAttempts) {
            $retryAfter = $windowStart + $windowSeconds - time();
            throw new \App\Exceptions\RateLimitExceededException(
                "Too many requests. Please try again in {$retryAfter} seconds.",
                max($retryAfter, 1)
            );
        }
    }

    /**
     * Best-effort cleanup of old windows. Safe to call occasionally
     * (e.g. once per login attempt) — not required for correctness,
     * just keeps the table from growing forever.
     */
    public static function purgeOlderThan(int $seconds = 86400): void
    {
        $conn = Database::getConnection();
        $cutoff = date('Y-m-d H:i:s', time() - $seconds);
        $conn->prepare('DELETE FROM rate_limit WHERE window_start < :cutoff')
            ->execute(['cutoff' => $cutoff]);
    }
}
