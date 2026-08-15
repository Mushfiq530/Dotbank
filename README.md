<div align="center">
  <img src="frontend/public/logo.png" alt="DotBank Logo" width="120"/>

  # 🏦 DotBank

  <p><strong>A full-stack banking system with role-based dashboards for users, officers, and admins</strong></p>
  <p>React + Vite frontend · PHP 8 REST API · MySQL</p>

  ![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)
  ![PHP](https://img.shields.io/badge/PHP-8.1%2B-777BB4?logo=php&logoColor=white)
  ![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)
  ![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)
  ![License](https://img.shields.io/badge/License-MIT-green.svg)

</div>

---

## 📚 Table of Contents

- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Backend Notes](#-backend-notes)
- [Known Limitations](#️-known-limitations)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

---

## ✨ Features

- 🔐 **Role-Based Access** — separate experiences for **Users**, **Officers**, and **Admins**, each with their own dashboard
- 👤 **Account Lifecycle** — request a new account, get it approved by an officer or admin, then manage it end-to-end
- 💸 **Money Movement** — withdrawals, bill payments, bank-to-bank and bank-to-mobile transfers, all executed atomically
- 💰 **Loan Requests** — users submit loan requests; officers/admins review and approve
- 📊 **Mini Statements** — monthly transaction breakdowns computed from real transaction history
- 🚨 **Officer Tools** — account requests queue, loan requests queue, large-transaction alerts, user/officer activity logs
- 🔔 **Notifications** — real-time notification feed for account activity, delivered per user
- 🛠️ **Admin Console** — manage users, manage officers, manage accounts, add new officers with a one-time temporary password
- 🔑 **Hardened Auth** — brute-force lockout, session regeneration on login, `HttpOnly`/`SameSite` cookies, OTP-based password reset
- 🧾 **Auditability** — every write to money is wrapped in a real database transaction, with row-locking to prevent double-approvals and race-condition overdrafts
- 🌓 **Light/Dark Theme** — toggle from the UI, built with Tailwind CSS

## 🏗️ Tech Stack

| Layer      | Technology                                                        |
|------------|---------------------------------------------------------------------|
| Frontend   | React 18, Vite, React Router, Tailwind CSS, Framer Motion, Recharts, Lucide Icons |
| Backend    | PHP 8.1+, PSR-4 autoloading (no framework), PDO/MySQL               |
| Database   | MySQL 8 (schema split one file per table, applied in dependency order) |
| Auth       | PHP sessions, PBKDF2-style hashing, OTP-based password reset        |

## 📁 Project Structure

```
dotbank/
├── frontend/                # React + Vite single-page app
│   └── src/
│       ├── pages/
│       │   ├── auth/        # Landing, login, register
│       │   ├── user/        # Dashboard, withdraw, pay bill, loans, statements...
│       │   ├── officer/     # Requests queues, alerts, logs, statements
│       │   └── admin/       # Manage users/officers/accounts
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
    │   ├── Models/          # Account, Transaction, LoanReq, AccountRequest, etc.
    │   ├── Services/        # OTP, SMS (dev stub)
    │   ├── Support/         # Validator, SessionManager
    │   ├── Config/          # Env, Database
    │   └── Exceptions/      # Typed exception hierarchy
    └── schema/               # One .sql file per table + run_all.sql
```

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Notes |
|---|---|
| **PHP 8.1+** with the `pdo` extension | `php -v` to check |
| **MySQL 8** (or MariaDB / XAMPP) | Any MySQL-compatible server |
| **Node.js 18+** and npm | `node -v` / `npm -v` to check |

No Composer install is strictly required — the backend ships with a tiny built-in autoloader — but running `composer install` / `composer dump-autoload` is supported too.

### 1. Set up the database

```bash
cd backend/schema
mysql -u root -p < run_all.sql
```

This creates the `banking_system` database, every table, and a seed admin account so you can log in right away:

| Field | Value |
|---|---|
| Admin ID | `admin` |
| Password | `admin123` |

> The schema is split one file per table (`01_admin.sql` … `17_large_transaction_request.sql`) in dependency order. `run_all.sql` sources them all — run it **from inside `backend/schema/`**, since the `SOURCE` paths are relative to your current directory.

### 2. Configure the backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your real MySQL credentials:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=banking_system
DB_USER=your_mysql_user
DB_PASS=your_mysql_password
DB_CHARSET=utf8mb4
APP_ENV=local
```

### 3. Run the backend

```bash
php -S localhost:8000 -t public
```

Leave this running — it serves the API at `http://localhost:8000/api`.

### 4. Run the frontend

In a **new terminal**, with the backend still running:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

### 5. Try it end to end

1. **Register** a new user from the landing page (*Create an account*)
2. **Log in** as that user → *Open Account* → submit a request
3. **Log in as admin** (`admin` / `admin123`) → *Manage Accounts* to approve it — or add and log in as an **officer** (*Add Officer*) and approve from *Account Requests*
4. **Log back in as the user** → the Dashboard now shows the real account and balance → try *Withdraw*, *Pay Bill*, or *Loan Request*
5. As admin, use **Add Officer** to create an officer login — the temporary password is shown **once** on screen, so copy it for that officer's first login

---

## 🔧 Backend Notes

- **No CORS surprises**: the API is pre-configured to allow requests from the Vite dev server at `http://localhost:5000` with credentials — if you change the frontend port, update `backend/public/index.php`.
- **Transactions are atomic**: transfers, withdrawals, bill payments, and approvals all run inside real database transactions with row-locking, so a failure mid-write can't silently lose or duplicate money.
- **OTP is single-use**: password-reset codes are consumed atomically, closing a replay window.
- **Officer passwords**: new officers get a random 12-character temporary password (not a shared default) and are flagged to reset it on first login.

### Upgrading an existing database

If you already have a `banking_system` database from an older version of this project, see [`backend/README.md`](backend/README.md) for the manual migration statements instead of re-running the full schema.

## ⚠️ Known Limitations

These are the remaining gaps between this project and a production-ready deployment:

- **Forced password reset** — officers are flagged with `must_reset_password` on creation, but the frontend doesn't yet redirect them to a reset screen on first login; they can still sign in with the temporary password as-is.
- **SMS delivery** — `SmsService` is a development stub that writes OTP codes in plaintext to `backend/storage/sms_log.txt` instead of sending a real message. Swap in an actual SMS gateway before any production use.

## 🩺 Troubleshooting

| Problem | Fix |
|---|---|
| `Database::getConnection()` fails loudly on startup | `DB_USER` isn't set — double-check `backend/.env` |
| Frontend can't reach the API / CORS errors | Make sure the backend is running on port `8000` and the frontend on `5173` |
| `mysql: command not found` | Install MySQL or use XAMPP's bundled MySQL, and ensure it's on your `PATH` |
| Blank page on `npm run dev` | Delete `frontend/node_modules` and `package-lock.json`, then `npm install` again |

## 📄 License

This project is open source and available under the MIT License.
