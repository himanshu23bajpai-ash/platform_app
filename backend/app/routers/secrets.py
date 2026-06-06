from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.deps import current_user, require_project_access
from app.db import get_db
from app.models.project import Project
from app.models.user import User
from app.schemas.secret import SecretSummary, SecretValue, SecretWrite
from app.services.aws.factory import get_secrets_provider

router = APIRouter(prefix="/projects/{project_id}/secrets", tags=["secrets"])


def _project(db: Session, project_id: str, user: User) -> Project:
    project = db.get(Project, project_id)
    if not project or project.deleted_at:
        raise HTTPException(404, "Project not found")
    require_project_access(project_id, user, db)
    return project


@router.get("", response_model=list[SecretSummary])
def list_secrets(
    project_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    project = _project(db, project_id, user)
    return get_secrets_provider().list_secrets(project)


@router.get("/{key}", response_model=SecretValue)
def get_secret(
    project_id: str,
    key: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    project = _project(db, project_id, user)
    try:
        return get_secrets_provider().get_secret(project, key)
    except KeyError as e:
        raise HTTPException(404, f"Secret '{key}' not found") from e


@router.put("/{key}", response_model=SecretSummary)
def put_secret(
    project_id: str,
    key: str,
    payload: SecretWrite,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    project = _project(db, project_id, user)
    return get_secrets_provider().put_secret(project, key, payload.value, payload.description)


@router.delete("/{key}", status_code=204)
def delete_secret(
    project_id: str,
    key: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    project = _project(db, project_id, user)
    get_secrets_provider().delete_secret(project, key)
