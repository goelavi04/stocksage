"""
Persist the SQLite database to a private HuggingFace dataset repo.
Runs on startup (load) and every 5 minutes + on shutdown (save).
Falls back silently if no token is available (local dev).
"""

import os
import shutil
import threading
import time

try:
    from huggingface_hub import HfApi, hf_hub_download
    _HF_AVAILABLE = True
except ImportError:
    _HF_AVAILABLE = False

HF_REPO    = "goelavi04/stocksage-data"
HF_TOKEN   = os.environ.get("HF_PERSIST_TOKEN")
DB_PATH    = "/tmp/stocksage.db"
_SAVE_INTERVAL = 300   # 5 minutes


def load_db() -> None:
    """Download database from HF dataset on startup."""
    if not _HF_AVAILABLE or not HF_TOKEN:
        print("[persist] No token — skipping load (local mode)")
        return
    try:
        path = hf_hub_download(
            repo_id=HF_REPO,
            repo_type="dataset",
            filename="stocksage.db",
            token=HF_TOKEN,
            local_dir="/tmp",
            local_dir_use_symlinks=False,
        )
        print(f"[persist] Database loaded from HF ({os.path.getsize(path)} bytes)")
    except Exception as e:
        if "404" in str(e) or "not found" in str(e).lower() or "Entry Not Found" in str(e):
            print("[persist] No database on HF yet — will create fresh and save on first write")
        else:
            print(f"[persist] Load failed: {e}")


def save_db() -> None:
    """Upload database to HF dataset."""
    if not _HF_AVAILABLE or not HF_TOKEN:
        return
    if not os.path.exists(DB_PATH):
        return
    try:
        api = HfApi()
        api.upload_file(
            path_or_fileobj=DB_PATH,
            path_in_repo="stocksage.db",
            repo_id=HF_REPO,
            repo_type="dataset",
            token=HF_TOKEN,
            commit_message="Auto-save portfolio database",
        )
        print(f"[persist] Database saved to HF ({os.path.getsize(DB_PATH)} bytes)")
    except Exception as e:
        print(f"[persist] Save failed: {e}")


def _save_loop() -> None:
    """Background thread: save every 5 minutes."""
    while True:
        time.sleep(_SAVE_INTERVAL)
        save_db()


def start_persistence() -> None:
    """Call once at app startup: load DB then begin background saves."""
    load_db()
    t = threading.Thread(target=_save_loop, daemon=True)
    t.start()
    print("[persist] Background save thread started (every 5 min)")
