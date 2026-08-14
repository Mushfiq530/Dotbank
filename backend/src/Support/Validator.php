<?php

declare(strict_types=1);

namespace App\Support;

use App\Exceptions\ValidationException;

final class Validator
{
    public static function requireNonEmpty(string $value, string $field): void
    {
        if (trim($value) === '') {
            throw new ValidationException("{$field} is required.");
        }
    }

    public static function email(string $email): void
    {
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new ValidationException('Invalid email address.');
        }
    }

    /**
     * Accepts digits, optionally prefixed with "+", 10-15 digits long.
     * Adjust the pattern to match your target locale's numbering plan.
     */
    public static function mobile(string $mobile): void
    {
        if (!preg_match('/^\+?[0-9]{10,15}$/', $mobile)) {
            throw new ValidationException('Invalid mobile number.');
        }
    }

    public static function positiveAmount(float $amount): void
    {
        if ($amount <= 0) {
            throw new ValidationException('Amount must be greater than zero.');
        }

        if ($amount > 99_999_999.99) {
            throw new ValidationException('Amount exceeds the allowed limit.');
        }
    }

    /**
     * Minimum bar for a "new" password. Tune to your policy
     * (this intentionally does not force specific character classes,
     * per current NIST guidance on length over complexity rules).
     */
    public static function passwordStrength(string $password): void
    {
        if (strlen($password) < 8) {
            throw new ValidationException('Password must be at least 8 characters long.');
        }
    }

    public static function matches(string $a, string $b, string $message): void
    {
        if (!hash_equals($a, $b)) {
            throw new ValidationException($message);
        }
    }

    /**
     * Validates a single entry from $_FILES (e.g. $_FILES['picture']) for use
     * as a profile picture. Checks the upload actually succeeded, the size
     * limit, and that the content is really an image of an allowed type —
     * sniffed from the file's real content (finfo), not the client-supplied
     * name/mime, which can't be trusted.
     *
     * @param array<string, mixed> $file
     * @return string The matching file extension (e.g. "jpg") for the detected type.
     */
    public static function imageUpload(array $file, int $maxBytes = 2 * 1024 * 1024): string
    {
        $allowed = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
        ];

        if (!isset($file['error']) || $file['error'] === UPLOAD_ERR_NO_FILE) {
            throw new ValidationException('No picture was uploaded.');
        }

        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new ValidationException('The picture failed to upload. Please try again.');
        }

        if (!is_uploaded_file($file['tmp_name'])) {
            throw new ValidationException('Invalid upload.');
        }

        if ($file['size'] > $maxBytes) {
            throw new ValidationException('Picture must be 2MB or smaller.');
        }

        $mime = (new \finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);

        if (!isset($allowed[$mime])) {
            throw new ValidationException('Picture must be a JPG, PNG, or WEBP image.');
        }

        return $allowed[$mime];
    }
}