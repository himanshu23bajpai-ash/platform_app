"""Deterministic mock data for the AI and Application Activity dashboards.

Real implementations would pull SageMaker / Bedrock / model registry metadata for AI,
and CloudWatch / observability data for Activity. For v1 these are seeded by
project id so each project gets stable, realistic-looking numbers.
"""
import hashlib
from datetime import datetime, timedelta

from app.models.project import Project
from app.schemas.activity import (
    ActiveError,
    ActivityMetrics,
    ActivityOverview,
    Deployment,
    RequestPoint,
)
from app.schemas.ai import AiMetrics, AiModel, AiOverview, TrainingJob


def _rng(project: Project) -> int:
    return int(hashlib.sha256(project.id.encode()).hexdigest(), 16)


def _pick(seed: int, options: list[str]) -> str:
    return options[seed % len(options)]


# ---------- AI ----------

MODEL_NAMES = [
    ("Product Recommendation Engine", "recommendation-engine-v2"),
    ("Fraud Detection Model", "fraud-detector"),
    ("Customer Sentiment Analysis", "sentiment-analyzer"),
    ("Demand Forecasting", "demand-forecaster"),
    ("Image Classifier", "image-classifier"),
    ("Search Reranker", "search-reranker"),
]


def ai_overview(project: Project) -> AiOverview:
    seed = _rng(project)

    active_models = 2 + (seed % 3)  # 2-4
    predictions = 5_000 + (seed % 80_000)
    latency = 20 + (seed % 80)
    err = round(0.5 + (seed % 30) / 10, 2)

    metrics = AiMetrics(
        active_models=active_models,
        predictions_today=predictions,
        avg_latency_ms=latency,
        error_rate_pct=err,
    )

    today = datetime.utcnow().date()
    models: list[AiModel] = []
    for i in range(active_models):
        display, _ = MODEL_NAMES[(seed >> (i * 3)) % len(MODEL_NAMES)]
        version = f"{1 + (seed >> i) % 3}.{(seed >> (i + 2)) % 6}.{(seed >> (i + 4)) % 4}"
        trained = today - timedelta(days=(seed >> (i * 2)) % 14)
        accuracy = round(85 + ((seed >> (i * 5)) % 1500) / 100, 1)
        status = "training" if i == active_models - 1 and seed % 3 == 0 else "deployed"
        models.append(
            AiModel(
                id=f"mdl-{(seed >> (i * 7)) & 0xFFFF:04x}",
                name=display,
                version=f"v{version}",
                last_trained=trained.isoformat(),
                accuracy_pct=accuracy,
                status=status,
            )
        )

    jobs: list[TrainingJob] = []
    states = ["completed", "running", "queued"]
    for i in range(3):
        _, job_slug = MODEL_NAMES[(seed >> (i * 4 + 1)) % len(MODEL_NAMES)]
        st = states[(seed >> (i * 5)) % len(states)]
        if st == "completed":
            jobs.append(
                TrainingJob(
                    id=f"job-{i + 1:03d}",
                    name=job_slug,
                    status=st,
                    duration=f"{1 + (seed >> i) % 4}h {((seed >> (i + 1)) % 60):02d}m",
                )
            )
        elif st == "running":
            jobs.append(
                TrainingJob(
                    id=f"job-{i + 1:03d}",
                    name=job_slug,
                    status=st,
                    progress_pct=20 + (seed >> (i + 3)) % 70,
                )
            )
        else:
            jobs.append(TrainingJob(id=f"job-{i + 1:03d}", name=job_slug, status=st))

    return AiOverview(metrics=metrics, models=models, jobs=jobs)


# ---------- Application Activity ----------

ENVIRONMENTS = ["production", "staging", "production", "development"]
SEVERITIES = ["high", "medium", "low"]
ERROR_MESSAGES = [
    "Database connection timeout",
    "Invalid API response format",
    "Rate limit exceeded",
    "Memory allocation failed",
    "Auth token expired",
    "Upstream service unavailable",
]


def activity_overview(project: Project) -> ActivityOverview:
    seed = _rng(project)

    metrics = ActivityMetrics(
        active_users=200 + (seed % 5000),
        deployments_7d=2 + (seed % 12),
        active_errors=5 + (seed % 40),
        commits_30d=30 + (seed % 250),
    )

    # 24h request volume — smooth wave centered around afternoon
    points: list[RequestPoint] = []
    base = 800 + (seed % 1500)
    for h in range(0, 24, 4):
        # Skew curve so afternoon (12-16) is busiest, low overnight
        skew = max(0.2, 1.0 - abs(h - 14) / 10)
        wobble = ((seed >> h) & 0xFF) / 255 * 0.5 + 0.75
        req = int(base * skew * wobble * 3)
        err = int(req * (0.01 + ((seed >> (h * 2)) % 30) / 1500))
        points.append(RequestPoint(hour=f"{h:02d}:00", requests=req, errors=err))

    # Recent deployments
    now = datetime.utcnow()
    deployments: list[Deployment] = []
    for i in range(4):
        ver = f"v{2 + (seed >> i) % 3}.{(seed >> (i + 3)) % 6}.{i}"
        env = ENVIRONMENTS[(seed >> (i * 2)) % len(ENVIRONMENTS)]
        status = "failed" if i == 3 and seed % 4 == 0 else "success"
        when = (now - timedelta(hours=i * 14 + (seed >> i) % 6)).isoformat(timespec="minutes")
        deployments.append(Deployment(version=ver, environment=env, status=status, when=when))

    # Active errors
    errors: list[ActiveError] = []
    for i in range(4):
        msg = ERROR_MESSAGES[(seed >> (i * 3)) % len(ERROR_MESSAGES)]
        sev = SEVERITIES[(seed >> (i * 4)) % len(SEVERITIES)]
        occ = 1 + (seed >> i) % 50
        first_seen = (now - timedelta(hours=(seed >> i) % 36 + 1)).isoformat(timespec="minutes")
        errors.append(
            ActiveError(
                code=f"ERR-{1230 + i:04d}",
                severity=sev,
                message=msg,
                occurrences=occ,
                first_seen=first_seen,
            )
        )

    return ActivityOverview(
        metrics=metrics, requests_24h=points, deployments=deployments, errors=errors
    )
