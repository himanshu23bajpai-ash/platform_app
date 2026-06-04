import boto3

from app.models.project import Project
from app.schemas.aws import ComputeResource, DatabaseResource, S3Resource

PROJECT_TAG_KEY = "Project"


def _has_project_tag(tags: list[dict], project_name: str) -> bool:
    return any(
        (t.get("Key") == PROJECT_TAG_KEY or t.get("key") == PROJECT_TAG_KEY)
        and (t.get("Value") == project_name or t.get("value") == project_name)
        for t in (tags or [])
    )


class BotoAwsProvider:
    def __init__(self, region: str | None = None):
        self._region = region

    def _client(self, service: str, project: Project):
        region = project.aws_region or self._region
        return boto3.client(service, region_name=region)

    def list_compute(self, project: Project) -> list[ComputeResource]:
        out: list[ComputeResource] = []
        region = project.aws_region or self._region or "us-east-1"

        # EC2 — filter by Project tag
        try:
            ec2 = self._client("ec2", project)
            resp = ec2.describe_instances(
                Filters=[{"Name": f"tag:{PROJECT_TAG_KEY}", "Values": [project.name]}]
            )
            for reservation in resp.get("Reservations", []):
                for inst in reservation.get("Instances", []):
                    name = next(
                        (t["Value"] for t in inst.get("Tags", []) if t.get("Key") == "Name"),
                        inst["InstanceId"],
                    )
                    out.append(
                        ComputeResource(
                            kind="ec2",
                            id=inst["InstanceId"],
                            name=name,
                            status=inst.get("State", {}).get("Name", "unknown"),
                            region=region,
                            details={"instance_type": inst.get("InstanceType", "")},
                        )
                    )
        except Exception as e:  # noqa: BLE001
            out.append(
                ComputeResource(
                    kind="ec2", id="error", name="(ec2 list failed)", status=str(e)[:120], region=region
                )
            )

        # ECS — list clusters and services, filter clusters by tag
        try:
            ecs = self._client("ecs", project)
            clusters = ecs.list_clusters().get("clusterArns", [])
            for cluster_arn in clusters:
                tags = ecs.list_tags_for_resource(resourceArn=cluster_arn).get("tags", [])
                if not _has_project_tag(tags, project.name):
                    continue
                services = ecs.list_services(cluster=cluster_arn).get("serviceArns", [])
                if services:
                    desc = ecs.describe_services(cluster=cluster_arn, services=services)
                    for svc in desc.get("services", []):
                        out.append(
                            ComputeResource(
                                kind="ecs_service",
                                id=svc["serviceArn"],
                                name=svc["serviceName"],
                                status=svc.get("status", "unknown"),
                                region=region,
                                details={
                                    "desired": svc.get("desiredCount", 0),
                                    "running": svc.get("runningCount", 0),
                                },
                            )
                        )
        except Exception:  # noqa: BLE001
            pass

        # EKS
        try:
            eks = self._client("eks", project)
            for cluster_name in eks.list_clusters().get("clusters", []):
                desc = eks.describe_cluster(name=cluster_name).get("cluster", {})
                tags = [{"Key": k, "Value": v} for k, v in (desc.get("tags") or {}).items()]
                if not _has_project_tag(tags, project.name):
                    continue
                out.append(
                    ComputeResource(
                        kind="eks_cluster",
                        id=desc.get("arn", cluster_name),
                        name=cluster_name,
                        status=desc.get("status", "unknown"),
                        region=region,
                        details={"version": desc.get("version", "")},
                    )
                )
        except Exception:  # noqa: BLE001
            pass

        # Lambda
        try:
            lam = self._client("lambda", project)
            for fn in lam.list_functions().get("Functions", []):
                arn = fn["FunctionArn"]
                tags = lam.list_tags(Resource=arn).get("Tags", {})
                if tags.get(PROJECT_TAG_KEY) != project.name:
                    continue
                out.append(
                    ComputeResource(
                        kind="lambda",
                        id=arn,
                        name=fn["FunctionName"],
                        status="Active",
                        region=region,
                        details={"runtime": fn.get("Runtime", ""), "memory_mb": fn.get("MemorySize", 0)},
                    )
                )
        except Exception:  # noqa: BLE001
            pass

        return out

    def list_databases(self, project: Project) -> list[DatabaseResource]:
        out: list[DatabaseResource] = []
        region = project.aws_region or self._region or "us-east-1"

        try:
            rds = self._client("rds", project)
            for db in rds.describe_db_instances().get("DBInstances", []):
                arn = db["DBInstanceArn"]
                tags = rds.list_tags_for_resource(ResourceName=arn).get("TagList", [])
                if not _has_project_tag(tags, project.name):
                    continue
                out.append(
                    DatabaseResource(
                        kind="rds",
                        id=arn,
                        name=db["DBInstanceIdentifier"],
                        engine=db.get("Engine", ""),
                        status=db.get("DBInstanceStatus", "unknown"),
                        region=region,
                        details={"instance_class": db.get("DBInstanceClass", "")},
                    )
                )
        except Exception:  # noqa: BLE001
            pass

        try:
            ddb = self._client("dynamodb", project)
            for table_name in ddb.list_tables().get("TableNames", []):
                desc = ddb.describe_table(TableName=table_name).get("Table", {})
                arn = desc.get("TableArn")
                tags = ddb.list_tags_of_resource(ResourceArn=arn).get("Tags", [])
                if not _has_project_tag(tags, project.name):
                    continue
                out.append(
                    DatabaseResource(
                        kind="dynamodb",
                        id=arn,
                        name=table_name,
                        engine="dynamodb",
                        status=desc.get("TableStatus", "unknown"),
                        region=region,
                        details={"item_count": desc.get("ItemCount", 0)},
                    )
                )
        except Exception:  # noqa: BLE001
            pass

        return out

    def list_s3(self, project: Project) -> list[S3Resource]:
        out: list[S3Resource] = []
        region = project.aws_region or self._region or "us-east-1"
        try:
            s3 = boto3.client("s3", region_name=region)
            for b in s3.list_buckets().get("Buckets", []):
                try:
                    tagging = s3.get_bucket_tagging(Bucket=b["Name"]).get("TagSet", [])
                except Exception:  # noqa: BLE001
                    continue
                if not _has_project_tag(tagging, project.name):
                    continue
                out.append(
                    S3Resource(
                        name=b["Name"],
                        region=region,
                        created_at=b.get("CreationDate").isoformat() if b.get("CreationDate") else None,
                    )
                )
        except Exception:  # noqa: BLE001
            pass
        return out
