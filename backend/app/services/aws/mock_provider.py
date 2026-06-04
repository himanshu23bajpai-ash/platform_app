import hashlib

from app.models.project import Project
from app.schemas.aws import ComputeResource, DatabaseResource, S3Resource


def _seed(project: Project) -> int:
    return int(hashlib.sha256(project.id.encode()).hexdigest(), 16) % 1000


class MockAwsProvider:
    def list_compute(self, project: Project) -> list[ComputeResource]:
        seed = _seed(project)
        region = project.aws_region or "us-east-1"
        if project.compute_type == "eks":
            return [
                ComputeResource(
                    kind="eks_cluster",
                    id=f"eks-{seed:03d}",
                    name=f"{project.name}-prod",
                    status="ACTIVE",
                    region=region,
                    details={"version": "1.29", "nodes": 3},
                ),
                ComputeResource(
                    kind="eks_cluster",
                    id=f"eks-{seed + 1:03d}",
                    name=f"{project.name}-staging",
                    status="ACTIVE",
                    region=region,
                    details={"version": "1.29", "nodes": 2},
                ),
            ]
        if project.compute_type == "lambda":
            return [
                ComputeResource(
                    kind="lambda",
                    id=f"fn-{seed:03d}",
                    name=f"{project.name}-handler",
                    status="Active",
                    region=region,
                    details={"runtime": "python3.11", "memory_mb": 512},
                ),
                ComputeResource(
                    kind="lambda",
                    id=f"fn-{seed + 1:03d}",
                    name=f"{project.name}-worker",
                    status="Active",
                    region=region,
                    details={"runtime": "python3.11", "memory_mb": 1024},
                ),
            ]
        # default: ECS service + a couple of EC2 nodes
        return [
            ComputeResource(
                kind="ecs_service",
                id=f"svc-{seed:03d}",
                name=f"{project.name}-api",
                status="ACTIVE",
                region=region,
                details={"desired": 2, "running": 2, "task_def": f"{project.name}-api:7"},
            ),
            ComputeResource(
                kind="ec2",
                id=f"i-0{seed:08x}",
                name=f"{project.name}-node-1",
                status="running",
                region=region,
                details={"instance_type": "t3.medium"},
            ),
            ComputeResource(
                kind="ec2",
                id=f"i-0{seed + 1:08x}",
                name=f"{project.name}-node-2",
                status="running",
                region=region,
                details={"instance_type": "t3.medium"},
            ),
        ]

    def list_databases(self, project: Project) -> list[DatabaseResource]:
        seed = _seed(project)
        region = project.aws_region or "us-east-1"
        return [
            DatabaseResource(
                kind="rds",
                id=f"db-{seed:03d}",
                name=f"{project.name}-primary",
                engine="postgres",
                status="available",
                region=region,
                details={"instance_class": "db.t3.medium", "storage_gb": 100},
            ),
            DatabaseResource(
                kind="dynamodb",
                id=f"ddb-{seed:03d}",
                name=f"{project.name}-events",
                engine="dynamodb",
                status="ACTIVE",
                region=region,
                details={"item_count": 1234, "size_bytes": 5_120_000},
            ),
        ]

    def list_s3(self, project: Project) -> list[S3Resource]:
        region = project.aws_region or "us-east-1"
        return [
            S3Resource(name=f"{project.name}-artifacts", region=region, created_at="2025-01-15T10:00:00Z"),
            S3Resource(name=f"{project.name}-logs", region=region, created_at="2025-01-15T10:00:05Z"),
        ]
