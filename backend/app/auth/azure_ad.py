from urllib.parse import urlencode

import msal

from app.config import get_settings

AUTHORITY_TEMPLATE = "https://login.microsoftonline.com/{tenant}"
SCOPES = ["User.Read"]


def _settings():
    return get_settings()


def is_configured() -> bool:
    s = _settings()
    return bool(s.azure_tenant_id and s.azure_client_id and s.azure_client_secret)


def _msal_app() -> msal.ConfidentialClientApplication:
    s = _settings()
    return msal.ConfidentialClientApplication(
        client_id=s.azure_client_id,
        client_credential=s.azure_client_secret,
        authority=AUTHORITY_TEMPLATE.format(tenant=s.azure_tenant_id),
    )


def build_auth_url(state: str) -> str:
    s = _settings()
    return _msal_app().get_authorization_request_url(
        scopes=SCOPES,
        state=state,
        redirect_uri=s.azure_redirect_uri,
    )


def exchange_code(code: str) -> dict:
    s = _settings()
    result = _msal_app().acquire_token_by_authorization_code(
        code=code,
        scopes=SCOPES,
        redirect_uri=s.azure_redirect_uri,
    )
    if "error" in result:
        raise RuntimeError(f"Azure AD token exchange failed: {result.get('error_description')}")
    return result


def user_from_claims(claims: dict) -> dict:
    return {
        "email": claims.get("preferred_username") or claims.get("email") or "",
        "name": claims.get("name") or "",
        "oid": claims.get("oid") or "",
    }


def post_login_redirect_with(params: dict) -> str:
    base = _settings().azure_post_login_redirect
    sep = "&" if "?" in base else "?"
    return f"{base}{sep}{urlencode(params)}"
