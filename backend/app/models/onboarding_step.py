import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class StepName(str, Enum):
    REPO_REGISTRATION = "REPO_REGISTRATION"
    AWS_ACCOUNT_VPC = "AWS_ACCOUNT_VPC"
    CICD_PIPELINE = "CICD_PIPELINE"
    COMPUTE_PROVISION = "COMPUTE_PROVISION"


class StepStatus(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


STEP_ORDER: list[StepName] = [
    StepName.REPO_REGISTRATION,
    StepName.AWS_ACCOUNT_VPC,
    StepName.CICD_PIPELINE,
    StepName.COMPUTE_PROVISION,
]


class OnboardingStep(Base):
    __tablename__ = "onboarding_steps"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"))

    step: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(16), default=StepStatus.PENDING.value)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)

    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    message: Mapped[str] = mapped_column(String(1024), default="")

    project: Mapped["Project"] = relationship("Project", back_populates="steps")  # noqa: F821
