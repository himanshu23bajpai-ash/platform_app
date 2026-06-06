import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(String(512), default="")
    owner_email: Mapped[str] = mapped_column(String(256), default="")

    aws_account_id: Mapped[str] = mapped_column(String(32), default="")
    aws_region: Mapped[str] = mapped_column(String(32), default="us-east-1")

    repo_url: Mapped[str] = mapped_column(String(512), default="")
    repo_branch: Mapped[str] = mapped_column(String(128), default="main")
    language: Mapped[str] = mapped_column(String(64), default="")

    # ecs | eks | lambda
    compute_type: Mapped[str] = mapped_column(String(16), default="ecs")

    # ACTIVE | IN_DEVELOPMENT | DEPRECATED
    lifecycle: Mapped[str] = mapped_column(String(32), default="ACTIVE")

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    steps: Mapped[list["OnboardingStep"]] = relationship(  # noqa: F821
        "OnboardingStep",
        back_populates="project",
        cascade="all, delete-orphan",
        order_by="OnboardingStep.order_index",
    )
    assignments: Mapped[list["ProjectAssignment"]] = relationship(  # noqa: F821
        "ProjectAssignment", back_populates="project", cascade="all, delete-orphan"
    )
