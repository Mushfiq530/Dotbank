<?php

declare(strict_types=1);

namespace App\Support;

use App\Config\Env;

final class SessionManager
{
    public static function start(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'domain' => '',
            'secure' => Env::isProduction(), // requires HTTPS in production
            'httponly' => true,
            'samesite' => 'Lax',
        ]);

        session_start();
    }

    /**
     * Call this immediately after a successful login to prevent
     * session fixation attacks (an attacker pre-setting a victim's
     * session id before they authenticate).
     */
    public static function regenerate(): void
    {
        self::start();
        session_regenerate_id(true);
    }

    public static function requireUser(): void
    {
        self::start();

        if (!isset($_SESSION['user_id'])) {
            header('Location: login.php');
            exit;
        }
    }

    public static function requireOfficer(): void
    {
        self::start();

        if (!isset($_SESSION['officer_id'])) {
            header('Location: login.php');
            exit;
        }
    }

    public static function requireAdmin(): void
    {
        self::start();

        if (!isset($_SESSION['admin_id'])) {
            header('Location: login.php');
            exit;
        }
    }

    public static function logout(): void
    {
        self::start();

        $_SESSION = [];

        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params['path'],
                $params['domain'],
                $params['secure'],
                $params['httponly']
            );
        }

        session_destroy();
    }
}
