import time
from datetime import datetime

from sqlalchemy.orm import Session

from app import db as _db
from app.config import get_settings
from app.models.onboarding_step import STEP_ORDER, OnboardingStep, StepName, StepStatus
from app.models.project import Project


def create_initial_steps(db: Session, project: Project) -> None:
    for idx, step_name in enumerate(STEP_ORDER):
        db.add(
            OnboardingStep(
                project_id=project.id,
                step=step_name.value,
                status=StepStatus.PENDING.value,
                order_index=idx,
            )
        )
    db.flush()


def _run_step(db: Session, step: OnboardingStep, project: Project) -> None:
    """Simulated step execution. Replace with real provisioning later."""
    settings = get_settings()
    step.status = StepStatus.IN_PROGRESS.value
    step.started_at = datetime.utcnow()
    step.message = f"Running {step.step}..."
    db.commit()

    time.sleep(2)  # simulate work

    if settings.simulate_fail_step and settings.simulate_fail_step == step.step:
        step.status = StepStatus.FAILED.value
        step.completed_at = datetime.utcnow()
        step.message = f"Simulated failure on {step.step}"
        db.commit()
        return

    # Step-specific simulated success messages
    msg_map = {
        StepName.REPO_REGISTRATION.value: f"Repository {project.repo_url or '(none)'} registered",
        StepName.AWS_ACCOUNT_VPC.value: f"AWS account {project.aws_account_id or '(none)'} / VPC verified",
        StepName.CICD_PIPELINE.value: f"CI/CD pipeline for {project.name} created",
        StepName.COMPUTE_PROVISION.value: f"{project.compute_type.upper()} compute provisioned",
    }
    step.status = StepStatus.SUCCESS.value
    step.completed_at = datetime.utcnow()
    step.message = msg_map.get(step.step, "ok")
    db.commit()


def run_onboarding(project_id: str) -> None:
    """Run the onboarding sequence for a project. Called as a BackgroundTask."""
    db = _db.SessionLocal()
    try:
        project = db.get(Project, project_id)
        if not project:
            return
        for step in project.steps:
            if step.status == StepStatus.SUCCESS.value:
                continue
            _run_step(db, step, project)
            if step.status == StepStatus.FAILED.value:
                return
    finally:
        db.close()


def retry_step(project_id: str, step_name: str) -> None:
    """Retry a single failed step and continue subsequent pending steps."""
    db = _db.SessionLocal()
    try:
        project = db.get(Project, project_id)
        if not project:
            return
        target_index = next(
            (s.order_index for s in project.steps if s.step == step_name), None
        )
        if target_index is None:
            return
        for step in project.steps:
            if step.order_index < target_index:
                continue
            if step.status == StepStatus.SUCCESS.value:
                continue
            # Reset failed/pending state and run
            step.status = StepStatus.PENDING.value
            step.started_at = None
            step.completed_at = None
            step.message = ""
            db.commit()
            _run_step(db, step, project)
            if step.status == StepStatus.FAILED.value:
                return
    finally:
        db.close()


def compute_overall_status(steps: list[OnboardingStep]) -> str:
    statuses = [s.status for s in steps]
    if all(s == StepStatus.SUCCESS.value for s in statuses):
        return StepStatus.SUCCESS.value
    if any(s == StepStatus.FAILED.value for s in statuses):
        return StepStatus.FAILED.value
    if any(s == StepStatus.IN_PROGRESS.value for s in statuses):
        return StepStatus.IN_PROGRESS.value
    return StepStatus.PENDING.value
