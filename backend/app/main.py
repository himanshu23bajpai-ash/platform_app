from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.config import get_settings
from app.db import init_db
from app.routers import auth, aws, cost, projects, secrets, users

settings = get_settings()

app = FastAPI(title="Platform Management App", version="0.1.0")

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.session_secret,
    same_site="lax",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup() -> None:
    init_db()


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(projects.router)
app.include_router(aws.router)
app.include_router(secrets.router)
app.include_router(cost.router)
