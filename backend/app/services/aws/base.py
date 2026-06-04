from typing import Protocol

from app.models.project import Project
from app.schemas.aws import ComputeResource, DatabaseResource, S3Resource


class AwsProvider(Protocol):
    def list_compute(self, project: Project) -> list[ComputeResource]: ...
    def list_databases(self, project: Project) -> list[DatabaseResource]: ...
    def list_s3(self, project: Project) -> list[S3Resource]: ...
