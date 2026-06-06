from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.deps import current_user, require_admin, require_cost_access
from app.db import get_db
from app.models.project import Project
from app.models.user import Role, User
from app.schemas.cost import CostMatrixRow, ProjectCost
from app.services.aws.factory import get_cost_provider

router = APIRouter(tags=["cost"])


@router.get("/cost/matrix", response_model=list[CostMatrixRow])
def cost_matrix(
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    """Across-projects cost matrix.
    - ADMIN: all active projects
    - PROJECT_MANAGER: assigned active projects
    - PROJECT_VIEWER: 403
    """
    if user.role == Role.PROJECT_VIEWER.value:
        raise HTTPException(403, "Cost view requires Manager or Admin")

    q = db.query(Project).filter(Project.deleted_at.is_(None))
    if user.role != Role.ADMIN.value:
        assigned_ids = [a.project_id for a in user.assignments]
        if not assigned_ids:
            return []
        q = q.filter(Project.id.in_(assigned_ids))
    projects = q.order_by(Project.name).all()

    provider = get_cost_provider()
    rows: list[CostMatrixRow] = []
    for p in projects:
        c = provider.project_cost(p)
        trend = (
            ((c.total_current_month_usd - c.total_last_month_usd) / c.total_last_month_usd) * 100
            if c.total_last_month_usd
            else 0.0
        )
        rows.append(
            CostMatrixRow(
                project_id=p.id,
                project_name=p.name,
                current_month_usd=c.total_current_month_usd,
                last_month_usd=c.total_last_month_usd,
                trend_pct=round(trend, 1),
            )
        )
    return rows


@router.get("/projects/{project_id}/cost", response_model=ProjectCost)
def project_cost(
    project_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    project = db.get(Project, project_id)
    if not project or project.deleted_at:
        raise HTTPException(404, "Project not found")
    require_cost_access(project_id, user, db)
    return get_cost_provider().project_cost(project)


@router.get("/cost/total", dependencies=[Depends(require_admin)])
def total_cost(db: Session = Depends(get_db)) -> dict:
    """Admin-only: org-wide totals."""
    projects = db.query(Project).filter(Project.deleted_at.is_(None)).all()
    provider = get_cost_provider()
    curr = last = 0.0
    for p in projects:
        c = provider.project_cost(p)
        curr += c.total_current_month_usd
        last += c.total_last_month_usd
    return {
        "currency": "USD",
        "current_month_usd": round(curr, 2),
        "last_month_usd": round(last, 2),
        "project_count": len(projects),
    }
