-- Table: officer
CREATE TABLE officer (
    officer_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    mobile VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    must_reset_password TINYINT(1) NOT NULL DEFAULT 1
);
