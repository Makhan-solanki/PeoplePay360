# PeoplePay360 — Frontend/Backend Integration Log

> **Purpose:** `architecture.md` / `backend.md` / `root-architecture.md` describe the original
> 24h hackathon plan. This file describes what actually got built on top of that plan during
> the UI-then-backend integration pass — the real route map, which actions are genuinely wired
> vs. intentionally left as a visible gap, and the workflow used to verify changes. Read this
> before touching any dashboard page or adding a new module; it tells you where the real
> boundary between "done" and "known gap" currently sits.

---

## 1. How this was built — the working method

Each module went through two passes, and the pattern is worth repeating for new modules:

1. **UI pass** — build the page against the mockup, wire every action that already has a real
   backend endpoint, and for anything that doesn't, show an honest signal instead of faking
   success. Two signals are used consistently:
   - **Local-only edit**: the field becomes editable and "Save" updates component state only,
     with a code comment noting persistence is pending. Used when there's an existing record
     to view but no update endpoint yet (e.g. Salary Rule edit, before it got wired).
   - **"Not wired yet" notice**: an amber inline banner instead of silently doing nothing or
     hitting a 404. Used for create actions with no backend counterpart at all.
2. **Backend integration pass** — add the missing endpoint(s), then go back and replace the
   local-only state / notice with a real API call. Nothing is "half-migrated": once a
   capability is wired, the placeholder code for it is deleted, not left dormant.

**Never fabricate data or state that has no real source.** Several mockup fields don't exist
in the schema (Employee Type, Company, contract "Quantity", allocation approval status). Where
a field is genuinely absent, either derive it honestly from real fields (documented per-module
below) or state plainly that it isn't tracked — never invent a plausible-looking number.

### Verifying changes without a browser

No headless-browser (Playwright/Chromium) is available in this sandbox — there's no internet
access to download the browser binary. Every verification pass in this project instead:
1. Ran `npx tsc --noEmit` and `npx next build` in `frontend/` (catches type errors and any
   Suspense/routing issues at build time).
2. Started a **throwaway backend instance** on port **4001** (the real dev backend usually
   squats on 3001 from a different checkout — see §6), pointed at the same local Docker
   Postgres, with inline env vars:
   ```bash
   DATABASE_URL="postgresql://hackathon:hackathon_secret@localhost:5433/hackathon_db?schema=public" \
   PORT=4001 NODE_ENV=development \
   JWT_SECRET=... JWT_REFRESH_SECRET=... CORS_ORIGINS="http://localhost:3000" \
   npx tsx src/index.ts
   ```
3. Drove the real endpoints with `curl` scripts that log in, exercise the new flow end-to-end,
   and print the response shape.
4. **Cleaned up test rows** after each pass (`docker exec hackathon-postgres psql ...`) and
   killed the port-4001 process. Never leave verification data behind in the seeded dev DB.

---

## 2. Route map

Layout: `frontend/src/app/dashboard/layout.tsx` wraps every route below in `ProtectedRoute` +
`AppTopbar` (`components/shared/app-topbar.tsx`). `/dashboard` itself just redirects to
`/dashboard/employees` — that's the post-sign-in landing page.

Top nav is a set of dropdown menus (`components/ui/dropdown-menu.tsx`, a thin wrapper over
`@radix-ui/react-dropdown-menu`), one per module:

| Nav item | Dropdown items | Notes |
|---|---|---|
| **Employees ▼** | All Employees, Working Schedules | Working Schedules lives under Employees per the original mockup |
| **Contracts ▼** | All Contracts, New Contract | |
| **Attendance** | *(flat link, no dropdown)* | |
| **Time Off ▼** | Dashboard, Time offs, Time off Types, Allocations | "Do not add separate top-level buttons" was an explicit requirement — everything nests here |
| **Payroll ▼** | Dashboard, Payruns, Payslips, Structures, Rules | |

Plus a persistent **Attendance Widget** (`components/shared/attendance-widget.tsx`) in the
topbar itself — a check-in/out popover available from every page, not just the Attendance
module.

### Full page list

```
/dashboard/employees                          Kanban + List, search
/dashboard/employees/[id]                     Work/Private Info tabs, smart buttons (Time Off/Contracts/Attendance)
/dashboard/working-schedules                  List + Calendar (weekly hours grid)
/dashboard/working-schedules/[id]             Form; id="new" for creation

/dashboard/contracts                          List
/dashboard/contracts/[id]                     Form; id="new" for creation

/dashboard/attendance                         List, Today filter, Employee chip, NEW (check-in modal)
/dashboard/attendance/[id]                    Detail + manual correction Edit

/dashboard/time-off                           Dashboard (KPI cards + pending-approvals shortlist)
/dashboard/time-off/requests                  List, NEW, My Team filter, inline Approve/Refuse
/dashboard/time-off/requests/[id]             Detail, Approve/Refuse, real Approver
/dashboard/time-off/types                     List, NEW
/dashboard/time-off/types/[id]                Form, Edit
/dashboard/time-off/allocations               List (aggregated), NEW
/dashboard/time-off/allocations/[id]          Detail — Approve/Refuse intentionally not wired (see §5)

/dashboard/payroll                            Cross-module Dashboard (KPIs, charts, filters — see §4)
/dashboard/payroll/payruns                    List (cards), year filter, NEW (2-step wizard)
/dashboard/payroll/payruns/[id]               Workspace: recompute/validate/pay, payslip breakdown
/dashboard/payroll/payslips                   List (aggregated), Period filter
/dashboard/payroll/payslips/[id]              Detail: Compute/Mark Paid (per-payslip), Print (window.print())
/dashboard/payroll/structures                 List, NEW
/dashboard/payroll/structures/[id]            Form, Edit, rules table (links into Rules)
/dashboard/payroll/rules                      List, NEW, Structure filter
/dashboard/payroll/rules/[id]                 Form, Edit, "computation options" reference panel
```

---

## 3. Backend API surface

Base URL `/api`. Everything below `router.use(authenticate)`; role gates noted per route.
Modules not listed here (health, upload) are untouched from the original scaffold.

### New module: `working-schedule` (`/api/working-schedules`)
Entirely new — not in the original hackathon scope. Backs the Employees ▼ → Working Schedules
screen and the Employee/Contract "Working Schedule" picker.
- `GET /` , `GET /:id` — open to any authenticated role.
- `POST /`, `PUT /:id` — `HR_MANAGER` / `HR_PAYROLL_MANAGER`. Body: `{ name, calendarType,
  company, timezone, status, days: [{ day, startTime, endTime, breakMinutes }] }`.
- **`daysPerWeek` and `hoursPerWeek` are always server-derived from the `days` array** —
  never accept them as client input. `computeDayHours` in `working-schedule.service.ts`
  handles overnight shifts (end time ≤ start time wraps past midnight).

### `employee` (`/api/employees`)
- Added `scheduleId` (optional FK to WorkingSchedule) to create/update payloads and to the
  list/detail includes.
- `GET /:id` also includes `manager`, `subordinates`, `contracts` (with `workingSchedule`),
  `timeOffRequests`, `timeOffBalances`.

### `contract` (`/api/contracts`)
- `GET /` **with no `employeeId` query param now returns all contracts** (previously
  `employeeId` was mandatory and threw 400). `?employeeId=X` still filters to one employee.
  This is what the global Contracts list and the Payroll dashboard's per-department salary
  aggregation both rely on — no separate "list all" endpoint was needed.
- Added `workingScheduleId` (optional FK) to create/update and to all includes.

### `attendance` (`/api/attendances`)
- `GET /:id` — single record with `employee.manager` included (route ordering note: this is
  registered *after* `GET /today/:employeeId`, but since one is `/:id` (one segment) and the
  other is `/today/:employeeId` (two segments) they never collide regardless of order).
- `PUT /:id` — `HR_MANAGER` / `HR_PAYROLL_MANAGER`. Manual correction of `checkIn`, `checkOut`,
  `status`, `notes`. **`workedHours` is always recomputed server-side** when both timestamps
  are known — it is never accepted as a raw field on the request body.

### `payroll` (`/api/payroll`)
- `POST /structures`, `PUT /structures/:id` — `HR_PAYROLL_MANAGER`.
- `POST /structures/:structureId/rules`, `PUT /rules/:id` — `HR_PAYROLL_MANAGER`. No `DELETE`
  route exists (not requested by any mockup).
- `POST /payslips/:id/compute` — recomputes **one** payslip in place (re-derives its contract,
  re-runs `computeSalaryBreakdown`), then refreshes the parent payrun's aggregate totals.
  Throws if the parent payrun is already `PAID`.
- `POST /payslips/:id/pay` — marks **one** payslip `PAID`. Requires the parent payrun to
  already be `VALIDATED` (or `PAID`) — this is a real guard rail, verified live: paying before
  validation returns a 400. If marking this payslip paid makes every sibling payslip in the
  payrun `PAID` too, the payrun itself is promoted to `PAID` automatically; otherwise the
  payrun stays `VALIDATED` with a mix of paid/unpaid payslips. This is genuinely different
  from the pre-existing payrun-level `/payruns/:id/pay`, which pays every payslip in the batch
  at once — both endpoints exist and serve different UI actions (Payrun workspace vs. Payslip
  detail page).
- **2-step Payrun wizard timing**: `POST /payruns` (step 1, scope only) and
  `POST /payruns/:id/generate` (step 2, employee selection) both already existed. What changed
  was **frontend sequencing only** — the wizard used to call `POST /payruns` the moment step 1
  was submitted (so an empty DRAFT payrun existed before any employee was picked). It now holds
  the scope in local state through step 1, and only calls `POST /payruns` immediately followed
  by `POST /payruns/:id/generate` when "Create payrun" is clicked in step 2 — so the Payrun row
  genuinely doesn't exist until employees are selected, per the explicit spec requirement.

### `timeoff` (`/api/time-off`)
- `POST /types`, `PUT /types/:id` — `HR_MANAGER` / `HR_PAYROLL_MANAGER`.
- `POST /allocations` — `HR_MANAGER` / `HR_PAYROLL_MANAGER`. **Upserts** on
  `(employeeId, timeOffTypeId, year)` — calling it again for the same triple *replaces*
  `allocatedDays`, it does not add to it. This is a correction tool, not an accrual ledger.
- `approveTimeOffRequest` / `rejectTimeOffRequest` now take the acting user's id and stamp
  `decidedById` + `decidedAt` on the request (schema addition, see §4). Both include
  `decidedBy: { id, email, employee: { firstName, lastName } }` in their response and in the
  list endpoint, so the UI can show a real name when the deciding user has a linked Employee,
  falling back to their email when they don't (both seeded HR/Payroll accounts have no linked
  Employee record — this fallback path is real, not theoretical).

### `auth` (`/api/auth`)
- `login` and `GET /me` (`getProfile`) now both include the caller's linked `employee`
  (`{ id, firstName, lastName, employeeCode, department, jobPosition }`, or `null`). This is
  what let the Attendance Widget drop its old "match by email against the employee directory"
  workaround. `register` still can't include one — self-service signup never creates an
  Employee record, only `POST /employees` (HR/Payroll-only) does.
- Two pre-existing bugs fixed in passing, unrelated to any single feature:
  - `lib/errors.ts` was missing a `BadRequestError` export entirely — five service files
    imported it and would have thrown `TypeError: BadRequestError is not a constructor` the
    first time any of those code paths actually ran (contract-overlap guard, leave-balance
    checks, attendance validation, the new working-schedule/payroll validation). Added the
    class.
  - `authService.register` assigned `role: Role.USER`, a value that doesn't exist in the
    `Role` enum (`EMPLOYEE | HR_MANAGER | HR_PAYROLL_MANAGER`). It silently worked by accident
    because Prisma treats an `undefined` field as "use the schema default" — now explicit
    `Role.EMPLOYEE`.

---

## 4. Schema changes (additive only — applied via `prisma db push`, not `migrate`)

The dev DB has no tracked migration history (it was originally built with `db push`), so every
change in this pass was deliberately **additive**: new tables, new nullable columns, new
optional relations. Nothing was dropped or made `NOT NULL` on an existing table — `db push` is
safe for that; `migrate dev` would have demanded a full reset and was avoided for exactly that
reason.

- **`WorkingSchedule`** (new) — `name` (unique), `calendarType`, `company`, `timezone`,
  `daysPerWeek`, `hoursPerWeek` (both derived, see §3), `status` (`ACTIVE`/`INACTIVE`).
- **`WorkingScheduleDay`** (new) — `day`, `startTime`, `endTime`, `breakMinutes`, `hours`
  (derived), unique on `(workingScheduleId, day)`.
- **`Employee.scheduleId`** (new, nullable FK → WorkingSchedule). The pre-existing
  `Employee.workingSchedule` (free-text string, default `"Standard 40h/week"`) is **untouched**
  — it's still the fallback display value when `scheduleId` is null. Don't remove it.
- **`Contract.workingScheduleId`** (new, nullable FK → WorkingSchedule).
- **`TimeOffRequest.decidedById`** (new, nullable FK → User), **`decidedAt`** (new, nullable
  DateTime). `User` gained the reverse relation `decidedTimeOffRequests TimeOffRequest[]`.

Seed data (`backend/prisma/seed.ts`) provisions 5 demo `WorkingSchedule` rows (40 Hours/Week,
Night Shift, Retail Weekend, Flexible Hybrid, Part-time 20h — the last `INACTIVE`) and links
both seeded employees + all 3 seeded contracts to the standard one. The seed script's `upsert`
`update:` clauses were extended to include the new FKs — if you add a field to an existing
seeded row in the future, always add it to `update:` too, not just `create:`, or re-running the
seed against an already-seeded DB won't backfill it (this bit us once: the first seed run left
two pre-existing contracts with `workingScheduleId: null` until the `update:` clause was fixed).

---

## 5. Known gaps — deliberately not built, and why

These are the places where the honest-signal pattern (§1) is still showing, on purpose:

- **Allocation Approve/Refuse** (`/dashboard/time-off/allocations/[id]`) — still shows a
  "not wired yet" notice on click. Unlike Requests, `TimeOffAllocation` has **no status field
  at all** in the schema; every allocation is an immediately-active balance the moment it
  exists. Wiring a fake Approve button would mean inventing an entire workflow (what does
  "pending" mean for a balance? who requests one?) rather than connecting an existing concept
  — that's a product decision, not a mechanical integration task, so it was left visible
  instead of faked.
- **Currency**: the cross-module Payroll dashboard uses ₹ (matching its specific mockup,
  Lakh/thousand compact formatting via `formatINR` in that page). Every other payroll screen
  still uses `$`, inherited from the original scaffold. Nobody has asked for these to be
  unified — do not silently "fix" this without checking, it may be intentional multi-currency
  groundwork.
- **Salary Rule "Python Code" computation**: the Rule form shows a read-only reference panel
  for Fixed Amount / Percentage of Wage / Python Code. Only the first two are real
  (`SalaryRule.percentage` / `.fixedAmount` drive `computeSalaryBreakdown`). `conditionRule`
  exists as a schema field but is never evaluated — the panel just displays its stored string
  or a placeholder example. The spec explicitly says the calculation engine design is open
  ("participants are free to design... as long as salary rules actually drive payslip
  calculations"), so this was treated as optional, not a gap to close.
- **"Employee Type" and "Company" filters** on the Payroll dashboard are real but thin:
  Employee Type reads `WorkingSchedule.calendarType` (closest real analogue — there's no actual
  employment-type field anywhere), and Company reads the first `WorkingSchedule.company` value
  found (single-tenant app, so it's a disabled single-option select, not a fake dropdown).
- **Duplicate payslip warning** and **"manual attendance edits" counter**, both present in an
  early dashboard mockup, were deliberately omitted rather than faked: a duplicate payslip is
  structurally impossible (`@@unique([payrunId, employeeId])`), and there's no audit trail
  field for attendance edits to count. "Missing check-outs" and "attendance coverage %" are
  shown instead — both are real, computable metrics.

---

## 6. Environment note

**Resolved**, but worth understanding in case it recurs: the backend process the frontend dev
server talks to on port 3001 was, for most of this integration pass, running from a **different
checkout** — `...\Desktop\PeoplePay360` — connected to a remote NeonDB, not this repo's local
Docker Postgres. Symptom: login fails with a real (not client-side) 401 "Invalid email or
password" for accounts that definitely exist in this repo's seeded DB, because the request
never reached this repo's database at all. If `curl localhost:3001` ever behaves unexpectedly
again, check `Get-CimInstance Win32_Process -Filter "ProcessId = <pid>"` (find the pid via
`netstat -ano | findstr :3001`) for its actual working directory before assuming this repo's
code is broken. All verification during the integration pass was done via a throwaway instance
on port 4001 for exactly this reason (§1) — that workaround is no longer necessary now that the
real bug is fixed (below), but the pattern is still documented in §1 since it's a reasonable way
to test without disturbing a colleague's running dev server.

**Root cause, now fixed:** the backend had *no `.env` loading mechanism at all*. Nothing in
`backend/src` ever called `dotenv.config()` or similar, so `env.ts`'s `validateEnv()` — which
runs at import time, before Prisma ever gets a chance to touch `.env` — always failed unless
every required var (`DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, ...) was already present
in the shell's own environment. Confirmed by actually running plain `npm run dev` from
`backend/` with a clean shell: it crashed immediately with `Environment validation failed:
DATABASE_URL: Required, ...`. This is *why* every verification pass in this log (§1) passed env
vars inline on the command line — that was never optional convenience, it was working around
this bug without realizing it was a bug. Whoever was running the Desktop checkout's backend had
presumably exported `DATABASE_URL` pointing at NeonDB in that shell session at some point, so
*that* backend started fine — while anyone starting this repo's backend the "normal" way
(`npm run dev`) with a fresh shell would always fail to start at all, never mind connect to the
wrong DB.

Fixed by adding `dotenv` as a direct dependency of `backend/package.json` and `import
'dotenv/config';` as the literal first line of `backend/src/index.ts` (before the `./config/env`
import, so `.env` is loaded before `validateEnv()` reads `process.env`). `npm run dev` from
`backend/` (or `npm run dev -w backend` from the repo root) now works from a completely clean
shell, no manual env vars required. If you ever see "Environment validation failed" again, this
import is the first thing to check — someone may have reordered the imports in `index.ts`.

Local Docker Postgres: `hackathon-postgres` container, port **5433** (not the Postgres default
5432), credentials in `backend/.env` (already correctly pointed at it). Seed accounts:
`payroll@peoplepay360.com` / `hr@peoplepay360.com` / `john.doe@peoplepay360.com` /
`jane.smith@peoplepay360.com`, all password `Password123!`. Only the two employee accounts have
a linked Employee record — the two HR/Payroll accounts are User-only, which is why the
Attendance Widget renders nothing for them (no `employeeId` to check in/out as) and why
`decidedBy.employee` is `null` when they approve/reject a request.
