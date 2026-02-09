from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    student_name: str = "default"
    conversation_history: list[dict] = []


class ChatResponse(BaseModel):
    response: str
    intent: str
    sources_used: int
    topics_referenced: list[str] = []
    quiz_data: dict | None = None
