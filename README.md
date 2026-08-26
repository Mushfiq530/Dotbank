![DotBank Logo](frontend/public/logo.png)

Dot Bank — Full-stack banking system with role-based dashboards for users, officers, and admins
React + Vite frontend · PHP 8 REST API · MySQL

Everything's wired together for real: React frontend → PHP API → MySQL. No mock data in the frontend — every page calls a real endpoint.

Features

- Role-Based Access — separate experiences for Users, Officers, and Admins, each with their own dashboard
- Account Lifecycle — request a new account, get it approved by an officer or admin, then manage it end-to-end
- Money Movement — withdrawals, bill payments, bank-to-bank and bank-to-mobile transfers, all executed atomically
- Deposit Requests — officers record walk-in cash deposits at the counter; a second officer/admin matches the deposit to a real account and approves it, crediting the balance and notifying the account holder
- Loan Requests — users submit loan requests; officers/admins review and approve
- Mini Statements — monthly transaction breakdowns computed from real transaction history
- Officer Tools — account requests queue, loan requests queue, deposit requests queue, large-transaction alerts, user/officer activity logs
- Notifications — real notification feed, written automatically on loan approval/denial, deposit approval, and transactions
- Admin Console — manage users (including removal), manage officers, manage accounts, add new officers with a one-time temporary password
- Hardened Auth — brute-force lockout (auto-freeze after repeated failures, enforced by a database trigger), session regeneration on login, HttpOnly/SameSite cookies, OTP-based password reset
- Auditability — every write to money is wrapped in a real database transaction, with row-locking to prevent double-approvals and race-condition overdrafts; officer actions (including large-transaction approvals) are written to officer_log
- Light/Dark Theme — toggle from the UI, built with Tailwind CSS

Tech Stack

Frontend: React 18, Vite, React Router, Tailwind CSS, Framer Motion, Recharts, Lucide Icons
Backend: PHP 8.1+, PSR-4 autoloading (no framework), PDO/MySQL
Database: MySQL 8 (schema split one file per table, applied in dependency order, plus views/procedures/triggers)
Auth: PHP sessions (HttpOnly/SameSite=Lax cookies), password_hash() hashing, OTP-based password reset

Project Structure

dotbank/
├── frontend/                # React + Vite single-page app
│   └── src/
│       ├── pages/
│       │   ├── auth/        # Landing, login, register
│       │   ├── user/        # Dashboard, withdraw, pay bill, loans, statements...
│       │   ├── officer/     # Requests queues, deposit requests, alerts, logs, statements
│       │   └── admin/       # Manage users/officers/accounts, deposit requests
│       ├── components/      # Shared UI, tables, layout (sidebar/nav)
│       ├── context/         # Auth & theme context providers
│       ├── router/          # Route definitions
│       └── api/             # API client
│
└── backend/                 # PHP REST API
    ├── public/
    │   └── index.php        # Front controller / router (serves /api)
    ├── src/
    │   ├── Controllers/     # Login, User, Officer, Admin, Transaction, PasswordReset
    │   ├── Models/          # Account, Transaction, LoanReq, DepositRequest, MoneyTransfer, etc.
    │   ├── Services/        # OTP, SMS (dev stub)
    │   ├── Support/         # Validator, SessionManager
    │   ├── Config/          # Env, Database
    │   └── Exceptions/      # Typed exception hierarchy
    └── schema/               # One .sql file per table + views/procedures/triggers + run_all.sql

Quick Start

Prerequisites: PHP 8.1+ with the pdo extension, MySQL 8 (or MariaDB / XAMPP), Node.js 18+ and npm. No Composer install is strictly required — the backend ships with a tiny built-in autoloader — but running composer install / composer dump-autoload is supported too.

1. Set up the database (one-time)

Install MySQL (or XAMPP, which bundles it) if you don't have it yet.

cd backend/schema
mysql -u root -p < run_all.sql

This creates the banking_system database, every table, and a seed admin account so you can log in right away:

Admin ID: admin
Password: admin123

The schema is split one file per table (01_admin.sql … 18_money_transfer.sql), plus 19_views.sql, 20_procedures.sql, and 21_triggers.sql. run_all.sql sources them all — run it from inside backend/schema/, since the SOURCE paths are relative to your current directory. The SOURCE order doesn't always match the filename numbers (e.g. 08_transaction.sql runs before 06_loan_request.sql, since loan_request carries a foreign key back to transaction) — let run_all.sql handle ordering rather than running files individually.

This is a one-time step. You only need to run it once per database, not every time you start the servers. It isn't idempotent — re-running it against a database that already has these tables will fail with "table already exists" errors. If you need a clean slate, drop the database first (DROP DATABASE banking_system;) and re-run it.

2. Configure the backend

cd backend
cp .env.example .env

Edit .env with your real MySQL credentials:

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=banking_system
DB_USER=your_mysql_user
DB_PASS=your_mysql_password
DB_CHARSET=utf8mb4
APP_ENV=local

3. Run the backend

php -S localhost:8000 -t public

Leave this running — it serves the API at http://localhost:8000/api.

4. Run the frontend (new terminal, keep the backend running)

cd frontend
npm install
npm run dev

Open http://localhost:5173 in your browser.

5. Try it end to end

1. Register a new user from the landing page (Create an account)
2. Log in as that user → Open Account → submit a request
3. Log in as admin (admin / admin123) → Manage Accounts to approve it — or add and log in as an officer (Add Officer) and approve from Account Requests
4. Log back in as the user → the Dashboard now shows the real account and balance → try Withdraw, Pay Bill, or Loan Request
5. As admin, use Add Officer to create an officer login — the temporary password is shown once on screen, so copy it for that officer's first login
6. As an officer or admin, try Deposit Requests — record a walk-in cash deposit, then approve it against a real account number; the account holder's balance updates and they get a notification

Backend Notes

- No CORS surprises: the API is pre-configured to allow requests from the Vite dev server at http://localhost:5173 with credentials — if you change the frontend port, update backend/public/index.php.
- Transactions are atomic: transfers, withdrawals, bill payments, deposits, and approvals all run inside real database transactions with row-locking, so a failure mid-write can't silently lose or duplicate money.
- OTP is single-use: password-reset codes are consumed atomically, closing a replay window.
- Officer passwords: new officers get a random 12-character temporary password (not a shared default) and are flagged to reset it on first login.
- Auto-freeze lives in the database now: repeated failed logins for a user are tracked in login_attempt, and a database trigger (21_triggers.sql) freezes the affected accounts and raises an officer alert automatically — this used to be handled in PHP but was moved to the database for consistency.

Upgrading an existing database

If you already have a banking_system database from an older version of this project, see backend/README.md for manual migration statements instead of re-running the full schema.

Known Limitations

- Forced password reset — officers are flagged with must_reset_password on creation, but the frontend doesn't yet redirect them to a reset screen on first login; they can still sign in with the temporary password as-is.
- SMS delivery — SmsService is a development stub that writes OTP codes in plaintext to backend/storage/sms_log.txt instead of sending a real message. Swap in an actual SMS gateway before any production use.

Troubleshooting

- Database::getConnection() fails loudly on startup — DB_USER isn't set — double-check backend/.env
- Table 'banking_system.X' doesn't exist — The schema wasn't fully applied — re-run run_all.sql from inside backend/schema/, then confirm with SHOW TABLES;
- Frontend can't reach the API / CORS errors — Make sure the backend is running on port 8000 and the frontend on 5173
- mysql: command not found — Install MySQL or use XAMPP's bundled MySQL, and ensure it's on your PATH
- PowerShell: The '<' operator is reserved for future use — PowerShell doesn't support < redirection — use cmd.exe, or pipe with Get-Content run_all.sql | mysql -u root -p
- cd D:\... doesn't actually change directory — plain cd won't switch drives in cmd.exe — use cd /d D:\path\to\folder instead
- Blank page on npm run dev — Delete frontend/node_modules and package-lock.json, then npm install again
- Failed to resolve import "..." in Vite — Check for a filename/import spelling mismatch between the import path and the actual file on disk

License

This project is open source and available under the MIT License.
