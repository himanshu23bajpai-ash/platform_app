from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.deps import current_user, require_admin
from app.db import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.post("", response_model=UserOut, status_code=201)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(409, f"User '{payload.email}' already exists")
    user = User(**payload.model_dump())
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    return user


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: str,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    actor: User = Depends(require_admin),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    data = payload.model_dump(exclude_unset=True)
    # Don't let an admin demote/disable themselves and lock themselves out.
    if user.id == actor.id:
        if data.get("role") and data["role"] != "ADMIN":
            raise HTTPException(400, "Cannot demote yourself")
        if data.get("is_active") is False:
            raise HTTPException(400, "Cannot disable yourself")
    for field, value in data.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    actor: User = Depends(require_admin),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    if user.id == actor.id:
        raise HTTPException(400, "Cannot delete yourself")
    db.delete(user)
    db.commit()


@router.get("/me/assignments", response_model=list[str])
def my_assignments(user: User = Depends(current_user)):
    """Return project IDs the current user is assigned to (admin gets all via wildcard '*')."""
    if user.role == "ADMIN":
        return ["*"]
    return [a.project_id for a in user.assignments]
