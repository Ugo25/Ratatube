# Ratatube

Ratatube es un moderno descargador de videos y audios de YouTube que cuenta con dos versiones: una aplicacion de escritorio nativa para Windows y una version web ligera. Su interfaz grafica esta construida con Tailwind CSS y disenada para ser intuitiva, rapida y sin interrupciones.

## Caracteristicas Principales

* **Descargas en Alta Calidad**: Soporte para descargar video (MP4) y audio (MP3/M4A) en la mejor calidad disponible gracias al motor de yt-dlp.
* **Interfaz Moderna y Fluida**: Diseno implementado con Tailwind CSS usando efectos de desenfoque (Glassmorphism) y modo oscuro.
* **Historial de Descargas**: Registro persistente de todas las descargas realizadas con un acceso directo para abrir la carpeta de destino.
* **Dos Plataformas**:
  * **Escritorio**: Empaquetado como un ejecutable independiente para Windows con tecnologia PyWebView.
  * **Web**: Servidor backend en Flask interactuando con un frontend completamente modularizado.
* **Integracion Nativa (Escritorio)**: Cuadros de dialogo de sistema modernos, icono dedicado en la barra de tareas y procesamiento asincrono para evitar congelamientos de la interfaz.

## Arquitectura del Proyecto

El codigo fue reestructurado y modularizado para asegurar la maxima escalabilidad y un facil mantenimiento.

### Version de Escritorio
* `main.py`: Punto de entrada de la aplicacion. Inicializa la ventana con PyWebView, establece el AppUserModelID para inyeccion de iconos y expone los metodos de Python hacia JavaScript.
* `downloader.py`: Logica de extraccion de informacion y descarga usando yt-dlp en hilos secundarios (multithreading) para no bloquear la interfaz grafica.
* `history_manager.py`: Modulo dedicado para guardar y leer el historial local de descargas en formato JSON.
* `web/`: Contiene todo el frontend (HTML, CSS via CDN de Tailwind, y JavaScript modularizado).

### Version Web
* `backend/api.py`: Servidor Flask estructurado que expone rutas REST y sirve los archivos estaticos para evadir problemas de CORS de forma segura.
* `frontend/`: Estructura HTML/JS mediante modulos ES6 (`app.js`, `api.js`, `ui.js`, `history.js`) que separan responsabilidades graficas, de comunicacion y de eventos.

## Requisitos del Sistema

* **Python 3.8+**
* **FFmpeg y FFprobe**: Esenciales para el post-procesamiento de yt-dlp (conversion de audio y union de pistas de video/audio de alta resolucion).

## Instalacion y Uso (Desarrollo)

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/ratatube.git
```

2. Instalar dependencias de Python:
```bash
pip install pywebview yt-dlp flask flask-cors
```

3. Ejecutar la version de Escritorio:
```bash
cd YoutubeDownloader
python main.py
```

4. Ejecutar la version Web:
```bash
cd ratatube-web/backend
python api.py
```

## Compilacion (Version de Escritorio)

Para generar un ejecutable unico (`Ratatube.exe`) optimizado para Windows, se utiliza PyInstaller. Se debe asegurar que el icono y la carpeta web esten empaquetados:

```bash
pyinstaller --noconfirm --onefile --windowed --icon="web\favicon.ico" --add-data "web;web" --add-binary "dist\ffmpeg.exe;." --name="Ratatube" main.py
```

## Tecnologias Utilizadas

* **Backend**: Python 3, yt-dlp, Flask, PyWebView.
* **Frontend**: HTML5, Vanilla JavaScript (ES6 Modules), Tailwind CSS, FontAwesome.
* **Procesamiento**: FFmpeg.

## Notas Adicionales
* Los problemas de "hilo bloqueado" al utilizar cuadros de dialogo en Windows se resolvieron implementando el IFileDialog nativo provisto por PyWebView (`webview.FOLDER_DIALOG`).
* Para forzar a la barra de tareas de Windows a utilizar el icono nativo de la aplicacion (y no el genérico de Python), el script utiliza llamadas a `ctypes` para definir de forma estricta el AppUserModelID.

## Licencia

Este proyecto es de codigo abierto y para uso personal/educativo.
