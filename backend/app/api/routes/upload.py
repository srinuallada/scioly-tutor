from fastapi import APIRouter, HTTPException, UploadFile, File

from app.api.deps import search_engine
from app.services.upload_service import handle_upload
from app.settings import DISABLE_UPLOADS

router = APIRouter()


@router.post("/upload")
async def upload_materials(files: list[UploadFile] = File(...)):
    """Upload and process study material files."""
    if DISABLE_UPLOADS:
        raise HTTPException(status_code=403, detail="Uploads are disabled in this environment")
    return await handle_upload(files=files, search_engine=search_engine)
