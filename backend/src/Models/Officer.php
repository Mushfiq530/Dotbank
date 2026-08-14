<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use App\Exceptions\DuplicateEntryException;
use PDOException;

final class Officer
{
    public function __construct(
        public readonly string $officerId,
        public readonly string $name,
        public readonly string $email,
        public readonly string $mobile,
        private readonly string $password,
        public readonly bool $mustResetPassword = false
    ) {
    }

    /**
     * Creates an officer with a random, single-use temporary password
     * instead of a shared hardcoded default ("123456" in the old code).
     * A shared default is a standing vulnerability: anyone who knows an
     * officer ID could log in as them until they happened to change it.
     *
     * Requires a `must_reset_password TINYINT(1) NOT NULL DEFAULT 1`
     * column on the `officer` table (see README for the migration).
     *
     * @return array{officer: self, temporaryPassword: string}
     */
    public static function create(
        string $officerId,
        string $name,
        string $email,
        string $mobile
    ): array {
        $temporaryPassword = bin2hex(random_bytes(6)); // 12 hex chars
        $hash = password_hash($temporaryPassword, PASSWORD_DEFAULT);

        try {
            $stmt = Database::getConnection()->prepare(
                'INSERT INTO officer (officer_id, name, email, mobile, password, must_reset_password)
                 VALUES (?, ?, ?, ?, ?, 1)'
            );
            $stmt->execute([$officerId, $name, $email, $mobile, $hash]);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                throw new DuplicateEntryException("Officer '{$officerId}' already exists.");
            }
            throw $e;
        }

        $officer = self::findById($officerId);

        return [
            'officer' => $officer,
            // Show this to the creating admin exactly once; never store or log it in plaintext.
            'temporaryPassword' => $temporaryPassword,
        ];
    }

    public static function findById(string $officerId): ?self
    {
        $stmt = Database::getConnection()->prepare(
            'SELECT * FROM officer WHERE officer_id = ?'
        );
        $stmt->execute([$officerId]);
        $row = $stmt->fetch();

        if (!$row) {
            return null;
        }

        return new self(
            $row['officer_id'],
            $row['name'],
            $row['email'],
            $row['mobile'],
            $row['password'],
            (bool) ($row['must_reset_password'] ?? false)
        );
    }

    public function verifyPassword(string $password): bool
    {
        return password_verify($password, $this->password);
    }

    public function resetPassword(string $newPassword): void
    {
        $hash = password_hash($newPassword, PASSWORD_DEFAULT);

        $stmt = Database::getConnection()->prepare(
            'UPDATE officer SET password = ?, must_reset_password = 0 WHERE officer_id = ?'
        );
        $stmt->execute([$hash, $this->officerId]);
    }
}
