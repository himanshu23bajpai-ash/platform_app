import hashlib
from datetime import date, timedelta
from typing import Protocol

import boto3

from app.models.project import Project
from app.schemas.cost import CostBreakdownItem, CostPeriod, ProjectCost

SERVICES = ["EC2", "RDS", "S3", "Lambda", "DynamoDB", "ECS/EKS", "CloudWatch"]


def _seed(project: Project) -> int:
    return int(hashlib.sha256(project.id.encode()).hexdigest(), 16)


class CostProvider(Protocol):
    def project_cost(self, project: Project) -> ProjectCost: ...


class MockCostProvider:
    def project_cost(self, project: Project) -> ProjectCost:
        seed = _seed(project)
        base = 200 + (seed % 5000)  # baseline 200-5200 USD
        multiplier = {"ecs": 1.0, "eks": 1.4, "lambda": 0.4}.get(project.compute_type, 1.0)

        breakdown = []
        remaining = float(base) * multiplier
        for i, svc in enumerate(SERVICES):
            share = ((seed >> (i * 4)) & 0xFF) / 255 * 0.3 + 0.05  # 5-35% share
            amt = round(remaining * share, 2)
            remaining -= amt
            if remaining < 0:
                remaining = 0
            breakdown.append(CostBreakdownItem(service=svc, amount_usd=amt))
        total_current = round(sum(b.amount_usd for b in breakdown), 2)
        total_last = round(total_current * (0.85 + ((seed >> 12) & 0xFF) / 255 * 0.3), 2)

        # 6 months trailing
        today = date.today().replace(day=1)
        months: list[CostPeriod] = []
        for n in range(6, 0, -1):
            m = today - timedelta(days=30 * n)
            wobble = ((seed >> (n * 3)) & 0xFF) / 255 * 0.4 + 0.8  # 0.8-1.2x
            months.append(
                CostPeriod(month=m.strftime("%Y-%m"), amount_usd=round(total_current * wobble, 2))
            )

        return ProjectCost(
            project_id=project.id,
            project_name=project.name,
            total_current_month_usd=total_current,
            total_last_month_usd=total_last,
            breakdown=breakdown,
            last_6_months=months,
        )


class BotoCostProvider:
    def project_cost(self, project: Project) -> ProjectCost:
        client = boto3.client("ce", region_name="us-east-1")  # ce is global
        today = date.today()
        start_curr = today.replace(day=1)
        # last full month
        last_end = start_curr
        start_last = (last_end - timedelta(days=1)).replace(day=1)
        # 6-month trail
        start_6 = (start_curr - timedelta(days=185)).replace(day=1)

        tag_filter = {"Tags": {"Key": "Project", "Values": [project.name]}}

        breakdown_resp = client.get_cost_and_usage(
            TimePeriod={"Start": start_curr.isoformat(), "End": today.isoformat()},
            Granularity="MONTHLY",
            Metrics=["UnblendedCost"],
            GroupBy=[{"Type": "DIMENSION", "Key": "SERVICE"}],
            Filter=tag_filter,
        )
        breakdown = []
        for r in breakdown_resp.get("ResultsByTime", []):
            for g in r.get("Groups", []):
                amount = float(g["Metrics"]["UnblendedCost"]["Amount"])
                if amount > 0:
                    breakdown.append(
                        CostBreakdownItem(service=g["Keys"][0], amount_usd=round(amount, 2))
                    )
        total_curr = round(sum(b.amount_usd for b in breakdown), 2)

        last_resp = client.get_cost_and_usage(
            TimePeriod={"Start": start_last.isoformat(), "End": last_end.isoformat()},
            Granularity="MONTHLY",
            Metrics=["UnblendedCost"],
            Filter=tag_filter,
        )
        total_last = 0.0
        for r in last_resp.get("ResultsByTime", []):
            total_last += float(r["Total"]["UnblendedCost"]["Amount"])
        total_last = round(total_last, 2)

        trail_resp = client.get_cost_and_usage(
            TimePeriod={"Start": start_6.isoformat(), "End": start_curr.isoformat()},
            Granularity="MONTHLY",
            Metrics=["UnblendedCost"],
            Filter=tag_filter,
        )
        months = []
        for r in trail_resp.get("ResultsByTime", []):
            months.append(
                CostPeriod(
                    month=r["TimePeriod"]["Start"][:7],
                    amount_usd=round(float(r["Total"]["UnblendedCost"]["Amount"]), 2),
                )
            )

        return ProjectCost(
            project_id=project.id,
            project_name=project.name,
            total_current_month_usd=total_curr,
            total_last_month_usd=total_last,
            breakdown=breakdown,
            last_6_months=months,
        )
