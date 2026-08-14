<?php

declare(strict_types=1);

namespace App\Config;

use PDO;
use PDOException;
use RuntimeException;

final class Database
{
    private static ?PDO $connection = null;

    private function __construct()
    {
    }

    public static function getConnection(): PDO
    {
        if (self::$connection === null) {
            $host = Env::get('DB_HOST', '127.0.0.1');
            $port = Env::get('DB_PORT', '3306');
            $name = Env::get('DB_NAME', 'banking_system');
            $user = Env::get('DB_USER');
            $pass = Env::get('DB_PASS');
            $charset = Env::get('DB_CHARSET', 'utf8mb4');

            if ($user === null) {
                // Fail loudly instead of silently connecting as an
                // unexpected/default account.
                throw new RuntimeException(
                    'DB_USER is not configured. Copy .env.example to .env and set your database credentials.'
                );
            }

            $dsn = "mysql:host={$host};port={$port};dbname={$name};charset={$charset}";

            try {
                self::$connection = new PDO($dsn, $user, $pass ?? '', [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]);
            } catch (PDOException $e) {
                // Never leak DSN/credentials in the error message shown upstream.
                throw new RuntimeException('Could not connect to the database.', 0, $e);
            }
        }

        return self::$connection;
    }

    /**
     * Convenience wrapper so callers don't have to repeat the
     * begin/commit/rollback boilerplate for multi-statement operations
     * that must be atomic (e.g. moving money between two accounts).
     *
     * @template T
     * @param callable(PDO):T $work
     * @return T
     */
    public static function transaction(callable $work): mixed
    {
        $conn = self::getConnection();

        // Support nested calls: only the outermost caller manages the transaction.
        $alreadyInTransaction = $conn->inTransaction();

        if (!$alreadyInTransaction) {
            $conn->beginTransaction();
        }

        try {
            $result = $work($conn);

            if (!$alreadyInTransaction) {
                $conn->commit();
            }

            return $result;
        } catch (\Throwable $e) {
            if (!$alreadyInTransaction && $conn->inTransaction()) {
                $conn->rollBack();
            }

            throw $e;
        }
    }
}
