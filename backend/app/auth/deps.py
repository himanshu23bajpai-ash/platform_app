from fastapi import Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.auth.jwt_validator import TokenError, validate_id_token
from app.config import get_settings
from app.db import get_db
from app.models.project_assignment import ProjectAssignment
from app.models.user import Role, User


def _admin_emails() -> set[str]:
    raw = get_settings().admin_emails or ""
    return {e.strip().lower() for e in raw.split(",") if e.strip()}


def _get_or_create_user(db: Session, *, email: str, name: str, azure_oid: str = "") -> User:
    user = db.query(User).filter(User.email == email).first()
    if user:
        # keep azure_oid + name in sync on each login
        changed = False
        if azure_oid and user.azure_oid != azure_oid:
            user.azure_oid = azure_oid
            changed = True
        if name and user.name != name:
            user.name = name
            changed = True
        if email.lower() in _admin_emails() and user.role != Role.ADMIN.value:
            user.role = Role.ADMIN.value
            changed = True
        if changed:
            db.commit()
            db.refresh(user)
        return user
    role = Role.ADMIN.value if email.lower() in _admin_emails() else Role.PROJECT_VIEWER.value
    user = User(email=email, name=name, role=role, azure_oid=azure_oid)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _claims_to_profile(claims: dict) -> dict:
    return {
        "email": (claims.get("preferred_username") or claims.get("email") or "").strip(),
        "name": claims.get("name") or "",
        "oid": claims.get("oid") or "",
    }


def current_user(
    request: Request,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    settings = get_settings()
    if settings.auth_disabled:
        return _get_or_create_user(
            db, email=settings.dev_user_email, name=settings.dev_user_name
        )

    # 1. Bearer token from the SPA (MSAL.js)
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
        try:
            claims = validate_id_token(token)
        except TokenError as e:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"Invalid token: {e}") from e
        profile = _claims_to_profile(claims)
        if not profile["email"]:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token missing email/UPN")
        user = _get_or_create_user(
            db, email=profile["email"], name=profile["name"], azure_oid=profile["oid"]
        )
        if not user.is_active:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "User is disabled")
        return user

    # 2. Server-side OAuth code flow (cookie session)
    session_user = request.session.get("user")
    if not session_user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    user = db.query(User).filter(User.email == session_user["email"]).first()
    if not user:
        request.session.clear()
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "User is disabled")
    return user


def require_admin(user: User = Depends(current_user)) -> User:
    if user.role != Role.ADMIN.value:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin role required")
    return user


def is_assigned(db: Session, user: User, project_id: str) -> bool:
    if user.role == Role.ADMIN.value:
        return True
    return (
        db.query(ProjectAssignment)
        .filter(
            ProjectAssignment.user_id == user.id,
            ProjectAssignment.project_id == project_id,
        )
        .first()
        is not None
    )


def require_project_access(project_id: str, user: User, db: Session) -> None:
    if not is_assigned(db, user, project_id):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Project access denied")


def require_cost_access(project_id: str, user: User, db: Session) -> None:
    """Cost view: ADMIN or PROJECT_MANAGER assigned. Viewers explicitly excluded."""
    if user.role == Role.ADMIN.value:
        return
    if user.role != Role.PROJECT_MANAGER.value:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Cost view requires Manager or Admin")
    if not is_assigned(db, user, project_id):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Project access denied")
