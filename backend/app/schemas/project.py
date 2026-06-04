from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


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
    created_at: datetime
    updated_at: datetime


class ProjectSummary(ProjectOut):
    steps_total: int
    steps_completed: int
    overall_status: str  # PENDING|IN_PROGRESS|SUCCESS|FAILED
