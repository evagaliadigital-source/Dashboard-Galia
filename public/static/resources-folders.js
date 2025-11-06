// ============================================
// GALIA DIGITAL - EXPLORADOR DE CARPETAS Y RECURSOS
// ============================================

console.log('📁 Sistema de carpetas cargando...');

// Estado de navegación de carpetas
STATE.currentFolderId = null; // null = raíz
STATE.folders = [];
STATE.resources = [];
STATE.breadcrumb = [];
STATE.searchQuery = '';
STATE.filterType = 'all'; // all, template, guide, document, other
STATE.filterDate = 'all'; // all, today, week, month

// Cargar carpetas y recursos
async function loadFoldersAndResources(folderId = null) {
  try {
    // Cargar todas las carpetas para los selectores de modales
    if (!STATE.allFolders) {
      const allFoldersData = await apiCall('/folders');
      STATE.allFolders = allFoldersData.folders || [];
    }
    
    if (folderId) {
      // Cargar carpeta específica
      const data = await apiCall(`/folders/${folderId}`);
      STATE.currentFolderId = folderId;
      STATE.folders = data.children || [];
      STATE.resources = data.resources || [];
      
      // Obtener breadcrumb
      const breadcrumbData = await apiCall(`/folders/${folderId}/breadcrumb`);
      STATE.breadcrumb = breadcrumbData.breadcrumb || [];
    } else {
      // Cargar raíz
      const data = await apiCall('/folders/root/contents');
      STATE.currentFolderId = null;
      STATE.folders = data.folders || [];
      STATE.resources = data.resources || [];
      STATE.breadcrumb = [];
    }
    
    render();
  } catch (error) {
    console.error('Error cargando carpetas:', error);
    showNotification('Error al cargar carpetas', 'error');
  }
}

// Aplicar filtros y búsqueda
function getFilteredResources() {
  let filtered = STATE.resources || [];
  
  // Búsqueda por texto
  if (STATE.searchQuery) {
    const query = STATE.searchQuery.toLowerCase();
    filtered = filtered.filter(r => 
      r.title.toLowerCase().includes(query) || 
      (r.description && r.description.toLowerCase().includes(query))
    );
  }
  
  // Filtro por tipo
  if (STATE.filterType !== 'all') {
    filtered = filtered.filter(r => r.category === STATE.filterType);
  }
  
  // Filtro por fecha
  if (STATE.filterDate !== 'all') {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    filtered = filtered.filter(r => {
      const created = new Date(r.created_at);
      const createdDate = new Date(created.getFullYear(), created.getMonth(), created.getDate());
      
      switch(STATE.filterDate) {
        case 'today':
          return createdDate.getTime() === today.getTime();
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          return createdDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          return createdDate >= monthAgo;
        default:
          return true;
      }
    });
  }
  
  return filtered;
}

// Renderizar vista de recursos con explorador de carpetas
function renderResources() {
  const folders = STATE.folders || [];
  const allResources = STATE.resources || [];
  const filteredResources = getFilteredResources();
  const breadcrumb = STATE.breadcrumb || [];
  
  return renderLayout(`
    <!-- Header con breadcrumb -->
    <div style="margin-bottom: 2rem;">
      <!-- Breadcrumb de navegación -->
      <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap;">
        <button onclick="loadFoldersAndResources(null)" style="background: transparent; border: none; color: #7B5FB8; cursor: pointer; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; font-weight: 600;">
          🏠 Inicio
        </button>
        ${breadcrumb.map(folder => `
          <span style="color: #6B7280;">›</span>
          <button onclick="loadFoldersAndResources(${folder.id})" style="background: transparent; border: none; color: #7B5FB8; cursor: pointer; font-size: 1rem; padding: 0.5rem; font-weight: 600;">
            ${folder.icon} ${folder.name}
          </button>
        `).join('')}
      </div>
      
      <!-- Header con título y botones -->
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h1 style="font-size: 2rem; font-weight: bold; color: #2D2C3E; margin: 0;">
          📚 Biblioteca de Recursos
        </h1>
        <div style="display: flex; gap: 0.75rem;">
          <button onclick="showNewFolderModal()" style="background: #7B5FB8; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600;">
            📁 Nueva Carpeta
          </button>
          <button onclick="showNewResourceModal()" style="background: linear-gradient(135deg, #7B5FB8 0%, #00D9C0 100%); color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600;">
            ➕ Subir Recurso
          </button>
        </div>
      </div>
      
      <!-- Barra de búsqueda y filtros -->
      <div style="background: white; padding: 1rem; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-top: 1rem;">
        <div style="display: grid; grid-template-columns: 1fr auto auto; gap: 1rem; align-items: center;">
          <!-- Búsqueda -->
          <div style="position: relative;">
            <input 
              type="text" 
              placeholder="🔍 Buscar recursos..." 
              value="${STATE.searchQuery}"
              oninput="handleSearch(this.value)"
              style="width: 100%; padding: 0.75rem 1rem 0.75rem 2.5rem; border: 2px solid #E5E7EB; border-radius: 0.5rem; font-size: 1rem; box-sizing: border-box;"
            />
            <span style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); font-size: 1.25rem;">🔍</span>
          </div>
          
          <!-- Filtro por tipo -->
          <select onchange="handleFilterType(this.value)" style="padding: 0.75rem 1rem; border: 2px solid #E5E7EB; border-radius: 0.5rem; font-size: 1rem; cursor: pointer;">
            <option value="all" ${STATE.filterType === 'all' ? 'selected' : ''}>📁 Todos los tipos</option>
            <option value="template" ${STATE.filterType === 'template' ? 'selected' : ''}>📋 Plantillas</option>
            <option value="guide" ${STATE.filterType === 'guide' ? 'selected' : ''}>📖 Guías</option>
            <option value="document" ${STATE.filterType === 'document' ? 'selected' : ''}>📄 Documentos</option>
            <option value="other" ${STATE.filterType === 'other' ? 'selected' : ''}>📎 Otros</option>
          </select>
          
          <!-- Filtro por fecha -->
          <select onchange="handleFilterDate(this.value)" style="padding: 0.75rem 1rem; border: 2px solid #E5E7EB; border-radius: 0.5rem; font-size: 1rem; cursor: pointer;">
            <option value="all" ${STATE.filterDate === 'all' ? 'selected' : ''}>📅 Todas las fechas</option>
            <option value="today" ${STATE.filterDate === 'today' ? 'selected' : ''}>🕐 Hoy</option>
            <option value="week" ${STATE.filterDate === 'week' ? 'selected' : ''}>📆 Última semana</option>
            <option value="month" ${STATE.filterDate === 'month' ? 'selected' : ''}>📊 Último mes</option>
          </select>
        </div>
        
        <!-- Indicadores de filtros activos -->
        ${(STATE.searchQuery || STATE.filterType !== 'all' || STATE.filterDate !== 'all') ? `
          <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem; flex-wrap: wrap;">
            ${STATE.searchQuery ? `
              <span style="background: #EFF6FF; color: #1E40AF; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; display: flex; align-items: center; gap: 0.5rem;">
                🔍 "${STATE.searchQuery}"
                <button onclick="clearSearch()" style="background: none; border: none; cursor: pointer; font-size: 1rem; padding: 0; line-height: 1;">×</button>
              </span>
            ` : ''}
            ${STATE.filterType !== 'all' ? `
              <span style="background: #F3E8FF; color: #6B21A8; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; display: flex; align-items: center; gap: 0.5rem;">
                Tipo: ${STATE.filterType}
                <button onclick="clearFilterType()" style="background: none; border: none; cursor: pointer; font-size: 1rem; padding: 0; line-height: 1;">×</button>
              </span>
            ` : ''}
            ${STATE.filterDate !== 'all' ? `
              <span style="background: #FEF3C7; color: #92400E; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; display: flex; align-items: center; gap: 0.5rem;">
                Fecha: ${STATE.filterDate}
                <button onclick="clearFilterDate()" style="background: none; border: none; cursor: pointer; font-size: 1rem; padding: 0; line-height: 1;">×</button>
              </span>
            ` : ''}
            <button onclick="clearAllFilters()" style="background: #EF4444; color: white; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; border: none; cursor: pointer; font-weight: 600;">
              Limpiar todo
            </button>
          </div>
        ` : ''}
      </div>
    </div>
    
    <!-- Contenedor de carpetas y archivos -->
    <div style="background: white; padding: 2rem; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); min-height: 400px;">
      ${(folders.length === 0 && filteredResources.length === 0) ? renderEmptyFolder() : ''}
      
      <!-- Grid de carpetas -->
      ${folders.length > 0 ? `
        <div style="margin-bottom: 2rem;">
          <h3 style="font-size: 1.125rem; font-weight: 600; color: #2D2C3E; margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.5rem;">
            📁 Carpetas (${folders.length})
          </h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
            ${folders.map(folder => renderFolderCard(folder)).join('')}
          </div>
        </div>
      ` : ''}
      
      <!-- Grid de recursos -->
      ${filteredResources.length > 0 ? `
        <div>
          <h3 style="font-size: 1.125rem; font-weight: 600; color: #2D2C3E; margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.5rem;">
            📄 Archivos (${filteredResources.length}${allResources.length !== filteredResources.length ? ` de ${allResources.length}` : ''})
          </h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem;">
            ${filteredResources.map(resource => renderResourceCard(resource)).join('')}
          </div>
        </div>
      ` : (allResources.length > 0 ? `
        <div style="text-align: center; padding: 3rem;">
          <div style="font-size: 4rem; margin-bottom: 1rem;">🔍</div>
          <h3 style="font-size: 1.5rem; font-weight: 600; color: #374151; margin: 0 0 0.5rem 0;">No se encontraron recursos</h3>
          <p style="color: #6B7280; margin: 0 0 1.5rem 0;">Intenta con otros filtros o búsqueda</p>
          <button onclick="clearAllFilters()" style="background: linear-gradient(135deg, #7B5FB8 0%, #00D9C0 100%); color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600;">
            Limpiar filtros
          </button>
        </div>
      ` : '')}
    </div>
  `);
}

function renderEmptyFolder() {
  return `
    <div style="text-align: center; padding: 3rem;">
      <div style="font-size: 4rem; margin-bottom: 1rem;">📂</div>
      <h3 style="font-size: 1.5rem; font-weight: 600; color: #374151; margin: 0 0 0.5rem 0;">Carpeta vacía</h3>
      <p style="color: #6B7280; margin: 0 0 1.5rem 0;">Crea subcarpetas o sube recursos para organizarlos</p>
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button onclick="showNewFolderModal()" style="background: #7B5FB8; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600;">
          📁 Nueva Carpeta
        </button>
        <button onclick="showNewResourceModal()" style="background: linear-gradient(135deg, #7B5FB8 0%, #00D9C0 100%); color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600;">
          ➕ Subir Recurso
        </button>
      </div>
    </div>
  `;
}

function renderFolderCard(folder) {
  return `
    <div 
      onclick="loadFoldersAndResources(${folder.id})" 
      draggable="true"
      ondragstart="handleDragStart(event, 'folder', ${folder.id})"
      ondragover="handleDragOver(event)"
      ondrop="handleDrop(event, 'folder', ${folder.id})"
      ondragleave="handleDragLeave(event)"
      data-folder-id="${folder.id}"
      style="
      background: linear-gradient(135deg, ${folder.color}15 0%, ${folder.color}05 100%);
      padding: 1.5rem;
      border-radius: 0.75rem;
      border: 2px solid ${folder.color}30;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    " onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 16px rgba(0,0,0,0.1)'" onmouseout="this.style.transform='none'; this.style.boxShadow='none'">
      <div style="font-size: 3rem; margin-bottom: 0.5rem;">${folder.icon}</div>
      <h4 style="font-size: 1rem; font-weight: 600; color: #2D2C3E; margin: 0 0 0.25rem 0; word-wrap: break-word;">
        ${folder.name}
      </h4>
      ${folder.description ? `<p style="color: #6B7280; font-size: 0.875rem; margin: 0 0 0.5rem 0;">${folder.description}</p>` : ''}
      <div style="display: flex; align-items: center; gap: 0.5rem; color: #6B7280; font-size: 0.875rem;">
        <span>📄 ${folder.resource_count || 0} archivos</span>
      </div>
      
      <!-- Botones de acción (aparecen al hover) -->
      <div onclick="event.stopPropagation()" style="position: absolute; top: 0.5rem; right: 0.5rem; display: flex; gap: 0.25rem; opacity: 0; transition: opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0'">
        <button onclick="editFolder(${folder.id})" style="background: white; border: none; width: 32px; height: 32px; border-radius: 0.375rem; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" title="Editar">
          ✏️
        </button>
        <button onclick="deleteFolder(${folder.id})" style="background: white; border: none; width: 32px; height: 32px; border-radius: 0.375rem; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" title="Eliminar">
          🗑️
        </button>
      </div>
    </div>
  `;
}

function renderResourceCard(resource) {
  const icon = getResourceIcon(resource.file_type || resource.category);
  const accessBadge = getAccessBadge(resource.access_level);
  
  return `
    <div 
      draggable="true"
      ondragstart="handleDragStart(event, 'resource', ${resource.id})"
      data-resource-id="${resource.id}"
      style="
      background: #F9FAFB;
      padding: 1.5rem;
      border-radius: 0.75rem;
      border: 2px solid #E5E7EB;
      transition: all 0.2s;
      position: relative;
    " onmouseover="this.style.transform='translateY(-2px)'; this.style.borderColor='#7B5FB8'" onmouseout="this.style.transform='none'; this.style.borderColor='#E5E7EB'">
      <div style="display: flex; align-items: start; justify-content: space-between; margin-bottom: 0.75rem;">
        <div style="font-size: 2.5rem;">${icon}</div>
        ${accessBadge}
      </div>
      
      <h4 style="font-size: 1rem; font-weight: 600; color: #2D2C3E; margin: 0 0 0.5rem 0; word-wrap: break-word;">
        ${resource.title}
      </h4>
      
      ${resource.description ? `<p style="color: #6B7280; font-size: 0.875rem; margin: 0 0 0.75rem 0; line-height: 1.4;">${resource.description}</p>` : ''}
      
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; color: #6B7280; font-size: 0.75rem;">
        <span>${formatDate(resource.created_at)}</span>
        ${resource.file_size ? `<span>${formatFileSize(resource.file_size)}</span>` : ''}
      </div>
      
      <!-- Botones de acción -->
      <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
        <button onclick="window.open('${resource.file_url}', '_blank')" style="flex: 1; background: linear-gradient(135deg, #7B5FB8 0%, #00D9C0 100%); color: white; padding: 0.5rem; border-radius: 0.375rem; border: none; cursor: pointer; font-weight: 600; font-size: 0.875rem;">
          🔗 Abrir
        </button>
        <button onclick="editResource(${resource.id})" style="background: #F3F4F6; border: none; width: 36px; height: 36px; border-radius: 0.375rem; cursor: pointer; display: flex; align-items: center; justify-content: center;" title="Editar">
          ✏️
        </button>
        <button onclick="deleteResource(${resource.id})" style="background: #FEE2E2; color: #991B1B; border: none; width: 36px; height: 36px; border-radius: 0.375rem; cursor: pointer; display: flex; align-items: center; justify-content: center;" title="Eliminar">
          🗑️
        </button>
      </div>
    </div>
  `;
}

function getResourceIcon(type) {
  const icons = {
    // Por tipo de archivo
    'pdf': '📄',
    'doc': '📝',
    'docx': '📝',
    'xls': '📊',
    'xlsx': '📊',
    'ppt': '📊',
    'pptx': '📊',
    'jpg': '🖼️',
    'jpeg': '🖼️',
    'png': '🖼️',
    'gif': '🎞️',
    'mp4': '🎬',
    'mov': '🎬',
    'zip': '📦',
    'rar': '📦',
    // Por categoría
    'template': '📋',
    'guide': '📖',
    'document': '📄',
    'other': '📎'
  };
  return icons[type] || '📄';
}

function getAccessBadge(level) {
  const badges = {
    'public': '<span style="padding: 0.25rem 0.5rem; font-size: 0.75rem; border-radius: 0.25rem; background: #D1FAE5; color: #065F46;">🌍 Público</span>',
    'team': '<span style="padding: 0.25rem 0.5rem; font-size: 0.75rem; border-radius: 0.25rem; background: #DBEAFE; color: #1E40AF;">👥 Equipo</span>',
    'admin': '<span style="padding: 0.25rem 0.5rem; font-size: 0.75rem; border-radius: 0.25rem; background: #FEE2E2; color: #991B1B;">🔒 Admin</span>'
  };
  return badges[level] || '';
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Las funciones de modales (showNewFolderModal, showNewResourceModal, etc.)
// están implementadas en modals.js

// ============================================
// FUNCIONES DE BÚSQUEDA Y FILTROS
// ============================================

function handleSearch(value) {
  STATE.searchQuery = value;
  render();
}

function handleFilterType(value) {
  STATE.filterType = value;
  render();
}

function handleFilterDate(value) {
  STATE.filterDate = value;
  render();
}

function clearSearch() {
  STATE.searchQuery = '';
  render();
}

function clearFilterType() {
  STATE.filterType = 'all';
  render();
}

function clearFilterDate() {
  STATE.filterDate = 'all';
  render();
}

function clearAllFilters() {
  STATE.searchQuery = '';
  STATE.filterType = 'all';
  STATE.filterDate = 'all';
  render();
}

// ============================================
// DRAG & DROP
// ============================================

let draggedItem = null;

function handleDragStart(event, type, id) {
  event.stopPropagation();
  draggedItem = { type, id };
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/html', event.target.innerHTML);
  event.target.style.opacity = '0.4';
}

function handleDragOver(event) {
  event.preventDefault();
  event.stopPropagation();
  
  if (!draggedItem) return;
  
  // No permitir drop de carpeta sobre sí misma
  const targetFolderId = event.currentTarget.dataset.folderId;
  if (draggedItem.type === 'folder' && draggedItem.id == targetFolderId) {
    event.dataTransfer.dropEffect = 'none';
    return;
  }
  
  event.dataTransfer.dropEffect = 'move';
  event.currentTarget.style.borderColor = '#7B5FB8';
  event.currentTarget.style.background = 'rgba(123, 95, 184, 0.1)';
}

function handleDragLeave(event) {
  event.preventDefault();
  event.stopPropagation();
  event.currentTarget.style.borderColor = '';
  event.currentTarget.style.background = '';
}

async function handleDrop(event, targetType, targetId) {
  event.preventDefault();
  event.stopPropagation();
  
  if (!draggedItem) return;
  
  // Restaurar estilos
  event.currentTarget.style.borderColor = '';
  event.currentTarget.style.background = '';
  document.querySelectorAll('[draggable="true"]').forEach(el => {
    el.style.opacity = '1';
  });
  
  const { type: sourceType, id: sourceId } = draggedItem;
  
  // No hacer nada si es el mismo elemento
  if (sourceType === targetType && sourceId === targetId) {
    draggedItem = null;
    return;
  }
  
  try {
    if (sourceType === 'resource' && targetType === 'folder') {
      // Mover recurso a carpeta
      await apiCall(`/resources/${sourceId}/move`, {
        method: 'PATCH',
        body: JSON.stringify({ folder_id: targetId })
      });
      showNotification('Recurso movido exitosamente', 'success');
      await loadFoldersAndResources(STATE.currentFolderId);
      
    } else if (sourceType === 'folder' && targetType === 'folder') {
      // Mover carpeta dentro de otra carpeta
      // Validar que no sea un ciclo
      if (await isDescendant(targetId, sourceId)) {
        showNotification('No puedes mover una carpeta dentro de sus subcarpetas', 'error');
        draggedItem = null;
        return;
      }
      
      await apiCall(`/folders/${sourceId}/move`, {
        method: 'PATCH',
        body: JSON.stringify({ parent_id: targetId })
      });
      showNotification('Carpeta movida exitosamente', 'success');
      await loadFoldersAndResources(STATE.currentFolderId);
    }
  } catch (error) {
    showNotification(error.message || 'Error al mover', 'error');
  }
  
  draggedItem = null;
}

// Validar si targetId es descendiente de folderId (para evitar ciclos)
async function isDescendant(targetId, folderId) {
  try {
    const { folder } = await apiCall(`/folders/${targetId}`);
    if (!folder.parent_id) return false;
    if (folder.parent_id == folderId) return true;
    return await isDescendant(folder.parent_id, folderId);
  } catch {
    return false;
  }
}

console.log('✅ Sistema de carpetas cargado');
