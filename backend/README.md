# Banking System — Backend

Restructured, hardened version of the uploaded backend. PSR-4 autoloaded
under the `App\` namespace, config pulled from environment variables
instead of hardcoded in source.

## Setup

```bash
composer install          # or: composer dump-autoload, if you're not using any packages
cp .env.example .env
# edit .env with your real DB_USER / DB_PASS
```

Any entry script (a controller/router you wire up) starts with:

```php
require_once __DIR__ . '/bootstrap.php';

use App\Controllers\UserController;
```

## Schema

`schema/` holds the full schema split one file per table (`01_admin.sql`
through `15_user_log.sql`), ordered so a table is always created before
anything that references it with a foreign key. `schema/run_all.sql` sources
them all — run it from inside `backend/schema/`:

```bash
cd backend/schema
mysql -u root -p < run_all.sql
```

The now-removed monolithic `schema.sql` already had the fixes below baked
in (`must_reset_password`, `login_attempt.account_type`, `deposit_request`);
they're kept here as a reference for anyone still running against an older
database that predates the split.

## Required database migrations

If you're upgrading an *existing* `banking_system` database that was
created before these fixes existed, run these manually instead of
re-running the full schema:

```sql
-- 1. Officers get a random temporary password now instead of a shared
--    hardcoded "123456". This flag lets you force a reset on first login.
ALTER TABLE officer
  ADD COLUMN must_reset_password TINYINT(1) NOT NULL DEFAULT 1;

-- 2. Brute-force lockout now covers officer/admin logins too, not just
--    regular users, so login_attempt needs to record which actor type
--    a given user_id belongs to.
ALTER TABLE login_attempt
  ADD COLUMN account_type VARCHAR(10) NOT NULL DEFAULT 'USER';

-- 3. If you don't already have a deposit_request table (see note in
--    src/Models/DepositRequest.php — the original class body wasn't in
--    the file you sent me, so this is reconstructed from its one call
--    site), something like:
CREATE TABLE IF NOT EXISTS deposit_request (
  request_id      VARCHAR(64) PRIMARY KEY,
  requester_name  VARCHAR(255) NOT NULL,
  source          VARCHAR(255) NOT NULL,
  amount          DECIMAL(15,2) NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  reviewed_by     VARCHAR(64) NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

Enforcing `must_reset_password` (e.g. redirecting an officer straight to
the reset-password screen after login if it's set) has to happen in
whatever login/session-handling entry script you build on top of
`LoginController` — that UI layer wasn't in the uploaded code.

## What changed and why

**Credentials / config**
- DB host/user/password moved out of source into `.env` (`src/Config/Env.php`, `src/Config/Database.php`). `Database::getConnection()` now fails loudly with a clear message if `DB_USER` isn't set, rather than silently connecting as `root` with no password.

**Officer default password**
- `Officer::create()` no longer hashes the literal string `"123456"` for every new officer (a standing vulnerability — anyone who knew an officer ID could log in as them). It now generates a random 12-character temporary password, returns it once for the admin to hand off securely, and sets `must_reset_password = 1`.

**Money-movement atomicity**
- `MoneyTransfer::transfer`, `BillPayment::pay`, `BankToBank::transfer`, `BankToMobile::transfer`, `AccountRequest::approve`, `LoanReq::approve`, `DepositRequest::approve`, and `TransactionController::deposit`/`withdraw` now wrap their multi-statement writes in a real DB transaction (`Database::transaction()`, `beginTransaction`/`commit`/`rollBack`). Previously a failure partway through any of these (e.g. the balance updates but the record insert throws) could silently lose or duplicate money with no correct record of what happened.
- `BankToBank`: the original withdrew the sender's balance in the *controller*, then called the model to record the transfer as a separate step — if the record insert failed, the money was already gone with nothing to show for it. The withdrawal now happens inside `BankToBank::transfer` itself, atomically with the record.

**Balance race condition**
- `Account::withdraw()` used to check `$amount > $this->balance` in PHP against a balance read moments earlier, then issue a separate `UPDATE`. Two concurrent withdrawals could both pass that check before either write landed, overdrawing the account. It's now a single conditional `UPDATE ... WHERE balance >= ?`, checked via `rowCount()` — the database enforces the invariant, not a stale PHP variable.
- `AccountRequest::approve` and `LoanReq::approve` now `SELECT ... FOR UPDATE` the request row inside their transaction and check its status is still `PENDING`, closing a similar race where the same request could be approved twice concurrently.

**OTP replay**
- `OtpService::verifyOtp()` + a separate `markUsed()` call left a window where the same OTP could be accepted twice in quick succession. Replaced with `consumeOtp()`, a single atomic `UPDATE ... WHERE used = FALSE AND expires_at > NOW()` that only succeeds once.

**Login / session hardening**
- Brute-force lockout (`LoginAttempt`) now covers officer and admin logins, not just regular users — the original only rate-limited `userLogin`.
- Session ID is regenerated on every successful login (`SessionManager::regenerate()`), preventing session-fixation attacks.
- Session cookies are now `HttpOnly`, `SameSite=Lax`, and `Secure` in production (`APP_ENV=production`).
- `SessionManager::logout()` clears `$_SESSION`, expires the session cookie, and destroys the session, instead of just calling `session_destroy()`.

**Validation & duplicate handling**
- Added `App\Support\Validator` (email format, mobile format, positive-amount bounds, password length, non-empty). Applied at controller boundaries: registration, officer creation, password reset, and every money-moving action.
- `User::create()` and `Officer::create()` now catch a duplicate-key `PDOException` (SQLSTATE 23000) and rethrow as a friendly `DuplicateEntryException` instead of letting a raw PDO exception escape.

**Error handling**
- Replaced generic `throw new Exception(...)` everywhere with a small typed hierarchy (`NotFoundException`, `ValidationException`, `AuthenticationException`, `InsufficientFundsException`, `DuplicateEntryException`), all extending `AppException`. Callers can now catch specific failure types instead of pattern-matching on message strings.

**Minor**
- `Notification::getUserNotifications`, `OfficerLog::getLogs`, `UserLog::getLogs` now take `$limit`/`$offset` instead of returning unbounded result sets.
- `SmsService` writes its dev log to `storage/sms_log.txt` (created on demand) instead of next to source files, and is documented as a stub to replace with a real SMS gateway before production — it currently contains plaintext OTP codes.

## Not changed / out of scope

- No view layer, router, or forms were in the uploaded files, so there's nothing here enforcing CSRF tokens on state-changing requests — add that at whatever HTTP-handling layer you put in front of these controllers.
- `DepositRequest` is a reconstruction (see the note above and in the file itself) since its class body wasn't in what you uploaded — check it against your real version.
