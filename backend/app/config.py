from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./platform.db"
    frontend_origin: str = "http://localhost:5173"

    session_secret: str = "dev-secret-change-me"

    azure_tenant_id: str = ""
    azure_client_id: str = ""
    azure_client_secret: str = ""
    azure_redirect_uri: str = "http://localhost:8000/auth/callback"
    azure_post_login_redirect: str = "http://localhost:5173/projects"

    aws_mode: Literal["auto", "real", "mock"] = "auto"
    aws_region: str = "us-east-1"

    auth_disabled: bool = True
    simulate_fail_step: str = ""

    # Comma-separated emails that get auto-promoted to ADMIN on first login.
    admin_emails: str = "dev@local"

    # Dev escape-hatch identity (used when AUTH_DISABLED=true).
    dev_user_email: str = "dev@local"
    dev_user_name: str = "Local Dev"
    dev_user_role: str = "ADMIN"


@lru_cache
def get_settings() -> Settings:
    return Settings()
