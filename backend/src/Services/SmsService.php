<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Dev stub: writes "sent" messages to a log file instead of an SMS
 * gateway. Fine for local development; before going to production, swap
 * sendSms()'s body for a real provider call (Twilio, Vonage, a local
 * aggregator, etc.) and delete sms_log.txt from anywhere it's deployed —
 * it currently contains plaintext OTP codes, which is only acceptable
 * for a local, non-production log.
 */
final class SmsService
{
    public static function sendSms(string $mobile, string $message): void
    {
        $logPath = __DIR__ . '/../../storage/sms_log.txt';
        $logDir = dirname($logPath);

        if (!is_dir($logDir)) {
            mkdir($logDir, 0700, true);
        }

        file_put_contents(
            $logPath,
            date('Y-m-d H:i:s') . ' | ' . $mobile . ' | ' . $message . PHP_EOL,
            FILE_APPEND
        );
    }
}
