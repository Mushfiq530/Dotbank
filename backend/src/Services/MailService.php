<?php

declare(strict_types=1);

namespace App\Services;

use App\Config\Env;
use RuntimeException;

/**
 * Sends real email via SMTP (Gmail by default), written from scratch with
 * a raw socket instead of pulling in a library like PHPMailer — the same
 * "no third-party packages" choice already made for TotpService.
 *
 * Gmail setup (free, no paid plan needed):
 *   1. Turn on 2-Step Verification on the sending Gmail account.
 *   2. Generate an "App Password" (Google Account -> Security -> App
 *      Passwords) — a 16-character password just for this app.
 *   3. Put that address + app password in .env as MAIL_USERNAME /
 *      MAIL_APP_PASSWORD. Never the account's real login password.
 *
 * Gmail's free SMTP has a ~500 emails/day cap per account, which is why
 * every OTP-request endpoint is expected to sit behind RateLimiter.
 */
final class MailService
{
    private const PURPOSE_LABELS = [
        'PASSWORD_CHANGE' => 'change your password',
        'TWO_FACTOR_DISABLE' => 'disable two-factor authentication',
        'EMAIL_CHANGE_NEW_ADDRESS' => 'confirm your new email address',
    ];

    /**
     * Composes and sends the OTP email for a given purpose. $purpose drives
     * only the wording shown to the user — the actual security check
     * happens server-side in OtpService::consumeOtp.
     */
    public static function sendOtpEmail(string $toEmail, string $otp, string $purpose): void
    {
        $action = self::PURPOSE_LABELS[$purpose] ?? 'verify this action';

        $subject = 'Your Dot Bank verification code';
        $body = "Your verification code is: {$otp}\n\n"
            . "Use this code to {$action}. It expires in 10 minutes and can only be used once.\n\n"
            . "If you didn't request this, you can safely ignore this email — "
            . "no changes will be made without the code above.";

        self::send($toEmail, $subject, $body);
    }

    /**
     * Opens a fresh SMTP connection, authenticates, sends one plain-text
     * message, and closes the connection. Not pooled/reused — OTP emails
     * are low-volume and infrequent enough that connection setup cost
     * doesn't matter, and it keeps this class simple.
     */
    public static function send(string $toEmail, string $subject, string $body): void
    {
        $host = Env::get('MAIL_HOST', 'smtp.gmail.com');
        $port = (int) Env::get('MAIL_PORT', '587');
        $username = Env::get('MAIL_USERNAME');
        $appPassword = Env::get('MAIL_APP_PASSWORD');
        $fromName = Env::get('MAIL_FROM_NAME', 'Dot Bank');

        if (!$username || !$appPassword) {
            throw new RuntimeException(
                'MAIL_USERNAME / MAIL_APP_PASSWORD are not configured. ' .
                'Copy .env.example values and set your Gmail address + app password.'
            );
        }

        $socket = @stream_socket_client(
            "tcp://{$host}:{$port}",
            $errno,
            $errstr,
            15
        );

        if (!$socket) {
            throw new RuntimeException("Could not connect to mail server: {$errstr} ({$errno})");
        }

        try {
            self::expect($socket, 220);

            self::command($socket, "EHLO localhost", 250);

            // Upgrade to TLS before sending any credentials.
            self::command($socket, "STARTTLS", 220);

            if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new RuntimeException('Could not negotiate TLS with the mail server.');
            }

            // Must re-EHLO after STARTTLS — the server forgets the previous one.
            self::command($socket, "EHLO localhost", 250);

            self::command($socket, "AUTH LOGIN", 334);
            self::command($socket, base64_encode($username), 334);
            self::command($socket, base64_encode($appPassword), 235);

            self::command($socket, "MAIL FROM:<{$username}>", 250);
            self::command($socket, "RCPT TO:<{$toEmail}>", 250);
            self::command($socket, "DATA", 354);

            $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
            $headers = implode("\r\n", [
                "From: {$fromName} <{$username}>",
                "To: <{$toEmail}>",
                "Subject: {$encodedSubject}",
                "MIME-Version: 1.0",
                "Content-Type: text/plain; charset=UTF-8",
                "Content-Transfer-Encoding: 8bit",
            ]);

            // Per RFC 5321: lines consisting of a single "." must be escaped
            // as ".." so they aren't mistaken for the end-of-data marker.
            $escapedBody = preg_replace('/^\./m', '..', $body);

            self::command($socket, $headers . "\r\n\r\n" . $escapedBody . "\r\n.", 250);

            self::command($socket, "QUIT", 221);
        } finally {
            fclose($socket);
        }
    }

    /**
     * @param resource $socket
     */
    private static function command($socket, string $line, int $expectedCode): string
    {
        fwrite($socket, $line . "\r\n");
        return self::expect($socket, $expectedCode);
    }

    /**
     * @param resource $socket
     */
    private static function expect($socket, int $expectedCode): string
    {
        $response = '';
        // Multi-line SMTP replies use "code-text" on all but the last line,
        // and "code text" (space) on the last — keep reading until we see
        // the space-separated form.
        do {
            $line = fgets($socket, 515);
            if ($line === false) {
                throw new RuntimeException('Mail server closed the connection unexpectedly.');
            }
            $response .= $line;
        } while (isset($line[3]) && $line[3] === '-');

        $code = (int) substr($response, 0, 3);
        if ($code !== $expectedCode) {
            throw new RuntimeException("Mail server error (expected {$expectedCode}): " . trim($response));
        }

        return $response;
    }
}
