from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


RoleLiteral = Literal["ADMIN", "PROJECT_MANAGER", "PROJECT_VIEWER"]


class UserCreate(BaseModel):
    email: EmailStr
    name: str = ""
    role: RoleLiteral = "PROJECT_VIEWER"
    is_active: bool = True


class UserUpdate(BaseModel):
    name: str | None = None
    role: RoleLiteral | None = None
    is_active: bool | None = None


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    name: str
    role: str
    is_active: bool
    azure_oid: str
    created_at: datetime
    updated_at: datetime


class AssignmentCreate(BaseModel):
    user_id: str = Field(min_length=1)


class AssignmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    project_id: str
    created_at: datetime


class AssignmentWithUser(AssignmentOut):
    user: UserOut
