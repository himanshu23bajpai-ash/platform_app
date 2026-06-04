from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.deps import current_user
from app.db import get_db
from app.models.onboarding_step import StepName, StepStatus
from app.models.project import Project
from app.schemas.onboarding import OnboardingStepOut
from app.schemas.project import ProjectCreate, ProjectOut, ProjectSummary
from app.services.onboarding import (
    compute_overall_status,
    create_initial_steps,
    retry_step,
    run_onboarding,
)

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("", response_model=ProjectOut, status_code=201)
def create_project(
    payload: ProjectCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: dict = Depends(current_user),
):
    existing = db.query(Project).filter(Project.name == payload.name).first()
    if existing:
        raise HTTPException(409, f"Project '{payload.name}' already exists")
    project = Project(**payload.model_dump())
    if not project.owner_email and user.get("email"):
        project.owner_email = user["email"]
    db.add(project)
    db.flush()
    create_initial_steps(db, project)
    db.commit()
    db.refresh(project)

    background_tasks.add_task(run_onboarding, project.id)
    return project


@router.get("", response_model=list[ProjectSummary])
def list_projects(db: Session = Depends(get_db), _: dict = Depends(current_user)):
    projects = db.query(Project).order_by(Project.created_at.desc()).all()
    out: list[ProjectSummary] = []
    for p in projects:
        completed = sum(1 for s in p.steps if s.status == StepStatus.SUCCESS.value)
        out.append(
            ProjectSummary(
                **ProjectOut.model_validate(p).model_dump(),
                steps_total=len(p.steps),
                steps_completed=completed,
                overall_status=compute_overall_status(p.steps),
            )
        )
    return out


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(project_id: str, db: Session = Depends(get_db), _: dict = Depends(current_user)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    return project


@router.get("/{project_id}/onboarding", response_model=list[OnboardingStepOut])
def get_onboarding(project_id: str, db: Session = Depends(get_db), _: dict = Depends(current_user)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    return project.steps


@router.post("/{project_id}/onboarding/{step}/retry", response_model=list[OnboardingStepOut])
def retry_onboarding_step(
    project_id: str,
    step: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _: dict = Depends(current_user),
):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    try:
        StepName(step)
    except ValueError as e:
        raise HTTPException(400, f"Unknown step '{step}'") from e
    background_tasks.add_task(retry_step, project_id, step)
    return project.steps
