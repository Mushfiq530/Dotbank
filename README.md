<div align="center">
  <img src="frontend/public/logo.png" alt="DotBank Logo" width="200"/>

  # 🏦 DotBank

  <p>A full-stack banking system with role-based dashboards for users, officers, and admins</p>

  [![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
  [![PHP](https://img.shields.io/badge/PHP-8.1%2B-777BB4.svg?logo=php&logoColor=white)](https://www.php.net/)
  [![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1.svg?logo=mysql&logoColor=white)](https://www.mysql.com/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## ✨ Features

- 🔐 **Role-Based Access** - Separate dashboards for Users, Officers, and Admins
- 👤 **Account Lifecycle** - Request, approve, and manage bank accounts end-to-end
- 💸 **Money Movement** - Withdrawals, bill payments, bank-to-bank and bank-to-mobile transfers, all atomic
- 🏧 **Deposit Requests** - Officers record walk-in cash deposits; a second officer/admin matches and approves them
- 💰 **Loan Requests** - Users apply, officers/admins review and approve
- 📊 **Mini Statements** - Monthly transaction breakdowns from real transaction history
- 🚨 **Officer Tools** - Request queues, large-transaction alerts, user/officer activity logs
- 🔔 **Real Notifications** - Written automatically on loan approval, deposit approval, and transactions
- 🛠️ **Admin Console** - Manage users (with removal), manage officers, manage accounts, add new officers
- 🔑 **Hardened Auth** - Brute-force lockout enforced by a database trigger, session regeneration on login, `HttpOnly`/`SameSite` cookies, OTP-based password reset
- 🧾 **Auditability** - Every money-moving write runs inside a real database transaction with row-locking
- 🌓 **Light/Dark Theme** - Switch between themes, built with Tailwind CSS

## 🚀 Quick Start Guide

### Prerequisites

Before you begin, make sure you have:

1. **PHP 8.1+** with the `pdo` extension
   - Verify installation: run `php -v` in your terminal
2. **MySQL 8** (or MariaDB / XAMPP, which bundles it)
3. **Node.js 18+** and npm
   - Verify installation: run `node -v` and `npm -v`

No Composer install is strictly required — the backend ships with a tiny built-in autoloader.

### 📥 Installation Steps

1. **Clone or download this repository**
```bash
   git clone https://github.com/Mushfiq530/Dotbank.git
   cd Dotbank
```

2. **Set up the database** (one-time step — see [Database Setup](#-database-setup) below for details)
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

The schema is split one file per table (`01_admin.sql` … `18_money_transfer.sql`), plus dedicated files for views, stored procedures, and triggers (`19_views.sql`, `20_procedures.sql`, `21_triggers.sql`). `run_all.sql` sources them all in the right order — run it **from inside `backend/schema/`**, since the `SOURCE` paths are relative to your current directory, not the script's location.

> **This is a one-time step.** You only need to run it once per database, not every time you start the servers. It isn't safe to re-run against a database that already has these tables — you'll get "table already exists" errors. If you need a clean slate, run `DROP DATABASE banking_system;` first.

This creates the `banking_system` database, every table, and a seed admin account so you can log in right away:

| Field    | Value      |
| -------- | ---------- |
| Admin ID | `admin`    |
| Password | `admin123` |

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

### Officer & Admin Tasks

1. **Approve requests** — Account Requests, Loan Requests, and Deposit Requests each have their own queue; approving any of these needs just one officer or admin
2. **Record a deposit** — go to Deposit Requests, log a walk-in cash deposit, then match it to a real account number to approve it — the account holder's balance updates and they get a notification
3. **Add an Officer** (admin only) — go to Add Officer; the temporary password is shown **once** on screen, so copy it immediately
4. **Review alerts and logs** — Large Transactions, Officer Alerts, and User/Officer activity logs are all visible to officers and admins

### Settings & Customization

1. **Switch Theme** — toggle Light/Dark mode from the top navigation
2. **View a Mini Statement** — go to Mini Statement to see your monthly transaction breakdown, computed from your real transaction history

## 🛡️ Security Features

### Authentication & Session Protection

- **Brute-Force Lockout** — repeated failed logins are tracked in `login_attempt`; a database trigger automatically freezes the affected account and raises an officer alert
- **Session Regeneration** — the session ID is regenerated on every successful login to prevent session-fixation attacks
- **Hardened Cookies** — session cookies are `HttpOnly` and `SameSite=Lax`, and `Secure` in production
- **Password Hashing** — passwords are hashed with PHP's `password_hash()` (bcrypt-based, salted automatically)
- **OTP-Based Password Reset** — reset codes are single-use and consumed atomically, closing a replay window

### Data Integrity

- **Atomic Transactions** — transfers, withdrawals, bill payments, deposits, and approvals all run inside real database transactions with row-locking, so a failure mid-write can't lose or duplicate money
- **Full Audit Trail** — officer actions (including approvals and large-transaction reviews) are written to `officer_log`; user-facing account activity is written to `user_log`

**Privacy note:** all data lives in your own MySQL database — nothing is sent to an external server.

## 🔧 Troubleshooting

### `Database::getConnection()` fails loudly on startup
`DB_USER` isn't set — double-check `backend/.env`.

### `Table 'banking_system.X' doesn't exist`
The schema wasn't fully applied. Re-run `run_all.sql` from inside `backend/schema/`, then confirm with `SHOW TABLES;`.

### Frontend can't reach the API / CORS errors
Make sure the backend is running on port `8000` and the frontend on `5173`.

### `mysql: command not found`
Install MySQL, or use XAMPP's bundled MySQL and make sure it's on your `PATH`.

### PowerShell: `The '<' operator is reserved for future use`
PowerShell doesn't support `<` redirection. Use `cmd.exe`, or pipe with `Get-Content run_all.sql | mysql -u root -p`.

### `cd D:\...` doesn't actually change directory
Plain `cd` won't switch drives in `cmd.exe` — use `cd /d D:\path\to\folder` instead.

### Blank page on `npm run dev`
Delete `frontend/node_modules` and `package-lock.json`, then run `npm install` again.

### `Failed to resolve import "..."` in Vite
Check for a filename/import spelling mismatch between the import path and the actual file on disk.

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, React Router, Tailwind CSS, Framer Motion, Recharts, Lucide Icons
- **Backend**: PHP 8.1+, PSR-4 autoloading (no framework), PDO/MySQL
- **Database**: MySQL 8, schema split one file per table plus views/procedures/triggers
- **Auth**: PHP sessions, `password_hash()`, OTP-based password reset

## 📝 Project Structure

```
dotbank/
├── frontend/                # React + Vite single-page app
│   └── src/
│       ├── pages/
│       │   ├── auth/        # Landing, login, register
│       │   ├── user/        # Dashboard, withdraw, pay bill, loans, statements...
│       │   ├── officer/     # Requests queues, deposit requests, alerts, logs
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

---

**Made with ❤️ using React, PHP, and MySQL**
