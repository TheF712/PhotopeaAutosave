const { app, BrowserWindow, ipcMain, Menu, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;

let mainWindow;
const AUTOSAVE_DIR = path.join(app.getPath('userData'), 'autosaves');

// Crear directorio de autoguardado si no existe
async function ensureAutosaveDir() {
  try {
    await fs.mkdir(AUTOSAVE_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creando directorio:', err);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true
    },
    icon: path.join(__dirname, 'icon.png')
  });

  // Crear menú personalizado
  const menu = Menu.buildFromTemplate([
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Guardar manualmente',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => mainWindow.webContents.send('manual-save')
        },
        {
          label: 'Cargar último guardado',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => {
            console.log('Menú: Cargar último guardado');
            mainWindow.webContents.send('load-last-save');
          }
        },
        { type: 'separator' },
        {
          label: 'Abrir carpeta de autoguardados',
          click: () => mainWindow.webContents.send('open-autosave-folder')
        },
        { type: 'separator' },
        {
          label: 'Exportar proyecto...',
          click: () => mainWindow.webContents.send('export-project')
        },
        {
          label: 'Importar proyecto...',
          click: () => mainWindow.webContents.send('import-project')
        },
        { type: 'separator' },
        {
          label: 'Salir',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'Ver',
      submenu: [
        { role: 'reload', label: 'Recargar' },
        { role: 'toggleDevTools', label: 'Herramientas de Desarrollador' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom Normal' },
        { role: 'zoomIn', label: 'Acercar' },
        { role: 'zoomOut', label: 'Alejar' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Pantalla Completa' }
      ]
    }
  ]);

  Menu.setApplicationMenu(menu);

  // Cargar HTML con webview de Photopea
  mainWindow.loadFile('index.html');

  // Cerrar completamente cuando se cierra la ventana
  mainWindow.on('close', (e) => {
    // Forzar el cierre completo
    mainWindow = null;
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    // Asegurar que la app se cierre
    app.quit();
  });
}

// Guardar proyecto
ipcMain.handle('save-project', async (event, projectData) => {
  try {
    await ensureAutosaveDir();
    
    // Crear nombre con fecha y hora
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const filename = `autosave_${day}-${month}-${year}_${hours}-${minutes}-${seconds}.psd`;
    const filepath = path.join(AUTOSAVE_DIR, filename);
    
    await fs.writeFile(filepath, Buffer.from(projectData));
    
    // Guardar referencia al último guardado
    await fs.writeFile(
      path.join(AUTOSAVE_DIR, 'last_save.txt'),
      filename
    );
    
    return { success: true, filepath, filename };
  } catch (err) {
    console.error('Error guardando:', err);
    return { success: false, error: err.message };
  }
});

// Cargar último proyecto
ipcMain.handle('load-last-project', async () => {
  try {
    const lastSaveFile = path.join(AUTOSAVE_DIR, 'last_save.txt');
    const filename = await fs.readFile(lastSaveFile, 'utf-8');
    const filepath = path.join(AUTOSAVE_DIR, filename.trim());
    const data = await fs.readFile(filepath);
    
    return { success: true, data: data.buffer, filename: filename.trim() };
  } catch (err) {
    console.error('Error cargando:', err);
    return { success: false, error: err.message };
  }
});

// Abrir carpeta de autoguardados
ipcMain.handle('open-autosave-folder', async () => {
  try {
    await ensureAutosaveDir();
    await shell.openPath(AUTOSAVE_DIR);
    return { success: true };
  } catch (err) {
    console.error('Error abriendo carpeta:', err);
    return { success: false, error: err.message };
  }
});

// Exportar proyecto
ipcMain.handle('export-project', async (event, projectData) => {
  try {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Exportar proyecto',
      defaultPath: `proyecto_${Date.now()}.psd`,
      filters: [
        { name: 'Archivos PSD', extensions: ['psd'] },
        { name: 'Todos los archivos', extensions: ['*'] }
      ]
    });
    
    if (filePath) {
      await fs.writeFile(filePath, Buffer.from(projectData));
      return { success: true, filepath: filePath };
    }
    return { success: false, cancelled: true };
  } catch (err) {
    console.error('Error exportando:', err);
    return { success: false, error: err.message };
  }
});

// Importar proyecto
ipcMain.handle('import-project', async () => {
  try {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Importar proyecto',
      filters: [
        { name: 'Archivos de imagen', extensions: ['psd', 'png', 'jpg', 'jpeg', 'webp', 'gif'] },
        { name: 'Todos los archivos', extensions: ['*'] }
      ],
      properties: ['openFile']
    });
    
    if (filePaths && filePaths.length > 0) {
      const data = await fs.readFile(filePaths[0]);
      return { success: true, data: data.buffer, filename: path.basename(filePaths[0]) };
    }
    return { success: false, cancelled: true };
  } catch (err) {
    console.error('Error importando:', err);
    return { success: false, error: err.message };
  }
});

app.whenReady().then(() => {
  ensureAutosaveDir();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // En Mac, forzar el cierre completo de la app
  app.quit();
});