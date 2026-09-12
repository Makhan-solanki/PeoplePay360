c.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo actually is

**PeoplePay360** — an HR & Payroll management system (Employees, Contracts, Working Schedules,
Attendance, Time Off, Payroll). The repo started from a generic "Hackathon 2026" full-stack
boilerplate (`docs/boilarplat.md` describes that original scaffold, and `README.md` still
reflects it — email/password auth, `ADMIN`/`USER` roles, `admin@hack.dev`). **Both are stale.**
The real domain, roles (`EMPLOYEE` / `HR_MANAGER` / `HR_PAYROLL_MANAGER`), and module set are
described in `docs/root-architecture.md`, `docs/architecture.md`, `docs/backend.md`, and — most
importantly — **`docs/integration.md`**, which documents what was actually built on top of the
plan: the real route map, which actions are genuinely wired to the backend vs. intentionally
left as a visible "not wired yet" signal, every schema change, and a working-method section
worth reading before touching any dashboard page. Read `docs/integration.md` first for anything
non-trivial.

## Commands

Monorepo via npm workspaces (`backend`, `frontend`). Run from repo root unless noted.

```bash
npm run dev                    # both backend (3001) + frontend (3000) concurrently
npm run dev:backend            # backend only — REQUIRES backend/.env (see Environment below)
npm run dev:frontend           # frontend only

npm run build                  # backend tsc build + frontend next build
npm run lint                   # eslint backend + next lint frontend
npm run typecheck              # tsc --noEmit both workspaces

npm test                       # vitest run, backend then frontend
npm test -w backend            # backend unit/integration tests only
npm test -w frontend           # frontend component tests only
npm run test:e2e               # playwright, auto-starts both dev servers (see gotcha below)
npm run test:ci                # backend + frontend tests, then playwright --project=chromium

npm run db:migrate             # prisma migrate dev (backend) — see "Do not use" below
npm run db:seed                # tsx backend/prisma/seed.ts
npm run db:studio              # prisma studio

npm run docker:up / :down / :logs   # docker-compose for the full stack
```

**Single test file:** vitest and playwright both accept a path filter directly —
`npx vitest run src/__tests__/payroll.test.ts -w backend` (or `cd backend && npx vitest run
src/__tests__/payroll.test.ts`) / `npx playwright test tests/auth-flow.spec.ts`. Backend tests
live in `backend/src/__tests__/` (flat files plus `unit/` and `integration/` subfolders);
frontend tests in `frontend/src/__tests__/components/`.

**Do not run `npx prisma migrate dev` / `db:migrate` against the dev DB.** There is no tracked
migration history — the schema was built with `prisma db push`, and `migrate dev` will demand a
full reset the moment it detects drift. For any schema change, use
`npx prisma db push --schema=prisma/schema.prisma` from `backend/` instead: it's additive-safe
and won't touch existing rows. Never drop/rename an existing column this way — only add new
tables/nullable columns.

## Environment (read this before starting the backend)

- **The backend has a real `.env` loader now** — `dotenv/config` is imported as the literal
  first line of `backend/src/index.ts`. If a fresh `npm run dev -w backend` ever fails with
  `Environment validation failed: DATABASE_URL: Required...`, that import is the first thing to
  check (someone reordered `index.ts`'s imports). Before this fix, every required env var had to
  be passed manually on the command line — don't reintroduce that.
- **Local Postgres runs on port 5433**, not the Postgres default 5432 (`docker-compose.yml`,
  container `hackathon-postgres`). `backend/.env` is already pointed at it correctly.
  **`e2e/playwright.config.ts` and `.github/workflows/ci.yml` both hardcode port 5432** for their
  own throwaway Postgres — that's intentional for CI, not a bug to "fix" to match local dev.
- Seed accounts (`backend/prisma/seed.ts`), all password `Password123!`:
  `payroll@peoplepay360.com` (HR_PAYROLL_MANAGER), `hr@peoplepay360.com` (HR_MANAGER),
  `john.doe@peoplepay360.com` / `jane.smith@peoplepay360.com` (EMPLOYEE, each linked to a real
  Employee record). The two HR/Payroll accounts have **no linked Employee** — expect `null` from
  anything that joins through `User.employee` for them (e.g. the Attendance Widget renders
  nothing for them; a Time Off decision they make shows their email, not a name).
- If `curl localhost:3001` ever behaves unexpectedly (wrong data, login fails for accounts that
  definitely exist), check whether something else is bound to that port from a different
  checkout before assuming this repo's code is broken — `netstat -ano | findstr :3001` then
  `Get-CimInstance Win32_Process -Filter "ProcessId = <pid>"` on Windows. This has happened
  before; see `docs/integration.md` §6.
- **No headless browser is available in this environment** (no internet access to fetch a
  Chromium binary — `npx playwright install` will time out). Verify UI-affecting backend changes
  by starting a throwaway backend instance on a spare port against the same local Postgres, and
  driving it with `curl`. `docs/integration.md` §1 has the exact pattern used throughout this
  project, including cleaning up test rows afterward with `docker exec hackathon-postgres psql`.

## Backend architecture (`backend/src/modules/`)

Each domain is a self-contained module folder: `<name>.schema.ts` (Zod validation + inferred
types), `<name>.service.ts` (business logic + Prisma calls — this is where invariants live),
`<name>.controller.ts` (thin HTTP handlers, no logic), `<name>.routes.ts` (wires
`authenticate`/`authorize` + `validate` middleware, then mounted in `src/index.ts`). Modules:
`auth`, `employee`, `contract`, `working-schedule`, `attendance`, `timeoff`, `payroll`, plus
`health` and `upload` from the original scaffold. Every response is
`{ success, data, error }` via `lib/apiResponse.ts`; errors are custom classes in `lib/errors.ts`
(`NotFoundError`, `ConflictError`, `BadRequestError`, etc.) caught centrally by
`middleware/errorHandler.ts` — throw one of these from a service, don't hand-roll `res.status()`
calls in a controller.

**Business invariants that must not regress** (each has a test in `backend/src/__tests__/`):
- **Contracts**: no two `ACTIVE` contracts for the same employee may have overlapping date
  ranges (`contract.service.ts`, `assertNoOverlappingActiveContract`). Indefinite contracts
  (`endDate: null`) are treated as ending `9999-12-31`.
- **Time off**: approving a request atomically increments `TimeOffAllocation.usedDays` in the
  same transaction as the status change — never approve without re-checking remaining balance
  first (`timeoff.service.ts`).
- **Payroll**: `computeSalaryBreakdown` runs `SalaryRule`s in `sequence` order — `BASIC` →
  `ALLOWANCE` → `GROSS` → `DEDUCTION` → `NET`. `Payslip.workedDays`/`workedHours`-style derived
  fields are never accepted as client input; they're always recomputed server-side. The
  2-step Payrun flow matters: a `Payrun` row must not exist until employees are actually
  selected (`POST /payruns` then immediately `POST /payruns/:id/generate`, called back-to-back
  from the frontend wizard — see `docs/integration.md` for why this is a frontend-sequencing
  concern, not a backend one). There's both a payrun-level `pay`/`compute` (bulk, all payslips)
  and a payslip-level one (single payslip; requires the parent payrun already `VALIDATED`) — they
  are genuinely different actions for different UI surfaces, not duplicates.
- **Attendance / WorkingSchedule**: `workedHours`, `daysPerWeek`, `hoursPerWeek` are always
  derived from timestamps/day-rows server-side (`computeDayHours` in
  `working-schedule.service.ts` handles overnight shifts where end time ≤ start time).

**Schema changes are additive only** (see `db:migrate` warning above). `WorkingSchedule` /
`WorkingScheduleDay` are new models; `Employee.scheduleId`, `Contract.workingScheduleId`, and
`TimeOffRequest.decidedById`/`decidedAt` are new nullable FKs bolted onto existing models — the
legacy `Employee.workingSchedule` free-text field is intentionally still there as a fallback
display value when `scheduleId` is null, don't remove it.

## Frontend architecture (`frontend/src/app/dashboard/`)

App Router. `dashboard/layout.tsx` wraps every route in `ProtectedRoute` + `AppTopbar`
(`components/shared/app-topbar.tsx`) — the topbar owns both the desktop dropdown nav and the
mobile hamburger menu; add a new nav destination in the `NAV_GROUPS` array there, not just as a
raw `<Link>`, or it won't show up on mobile. `/dashboard` itself just redirects to
`/dashboard/employees`. Route structure mirrors the backend modules 1:1 (e.g.
`dashboard/payroll/payruns/[id]/page.tsx` ↔ the `payroll` module); `docs/integration.md` §2 has
the full page-by-page map.

**Recurring page shape**: `w-full p-4 sm:p-6 space-y-5 sm:space-y-6` outer wrapper (no
`max-w-*xl mx-auto` — that was deliberately removed everywhere so pages use the full viewport
width, not centered with large gutters), a white `rounded-2xl border p-4 sm:p-6` card for
content, every `<table>` wrapped in `overflow-x-auto`, every filter/search row
`flex-col sm:flex-row`. Match this instead of inventing a new layout per page.

**Two honest-signal conventions used throughout** (see `docs/integration.md` §1 and §5 for the
full rationale and the current list of what's still in each state) — keep using them for any new
feature that outruns backend support, rather than faking success or silently no-op'ing:
- **Local-only edit**: a field is editable and "Save" updates component state only, with a code
  comment noting persistence is pending — used when a real record exists but no update endpoint
  does yet.
- **"Not wired yet" notice**: an inline amber banner instead of a silent no-op or a raw 404 —
  used for create/approve actions with no backend counterpart at all (e.g. Allocation
  Approve/Refuse — `TimeOffAllocation` genuinely has no status field, so don't invent one without
  a real design decision behind it).

Shared building blocks worth reusing rather than recreating: `components/shared/status-badge.tsx`
(`StatusBadge`, tone-mapped by status string), `components/employees/employee-avatar.tsx`
(deterministic initials/color), `components/ui/dropdown-menu.tsx` (thin Radix wrapper used by the
topbar), and the per-module `new-*-modal.tsx` components (`fixed inset-0 ... max-h-[90vh]
overflow-y-auto`, `px-4 sm:px-6` — copy one of these for a new "create" modal rather than
starting from scratch).

Charts on the Payroll dashboard (`components/payroll/dashboard-charts.tsx`) are hand-rolled
inline SVG (no charting library) — single-hue bars for single-series data, the app's existing
status colors (StatusBadge palette) for multi-state data, never a rainbow per-category. If adding
another chart, load the `dataviz` skill first rather than eyeballing a palette.

`lib/api.ts` is a thin fetch wrapper with automatic access-token refresh on 401; it returns
`{ success, data, error }` matching the backend envelope exactly — components check `res.success`
before touching `res.data`, never assume success.
