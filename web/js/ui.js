export function toggleLoading(buttonId, isLoading, defaultText) {
    const btn = document.getElementById(buttonId);
    btn.disabled = isLoading;
    btn.innerHTML = isLoading 
        ? `<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Procesando...`
        : defaultText;
}

export function setPreviewData(data) {
    document.getElementById("preview-section").style.display = "grid";
    document.getElementById("vid-thumbnail").src = data.thumbnail || "https://via.placeholder.com/640x360.png?text=Sin+Miniatura";
    document.getElementById("vid-title").innerText = data.title;
}

export function hidePreview() {
    document.getElementById("preview-section").style.display = "none";
    document.getElementById("url-input").value = "";
}

export function updateFormatSelection(format) {
    const btnVid = document.getElementById("type-video");
    const btnAud = document.getElementById("type-audio");
    const qCont = document.getElementById("quality-container");
    const qSelect = document.getElementById("quality-select");

    const activeClass = "py-2 rounded-md bg-slate-700 shadow font-medium text-sm transition-all text-white";
    const inactiveClass = "py-2 rounded-md text-slate-400 hover:text-white font-medium text-sm transition-all bg-transparent shadow-none";

    if (format === "Video") {
        btnVid.className = activeClass;
        btnAud.className = inactiveClass;
        qCont.style.opacity = "1";
        qCont.style.pointerEvents = "auto";
        qSelect.innerHTML = `
            <option value="Best">Mejor disponible</option>
            <option value="1080p">1080p Full HD</option>
            <option value="720p">720p HD</option>
            <option value="480p">480p SD</option>
        `;
    } else {
        btnAud.className = activeClass;
        btnVid.className = inactiveClass;
        qCont.style.opacity = "1";
        qCont.style.pointerEvents = "auto";
        qSelect.innerHTML = `
            <option value="MP3_320">MP3 (320 kbps - Alta)</option>
            <option value="MP3_192">MP3 (192 kbps - Normal)</option>
            <option value="MP3_128">MP3 (128 kbps - Baja)</option>
            <option value="M4A_Original">M4A (Original sin pérdida)</option>
        `;
    }
}

function escapeHTML(str) {
    if (!str) return "";
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag]));
}

export function renderHistoryList(historyData, containerId) {
    const list = document.getElementById(containerId);
    list.innerHTML = "";
    
    if (historyData.length === 0) {
        list.innerHTML = '<div class="text-center py-10 text-slate-500"><i class="fa-solid fa-ghost text-4xl mb-3"></i><p>Aún no hay descargas.</p></div>';
        return;
    }

    [...historyData].reverse().forEach(item => {
        const safeTitle = escapeHTML(item.title);
        const safeThumb = escapeHTML(item.thumbnail);
        const safeType = escapeHTML(item.type);
        const safeQuality = escapeHTML(item.quality);
        const safeDate = escapeHTML(item.date);
        
        list.innerHTML += `
            <div class="glass-panel p-4 rounded-2xl flex items-center justify-between group hover:bg-slate-800 transition-colors">
                <div class="flex items-center gap-4 overflow-hidden">
                    <img src="${safeThumb}" class="w-24 h-14 object-cover rounded-lg shadow" onerror="this.src='https://via.placeholder.com/640x360?text=NA'">
                    <div class="truncate">
                        <h3 class="font-bold text-slate-200 truncate">${safeTitle}</h3>
                        <p class="text-xs text-slate-400 mt-1">
                            <i class="fa-solid ${item.type === 'Video' ? 'fa-video' : 'fa-music'} mr-1"></i>
                            ${safeType} • ${safeQuality} • ${safeDate}
                        </p>
                    </div>
                </div>
                <button data-folder="${item.folder.replace(/\\/g, '\\\\').replace(/"/g, '&quot;')}" class="btn-open-folder ml-4 shrink-0 bg-slate-700 hover:bg-slate-600 w-10 h-10 rounded-full flex items-center justify-center transition-colors tooltip" title="Abrir carpeta">
                    <i class="fa-solid fa-folder-open text-slate-300 pointer-events-none"></i>
                </button>
            </div>
        `;
    });
}

export function addDownloadCard(id, title, thumbnail) {
    const queue = document.getElementById('downloads-queue');
    const card = document.createElement('div');
    const safeTitle = escapeHTML(title);
    const safeThumb = escapeHTML(thumbnail);
    
    card.id = `dl-${id}`;
    card.className = 'glass-panel p-4 rounded-2xl flex items-center gap-4 transition-all border border-transparent';
    card.innerHTML = `
        <img src="${safeThumb}" class="w-20 h-12 object-cover rounded-lg shrink-0" onerror="this.src='https://via.placeholder.com/160x90?text=...'">
        <div class="flex-1 min-w-0">
            <h3 class="text-sm font-bold text-slate-200 truncate">${safeTitle}</h3>
            <div class="flex items-center gap-2 mt-1.5">
                <div class="flex-1 bg-slate-700 rounded-full h-1.5">
                    <div id="dl-bar-${id}" class="bg-red-500 h-1.5 rounded-full transition-all duration-300" style="width:0%"></div>
                </div>
                <span id="dl-pct-${id}" class="text-xs text-slate-400 w-12 text-right">0%</span>
            </div>
            <p id="dl-status-${id}" class="text-xs text-slate-500 mt-1">Iniciando...</p>
        </div>
    `;
    queue.prepend(card);
}
