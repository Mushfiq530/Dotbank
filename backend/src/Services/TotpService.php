<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Minimal RFC 6238 TOTP implementation (the algorithm behind Google
 * Authenticator, Authy, etc). Written from scratch instead of pulling in a
 * Composer package, since this project intentionally runs without Composer.
 *
 * A TOTP code is just: HMAC-SHA1(secret, current_30s_time_step), truncated
 * down to 6 digits. Nothing here talks to the network — the same secret is
 * held by the server and by the authenticator app, and both sides compute
 * the same code independently from the current time.
 */
final class TotpService
{
    private const SECRET_BYTES = 20;   // 160 bits, standard for TOTP
    private const PERIOD = 30;         // seconds per code
    private const DIGITS = 6;
    private const ALGO = 'sha1';

    /** Generates a new random Base32 secret to store for an account. */
    public static function generateSecret(): string
    {
        return self::base32Encode(random_bytes(self::SECRET_BYTES));
    }

    /**
     * Builds the otpauth:// URI that an authenticator app's QR scanner reads.
     * $accountLabel is what shows up under the entry in the app, e.g. the
     * user's ID or email.
     */
    public static function provisioningUri(string $secret, string $accountLabel, string $issuer = 'DotBank'): string
    {
        $label = rawurlencode($issuer) . ':' . rawurlencode($accountLabel);
        $query = http_build_query([
            'secret' => $secret,
            'issuer' => $issuer,
            'algorithm' => strtoupper(self::ALGO),
            'digits' => self::DIGITS,
            'period' => self::PERIOD,
        ]);

        return "otpauth://totp/{$label}?{$query}";
    }

    /**
     * Verifies a 6-digit code against a secret. Checks the current time
     * step plus one step on either side (±30s) to tolerate normal clock
     * drift between the server and the user's phone.
     */
    public static function verify(string $secret, string $code): bool
    {
        $code = preg_replace('/\s+/', '', $code);
        if (!preg_match('/^\d{6}$/', $code)) {
            return false;
        }

        $currentStep = (int) floor(time() / self::PERIOD);

        for ($drift = -1; $drift <= 1; $drift++) {
            $expected = self::generateCode($secret, $currentStep + $drift);
            if (hash_equals($expected, $code)) {
                return true;
            }
        }

        return false;
    }

    private static function generateCode(string $secret, int $timeStep): string
    {
        $key = self::base32Decode($secret);
        $counter = pack('N*', 0, $timeStep); // 8-byte big-endian counter

        $hash = hash_hmac(self::ALGO, $counter, $key, true);

        // Dynamic truncation (RFC 4226 section 5.3)
        $offset = ord($hash[strlen($hash) - 1]) & 0x0F;
        $binary =
            ((ord($hash[$offset]) & 0x7F) << 24) |
            ((ord($hash[$offset + 1]) & 0xFF) << 16) |
            ((ord($hash[$offset + 2]) & 0xFF) << 8) |
            (ord($hash[$offset + 3]) & 0xFF);

        $code = $binary % (10 ** self::DIGITS);

        return str_pad((string) $code, self::DIGITS, '0', STR_PAD_LEFT);
    }

    private const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    private static function base32Encode(string $binary): string
    {
        $bits = '';
        foreach (str_split($binary) as $byte) {
            $bits .= str_pad(decbin(ord($byte)), 8, '0', STR_PAD_LEFT);
        }

        $output = '';
        foreach (str_split($bits, 5) as $chunk) {
            $chunk = str_pad($chunk, 5, '0', STR_PAD_RIGHT);
            $output .= self::BASE32_ALPHABET[bindec($chunk)];
        }

        return $output;
    }

    private static function base32Decode(string $base32): string
    {
        $base32 = strtoupper(rtrim($base32, '='));
        $bits = '';
        foreach (str_split($base32) as $char) {
            $pos = strpos(self::BASE32_ALPHABET, $char);
            if ($pos === false) {
                continue;
            }
            $bits .= str_pad(decbin($pos), 5, '0', STR_PAD_LEFT);
        }

        $binary = '';
        foreach (str_split($bits, 8) as $byte) {
            if (strlen($byte) < 8) {
                break;
            }
            $binary .= chr(bindec($byte));
        }

        return $binary;
    }
}
