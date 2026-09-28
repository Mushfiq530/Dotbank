# 🏦 DotBank

A full-stack banking system with role-based dashboards for users, officers, and admins.

## ✨ Features

- 🔐 **Role-Based Access** – Separate dashboards for Users, Officers, and Admins
- 👤 **Account Lifecycle** – Request, approve, and manage bank accounts end-to-end
- 💸 **Money Movement** – Withdrawals, bill payments, bank-to-bank and bank-to-mobile transfers, all atomic
- 👛 **E-Wallet** – Top up a wallet from your account, withdraw back to it, or transfer wallet-to-wallet with another user
- 🏧 **Deposit Requests** – Officers record walk-in cash deposits; a second officer/admin matches and approves them
- 💰 **Loan Requests** – Users apply, officers/admins review and approve
- 📊 **Mini Statements** – Monthly transaction breakdowns from real transaction history
- 🎫 **Support Ticket System** – Users open tickets, officers reply in a threaded conversation, tickets can be closed once resolved
- 🤖 **Guide Bot** – A rule-based in-app assistant that answers common "how do I..." questions
- 🚨 **Officer Tools** – Request queues, large-transaction alerts, user/officer activity logs
- 🔔 **Real Notifications** – Written automatically on loan approval, deposit approval, and transactions
- 🛠️ **Admin Console** – Manage users (with removal), manage officers, manage accounts, add new officers
- 🔑 **Hardened Auth** – Brute-force lockout enforced by a database trigger, session regeneration on login, `HttpOnly`/`SameSite` cookies, OTP-based password reset
- 📱 **Two-Factor Authentication** – Optional TOTP-based 2FA (authenticator app), required at login once enabled and used to gate sensitive account changes
- 🛡️ **CSRF & Rate Limiting** – CSRF guard on state-changing requests, plus per-action rate limits (login, 2FA verification, wallet transfers, assistant queries)
- 🧾 **Auditability** – Every money-moving write runs inside a real database transaction with row-locking
- 🌓 **Light/Dark Theme** – Switch between themes, built with Tailwind CSS

## 🚀 Quick Start Guide

### Prerequisites

- **PHP 8.1+** with the `pdo` extension
  - Verify installation: `php -v`
- **MySQL 8** (or MariaDB / XAMPP, which bundles it)
- **Node.js 18+** and npm
  - Verify installation: `node -v` and `npm -v`

No Composer install is strictly required — the backend ships with a tiny built-in autoloader.

### 📥 Installation Steps

1. **Clone or download this repository**

```bash
git clone https://github.com/Mushfiq530/Dotbank.git
cd Dotbank
```

2. **Set up the database** (one-time step — see Database Setup below)

```bash
cd backend/schema
mysql -u root -p < run_all.sql
```

3. **Configure the backend**

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your real MySQL credentials.

4. **Run the backend**

```bash
php -S localhost:8000 -t public
```

Leave this running — it serves the API at `http://localhost:8000/api`.

5. **Run the frontend** (in a new terminal, keeping the backend running)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## 🗄️ Database Setup

The schema is split one file per table (`01_admin.sql` … `18_money_transfer.sql`), plus dedicated files for views, stored procedures, and triggers (`19_views.sql`, `20_procedures.sql`, `21_triggers.sql`), and further files for rate limiting, 2FA, support tickets, the wallet, and OTP (`22_rate_limit.sql` … `29_otp.sql`). `run_all.sql` sources them all in the right order — run it **from inside `backend/schema/`**, since the `SOURCE` paths are relative to your current directory, not the script's location.

**This is a one-time step.** You only need to run it once per database, not every time you start the servers. It isn't safe to re-run against a database that already has these tables — you'll get "table already exists" errors. If you need a clean slate, run `DROP DATABASE banking_system;` first.

This creates the `banking_system` database, every table, and a seed admin account so you can log in right away:

- Admin ID: `admin`
- Password: `admin123`

## 📖 User Guide

### First Time Setup

1. **Register an account** — from the landing page, click *Create an account*, fill in your name, ID, email, phone, and password
2. **Log in** as that user, then go to *Open Account* and submit a request
3. **Get it approved** — log in as **admin** (`admin` / `admin123`) and approve it from *Manage Accounts*, or add an officer (*Add Officer*) and approve it from *Account Requests*
4. **Log back in as the user** — your Dashboard now shows a real account and balance

### Managing Money

1. **Withdraw** — go to Withdraw, enter an amount, and see an instant success/failure result (no approval queue — it executes immediately)
2. **Pay a Bill** — go to Pay Bill, select a biller, enter the amount
3. **Transfer** — send money bank-to-bank or bank-to-mobile
4. **Request a Loan** — go to Loan Request, enter an amount; an officer or admin approves or denies it
5. **Use your E-Wallet** — top up your wallet from your account, withdraw back to your account, or transfer directly to another user's wallet

### Getting Help

1. **Ask the Guide Bot** — open the assistant from the app and ask a plain-language question about how to use a feature
2. **Open a Support Ticket** — describe your issue and submit it; an officer will reply in the same thread until it's resolved and closed

### Officer & Admin Tasks

1. **Approve requests** — Account Requests, Loan Requests, and Deposit Requests each have their own queue; approving any of these needs just one officer or admin
2. **Record a deposit** — go to Deposit Requests, log a walk-in cash deposit, then match it to a real account number to approve it — the account holder's balance updates and they get a notification
3. **Add an Officer** (admin only) — go to Add Officer; the temporary password is shown **once** on screen, so copy it immediately
4. **Handle support tickets** — view open tickets, reply to a user's thread, and close it once resolved
5. **Review alerts and logs** — Large Transactions, Officer Alerts, and User/Officer activity logs are all visible to officers and admins

### Settings & Customization

1. **Switch Theme** — toggle Light/Dark mode from the top navigation
2. **View a Mini Statement** — go to Mini Statement to see your monthly transaction breakdown, computed from your real transaction history
3. **Set up Two-Factor Authentication** — from Security settings, scan the QR code with an authenticator app and confirm a code to enable 2FA; once enabled, it's required at login and used to confirm sensitive changes

## 🛡️ Security Features

### Authentication & Session Protection

- **Brute-Force Lockout** — repeated failed logins are tracked in `login_attempt`; a database trigger automatically freezes the affected account and raises an officer alert
- **Two-Factor Authentication (TOTP)** — optional authenticator-app-based 2FA; once enabled it's required to complete login and to confirm sensitive account changes
- **Session Regeneration** — the session ID is regenerated on every successful login to prevent session-fixation attacks
- **Hardened Cookies** — session cookies are `HttpOnly` and `SameSite=Lax`, and `Secure` in production
- **Password Hashing** — passwords are hashed with PHP's `password_hash()` (bcrypt-based, salted automatically)
- **OTP-Based Password Reset** — reset codes are single-use and consumed atomically, closing a replay window
- **CSRF Guard** — state-changing requests are checked against a CSRF token
- **Rate Limiting** — sensitive actions (login, 2FA verification, wallet transfers, assistant queries) are capped per actor within a rolling time window

### Data Integrity

- **Atomic Transactions** — transfers, withdrawals, bill payments, deposits, wallet operations, and approvals all run inside real database transactions with row-locking, so a failure mid-write can't lose or duplicate money
- **Full Audit Trail** — officer actions (including approvals and large-transaction reviews) are written to `officer_log`; user-facing account activity is written to `user_log`

**Privacy note:** all data lives in your own MySQL database — nothing is sent to an external server.

## 🔧 Troubleshooting

### `Database::getConnection()` fails loudly on startup

- `DB_USER` isn't set — double-check `backend/.env`

### `Table 'banking_system.X' doesn't exist`

- The schema wasn't fully applied. Re-run `run_all.sql` from inside `backend/schema/`, then confirm with `SHOW TABLES;`

### Frontend can't reach the API / CORS errors

- Make sure the backend is running on port `8000` and the frontend on `5173`

### `mysql: command not found`

- Install MySQL, or use XAMPP's bundled MySQL and make sure it's on your `PATH`

### PowerShell: `The '<' operator is reserved for future use`

- PowerShell doesn't support `<` redirection. Use `cmd.exe`, or pipe with `Get-Content run_all.sql | mysql -u root -p`

### `cd D:\...` doesn't actually change directory

- Plain `cd` won't switch drives in `cmd.exe` — use `cd /d D:\path\to\folder` instead

### Blank page on `npm run dev`

- Delete `frontend/node_modules` and `package-lock.json`, then run `npm install` again

### `Failed to resolve import "..."` in Vite

- Check for a filename/import spelling mismatch between the import path and the actual file on disk

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, React Router, Tailwind CSS, Framer Motion, Recharts, Lucide Icons
- **Backend**: PHP 8.1+, PSR-4 autoloading (no framework), PDO/MySQL
- **Database**: MySQL 8, schema split one file per table plus views/procedures/triggers
- **Auth**: PHP sessions, `password_hash()`, TOTP-based 2FA, OTP-based password reset

## 📝 Project Structure

```text
dotbank/
├── frontend/                # React + Vite single-page app
│   └── src/
│       ├── pages/
│       │   ├── auth/        # Landing, login, register
│       │   ├── user/        # Dashboard, withdraw, pay bill, loans, wallet, statements, security, support...
│       │   ├── officer/     # Requests queues, deposit requests, support tickets, alerts, logs
│       │   └── admin/       # Manage users/officers/accounts, deposit requests
│       ├── components/      # Shared UI, tables, layout (sidebar/nav), Guide Bot
│       ├── context/         # Auth & theme context providers
│       ├── router/          # Route definitions
│       └── api/             # API client
│
└── backend/                 # PHP REST API
    ├── public/
    │   └── index.php        # Front controller / router (serves /api)
    ├── src/
    │   ├── Controllers/     # Login, User, Officer, Admin, Transaction, Security, Support, Wallet, PasswordReset
    │   ├── Models/          # Account, Transaction, LoanReq, DepositRequest, MoneyTransfer, TwoFactorAuth, SupportTicket, Wallet, etc.
    │   ├── Services/        # OTP, SMS (dev stub), Mail, TOTP, Assistant (Guide Bot)
    │   ├── Support/         # Validator, SessionManager, CsrfGuard, RateLimiter
    │   ├── Config/          # Env, Database
    │   └── Exceptions/      # Typed exception hierarchy
    └── schema/               # One .sql file per table + views/procedures/triggers + run_all.sql
```

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest new features
- Submit pull requests

## 📧 Support

If you encounter any issues or have questions:

- Open an issue on GitHub
- Check the troubleshooting section above
**Made with ❤️ using React, PHP, and MySQL**
---

**Made with ❤️ using React, PHP, and MySQL**
