# PeoplePay360 — Root Architecture & System Specification

> **Status:** Scope Locked (24h Hackathon Window)  
> **Target Problem:** Enterprise HR & Rule-Driven Payroll Platform  
> **Audience:** Human Developers, Frontend Collaborators, Backend Developers, and AI Agents

---

## 1. Monorepo Repository Structure

Extends the existing boilerplate conventions across backend and frontend without restructuring working foundations:

```
PeoplePay360/
├── backend/                                # Express + TypeScript + Prisma + PostgreSQL
│   ├── prisma/
│   │   ├── schema.prisma                  # Complete P0 DB Schema & Enums
│   │   └── seed.ts                        # Seed data (Users, Salary Rules, Allocations, Employees, Contracts)
│   ├── src/
│   │   ├── config/                        # Environment & app config (Zod validated)
│   │   ├── lib/                           # Shared singletons (prisma.ts, logger.ts, errors.ts, tokens.ts)
│   │   ├── middleware/                    # auth, rbac, errorHandler, rateLimiter, validate, requestId
│   │   ├── modules/                       # Domain Modules (Feature Folders)
│   │   │   ├── auth/                      # Authentication & session refresh (/api/auth)
│   │   │   ├── employee/                  # Employee Master & Directory (/api/employees)
│   │   │   │   ├── employee.schema.ts
│   │   │   │   ├── employee.service.ts
│   │   │   │   ├── employee.controller.ts
│   │   │   │   └── employee.routes.ts
│   │   │   ├── contract/                  # Contracts & Active Overlap Guard (/api/contracts)
│   │   │   │   ├── contract.schema.ts
│   │   │   │   ├── contract.service.ts
│   │   │   │   ├── contract.controller.ts
│   │   │   │   └── contract.routes.ts
│   │   │   ├── attendance/                # Punch In/Out & Worked Hours (/api/attendances)
│   │   │   │   ├── attendance.schema.ts
│   │   │   │   ├── attendance.service.ts
│   │   │   │   ├── attendance.controller.ts
│   │   │   │   └── attendance.routes.ts
│   │   │   ├── timeoff/                   # Time Off Types, Allocations & Requests (/api/time-off)
│   │   │   │   ├── timeoff.schema.ts
│   │   │   │   ├── timeoff.service.ts
│   │   │   │   ├── timeoff.controller.ts
│   │   │   │   └── timeoff.routes.ts
│   │   │   └── payroll/                   # Salary Rules Engine, Payruns & Payslips (/api/payroll)
│   │   │       ├── payroll.schema.ts
│   │   │       ├── payroll.service.ts     # Sequential Rule Pipeline & Warning Engine
│   │   │       ├── payroll.controller.ts
│   │   │       └── payroll.routes.ts
│   │   ├── types/                         # Express and global TypeScript augmentation
│   │   └── index.ts                       # App Entrypoint & Route mounting
│   ├── tsconfig.json
│   └── package.json
│
├── frontend/                               # Next.js 14/15 App Router + Tailwind CSS + shadcn/ui
│   ├── src/
│   │   ├── app/                           # App Router routes & layouts
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── register/page.tsx
│   │   │   ├── (dashboard)/               # Protected Main Workspace
│   │   │   │   ├── layout.tsx             # Sidebar, Topbar, User Profile, Role Guards
│   │   │   │   ├── employees/             # Employee Master (Kanban / List / Detail / Form)
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   ├── contracts/             # Contract List & Management
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── attendance/            # Attendance Check-in/out & Logs
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── time-off/              # Time Off Balances & Request/Approval Workflow
│   │   │   │   │   └── page.tsx
│   │   │   │   └── payroll/               # Payrun 2-Step Wizard & Processing Screen
│   │   │   │       ├── page.tsx           # Payruns list
│   │   │   │       ├── new/page.tsx       # 2-Step Payrun Wizard
│   │   │   │       ├── [id]/page.tsx      # Payrun compute/validate/pay workspace
│   │   │   │       └── payslips/[id]/page.tsx # Payslip breakdown itemized view
│   │   │   ├── globals.css
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── shared/                    # ProtectedRoute, StatCard, StatusBadge, DataTable
│   │   │   ├── employees/                 # EmployeeKanbanCard, EmployeeFormDialog
│   │   │   ├── attendance/                # PunchClockCard, AttendanceTable
│   │   │   ├── time-off/                  # BalanceWidget, LeaveRequestModal, ApprovalRow
│   │   │   ├── payroll/                   # PayrunWizardStep1, PayrunWizardStep2, RuleBreakdownTable
│   │   │   └── ui/                        # Reusable shadcn primitives
│   │   └── lib/
│   │       ├── api.ts                     # Axios client with interceptors for all modules
│   │       └── auth.tsx                   # AuthContext with role helpers
│   └── package.json
│
├── docs/                                  # Monorepo Documentation
│   ├── root-architecture.md               # (This file) Complete blueprint for all agents & teammates
│   ├── architecture.md                    # Domain context & P0 invariants
│   ├── backend.md                         # Detailed backend API specs & calculation logic
│   └── boilerplate.md                     # Boilerplate developer guide
├── docker-compose.yml                     # Local PostgreSQL + Multi-service runner
└── package.json                           # Workspaces root
```

---

## 2. Complete Database Schema (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// -------------------------------------------------------------
// ENUMS
// -------------------------------------------------------------
enum Role {
  EMPLOYEE
  HR_MANAGER
  HR_PAYROLL_MANAGER
}

enum ContractStatus {
  DRAFT
  ACTIVE
  CLOSED
}

enum AttendanceStatus {
  PRESENT
  ABSENT
  HALF_DAY
}

enum TimeOffStatus {
  PENDING
  APPROVED
  REJECTED
}

enum PayrunStatus {
  DRAFT
  COMPUTED
  VALIDATED
  PAID
}

enum PayslipStatus {
  DRAFT
  COMPUTED
  CONFIRMED
  PAID
}

// -------------------------------------------------------------
// USER & EMPLOYEE MASTER
// -------------------------------------------------------------
model User {
  id           String    @id @default(cuid())
  email        String    @unique
  password     String
  role         Role      @default(EMPLOYEE)
  refreshToken String?
  employee     Employee?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@map("users")
}

model Employee {
  id              String               @id @default(cuid())
  userId          String?              @unique
  user            User?                @relation(fields: [userId], references: [id], onDelete: SetNull)
  employeeCode    String               @unique
  firstName       String
  lastName        String
  email           String               @unique
  phone           String?
  department      String
  jobPosition     String
  managerId       String?
  manager         Employee?            @relation("ManagerSubordinates", fields: [managerId], references: [id], onDelete: SetNull)
  subordinates    Employee[]           @relation("ManagerSubordinates")
  workingSchedule String               @default("Standard 40h/week")
  status          String               @default("ACTIVE") // ACTIVE, INACTIVE, ON_LEAVE
  bankName        String?
  bankAccountNo   String?
  bankRoutingNo   String?
  contracts       Contract[]
  attendances     Attendance[]
  timeOffBalances TimeOffAllocation[]
  timeOffRequests TimeOffRequest[]
  payslips        Payslip[]
  createdAt       DateTime             @default(now())
  updatedAt       DateTime             @updatedAt

  @@map("employees")
}

// -------------------------------------------------------------
// CONTRACTS & SALARY STRUCTURE
// -------------------------------------------------------------
model Contract {
  id                String          @id @default(cuid())
  employeeId        String
  employee          Employee        @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  contractName      String
  startDate         DateTime
  endDate           DateTime?
  wage              Float           // Monthly base wage
  department        String
  jobPosition       String
  salaryStructureId String
  salaryStructure   SalaryStructure @relation(fields: [salaryStructureId], references: [id])
  status            ContractStatus  @default(ACTIVE)
  payslips          Payslip[]
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  @@map("contracts")
}

model SalaryStructure {
  id          String       @id @default(cuid())
  name        String       @unique // e.g., "Regular Salary Structure"
  code        String       @unique // REGULAR
  description String?
  rules       SalaryRule[]
  contracts   Contract[]
  payruns     Payrun[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@map("salary_structures")
}

model SalaryRule {
  id                String          @id @default(cuid())
  salaryStructureId String
  salaryStructure   SalaryStructure @relation(fields: [salaryStructureId], references: [id], onDelete: Cascade)
  name              String          // Basic, HRA, Transport, PF, Tax, Gross, Net
  code              String          // BASIC, HRA, TRA, PF, TAX, GROSS, NET
  category          String          // BASIC, ALLOWANCE, DEDUCTION, GROSS, NET
  sequence          Int             // 1..7 (Ordered pipeline execution)
  percentage        Float?          // 0.20 = 20%
  fixedAmount       Float?          // 200 = $200
  conditionRule     String?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  @@map("salary_rules")
}

// -------------------------------------------------------------
// ATTENDANCE
// -------------------------------------------------------------
model Attendance {
  id          String           @id @default(cuid())
  employeeId  String
  employee    Employee         @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  date        DateTime         @db.Date
  checkIn     DateTime
  checkOut    DateTime?
  workedHours Float            @default(0)
  status      AttendanceStatus @default(PRESENT)
  notes       String?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  @@unique([employeeId, date])
  @@map("attendances")
}

// -------------------------------------------------------------
// TIME OFF & LEAVE MANAGEMENT
// -------------------------------------------------------------
model TimeOffType {
  id          String              @id @default(cuid())
  name        String              @unique // Annual Leave, Sick Leave, Unpaid Leave
  code        String              @unique // AL, SL, UL
  isPaid      Boolean             @default(true)
  allocations TimeOffAllocation[]
  requests    TimeOffRequest[]
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt

  @@map("time_off_types")
}

model TimeOffAllocation {
  id            String      @id @default(cuid())
  employeeId    String
  employee      Employee    @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  timeOffTypeId String
  timeOffType   TimeOffType @relation(fields: [timeOffTypeId], references: [id])
  year          Int
  allocatedDays Float
  usedDays      Float       @default(0)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@unique([employeeId, timeOffTypeId, year])
  @@map("time_off_allocations")
}

model TimeOffRequest {
  id            String        @id @default(cuid())
  employeeId    String
  employee      Employee      @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  timeOffTypeId String
  timeOffType   TimeOffType   @relation(fields: [timeOffTypeId], references: [id])
  startDate     DateTime      @db.Date
  endDate       DateTime      @db.Date
  totalDays     Float
  status        TimeOffStatus @default(PENDING)
  reason        String?
  rejectionNote String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@map("time_off_requests")
}

// -------------------------------------------------------------
// PAYROLL & PAYSLIPS
// -------------------------------------------------------------
model Payrun {
  id                String          @id @default(cuid())
  name              String          // "Payroll - September 2026"
  periodStartDate   DateTime        @db.Date
  periodEndDate     DateTime        @db.Date
  salaryStructureId String
  salaryStructure   SalaryStructure @relation(fields: [salaryStructureId], references: [id])
  status            PayrunStatus    @default(DRAFT)
  totalGross        Float           @default(0)
  totalDeductions   Float           @default(0)
  totalNet          Float           @default(0)
  warnings          Json?           // Array of warning strings / objects
  payslips          Payslip[]
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  @@map("payruns")
}

model Payslip {
  id          String        @id @default(cuid())
  payrunId    String
  payrun      Payrun        @relation(fields: [payrunId], references: [id], onDelete: Cascade)
  employeeId  String
  employee    Employee      @relation(fields: [employeeId], references: [id])
  contractId  String
  contract    Contract      @relation(fields: [contractId], references: [id])
  status      PayslipStatus @default(DRAFT)
  workedDays  Float         @default(30)
  basicWage   Float
  grossPay    Float
  deductions  Float
  netPay      Float
  lineItems   Json          // Computed breakdown array: [{ ruleCode, name, category, amount }]
  warnings    Json?         // Validation warnings (e.g., missing bank info)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@unique([payrunId, employeeId])
  @@map("payslips")
}
```

> **Database vs. Application Level Enforcement Note:**
> - Non-overlapping active contracts: Because SQL date ranges with nullable end dates (indefinite contracts) cannot be cleanly enforced via standard unique constraints without complex raw PostgreSQL `EXCLUDE USING gist` operators (which require the `btree_gist` extension), we enforce this **strictly at the application service layer** inside transactional validation before write.

---

## 3. P0 REST API Contract List

All endpoints adhere to the envelope: `{ "success": boolean, "data": T, "error"?: string }`.

### A. Authentication (`/api/auth`)
- `POST /api/auth/register` — Register user account
- `POST /api/auth/login` — Log in & obtain session tokens
- `POST /api/auth/refresh` — Refresh access token via httpOnly cookie
- `POST /api/auth/logout` — Revoke refresh token
- `GET /api/auth/me` — Current authenticated user and linked employee profile

### B. Employee Master (`/api/employees`)
- `GET /api/employees` — List employees (supports `department`, `status`, `search` query filters)
- `GET /api/employees/:id` — Single employee with active contract, manager, subordinates & leave balances
- `POST /api/employees` — Create new employee *(HR_MANAGER, HR_PAYROLL_MANAGER)*
- `PUT /api/employees/:id` — Update employee details *(HR_MANAGER, HR_PAYROLL_MANAGER)*

### C. Contracts (`/api/contracts`)
- `GET /api/contracts?employeeId=:id` — List all contracts for an employee
- `GET /api/contracts/:id` — Single contract details with salary structure rules
- `POST /api/contracts` — Create contract with non-overlapping active date validation *(HR_MANAGER, HR_PAYROLL_MANAGER)*
- `PUT /api/contracts/:id` — Update contract with non-overlapping re-validation *(HR_MANAGER, HR_PAYROLL_MANAGER)*

### D. Attendance (`/api/attendances`)
- `POST /api/attendances/check-in` — Check in employee for date
- `POST /api/attendances/check-out` — Check out employee and compute worked hours
- `GET /api/attendances` — List attendance records (filterable by `employeeId`, `startDate`, `endDate`)
- `GET /api/attendances/today/:employeeId` — Get today's punch state

### E. Time Off & Leave Management (`/api/time-off`)
- `GET /api/time-off/types` — List time off types (AL, SL, UL)
- `GET /api/time-off/allocations?employeeId=:id&year=:year` — Employee's leave balance & used days
- `GET /api/time-off/requests` — List leave requests (filterable by `employeeId`, `status`)
- `POST /api/time-off/requests` — Submit request (validates sufficient balance)
- `PATCH /api/time-off/requests/:id/approve` — Approve request & atomically decrement balance *(HR_MANAGER, HR_PAYROLL_MANAGER)*
- `PATCH /api/time-off/requests/:id/reject` — Reject request with optional rejection note *(HR_MANAGER, HR_PAYROLL_MANAGER)*

### F. Payroll Engine (`/api/payroll`)
- `GET /api/payroll/structures` — List seeded salary structures and rule sequences
- `GET /api/payroll/payruns` — List payrun batches with aggregate totals
- `GET /api/payroll/payruns/:id` — Single payrun with all generated employee payslips
- `POST /api/payroll/payruns` — Step 1: Create Payrun scope (Period + Structure) *(HR_PAYROLL_MANAGER)*
- `POST /api/payroll/payruns/:id/generate` — Step 2: Select employees & generate computed draft payslips *(HR_PAYROLL_MANAGER)*
- `POST /api/payroll/payruns/:id/compute` — Recompute all payslip line items in sequence *(HR_PAYROLL_MANAGER)*
- `POST /api/payroll/payruns/:id/validate` — Validate warnings (missing bank info) & freeze *(HR_PAYROLL_MANAGER)*
- `POST /api/payroll/payruns/:id/pay` — Mark Payrun and all payslips as PAID *(HR_PAYROLL_MANAGER)*
- `GET /api/payroll/payslips/:id` — Itemized rule breakdown view of a single payslip

---

## 4. Module Boundaries & Build Order

Your intuition is **100% confirmed**. The dependency graph dictates this exact sequence:

$$\text{Employee} \longrightarrow \text{Contract} \longrightarrow \text{Attendance} \longrightarrow \text{Time Off} \longrightarrow \text{Salary Rules} \longrightarrow \text{Payrun / Payslip Engine}$$

### Why this order is mandatory:
1. **Employee** has zero external domain dependencies (only User).
2. **Contract** depends on Employee & SalaryStructure, and establishes the active base wage.
3. **Attendance** and **Time Off** depend on Employee and contract period calendars.
4. **Salary Rules Engine** runs sequentially on contract wage in isolation (pure function).
5. **Payrun & Payslip** pulls the period-applicable Contract, calculates the Salary Rules, checks Bank Details, and aggregates the batch.

---

## 5. Early Cross-Module & Frontend Dependency Flags

1. **Active Contract Date Resolution**:
   - When generating payslips for a period (e.g. Sept 1 – Sept 30), the engine selects the contract where `startDate <= Sept 30` AND (`endDate >= Sept 1` OR `endDate == null`).
   - If an employee has no active contract for the period, they are excluded from the payrun draft to avoid corrupting totals.

2. **Atomic Leave Allocation Deduction**:
   - When an HR manager approves a leave request, the `TimeOffAllocation.usedDays` must increment in the same DB transaction. 
   - The frontend Time Off widget reads `allocatedDays - usedDays` for remaining balance.

3. **Missing Bank Details Warning**:
   - The frontend Payrun validation screen expects a `warnings` array on both the Payrun and individual Payslips. The frontend teammate can easily render a badge: `Missing Bank Info` if `warnings.length > 0`.
