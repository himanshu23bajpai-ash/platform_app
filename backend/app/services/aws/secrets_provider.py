from typing import Protocol

import boto3

from app.models.project import Project
from app.schemas.secret import SecretSummary, SecretValue


def _secret_name(project: Project, key: str) -> str:
    return f"platform/{project.name}/{key}"


def _prefix(project: Project) -> str:
    return f"platform/{project.name}/"


class SecretsProvider(Protocol):
    def list_secrets(self, project: Project) -> list[SecretSummary]: ...
    def get_secret(self, project: Project, key: str) -> SecretValue: ...
    def put_secret(self, project: Project, key: str, value: str, description: str = "") -> SecretSummary: ...
    def delete_secret(self, project: Project, key: str) -> None: ...


class MockSecretsProvider:
    """In-memory secrets store, partitioned by project id."""

    def __init__(self):
        self._store: dict[str, dict[str, dict[str, str]]] = {}

    def _bucket(self, project: Project) -> dict[str, dict[str, str]]:
        return self._store.setdefault(project.id, {})

    def list_secrets(self, project: Project) -> list[SecretSummary]:
        bucket = self._bucket(project)
        return [
            SecretSummary(
                name=k,
                arn=f"arn:aws:secretsmanager:mock::secret:{_secret_name(project, k)}",
                description=v.get("description", ""),
                last_changed=v.get("last_changed"),
            )
            for k, v in bucket.items()
        ]

    def get_secret(self, project: Project, key: str) -> SecretValue:
        bucket = self._bucket(project)
        if key not in bucket:
            raise KeyError(key)
        return SecretValue(name=key, value=bucket[key]["value"])

    def put_secret(
        self, project: Project, key: str, value: str, description: str = ""
    ) -> SecretSummary:
        from datetime import datetime

        bucket = self._bucket(project)
        bucket[key] = {
            "value": value,
            "description": description,
            "last_changed": datetime.utcnow().isoformat(),
        }
        return SecretSummary(
            name=key,
            arn=f"arn:aws:secretsmanager:mock::secret:{_secret_name(project, key)}",
            description=description,
            last_changed=bucket[key]["last_changed"],
        )

    def delete_secret(self, project: Project, key: str) -> None:
        self._bucket(project).pop(key, None)


class BotoSecretsProvider:
    def _client(self, project: Project):
        return boto3.client("secretsmanager", region_name=project.aws_region or "us-east-1")

    def list_secrets(self, project: Project) -> list[SecretSummary]:
        client = self._client(project)
        out: list[SecretSummary] = []
        paginator = client.get_paginator("list_secrets")
        for page in paginator.paginate(
            Filters=[{"Key": "name", "Values": [_prefix(project)]}]
        ):
            for s in page.get("SecretList", []):
                short = s["Name"].removeprefix(_prefix(project))
                out.append(
                    SecretSummary(
                        name=short,
                        arn=s.get("ARN", ""),
                        description=s.get("Description", ""),
                        last_changed=s["LastChangedDate"].isoformat()
                        if s.get("LastChangedDate")
                        else None,
                    )
                )
        return out

    def get_secret(self, project: Project, key: str) -> SecretValue:
        client = self._client(project)
        resp = client.get_secret_value(SecretId=_secret_name(project, key))
        return SecretValue(name=key, value=resp.get("SecretString", ""))

    def put_secret(
        self, project: Project, key: str, value: str, description: str = ""
    ) -> SecretSummary:
        client = self._client(project)
        full = _secret_name(project, key)
        try:
            resp = client.create_secret(
                Name=full,
                SecretString=value,
                Description=description,
                Tags=[{"Key": "Project", "Value": project.name}],
            )
            arn = resp["ARN"]
        except client.exceptions.ResourceExistsException:
            client.put_secret_value(SecretId=full, SecretString=value)
            if description:
                client.update_secret(SecretId=full, Description=description)
            arn = client.describe_secret(SecretId=full)["ARN"]
        return SecretSummary(name=key, arn=arn, description=description)

    def delete_secret(self, project: Project, key: str) -> None:
        client = self._client(project)
        client.delete_secret(
            SecretId=_secret_name(project, key), ForceDeleteWithoutRecovery=True
        )
