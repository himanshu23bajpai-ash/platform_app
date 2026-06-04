# Platform Management Application

A small internal developer platform that lets you:

1. **Onboard projects** through a 4-step guided wizard.
2. **Track the status** of each onboarding step in real time.
3. **View the AWS infrastructure** (compute, databases, S3) for each onboarded project.

## Stack

- **Backend** — Python 3.11 + FastAPI + SQLAlchemy (SQLite)
- **Frontend** — React 18 + Vite + TypeScript + TanStack Query
- **Auth** — Azure AD OAuth 2.0 (with a `AUTH_DISABLED=true` dev escape hatch)
- **AWS** — boto3 in `real` mode, deterministic mock provider otherwise (default: `auto`)

## Local development

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env             # adjust values as needed
uvicorn app.main:app --reload --port 8000
```

The database (`platform.db`) is created automatically on first run.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev                       # http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://localhost:8000`.

### Tests

```bash
cd backend
pytest
```

## Environment variables

See `backend/.env.example` for the full list. Key ones:

| Var | Purpose |
|---|---|
| `AUTH_DISABLED` | `true` skips Azure AD entirely (default for dev). |
| `AZURE_TENANT_ID` / `AZURE_CLIENT_ID` / `AZURE_CLIENT_SECRET` | Azure AD app registration. |
| `AWS_MODE` | `auto` (default), `real`, or `mock`. |
| `SIMULATE_FAIL_STEP` | Name of a step to force-fail for testing the retry flow. |

## Onboarding flow

Each onboarding step runs as a FastAPI BackgroundTask and currently *simulates*
provisioning (sleeps + updates status). The `services/onboarding.py` module is
the integration point for real provisioning logic later (Terraform / CDK calls
behind the same step interface).

## AWS infra dashboard

Real resources are matched to a project via the tag `Project=<project_name>`.
With no AWS credentials present the mock provider returns deterministic fake
data so the UI can be exercised end-to-end.
