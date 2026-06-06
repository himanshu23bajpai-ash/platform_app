import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Role(str, Enum):
    ADMIN = "ADMIN"
    PROJECT_MANAGER = "PROJECT_MANAGER"
    PROJECT_VIEWER = "PROJECT_VIEWER"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(256), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(256), default="")
    role: Mapped[str] = mapped_column(String(32), nullable=False, default=Role.PROJECT_VIEWER.value)
    azure_oid: Mapped[str] = mapped_column(String(64), default="")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    assignments: Mapped[list["ProjectAssignment"]] = relationship(  # noqa: F821
        "ProjectAssignment", back_populates="user", cascade="all, delete-orphan"
    )
