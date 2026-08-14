-- Dot Bank — schema, split one file per table.
-- Run this once against an empty database before starting the backend.
-- Files are ordered so foreign-key dependencies (e.g. account -> user)
-- are always created before the tables that reference them.

CREATE DATABASE IF NOT EXISTS banking_system CHARACTER SET utf8mb4;
USE banking_system;

SOURCE 01_admin.sql;
SOURCE 02_officer.sql;
SOURCE 03_user.sql;
SOURCE 04_account.sql;
SOURCE 05_account_request.sql;
SOURCE 06_loan_request.sql;
SOURCE 07_deposit_request.sql;
SOURCE 08_transaction.sql;
SOURCE 09_bank_to_bank.sql;
SOURCE 10_bank_to_mobile.sql;
SOURCE 11_bill_payment.sql;
SOURCE 12_notification.sql;
SOURCE 13_login_attempt.sql;
SOURCE 14_officer_log.sql;
SOURCE 15_user_log.sql;
SOURCE 16_officer_alert.sql;
SOURCE 17_large_transaction_request.sql;