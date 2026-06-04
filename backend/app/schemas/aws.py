from pydantic import BaseModel


class ComputeResource(BaseModel):
    kind: str  # ec2 | ecs_service | eks_cluster | lambda
    id: str
    name: str
    status: str
    region: str
    details: dict = {}


class DatabaseResource(BaseModel):
    kind: str  # rds | dynamodb
    id: str
    name: str
    engine: str
    status: str
    region: str
    details: dict = {}


class S3Resource(BaseModel):
    name: str
    region: str
    created_at: str | None = None
