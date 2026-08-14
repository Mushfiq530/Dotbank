<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\AccountRequest;
use App\Models\DepositRequest;
use App\Models\LoanReq;
use App\Models\User;
use App\Support\Validator;

final class UserController
{
    public static function register(
        string $userId,
        string $nid,
        string $name,
        string $email,
        string $mobile,
        string $password
    ): User {
        Validator::requireNonEmpty($userId, 'User ID');
        Validator::requireNonEmpty($nid, 'NID');
        Validator::requireNonEmpty($name, 'Name');
        Validator::email($email);
        Validator::mobile($mobile);
        Validator::passwordStrength($password);

        return User::create($userId, $nid, $name, $email, $mobile, $password);
    }

    public static function requestAccount(
        string $requestId,
        string $userId,
        string $accountType,
        float $initialDeposit
    ): void {
        AccountRequest::create($requestId, $userId, $accountType, $initialDeposit);
    }

    public static function requestLoan(string $loanId, string $accountNo, float $amount): void
    {
        Validator::positiveAmount($amount);
        LoanReq::create($loanId, $accountNo, $amount);
    }

    public static function requestDeposit(
        string $requestId,
        string $requesterName,
        string $source,
        float $amount
    ): void {
        Validator::requireNonEmpty($requesterName, 'Requester name');
        Validator::positiveAmount($amount);
        DepositRequest::create($requestId, $requesterName, $source, $amount);
    }

    /**
     * Validates and stores an uploaded profile picture for a user, then
     * records its relative path on the user row. Returns that relative
     * path so the caller (index.php) can build a full URL for the response.
     *
     * @param array<string, mixed> $file A single entry from $_FILES, e.g. $_FILES['picture'].
     */
    public static function uploadProfilePicture(string $userId, array $file, string $uploadDir): string
    {
        $user = User::findById($userId);
        if (!$user) {
            throw new \App\Exceptions\NotFoundException('User not found.');
        }

        $extension = Validator::imageUpload($file);

        if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
            throw new \RuntimeException("Could not create upload directory: {$uploadDir}");
        }

        // One picture per user: remove any previously stored file for this
        // user (possibly with a different extension) before saving the new one.
        foreach (glob($uploadDir . '/' . $userId . '.*') ?: [] as $existing) {
            @unlink($existing);
        }

        $filename = $userId . '.' . $extension;
        $destination = $uploadDir . '/' . $filename;

        if (!move_uploaded_file($file['tmp_name'], $destination)) {
            throw new \RuntimeException('Could not save the uploaded picture.');
        }

        $relativePath = 'profile_pictures/' . $filename;
        $user->updateProfilePicture($relativePath);

        return $relativePath;
    }
}