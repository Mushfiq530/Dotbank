<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Double-submit-cookie style CSRF protection.
 *
 * A random token is stored in the PHP session (server-side, can't be read
 * or forged by a third-party site) the first time it's needed. The frontend
 * fetches that token once via GET /csrf-token and must echo it back in the
 * X-CSRF-Token header on every state-changing request. A cross-site form or
 * script on another origin can trigger the browser to send our session
 * cookie automatically, but it has no way to read the token to put it in
 * the header — so the request is rejected.
 */
final class CsrfGuard
{
    private const SESSION_KEY = 'csrf_token';
    private const HEADER_NAME = 'HTTP_X_CSRF_TOKEN';

    public static function token(): string
    {
        SessionManager::start();

        if (empty($_SESSION[self::SESSION_KEY])) {
            $_SESSION[self::SESSION_KEY] = bin2hex(random_bytes(32));
        }

        return $_SESSION[self::SESSION_KEY];
    }

    /**
     * Verify the token on an incoming request. Call this for every
     * state-changing method (POST/PUT/DELETE) before touching the database.
     */
    public static function verify(): bool
    {
        SessionManager::start();

        $expected = $_SESSION[self::SESSION_KEY] ?? null;
        $provided = $_SERVER[self::HEADER_NAME] ?? null;

        if (!$expected || !$provided) {
            return false;
        }

        // hash_equals prevents timing attacks from leaking the token
        // character-by-character.
        return hash_equals($expected, $provided);
    }
}
