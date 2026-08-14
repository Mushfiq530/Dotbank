<?php

declare(strict_types=1);

namespace App\Config;

final class Env
{
    public static function get(string $key, ?string $default = null): ?string
    {
        $value = getenv($key);

        if ($value === false) {
            $value = $_ENV[$key] ?? null;
        }

        return $value !== null && $value !== '' ? $value : $default;
    }

    public static function isProduction(): bool
    {
        return self::get('APP_ENV', 'local') === 'production';
    }
}
