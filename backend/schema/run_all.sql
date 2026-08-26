-- Dot Bank — schema, split one file per table (plus procedures/views/triggers).
-- Run this once against an empty database before starting the backend.
--
-- IMPORTANT: SOURCE order here does NOT match filename numeric order.
-- loan_request, bank_to_bank, and bank_to_mobile all gained a foreign key
-- to `transaction` (for audit traceability), so `08_transaction.sql` must
-- run before `06_loan_request.sql`, `09_bank_to_bank.sql`, and
-- `10_bank_to_mobile.sql` — even though those files are numbered lower.
-- Filenames were left as-is to avoid renaming files everyone already has
-- locally; only the order they're SOURCEd in changed.

CREATE DATABASE IF NOT EXISTS banking_system CHARACTER SET utf8mb4;
USE banking_system;

SOURCE 01_admin.sql;
SOURCE 02_officer.sql;
SOURCE 03_user.sql;
SOURCE 03b_account_type.sql;
SOURCE 04_account.sql;
SOURCE 05_account_request.sql;
SOURCE 07_deposit_request.sql;
SOURCE 08_transaction.sql;
SOURCE 06_loan_request.sql;
SOURCE 09_bank_to_bank.sql;
SOURCE 10_bank_to_mobile.sql;
SOURCE 11_bill_payment.sql;
SOURCE 12_notification.sql;
SOURCE 13_login_attempt.sql;
SOURCE 14_officer_log.sql;
SOURCE 15_user_log.sql;
SOURCE 16_officer_alert.sql;
SOURCE 17_large_transaction_request.sql;
SOURCE 18_money_transfer.sql;
SOURCE 19_views.sql;
SOURCE 20_procedures.sql;
SOURCE 21_triggers.sql;