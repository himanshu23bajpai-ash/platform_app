from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.deps import current_user, require_project_access
from app.db import get_db
from app.models.project import Project
from app.models.user import User
from app.schemas.activity import ActivityOverview
from app.schemas.ai import AiOverview
from app.services.insights import activity_overview, ai_overview

router = APIRouter(prefix="/projects/{project_id}", tags=["insights"])


def _project(db: Session, project_id: str, user: User) -> Project:
    project = db.get(Project, project_id)
    if not project or project.deleted_at:
        raise HTTPException(404, "Project not found")
    require_project_access(project_id, user, db)
    return project


@router.get("/ai", response_model=AiOverview)
def project_ai(project_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return ai_overview(_project(db, project_id, user))


@router.get("/activity", response_model=ActivityOverview)
def project_activity(
    project_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)
):
    return activity_overview(_project(db, project_id, user))
