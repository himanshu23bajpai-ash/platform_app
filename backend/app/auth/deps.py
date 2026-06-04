from fastapi import HTTPException, Request, status

from app.config import get_settings


def current_user(request: Request) -> dict:
    settings = get_settings()
    if settings.auth_disabled:
        return {"email": "dev@local", "name": "Local Dev", "oid": "dev"}

    user = request.session.get("user")
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return user
