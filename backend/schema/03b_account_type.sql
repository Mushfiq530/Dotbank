-- Table: account_type
-- Lookup table for valid account types. Referenced by `account` and
-- `account_request` via FOREIGN KEY (account_type -> account_type.type_name),
-- so a row can never be inserted into either table with a type that isn't
-- one of these two values — previously this was just a free-text VARCHAR
-- with no enforcement at all.
--
-- Must run BEFORE 04_account.sql and 05_account_request.sql.
--
-- Values match exactly what the frontend sends (see
-- frontend/src/pages/user/OpenAccountPage.jsx: accountTypes ids "Savings"/"Current")
-- — do not change casing here without also updating the frontend.
CREATE TABLE account_type (
    type_name VARCHAR(20) PRIMARY KEY,
    description VARCHAR(150) NOT NULL
);

INSERT INTO account_type (type_name, description) VALUES
('Savings', 'Earn interest on your balance'),
('Current', 'Everyday transactions & transfers');