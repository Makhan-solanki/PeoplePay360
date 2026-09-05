# PeoplePay360 Backend Developer Guide & API Specification

This document defines the backend implementation patterns, database schema specifications, core calculation algorithms, and REST API contracts for PeoplePay360.

---

## 1. Database Schema (`prisma/schema.prisma`) Plan

```prisma
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
  manager         Employee?            @relation("ManagerSubordinates", fields: [managerId], references: [id])
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

model TimeOffType {
  id          String               @id @default(cuid())
  name        String               @unique // e.g., Annual Leave, Sick Leave, Unpaid Leave
  code        String               @unique // AL, SL, UL
  isPaid      Boolean              @default(true)
  allocations TimeOffAllocation[]
  requests    TimeOffRequest[]
  createdAt   DateTime             @default(now())
  updatedAt   DateTime             @updatedAt

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

model SalaryStructure {
  id          String       @id @default(cuid())
  name        String       @unique // e.g., "Regular Salary"
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
  name              String          // Basic, HRA, Transport Allowance, PF Deduction, Tax, Gross, Net
  code              String          // BASIC, HRA, TRA, PF, TAX, GROSS, NET
  category          String          // BASIC, ALLOWANCE, DEDUCTION, GROSS, NET
  sequence          Int             // 1, 2, 3, 4... execution order
  percentage        Float?          // e.g., 0.10 for 10%
  fixedAmount       Float?          // e.g., 2000
  conditionRule     String?         // optional condition expression/flag
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  @@map("salary_rules")
}

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
  warnings          Json?           // Array of validation warning objects
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
  lineItems   Json          // Detailed computed breakdown: [{ ruleCode, name, category, amount }]
  warnings    Json?         // Warnings like missing bank account
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@unique([payrunId, employeeId])
  @@map("payslips")
}
```

---

## 2. Core Business Logic Implementation Details

### A. Active Contract Selection & Overlap Guard

1. **Non-overlapping Contract Invariant:**
   - When creating or updating a contract with status `ACTIVE`:
     ```typescript
     const overlapping = await prisma.contract.findFirst({
       where: {
         employeeId,
         status: 'ACTIVE',
         id: { not: currentContractId }, // if updating
         OR: [
           { endDate: null, startDate: { lte: newEndDate ?? new Date('9999-12-31') } },
           {
             startDate: { lte: newEndDate ?? new Date('9999-12-31') },
             endDate: { gte: newStartDate }
           }
         ]
       }
     });
     if (overlapping) throw new BadRequestError("An active contract already overlaps with this date range.");
     ```

2. **Payroll Contract Resolution for a Period `[periodStart, periodEnd]`:**
   - Must locate contract where:
     - `employeeId == emp.id`
     - `status == ACTIVE`
     - `startDate <= periodEnd` AND (`endDate >= periodStart` OR `endDate == null`)
   - If no valid contract exists, mark employee payslip generation with warning: `NO_VALID_CONTRACT_IN_PERIOD`.

---

### B. Leave Balance Consumption (Atomic Lock)

- When an HR Manager approves a `TimeOffRequest`:
  ```typescript
  await prisma.$transaction(async (tx) => {
    const request = await tx.timeOffRequest.findUniqueOrThrow({ where: { id: requestId } });
    if (request.status !== 'PENDING') throw new BadRequestError('Request is not pending');

    const year = request.startDate.getFullYear();
    const allocation = await tx.timeOffAllocation.findUnique({
      where: {
        employeeId_timeOffTypeId_year: {
          employeeId: request.employeeId,
          timeOffTypeId: request.timeOffTypeId,
          year
        }
      }
    });

    if (!allocation || (allocation.allocatedDays - allocation.usedDays) < request.totalDays) {
      throw new BadRequestError('Insufficient leave balance for this request');
    }

    await tx.timeOffAllocation.update({
      where: { id: allocation.id },
      data: { usedDays: { increment: request.totalDays } }
    });

    return tx.timeOffRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED' }
    });
  });
  ```

---

### C. Salary Rule Engine (Sequential Execution Pipeline)

Rules are sorted by `sequence ASC`:

1. **BASIC** = `contract.wage`
2. **ALLOWANCE** (e.g., HRA = 20% of Basic, Transport = $200)
3. **GROSS** = `BASIC + SUM(ALLOWANCES)`
4. **DEDUCTION** (e.g., PF = 12% of Basic, Tax = 10% of Gross, Unpaid leave deductions if applicable)
5. **NET** = `GROSS - SUM(DEDUCTIONS)`

The calculation pipeline produces an immutable snapshot JSON:
```json
[
  { "ruleCode": "BASIC", "name": "Basic Salary", "category": "BASIC", "amount": 5000 },
  { "ruleCode": "HRA", "name": "House Rent Allowance", "category": "ALLOWANCE", "amount": 1000 },
  { "ruleCode": "TRA", "name": "Transport Allowance", "category": "ALLOWANCE", "amount": 200 },
  { "ruleCode": "GROSS", "name": "Gross Salary", "category": "GROSS", "amount": 6200 },
  { "ruleCode": "PF", "name": "Provident Fund", "category": "DEDUCTION", "amount": 600 },
  { "ruleCode": "TAX", "name": "Income Tax", "category": "DEDUCTION", "amount": 620 },
  { "ruleCode": "NET", "name": "Net Salary", "category": "NET", "amount": 4980 }
]
```

---

### D. Payrun Validation & Warning Engine

Before changing status to `VALIDATED` or `PAID`, compute warning flags:
1. **Missing Bank Info**: `employee.bankAccountNo == null || employee.bankName == null` -> `MISSING_BANK_DETAILS`
2. **Duplicate Payslip in Same Period**: Flag if employee already has a paid payslip in overlapping range.
3. **Negative Net Salary**: `netPay <= 0` -> `NEGATIVE_NET_SALARY`.

---

## 3. REST API Endpoint Specifications

All endpoints use standard JSON envelope `{ success: true, data: ... }`.

### A. Employee Management (`/api/v1/employees`)
- `GET /api/v1/employees` — List employees (supports filter by department, search by name, status)
- `GET /api/v1/employees/:id` — Get single employee with active contract & leave balances
- `POST /api/v1/employees` — Create employee (HR_MANAGER / HR_PAYROLL_MANAGER)
- `PUT /api/v1/employees/:id` — Update employee details

### B. Contracts (`/api/v1/contracts`)
- `GET /api/v1/contracts?employeeId=:id` — List contracts for employee
- `POST /api/v1/contracts` — Create contract (validates non-overlapping active dates)
- `PUT /api/v1/contracts/:id` — Update contract

### C. Attendance (`/api/v1/attendances`)
- `POST /api/v1/attendances/check-in` — Employee check-in (sets `checkIn = now()`)
- `POST /api/v1/attendances/check-out` — Employee check-out (calculates `workedHours`)
- `GET /api/v1/attendances` — List attendance records (filterable by employee, date range)
- `GET /api/v1/attendances/today` — Current employee's status for today

### D. Time Off (`/api/v1/time-off`)
- `GET /api/v1/time-off/types` — List time off types
- `GET /api/v1/time-off/allocations` — Get allocations for employee
- `POST /api/v1/time-off/requests` — Submit request (validates date & sufficient balance)
- `PATCH /api/v1/time-off/requests/:id/approve` — Approve request (HR_MANAGER, decrements balance)
- `PATCH /api/v1/time-off/requests/:id/reject` — Reject request

### E. Payroll & Payruns (`/api/v1/payruns`, `/api/v1/payslips`)
- `GET /api/v1/payruns` — List payruns with summary aggregates
- `POST /api/v1/payruns` — Step 1: Initialize Payrun scope (Period + Structure)
- `POST /api/v1/payruns/:id/generate` — Step 2: Generate draft payslips for selected employees
- `POST /api/v1/payruns/:id/compute` — Compute all payslips in sequence
- `POST /api/v1/payruns/:id/validate` — Validate warnings & freeze
- `POST /api/v1/payruns/:id/pay` — Mark paid
- `GET /api/v1/payslips/:id` — Retrieve full breakdown of payslip
