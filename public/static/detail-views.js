// ============================================
// GALIA DIGITAL - VISTAS DETALLADAS
// ============================================

console.log('🔍 Vistas detalladas cargando...');

// ============================================
// VISTA DETALLADA DE CLIENTE
// ============================================

async function viewClientDetail(id) {
  try {
    // Cargar datos del cliente
    const { client } = await apiCall(`/clients/${id}`);
    const { projects } = await apiCall(`/clients/${id}/projects`);
    const { communications } = await apiCall(`/clients/${id}/communications`);
    
    STATE.selectedItem = { type: 'client', data: client, projects, communications };
    STATE.currentView = 'client-detail';
    render();
  } catch (error) {
    showNotification('Error al cargar cliente', 'error');
  }
}

function renderClientDetail() {
  const { data: client, projects, communications } = STATE.selectedItem || {};
  if (!client) return renderClients();
  
  const activeTab = STATE.clientDetailTab || 'info';
  
  return renderLayout(`
    <div style="margin-bottom: 2rem;">
      <button onclick="navigateTo('clients')" style="background: transparent; border: none; color: #572c83; cursor: pointer; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0; font-weight: 600;">
        ← Volver a Clientes
      </button>
    </div>
    
    <!-- Header del cliente -->
    <div style="background: white; padding: 2rem; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1.5rem;">
        <div>
          <h1 style="font-size: 2rem; font-weight: bold; color: #2D2C3E; margin: 0 0 0.5rem 0;">
            🏢 ${client.business_name}
          </h1>
          <div style="display: flex; align-items: center; gap: 1rem;">
            ${getStatusBadge(client.subscription_status)}
            <span style="color: #6B7280; font-size: 0.875rem;">
              ${client.monthly_fee ? `${client.monthly_fee}€/mes` : 'Sin cuota'}
            </span>
          </div>
        </div>
        <div style="display: flex; gap: 0.75rem;">
          <button onclick="editClient(${client.id})" style="background: linear-gradient(135deg, #572c83 0%, #08a48d 100%); color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600;">
            ✏️ Editar Cliente
          </button>
          <button onclick="deleteClient(${client.id})" style="background: #EF4444; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600;">
            🗑️ Eliminar
          </button>
        </div>
      </div>
      
      <!-- Tabs -->
      <div style="border-bottom: 2px solid #E5E7EB; margin-bottom: 1.5rem;">
        <div style="display: flex; gap: 2rem;">
          <button onclick="switchClientTab('info')" style="background: none; border: none; padding: 0.75rem 0; cursor: pointer; font-weight: 600; color: ${activeTab === 'info' ? '#572c83' : '#6B7280'}; border-bottom: 2px solid ${activeTab === 'info' ? '#572c83' : 'transparent'}; margin-bottom: -2px;">
            📋 Información
          </button>
          <button onclick="switchClientTab('projects')" style="background: none; border: none; padding: 0.75rem 0; cursor: pointer; font-weight: 600; color: ${activeTab === 'projects' ? '#572c83' : '#6B7280'}; border-bottom: 2px solid ${activeTab === 'projects' ? '#572c83' : 'transparent'}; margin-bottom: -2px;">
            📁 Proyectos (${projects?.length || 0})
          </button>
          <button onclick="switchClientTab('communications')" style="background: none; border: none; padding: 0.75rem 0; cursor: pointer; font-weight: 600; color: ${activeTab === 'communications' ? '#572c83' : '#6B7280'}; border-bottom: 2px solid ${activeTab === 'communications' ? '#572c83' : 'transparent'}; margin-bottom: -2px;">
            💬 Comunicaciones (${communications?.length || 0})
          </button>
        </div>
      </div>
      
      <!-- Contenido del tab -->
      ${renderClientTab(activeTab, client, projects, communications)}
    </div>
  `);
}

function switchClientTab(tab) {
  STATE.clientDetailTab = tab;
  render();
}

function renderClientTab(tab, client, projects, communications) {
  switch(tab) {
    case 'info':
      return renderClientInfo(client);
    case 'projects':
      return renderClientProjects(projects, client);
    case 'communications':
      return renderClientCommunications(communications);
    default:
      return '';
  }
}

function renderClientInfo(client) {
  return `
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem;">
      <!-- Columna izquierda -->
      <div>
        <h3 style="color: #572c83; font-weight: 700; margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.5rem;">
          <span>📋</span> INFORMACIÓN DEL NEGOCIO
        </h3>
        
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <div>
            <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #6B7280; margin-bottom: 0.25rem; text-transform: uppercase;">Nombre del negocio</label>
            <p style="margin: 0; color: #2D2C3E; font-size: 1rem;">${client.business_name}</p>
          </div>
          
          <div>
            <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #6B7280; margin-bottom: 0.25rem; text-transform: uppercase;">Persona de contacto</label>
            <p style="margin: 0; color: #2D2C3E; font-size: 1rem;">${client.contact_name}</p>
          </div>
        </div>
        
        <h3 style="color: #572c83; font-weight: 700; margin: 2rem 0 1rem 0; display: flex; align-items: center; gap: 0.5rem;">
          <span>📧</span> CONTACTO
        </h3>
        
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <div>
            <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #6B7280; margin-bottom: 0.25rem; text-transform: uppercase;">Email</label>
            <p style="margin: 0; color: #2D2C3E; font-size: 1rem;">
              <a href="mailto:${client.email}" style="color: #572c83; text-decoration: none;">${client.email}</a>
            </p>
          </div>
          
          <div>
            <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #6B7280; margin-bottom: 0.25rem; text-transform: uppercase;">Teléfono</label>
            <p style="margin: 0; color: #2D2C3E; font-size: 1rem;">
              <a href="tel:${client.phone}" style="color: #572c83; text-decoration: none;">${client.phone || '-'}</a>
            </p>
          </div>
        </div>
      </div>
      
      <!-- Columna derecha -->
      <div>
        <h3 style="color: #572c83; font-weight: 700; margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.5rem;">
          <span>📍</span> UBICACIÓN
        </h3>
        
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <div>
            <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #6B7280; margin-bottom: 0.25rem; text-transform: uppercase;">Dirección</label>
            <p style="margin: 0; color: #2D2C3E; font-size: 1rem;">${client.address || '-'}</p>
          </div>
          
          <div>
            <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #6B7280; margin-bottom: 0.25rem; text-transform: uppercase;">Ciudad</label>
            <p style="margin: 0; color: #2D2C3E; font-size: 1rem;">${client.city || '-'}</p>
          </div>
          
          <div>
            <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #6B7280; margin-bottom: 0.25rem; text-transform: uppercase;">País</label>
            <p style="margin: 0; color: #2D2C3E; font-size: 1rem;">${client.country || '-'}</p>
          </div>
          
          ${client.instagram ? `
            <div>
              <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #6B7280; margin-bottom: 0.25rem; text-transform: uppercase;">Instagram</label>
              <p style="margin: 0; color: #2D2C3E; font-size: 1rem;">
                <a href="https://instagram.com/${client.instagram.replace('@', '')}" target="_blank" style="color: #572c83; text-decoration: none;">${client.instagram}</a>
              </p>
            </div>
          ` : ''}
        </div>
        
        <h3 style="color: #572c83; font-weight: 700; margin: 2rem 0 1rem 0; display: flex; align-items: center; gap: 0.5rem;">
          <span>💰</span> SUSCRIPCIÓN
        </h3>
        
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <div>
            <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #6B7280; margin-bottom: 0.25rem; text-transform: uppercase;">Estado</label>
            <p style="margin: 0; color: #2D2C3E; font-size: 1rem;">${getStatusBadge(client.subscription_status)}</p>
          </div>
          
          <div>
            <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #6B7280; margin-bottom: 0.25rem; text-transform: uppercase;">Cuota mensual</label>
            <p style="margin: 0; color: #2D2C3E; font-size: 1.5rem; font-weight: 700;">${client.monthly_fee ? `${client.monthly_fee}€` : 'Sin cuota'}</p>
          </div>
          
          <div>
            <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #6B7280; margin-bottom: 0.25rem; text-transform: uppercase;">Cliente desde</label>
            <p style="margin: 0; color: #2D2C3E; font-size: 1rem;">${formatDate(client.created_at)}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderClientProjects(projects, client) {
  if (!projects || projects.length === 0) {
    return `
      <div style="text-align: center; padding: 3rem;">
        <div style="font-size: 4rem; margin-bottom: 1rem;">📁</div>
        <h3 style="font-size: 1.5rem; font-weight: 600; color: #374151; margin: 0 0 0.5rem 0;">No hay proyectos</h3>
        <p style="color: #6B7280; margin: 0 0 1.5rem 0;">Este cliente no tiene proyectos asignados aún</p>
        <button onclick="createProjectForClient(${client.id})" style="background: linear-gradient(135deg, #572c83 0%, #08a48d 100%); color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600;">
          ➕ Crear Primer Proyecto
        </button>
      </div>
    `;
  }
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <button onclick="createProjectForClient(${client.id})" style="background: linear-gradient(135deg, #572c83 0%, #08a48d 100%); color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600;">
        ➕ Nuevo Proyecto
      </button>
    </div>
    
    <div style="display: grid; gap: 1rem;">
      ${projects.map(project => `
        <div onclick="viewProjectDetail(${project.id})" style="background: #F9FAFB; padding: 1.5rem; border-radius: 0.75rem; cursor: pointer; transition: all 0.2s; border-left: 4px solid ${getProjectStatusColor(project.status)};" onmouseover="this.style.background='#F3F4F6'" onmouseout="this.style.background='#F9FAFB'">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
            <div style="flex: 1;">
              <h4 style="font-size: 1.125rem; font-weight: 600; color: #2D2C3E; margin: 0 0 0.5rem 0;">${project.name}</h4>
              <p style="color: #6B7280; font-size: 0.875rem; margin: 0;">${project.description || 'Sin descripción'}</p>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-end;">
              ${getStatusBadge(project.status)}
              ${getPriorityBadge(project.priority)}
            </div>
          </div>
          
          <div style="display: flex; gap: 2rem; color: #6B7280; font-size: 0.875rem;">
            ${project.start_date ? `<span>📅 ${formatDate(project.start_date)} → ${formatDate(project.end_date)}</span>` : ''}
            ${project.budget ? `<span>💰 ${project.budget}€</span>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderClientCommunications(communications) {
  const clientId = STATE.selectedItem?.data?.id;
  
  if (!communications || communications.length === 0) {
    return `
      <div style="text-align: center; padding: 3rem;">
        <div style="font-size: 4rem; margin-bottom: 1rem;">💬</div>
        <h3 style="font-size: 1.5rem; font-weight: 600; color: #374151; margin: 0 0 0.5rem 0;">Sin comunicaciones registradas</h3>
        <p style="color: #6B7280; margin: 0 0 1.5rem 0;">El historial de comunicaciones aparecerá aquí</p>
        <button onclick="addCommunicationForClient(${clientId})" style="background: linear-gradient(135deg, #572c83 0%, #08a48d 100%); color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600; font-size: 1rem;">
          ➕ Registrar Primera Comunicación
        </button>
      </div>
    `;
  }
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <button onclick="addCommunicationForClient(${clientId})" style="background: linear-gradient(135deg, #572c83 0%, #08a48d 100%); color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
        ➕ Nueva Comunicación
      </button>
    </div>
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      ${communications.map(comm => `
        <div style="background: #F9FAFB; padding: 1.5rem; border-radius: 0.75rem; border-left: 4px solid #572c83;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
            <div>
              <h4 style="font-size: 1rem; font-weight: 600; color: #2D2C3E; margin: 0 0 0.25rem 0;">
                ${getCommTypeIcon(comm.type)} ${comm.subject || 'Sin asunto'}
              </h4>
              <span style="color: #6B7280; font-size: 0.875rem;">${formatDateTime(comm.communication_date)}</span>
            </div>
          </div>
          ${comm.content ? `<p style="color: #6B7280; margin: 0; line-height: 1.6;">${comm.content}</p>` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

function getCommTypeIcon(type) {
  const icons = {
    'call': '📞',
    'email': '📧',
    'meeting': '🤝',
    'whatsapp': '💬',
    'other': '📝'
  };
  return icons[type] || '💬';
}

async function addCommunicationForClient(clientId) {
  // Pre-seleccionar el cliente en el modal
  STATE.preSelectedClient = clientId;
  
  // Asegurar que STATE.clients esté cargado
  if (!STATE.clients || STATE.clients.length === 0) {
    await loadClients();
  }
  
  showNewCommunicationModal();
}

function getProjectStatusColor(status) {
  const colors = {
    'pending': '#F59E0B',
    'in_progress': '#3B82F6',
    'review': '#8B5CF6',
    'completed': '#10B981'
  };
  return colors[status] || '#6B7280';
}

function createProjectForClient(clientId) {
  // Pre-seleccionar el cliente en el modal
  STATE.preSelectedClient = clientId;
  showNewProjectModal();
}

// ============================================
// VISTA DETALLADA DE PROYECTO
// ============================================

async function viewProjectDetail(id) {
  try {
    const { project } = await apiCall(`/projects/${id}`);
    const { tasks } = await apiCall(`/projects/${id}/tasks`);
    
    STATE.selectedItem = { type: 'project', data: project, tasks };
    STATE.currentView = 'project-detail';
    render();
  } catch (error) {
    showNotification('Error al cargar proyecto', 'error');
  }
}

function renderProjectDetail() {
  const { data: project, tasks } = STATE.selectedItem || {};
  if (!project) return renderProjects();
  
  return renderLayout(`
    <div style="margin-bottom: 2rem;">
      <button onclick="navigateTo('projects')" style="background: transparent; border: none; color: #572c83; cursor: pointer; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0; font-weight: 600;">
        ← Volver a Proyectos
      </button>
    </div>
    
    <!-- Header del proyecto -->
    <div style="background: white; padding: 2rem; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1.5rem;">
        <div style="flex: 1;">
          <h1 style="font-size: 2rem; font-weight: bold; color: #2D2C3E; margin: 0 0 0.5rem 0;">
            📁 ${project.name}
          </h1>
          <p style="color: #6B7280; margin: 0 0 1rem 0;">${project.description || 'Sin descripción'}</p>
          <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
            ${getStatusBadge(project.status)}
            ${getPriorityBadge(project.priority)}
            ${project.client_name ? `<span style="color: #6B7280; font-size: 0.875rem;">Cliente: <strong>${project.client_name}</strong></span>` : ''}
          </div>
        </div>
        <div style="display: flex; gap: 0.75rem;">
          <button onclick="editProject(${project.id})" style="background: linear-gradient(135deg, #572c83 0%, #08a48d 100%); color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600;">
            ✏️ Editar
          </button>
          <button onclick="deleteProject(${project.id})" style="background: #EF4444; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600;">
            🗑️ Eliminar
          </button>
        </div>
      </div>
      
      <!-- Información del proyecto -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin-bottom: 2rem; padding-top: 1.5rem; border-top: 1px solid #E5E7EB;">
        <div>
          <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #6B7280; margin-bottom: 0.5rem; text-transform: uppercase;">Presupuesto</label>
          <p style="margin: 0; color: #2D2C3E; font-size: 1.5rem; font-weight: 700;">${project.budget ? `${project.budget}€` : '-'}</p>
        </div>
        
        <div>
          <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #6B7280; margin-bottom: 0.5rem; text-transform: uppercase;">Fecha inicio</label>
          <p style="margin: 0; color: #2D2C3E; font-size: 1rem;">${project.start_date ? formatDate(project.start_date) : '-'}</p>
        </div>
        
        <div>
          <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #6B7280; margin-bottom: 0.5rem; text-transform: uppercase;">Fecha fin</label>
          <p style="margin: 0; color: #2D2C3E; font-size: 1rem;">${project.end_date ? formatDate(project.end_date) : '-'}</p>
        </div>
      </div>
      
      ${project.client_brief ? `
        <div style="margin-bottom: 2rem;">
          <h3 style="color: #572c83; font-weight: 700; margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.5rem;">
            <span>📝</span> BRIEF DEL CLIENTE
          </h3>
          <div style="background: #F9FAFB; padding: 1.5rem; border-radius: 0.5rem; border-left: 4px solid #572c83;">
            <p style="margin: 0; color: #2D2C3E; line-height: 1.6; white-space: pre-wrap;">${project.client_brief}</p>
          </div>
        </div>
      ` : ''}
      
      <!-- Tareas -->
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3 style="color: #572c83; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
            <span>✓</span> TAREAS (${tasks?.length || 0})
          </h3>
          <button onclick="createTaskForProject(${project.id})" style="background: linear-gradient(135deg, #572c83 0%, #08a48d 100%); color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600; font-size: 0.875rem;">
            ➕ Nueva Tarea
          </button>
        </div>
        
        ${!tasks || tasks.length === 0 ? `
          <div style="text-align: center; padding: 2rem; background: #F9FAFB; border-radius: 0.5rem;">
            <p style="color: #6B7280; margin: 0;">No hay tareas asignadas a este proyecto</p>
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${tasks.map(task => `
              <div onclick="viewTaskDetail(${task.id})" style="background: #F9FAFB; padding: 1rem; border-radius: 0.5rem; cursor: pointer; transition: all 0.2s; display: flex; justify-content: space-between; align-items: center;" onmouseover="this.style.background='#F3F4F6'" onmouseout="this.style.background='#F9FAFB'">
                <div style="flex: 1;">
                  <h4 style="font-size: 1rem; font-weight: 600; color: #2D2C3E; margin: 0 0 0.25rem 0;">${task.title}</h4>
                  ${task.assigned_to ? `<p style="color: #6B7280; font-size: 0.875rem; margin: 0;">Asignado a: ${task.assigned_to}</p>` : ''}
                </div>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                  ${task.due_date ? `<span style="color: #6B7280; font-size: 0.875rem;">📅 ${formatDate(task.due_date)}</span>` : ''}
                  ${getStatusBadge(task.status)}
                  ${getPriorityBadge(task.priority)}
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </div>
  `);
}

function createTaskForProject(projectId) {
  STATE.preSelectedProject = projectId;
  showNewTaskModal();
}

// ============================================
// VISTA DETALLADA DE TAREA
// ============================================

async function viewTaskDetail(id) {
  try {
    const response = await apiCall(`/tasks/${id}`);
    const task = response.task || response;
    
    STATE.selectedItem = { type: 'task', data: task };
    STATE.currentView = 'task-detail';
    render();
  } catch (error) {
    showNotification('Error al cargar tarea', 'error');
  }
}

function renderTaskDetail() {
  const { data: task } = STATE.selectedItem || {};
  if (!task) return renderTasks();
  
  return renderLayout(`
    <div style="margin-bottom: 2rem;">
      <button onclick="navigateTo('tasks')" style="background: transparent; border: none; color: #572c83; cursor: pointer; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0; font-weight: 600;">
        ← Volver a Tareas
      </button>
    </div>
    
    <!-- Header de la tarea -->
    <div style="background: white; padding: 2rem; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1.5rem;">
        <div style="flex: 1;">
          <h1 style="font-size: 2rem; font-weight: bold; color: #2D2C3E; margin: 0 0 0.5rem 0;">
            ✓ ${task.title}
          </h1>
          ${task.description ? `<p style="color: #6B7280; margin: 0 0 1rem 0; line-height: 1.6;">${task.description}</p>` : ''}
          <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
            ${getStatusBadge(task.status)}
            ${getPriorityBadge(task.priority)}
            ${task.project_name ? `<span style="color: #6B7280; font-size: 0.875rem;">Proyecto: <strong>${task.project_name}</strong></span>` : ''}
          </div>
        </div>
        <div style="display: flex; gap: 0.75rem;">
          <button onclick="editTask(${task.id})" style="background: linear-gradient(135deg, #572c83 0%, #08a48d 100%); color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600;">
            ✏️ Editar
          </button>
          <button onclick="deleteTask(${task.id})" style="background: #EF4444; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600;">
            🗑️ Eliminar
          </button>
        </div>
      </div>
      
      <!-- Información de la tarea -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; padding-top: 1.5rem; border-top: 1px solid #E5E7EB;">
        <div>
          <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #6B7280; margin-bottom: 0.5rem; text-transform: uppercase;">Asignado a</label>
          <p style="margin: 0; color: #2D2C3E; font-size: 1rem; font-weight: 600;">${task.assigned_to || 'Sin asignar'}</p>
        </div>
        
        <div>
          <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #6B7280; margin-bottom: 0.5rem; text-transform: uppercase;">Fecha límite</label>
          <p style="margin: 0; color: #2D2C3E; font-size: 1rem;">${task.due_date ? formatDate(task.due_date) : '-'}</p>
        </div>
        
        <div>
          <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #6B7280; margin-bottom: 0.5rem; text-transform: uppercase;">Creada el</label>
          <p style="margin: 0; color: #2D2C3E; font-size: 1rem;">${formatDate(task.created_at)}</p>
        </div>
      </div>
    </div>
  `);
}

console.log('✅ Vistas detalladas cargadas');
