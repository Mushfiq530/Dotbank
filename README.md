# Dot Bank — Connected (Frontend + Backend + Database)

Everything's now wired together for real: React frontend -> PHP API -> MySQL.
No mock data left in the frontend; every page calls a real endpoint.

## 1. Set up the database (one-time)

Install MySQL (or XAMPP, which bundles it) if you don't have it yet.

```bash
cd backend/schema
mysql -u root -p < run_all.sql
```

The schema is split one file per table (`01_admin.sql` ... `15_user_log.sql`)
under `backend/schema/`, in dependency order so foreign keys always find the
table they reference already created. `run_all.sql` sources them all in the
right order — run it from inside `backend/schema/` (the `SOURCE` paths are
relative to your current directory, not the script's location).

This creates the `banking_system` database, every table, and one seed admin
account so you can log in immediately:
- **Admin ID:** `admin`
- **Password:** `admin123`

## 2. Configure the backend

```bash
cd backend
cp .env.example .env
```

Open `.env` and set `DB_USER` / `DB_PASS` to your real MySQL credentials
(same ones you used in step 1).

## 3. Run the backend

```bash
php -S localhost:8000 -t public
```

You should see `PHP ... Development Server ... started`. Leave this running.
No Composer needed — there's a tiny built-in autoloader.

## 4. Run the frontend (new terminal, keep the backend running)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## 5. Try it end to end

1. Register a new user (Landing -> Create an account -> fill the form)
2. Log in as that user -> Open Account -> submit a request
3. Log in as **admin** (`admin` / `admin123`) -> Manage Accounts, or log in as
   an officer once you've added one -> Account Requests -> approve it
4. Log back in as the user -> Dashboard now shows the real account and
   balance -> try Withdraw / Pay Bill / Loan Request
5. As admin, use **Add Officer** to create an officer login — the temporary
   password is shown once on screen, copy it for that officer's first login

## What changed on the frontend to match the real backend

- Registration now collects **Email** (backend requires it) and only offers
  **Bank User** signup — Officer accounts are created by an Admin via the new
  **Add Officer** page, matching how the backend actually creates officers
  (instant creation + one-time temp password, not a request queue)
- **Withdraw** now shows an instant success/failure result instead of a fake
  pending/approve/reject queue — the backend executes transfers immediately
- **Loan Request** no longer has a purpose/reason field — the backend's
  `loan_request` table has no column for it
- Approvals (account requests, loan requests) only need **one** approver
  (officer or admin, whichever acts first) — the backend tracks a single
  `reviewed_by`, not two separate sign-offs
- **Manage Users** no longer has a remove button — there's no delete-user
  endpoint in the backend yet
- Dashboard's balance-history chart is removed — there's no endpoint that
  tracks balance over time; Mini Statement now computes its monthly
  breakdown by grouping your real transaction history client-side instead

## Known gaps (things that will error until added)

- No endpoint creates `notification` rows anywhere yet, so the Notifications
  page will always show "No notifications yet" — the read endpoint exists,
  nothing writes to it yet
- Officer login's temporary password requires a "must reset password" flow
  that isn't built into the frontend yet — the officer can still log in
  with the temp password as-is, there's just no forced reset screen
