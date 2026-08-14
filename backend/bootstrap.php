<?php

declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';

/**
 * Minimal .env loader (no external dependency needed).
 * Loads KEY=VALUE pairs into getenv()/$_ENV if a .env file exists.
 * Real environment variables (e.g. set by the OS or web server) always
 * take precedence and are never overwritten.
 */
function load_env(string $path): void
{
    if (!is_file($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    foreach ($lines as $line) {
        $line = trim($line);

        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }

        if (!str_contains($line, '=')) {
            continue;
        }

        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value, " \t\n\r\0\x0B\"'");

        if (getenv($key) !== false) {
            continue; // real env var wins
        }

        putenv("$key=$value");
        $_ENV[$key] = $value;
    }
}

load_env(__DIR__ . '/.env');
