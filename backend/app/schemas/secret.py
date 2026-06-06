from pydantic import BaseModel


class SecretSummary(BaseModel):
    name: str
    arn: str = ""
    description: str = ""
    last_changed: str | None = None


class SecretValue(BaseModel):
    name: str
    value: str


class SecretWrite(BaseModel):
    value: str
    description: str = ""
