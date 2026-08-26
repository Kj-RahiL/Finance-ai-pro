from __future__ import annotations

from pydantic import BaseModel, ConfigDict

from app.models.category import CategoryType


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    type: CategoryType
    icon: str
