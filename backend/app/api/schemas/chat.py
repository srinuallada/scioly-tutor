from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    student_name: str = Field("default", max_length=50)
    conversation_history: list[dict] = Field(default=[], max_length=20)


class SourceDetail(BaseModel):
    source_file: str
    section_title: str
    source_type: str
    page_or_slide: int | None = None
    source_url: str | None = None


class ChatResponse(BaseModel):
    response: str
    intent: str
    sources_used: int
    topics_referenced: list[str] = []
    source_details: list[SourceDetail] = []
    quiz_data: dict | None = None
