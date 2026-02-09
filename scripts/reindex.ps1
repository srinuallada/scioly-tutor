# Re-process all uploaded files and rebuild the search index.
$ErrorActionPreference = "Stop"

Push-Location "$PSScriptRoot\..\backend"
& venv\Scripts\Activate.ps1

python -c @"
from app.retrieval.processor import process_directory, save_chunks
from app.settings import UPLOAD_DIR, CHUNKS_PATH
import os

os.makedirs(str(CHUNKS_PATH.parent), exist_ok=True)
chunks = process_directory(str(UPLOAD_DIR))
if chunks:
    save_chunks(chunks, str(CHUNKS_PATH))
    print(f'Done: {len(chunks)} chunks indexed')
else:
    print('No files found in uploads directory')
"@

Pop-Location
