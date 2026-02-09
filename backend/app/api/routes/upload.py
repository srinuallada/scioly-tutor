from fastapi import APIRouter, UploadFile, File

from app.api.deps import search_engine
from app.services.upload_service import handle_upload

router = APIRouter()


@router.post("/upload")
async def upload_materials(files: list[UploadFile] = File(...)):
    """Upload and process study material files."""
    return await handle_upload(files=files, search_engine=search_engine)
