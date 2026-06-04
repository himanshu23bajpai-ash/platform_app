import secrets

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse

from app.auth import azure_ad
from app.auth.deps import current_user
from app.config import get_settings

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
def callback(request: Request, code: str = "", state: str = ""):
    if get_settings().auth_disabled:
        return RedirectResponse(get_settings().azure_post_login_redirect)
    expected_state = request.session.pop("oauth_state", None)
    if not expected_state or expected_state != state:
        raise HTTPException(400, "Invalid OAuth state")
    if not code:
        raise HTTPException(400, "Missing code")
    result = azure_ad.exchange_code(code)
    claims = result.get("id_token_claims") or {}
    request.session["user"] = azure_ad.user_from_claims(claims)
    return RedirectResponse(get_settings().azure_post_login_redirect)


@router.get("/me")
def me(user: dict = Depends(current_user)):
    return user


@router.post("/logout")
def logout(request: Request):
    request.session.clear()
    return {"ok": True}
