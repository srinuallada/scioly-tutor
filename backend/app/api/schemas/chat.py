from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    student_name: str = Field("default", max_length=50, pattern=r"^[a-zA-Z0-9_-]+$")
    conversation_history: list[dict] = Field(default=[], max_length=20)


class ChatResponse(BaseModel):
    response: str
    intent: str
    sources_used: int
    topics_referenced: list[str] = []
    quiz_data: dict | None = None
