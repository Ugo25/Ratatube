import { toggleLoading, setPreviewData, hidePreview, updateFormatSelection, renderHistoryList, addDownloadCard } from './ui.js';

let currentFormat = "Video";

document.addEventListener("DOMContentLoaded", () => {
    initEvents();
});

window.addEventListener('pywebviewready', () => {
    refreshHistory();
});

function initEvents() {
    document.getElementById("btn-search").addEventListener("click", loadVideo);
    document.getElementById("btn-download").addEventListener("click", startDownload);
    
    document.getElementById("url-input").addEventListener("keydown", (e) => {
        if (e.key === "Enter") loadVideo();
    });
    
    document.getElementById("type-video").addEventListener("click", () => setFormat("Video"));
    document.getElementById("type-audio").addEventListener("click", () => setFormat("Audio"));
    
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll(".tab-btn").forEach(b => {
                b.classList.remove("text-white", "border-red-500");
                b.classList.add("text-slate-400", "border-transparent");
            });
            const target = e.currentTarget;
            target.classList.remove("text-slate-400", "border-transparent");
            target.classList.add("text-white", "border-red-500");

            document.querySelectorAll(".tab-content").forEach(content => {
                content.classList.add("hidden");
            });
            document.getElementById(target.dataset.target).classList.remove("hidden");
            
            if (target.dataset.target === "history-tab") {
                refreshHistory();
            }
        });
    });

    document.getElementById("btn-clear-history").addEventListener("click", async () => {
        if (confirm("Confirmar eliminación del historial")) {
            await window.pywebview.api.clear_history();
            refreshHistory();
        }
    });

    document.addEventListener("click", (e) => {
        if (e.target.closest('.btn-open-folder')) {
            const folder = e.target.closest('.btn-open-folder').dataset.folder;
            window.pywebview.api.open_folder(folder);
        }
    });
}

async function loadVideo() {
    const url = document.getElementById("url-input").value.trim();
    if (!url) {
        alert("Ingrese una URL válida");
        return;
    }

    toggleLoading("btn-search", true, '<i class="fa-solid fa-search mr-2"></i> Buscar');

    try {
        const result = await window.pywebview.api.fetch_info(url);
        if (result.error) {
            alert(result.error);
            hidePreview();
        } else {
            setPreviewData(result);
            toggleLoading("btn-download", false, '<i class="fa-solid fa-download mr-2"></i> DESCARGAR');
        }
    } catch (err) {
        alert("Error de conexión");
        hidePreview();
    } finally {
        toggleLoading("btn-search", false, '<i class="fa-solid fa-search mr-2"></i> Buscar');
    }
}

async function startDownload() {
    const url = document.getElementById("url-input").value.trim();
    const quality = document.getElementById("quality-select").value;

    toggleLoading("btn-download", true, '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> SELECCIONAR CARPETA...');

    try {
        const result = await window.pywebview.api.start_download(url, currentFormat, quality);
        
        if (result.error) {
            if (result.error !== "cancelled") {
                alert(result.error);
            }
            toggleLoading("btn-download", false, '<i class="fa-solid fa-download mr-2"></i> DESCARGAR');
            return;
        }

        addDownloadCard(result.id, result.title, result.thumbnail);
        hidePreview();
    } catch (err) {
        alert("Error al iniciar descarga");
    } finally {
        toggleLoading("btn-download", false, '<i class="fa-solid fa-download mr-2"></i> DESCARGAR');
    }
}

function setFormat(format) {
    currentFormat = format;
    updateFormatSelection(format);
}

async function refreshHistory() {
    if (window.pywebview && window.pywebview.api) {
        const historyData = await window.pywebview.api.get_history();
        renderHistoryList(historyData, "history-list");
    }
}

window.updateProgress = function(id, percent_str, percent_val, status_text) {
    const bar = document.getElementById(`dl-bar-${id}`);
    const pct = document.getElementById(`dl-pct-${id}`);
    const st = document.getElementById(`dl-status-${id}`);
    if (bar) bar.style.width = (percent_val * 100) + '%';
    if (pct) pct.innerText = percent_str;
    if (st) st.innerText = status_text;
}

window.downloadComplete = function(id, success, message) {
    const card = document.getElementById(`dl-${id}`);
    const bar = document.getElementById(`dl-bar-${id}`);
    const pct = document.getElementById(`dl-pct-${id}`);
    const st = document.getElementById(`dl-status-${id}`);

    if (success) {
        if (bar) { bar.style.width = '100%'; bar.classList.replace('bg-red-500', 'bg-emerald-500'); }
        if (pct) pct.innerText = '✅';
        if (st) st.innerText = '¡Completado!';
        if (card) card.classList.add('border-emerald-500');
        
        setTimeout(() => {
            if (card) card.style.opacity = '0';
            setTimeout(() => { if (card) card.remove(); }, 500);
        }, 5000);
    } else {
        if (bar) bar.classList.replace('bg-red-500', 'bg-orange-500');
        if (pct) pct.innerText = '❌';
        if (st) st.innerText = message || 'Error en la descarga';
        if (card) card.classList.add('border-orange-500');
        
        setTimeout(() => {
            if (card) card.style.opacity = '0';
            setTimeout(() => { if (card) card.remove(); }, 500);
        }, 10000);
    }
}
