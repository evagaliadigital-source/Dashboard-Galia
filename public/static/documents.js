// ============================================
// DOCUMENTS MODULE - GESTIÓN MANUAL DE DOCUMENTOS
// ============================================
// Clasificación 100% manual con drag & drop

// Extender STATE global (ya declarado en full-app.js)
(function() {
  if (typeof STATE !== 'undefined') {
    STATE.documents = STATE.documents || [];
    STATE.documentFolders = STATE.documentFolders || [];
    STATE.unclassified = STATE.unclassified || { document_count: 0 };
    STATE.selectedDocumentFolder = STATE.selectedDocumentFolder || 'unclassified';
  }
})();

// ============================================
// CARGAR DOCUMENTOS Y CARPETAS
// ============================================
async function loadDocuments() {
  try {
    console.log('📄 loadDocuments: Cargando carpetas...');
    // Cargar carpetas con estadísticas
    const foldersData = await apiCall('/documents/folders');
    console.log('📄 loadDocuments: Carpetas recibidas:', foldersData);
    STATE.documentFolders = foldersData.folders || [];
    STATE.unclassified = foldersData.unclassified || { document_count: 0 };
    console.log('📄 loadDocuments: STATE.documentFolders:', STATE.documentFolders.length);
    
    // Cargar documentos filtrados
    const params = new URLSearchParams();
    if (STATE.selectedDocumentFolder) {
      params.append('folder', STATE.selectedDocumentFolder);
    }
    
    const docsData = await apiCall(`/documents?${params.toString()}`);
    STATE.documents = docsData.documents || [];
    
    if (STATE.currentView === 'documents') {
      render();
    }
  } catch (error) {
    console.error('Error loading documents:', error);
    showNotification('❌ Error al cargar documentos', 'error');
  }
}

// ============================================
// RENDERIZAR VISTA DE DOCUMENTOS
// ============================================
function renderDocuments() {
  return renderLayout(`
    <div style="padding: 1.5rem; max-width: 1400px; margin: 0 auto;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <img src="/static/galia-octopus.jpg" alt="GAL IA" style="width: 60px; height: 60px; border-radius: 50%; box-shadow: 0 4px 6px rgba(147, 51, 234, 0.3);" />
          <div>
            <h2 style="font-size: 1.75rem; font-weight: bold; color: #1F2937; margin-bottom: 0.25rem;">
              📁 Gestión de Documentos
            </h2>
            <p style="font-size: 0.875rem; color: #6B7280;">
              <span style="color: #9333EA; font-weight: 600;">GAL IA</span> te ayuda a organizar tus documentos
            </p>
          </div>
        </div>
        <button 
          onclick="document.getElementById('file-input-documents').click()"
          style="
            background: linear-gradient(135deg, #9333EA 0%, #7C3AED 100%);
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            border: none;
            cursor: pointer;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            box-shadow: 0 4px 6px rgba(147, 51, 234, 0.3);
          ">
          📤 Subir Documentos
        </button>
        <input 
          type="file" 
          id="file-input-documents" 
          style="display: none;" 
          multiple 
          onchange="handleFileInputChange(event)"
        />
      </div>
      
      <!-- Dropzone -->
      ${renderDropzone()}
      
      <!-- Sin Clasificar (destacado) -->
      ${renderUnclassifiedSection()}
      
      <!-- Carpetas -->
      ${renderFolderGrid()}
      
      <!-- Lista de documentos -->
      ${renderDocumentsList()}
    </div>
  `);
}

// ============================================
// DROPZONE
// ============================================
function renderDropzone() {
  return `
    <div
      id="dropzone"
      ondrop="handleFileDrop(event)"
      ondragover="handleDragOver(event)"
      ondragleave="handleDragLeave(event)"
      style="
        border: 2px dashed #D1D5DB;
        border-radius: 0.75rem;
        padding: 2rem;
        text-align: center;
        background: #F9FAFB;
        margin-bottom: 1.5rem;
        transition: all 0.3s;
        cursor: pointer;
      "
      onclick="document.getElementById('file-input-documents').click()">
      
      <div style="font-size: 3rem; margin-bottom: 0.5rem;">📥</div>
      <p style="font-size: 1rem; font-weight: 600; color: #374151; margin-bottom: 0.25rem;">
        Arrastra archivos aquí o haz click para seleccionar
      </p>
      <p style="font-size: 0.875rem; color: #6B7280;">
        Máximo 50MB por archivo • PDF, Word, Excel, imágenes
      </p>
    </div>
  `;
}

// ============================================
// SIN CLASIFICAR (Destacado arriba)
// ============================================
function renderUnclassifiedSection() {
  const count = STATE.unclassified.document_count || 0;
  const isSelected = STATE.selectedDocumentFolder === 'unclassified';
  
  return `
    <div
      id="folder-unclassified"
      onclick="filterByFolder('unclassified')"
      ondrop="handleFolderDrop(event, 'unclassified')"
      ondragover="handleFolderDragOver(event)"
      ondragleave="handleFolderDragLeave(event)"
      style="
        background: ${isSelected ? 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)' : 'white'};
        border: 3px ${isSelected ? 'solid' : 'dashed'} #F59E0B;
        border-radius: 0.75rem;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        cursor: pointer;
        transition: all 0.3s;
        box-shadow: ${isSelected ? '0 10px 15px rgba(245, 158, 11, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)'};
      "
      onmouseover="if(!${isSelected}) { this.style.borderColor='#F59E0B'; this.style.boxShadow='0 6px 10px rgba(245, 158, 11, 0.2)'; }"
      onmouseout="if(!${isSelected}) { this.style.borderColor='#F59E0B'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'; }">
      
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <img src="/static/galia-octopus.jpg" alt="GAL IA" style="width: 50px; height: 50px; border-radius: 50%; box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);" />
          <div>
            <h3 style="font-size: 1.25rem; font-weight: bold; color: #92400E; margin-bottom: 0.25rem;">
              📥 Sin Clasificar
            </h3>
            <p style="font-size: 0.875rem; color: #78350F;">
              <span style="font-weight: 600;">GAL IA</span> te ayuda a organizar - arrastra documentos aquí
            </p>
          </div>
        </div>
        
        <div style="text-align: right;">
          <div style="font-size: 2rem; font-weight: bold; color: #92400E;">
            ${count}
          </div>
          <div style="font-size: 0.75rem; color: #78350F;">
            ${count === 1 ? 'documento' : 'documentos'}
          </div>
        </div>
      </div>
      
      ${count > 0 ? `
        <div style="
          margin-top: 1rem;
          padding: 0.75rem;
          background: rgba(245, 158, 11, 0.1);
          border-radius: 0.5rem;
          text-align: center;
        ">
          <span style="font-size: 0.875rem; color: #92400E; font-weight: 600;">
            ⚠️ ${count} ${count === 1 ? 'documento pendiente' : 'documentos pendientes'} de organizar
          </span>
        </div>
      ` : ''}
    </div>
  `;
}

// ============================================
// GRID DE CARPETAS
// ============================================
function renderFolderGrid() {
  console.log('📂 renderFolderGrid: STATE.documentFolders:', STATE.documentFolders);
  if (!STATE.documentFolders || STATE.documentFolders.length === 0) {
    console.log('📂 renderFolderGrid: No hay carpetas, mostrando loading');
    return `
      <div style="margin-bottom: 1.5rem; text-align: center; padding: 2rem; background: #F9FAFB; border-radius: 0.5rem;">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">⏳</div>
        <p style="color: #6B7280;">Cargando carpetas...</p>
      </div>
    `;
  }
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 1.125rem; font-weight: 600; color: #374151; margin-bottom: 1rem;">
        📂 Carpetas
      </h3>
      
      <div style="
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 1rem;
      ">
        ${STATE.documentFolders.map(folder => {
          const isSelected = STATE.selectedDocumentFolder == folder.id;
          
          return `
            <div 
              id="folder-${folder.id}"
              onclick="filterByFolder(${folder.id})"
              ondrop="handleFolderDrop(event, ${folder.id})"
              ondragover="handleFolderDragOver(event)"
              ondragleave="handleFolderDragLeave(event)"
              style="
                background: ${isSelected ? folder.color + '15' : 'white'};
                border: 2px solid ${isSelected ? folder.color : '#E5E7EB'};
                border-radius: 0.5rem;
                padding: 1.25rem;
                cursor: pointer;
                transition: all 0.2s;
                box-shadow: ${isSelected ? '0 4px 6px ' + folder.color + '30' : '0 1px 3px rgba(0,0,0,0.1)'};
              "
              onmouseover="if(!${isSelected}) { this.style.borderColor='${folder.color}'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 6px rgba(0,0,0,0.15)'; }"
              onmouseout="if(!${isSelected}) { this.style.borderColor='#E5E7EB'; this.style.transform='translateY(0)'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.1)'; }">
              
              <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                <span style="font-size: 1.75rem;">${folder.icon}</span>
                <span style="font-size: 0.875rem; font-weight: 600; color: ${folder.color}; line-height: 1.2;">
                  ${folder.name.replace('Documentos - ', '')}
                </span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 1.5rem; font-weight: bold; color: #1F2937;">
                  ${folder.document_count || 0}
                </span>
                <span style="font-size: 0.75rem; color: #9CA3AF;">
                  ${folder.total_size_mb ? folder.total_size_mb + ' MB' : '0 MB'}
                </span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// ============================================
// LISTA DE DOCUMENTOS
// ============================================
function renderDocumentsList() {
  if (!STATE.documents || STATE.documents.length === 0) {
    const isUnclassified = STATE.selectedDocumentFolder === 'unclassified';
    
    return `
      <div style="background: white; border-radius: 0.75rem; padding: 3rem; text-align: center;">
        <img src="/static/galia-octopus.jpg" alt="GAL IA" style="width: 100px; height: 100px; border-radius: 50%; margin: 0 auto 1rem; box-shadow: 0 8px 16px rgba(147, 51, 234, 0.3);" />
        <p style="font-size: 1.125rem; font-weight: 600; color: #6B7280; margin-bottom: 0.5rem;">
          ${isUnclassified ? '¡Excelente! Todo organizado' : 'No hay documentos en esta carpeta'}
        </p>
        <p style="font-size: 0.875rem; color: #9CA3AF;">
          ${isUnclassified ? '🎉 GAL IA está feliz - todos los documentos clasificados' : 'Sube documentos y arrástralos aquí para organizarlos'}
        </p>
      </div>
    `;
  }
  
  return `
    <div style="background: white; border-radius: 0.75rem; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="padding: 1rem 1.5rem; background: #F9FAFB; border-bottom: 1px solid #E5E7EB;">
        <h3 style="font-size: 1rem; font-weight: 600; color: #374151;">
          📄 ${STATE.documents.length} ${STATE.documents.length === 1 ? 'Documento' : 'Documentos'}
        </h3>
      </div>
      
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead style="background: #F9FAFB; border-bottom: 1px solid #E5E7EB;">
            <tr>
              <th style="padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6B7280; text-transform: uppercase;">
                Documento
              </th>
              <th style="padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6B7280; text-transform: uppercase;">
                Carpeta
              </th>
              <th style="padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6B7280; text-transform: uppercase;">
                Tamaño
              </th>
              <th style="padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6B7280; text-transform: uppercase;">
                Fecha
              </th>
              <th style="padding: 0.75rem 1rem; text-align: center; font-size: 0.75rem; font-weight: 600; color: #6B7280; text-transform: uppercase;">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            ${STATE.documents.map((doc, index) => `
              <tr 
                draggable="true"
                ondragstart="handleDocumentDragStart(event, ${doc.id})"
                ondragend="handleDocumentDragEnd(event)"
                style="
                  border-bottom: 1px solid #F3F4F6;
                  transition: background 0.2s;
                  cursor: move;
                "
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background='white'">
                
                <td style="padding: 1rem;">
                  <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <span style="font-size: 1.5rem;">${getFileIcon(doc.file_type)}</span>
                    <div>
                      <div style="font-weight: 500; color: #1F2937; margin-bottom: 0.125rem;">
                        ${doc.original_filename}
                      </div>
                      <div style="font-size: 0.75rem; color: #9CA3AF;">
                        ${doc.file_type.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </td>
                
                <td style="padding: 1rem;">
                  ${doc.folder_id ? `
                    <span style="
                      display: inline-flex;
                      align-items: center;
                      gap: 0.375rem;
                      padding: 0.25rem 0.75rem;
                      background: ${doc.folder_color}15;
                      color: ${doc.folder_color};
                      border-radius: 0.375rem;
                      font-size: 0.75rem;
                      font-weight: 500;
                    ">
                      ${doc.folder_icon} ${doc.folder_name.replace('Documentos - ', '')}
                    </span>
                  ` : `
                    <span style="
                      display: inline-flex;
                      align-items: center;
                      gap: 0.375rem;
                      padding: 0.25rem 0.75rem;
                      background: #FEF3C7;
                      color: #92400E;
                      border-radius: 0.375rem;
                      font-size: 0.75rem;
                      font-weight: 500;
                    ">
                      📥 Sin Clasificar
                    </span>
                  `}
                </td>
                
                <td style="padding: 1rem;">
                  <span style="font-size: 0.875rem; color: #6B7280;">
                    ${formatFileSize(doc.file_size)}
                  </span>
                </td>
                
                <td style="padding: 1rem;">
                  <span style="font-size: 0.875rem; color: #6B7280;">
                    ${formatDate(doc.uploaded_at)}
                  </span>
                </td>
                
                <td style="padding: 1rem; text-align: center;">
                  <div style="display: flex; justify-content: center; gap: 0.5rem;">
                    <button
                      onclick="viewDocument(${doc.id})"
                      style="
                        padding: 0.5rem 0.75rem;
                        background: #9333EA;
                        color: white;
                        border: none;
                        border-radius: 0.375rem;
                        cursor: pointer;
                        font-size: 0.875rem;
                        transition: all 0.2s;
                      "
                      onmouseover="this.style.background='#7C3AED'"
                      onmouseout="this.style.background='#9333EA'">
                      👁️ Ver
                    </button>
                    
                    <button
                      onclick="downloadDocument(${doc.id})"
                      style="
                        padding: 0.5rem 0.75rem;
                        background: #3B82F6;
                        color: white;
                        border: none;
                        border-radius: 0.375rem;
                        cursor: pointer;
                        font-size: 0.875rem;
                        transition: all 0.2s;
                      "
                      onmouseover="this.style.background='#2563EB'"
                      onmouseout="this.style.background='#3B82F6'">
                      📥
                    </button>
                    
                    <button
                      onclick="deleteDocument(${doc.id})"
                      style="
                        padding: 0.5rem 0.75rem;
                        background: #EF4444;
                        color: white;
                        border: none;
                        border-radius: 0.375rem;
                        cursor: pointer;
                        font-size: 0.875rem;
                        transition: all 0.2s;
                      "
                      onmouseover="this.style.background='#DC2626'"
                      onmouseout="this.style.background='#EF4444'">
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ============================================
// DRAG & DROP HANDLERS
// ============================================
function handleDragOver(event) {
  event.preventDefault();
  event.currentTarget.style.borderColor = '#9333EA';
  event.currentTarget.style.background = '#F3E8FF';
}

function handleDragLeave(event) {
  event.currentTarget.style.borderColor = '#D1D5DB';
  event.currentTarget.style.background = '#F9FAFB';
}

async function handleFileDrop(event) {
  event.preventDefault();
  event.stopPropagation();
  
  const dropzone = event.currentTarget;
  dropzone.style.borderColor = '#D1D5DB';
  dropzone.style.background = '#F9FAFB';
  
  const files = event.dataTransfer.files;
  if (files.length > 0) {
    await uploadFiles(files);
  }
}

function handleFileInputChange(event) {
  const files = event.target.files;
  if (files.length > 0) {
    uploadFiles(files);
  }
}

// Drag & drop de documentos a carpetas
let draggedDocumentId = null;

function handleDocumentDragStart(event, documentId) {
  draggedDocumentId = documentId;
  event.dataTransfer.effectAllowed = 'move';
  event.currentTarget.style.opacity = '0.5';
}

function handleDocumentDragEnd(event) {
  event.currentTarget.style.opacity = '1';
  draggedDocumentId = null;
}

function handleFolderDragOver(event) {
  event.preventDefault();
  event.stopPropagation();
  event.dataTransfer.dropEffect = 'move';
  
  const folder = event.currentTarget;
  folder.style.transform = 'scale(1.05)';
  folder.style.boxShadow = '0 10px 20px rgba(147, 51, 234, 0.3)';
}

function handleFolderDragLeave(event) {
  const folder = event.currentTarget;
  folder.style.transform = 'scale(1)';
  folder.style.boxShadow = '';
}

async function handleFolderDrop(event, folderId) {
  event.preventDefault();
  event.stopPropagation();
  
  const folder = event.currentTarget;
  folder.style.transform = 'scale(1)';
  folder.style.boxShadow = '';
  
  if (!draggedDocumentId) return;
  
  try {
    // Mover documento a carpeta
    await apiCall(`/documents/${draggedDocumentId}`, {
      method: 'PUT',
      body: JSON.stringify({
        folder_id: folderId === 'unclassified' ? null : folderId
      })
    });
    
    showNotification('✅ Documento movido correctamente', 'success');
    await loadDocuments();
  } catch (error) {
    console.error('Error moving document:', error);
    showNotification('❌ Error al mover documento', 'error');
  }
}

// ============================================
// UPLOAD FILES
// ============================================
async function uploadFiles(files) {
  const fileArray = Array.from(files);
  
  for (const file of fileArray) {
    try {
      showNotification(`⏳ Subiendo ${file.name}...`, 'info');
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      
      const result = await response.json();
      showNotification(result.message || '✅ Documento subido', 'success');
      
    } catch (error) {
      console.error('Error uploading file:', error);
      showNotification(`❌ Error al subir ${file.name}`, 'error');
    }
  }
  
  // Recargar documentos
  await loadDocuments();
}

// ============================================
// FILTRAR POR CARPETA
// ============================================
function filterByFolder(folderId) {
  STATE.selectedDocumentFolder = folderId;
  loadDocuments();
}

// ============================================
// DESCARGAR DOCUMENTO
// ============================================
async function downloadDocument(docId) {
  try {
    window.open(`/api/documents/${docId}/download`, '_blank');
  } catch (error) {
    console.error('Error downloading document:', error);
    showNotification('❌ Error al descargar documento', 'error');
  }
}

// ============================================
// ELIMINAR DOCUMENTO
// ============================================
async function deleteDocument(docId) {
  if (!confirm('¿Seguro que quieres eliminar este documento?')) {
    return;
  }
  
  try {
    await apiCall(`/documents/${docId}`, { method: 'DELETE' });
    showNotification('✅ Documento eliminado', 'success');
    await loadDocuments();
  } catch (error) {
    console.error('Error deleting document:', error);
    showNotification('❌ Error al eliminar documento', 'error');
  }
}

// ============================================
// UTILIDADES
// ============================================
function getFileIcon(fileType) {
  const type = fileType.toLowerCase();
  if (type.includes('pdf')) return '📄';
  if (type.includes('word') || type.includes('doc')) return '📝';
  if (type.includes('excel') || type.includes('sheet') || type.includes('csv')) return '📊';
  if (type.includes('image') || type.includes('png') || type.includes('jpg') || type.includes('jpeg')) return '🖼️';
  if (type.includes('zip') || type.includes('rar')) return '📦';
  return '📎';
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins}m`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ============================================
// VER DOCUMENTO (PREVIEW)
// ============================================
async function viewDocument(docId) {
  try {
    // Obtener información del documento
    const doc = STATE.documents.find(d => d.id === docId);
    if (!doc) {
      showNotification('❌ Documento no encontrado', 'error');
      return;
    }
    
    // Crear modal de preview
    const modal = document.createElement('div');
    modal.id = 'document-preview-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.75);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 2rem;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      border-radius: 1rem;
      max-width: 1200px;
      max-height: 90vh;
      width: 100%;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
    `;
    
    // Header del modal
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 1.5rem;
      border-bottom: 1px solid #E5E7EB;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, #9333EA 0%, #7C3AED 100%);
      border-radius: 1rem 1rem 0 0;
    `;
    header.innerHTML = `
      <div>
        <h3 style="color: white; font-size: 1.25rem; font-weight: 600; margin-bottom: 0.25rem;">
          ${getFileIcon(doc.file_type)} ${doc.original_filename}
        </h3>
        <p style="color: rgba(255,255,255,0.8); font-size: 0.875rem;">
          ${doc.file_type.toUpperCase()} • ${formatFileSize(doc.file_size)}
        </p>
      </div>
      <button 
        onclick="closeDocumentPreview()"
        style="
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 1.5rem;
          transition: all 0.2s;
        "
        onmouseover="this.style.background='rgba(255,255,255,0.3)'"
        onmouseout="this.style.background='rgba(255,255,255,0.2)'">
        ×
      </button>
    `;
    
    // Body del modal con preview
    const body = document.createElement('div');
    body.style.cssText = `
      flex: 1;
      overflow: auto;
      padding: 1.5rem;
      background: #F9FAFB;
    `;
    
    // Renderizar preview según tipo de archivo
    const previewUrl = `/api/documents/${docId}/download`;
    let previewHTML = '';
    
    if (doc.mime_type?.includes('image')) {
      previewHTML = `
        <div style="text-align: center;">
          <img src="${previewUrl}" style="max-width: 100%; max-height: 60vh; border-radius: 0.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
        </div>
      `;
    } else if (doc.mime_type?.includes('pdf')) {
      previewHTML = `
        <iframe src="${previewUrl}" style="width: 100%; height: 60vh; border: none; border-radius: 0.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"></iframe>
      `;
    } else {
      previewHTML = `
        <div style="text-align: center; padding: 3rem; color: #6B7280;">
          <div style="font-size: 4rem; margin-bottom: 1rem;">${getFileIcon(doc.file_type)}</div>
          <p style="font-size: 1.125rem; font-weight: 500; margin-bottom: 0.5rem;">
            Vista previa no disponible para este tipo de archivo
          </p>
          <p style="font-size: 0.875rem; margin-bottom: 1.5rem;">
            ${doc.file_type.toUpperCase()} • ${formatFileSize(doc.file_size)}
          </p>
          <button
            onclick="downloadDocument(${docId})"
            style="
              background: #3B82F6;
              color: white;
              padding: 0.75rem 1.5rem;
              border: none;
              border-radius: 0.5rem;
              cursor: pointer;
              font-weight: 500;
            ">
            📥 Descargar para ver
          </button>
        </div>
      `;
    }
    
    body.innerHTML = previewHTML;
    
    // Footer con selector de carpeta
    const footer = document.createElement('div');
    footer.style.cssText = `
      padding: 1.5rem;
      border-top: 1px solid #E5E7EB;
      background: white;
      border-radius: 0 0 1rem 1rem;
    `;
    
    footer.innerHTML = `
      <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
        <label style="font-weight: 600; color: #374151; min-width: 120px;">
          📂 Mover a carpeta:
        </label>
        <select 
          id="folder-selector-${docId}"
          style="
            flex: 1;
            padding: 0.75rem;
            border: 2px solid #E5E7EB;
            border-radius: 0.5rem;
            font-size: 1rem;
            cursor: pointer;
          ">
          <option value="">📥 Sin Clasificar</option>
          ${STATE.documentFolders.map(folder => `
            <option value="${folder.id}" ${doc.folder_id == folder.id ? 'selected' : ''}>
              ${folder.icon} ${folder.name.replace('Documentos - ', '')}
            </option>
          `).join('')}
        </select>
      </div>
      
      <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
        <button
          onclick="closeDocumentPreview()"
          style="
            padding: 0.75rem 1.5rem;
            background: #F3F4F6;
            color: #374151;
            border: none;
            border-radius: 0.5rem;
            cursor: pointer;
            font-weight: 500;
          ">
          Cancelar
        </button>
        <button
          onclick="moveDocumentFromPreview(${docId})"
          style="
            padding: 0.75rem 1.5rem;
            background: linear-gradient(135deg, #9333EA 0%, #7C3AED 100%);
            color: white;
            border: none;
            border-radius: 0.5rem;
            cursor: pointer;
            font-weight: 500;
            box-shadow: 0 4px 6px rgba(147, 51, 234, 0.3);
          ">
          💾 Guardar ubicación
        </button>
      </div>
    `;
    
    modalContent.appendChild(header);
    modalContent.appendChild(body);
    modalContent.appendChild(footer);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Cerrar con ESC
    document.addEventListener('keydown', function closeOnEsc(e) {
      if (e.key === 'Escape') {
        closeDocumentPreview();
        document.removeEventListener('keydown', closeOnEsc);
      }
    });
    
  } catch (error) {
    console.error('Error viewing document:', error);
    showNotification('❌ Error al abrir documento', 'error');
  }
}

function closeDocumentPreview() {
  const modal = document.getElementById('document-preview-modal');
  if (modal) {
    modal.remove();
  }
}

async function moveDocumentFromPreview(docId) {
  try {
    const selector = document.getElementById(`folder-selector-${docId}`);
    const folderId = selector.value ? parseInt(selector.value) : null;
    
    await apiCall(`/documents/${docId}`, {
      method: 'PUT',
      body: JSON.stringify({
        folder_id: folderId
      })
    });
    
    showNotification('✅ Documento movido correctamente', 'success');
    closeDocumentPreview();
    await loadDocuments();
  } catch (error) {
    console.error('Error moving document:', error);
    showNotification('❌ Error al mover documento', 'error');
  }
}

// ============================================
// EXPORTS
// ============================================
window.renderDocuments = renderDocuments;
window.loadDocuments = loadDocuments;
window.handleFileDrop = handleFileDrop;
window.handleDragOver = handleDragOver;
window.handleDragLeave = handleDragLeave;
window.handleFileInputChange = handleFileInputChange;
window.handleDocumentDragStart = handleDocumentDragStart;
window.handleDocumentDragEnd = handleDocumentDragEnd;
window.handleFolderDrop = handleFolderDrop;
window.handleFolderDragOver = handleFolderDragOver;
window.handleFolderDragLeave = handleFolderDragLeave;
window.filterByFolder = filterByFolder;
window.uploadFiles = uploadFiles;
window.downloadDocument = downloadDocument;
window.deleteDocument = deleteDocument;
window.viewDocument = viewDocument;
window.closeDocumentPreview = closeDocumentPreview;
window.moveDocumentFromPreview = moveDocumentFromPreview;

console.log('📄 Documents module loaded (MANUAL CLASSIFICATION + PREVIEW)');
