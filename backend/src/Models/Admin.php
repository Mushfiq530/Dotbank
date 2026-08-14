<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;

final class Admin
{
    public function __construct(
        public readonly string $adminId,
        private readonly string $password
    ) {
    }

    public static function findById(string $adminId): ?self
    {
        $stmt = Database::getConnection()->prepare(
            'SELECT * FROM admin WHERE admin_id = ?'
        );
        $stmt->execute([$adminId]);
        $row = $stmt->fetch();

        if (!$row) {
            return null;
        }

        return new self($row['admin_id'], $row['password']);
    }

    public function verifyPassword(string $password): bool
    {
        return password_verify($password, $this->password);
    }
}
