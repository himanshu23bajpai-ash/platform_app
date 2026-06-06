from pydantic import BaseModel


class AiMetrics(BaseModel):
    active_models: int
    predictions_today: int
    avg_latency_ms: int
    error_rate_pct: float


class AiModel(BaseModel):
    id: str
    name: str
    version: str
    last_trained: str  # YYYY-MM-DD
    accuracy_pct: float
    status: str  # deployed | training | retired


class TrainingJob(BaseModel):
    id: str
    name: str
    status: str  # completed | running | failed | queued
    duration: str | None = None
    progress_pct: int | None = None


class AiOverview(BaseModel):
    metrics: AiMetrics
    models: list[AiModel]
    jobs: list[TrainingJob]
