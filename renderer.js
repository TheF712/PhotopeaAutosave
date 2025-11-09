// Configuración
const AUTOSAVE_INTERVAL = 3 * 60 * 1000; // 3 minutos
let autosaveTimer = null;
let lastSaveTime = null;
let autosaveEnabled = false; // INICIAR DESACTIVADO
let lastActivityTime = Date.now(); // Rastrear última actividad
let hasActivitySinceLastSave = false; // Flag para detectar actividad

const photopeaFrame = document.getElementById('photopea-frame');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const lastSaveEl = document.getElementById('last-save');
const toggleBtn = document.getElementById('toggle-autosave');

// Comunicación con Photopea mediante postMessage
// Photopea espera comandos en formato específico
function sendToPhotopea(script) {
  photopeaFrame.contentWindow.postMessage(script, '*');
}

// Obtener proyecto como PSD
function getProjectAsPSD() {
  // Script de Photopea para exportar como PSD
  const script = `
    app.echoToOE = true;
    var bytes = app.activeDocument.saveToOE("psd");
    bytes;
  `;
  sendToPhotopea(script);
}

// Mostrar notificación
function showNotification(message, isError = false) {
  const notification = document.createElement('div');
  notification.className = `notification ${isError ? 'error' : ''}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Actualizar estado visual
function updateStatus(text, isSaving = false) {
  statusText.textContent = text;
  if (isSaving) {
    statusDot.classList.add('saving');
  } else {
    statusDot.classList.remove('saving');
  }
}

// Formatear fecha
function formatTime(date) {
  return date.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });
}

// Guardar proyecto
async function saveProject() {
  try {
    updateStatus('Guardando...', true);
    
    // Script para guardar el documento actual o crear uno nuevo si no existe
    const script = `
      (function() {
        app.echoToOE = true;
        
        // Si no hay documentos abiertos, crear uno vacío
        if (app.documents.length === 0) {
          app.documents.add(800, 600, 72, "Autosave", "rgb");
        }
        
        // Guardar el documento activo como PSD
        var bytes = app.activeDocument.saveToOE("psd");
        bytes;
      })();
    `;
    
    sendToPhotopea(script);
    // Marcar que se guardó (resetear flag de actividad después de recibir confirmación)
  } catch (err) {
    console.error('Error iniciando guardado:', err);
    updateStatus('Error al iniciar guardado', false);
    showNotification('✗ Error al guardar', true);
  }
}

// Escuchar respuestas de Photopea
window.addEventListener('message', async (event) => {
  // Verificar origen
  if (!event.data) return;
  
  try {
    // Photopea devuelve diferentes tipos de respuestas
    const data = event.data;
    
    // Si recibimos un ArrayBuffer (datos del PSD)
    if (data instanceof ArrayBuffer) {
      console.log('Recibido ArrayBuffer de tamaño:', data.byteLength);
      
      // Solo procesar si tiene contenido
      if (data.byteLength > 0) {
        const result = await window.electronAPI.saveProject(data);
        
        if (result.success) {
          lastSaveTime = new Date();
          lastSaveEl.textContent = `Último guardado: ${formatTime(lastSaveTime)}`;
          updateStatus(autosaveEnabled ? 'Autoguardado activo' : 'Autoguardado desactivado', false);
          showNotification('✓ Proyecto guardado automáticamente');
          
          // Reset del flag de actividad después de guardar exitosamente
          hasActivitySinceLastSave = false;
          
          // Actualizar la información del último guardado
          updateLastSaveInfo();
        } else {
          updateStatus(autosaveEnabled ? 'Error al guardar' : 'Autoguardado desactivado', false);
          showNotification('✗ Error al guardar: ' + result.error, true);
        }
      } else {
        updateStatus(autosaveEnabled ? 'Autoguardado activo' : 'Autoguardado desactivado', false);
        showNotification('⚠ No hay documento para guardar', true);
      }
    }
    // Si es un mensaje de tipo string (respuestas de scripts)
    else if (typeof data === 'string') {
      console.log('Mensaje de Photopea:', data);
    }
  } catch (err) {
    updateStatus('Error al guardar', false);
    showNotification('✗ Error inesperado al guardar', true);
    console.error('Error procesando mensaje:', err);
  }
});

// Cargar último proyecto guardado
async function loadLastProject() {
  try {
    updateStatus('Cargando último guardado...', true);
    const result = await window.electronAPI.loadLastProject();
    
    if (result.success) {
      // Convertir ArrayBuffer a Uint8Array y luego a base64
      const uint8Array = new Uint8Array(result.data);
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64 = btoa(binary);
      
      // Abrir como NUEVO documento (no reemplazar el actual)
      const script = `app.open("data:image/vnd.adobe.photoshop;base64,${base64}", null, false);`;
      sendToPhotopea(script);
      
      updateStatus(autosaveEnabled ? 'Autoguardado activo' : 'Autoguardado desactivado', false);
      showNotification('✓ Último proyecto cargado como nuevo documento');
    } else {
      updateStatus('No hay guardados previos', false);
      showNotification('No se encontraron guardados previos', true);
    }
  } catch (err) {
    updateStatus('Error al cargar', false);
    showNotification('✗ Error al cargar proyecto', true);
    console.error(err);
  }
}

// Abrir carpeta de autoguardados
async function openAutosaveFolder() {
  try {
    const result = await window.electronAPI.openAutosaveFolder();
    if (result.success) {
      showNotification('📁 Carpeta de autoguardados abierta');
    } else {
      showNotification('✗ Error al abrir carpeta', true);
    }
  } catch (err) {
    showNotification('✗ Error al abrir carpeta', true);
    console.error(err);
  }
}

// Exportar proyecto manualmente
async function exportProject() {
  updateStatus('Exportando...', true);
  getProjectAsPSD();
  // La respuesta se maneja en el listener de mensajes
}

// Importar proyecto
async function importProject() {
  try {
    const result = await window.electronAPI.importProject();
    
    if (result.success && !result.cancelled) {
      // Convertir ArrayBuffer a base64
      const uint8Array = new Uint8Array(result.data);
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64 = btoa(binary);
      
      // Determinar el tipo MIME según la extensión
      const ext = result.filename.split('.').pop().toLowerCase();
      const mimeTypes = {
        'psd': 'image/vnd.adobe.photoshop',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'webp': 'image/webp',
        'gif': 'image/gif'
      };
      const mimeType = mimeTypes[ext] || 'application/octet-stream';
      
      // Abrir como nuevo documento (false = no reemplazar el actual)
      const script = `app.open("data:${mimeType};base64,${base64}", null, false);`;
      sendToPhotopea(script);
      
      showNotification(`✓ Archivo "${result.filename}" importado como nuevo documento`);
    }
  } catch (err) {
    showNotification('✗ Error al importar archivo', true);
    console.error(err);
  }
}

// Iniciar autoguardado automático
function startAutosave() {
  if (!autosaveEnabled) return;
  
  if (autosaveTimer) {
    clearInterval(autosaveTimer);
  }
  
  autosaveTimer = setInterval(() => {
    if (autosaveEnabled && hasActivitySinceLastSave) {
      console.log('Actividad detectada, guardando...');
      saveProject();
      hasActivitySinceLastSave = false; // Reset después de guardar
    } else if (autosaveEnabled && !hasActivitySinceLastSave) {
      console.log('Sin actividad desde el último guardado, omitiendo...');
    }
  }, AUTOSAVE_INTERVAL);
  
  console.log(`Autoguardado iniciado (cada ${AUTOSAVE_INTERVAL / 60000} minutos)`);
}

// Detener autoguardado
function stopAutosave() {
  if (autosaveTimer) {
    clearInterval(autosaveTimer);
    autosaveTimer = null;
  }
}

// Toggle autoguardado
function toggleAutosave() {
  autosaveEnabled = !autosaveEnabled;
  
  if (autosaveEnabled) {
    statusDot.classList.remove('disabled');
    statusText.textContent = 'Autoguardado activo';
    toggleBtn.textContent = '⏸️ Pausar autoguardado';
    toggleBtn.classList.remove('inactive');
    toggleBtn.classList.add('active');
    startAutosave();
    showNotification('✓ Autoguardado activado');
  } else {
    statusDot.classList.add('disabled');
    statusText.textContent = 'Autoguardado desactivado';
    toggleBtn.textContent = '▶️ Activar autoguardado';
    toggleBtn.classList.remove('active');
    toggleBtn.classList.add('inactive');
    stopAutosave();
    showNotification('⏸️ Autoguardado desactivado');
  }
}

// Event listener para el botón de toggle
if (toggleBtn) {
  toggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('Toggle clicked, estado actual:', autosaveEnabled);
    toggleAutosave();
  });
} else {
  console.error('No se encontró el elemento toggle-autosave');
}

// Escuchar eventos del menú
window.electronAPI.onManualSave(() => {
  showNotification('💾 Guardado manual iniciado...');
  saveProject();
});

window.electronAPI.onLoadLastSave(() => {
  loadLastProject();
});

window.electronAPI.onOpenAutosaveFolder(() => {
  openAutosaveFolder();
});

window.electronAPI.onExportProject(() => {
  exportProject();
});

window.electronAPI.onImportProject(() => {
  importProject();
});

// Esperar a que Photopea cargue completamente
photopeaFrame.addEventListener('load', () => {
  console.log('Photopea cargado');
  
  // Verificar que el botón existe
  console.log('Toggle button:', toggleBtn);
  
  // Actualizar estado inicial
  statusDot.classList.add('disabled');
  statusText.textContent = 'Autoguardado desactivado';
  toggleBtn.textContent = '▶️ Activar autoguardado';
  toggleBtn.classList.add('inactive');
  
  // Cargar información del último guardado
  updateLastSaveInfo();
  
  // NO iniciar autoguardado automáticamente
  showNotification('⏸️ Autoguardado desactivado - Actívalo cuando estés listo');
  
  // Detectar actividad en el iframe de Photopea
  setupActivityDetection();
});

// Configurar detección de actividad
function setupActivityDetection() {
  // Detectar clics en el iframe
  window.addEventListener('blur', () => {
    // Cuando la ventana pierde foco, podría ser porque están haciendo clic en Photopea
    registerActivity();
  });
  
  // Detectar mensajes de Photopea (cualquier interacción genera mensajes)
  const originalMessageHandler = window.onmessage;
  window.addEventListener('message', (event) => {
    if (event.data && event.source === photopeaFrame.contentWindow) {
      registerActivity();
    }
  });
  
  // Detectar movimiento del mouse sobre el iframe
  let mouseOverIframe = false;
  
  photopeaFrame.addEventListener('mouseenter', () => {
    mouseOverIframe = true;
    registerActivity();
  });
  
  photopeaFrame.addEventListener('mouseleave', () => {
    mouseOverIframe = false;
  });
  
  // Detectar cuando el mouse se mueve en general
  document.addEventListener('mousemove', () => {
    if (mouseOverIframe) {
      registerActivity();
    }
  });
  
  console.log('Detección de actividad configurada');
}

// Registrar actividad del usuario
function registerActivity() {
  const now = Date.now();
  // Solo registrar si han pasado al menos 5 segundos desde la última actividad registrada
  if (now - lastActivityTime > 5000) {
    lastActivityTime = now;
    hasActivitySinceLastSave = true;
    console.log('Actividad detectada en Photopea');
  }
}

// Event listener para guardado manual desde HTML
window.addEventListener('manual-save-requested', () => {
  saveProject();
});

// Event listener para cargar último desde HTML
window.addEventListener('load-last-requested', () => {
  loadLastProject();
});

// Función para actualizar la información del último guardado
async function updateLastSaveInfo() {
  try {
    const result = await window.electronAPI.loadLastProject();
    if (result.success && result.filename) {
      // Parsear el nombre del archivo: autosave_día-mes-año_hora-minuto-segundo.psd
      const match = result.filename.match(/autosave_(\d{2})-(\d{2})-(\d{4})_(\d{2})-(\d{2})-(\d{2})\.psd/);
      if (match) {
        const [_, day, month, year, hours, minutes, seconds] = match;
        const date = new Date(year, month - 1, day, hours, minutes, seconds);
        lastSaveEl.textContent = `Último guardado: ${formatTime(date)} - ${day}/${month}/${year}`;
      } else {
        lastSaveEl.textContent = `Último guardado: ${result.filename}`;
      }
    } else {
      lastSaveEl.textContent = 'Último guardado: nunca';
    }
  } catch (err) {
    lastSaveEl.textContent = 'Último guardado: nunca';
    console.error('Error obteniendo info del último guardado:', err);
  }
}

// Limpiar al cerrar
window.addEventListener('beforeunload', () => {
  stopAutosave();
});