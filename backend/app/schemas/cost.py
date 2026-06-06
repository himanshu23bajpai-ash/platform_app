from pydantic import BaseModel


class CostBreakdownItem(BaseModel):
    service: str
    amount_usd: float


class CostPeriod(BaseModel):
    month: str  # "YYYY-MM"
    amount_usd: float


class ProjectCost(BaseModel):
    project_id: str
    project_name: str
    currency: str = "USD"
    total_current_month_usd: float
    total_last_month_usd: float
    breakdown: list[CostBreakdownItem]
    last_6_months: list[CostPeriod]


class CostMatrixRow(BaseModel):
    project_id: str
    project_name: str
    current_month_usd: float
    last_month_usd: float
    trend_pct: float  # (current - last) / last * 100
