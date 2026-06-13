"""Validate Azure AD ID tokens received as `Authorization: Bearer <token>`.

Used when the frontend (a SPA) authenticates the user directly with Azure AD
via MSAL.js and sends the resulting ID token to the API. The backend verifies
the signature against Azure AD's JWKS, plus issuer + audience claims, then
maps the token onto a local User row.
"""
from __future__ import annotations

import time
from threading import Lock

import httpx
from jose import jwt
from jose.exceptions import JWTError

from app.config import get_settings

_JWKS_TTL_SECONDS = 3600

_jwks_cache: dict[str, dict] = {}
_jwks_fetched_at: dict[str, float] = {}
_jwks_lock = Lock()


def _jwks_url(tenant: str) -> str:
    return f"https://login.microsoftonline.com/{tenant}/discovery/v2.0/keys"


def _issuer(tenant: str) -> str:
    return f"https://login.microsoftonline.com/{tenant}/v2.0"


def _get_jwks(tenant: str) -> dict:
    now = time.time()
    cached_at = _jwks_fetched_at.get(tenant, 0)
    if tenant in _jwks_cache and (now - cached_at) < _JWKS_TTL_SECONDS:
        return _jwks_cache[tenant]
    with _jwks_lock:
        cached_at = _jwks_fetched_at.get(tenant, 0)
        if tenant in _jwks_cache and (now - cached_at) < _JWKS_TTL_SECONDS:
            return _jwks_cache[tenant]
        resp = httpx.get(_jwks_url(tenant), timeout=5.0)
        resp.raise_for_status()
        jwks = resp.json()
        _jwks_cache[tenant] = jwks
        _jwks_fetched_at[tenant] = now
        return jwks


def _find_key(jwks: dict, kid: str) -> dict | None:
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return key
    return None


class TokenError(ValueError):
    """Raised when the ID token can't be validated."""


def validate_id_token(token: str) -> dict:
    """Return the verified claims for an Azure AD ID token.

    Raises TokenError if the token is invalid, expired, signed with an
    unknown key, or addressed to a different audience / issuer.
    """
    settings = get_settings()
    tenant = settings.azure_tenant_id
    client_id = settings.azure_client_id
    if not tenant or not client_id:
        raise TokenError("Azure AD not configured (tenant/client_id missing)")

    try:
        headers = jwt.get_unverified_header(token)
    except JWTError as e:
        raise TokenError(f"Malformed token: {e}") from e

    kid = headers.get("kid")
    if not kid:
        raise TokenError("Token missing 'kid' header")

    jwks = _get_jwks(tenant)
    key = _find_key(jwks, kid)
    if not key:
        # Force a refresh in case keys rotated.
        with _jwks_lock:
            _jwks_fetched_at.pop(tenant, None)
        jwks = _get_jwks(tenant)
        key = _find_key(jwks, kid)
    if not key:
        raise TokenError(f"Unknown signing key 'kid={kid}'")

    try:
        claims = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience=client_id,
            issuer=_issuer(tenant),
            options={"verify_at_hash": False},
        )
    except JWTError as e:
        raise TokenError(str(e)) from e

    return claims
