from functools import lru_cache

import boto3

from app.config import get_settings
from app.services.aws.base import AwsProvider
from app.services.aws.boto_provider import BotoAwsProvider
from app.services.aws.cost_provider import BotoCostProvider, CostProvider, MockCostProvider
from app.services.aws.mock_provider import MockAwsProvider
from app.services.aws.secrets_provider import (
    BotoSecretsProvider,
    MockSecretsProvider,
    SecretsProvider,
)


def _have_aws_credentials() -> bool:
    try:
        creds = boto3.Session().get_credentials()
        return creds is not None
    except Exception:  # noqa: BLE001
        return False


def _use_real() -> bool:
    mode = get_settings().aws_mode
    if mode == "real":
        return True
    if mode == "mock":
        return False
    return _have_aws_credentials()


@lru_cache
def get_aws_provider() -> AwsProvider:
    if _use_real():
        return BotoAwsProvider(region=get_settings().aws_region)
    return MockAwsProvider()


@lru_cache
def get_secrets_provider() -> SecretsProvider:
    if _use_real():
        return BotoSecretsProvider()
    return MockSecretsProvider()


@lru_cache
def get_cost_provider() -> CostProvider:
    if _use_real():
        return BotoCostProvider()
    return MockCostProvider()
