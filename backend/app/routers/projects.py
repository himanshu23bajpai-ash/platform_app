from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.deps import (
    current_user,
    is_assigned,
    require_admin,
    require_project_access,
)
from app.db import get_db
from app.models.onboarding_step import StepName, StepStatus
from app.models.project import Project
from app.models.project_assignment import ProjectAssignment
from app.models.user import Role, User
from app.schemas.onboarding import OnboardingStepOut
from app.schemas.project import ProjectCreate, ProjectOut, ProjectSummary, ProjectUpdate
from app.schemas.user import AssignmentCreate, AssignmentWithUser
from app.services.onboarding import (
    compute_overall_status,
    create_initial_steps,
    retry_step,
    run_onboarding,
)

router = APIRouter(prefix="/projects", tags=["projects"])


def _visible_projects_query(db: Session, user: User, include_deleted: bool):
    q = db.query(Project)
    if not include_deleted:
        q = q.filter(Project.deleted_at.is_(None))
    if user.role != Role.ADMIN.value:
        assigned_ids = [a.project_id for a in user.assignments]
        q = q.filter(Project.id.in_(assigned_ids)) if assigned_ids else q.filter(False)
    return q


def _get_project(db: Session, project_id: str, *, allow_deleted: bool = False) -> Project:
    project = db.get(Project, project_id)
    if not project or (project.deleted_at and not allow_deleted):
        raise HTTPException(404, "Project not found")
    return project


@router.post("", response_model=ProjectOut, status_code=201)
def create_project(
    payload: ProjectCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
):
    existing = db.query(Project).filter(Project.name == payload.name).first()
    if existing:
        raise HTTPException(409, f"Project '{payload.name}' already exists")
    project = Project(**payload.model_dump())
    if not project.owner_email:
        project.owner_email = user.email
    db.add(project)
    db.flush()
    create_initial_steps(db, project)
    db.commit()
    db.refresh(project)

    background_tasks.add_task(run_onboarding, project.id)
    return project


@router.get("", response_model=list[ProjectSummary])
def list_projects(
    include_deleted: bool = False,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    if include_deleted and user.role != Role.ADMIN.value:
        raise HTTPException(403, "Admin role required to view deleted projects")

    projects = (
        _visible_projects_query(db, user, include_deleted)
        .order_by(Project.created_at.desc())
        .all()
    )
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
def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    project = _get_project(db, project_id)
    require_project_access(project_id, user, db)
    return project


@router.patch("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: str,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    project = _get_project(db, project_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=204)
def soft_delete_project(
    project_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    project = _get_project(db, project_id)
    project.deleted_at = datetime.utcnow()
    db.commit()


@router.post("/{project_id}/restore", response_model=ProjectOut)
def restore_project(
    project_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    project = _get_project(db, project_id, allow_deleted=True)
    if not project.deleted_at:
        raise HTTPException(400, "Project is not deleted")
    project.deleted_at = None
    db.commit()
    db.refresh(project)
    return project


@router.get("/{project_id}/onboarding", response_model=list[OnboardingStepOut])
def get_onboarding(
    project_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    project = _get_project(db, project_id)
    require_project_access(project_id, user, db)
    return project.steps


@router.post("/{project_id}/onboarding/{step}/retry", response_model=list[OnboardingStepOut])
def retry_onboarding_step(
    project_id: str,
    step: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    project = _get_project(db, project_id)
    try:
        StepName(step)
    except ValueError as e:
        raise HTTPException(400, f"Unknown step '{step}'") from e
    background_tasks.add_task(retry_step, project_id, step)
    return project.steps


# --- Assignments (admin-only) ---


@router.get("/{project_id}/assignments", response_model=list[AssignmentWithUser])
def list_assignments(
    project_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    project = _get_project(db, project_id)
    return project.assignments


@router.post("/{project_id}/assignments", response_model=AssignmentWithUser, status_code=201)
def add_assignment(
    project_id: str,
    payload: AssignmentCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    project = _get_project(db, project_id)
    target = db.get(User, payload.user_id)
    if not target:
        raise HTTPException(404, "User not found")
    existing = (
        db.query(ProjectAssignment)
        .filter(
            ProjectAssignment.user_id == payload.user_id,
            ProjectAssignment.project_id == project.id,
        )
        .first()
    )
    if existing:
        return existing
    assignment = ProjectAssignment(user_id=target.id, project_id=project.id)
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


@router.delete("/{project_id}/assignments/{user_id}", status_code=204)
def remove_assignment(
    project_id: str,
    user_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    project = _get_project(db, project_id)
    assignment = (
        db.query(ProjectAssignment)
        .filter(
            ProjectAssignment.user_id == user_id,
            ProjectAssignment.project_id == project.id,
        )
        .first()
    )
    if not assignment:
        raise HTTPException(404, "Assignment not found")
    db.delete(assignment)
    db.commit()
