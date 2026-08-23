import json
import os

HISTORY_FILE = "yt_history.json"

def load_history():
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return []

def save_history(data):
    try:
        with open(HISTORY_FILE, "w") as f:
            json.dump(data, f, indent=4)
    except Exception:
        pass
