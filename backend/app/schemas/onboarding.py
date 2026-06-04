from datetime import datetime

from pydantic import BaseModel, ConfigDict


class OnboardingStepOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    step: str
    status: str
    order_index: int
    started_at: datetime | None
    completed_at: datetime | None
    message: str
