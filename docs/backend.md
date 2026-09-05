# PeoplePay360 — Backend Implementation & Architecture Guide

> **Status:** All Backend Modules Implemented, Seeded, and 100% Tested against PostgreSQL.  
> **Database:** PostgreSQL via Docker (`hackathon-postgres`) / NeonDB.  
> **ORM:** Prisma v6.19.3.  
> **Test Coverage:** Vitest unit, contract overlap, atomic balance, and auth integration tests passing.

---

## 1. Overview of Implemented Modules

The backend is organized cleanly under `backend/src/modules/` with 5 dedicated domain feature sets:

```
backend/src/modules/
├── auth/          # Authentication, token generation, refresh cookies, RBAC
├── employee/      # Employee Master directory, Manager relations, default leave provisioning
├── contract/      # Active contracts, wage assignment, non-overlapping date validation guard
├── attendance/    # Check-in, check-out, auto-computed worked hours, today's punch state
├── timeoff/       # Leave types (AL/SL/UL), balance allocation, atomic deduction transactions
└── payroll/       # Sequential Salary Rule Engine, 2-Step Payrun wizard, Payslips & warnings
```

---

## 2. Complete Database Schema (`backend/prisma/schema.prisma`)

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
  sequence          Int             // 1..7 (Sequential Pipeline)
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
  name              String          // e.g., "Payroll - September 2026"
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

---

## 3. Core Business Invariants & Algorithms

### A. Non-Overlapping Active Contract Guard
Located in `backend/src/modules/contract/contract.service.ts`:
- Enforces that no two `ACTIVE` contracts for the same employee share overlapping date intervals:
  $$\text{startDate}_A \le \text{endDate}_B \quad\text{AND}\quad \text{startDate}_B \le \text{endDate}_A$$
- Indefinite contracts (`endDate == null`) are treated with a horizon of `9999-12-31`.

### B. Atomic Leave Balance Consumption
Located in `backend/src/modules/timeoff/timeoff.service.ts`:
- Approval runs in an atomic `$transaction`:
  1. Validates `allocation.allocatedDays - allocation.usedDays >= request.totalDays`.
  2. Increments `usedDays` by `totalDays`.
  3. Updates request status to `APPROVED`.
- Guarantees no race condition or negative leave balance.

### C. Sequential Salary Rule Engine
Located in `backend/src/modules/payroll/payroll.service.ts`:
- Pure execution pipeline ordered by `sequence ASC`:
  1. `BASIC`: Base contract wage.
  2. `ALLOWANCE`: Percentage of Basic (HRA = 20%) or Fixed (Transport = $200).
  3. `GROSS`: Sum of Basic and Allowances.
  4. `DEDUCTION`: Percentage of Gross/Basic (PF = 12% of Basic, Tax = 10% of Gross).
  5. `NET`: Gross minus total Deductions.
- Produces immutable itemized `lineItems` JSON stored on each `Payslip`.

### D. Payrun Warnings Engine
- Flags missing bank account details (`bankAccountNo == null`).
- Skips employees lacking an active contract for the target date period.

---

## 4. API Endpoints Reference

All endpoints return the standard envelope: `{ "success": boolean, "data": T, "error"?: string }`.

| Module | Method | Endpoint | Description | Auth & Roles |
|---|---|---|---|---|
| **Auth** | `POST` | `/api/auth/register` | Register user account | Public |
| **Auth** | `POST` | `/api/auth/login` | Login and receive access/refresh tokens | Public |
| **Auth** | `POST` | `/api/auth/refresh` | Silent refresh access token | Public (Cookie) |
| **Auth** | `GET` | `/api/auth/me` | Get logged-in user profile & role | Authenticated |
| **Auth** | `POST` | `/api/auth/logout` | Clear refresh token | Authenticated |
| **Employees** | `GET` | `/api/employees` | List/search employees with active contract & balances | Authenticated |
| **Employees** | `GET` | `/api/employees/:id` | Get single employee details with relations | Authenticated |
| **Employees** | `POST` | `/api/employees` | Create employee & auto-provision leave balances | `HR_MANAGER`, `HR_PAYROLL_MANAGER` |
| **Employees** | `PUT` | `/api/employees/:id` | Update employee details | `HR_MANAGER`, `HR_PAYROLL_MANAGER` |
| **Contracts** | `GET` | `/api/contracts?employeeId=:id` | List contracts for an employee | Authenticated |
| **Contracts** | `GET` | `/api/contracts/:id` | Single contract with salary structure rules | Authenticated |
| **Contracts** | `POST` | `/api/contracts` | Create contract (with overlap guard) | `HR_MANAGER`, `HR_PAYROLL_MANAGER` |
| **Contracts** | `PUT` | `/api/contracts/:id` | Update contract (re-validates overlap) | `HR_MANAGER`, `HR_PAYROLL_MANAGER` |
| **Attendance** | `POST` | `/api/attendances/check-in` | Punch-in for today | Authenticated |
| **Attendance** | `POST` | `/api/attendances/check-out` | Punch-out (auto-calculates worked hours & status) | Authenticated |
| **Attendance** | `GET` | `/api/attendances` | List attendance records (filterable by employee/dates) | Authenticated |
| **Attendance** | `GET` | `/api/attendances/today/:employeeId` | Today's active check-in/out status | Authenticated |
| **Time Off** | `GET` | `/api/time-off/types` | List leave types (AL, SL, UL) | Authenticated |
| **Time Off** | `GET` | `/api/time-off/allocations` | Get leave balances & used days | Authenticated |
| **Time Off** | `GET` | `/api/time-off/requests` | List leave requests | Authenticated |
| **Time Off** | `POST` | `/api/time-off/requests` | Submit leave request (validates balance) | Authenticated |
| **Time Off** | `PATCH`| `/api/time-off/requests/:id/approve` | Approve request & atomically decrement balance | `HR_MANAGER`, `HR_PAYROLL_MANAGER` |
| **Time Off** | `PATCH`| `/api/time-off/requests/:id/reject` | Reject leave request | `HR_MANAGER`, `HR_PAYROLL_MANAGER` |
| **Payroll** | `GET` | `/api/payroll/structures` | List salary structures and rules | Authenticated |
| **Payroll** | `GET` | `/api/payroll/payruns` | List payrun batches with summaries | Authenticated |
| **Payroll** | `GET` | `/api/payroll/payruns/:id` | Get single payrun and all payslips | Authenticated |
| **Payroll** | `POST` | `/api/payroll/payruns` | Step 1: Initialize Payrun scope (Period + Structure) | `HR_PAYROLL_MANAGER` |
| **Payroll** | `POST` | `/api/payroll/payruns/:id/generate`| Step 2: Generate draft payslips for employees | `HR_PAYROLL_MANAGER` |
| **Payroll** | `POST` | `/api/payroll/payruns/:id/compute` | Recompute all payslip line items in sequence | `HR_PAYROLL_MANAGER` |
| **Payroll** | `POST` | `/api/payroll/payruns/:id/validate`| Validate bank details & freeze batch | `HR_PAYROLL_MANAGER` |
| **Payroll** | `POST` | `/api/payroll/payruns/:id/pay` | Mark payrun & payslips as PAID | `HR_PAYROLL_MANAGER` |
| **Payroll** | `GET` | `/api/payroll/payslips/:id` | Itemized rule breakdown view of a payslip | Authenticated |

---

## 5. Seed Accounts & Verification

The database seed (`backend/prisma/seed.ts`) provides default credentials:

| Role | Email | Password |
|---|---|---|
| **HR Payroll Manager** | `payroll@peoplepay360.com` | `Password123!` |
| **HR Manager** | `hr@peoplepay360.com` | `Password123!` |
| **Employee 1** | `john.doe@peoplepay360.com` | `Password123!` |
| **Employee 2** | `jane.smith@peoplepay360.com` | `Password123!` |

### Automated Test Commands
```powershell
# Run backend test suite
npm run test -w backend

# Start backend dev server
npm run dev:backend
```
