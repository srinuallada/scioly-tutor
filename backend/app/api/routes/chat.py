from fastapi import APIRouter

from app.api.schemas.chat import ChatRequest, ChatResponse
from app.api.deps import search_engine
from app.services.chat_service import handle_chat

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Main chat endpoint — the full agent pipeline."""
    result = await handle_chat(
        message=request.message,
        student_name=request.student_name,
        conversation_history=request.conversation_history,
        search_engine=search_engine,
    )
    return ChatResponse(**result)
