import os
import sys
import json
import subprocess
from datetime import datetime
import webview

from downloader import fetch_video_info, run_download_worker
import history_manager

def get_asset_path(relative_path):
    # resuelve la ruta para que funcione tanto en desarrollo como dentro del .exe compilado
    if hasattr(sys, '_MEIPASS'):
        return os.path.join(sys._MEIPASS, relative_path)
    return os.path.join(os.path.abspath("."), relative_path)

class Api:
    MAX_CACHE = 50

    def __init__(self):
        self.history_data = history_manager.load_history()
        self.video_cache = {}
        self.download_counter = 0
        self.window = None

    def _cache_video(self, url, data):
        if len(self.video_cache) >= self.MAX_CACHE:
            oldest = next(iter(self.video_cache))
            del self.video_cache[oldest]
        self.video_cache[url] = data

    def fetch_info(self, url):
        try:
            data = fetch_video_info(url)
            self._cache_video(url, data)
            return data
        except ValueError as e:
            return {"error": str(e)}
        except Exception as e:
            msg = str(e)
            if "Video unavailable" in msg:
                msg = "El video no está disponible o es privado."
            return {"error": msg}

    def start_download(self, url, download_type, quality):
        # validar valores
        ALLOWED_TYPES = ("Video", "Audio")
        ALLOWED_QUALITIES = ("Best", "1080p", "720p", "480p", "MP3_320", "MP3_192", "MP3_128", "M4A_Original")
        
        if download_type not in ALLOWED_TYPES:
            return {"error": "Formato no valido."}
        if quality not in ALLOWED_QUALITIES:
            return {"error": "Calidad no valida."}
        
        # Explorador nativo
        CREATE_NO_WINDOW = 0x08000000
        try:
            result = subprocess.run([sys.executable, "--dialog"], capture_output=True, text=True, creationflags=CREATE_NO_WINDOW)
            folder = result.stdout.strip()
        except Exception as e:
            return {"error": f"Error abriendo explorador: {e}"}
            
        if not folder:
            return {"error": "cancelled"}

        self.download_counter += 1
        dl_id = self.download_counter
        cached = self.video_cache.get(url, {})
        title = cached.get("title", "Título desconocido")
        thumbnail = cached.get("thumbnail", "")

        def on_progress(p_id, p_str, p_val, status):
            if self.window:
                safe_str = json.dumps(p_str)
                safe_status = json.dumps(status)
                self.window.evaluate_js(f'updateProgress({p_id}, {safe_str}, {p_val}, {safe_status})')

        def on_complete(p_id):
            self.history_data.append({
                "title": title,
                "thumbnail": thumbnail,
                "url": url,
                "type": download_type,
                "quality": quality if download_type == "Video" else "Audio",
                "folder": folder,
                "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
            })
            history_manager.save_history(self.history_data)
            if self.window:
                self.window.evaluate_js(f'downloadComplete({p_id}, true, "")')

        def on_error(p_id, err_msg):
            if self.window:
                safe_err = json.dumps(str(err_msg))
                self.window.evaluate_js(f'downloadComplete({p_id}, false, {safe_err})')

        run_download_worker(dl_id, url, folder, download_type, quality, on_progress, on_complete, on_error)
        return {"status": "started", "id": dl_id, "title": title, "thumbnail": thumbnail}

    def get_history(self):
        return self.history_data

    def clear_history(self):
        self.history_data = []
        history_manager.save_history(self.history_data)

    def open_folder(self, path):
        path = os.path.normpath(path)
        if os.path.isdir(path):
            if hasattr(os, 'startfile'):
                os.startfile(path)
            else:
                subprocess.Popen(['explorer', path])

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--dialog":
        import tkinter as tk
        from tkinter import filedialog
        root = tk.Tk()
        root.withdraw()
        root.attributes('-topmost', True)
        folder = filedialog.askdirectory(parent=root, title="Seleccionar destino")
        print(folder)
        sys.exit(0)

    try:
        import ctypes
        myappid = 'ratatube.desktop.app.1.0'
        ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID(myappid)
    except Exception:
        pass

    api = Api()
    
    html_path = get_asset_path("web/index.html")
    icon_path = get_asset_path("web/favicon.ico")
    
    window = webview.create_window(
        "Ratatube", 
        html_path, 
        js_api=api, 
        width=1000, 
        height=750
    )
    api.window = window
    webview.start(http_server=True, icon=icon_path)
