-- Tracks request counts per (bucket, identifier) in fixed time windows.
-- "bucket" is a label for the thing being limited (e.g. 'login', 'otp-request'),
-- "identifier" is whatever we're limiting by (IP address, username, etc.).
CREATE TABLE IF NOT EXISTS rate_limit (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    bucket VARCHAR(64) NOT NULL,
    identifier VARCHAR(191) NOT NULL,
    window_start DATETIME NOT NULL,
    attempt_count INT UNSIGNED NOT NULL DEFAULT 1,
    UNIQUE KEY uq_rate_limit_bucket_identifier_window (bucket, identifier, window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
