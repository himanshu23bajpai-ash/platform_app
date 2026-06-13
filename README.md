# Platform Management Application

An internal developer platform with project onboarding, AWS infrastructure
visibility, AI/ML operations dashboards, role-based access control, and
project-level secret + cost management.

## Features

- **Project onboarding** — 4-step guided wizard (repo → AWS account/VPC → CI/CD
  → compute), each step runs as a background task with live status polling and
  per-step retry.
- **Per-project dashboard** with 7 tabs:
  - **AWS** — EC2 / ECS / EKS / Lambda compute, RDS / DynamoDB, S3 buckets
  - **AI** — deployed models with accuracy bars, training jobs
  - **Application Activity** — request volume & error charts, deployments,
    active errors
  - **Onboarding** — step status + retry
  - **Secrets** — AWS Secrets Manager CRUD (real or in-memory mock)
  - **Cost** — KPIs, per-service breakdown, 6-month spend chart
  - **Team** — project assignment management
- **RBAC** with three roles: ADMIN, PROJECT_MANAGER, PROJECT_VIEWER
- **User management** — admin-only CRUD with self-demotion guards
- **Soft delete** with restore
- **Cost matrix** across projects (admin: all; manager: assigned)
- **Azure AD OAuth 2.0** login with a dev escape hatch (`AUTH_DISABLED=true`)
- **AWS integration**: real boto3 with deterministic mock fallback

## Stack

| Layer | Choice |
|---|---|
| Backend | Python 3.11 + FastAPI + SQLAlchemy 2 + SQLite |
| Frontend | React 18 + Vite + TypeScript + Material UI 5 + Highcharts |
| Data | TanStack Query + axios |
| Auth | Azure AD OAuth (MSAL) |
| AWS | boto3 (auto / real / mock modes) |

## Prerequisites

- Python ≥ 3.11
- Node.js ≥ 20
- (optional) AWS credentials if you want `AWS_MODE=real`
- (optional) Azure AD app registration if you want real login
  (otherwise the app runs with `AUTH_DISABLED=true`)

## Quick start

The app runs comfortably with **two terminals** — one for the API, one for the
UI. With `AUTH_DISABLED=true` and `AWS_MODE=mock` (the defaults), no external
credentials are needed.

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
cp .env.example .env                 # leave defaults for local dev
uvicorn app.main:app --reload --port 8000
```

The SQLite database (`backend/platform.db`) is created automatically on first
boot. The dev user (`dev@local`) is auto-bootstrapped as an admin.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env                 # default VITE_API_BASE=/api is fine
npm run dev                          # http://localhost:5173
```

Vite proxies `/api/*` to `http://localhost:8000`.

Open **http://localhost:5173** in your browser. You're signed in as the dev
admin user — you'll see the project card grid, empty at first.

## Trying it out

1. Click **+ Onboard project**, fill in a name (e.g. `checkout-svc`),
   description, and pick a compute type. Hit Onboard.
2. You'll land on the project dashboard. Click the **Onboarding** tab and
   watch the 4 steps tick over to Success in ~8 s.
3. The **AWS** tab will show mock EC2 / ECS / S3 / RDS / DynamoDB resources
   scoped to the project.
4. The **AI** and **Application Activity** tabs show deterministic mock
   metrics seeded from the project id (so each project gets stable,
   distinct-looking data).
5. The **Secrets** tab lets you create / read / update / delete secrets that
   would live under `platform/<project-name>/<key>` in AWS Secrets Manager.
6. The **Cost** tab shows mocked Cost Explorer data with a 6-month
   Highcharts column chart.

### Testing role-based access

The dev escape hatch lets you impersonate any role without setting up
Azure AD. Restart the backend with different env vars:

```bash
# Admin (default)
AUTH_DISABLED=true uvicorn app.main:app --reload --port 8000

# Manager — sees only assigned projects + cost matrix for those
AUTH_DISABLED=true \
DEV_USER_EMAIL=manager@acme.com \
DEV_USER_ROLE=PROJECT_MANAGER \
uvicorn app.main:app --reload --port 8000

# Viewer — assigned project only, no cost view
AUTH_DISABLED=true \
DEV_USER_EMAIL=viewer@acme.com \
DEV_USER_ROLE=PROJECT_VIEWER \
uvicorn app.main:app --reload --port 8000
```

While running as admin, create the manager/viewer users on the **Users**
page, then go to a project's **Team** tab and assign them.

## Environment variables

Backend `.env` — see `backend/.env.example`. Highlights:

| Var | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./platform.db` | SQLAlchemy URL |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | CORS allowlist |
| `SESSION_SECRET` | `dev-secret-change-me` | Cookie signing key |
| `AUTH_DISABLED` | `true` | Skip Azure AD; use the dev user instead |
| `ADMIN_EMAILS` | `dev@local` | Comma-separated emails auto-promoted to ADMIN on first login |
| `DEV_USER_EMAIL` | `dev@local` | Identity returned when AUTH_DISABLED |
| `DEV_USER_NAME` | `Local Dev` | Display name |
| `DEV_USER_ROLE` | `ADMIN` | Role of the dev user (ADMIN, PROJECT_MANAGER, PROJECT_VIEWER) |
| `AZURE_TENANT_ID` / `AZURE_CLIENT_ID` / `AZURE_CLIENT_SECRET` | (empty) | Azure AD app registration |
| `AZURE_REDIRECT_URI` | `http://localhost:8000/auth/callback` | OAuth redirect |
| `AZURE_POST_LOGIN_REDIRECT` | `http://localhost:5173/projects` | Where to send the user after login |
| `AWS_MODE` | `auto` | `auto` / `real` / `mock`. `auto` uses boto3 if creds are present, else mock |
| `AWS_REGION` | `us-east-1` | Default region when project has none |
| `SIMULATE_FAIL_STEP` | (empty) | Force an onboarding step to fail (e.g. `CICD_PIPELINE`) for testing the retry UX |

Frontend `.env` — see `frontend/.env.example`:

| Var | Default | Purpose |
|---|---|---|
| `VITE_API_BASE` | `/api` | Base URL for API calls (proxied by Vite in dev) |

## Going to real AWS / real Azure AD

### Real AWS

Export AWS credentials and set `AWS_MODE=real` (or leave `auto` — `auto`
detects credentials and switches). Real resources are matched per project
via the tag `Project=<project_name>`. Secrets live under
`platform/<project_name>/<key>` in AWS Secrets Manager. Cost data is read
from Cost Explorer (must be enabled in your account).

### Real Azure AD

There are two ways to wire Azure AD up, both supported simultaneously.

**Option A — SPA-initiated SSO via MSAL.js (recommended).** The user signs
in directly with Microsoft from the browser; the frontend acquires an ID
token and sends it on every request; the backend validates the token
against Azure AD's JWKS.

1. Register an app in Azure AD with:
   - Platform = **Single-page application**
   - Redirect URI = `http://localhost:5173` (and your deployed URL)
2. Backend env:
   ```
   AUTH_DISABLED=false
   AZURE_TENANT_ID=<tenant-guid>
   AZURE_CLIENT_ID=<spa-app-client-id>
   ADMIN_EMAILS=you@example.com
   ```
   (No client secret needed for SPA-initiated auth.)
3. Frontend env (`frontend/.env`):
   ```
   VITE_AZURE_TENANT_ID=<tenant-guid>
   VITE_AZURE_CLIENT_ID=<spa-app-client-id>
   VITE_AZURE_REDIRECT_URI=http://localhost:5173    # optional; defaults to origin
   ```
4. Restart both. The login page now uses MSAL.js: clicking
   *Sign in with Microsoft* redirects to `login.microsoftonline.com`,
   returns with an ID token, and the SPA sends it as
   `Authorization: Bearer <id_token>` on every API call.

**Option B — Server-side authorization-code flow (cookie session).** Use
this if the SPA can't talk to Azure AD directly (locked-down network) or
you want server-issued cookies.

1. Register an app with platform = **Web** and redirect URI
   `http://localhost:8000/auth/callback`
2. Generate a client secret
3. Backend env: `AUTH_DISABLED=false`, `AZURE_TENANT_ID`,
   `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`
4. Leave the frontend `VITE_AZURE_CLIENT_ID` blank. The login page falls
   back to a link that hits the backend's `/auth/login` endpoint.

## Tests

```bash
cd backend
source .venv/bin/activate
pytest                               # 14 tests covering RBAC, onboarding,
                                     # secrets, cost, AI/activity
```

The frontend production build doubles as a typecheck:

```bash
cd frontend
npm run build                        # tsc -b && vite build
```

## Docker Compose (optional)

A `docker-compose.yml` is provided to spin both services up together:

```bash
docker compose up --build
# backend: http://localhost:8000
# frontend: http://localhost:5173
```

## Customizing colors / theme

All colors live in **`frontend/src/colors.ts`** — a single file with the
purple scale, neutral scale, semantic colors, surface tokens, chart series,
and status-badge maps. The MUI theme (`theme.ts`), Highcharts global setup
(`charts/setup.ts`), and every inline style derive from it. To change the
brand color, edit the `purple` scale; everything else picks it up.

## Repository structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI entry
│   ├── config.py                # Pydantic Settings
│   ├── db.py                    # SQLAlchemy engine + session
│   ├── models/                  # User, Project, OnboardingStep, ProjectAssignment
│   ├── schemas/                 # Pydantic request/response models
│   ├── auth/                    # Azure AD + RBAC dependencies
│   ├── services/
│   │   ├── onboarding.py        # 4-step state machine
│   │   ├── insights.py          # AI + Activity mock data
│   │   └── aws/                 # boto3 + mock providers (resources, secrets, cost)
│   └── routers/                 # auth, users, projects, aws, secrets, cost, insights
├── tests/
├── pyproject.toml
└── .env.example

frontend/
├── src/
│   ├── colors.ts                # ✨ Single source of truth for all colors
│   ├── theme.ts                 # MUI theme (consumes colors.ts)
│   ├── charts/setup.ts          # Highcharts global theme (consumes colors.ts)
│   ├── api/                     # axios client + TanStack Query hooks
│   ├── components/
│   │   ├── Layout.tsx           # AppBar shell
│   │   ├── KpiCard.tsx
│   │   └── tabs/                # AwsTab, AiTab, ActivityTab, OnboardingTab,
│   │                            # SecretsTab, TeamTab, CostTab
│   └── pages/                   # Projects, OnboardWizard, ProjectDashboard,
│                                # Users, CostMatrix, Login
├── package.json
└── .env.example

docker-compose.yml
README.md
```

## API quick reference

All non-auth endpoints require authentication (cookie session or
`AUTH_DISABLED=true`).

| Method | Path | Role |
|---|---|---|
| `GET` | `/health` | — |
| `GET` | `/auth/login` | — |
| `GET` | `/auth/callback` | — |
| `GET` | `/auth/me` | any |
| `POST` | `/auth/logout` | any |
| `GET` | `/users` · `POST` `/users` · `PATCH` `/users/{id}` · `DELETE` `/users/{id}` | ADMIN |
| `POST` | `/projects` | ADMIN |
| `GET` | `/projects` (filtered by assignment) | any |
| `GET` | `/projects/{id}` · `PATCH` · `DELETE` (soft) · `POST /restore` | ADMIN for write, assigned/admin for read |
| `GET` | `/projects/{id}/onboarding` | assigned/admin |
| `POST` | `/projects/{id}/onboarding/{step}/retry` | ADMIN |
| `GET` `POST` `DELETE` | `/projects/{id}/assignments[/{user_id}]` | ADMIN |
| `GET` | `/projects/{id}/aws/{compute,databases,s3}` | assigned/admin |
| `GET` `PUT` `DELETE` | `/projects/{id}/secrets[/{key}]` | assigned/admin |
| `GET` | `/projects/{id}/ai` · `/activity` | assigned/admin |
| `GET` | `/projects/{id}/cost` | assigned manager / admin |
| `GET` | `/cost/matrix` | manager (assigned) / admin (all) |
| `GET` | `/cost/total` | ADMIN |

Full schema is available at **http://localhost:8000/docs** (FastAPI auto-docs)
once the backend is running.

## License

Internal / unspecified — adapt as needed.
