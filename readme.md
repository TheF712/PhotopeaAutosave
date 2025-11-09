# Photopea con Autoguardado

Una aplicación de escritorio basada en Electron que integra [Photopea](https://www.photopea.com/) con un sistema inteligente de autoguardado automático.

## ✨ Características

- 🎨 **Photopea integrado**: Editor de imágenes completo en tu escritorio
- 💾 **Autoguardado inteligente**: Solo guarda cuando detecta actividad
- ⏱️ **Guardado cada 3 minutos**: Configurable según tus necesidades
- 📁 **Gestión de archivos**: Carga, guarda y organiza tus proyectos
- 🔄 **Recuperación fácil**: Accede rápidamente a tus últimos guardados
- 🖥️ **Multiplataforma**: Funciona en Windows, macOS y Linux

## 🚀 Características principales

### Autoguardado Inteligente
- **Detección de actividad**: Solo guarda si has trabajado en el proyecto
- **Ahorro de espacio**: No crea archivos innecesarios
- **Control total**: Activa/desactiva cuando quieras

### Gestión de Proyectos
- Guardado automático cada 3 minutos
- Guardado manual con un clic (Ctrl+S)
- Carga del último proyecto guardado
- Acceso directo a la carpeta de autoguardados
- Importación/exportación de archivos PSD, PNG, JPG, etc.

### Interfaz Intuitiva
- Indicador visual del estado de autoguardado
- Información del último guardado con fecha y hora
- Notificaciones claras de todas las acciones
- Botones de acción rápida en la barra inferior

## 📦 Instalación

### Prerrequisitos
- Node.js (v14 o superior)
- npm o yarn

### Clonar el repositorio
```bash
git clone https://github.com/soyeldf/photopea-autosave.git
cd photopea-autosave
```

### Instalar dependencias
```bash
npm install
```

### Ejecutar en modo desarrollo
```bash
npm start
```

### Compilar para producción
```bash
npm run build
```

Los instaladores se generarán en la carpeta `dist/`.

## 🎮 Uso

### Barra de herramientas inferior

La aplicación incluye 4 botones principales:

1. **▶️ Activar autoguardado** (Verde cuando inactivo)
   - Activa/desactiva el autoguardado automático
   - Solo guarda si detecta actividad en Photopea

2. **💾 Guardar manualmente**
   - Guarda tu proyecto inmediatamente
   - También disponible con Ctrl+S

3. **📂 Cargar último**
   - Carga el último proyecto autoguardado
   - Abre como nuevo documento (no reemplaza el actual)

4. **📁 Abrir carpeta**
   - Abre la carpeta de autoguardados en tu sistema
   - Útil para gestionar tus archivos guardados

### Atajos de teclado

- `Ctrl+S` (Cmd+S en Mac): Guardar manualmente
- `Ctrl+Shift+L`: Cargar último guardado
- `Ctrl+Q` (Cmd+Q en Mac): Salir de la aplicación

### Menú de archivo

- **Guardar manualmente**: Guarda el proyecto actual
- **Cargar último guardado**: Recupera tu último trabajo
- **Abrir carpeta de autoguardados**: Accede a todos tus guardados
- **Exportar proyecto**: Guarda en ubicación personalizada
- **Importar proyecto**: Abre archivos desde tu sistema

## 📁 Ubicación de los autoguardados

Los archivos se guardan automáticamente en:

- **Windows**: `C:\Users\[Usuario]\AppData\Roaming\Photopea\autosaves\`
- **macOS**: `~/Library/Application Support/Photopea/autosaves/`
- **Linux**: `~/.config/Photopea/autosaves/`

### Formato de nombres
Los archivos se guardan con el formato:
```
autosave_DD-MM-YYYY_HH-MM-SS.psd
```

Ejemplo: `autosave_08-11-2025_14-30-25.psd`

## 🔧 Configuración

### Cambiar intervalo de autoguardado

Edita `renderer.js` y modifica la constante:

```javascript
const AUTOSAVE_INTERVAL = 3 * 60 * 1000; // 3 minutos en milisegundos
```

### Personalizar íconos

Reemplaza los archivos de íconos en la raíz del proyecto:
- `icon.png` (512x512px o mayor)
- `icon.icns` (macOS)
- `icon.ico` (Windows)

## 🛠️ Tecnologías utilizadas

- **Electron**: Framework para aplicaciones de escritorio
- **Photopea**: Editor de imágenes web integrado
- **Node.js**: Entorno de ejecución
- **electron-builder**: Empaquetado de la aplicación

## 📝 Estructura del proyecto

```
photopea-autosave/
├── main.js           # Proceso principal de Electron
├── preload.js        # Script de precarga (comunicación segura)
├── renderer.js       # Lógica de la interfaz
├── index.html        # Interfaz de usuario
├── package.json      # Configuración del proyecto
├── icon.png          # Ícono de la aplicación
├── icon.icns         # Ícono para macOS
├── icon.ico          # Ícono para Windows
└── README.md         # Este archivo
```

## 🤝 Contribuir

Las contribuciones son bienvenidas. Para cambios importantes:

1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: nueva característica'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## ⚠️ Notas importantes

- Esta aplicación requiere conexión a internet para cargar Photopea
- Los archivos se guardan localmente en formato PSD
- El autoguardado solo funciona cuando hay actividad detectada
- Photopea es una aplicación web de terceros integrada mediante iframe

## 📄 Licencia

MIT License - ver el archivo LICENSE para más detalles

## 👤 Autor

**soyeldf**

## 🙏 Agradecimientos

- [Photopea](https://www.photopea.com/) por su increíble editor de imágenes web
- La comunidad de Electron por la documentación y herramientas

---

⭐ Si te gusta este proyecto, considera darle una estrella en GitHub