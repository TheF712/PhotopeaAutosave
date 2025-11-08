const { contextBridge, ipcRenderer } = require('electron');

// Exponer API segura al renderer
contextBridge.exposeInMainWorld('electronAPI', {
  saveProject: (data) => ipcRenderer.invoke('save-project', data),
  loadLastProject: () => ipcRenderer.invoke('load-last-project'),
  openAutosaveFolder: () => ipcRenderer.invoke('open-autosave-folder'),
  exportProject: (data) => ipcRenderer.invoke('export-project', data),
  importProject: () => ipcRenderer.invoke('import-project'),
  
  onManualSave: (callback) => ipcRenderer.on('manual-save', callback),
  onLoadLastSave: (callback) => ipcRenderer.on('load-last-save', callback),
  onOpenAutosaveFolder: (callback) => ipcRenderer.on('open-autosave-folder', callback),
  onExportProject: (callback) => ipcRenderer.on('export-project', callback),
  onImportProject: (callback) => ipcRenderer.on('import-project', callback)
});