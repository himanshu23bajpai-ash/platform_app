from pydantic import BaseModel


class ActivityMetrics(BaseModel):
    active_users: int
    deployments_7d: int
    active_errors: int
    commits_30d: int


class RequestPoint(BaseModel):
    hour: str  # "00:00"
    requests: int
    errors: int


class Deployment(BaseModel):
    version: str
    environment: str
    status: str  # success | failed | running
    when: str  # ISO


class ActiveError(BaseModel):
    code: str
    severity: str  # high | medium | low
    message: str
    occurrences: int
    first_seen: str


class ActivityOverview(BaseModel):
    metrics: ActivityMetrics
    requests_24h: list[RequestPoint]
    deployments: list[Deployment]
    errors: list[ActiveError]
