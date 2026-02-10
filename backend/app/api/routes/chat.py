from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.api.schemas.chat import ChatRequest, ChatResponse
from app.api.deps import search_engine
from app.core.auth import require_auth
from app.services.chat_service import handle_chat, handle_chat_stream

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest, auth: dict = Depends(require_auth)):
    """Main chat endpoint — the full agent pipeline."""
    student_id = auth.get("email") or "default"
    result = await handle_chat(
        message=request.message,
        student_id=student_id,
        student_name=request.student_name,
        conversation_history=request.conversation_history,
        search_engine=search_engine,
    )
    return ChatResponse(**result)


@router.post("/chat/stream")
async def chat_stream_endpoint(request: ChatRequest, auth: dict = Depends(require_auth)):
    """Streaming chat endpoint — returns SSE events as tokens arrive."""
    student_id = auth.get("email") or "default"
    return StreamingResponse(
        handle_chat_stream(
            message=request.message,
            student_id=student_id,
            student_name=request.student_name,
            conversation_history=request.conversation_history,
            search_engine=search_engine,
        ),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
