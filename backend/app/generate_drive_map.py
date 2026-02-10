"""
Generate source_links.json — maps local filenames to Google Drive URLs.

Setup (one-time):
  1. Go to https://console.cloud.google.com/apis/library/drive.googleapis.com
     and enable the Google Drive API on your project.
  2. Go to https://console.cloud.google.com/apis/credentials
     → Create Credentials → OAuth 2.0 Client ID → Desktop App
  3. Download the JSON and save it as backend/credentials.json
  4. Run:  cd backend && python -m app.generate_drive_map <FOLDER_ID>

     Example:
       python -m app.generate_drive_map 183JYSVyyr4MDmyLcZETc7bU_dNyTCIVD

The script will open your browser for Google sign-in (first run only),
then scan the Drive folder recursively and match files to your chunks.json.
"""

import json
import logging
import sys
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

from app.settings import INDEX_DIR, CHUNKS_PATH

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger(__name__)

SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]
TOKEN_PATH = Path(__file__).parent / "data" / "drive_token.json"
CREDS_PATH = Path(__file__).parent.parent / "credentials.json"
OUTPUT_PATH = INDEX_DIR / "source_links.json"


def authenticate():
    """Authenticate with Google Drive (browser sign-in on first run)."""
    creds = None
    if TOKEN_PATH.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_PATH), SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not CREDS_PATH.exists():
                print(f"Error: {CREDS_PATH} not found.")
                print("Download OAuth credentials from Google Cloud Console.")
                print("See docstring at top of this file for setup instructions.")
                sys.exit(1)
            flow = InstalledAppFlow.from_client_secrets_file(str(CREDS_PATH), SCOPES)
            creds = flow.run_local_server(port=0)

        TOKEN_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(TOKEN_PATH, "w") as f:
            f.write(creds.to_json())

    return creds


def list_files_recursive(service, folder_id: str) -> list[dict]:
    """List all files in a Drive folder recursively."""
    all_files = []
    page_token = None

    while True:
        resp = service.files().list(
            q=f"'{folder_id}' in parents and trashed = false",
            fields="nextPageToken, files(id, name, mimeType)",
            pageSize=100,
            pageToken=page_token,
        ).execute()

        for f in resp.get("files", []):
            if f["mimeType"] == "application/vnd.google-apps.folder":
                log.info("  Scanning subfolder: %s", f["name"])
                all_files.extend(list_files_recursive(service, f["id"]))
            else:
                all_files.append(f)

        page_token = resp.get("nextPageToken")
        if not page_token:
            break

    return all_files


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python -m app.generate_drive_map <GOOGLE_DRIVE_FOLDER_ID>")
        print("\nExample:")
        print("  python -m app.generate_drive_map 183JYSVyyr4MDmyLcZETc7bU_dNyTCIVD")
        sys.exit(1)

    folder_id = sys.argv[1]

    # Load known filenames from chunks.json
    known_files: set[str] = set()
    if CHUNKS_PATH.exists():
        with open(CHUNKS_PATH) as f:
            chunks = json.load(f)
        known_files = {c["source_file"] for c in chunks}
        log.info("Loaded %d unique filenames from chunks.json", len(known_files))

    # Authenticate and scan Drive
    log.info("Authenticating with Google Drive...")
    creds = authenticate()
    service = build("drive", "v3", credentials=creds)

    log.info("Scanning folder %s...", folder_id)
    drive_files = list_files_recursive(service, folder_id)
    log.info("Found %d files on Google Drive", len(drive_files))

    # Match Drive files to local filenames
    source_links: dict[str, str] = {}
    unmatched_drive: list[str] = []

    for df in drive_files:
        drive_url = f"https://drive.google.com/file/d/{df['id']}/view"
        if df["name"] in known_files:
            source_links[df["name"]] = drive_url
            log.info("  Matched: %s", df["name"])
        else:
            unmatched_drive.append(df["name"])

    # Save mapping
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(source_links, f, indent=2)

    matched_local = known_files & set(source_links.keys())
    unmatched_local = known_files - set(source_links.keys())

    print(f"\nDone — {len(source_links)} files mapped")
    print(f"  Matched:           {len(matched_local)}/{len(known_files)} local files")
    if unmatched_local:
        print(f"  Not found on Drive: {len(unmatched_local)} files")
        for name in sorted(unmatched_local)[:10]:
            print(f"    - {name}")
    if unmatched_drive:
        print(f"  Not in chunks.json: {len(unmatched_drive)} Drive files (not indexed)")

    print(f"\nSaved to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
