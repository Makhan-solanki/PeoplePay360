# Hackathon 2026 Boilerplate Architecture & Developer Guide

This document provides a comprehensive guide to this boilerplate. It is designed for both human developers and AI agents to quickly understand the project structure, conventions, execution flow, and how to extend it once the hackathon problem statement is announced.

---

## 1. High-Level Architecture Overview

This project is organized as an **npm workspaces monorepo** with Docker containerization support:

```
Hackathon/
├── backend/                   # Node.js + Express + TypeScript + Prisma
│   ├── prisma/                # Database schema & migrations
│   │   ├── schema.prisma      # Models (User, Role enum, RefreshToken)
│   │   └── seed.ts            # Default seed data (admin & test users)
│   ├── src/
│   │   ├── config/            # Validated env configurations
│   │   ├── controllers/       # HTTP Request & Response handlers
│   │   ├── middlewares/       # Auth (JWT), RBAC, Error, Rate limiter, Validation
│   │   ├── routes/            # Express routers (/api/v1/auth, /api/v1/users, health)
│   │   ├── schemas/           # Zod input validation schemas
│   │   ├── services/          # Business logic & database operations (Prisma)
│   │   ├── utils/             # Standard API envelope, logger, token utils
│   │   └── index.ts           # App entrypoint & HTTP server
│   └── tsconfig.json, package.json
│
├── frontend/                  # Next.js 14/15 App Router + Tailwind CSS + shadcn/ui
│   ├── src/
│   │   ├── app/               # App Router pages & layouts
│   │   │   ├── (auth)/        # Route group: /login, /register
│   │   │   ├── admin/         # Protected admin dashboard (RBAC test)
│   │   │   ├── dashboard/     # Protected user dashboard
│   │   │   ├── globals.css    # Global CSS variables & Tailwind directives
│   │   │   ├── layout.tsx     # Root layout with AuthProvider & Toast notifications
│   │   │   └── page.tsx       # Landing page
│   │   ├── components/
│   │   │   ├── auth/          # LoginForm, RegisterForm
│   │   │   ├── layout/        # Navbar
│   │   │   ├── shared/        # ProtectedRoute wrapper
│   │   │   └── ui/            # Reusable UI components (Button, Input, Card, Label)
│   │   └── lib/
│   │       ├── api.ts         # Axios client with auto JWT refresh interceptors
│   │       ├── auth.tsx       # React AuthContext, useAuth hook
│   │       └── utils.ts       # Tailwind class merger (cn)
│   └── components.json, tailwind.config.js, tsconfig.json
│
├── e2e/                       # Playwright end-to-end test suite
├── docs/                      # Project documentation (this file)
├── docker-compose.yml         # Multi-service setup (PostgreSQL, Backend, Frontend)
├── Dockerfile.backend         # Multi-stage production build for Express
├── Dockerfile.frontend        # Multi-stage production build for Next.js
└── package.json               # Root monorepo scripts & workspaces
```

---

## 2. Tech Stack Summary

| Layer | Technology | Purpose |
|---|---|---|
| **Backend** | Express + TypeScript | REST API service |
| **Database & ORM** | PostgreSQL + Prisma ORM | Data modeling, migrations, query builder |
| **Frontend** | Next.js (App Router) + React | Client-side and server-rendered UI |
| **Styling** | Tailwind CSS + shadcn/ui primitives | Clean, consistent, and fast UI design system |
| **Authentication** | JWT (Access + Refresh tokens in httpOnly cookies) | Secure, stateless authentication |
| **Validation** | Zod | End-to-end request validation |
| **Testing** | Vitest + Testing Library + Playwright | Unit, component, integration, and E2E testing |
| **DevOps** | Docker, docker-compose, GitHub Actions | Local orchestration and CI/CD pipelines |

---

## 3. Core Features & Implementations

### A. Authentication & Security
- **Access Tokens:** Short-lived JWT (15m expiration) stored either in headers or httpOnly cookie.
- **Refresh Tokens:** Long-lived (7d expiration) stored in PostgreSQL (`RefreshToken` table) and transmitted via `httpOnly`, `SameSite=lax` secure cookie.
- **Password Security:** Hashes passwords with `bcryptjs` using a salt work factor of 12.
- **Silent Refresh Interceptor (`frontend/src/lib/api.ts`):** Automatically catches 401s on API requests, calls `/api/v1/auth/refresh`, and transparently retries the original request.
- **Rate Limiting:** Prevents brute-force on auth endpoints (`backend/src/middlewares/rateLimiter.ts`).

### B. Role-Based Access Control (RBAC)
- Built-in roles: `ADMIN`, `USER`.
- Backend middleware:
  ```typescript
  // Usage in routes:
  router.get('/admin-only', authenticate, authorize(['ADMIN']), controller);
  ```
- Frontend Protected Route component:
  ```tsx
  <ProtectedRoute requiredRole="ADMIN">
    <AdminPanel />
  </ProtectedRoute>
  ```

### C. Standardized API Response Envelope
All backend endpoints respond with a consistent JSON structure via `backend/src/utils/apiResponse.ts`:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid credentials",
    "details": [...]
  }
}
```

---

## 4. How to Run the Project

### Option 1: Docker (Fastest for Complete Stack)
Runs PostgreSQL, Backend, and Frontend in isolated containers:
```bash
# 1. Copy environment files
cp .env.example .env

# 2. Build and run all services
docker-compose up --build

# 3. Seed initial database (run in a separate terminal)
npm run db:migrate -w backend
npm run db:seed -w backend
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- Health Check: `http://localhost:5000/api/v1/health`

### Option 2: Local Development (Without Docker)
1. Ensure PostgreSQL is running locally on port 5432 with credentials matching `.env`.
2. Generate Prisma Client & Migrate:
   ```bash
   npm run db:migrate -w backend
   npm run db:seed -w backend
   ```
3. Run both backend & frontend concurrently:
   ```bash
   npm run dev
   ```

---

## 5. Seed Accounts & Credentials

The seed script creates the following default accounts for testing:

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@hack.dev` | `Admin123!` |
| **User** | `user@hack.dev` | `User123!` |

---

## 6. How Agents/Developers Should Build New Features

When you receive the actual problem statement during the hackathon, follow these concrete steps to extend this boilerplate:

### Step 1: Update Database Schema
1. Open [schema.prisma](file:///c:/Users/ADL/Desktop/Hackathon/backend/prisma/schema.prisma).
2. Add your new models and relations.
3. Run migration:
   ```bash
   npx prisma migrate dev --name <your_feature_name> --schema=backend/prisma/schema.prisma
   ```

### Step 2: Implement Backend API
1. **Schema Validation:** Create a Zod schema in `backend/src/schemas/<feature>.schema.ts`.
2. **Service Layer:** Implement database queries using Prisma in `backend/src/services/<feature>.service.ts`.
3. **Controller Layer:** Handle request extraction and response wrapping in `backend/src/controllers/<feature>.controller.ts`.
4. **Router:** Register routes in `backend/src/routes/<feature>.routes.ts` and attach to Express in `backend/src/routes/index.ts`.

### Step 3: Implement Frontend UI
1. **API Client Calls:** Add API helper functions using the preconfigured Axios instance in `frontend/src/lib/api.ts`.
2. **Components:** Build reusable UI components or add shadcn primitives using `frontend/src/components/ui`.
3. **Pages:** Create the corresponding page routes in `frontend/src/app/<feature>/page.tsx`.
4. **Protect Routes:** Wrap protected views with `<ProtectedRoute>` as needed.

---

## 7. Testing Commands

- **Run all unit/component tests:**
  ```bash
  npm run test -w backend
  npm run test -w frontend
  ```
- **Run E2E tests (Playwright):**
  ```bash
  npm run test:e2e
  ```
- **Typecheck & Linting:**
  ```bash
  npm run typecheck
  npm run lint
  ```
