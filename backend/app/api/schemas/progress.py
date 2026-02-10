from pydantic import BaseModel


class ProgressResponse(BaseModel):
    student_id: str
    overall: dict
    by_topic: list[dict]
    weak_areas: list[str]
    recent_activity: list[dict]
