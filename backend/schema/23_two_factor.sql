-- One row per actor (user/officer/admin) who has set up 2FA.
-- `enabled` stays 0 until the actor confirms their first code, so a secret
-- that was generated but never confirmed can't silently lock someone out.
CREATE TABLE IF NOT EXISTS two_factor_auth (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    actor_type ENUM('USER', 'OFFICER', 'ADMIN') NOT NULL,
    actor_id VARCHAR(64) NOT NULL,
    secret VARCHAR(64) NOT NULL,
    enabled TINYINT(1) NOT NULL DEFAULT 0,
    verified_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_two_factor_actor (actor_type, actor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
