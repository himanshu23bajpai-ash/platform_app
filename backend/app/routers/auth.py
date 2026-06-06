import secrets

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.auth import azure_ad
from app.auth.deps import _get_or_create_user, current_user
from app.config import get_settings
from app.db import get_db
from app.models.user import User
from app.schemas.user import UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/login")
def login(request: Request):
    if get_settings().auth_disabled:
        return RedirectResponse(get_settings().azure_post_login_redirect)
    if not azure_ad.is_configured():
        raise HTTPException(500, "Azure AD not configured")
    state = secrets.token_urlsafe(16)
    request.session["oauth_state"] = state
    return RedirectResponse(azure_ad.build_auth_url(state))


@router.get("/callback")
def callback(
    request: Request,
    code: str = "",
    state: str = "",
    db: Session = Depends(get_db),
):
    if get_settings().auth_disabled:
        return RedirectResponse(get_settings().azure_post_login_redirect)
    expected_state = request.session.pop("oauth_state", None)
    if not expected_state or expected_state != state:
        raise HTTPException(400, "Invalid OAuth state")
    if not code:
        raise HTTPException(400, "Missing code")
    result = azure_ad.exchange_code(code)
    claims = result.get("id_token_claims") or {}
    profile = azure_ad.user_from_claims(claims)
    if not profile.get("email"):
        raise HTTPException(400, "Azure AD response missing email/UPN")

    user = _get_or_create_user(
        db, email=profile["email"], name=profile["name"], azure_oid=profile["oid"]
    )
    if not user.is_active:
        raise HTTPException(403, "User is disabled")
    request.session["user"] = {"email": user.email}
    return RedirectResponse(get_settings().azure_post_login_redirect)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(current_user)):
    return user


@router.post("/logout")
def logout(request: Request):
    request.session.clear()
    return {"ok": True}
