// ============================================
// RESOURCES MODULE - BIBLIOTECA INTERNA
// ============================================
// Gestión de materiales reutilizables con drag & drop

// Extender STATE global (ya declarado en full-app.js)
(function() {
  if (typeof STATE !== 'undefined') {
    STATE.resources = STATE.resources || [];
    STATE.resourceFolders = STATE.resourceFolders || [];
    STATE.unclassifiedResources = STATE.unclassifiedResources || { resource_count: 0 };
    STATE.selectedResourceFolder = STATE.selectedResourceFolder || 'unclassified';
  }
})();

// ============================================
// CARGAR RECURSOS Y CARPETAS
// ============================================
async function loadResources() {
  try {
    console.log('📚 loadResources: Cargando carpetas...');
    // Cargar carpetas con estadísticas
    const foldersData = await apiCall('/resources/folders');
    console.log('📚 loadResources: Carpetas recibidas:', foldersData);
    STATE.resourceFolders = foldersData.folders || [];
    STATE.unclassifiedResources = foldersData.unclassified || { resource_count: 0 };
    console.log('📚 loadResources: STATE.resourceFolders:', STATE.resourceFolders.length);
    
    // Cargar recursos filtrados
    const params = new URLSearchParams();
    if (STATE.selectedResourceFolder) {
      params.append('folder_id', STATE.selectedResourceFolder);
    }
    
    const resourcesData = await apiCall(`/resources?${params.toString()}`);
    STATE.resources = resourcesData.resources || [];
    
    if (STATE.currentView === 'resources') {
      render();
    }
  } catch (error) {
    console.error('Error loading resources:', error);
    showNotification('❌ Error al cargar recursos', 'error');
  }
}

// ============================================
// RENDERIZAR VISTA DE RECURSOS
// ============================================
function renderResources() {
  return renderLayout(`
    <div style="padding: 1.5rem; max-width: 1400px; margin: 0 auto;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <img src="/static/galia-octopus.jpg" alt="GAL IA" style="width: 60px; height: 60px; border-radius: 50%; box-shadow: 0 4px 6px rgba(123, 95, 184, 0.3);" />
          <div>
            <h2 style="font-size: 1.75rem; font-weight: bold; color: #1F2937; margin-bottom: 0.25rem;">
              📚 Biblioteca de Recursos
            </h2>
            <p style="font-size: 0.875rem; color: #6B7280;">
              <span style="color: #7B5FB8; font-weight: 600;">GAL IA</span> te ayuda a organizar plantillas y materiales
            </p>
          </div>
        </div>
        <button 
          onclick="document.getElementById('file-input-resources').click()"
          style="
            background: linear-gradient(135deg, #572c83 0%, #08a48d 100%);
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            border: none;
            cursor: pointer;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            box-shadow: 0 2px 8px rgba(87, 44, 131, 0.2);
            transition: all 0.3s ease;
          "
          onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(87, 44, 131, 0.35)';"
          onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(87, 44, 131, 0.2)';"
        >
          📤 Subir Recurso
        </button>
        <input 
          type="file" 
          id="file-input-resources" 
          style="display: none;" 
          multiple 
          onchange="handleResourceFileInputChange(event)"
        />
      </div>
      
      <!-- Dropzone -->
      ${renderResourceDropzone()}
      
      <!-- Sin Clasificar (destacado) -->
      ${renderUnclassifiedResourcesSection()}
      
      <!-- Carpetas -->
      ${renderResourceFolderGrid()}
      
      <!-- Lista de recursos (si hay carpeta seleccionada) -->
      ${STATE.selectedResourceFolder ? renderResourcesList() : ''}
    </div>
  `);
}

// ============================================
// DROPZONE PARA ARRASTRAR ARCHIVOS
// ============================================
function renderResourceDropzone() {
  return `
    <div 
      id="resource-dropzone"
      ondrop="handleResourceDrop(event)" 
      ondragover="handleResourceDragOver(event)"
      ondragleave="handleResourceDragLeave(event)"
      style="
        border: 3px dashed #C4B5FD;
        border-radius: 0.75rem;
        padding: 2rem;
        text-align: center;
        background: #F5F3FF;
        margin-bottom: 1.5rem;
        transition: all 0.3s ease;
      ">
      <div style="font-size: 3rem; margin-bottom: 0.5rem;">📚</div>
      <p style="font-size: 1rem; color: #7B5FB8; font-weight: 600; margin-bottom: 0.25rem;">
        Arrastra archivos aquí para subirlos
      </p>
      <p style="font-size: 0.875rem; color: #9CA3AF;">
        O haz clic en el botón "Subir Recurso"
      </p>
    </div>
  `;
}

// ============================================
// SECCIÓN SIN CLASIFICAR
// ============================================
function renderUnclassifiedResourcesSection() {
  const count = STATE.unclassifiedResources?.resource_count || 0;
  const totalMB = STATE.unclassifiedResources?.total_size_bytes 
    ? (STATE.unclassifiedResources.total_size_bytes / 1024 / 1024).toFixed(2)
    : '0.00';
  
  return `
    <div 
      id="folder-unclassified"
      onclick="selectResourceFolder('unclassified')"
      ondrop="handleResourceFolderDrop(event, 'unclassified')"
      ondragover="allowResourceDrop(event)"
      style="
        background: white;
        border-radius: 0.75rem;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        cursor: pointer;
        border: 3px dashed #CBD5E1;
        margin-bottom: 1.5rem;
        transition: all 0.3s ease;
        ${STATE.selectedResourceFolder === 'unclassified' ? 'border-color: #7B5FB8; box-shadow: 0 0 0 3px rgba(123, 95, 184, 0.2);' : ''}
      ">
      <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem;">
        <img src="/static/galia-octopus.jpg" alt="GAL IA" style="width: 50px; height: 50px; border-radius: 50%;" />
        <div style="flex: 1;">
          <h3 style="font-size: 1.25rem; font-weight: 600; color: #475569; margin: 0 0 0.25rem 0;">
            📥 Sin Clasificar
          </h3>
          <p style="font-size: 0.875rem; color: #94A3B8; margin: 0;">
            <span style="font-weight: 600;">GAL IA</span> te ayuda a organizar - arrastra recursos aquí
          </p>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 1.5rem; font-weight: bold; color: #7B5FB8;">${count}</div>
          <div style="font-size: 0.75rem; color: #94A3B8;">${totalMB} MB</div>
        </div>
      </div>
    </div>
  `;
}

// ============================================
// GRID DE CARPETAS
// ============================================
function renderResourceFolderGrid() {
  if (!STATE.resourceFolders || STATE.resourceFolders.length === 0) {
    return '<p style="text-align: center; color: #9CA3AF;">No hay carpetas disponibles</p>';
  }
  
  return `
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
      ${STATE.resourceFolders.map(folder => renderResourceFolderCard(folder)).join('')}
    </div>
  `;
}

function renderResourceFolderCard(folder) {
  const count = folder.resource_count || 0;
  const totalMB = folder.total_size_bytes 
    ? (folder.total_size_bytes / 1024 / 1024).toFixed(2)
    : '0.00';
  
  const isSelected = STATE.selectedResourceFolder === String(folder.id);
  
  return `
    <div 
      id="folder-${folder.id}"
      onclick="selectResourceFolder(${folder.id})"
      ondrop="handleResourceFolderDrop(event, ${folder.id})"
      ondragover="allowResourceDrop(event)"
      style="
        background: white;
        border-radius: 0.75rem;
        padding: 1.25rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        cursor: pointer;
        border: 2px solid ${isSelected ? folder.color : 'transparent'};
        transition: all 0.3s ease;
        ${isSelected ? `box-shadow: 0 0 0 3px ${folder.color}20;` : ''}
      "
      onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 16px rgba(0,0,0,0.15)';"
      onmouseout="this.style.transform=''; this.style.boxShadow='${isSelected ? `0 0 0 3px ${folder.color}20` : '0 1px 3px rgba(0,0,0,0.1)'}';">
      <div style="display: flex; align-items: start; justify-content: space-between; margin-bottom: 0.75rem;">
        <div style="font-size: 2rem;">${folder.icon}</div>
        <div style="text-align: right;">
          <div style="font-size: 1.25rem; font-weight: bold; color: ${folder.color};">${count}</div>
          <div style="font-size: 0.75rem; color: #9CA3AF;">recursos</div>
        </div>
      </div>
      <h3 style="font-size: 1rem; font-weight: 600; color: #374151; margin: 0 0 0.25rem 0;">
        ${folder.name}
      </h3>
      <p style="font-size: 0.75rem; color: #9CA3AF; margin: 0 0 0.5rem 0;">
        ${folder.description || ''}
      </p>
      <div style="font-size: 0.75rem; color: #6B7280; font-weight: 500;">
        ${totalMB} MB total
      </div>
    </div>
  `;
}

// ============================================
// LISTA DE RECURSOS
// ============================================
function renderResourcesList() {
  if (!STATE.resources || STATE.resources.length === 0) {
    return `
      <div style="background: white; padding: 3rem; border-radius: 0.75rem; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <img src="/static/galia-octopus.jpg" alt="GAL IA" style="width: 100px; height: 100px; border-radius: 50%; margin: 0 auto 1rem; display: block; opacity: 0.8;" />
        <h3 style="font-size: 1.25rem; font-weight: 600; color: #374151; margin: 0 0 0.5rem 0;">
          No hay recursos en esta carpeta
        </h3>
        <p style="color: #6B7280; margin: 0;">
          Arrastra recursos aquí para organizarlos o sube nuevos archivos
        </p>
      </div>
    `;
  }
  
  return `
    <div style="background: white; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
      <div style="padding: 1rem; border-bottom: 1px solid #E5E7EB; background: #F9FAFB;">
        <h3 style="font-size: 1rem; font-weight: 600; color: #374151; margin: 0;">
          Recursos (${STATE.resources.length})
        </h3>
      </div>
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead style="background: #F9FAFB;">
            <tr>
              <th style="padding: 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6B7280; text-transform: uppercase;">Título</th>
              <th style="padding: 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6B7280; text-transform: uppercase;">Tipo</th>
              <th style="padding: 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6B7280; text-transform: uppercase;">Tamaño</th>
              <th style="padding: 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6B7280; text-transform: uppercase;">Categoría</th>
              <th style="padding: 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6B7280; text-transform: uppercase;">Subido</th>
              <th style="padding: 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6B7280; text-transform: uppercase;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${STATE.resources.map(resource => renderResourceRow(resource)).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderResourceRow(resource) {
  const fileIcon = getFileIcon(resource.file_type);
  const sizeKB = (resource.file_size / 1024).toFixed(2);
  const date = new Date(resource.created_at).toLocaleDateString('es-ES');
  const categoryBadge = getCategoryBadge(resource.category);
  
  return `
    <tr 
      draggable="true"
      ondragstart="handleResourceDragStart(event, ${resource.id})"
      ondragend="handleResourceDragEnd(event)"
      style="border-bottom: 1px solid #F3F4F6; cursor: move;">
      <td style="padding: 1rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="font-size: 1.5rem;">${fileIcon}</div>
          <div>
            <div style="font-weight: 500; color: #374151;">${resource.title}</div>
            <div style="font-size: 0.75rem; color: #9CA3AF;">${resource.filename}</div>
          </div>
        </div>
      </td>
      <td style="padding: 1rem; color: #6B7280; text-transform: uppercase; font-size: 0.875rem; font-weight: 500;">
        ${resource.file_type}
      </td>
      <td style="padding: 1rem; color: #6B7280; font-size: 0.875rem;">
        ${sizeKB} KB
      </td>
      <td style="padding: 1rem;">
        ${categoryBadge}
      </td>
      <td style="padding: 1rem; color: #6B7280; font-size: 0.875rem;">
        ${date}
      </td>
      <td style="padding: 1rem;">
        <div style="display: flex; gap: 0.5rem;">
          <button 
            onclick="viewResource(${resource.id})"
            style="padding: 0.5rem; background: #EEF2FF; color: #6366F1; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 0.875rem;"
            title="Vista previa">
            👁️
          </button>
          <button 
            onclick="downloadResource(${resource.id})"
            style="padding: 0.5rem; background: #DBEAFE; color: #2563EB; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 0.875rem;"
            title="Descargar">
            💾
          </button>
          <button 
            onclick="deleteResource(${resource.id})"
            style="padding: 0.5rem; background: #FEE2E2; color: #DC2626; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 0.875rem;"
            title="Eliminar">
            🗑️
          </button>
        </div>
      </td>
    </tr>
  `;
}

// ============================================
// HELPERS - ICONOS Y BADGES
// ============================================
function getFileIcon(fileType) {
  const icons = {
    'pdf': '📄',
    'doc': '📝', 'docx': '📝',
    'xls': '📊', 'xlsx': '📊',
    'ppt': '📽️', 'pptx': '📽️',
    'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'svg': '🖼️',
    'ai': '🎨', 'psd': '🎨', 'sketch': '🎨',
    'zip': '📦', 'rar': '📦',
    'mp4': '🎥', 'mov': '🎥', 'avi': '🎥',
    'mp3': '🎵', 'wav': '🎵',
  };
  return icons[fileType?.toLowerCase()] || '📎';
}

function getCategoryBadge(category) {
  const badges = {
    'template': '<span style="padding: 0.25rem 0.5rem; background: #DBEAFE; color: #1E40AF; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500;">📋 Plantilla</span>',
    'guide': '<span style="padding: 0.25rem 0.5rem; background: #D1FAE5; color: #065F46; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500;">📖 Guía</span>',
    'logo': '<span style="padding: 0.25rem 0.5rem; background: #FCE7F3; color: #9F1239; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500;">🎯 Logo</span>',
    'design': '<span style="padding: 0.25rem 0.5rem; background: #E0E7FF; color: #3730A3; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500;">🎨 Diseño</span>',
    'document': '<span style="padding: 0.25rem 0.5rem; background: #FEF3C7; color: #92400E; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500;">📄 Documento</span>',
    'other': '<span style="padding: 0.25rem 0.5rem; background: #F3F4F6; color: #6B7280; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500;">📎 Otro</span>',
  };
  return badges[category] || badges['other'];
}

// ============================================
// DRAG & DROP - ARCHIVOS AL DROPZONE
// ============================================
function handleResourceDragOver(event) {
  event.preventDefault();
  const dropzone = document.getElementById('resource-dropzone');
  if (dropzone) {
    dropzone.style.borderColor = '#7B5FB8';
    dropzone.style.background = '#EDE9FE';
    dropzone.style.transform = 'scale(1.02)';
  }
}

function handleResourceDragLeave(event) {
  const dropzone = document.getElementById('resource-dropzone');
  if (dropzone) {
    dropzone.style.borderColor = '#C4B5FD';
    dropzone.style.background = '#F5F3FF';
    dropzone.style.transform = '';
  }
}

async function handleResourceDrop(event) {
  event.preventDefault();
  handleResourceDragLeave(event);
  
  const files = event.dataTransfer.files;
  if (files.length > 0) {
    await uploadResourceFiles(Array.from(files));
  }
}

// ============================================
// DRAG & DROP - RECURSOS A CARPETAS
// ============================================
let draggedResourceId = null;

function handleResourceDragStart(event, resourceId) {
  draggedResourceId = resourceId;
  event.dataTransfer.effectAllowed = 'move';
  event.currentTarget.style.opacity = '0.5';
}

function handleResourceDragEnd(event) {
  event.currentTarget.style.opacity = '1';
  draggedResourceId = null;
}

function allowResourceDrop(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
}

async function handleResourceFolderDrop(event, folderId) {
  event.preventDefault();
  event.stopPropagation();
  
  if (!draggedResourceId) return;
  
  try {
    await apiCall(`/resources/${draggedResourceId}`, {
      method: 'PUT',
      body: JSON.stringify({ 
        folder_id: folderId === 'unclassified' ? null : folderId 
      })
    });
    
    showNotification('✅ Recurso movido correctamente', 'success');
    await loadResources();
  } catch (error) {
    console.error('Error moving resource:', error);
    showNotification('❌ Error al mover recurso', 'error');
  }
}

// ============================================
// SUBIR RECURSOS
// ============================================
function handleResourceFileInputChange(event) {
  const files = Array.from(event.target.files);
  if (files.length > 0) {
    uploadResourceFiles(files);
  }
  event.target.value = ''; // Reset input
}

async function uploadResourceFiles(files) {
  for (const file of files) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);
      formData.append('category', 'other');
      formData.append('access_level', 'team');
      
      const response = await fetch('/api/resources/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al subir');
      }
      
      const result = await response.json();
      showNotification(result.message || '✅ Recurso subido', 'success');
      
    } catch (error) {
      console.error('Error uploading resource:', error);
      showNotification(`❌ Error al subir ${file.name}: ${error.message}`, 'error');
    }
  }
  
  await loadResources();
}

// ============================================
// SELECCIONAR CARPETA
// ============================================
function selectResourceFolder(folderId) {
  STATE.selectedResourceFolder = String(folderId);
  loadResources();
}

// ============================================
// VISTA PREVIA DE RECURSO
// ============================================
async function viewResource(resourceId) {
  const resource = STATE.resources.find(r => r.id === resourceId);
  if (!resource) return;
  
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center;
    z-index: 9999; padding: 2rem;
  `;
  
  const canPreview = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'svg'].includes(resource.file_type?.toLowerCase());
  
  let previewHTML = '';
  if (canPreview) {
    if (resource.mime_type?.includes('pdf')) {
      previewHTML = `<iframe src="/api/resources/${resourceId}/download" style="width: 100%; height: 60vh; border: none; border-radius: 0.5rem;"></iframe>`;
    } else if (resource.mime_type?.includes('image')) {
      previewHTML = `<img src="/api/resources/${resourceId}/download" style="max-width: 100%; max-height: 60vh; border-radius: 0.5rem;" />`;
    }
  } else {
    previewHTML = `
      <div style="padding: 3rem; text-align: center; background: #F3F4F6; border-radius: 0.5rem;">
        <div style="font-size: 4rem; margin-bottom: 1rem;">${getFileIcon(resource.file_type)}</div>
        <p style="color: #6B7280; margin: 0;">Vista previa no disponible para este tipo de archivo</p>
        <p style="color: #9CA3AF; font-size: 0.875rem; margin-top: 0.5rem;">Usa el botón de descarga para ver el archivo</p>
      </div>
    `;
  }
  
  modal.innerHTML = `
    <div style="background: white; border-radius: 1rem; max-width: 900px; width: 100%; max-height: 90vh; overflow: auto; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3);">
      <div style="padding: 1.5rem; border-bottom: 1px solid #E5E7EB; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h3 style="margin: 0; font-size: 1.25rem; font-weight: 600; color: #374151;">${resource.title}</h3>
          <p style="margin: 0.25rem 0 0 0; font-size: 0.875rem; color: #9CA3AF;">${resource.filename} • ${(resource.file_size / 1024).toFixed(2)} KB</p>
        </div>
        <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: #F3F4F6; border: none; padding: 0.5rem 1rem; border-radius: 0.375rem; cursor: pointer; font-size: 1.5rem;">✕</button>
      </div>
      <div style="padding: 1.5rem;">
        ${previewHTML}
      </div>
      <div style="padding: 1.5rem; border-top: 1px solid #E5E7EB; display: flex; gap: 1rem; align-items: center;">
        <select id="folder-selector-${resourceId}" style="flex: 1; padding: 0.5rem; border: 1px solid #D1D5DB; border-radius: 0.375rem; font-size: 0.875rem;">
          <option value="">📥 Sin Clasificar</option>
          ${STATE.resourceFolders.map(f => `<option value="${f.id}" ${resource.folder_id === f.id ? 'selected' : ''}>${f.icon} ${f.name}</option>`).join('')}
        </select>
        <button onclick="moveResourceFromPreview(${resourceId})" style="background: linear-gradient(135deg, #7B5FB8 0%, #00D9C0 100%); color: white; padding: 0.5rem 1.5rem; border: none; border-radius: 0.375rem; cursor: pointer; font-weight: 600;">
          💾 Guardar ubicación
        </button>
        <button onclick="downloadResource(${resourceId})" style="background: #3B82F6; color: white; padding: 0.5rem 1.5rem; border: none; border-radius: 0.375rem; cursor: pointer; font-weight: 600;">
          💾 Descargar
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// ============================================
// MOVER RECURSO DESDE PREVIEW
// ============================================
async function moveResourceFromPreview(resourceId) {
  const select = document.getElementById(`folder-selector-${resourceId}`);
  const folderId = select.value || null;
  
  try {
    await apiCall(`/resources/${resourceId}`, {
      method: 'PUT',
      body: JSON.stringify({ folder_id: folderId })
    });
    
    showNotification('✅ Recurso movido correctamente', 'success');
    await loadResources();
    
    // Cerrar modal
    const modal = select.closest('[style*="position: fixed"]');
    if (modal) modal.remove();
    
  } catch (error) {
    console.error('Error moving resource:', error);
    showNotification('❌ Error al mover recurso', 'error');
  }
}

// ============================================
// DESCARGAR RECURSO
// ============================================
function downloadResource(resourceId) {
  window.open(`/api/resources/${resourceId}/download`, '_blank');
}

// ============================================
// ELIMINAR RECURSO
// ============================================
async function deleteResource(resourceId) {
  const resource = STATE.resources.find(r => r.id === resourceId);
  if (!resource) return;
  
  if (!confirm(`¿Eliminar "${resource.title}"?`)) return;
  
  try {
    await apiCall(`/resources/${resourceId}`, {
      method: 'DELETE'
    });
    
    showNotification('✅ Recurso eliminado', 'success');
    await loadResources();
    
  } catch (error) {
    console.error('Error deleting resource:', error);
    showNotification('❌ Error al eliminar recurso', 'error');
  }
}

console.log('✅ Resources module loaded');
