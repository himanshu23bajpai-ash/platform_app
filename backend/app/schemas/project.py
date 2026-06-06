from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


Lifecycle = Literal["ACTIVE", "IN_DEVELOPMENT", "DEPRECATED"]


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=128)
    description: str = ""
    owner_email: str = ""

    aws_account_id: str = ""
    aws_region: str = "us-east-1"

    repo_url: str = ""
    repo_branch: str = "main"
    language: str = ""

    compute_type: Literal["ecs", "eks", "lambda"] = "ecs"
    lifecycle: Lifecycle = "ACTIVE"


class ProjectUpdate(BaseModel):
    description: str | None = None
    owner_email: str | None = None
    aws_account_id: str | None = None
    aws_region: str | None = None
    repo_url: str | None = None
    repo_branch: str | None = None
    language: str | None = None
    compute_type: Literal["ecs", "eks", "lambda"] | None = None
    lifecycle: Lifecycle | None = None


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str
    owner_email: str
    aws_account_id: str
    aws_region: str
    repo_url: str
    repo_branch: str
    language: str
    compute_type: str
    lifecycle: str
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None


class ProjectSummary(ProjectOut):
    steps_total: int
    steps_completed: int
    overall_status: str  # PENDING|IN_PROGRESS|SUCCESS|FAILED
