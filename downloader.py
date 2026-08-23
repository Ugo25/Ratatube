import os
import yt_dlp
import threading

QUALITY_MAP = {
    "Best":  "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
    "1080p": "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best",
    "720p":  "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best",
    "480p":  "bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480][ext=mp4]/best",
}

def fetch_video_info(url):
    """extrae la información básica del video sin descargarlo."""
    if "youtube.com" not in url and "youtu.be" not in url:
        raise ValueError("URL no válida. Solo YouTube.")
    
    with yt_dlp.YoutubeDL({"quiet": True, "skip_download": True, "noplaylist": True}) as ydl:
        info = ydl.extract_info(url, download=False)
        return {
            "title": info.get("title", "Título desconocido"),
            "thumbnail": info.get("thumbnail", ""),
        }

def run_download_worker(dl_id, url, save_dir, download_type, quality, on_progress, on_complete, on_error):
    """Ejecuta la descarga en un hilo secundario y reporta el progreso."""
    def progress_hook(d):
        if d["status"] == "downloading":
            try:
                total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
                downloaded = d.get("downloaded_bytes", 0)
                percent_val = downloaded / total if total > 0 else 0
                percent_str = f"{percent_val * 100:.1f}%"
                
                speed = d.get("speed")
                eta = d.get("eta")
                speed_str = f"{speed / 1024 / 1024:.1f} MB/s" if speed else ""
                eta_str = f"{eta}s" if eta else ""
                status = f"{speed_str} | {eta_str}" if speed_str else "Descargando..."
                
                on_progress(dl_id, percent_str, percent_val, status)
            except Exception:
                pass
        elif d["status"] == "finished":
            on_progress(dl_id, "100%", 1.0, "Procesando...")

    ydl_opts = {
        "outtmpl": os.path.join(save_dir, "%(title)s.%(ext)s"),
        "progress_hooks": [progress_hook],
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
    }

    if download_type == "Video":
        ydl_opts["format"] = QUALITY_MAP.get(quality, QUALITY_MAP["Best"])
    else:
        if quality == "M4A_Original":
            ydl_opts["format"] = "bestaudio[ext=m4a]/bestaudio"
        else:
            ydl_opts["format"] = "bestaudio/best"
            kbps = quality.split("_")[1] if "_" in quality else "192"
            ydl_opts["postprocessors"] = [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": kbps,
            }]
    
    def worker():
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])
            on_complete(dl_id)
        except Exception as e:
            on_error(dl_id, str(e))
    
    threading.Thread(target=worker, daemon=True).start()
