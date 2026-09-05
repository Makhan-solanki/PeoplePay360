# 🚀 AWS Production Deployment & Automated CI/CD Guide

This guide describes the fastest, most reliable deployment options on AWS for this hackathon project, complete with automatic GitHub Actions CI/CD.

---

## 🏆 Recommendation for Hackathons: **AWS App Runner + RDS PostgreSQL**

For a 24–48h hackathon, **do not waste time configuring VPC NAT Gateways, Kubernetes (EKS), or ECS cluster task definitions manually**. 

**AWS App Runner** is AWS's modern container platform (like Cloud Run or Railway):
- Automatically builds & runs Docker containers.
- Gives you free HTTPS URLs (`https://xyz.awsapprunner.com`).
- Scales automatically and manages health checks.
- Takes **< 15 minutes** to set up.

---

## Architecture Topology

```
                  ┌────────────────────────┐
                  │    GitHub Repository   │
                  │   (push to `main`)     │
                  └──────────┬─────────────┘
                             │
                  GitHub Actions (CI/CD)
                  ├── Lint & Typecheck
                  ├── Unit & Component Tests
                  └── Push Docker Images to AWS ECR
                             │
             ┌───────────────┴────────────────┐
             ▼                                ▼
┌───────────────────────────┐    ┌───────────────────────────┐
│ AWS App Runner (Frontend) │    │ AWS App Runner (Backend)  │
│  Next.js (Port 3000)      │───▶│  Express API (Port 5000)  │
│  Public HTTPS Domain      │    │  Public HTTPS Domain      │
└───────────────────────────┘    └─────────────┬─────────────┘
                                               │
                                               ▼
                                 ┌───────────────────────────┐
                                 │    AWS RDS PostgreSQL     │
                                 │   (db.t4g.micro / Free)   │
                                 └───────────────────────────┘
```

---

## Step 1: Provision Managed PostgreSQL on AWS RDS

1. Log in to AWS Console and navigate to **RDS** -> **Create database**.
2. **Engine:** PostgreSQL (version 15 or 16).
3. **Template:** Free tier (or Dev/Test).
4. **Settings:**
   - DB instance identifier: `hackathon-db`
   - Master username: `postgres`
   - Master password: `YourStrongPassword123!` (save this!)
5. **Instance Class:** `db.t4g.micro` or `db.t3.micro`.
6. **Connectivity:**
   - **Public access:** **Yes** (Simplifies connecting App Runner without configuring complex VPC connectors).
   - **VPC Security Group:** Create new (allow inbound port `5432` from anywhere `0.0.0.0/0` for the hackathon, or restrict to your IP + AWS services).
7. Click **Create Database**.
8. Once created, copy the **Endpoint** (e.g. `hackathon-db.c12345.us-east-1.rds.amazonaws.com`).
9. Your production `DATABASE_URL` will be:
   ```text
   postgresql://postgres:YourStrongPassword123!@hackathon-db.c12345.us-east-1.rds.amazonaws.com:5432/postgres?schema=public
   ```

---

## Step 2: Create AWS ECR (Elastic Container Registry) Repositories

Create two repositories in AWS ECR to store Docker images:
1. Go to **Amazon ECR** -> **Repositories** -> **Create repository**.
2. Name the first: `hackathon-backend`.
3. Create a second one: `hackathon-frontend`.
4. Note your AWS Account ID and region (e.g., `123456789012.dkr.ecr.us-east-1.amazonaws.com`).

---

## Step 3: Create AWS App Runner Services

### A. Backend Service
1. Navigate to **AWS App Runner** -> **Create service**.
2. **Source:** Container registry -> Amazon ECR.
3. Select `hackathon-backend`, tag: `latest`.
4. **Deployment settings:** **Automatic** (App Runner redeploys automatically whenever a new image is pushed to ECR!).
5. **Configuration:**
   - Service name: `hackathon-backend-api`
   - Port: `5000`
   - Environment variables:
     - `NODE_ENV`: `production`
     - `PORT`: `5000`
     - `DATABASE_URL`: *(Your RDS connection string from Step 1)*
     - `JWT_SECRET`: *(A random 32+ character string)*
     - `JWT_REFRESH_SECRET`: *(Another random 32+ character string)*
     - `CORS_ORIGINS`: `*` *(or your frontend App Runner URL once created)*
6. Click **Create & Deploy**.
7. App Runner will give you a default domain like: `https://backend-xyz.us-east-1.awsapprunner.com`.
8. Verify health endpoint: `https://backend-xyz.us-east-1.awsapprunner.com/api/v1/health`.

### B. Frontend Service
1. In App Runner, click **Create service**.
2. Container registry -> `hackathon-frontend`, tag: `latest`.
3. **Deployment settings:** **Automatic**.
4. **Configuration:**
   - Service name: `hackathon-frontend-ui`
   - Port: `3000`
   - Environment variables:
     - `NEXT_PUBLIC_API_URL`: `https://backend-xyz.us-east-1.awsapprunner.com/api`
5. Click **Create & Deploy**.
6. You now have a live public frontend URL!

---

## Step 4: Configure GitHub Secrets for CI/CD

In your GitHub repository, go to **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**:

| Secret Name | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM User Access Key with ECR & App Runner permissions |
| `AWS_SECRET_ACCESS_KEY` | IAM User Secret Key |
| `AWS_REGION` | e.g. `us-east-1` |
| `AWS_ACCOUNT_ID` | Your 12-digit AWS Account ID |
| `DATABASE_URL` | RDS Database URL (for running production migrations in CI) |

---

## Step 5: Complete GitHub Actions CI/CD Workflow (`.github/workflows/deploy.yml`)

Save this file in `.github/workflows/deploy.yml`. Every time you push to `main`, it will:
1. Lint, typecheck, and test your code.
2. Run database migrations on RDS.
3. Build and push production Docker images to ECR.
4. AWS App Runner detects the new ECR image and **deploys automatically in the background**.

```yaml
name: Continuous Deployment to AWS

on:
  push:
    branches: [main]

jobs:
  test:
    name: Run Quality & Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  migrate-db:
    name: Apply Database Migrations
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - name: Run Prisma Migration
        run: npx -w backend prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

  build-and-push:
    name: Build & Push Images to ECR
    runs-on: ubuntu-latest
    needs: migrate-db
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build & Push Backend
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        run: |
          docker build -t $ECR_REGISTRY/hackathon-backend:latest -f Dockerfile.backend .
          docker push $ECR_REGISTRY/hackathon-backend:latest

      - name: Build & Push Frontend
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        run: |
          docker build -t $ECR_REGISTRY/hackathon-frontend:latest -f Dockerfile.frontend .
          docker push $ECR_REGISTRY/hackathon-frontend:latest
```

---

## ⚡ Alternative 5-Minute Alternative: AWS EC2 (Single VM Docker Compose)

If you don't want to configure RDS/ECR/App Runner and prefer running the exact same `docker-compose.yml` live on a single AWS VM:

1. Launch an **EC2 Ubuntu 24.04 instance** (`t3.small` or `t3.medium`).
2. Allow inbound ports in Security Group: `80`, `443`, `3000`, `5000`.
3. SSH into the instance:
   ```bash
   ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>
   ```
4. Install Docker & Compose:
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose
   sudo usermod -aG docker ubuntu
   ```
5. Clone repository and run:
   ```bash
   git clone <YOUR_REPO_URL>
   cd Hackathon
   cp .env.example .env
   # Update .env if needed
   docker-compose up -d --build
   npm run db:migrate -w backend
   npm run db:seed -w backend
   ```
6. Access your app at `http://<EC2-PUBLIC-IP>:3000`.
