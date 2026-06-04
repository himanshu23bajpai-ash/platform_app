from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.deps import current_user
from app.db import get_db
from app.models.project import Project
from app.schemas.aws import ComputeResource, DatabaseResource, S3Resource
from app.services.aws.factory import get_aws_provider

router = APIRouter(prefix="/projects/{project_id}/aws", tags=["aws"])


def _project(db: Session, project_id: str) -> Project:
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    return project


@router.get("/compute", response_model=list[ComputeResource])
def compute(project_id: str, db: Session = Depends(get_db), _: dict = Depends(current_user)):
    return get_aws_provider().list_compute(_project(db, project_id))


@router.get("/databases", response_model=list[DatabaseResource])
def databases(project_id: str, db: Session = Depends(get_db), _: dict = Depends(current_user)):
    return get_aws_provider().list_databases(_project(db, project_id))


@router.get("/s3", response_model=list[S3Resource])
def s3(project_id: str, db: Session = Depends(get_db), _: dict = Depends(current_user)):
    return get_aws_provider().list_s3(_project(db, project_id))
