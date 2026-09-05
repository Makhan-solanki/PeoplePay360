# Hackathon 2026 — Full-Stack Boilerplate

Production-grade, domain-agnostic boilerplate ready for any hackathon problem statement.

## Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js + Express + TypeScript |
| **ORM** | Prisma + PostgreSQL |
| **Frontend** | Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui |
| **Auth** | JWT (access + refresh tokens), bcrypt, httpOnly cookies |
| **Validation** | Zod |
| **Logging** | Pino (structured, request-scoped) |
| **Testing** | Vitest + Supertest + React Testing Library + Playwright |
| **CI/CD** | GitHub Actions |
| **Containerization** | Docker + docker-compose |

## Project Structure

```
hackathon-2026/
├── .github/workflows/ci.yml    # CI/CD pipeline
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── seed.ts             # Seeds admin user
│   └── src/
│       ├── config/env.ts       # Zod-validated env config
│       ├── lib/
│       │   ├── apiResponse.ts  # { success, data, error } envelope
│       │   ├── errors.ts       # Custom error classes
│       │   ├── logger.ts       # Pino logger
│       │   └── prisma.ts       # Prisma client singleton
│       ├── middleware/
│       │   ├── auth.ts         # JWT verification
│       │   ├── rbac.ts         # Role-based access control
│       │   ├── errorHandler.ts # Centralized error handler
│       │   ├── rateLimiter.ts  # Rate limiting
│       │   ├── requestId.ts    # Request ID generation
│       │   └── validate.ts     # Zod validation middleware
│       ├── modules/
│       │   ├── auth/           # Register, login, refresh, logout, me
│       │   ├── health/         # /health and /ready endpoints
│       │   └── upload/         # S3 presigned URL utility
│       ├── __tests__/          # Unit + integration tests
│       └── index.ts            # App entry point
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── (auth)/         # Login + register pages
│       │   ├── dashboard/      # Protected dashboard
│       │   ├── admin/          # Admin-only page (RBAC demo)
│       │   ├── layout.tsx      # Root layout
│       │   └── page.tsx        # Landing page
│       ├── components/
│       │   ├── auth/           # Login/register forms
│       │   ├── layout/         # Navbar
│       │   ├── shared/         # ProtectedRoute wrapper
│       │   └── ui/             # shadcn/ui components
│       ├── lib/
│       │   ├── api.ts          # Fetch wrapper with auto-refresh
│       │   ├── auth.tsx        # Auth context + useAuth hook
│       │   └── utils.ts        # cn() utility
│       └── __tests__/          # Component tests
├── e2e/
│   ├── playwright.config.ts
│   └── tests/auth-flow.spec.ts # Full auth E2E test
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
└── .env.example
```

## Quick Start

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd hackathon-2026
cp .env.example .env
npm install
```

### 2. Start with Docker (recommended)

```bash
docker-compose up --build
```

This starts:
- **PostgreSQL** on port 5432
- **Backend** on port 3001
- **Frontend** on port 3000

### 3. Start without Docker

```bash
# Start PostgreSQL locally (or use Docker just for DB):
docker-compose up postgres -d

# Run migrations
npm run db:migrate -w backend

# Seed admin user (admin@hack.dev / changeme)
npm run db:seed -w backend

# Start both servers
npm run dev
```

### 4. Verify

```bash
# Health check
curl http://localhost:3001/api/health

# Readiness check (verifies DB connection)
curl http://localhost:3001/api/ready
```

Visit http://localhost:3000 for the frontend.

## Default Admin User

After seeding: **admin@hack.dev** / **changeme**

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | ✗ | Liveness check |
| GET | `/api/ready` | ✗ | Readiness check (DB) |
| POST | `/api/auth/register` | ✗ | Register new user |
| POST | `/api/auth/login` | ✗ | Login |
| POST | `/api/auth/refresh` | ✗ | Refresh access token |
| POST | `/api/auth/logout` | ✓ | Logout (invalidate refresh) |
| GET | `/api/auth/me` | ✓ | Get current user profile |
| POST | `/api/upload/presigned-url` | ✓ | Get S3 upload URL |
| POST | `/api/upload/download-url` | ✓ | Get S3 download URL |

### Response Envelope

Every endpoint returns:
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

## Running Tests

```bash
# All tests (backend + frontend)
npm test

# Backend only
npm test -w backend

# Frontend only
npm test -w frontend

# E2E (requires running services)
npm run test:e2e

# Full CI pipeline (unit + integration + E2E)
npm run test:ci
```

## Adding New Features

### New Backend Module

1. Create `backend/src/modules/<name>/`
2. Add `<name>.controller.ts`, `<name>.service.ts`, `<name>.routes.ts`, `<name>.schema.ts`
3. Mount routes in `backend/src/index.ts`

### New Frontend Page

1. Create `frontend/src/app/<route>/page.tsx`
2. Wrap with `<ProtectedRoute>` if auth is needed
3. Add `requiredRole="ADMIN"` for admin-only pages

### New Database Model

1. Edit `backend/prisma/schema.prisma`
2. Run `npm run db:migrate -w backend`

## RBAC

Two default roles: `ADMIN` and `USER`. To add more:

1. Add to `enum Role` in `prisma/schema.prisma`
2. Use `authorize(['NEW_ROLE'])` in routes
3. Use `<ProtectedRoute requiredRole="NEW_ROLE">` in frontend

## Deployment

The CI/CD pipeline:
1. Lint → Typecheck → Backend Tests → Frontend Tests → E2E Tests
2. Build & push Docker images to GHCR
3. Deploy to staging (placeholder — add your deployment target)

## License

MIT
