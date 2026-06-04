from functools import lru_cache

import boto3

from app.config import get_settings
from app.services.aws.base import AwsProvider
from app.services.aws.boto_provider import BotoAwsProvider
from app.services.aws.mock_provider import MockAwsProvider


def _have_aws_credentials() -> bool:
    try:
        creds = boto3.Session().get_credentials()
        return creds is not None
    except Exception:  # noqa: BLE001
        return False


@lru_cache
def get_aws_provider() -> AwsProvider:
    settings = get_settings()
    mode = settings.aws_mode
    if mode == "real":
        return BotoAwsProvider(region=settings.aws_region)
    if mode == "mock":
        return MockAwsProvider()
    # auto
    if _have_aws_credentials():
        return BotoAwsProvider(region=settings.aws_region)
    return MockAwsProvider()
