<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use App\Exceptions\DuplicateEntryException;
use PDOException;

final class User
{
    public function __construct(
        public readonly string $userId,
        public readonly string $nid,
        public readonly string $name,
        public readonly string $email,
        public readonly string $mobile,
        private readonly string $password,
        public readonly ?string $profilePicture = null
    ) {
    }

    public static function create(
        string $userId,
        string $nid,
        string $name,
        string $email,
        string $mobile,
        string $password
    ): self {
        $hash = password_hash($password, PASSWORD_DEFAULT);

        try {
            $stmt = Database::getConnection()->prepare(
                'INSERT INTO user (user_id, nid, name, email, mobile, password)
                 VALUES (?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([$userId, $nid, $name, $email, $mobile, $hash]);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                throw new DuplicateEntryException(
                    'A user with this ID, NID, or email already exists.'
                );
            }
            throw $e;
        }

        return self::findById($userId);
    }

    public static function findById(string $userId): ?self
    {
        $stmt = Database::getConnection()->prepare(
            'SELECT * FROM user WHERE user_id = ?'
        );
        $stmt->execute([$userId]);
        $row = $stmt->fetch();

        if (!$row) {
            return null;
        }

        return new self(
            $row['user_id'],
            $row['nid'],
            $row['name'],
            $row['email'],
            $row['mobile'],
            $row['password'],
            $row['profile_picture'] ?? null
        );
    }

    /**
     * Persists the relative path (e.g. "profile_pictures/USR-1.jpg") of this
     * user's uploaded profile picture. The caller (UserController) is
     * responsible for actually saving the file to disk first — this just
     * records where it landed so it can be looked up on every future login.
     */
    public function updateProfilePicture(string $relativePath): void
    {
        $stmt = Database::getConnection()->prepare(
            'UPDATE user SET profile_picture = ? WHERE user_id = ?'
        );
        $stmt->execute([$relativePath, $this->userId]);
    }

    public function verifyPassword(string $password): bool
    {
        return password_verify($password, $this->password);
    }

    public function resetPassword(string $newPassword): void
    {
        $hash = password_hash($newPassword, PASSWORD_DEFAULT);

        $stmt = Database::getConnection()->prepare(
            'UPDATE user SET password = ? WHERE user_id = ?'
        );
        $stmt->execute([$hash, $this->userId]);
    }
}