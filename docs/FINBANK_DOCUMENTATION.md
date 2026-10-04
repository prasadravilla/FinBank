# FinBank Project Documentation

> Living project record. Update this document after each user story, keeping implemented behavior separate from planned work.

## 1. Project overview

FinBank is a full-stack project in its initialization stage. The repository contains a React and TypeScript frontend scaffold, an Express backend, PostgreSQL connection configuration, and an initial relational schema for users, accounts, and transactions. The frontend is still the Vite starter screen. The backend currently exposes a health endpoint and checks database connectivity before listening.

This document covers **US-001 — Initialize FinBank Project**. It describes only behavior and structure present in the repository at this stage. Authentication, banking operations, and other application features are not implemented here.

## 2. Current project structure

```text
finbank/
├── .gitignore
├── README.md
├── backend/
│   ├── package.json
│   ├── package-lock.json
│   └── src/
│       ├── server.js
│       └── config/
│           └── db.js
├── database/
│   └── schema.sql
├── docs/
│   └── FINBANK_DOCUMENTATION.md
└── frontend/
    ├── package.json
    ├── package-lock.json
    ├── vite.config.ts
    ├── eslint.config.js
    ├── index.html
    └── src/
        ├── App.tsx
        ├── main.tsx
        ├── App.css
        ├── index.css
        └── assets/
```

The frontend also contains TypeScript configuration files, a `public/` directory, and additional starter assets. The backend `.env` file exists locally and is excluded from this listing because it is private configuration.

## 3. Git initialization and `.gitignore`

The repository has a Git history, including an initialization commit (`chore: initialize FinBank project`). The root `.gitignore` excludes:

- `node_modules/`, build outputs (`dist/`, `build/`), and coverage output.
- `.env` and `.env.*`, while allowing `.env.example` to be tracked.
- Log files and common IDE/OS files.

For a new checkout, initialize Git and make the first commit with commands such as:

```bash
git init
git add .
git commit -m "chore: initialize FinBank project"
```

The repository already has its initialization commit; these commands explain the setup workflow rather than asserting they were run during this documentation update.

## 4. Frontend setup

The frontend uses React 19, TypeScript, Vite, and ESLint. Vite uses `@vitejs/plugin-react`. The ESLint flat configuration applies JavaScript and TypeScript recommended rules, React Hooks rules, and React Refresh rules to TypeScript files.

The checked-in `package.json` scripts provide these commands:

```bash
cd frontend
npm install
npm run dev
npm run build
npm run lint
npm run preview
```

`npm run build` runs `tsc -b` followed by `vite build`; `npm run lint` runs `eslint .`. `npm run dev` starts the Vite development server, and `npm run preview` serves a production build locally.

The frontend entry point mounts the React app in `src/main.tsx`. `src/App.tsx` currently renders the Vite and React starter content, including a local counter. It does not yet implement FinBank screens or call the backend.

**Verification available from the repository:** the Vite, TypeScript, and ESLint configuration and their scripts are present. No claim is made here that a build or lint command was executed successfully as part of this documentation task.

## 5. Backend setup

The backend uses Node.js with ES modules (`"type": "module"`), Express, CORS, dotenv, and `pg`. Nodemon is a development dependency. The package scripts are:

```bash
cd backend
npm install
npm run dev
npm start
```

`npm run dev` invokes `nodemon src/server.js`; `npm start` invokes `node src/server.js`. The source imports use ES module `import` syntax. Express enables CORS and JSON request parsing.

## 6. Backend health endpoint

`GET /api/health` returns JSON with `status: "success"` and the message `FinBank backend is running`. It is a basic process health response; it does not itself query PostgreSQL.

## 7. Startup database validation

Before opening the HTTP listener, `startServer` calls `await pool.query("SELECT 1")`. On success, it logs that the database connected and starts Express on `PORT` or port `3000` by default. On failure, it logs the connection failure and error message, then exits with status 1. This checks that the configured database connection can execute a trivial query during startup.

## 8. Environment configuration

`backend/src/config/db.js` reads these settings from the process environment to construct the pool:

| Variable | Purpose |
| --- | --- |
| `DB_HOST` | PostgreSQL host |
| `DB_PORT` | PostgreSQL port |
| `DB_NAME` | Database name |
| `DB_USER` | Database user |
| `DB_PASSWORD` | Database password |
| `PORT` | Optional HTTP port; defaults to `3000` in the server |

`dotenv.config()` is called by the server and database module so local `.env` values can populate `process.env`. The actual local password is intentionally not documented. `.env` is excluded from Git because it can contain credentials and machine-specific settings. A shareable example file can be used for variable names, but secrets should not be committed.

## 9. PostgreSQL 18 and the `finbank` database

The project configuration expects PostgreSQL connection settings, and the schema is PostgreSQL SQL (including `BIGSERIAL`, `TIMESTAMPTZ`, and PL/pgSQL). The intended local database name is `finbank` (`DB_NAME=finbank`).

PostgreSQL 18 was installed on Windows and verified locally. The `postgresql-x64-18` service was confirmed running, and `psql --version` returned PostgreSQL 18.6. The `finbank` database was created, `database/schema.sql` was successfully applied, and the `users`, `accounts`, and `transactions` tables were verified in the database.

```bash
psql -U postgres -d finbank -f schema.sql
```

The schema command above was run from `C:\finbank\database`. The local backend environment uses `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` to connect to this installation. No database password is included in this document.

## 10. PostgreSQL connection pool

`backend/src/config/db.js` imports `pg`, extracts its `Pool` class, and exports a single `new Pool(...)` configured from environment variables. The server imports this shared pool and uses `pool.query` for its startup connectivity check. No other database queries are currently implemented in the backend.

## 11. Database schema

`database/schema.sql` defines three tables:

| Table | Current purpose and notable columns |
| --- | --- |
| `users` | User record fields: `first_name`, `last_name`, unique `email`, `password_hash`, optional `phone`, `role`, and creation/update timestamps. |
| `accounts` | Account belongs to a user; includes unique `account_number`, `account_type`, `balance`, `status`, and creation/update timestamps. |
| `transactions` | Transaction belongs to an account; includes `transaction_type`, `amount`, `balance_after`, unique `reference`, optional `description`, and creation timestamp. |

`users.id`, `accounts.id`, and `transactions.id` are `BIGSERIAL PRIMARY KEY` values. `accounts.user_id` references `users(id)` through `fk_accounts_user`. `transactions.account_id` references `accounts(id)` through `fk_transactions_account`. Email, account number, and transaction reference are each declared `UNIQUE`.

The explicit check constraints are `chk_transaction_type`, which limits the value to `DEPOSIT`, `WITHDRAWAL`, or `TRANSFER`, and `chk_transaction_amount`, which requires `amount > 0`. Other columns have `NOT NULL`, defaults, or both as shown in the SQL. There is currently no check constraint for account balance, account type, account status, or user role.

## 12. Monetary precision

Account balances, transaction amounts, and post-transaction balances use `NUMERIC(15, 2)`. A fixed-precision decimal type is appropriate for monetary values because decimal amounts need predictable two-place precision; binary floating-point arithmetic can introduce representation rounding. The schema allows up to 15 total digits, with 2 digits after the decimal point. Application-level monetary calculations and validation have not yet been implemented.

## 13. Table relationships

The foreign keys encode these one-to-many relationships:

```text
users (1) ────< accounts (many) ────< transactions (many)
```

Each account row must reference one user. A user can be associated with multiple account rows. Each transaction row must reference one account, and an account can have multiple transaction rows. These cardinalities follow from the non-null foreign key columns; there are no reverse relationship APIs implemented yet.

## 14. `updated_at` function and triggers

The schema defines the PL/pgSQL trigger function `update_updated_at_column()`. It assigns `CURRENT_TIMESTAMP` to `NEW.updated_at` and returns the updated row.

Two `BEFORE UPDATE FOR EACH ROW` triggers call this function:

- `set_users_updated_at` on `users`.
- `set_accounts_updated_at` on `accounts`.

Transactions currently have only a `created_at` column and no `updated_at` column. Consequently, there is no transaction `updated_at` trigger. The schema captures transaction creation time; transaction correction or mutation policy has not been implemented.

## 15. Verification performed and evidence

The following implementation and local environment checks were verified:

- The React/Vite frontend started successfully in a browser.
- PostgreSQL 18.6 was verified with `psql --version`, and the `postgresql-x64-18` service was running.
- The `finbank` database was created, and `users`, `accounts`, and `transactions` were created successfully.
- Table definitions were inspected using PostgreSQL `\d`.
- The `update_updated_at_column()` trigger function was created. The `set_users_updated_at` and `set_accounts_updated_at` triggers were created and verified.
- Backend database connectivity was tested successfully. Backend startup executed `SELECT 1` successfully and started on port 3000.
- `GET /api/health` was tested successfully and returned:

  ```json
  { "status": "success", "message": "FinBank backend is running" }
  ```

Frontend build and lint commands were not run, so their successful completion has not been verified.

## 16. Problems encountered and solutions

1. `psql` was initially unavailable from the terminal because PostgreSQL's `bin` directory was not on `PATH`. The PostgreSQL 18 `bin` directory was added to the user `PATH`, after which `psql --version` was verified successfully.
2. The schema command was initially run from the wrong directory. From `C:\finbank\database`, it was corrected to:

   ```powershell
   psql -U postgres -d finbank -f schema.sql
   ```

3. PostgreSQL's pager was disabled with `\pset pager off` to make table inspection easier.
4. The initial schema used `updated_at DEFAULT CURRENT_TIMESTAMP`, which sets the initial value but does not automatically refresh it when a row changes. A PostgreSQL trigger function and triggers were added for `users` and `accounts` to maintain `updated_at` on updates.
5. `npm install -D nodemon` reported 3 high-severity vulnerabilities. `npm audit fix --force` was intentionally not run because dependency changes were not appropriate during this foundation stage. The vulnerabilities are not claimed to be fixed.

## 17. Concepts learned

- A Vite React TypeScript scaffold provides a frontend entry point and repeatable development/build/lint commands.
- ES modules use `import`/`export` and are enabled for the backend through the package `type` field.
- Express middleware can enable CORS and JSON parsing, while routes define HTTP behavior.
- `pg.Pool` manages PostgreSQL connections for backend queries.
- Startup connectivity checks can fail fast before the server accepts requests.
- Relational primary keys and foreign keys represent row identity and relationships; unique and check constraints enforce selected data rules in the database.
- Fixed-precision decimal columns are suitable for storing monetary amounts.
- Database triggers can maintain timestamps when rows are updated.
- Environment files keep local credentials out of version control.

## 18. Interview discussion points

- Why does the backend run `SELECT 1` before listening, and what happens if it fails?
- What responsibilities do `pg.Pool`, Express, CORS, and dotenv each serve in this setup?
- Why use `NUMERIC(15, 2)` for money instead of a floating-point type?
- How do the foreign keys establish the user-account-transaction relationship?
- Which data rules are enforced by unique/check constraints, and which are not yet represented in the schema?
- Why are update timestamp triggers defined for users and accounts, but not transactions?
- Why should `.env` remain untracked, and how can a project document required variable names safely?
- Which parts of the current frontend are still starter content?

## 19. US-001 completion checklist

- [x] Git repository exists with an initialization commit.
- [x] Root `.gitignore` excludes dependencies, generated output, logs, and environment files.
- [x] React, TypeScript, Vite, and ESLint frontend scaffold and scripts exist.
- [x] Node.js/Express backend includes CORS, dotenv, nodemon, `pg`, and ES module configuration.
- [x] `GET /api/health` is implemented.
- [x] Backend checks its database connection with `SELECT 1` before listening.
- [x] PostgreSQL pool configuration reads environment-based connection settings.
- [x] Initial users, accounts, and transactions schema, constraints, and timestamp triggers exist.
- [x] PostgreSQL 18 was installed and verified locally, including PostgreSQL 18.6 and the running PostgreSQL service.
- [x] The `finbank` database was created and the users, accounts, and transactions schema was successfully applied and verified.
- [ ] Successful frontend build/lint and live database/endpoint checks are not evidenced by this documentation inspection.

## 20. Next planned user story

**US-002 — Define Architecture** is the next planned user story. Its scope and implementation details should be added here after they are defined and completed; no architecture beyond the current files is asserted in this document.
