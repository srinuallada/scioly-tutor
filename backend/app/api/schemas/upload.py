from pydantic import BaseModel


class FileResult(BaseModel):
    filename: str
    status: str
    chunks: int


class UploadResponse(BaseModel):
    files_processed: list[FileResult]
    total_chunks: int
    stats: dict
