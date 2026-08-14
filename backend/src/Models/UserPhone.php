<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;

final class UserPhone
{
    public static function addPhone(string $userId, string $phoneNumber): void
    {
        $stmt = Database::getConnection()->prepare(
            'INSERT INTO user_phone (user_id, phone_number) VALUES (?, ?)'
        );
        $stmt->execute([$userId, $phoneNumber]);
    }

    public static function getPhones(string $userId): array
    {
        $stmt = Database::getConnection()->prepare(
            'SELECT phone_number FROM user_phone WHERE user_id = ?'
        );
        $stmt->execute([$userId]);

        return $stmt->fetchAll(\PDO::FETCH_COLUMN);
    }

    public static function removePhone(string $userId, string $phoneNumber): void
    {
        $stmt = Database::getConnection()->prepare(
            'DELETE FROM user_phone WHERE user_id = ? AND phone_number = ?'
        );
        $stmt->execute([$userId, $phoneNumber]);
    }
}
