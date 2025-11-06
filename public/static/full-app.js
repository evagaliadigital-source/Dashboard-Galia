// Galia Digital Platform - Full Version
console.log('🚀 Galia Digital cargando...');

// ============================================
// ESTADO GLOBAL
// ============================================
const STATE = {
  currentUser: null,
  currentView: 'dashboard',
  clients: [],
  projects: [],
  tasks: [],
  events: [],
  metrics: null,
  selectedItem: null,
  projectFilters: {
    type: 'all', // 'all' | 'client' | 'internal' | 'company'
    search: '',
    status: '',
    priority: ''
  }
};

// ============================================
// API UTILITIES
// ============================================
async function apiCall(url, options = {}) {
  try {
    const response = await fetch('/api' + url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      // Manejar respuestas no-OK
      let errorMessage = `HTTP ${response.status}`;
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } catch (jsonError) {
        // Si no es JSON válido, usar el status text
        errorMessage = response.statusText || errorMessage;
      }
      
      // Si es 401, redirigir al login
      if (response.status === 401) {
        STATE.currentUser = null;
        render();
        throw new Error('Sesión expirada. Por favor, inicia sesión de nuevo.');
      }
      
      throw new Error(errorMessage);
    }
    
    // Parsear respuesta JSON
    try {
      return await response.json();
    } catch (jsonError) {
      console.error('Error parsing JSON:', jsonError);
      throw new Error('Respuesta inválida del servidor');
    }
  } catch (error) {
    console.error('API Error:', error);
    showNotification(error.message, 'error');
    throw error;
  }
}

// ============================================
// UTILITIES
// ============================================
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

function formatDateTime(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('es-ES', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getStatusBadge(status) {
  const badges = {
    'pending': '<span style="padding: 0.25rem 0.75rem; font-size: 0.75rem; border-radius: 9999px; background: #FEF3C7; color: #92400E;">⏳ Pendiente</span>',
    'in_progress': '<span style="padding: 0.25rem 0.75rem; font-size: 0.75rem; border-radius: 9999px; background: #DBEAFE; color: #1E40AF;">🔄 En Progreso</span>',
    'review': '<span style="padding: 0.25rem 0.75rem; font-size: 0.75rem; border-radius: 9999px; background: #E9D5FF; color: #6B21A8;">👀 Revisión</span>',
    'completed': '<span style="padding: 0.25rem 0.75rem; font-size: 0.75rem; border-radius: 9999px; background: #D1FAE5; color: #065F46;">✅ Completado</span>',
    'cancelled': '<span style="padding: 0.25rem 0.75rem; font-size: 0.75rem; border-radius: 9999px; background: #FEE2E2; color: #991B1B;">❌ Cancelado</span>',
    'active': '<span style="padding: 0.25rem 0.75rem; font-size: 0.75rem; border-radius: 9999px; background: #D1FAE5; color: #065F46;">✅ Activo</span>',
    'paused': '<span style="padding: 0.25rem 0.75rem; font-size: 0.75rem; border-radius: 9999px; background: #FEF3C7; color: #92400E;">⏸️ Pausado</span>',
    'trial': '<span style="padding: 0.25rem 0.75rem; font-size: 0.75rem; border-radius: 9999px; background: #DBEAFE; color: #1E40AF;">🎁 Prueba</span>'
  };
  return badges[status] || status;
}

function getPriorityBadge(priority) {
  const badges = {
    'low': '<span style="padding: 0.25rem 0.5rem; font-size: 0.75rem; border-radius: 0.25rem; background: #F3F4F6; color: #374151;">Baja</span>',
    'medium': '<span style="padding: 0.25rem 0.5rem; font-size: 0.75rem; border-radius: 0.25rem; background: #DBEAFE; color: #1E40AF;">Media</span>',
    'high': '<span style="padding: 0.25rem 0.5rem; font-size: 0.75rem; border-radius: 0.25rem; background: #FED7AA; color: #9A3412;">Alta</span>',
    'urgent': '<span style="padding: 0.25rem 0.5rem; font-size: 0.75rem; border-radius: 0.25rem; background: #FEE2E2; color: #991B1B;">🔥 Urgente</span>'
  };
  return badges[priority] || priority;
}

function showNotification(message, type = 'success') {
  const colors = {
    success: 'background: #08a48d; color: white;',
    error: 'background: #EF4444; color: white;',
    info: 'background: #572c83; color: white;'
  };
  
  const notif = document.createElement('div');
  notif.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    border-radius: 0.5rem;
    ${colors[type]}
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    z-index: 9999;
    animation: slideIn 0.3s ease;
  `;
  notif.textContent = message;
  document.body.appendChild(notif);
  
  setTimeout(() => {
    notif.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

// ============================================
// MODAL FUNCTIONS
// ============================================
function showModal(content) {
  // Remove existing modal if any
  const existingModal = document.getElementById('globalModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'globalModal';
  modalOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.2s ease;
  `;
  
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: white;
    border-radius: 0.75rem;
    padding: 2rem;
    max-width: 90vw;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
    animation: slideUp 0.3s ease;
    position: relative;
  `;
  
  modalContent.innerHTML = content;
  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);
  
  // Close on overlay click
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });
  
  // Close on ESC key
  const escapeHandler = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);
}

function closeModal() {
  const modal = document.getElementById('globalModal');
  if (modal) {
    modal.style.animation = 'fadeOut 0.2s ease';
    setTimeout(() => modal.remove(), 200);
  }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
  @keyframes slideOut {
    from { transform: translateX(0); }
    to { transform: translateX(100%); }
  }
`;
document.head.appendChild(style);

// ============================================
// RENDER LOGIN
// ============================================
function renderLogin() {
  document.getElementById('app').innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #572c83 0%, #08a48d 100%);">
      <div style="background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); width: 100%; max-width: 400px;">
        <div style="text-align: center; margin-bottom: 2rem;">
          <img src="/galia-octopus.jpg" alt="Galia Digital" style="height: 120px; margin: 0 auto 1rem; display: block;">
          <h1 style="font-size: 2rem; font-weight: bold; color: #572c83; margin-bottom: 0.5rem;">Galia Digital</h1>
          <p style="color: #666;">Plataforma de Gestión</p>
        </div>
        
        <form id="loginForm" style="display: flex; flex-direction: column; gap: 1.5rem;">
          <div>
            <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.5rem;">Email</label>
            <input 
              type="email" 
              id="loginEmail" 
              required
              placeholder="tu@email.com"
              style="width: 100%; padding: 0.75rem 1rem; border: 1px solid #D1D5DB; border-radius: 0.5rem; font-size: 1rem;"
            >
          </div>
          
          <div>
            <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.5rem;">Contraseña</label>
            <input 
              type="password" 
              id="loginPassword" 
              required
              placeholder="Tu contraseña"
              style="width: 100%; padding: 0.75rem 1rem; border: 1px solid #D1D5DB; border-radius: 0.5rem; font-size: 1rem;"
            >
          </div>
          
          <div id="loginError" style="display: none; color: #DC2626; font-size: 0.875rem;"></div>
          
          <button 
            type="submit" 
            style="width: 100%; background: linear-gradient(135deg, #572c83 0%, #08a48d 100%); color: white; padding: 0.75rem; border-radius: 0.5rem; font-weight: 600; border: none; cursor: pointer;"
          >
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  `;
  
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

// ============================================
// RENDER LAYOUT
// ============================================
function renderLayout(content) {
  const isAdmin = STATE.currentUser?.role === 'admin';
  const isTeam = STATE.currentUser?.role === 'team';
  
  return `
    <div style="display: flex; min-height: 100vh;">
      <!-- Sidebar -->
      <aside style="width: 16rem; background: #2D2C3E; color: white; position: fixed; height: 100vh; overflow-y: auto; display: flex; flex-direction: column;">
        <div style="padding: 1.5rem; background: #2D2C3E;">
          <div style="display: flex; justify-content: center; margin-bottom: 1rem;">
            <img src="/galia-octopus.jpg" alt="Galia Digital" style="height: 80px; max-width: 100%; border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
          </div>
          <h2 style="font-size: 1.25rem; font-weight: bold; text-align: center; margin: 0.5rem 0; color: #08a48d;">Galia Digital</h2>
          <p style="font-size: 0.875rem; opacity: 0.9; text-align: center; margin: 0.5rem 0;">${STATE.currentUser?.name || 'Usuario'}</p>
          <p style="font-size: 0.75rem; opacity: 0.8; text-align: center; margin: 0;">${STATE.currentUser?.role === 'admin' ? '👑 Admin' : STATE.currentUser?.role === 'team' ? '👥 Equipo' : '🏢 Cliente'}</p>
        </div>
        
        <nav style="padding: 1rem; flex: 1;">
          ${renderMenuItem('dashboard', '📊', 'Dashboard')}
          ${(isAdmin || isTeam) ? renderMenuItem('leads', '🎯', 'Leads') : ''}
          ${(isAdmin || isTeam) ? renderMenuItem('clients', '👥', 'Clientes') : ''}
          ${renderMenuItem('projects', '📁', 'Proyectos')}
          ${renderMenuItem('tasks', '✓', 'Tareas')}
          ${renderMenuItem('calendar', '📅', 'Calendario')}
          ${(isAdmin || isTeam) ? renderMenuItem('resources', '📚', 'Recursos') : ''}
          ${/* Temporalmente deshabilitado - tabla no existe */ ''}
        </nav>
        
        <div style="padding: 1rem; border-top: 1px solid rgba(255,255,255,0.1);">
          ${typeof renderAIAssistantButton === 'function' ? renderAIAssistantButton() : ''}
          <button onclick="handleLogout()" style="width: 100%; padding: 0.75rem 1rem; border-radius: 0.5rem; background: transparent; color: white; border: none; cursor: pointer; text-align: left;">
            🚪 Cerrar Sesión
          </button>
        </div>
      </aside>
      
      <!-- Main Content -->
      <main style="margin-left: 16rem; flex: 1; padding: 2rem; background: #F8F7FA; min-height: 100vh;">
        <div style="max-width: 1400px; margin: 0 auto;">
          ${content}
        </div>
      </main>
    </div>
  `;
}

function renderMenuItem(view, icon, label) {
  const isActive = STATE.currentView === view;
  const activeStyle = isActive ? 'background: rgba(233, 30, 140, 0.2); border-left: 3px solid #E91E8C; padding-left: calc(1rem - 3px);' : '';
  
  return `
    <button 
      onclick="navigateTo('${view}')" 
      style="width: 100%; text-align: left; padding: 0.75rem 1rem; border-radius: 0.5rem; background: transparent; color: white; border: none; cursor: pointer; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.75rem; ${activeStyle}"
    >
      <span style="font-size: 1.25rem;">${icon}</span>
      <span>${label}</span>
    </button>
  `;
}

// ============================================
// RENDER DASHBOARD
// ============================================
function renderDashboard() {
  const metrics = STATE.metrics || {};
  const isAdmin = STATE.currentUser?.role !== 'client';
  
  return renderLayout(`
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
      <h1 style="font-size: 2rem; font-weight: bold; color: #2D2C3E; margin: 0;">Dashboard</h1>
      <div style="color: #6B7280; font-size: 0.875rem;">
        📅 ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>
    
    <!-- Métricas -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
      ${isAdmin ? `
        <div style="background: white; padding: 1.5rem; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div>
              <p style="color: #6B7280; font-size: 0.875rem; margin: 0;">Clientes Activos</p>
              <h3 style="font-size: 2.5rem; font-weight: bold; color: #572c83; margin: 0.5rem 0 0 0;">${metrics.clients?.active || 0}</h3>
              <p style="color: #9CA3AF; font-size: 0.75rem; margin: 0.25rem 0 0 0;">de ${metrics.clients?.total || 0} totales</p>
            </div>
            <div style="width: 3rem; height: 3rem; background: #F3E8FF; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">👥</div>
          </div>
        </div>
      ` : ''}
      
      <div style="background: white; padding: 1.5rem; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div>
            <p style="color: #6B7280; font-size: 0.875rem; margin: 0;">Proyectos Activos</p>
            <h3 style="font-size: 2.5rem; font-weight: bold; color: #572c83; margin: 0.5rem 0 0 0;">${metrics.projects?.active || 0}</h3>
            <p style="color: #9CA3AF; font-size: 0.75rem; margin: 0.25rem 0 0 0;">de ${metrics.projects?.total || 0} totales</p>
          </div>
          <div style="width: 3rem; height: 3rem; background: #DBEAFE; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">📁</div>
        </div>
      </div>
      
      <div style="background: white; padding: 1.5rem; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div>
            <p style="color: #6B7280; font-size: 0.875rem; margin: 0;">Tareas Pendientes</p>
            <h3 style="font-size: 2.5rem; font-weight: bold; color: #08a48d; margin: 0.5rem 0 0 0;">${metrics.tasks?.pending || 0}</h3>
            <p style="color: #DC2626; font-size: 0.75rem; margin: 0.25rem 0 0 0;">${metrics.tasks?.overdue || 0} atrasadas</p>
          </div>
          <div style="width: 3rem; height: 3rem; background: #FEF3C7; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">✓</div>
        </div>
      </div>
      
      ${isAdmin ? `
        <div style="background: white; padding: 1.5rem; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div>
              <p style="color: #6B7280; font-size: 0.875rem; margin: 0;">Ingresos Mensuales</p>
              <h3 style="font-size: 2.5rem; font-weight: bold; color: #572c83; margin: 0.5rem 0 0 0;">${Math.round(metrics.revenue?.monthly || 0)}€</h3>
              <p style="color: #9CA3AF; font-size: 0.75rem; margin: 0.25rem 0 0 0;">${metrics.events?.upcoming || 0} eventos próximos</p>
            </div>
            <div style="width: 3rem; height: 3rem; background: #D1FAE5; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">💰</div>
          </div>
        </div>
      ` : ''}
    </div>
    
    ${isAdmin ? `
      <!-- Acciones Rápidas -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
        <button onclick="showNewClientModal()" style="background: linear-gradient(135deg, #572c83 0%, #08a48d 100%); color: white; padding: 1.5rem; border-radius: 0.75rem; border: none; cursor: pointer; display: flex; align-items: center; gap: 1rem; text-align: left;">
          <span style="font-size: 2rem;">👤</span>
          <div>
            <div style="font-weight: 600; font-size: 1.125rem;">Nuevo Cliente</div>
            <div style="font-size: 0.875rem; opacity: 0.9;">Registrar peluquería</div>
          </div>
        </button>
        
        <button onclick="showNewProjectModal()" style="background: linear-gradient(135deg, #572c83 0%, #08a48d 100%); color: white; padding: 1.5rem; border-radius: 0.75rem; border: none; cursor: pointer; display: flex; align-items: center; gap: 1rem; text-align: left;">
          <span style="font-size: 2rem;">📁</span>
          <div>
            <div style="font-weight: 600; font-size: 1.125rem;">Nuevo Proyecto</div>
            <div style="font-size: 0.875rem; opacity: 0.9;">Crear campaña</div>
          </div>
        </button>
        
        <button onclick="showNewEventModal()" style="background: linear-gradient(135deg, #572c83 0%, #08a48d 100%); color: white; padding: 1.5rem; border-radius: 0.75rem; border: none; cursor: pointer; display: flex; align-items: center; gap: 1rem; text-align: left;">
          <span style="font-size: 2rem;">📅</span>
          <div>
            <div style="font-weight: 600; font-size: 1.125rem;">Nueva Reunión</div>
            <div style="font-size: 0.875rem; opacity: 0.9;">Agendar evento</div>
          </div>
        </button>
      </div>
    ` : ''}
    
    <!-- Gráficos -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
      <!-- Proyectos por Estado -->
      <div style="background: white; padding: 1.5rem; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h3 style="font-size: 1.125rem; font-weight: 600; color: #2D2C3E; margin: 0 0 1.5rem 0;">
          <i class="fas fa-chart-pie text-purple-500 mr-2"></i>
          Proyectos por Estado
        </h3>
        <div id="projectsChart" style="height: 250px;"></div>
      </div>
      
      <!-- Tareas por Prioridad -->
      <div style="background: white; padding: 1.5rem; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h3 style="font-size: 1.125rem; font-weight: 600; color: #2D2C3E; margin: 0 0 1.5rem 0;">
          <i class="fas fa-chart-bar text-blue-500 mr-2"></i>
          Tareas por Prioridad
        </h3>
        <div id="tasksChart" style="height: 250px;"></div>
      </div>
      
      <!-- Leads por Calidad (NUEVO) -->
      <div style="background: white; padding: 1.5rem; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h3 style="font-size: 1.125rem; font-weight: 600; color: #2D2C3E; margin: 0 0 1.5rem 0;">
          <i class="fas fa-fire text-red-500 mr-2"></i>
          Pipeline de Leads
        </h3>
        <div id="leadsChart" style="height: 250px;"></div>
      </div>
    </div>
    
    <!-- Actividad Reciente -->
    <div style="background: white; padding: 2rem; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="font-size: 1.5rem; font-weight: 600; color: #2D2C3E; margin: 0 0 1rem 0;">
        <i class="fas fa-clock text-green-500 mr-2"></i>
        Resumen de Actividad
      </h2>
      <p style="color: #6B7280; margin: 0 0 1.5rem 0;">¡Bienvenida, ${STATE.currentUser?.name}! 💜 Tu plataforma de gestión Galia Digital está lista.</p>
      
      <div style="padding: 1rem; background: linear-gradient(135deg, rgba(233, 30, 140, 0.1) 0%, rgba(155, 77, 202, 0.1) 100%); border-radius: 0.5rem; border-left: 4px solid #E91E8C;">
        <p style="font-size: 0.875rem; color: #374151; margin: 0;"><strong>🎯 Próximos pasos:</strong> ${isAdmin ? 'Revisa tus clientes activos, actualiza el estado de proyectos y agenda reuniones.' : 'Revisa el progreso de tus proyectos y tareas pendientes.'}</p>
      </div>
    </div>
  `);
}

// Continuaré con el resto en el siguiente archivo...

// ============================================
// RENDER CLIENTES
// ============================================
function renderClients() {
  const allClients = STATE.clients || [];
  const clients = getFilteredClients();
  
  // Get unique collectives for filter dropdown
  const collectives = [...new Set(allClients.filter(c => c.collective).map(c => c.collective))];
  
  // Show filter results indicator
  const hasFilters = STATE.clientFilters && (STATE.clientFilters.search || STATE.clientFilters.lead_quality || STATE.clientFilters.client_status || STATE.clientFilters.collective);
  
  return renderLayout(`
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
      <h1 style="font-size: 2rem; font-weight: bold; color: #2D2C3E; margin: 0;">Clientes</h1>
      <button onclick="showNewClientModal()" style="background: linear-gradient(135deg, #572c83 0%, #08a48d 100%); color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600;">
        ➕ Nuevo Cliente
      </button>
    </div>
    
    ${allClients.length > 0 ? `
      <div style="background: white; padding: 1.5rem; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 1.5rem;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
          <input 
            type="text" 
            id="client-search" 
            placeholder="🔍 Buscar cliente..."
            value="${STATE.clientFilters?.search || ''}"
            oninput="filterClients()"
            style="padding: 0.75rem 1rem; border: 1px solid #D1D5DB; border-radius: 0.5rem; font-size: 0.875rem;"
          />
          
          <select id="client-filter-lead-quality" onchange="filterClients()" style="padding: 0.75rem 1rem; border: 1px solid #D1D5DB; border-radius: 0.5rem; font-size: 0.875rem;">
            <option value="">🎯 Calidad: Todas</option>
            <option value="hot" ${STATE.clientFilters?.lead_quality === 'hot' ? 'selected' : ''}>🔴 HOT</option>
            <option value="warm" ${STATE.clientFilters?.lead_quality === 'warm' ? 'selected' : ''}>🟠 WARM</option>
            <option value="cold" ${STATE.clientFilters?.lead_quality === 'cold' ? 'selected' : ''}>🟡 COLD</option>
            <option value="qualified" ${STATE.clientFilters?.lead_quality === 'qualified' ? 'selected' : ''}>🟢 QUALIFIED</option>
          </select>
          
          <select id="client-filter-status" onchange="filterClients()" style="padding: 0.75rem 1rem; border: 1px solid #D1D5DB; border-radius: 0.5rem; font-size: 0.875rem;">
            <option value="">📊 Estado: Todos</option>
            <option value="prospect" ${STATE.clientFilters?.client_status === 'prospect' ? 'selected' : ''}>💼 Prospecto</option>
            <option value="active" ${STATE.clientFilters?.client_status === 'active' ? 'selected' : ''}>✅ Activo</option>
          </select>
          
          <select id="client-filter-collective" onchange="filterClients()" style="padding: 0.75rem 1rem; border: 1px solid #D1D5DB; border-radius: 0.5rem; font-size: 0.875rem;">
            <option value="">🏢 Colectivo: Todos</option>
            ${collectives.map(collective => `
              <option value="${collective}" ${STATE.clientFilters?.collective === collective ? 'selected' : ''}>${collective}</option>
            `).join('')}
          </select>
        </div>
        
        ${hasFilters ? `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #6B7280; font-size: 0.875rem;">Mostrando ${clients.length} de ${allClients.length} clientes</span>
            <button onclick="clearClientFilters()" style="color: #08a48d; font-size: 0.875rem; background: none; border: none; cursor: pointer; text-decoration: underline;">
              Limpiar filtros
            </button>
          </div>
        ` : ''}
      </div>
    ` : ''}
    
    ${clients.length === 0 && !hasFilters ? `
      <div style="background: white; padding: 3rem; border-radius: 0.75rem; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="font-size: 4rem; margin-bottom: 1rem;">👥</div>
        <h3 style="font-size: 1.5rem; font-weight: 600; color: #374151; margin: 0 0 0.5rem 0;">No hay clientes registrados</h3>
        <p style="color: #6B7280; margin: 0 0 1.5rem 0;">Comienza agregando tu primer cliente</p>
        <button onclick="showNewClientModal()" style="background: linear-gradient(135deg, #572c83 0%, #08a48d 100%); color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600;">
          ➕ Crear Primer Cliente
        </button>
      </div>
    ` : clients.length === 0 && hasFilters ? `
      <div style="background: white; padding: 3rem; border-radius: 0.75rem; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="font-size: 4rem; margin-bottom: 1rem;">🔍</div>
        <h3 style="font-size: 1.5rem; font-weight: 600; color: #374151; margin: 0 0 0.5rem 0;">No se encontraron clientes</h3>
        <p style="color: #6B7280; margin: 0 0 1.5rem 0;">Intenta ajustar los filtros de búsqueda</p>
        <button onclick="clearClientFilters()" style="background: linear-gradient(135deg, #572c83 0%, #08a48d 100%); color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600;">
          Limpiar Filtros
        </button>
      </div>
    ` : `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem;">
        ${clients.map(client => `
          <div onclick="viewClientDetail(${client.id})" style="background: white; padding: 1.5rem; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 10px 15px -3px rgba(0,0,0,0.1)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.1)'">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
              <div style="flex: 1;">
                <h3 style="font-size: 1.125rem; font-weight: 600; color: #2D2C3E; margin: 0 0 0.25rem 0;">${client.business_name}</h3>
                <p style="color: #6B7280; font-size: 0.875rem; margin: 0;">${client.contact_name}</p>
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.25rem; align-items: flex-end;">
                ${getLeadQualityBadge(client.lead_quality)}
                ${getClientStatusBadge(client.client_status)}
              </div>
            </div>
            
            ${client.collective ? `
              <div style="background: linear-gradient(135deg, #F3E8FF 0%, #E0F2FE 100%); padding: 0.5rem 0.75rem; border-radius: 0.375rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 0.875rem;">🏢</span>
                <span style="color: #6B21A8; font-size: 0.75rem; font-weight: 600;">${client.collective}</span>
              </div>
            ` : ''}
            
            <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem; color: #6B7280; font-size: 0.875rem;">
                <span>📧</span>
                <span>${client.email}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.5rem; color: #6B7280; font-size: 0.875rem;">
                <span>📞</span>
                <span>${client.phone}</span>
              </div>
              ${client.city ? `
                <div style="display: flex; align-items: center; gap: 0.5rem; color: #6B7280; font-size: 0.875rem;">
                  <span>📍</span>
                  <span>${client.city}</span>
                </div>
              ` : ''}
              ${client.instagram ? `
                <div style="display: flex; align-items: center; gap: 0.5rem; color: #6B7280; font-size: 0.875rem;">
                  <span>📱</span>
                  <span>${client.instagram}</span>
                </div>
              ` : ''}
            </div>
            
            ${client.monthly_fee ? `
              <div style="border-top: 1px solid #E5E7EB; padding-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6B7280; font-size: 0.875rem;">Mensualidad</span>
                <span style="font-size: 1.25rem; font-weight: 700; color: #08a48d;">${client.monthly_fee}€/mes</span>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `}
  `);
}

// ============================================
// RENDER PROYECTOS
// ============================================
function renderProjects() {
  const allProjects = STATE.projects || [];
  const projects = getFilteredProjects();
  
  const byStatus = {
    pending: projects.filter(p => p.status === 'pending'),
    in_progress: projects.filter(p => p.status === 'in_progress'),
    review: projects.filter(p => p.status === 'review'),
    completed: projects.filter(p => p.status === 'completed'),
    cancelled: projects.filter(p => p.status === 'cancelled')
  };
  
  const totalProjects = projects.length;
  const activeProjects = byStatus.pending.length + byStatus.in_progress.length + byStatus.review.length;
  const hasFilters = STATE.projectFilters.search || STATE.projectFilters.priority || STATE.projectFilters.status || (STATE.projectFilters.type && STATE.projectFilters.type !== 'all');
  
  return renderLayout(`
    <div style="margin-bottom: 2rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h1 style="font-size: 2rem; font-weight: bold; color: #2D2C3E; margin: 0;">Proyectos</h1>
        <button onclick="showNewProjectModal()" style="background: linear-gradient(135deg, #572c83 0%, #08a48d 100%); color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600; box-shadow: 0 2px 4px rgba(123, 95, 184, 0.3);">
          ➕ Nuevo Proyecto
        </button>
      </div>
      
      <!-- Search and Filters -->
      <div style="background: white; padding: 1rem; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 1rem; display: flex; gap: 1rem; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 250px;">
          <div style="position: relative;">
            <i class="fas fa-search" style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #9CA3AF;"></i>
            <input 
              type="text" 
              id="project-search"
              placeholder="Buscar proyectos por nombre o cliente..."
              oninput="filterProjects()"
              style="width: 100%; padding: 0.75rem 1rem 0.75rem 2.5rem; border: 2px solid #E5E7EB; border-radius: 0.5rem; font-size: 0.875rem;"
            />
          </div>
        </div>
        
        <select id="project-filter-type" onchange="filterProjects()" style="padding: 0.75rem 1rem; border: 2px solid #E5E7EB; border-radius: 0.5rem; background: white; cursor: pointer; font-size: 0.875rem; font-weight: 600;">
          <option value="all">📂 Todos los proyectos</option>
          <option value="client">👥 Proyectos de Clientes</option>
          <option value="internal">🏢 Proyectos Internos</option>
          <option value="company">⚙️ Proyectos Empresa</option>
        </select>
        
        <select id="project-filter-priority" onchange="filterProjects()" style="padding: 0.75rem 1rem; border: 2px solid #E5E7EB; border-radius: 0.5rem; background: white; cursor: pointer; font-size: 0.875rem;">
          <option value="">Todas las prioridades</option>
          <option value="low">🟢 Baja</option>
          <option value="medium">🟡 Media</option>
          <option value="high">🟠 Alta</option>
          <option value="urgent">🔴 Urgente</option>
        </select>
        
        <select id="project-filter-status" onchange="filterProjects()" style="padding: 0.75rem 1rem; border: 2px solid #E5E7EB; border-radius: 0.5rem; background: white; cursor: pointer; font-size: 0.875rem;">
          <option value="">Todos los estados</option>
          <option value="pending">⏳ Pendiente</option>
          <option value="in_progress">🔄 En Progreso</option>
          <option value="review">👀 Revisión</option>
          <option value="completed">✅ Completado</option>
          <option value="cancelled">❌ Cancelado</option>
        </select>
        
        ${hasFilters ? `
          <button onclick="clearProjectFilters()" style="padding: 0.75rem 1rem; border: 2px solid #E5E7EB; border-radius: 0.5rem; background: #FEE2E2; color: #991B1B; cursor: pointer; font-size: 0.875rem; font-weight: 600;">
            <i class="fas fa-times mr-1"></i> Limpiar filtros
          </button>
        ` : ''}
      </div>
      
      ${hasFilters ? `
        <div style="background: rgba(8,164,141,0.1); border-left: 4px solid #08a48d; padding: 0.75rem 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
          <span style="color: #572c83; font-size: 0.875rem; font-weight: 600;">
            <i class="fas fa-filter mr-1"></i>
            Mostrando ${totalProjects} de ${allProjects.length} proyectos
          </span>
        </div>
      ` : ''}
      
      <!-- Stats Bar -->
      <div style="display: flex; gap: 1rem; padding: 1rem; background: white; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 1.5rem;">
        <div style="flex: 1; text-align: center; padding: 0.5rem;">
          <div style="font-size: 1.75rem; font-weight: 700; color: #572c83;">${activeProjects}</div>
          <div style="font-size: 0.75rem; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em;">Activos</div>
        </div>
        <div style="flex: 1; text-align: center; padding: 0.5rem; border-left: 1px solid #E5E7EB;">
          <div style="font-size: 1.75rem; font-weight: 700; color: #08a48d;">${byStatus.completed.length}</div>
          <div style="font-size: 0.75rem; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em;">Completados</div>
        </div>
        <div style="flex: 1; text-align: center; padding: 0.5rem; border-left: 1px solid #E5E7EB;">
          <div style="font-size: 1.75rem; font-weight: 700; color: #6B7280;">${totalProjects}</div>
          <div style="font-size: 0.75rem; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em;">Total</div>
        </div>
      </div>
      
      <!-- Quick Tip -->
      <div style="background: linear-gradient(135deg, #E91E8C15 0%, #572c8315 100%); border-left: 4px solid #572c83; border-radius: 0.5rem; padding: 0.75rem 1rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem;">
        <div style="font-size: 1.25rem;">💡</div>
        <div style="flex: 1;">
          <span style="font-weight: 600; color: #2D2C3E; font-size: 0.875rem;">Usa el dropdown</span>
          <span style="color: #6B7280; font-size: 0.8rem; margin-left: 0.5rem;">en cada tarjeta para cambiar el estado rápidamente</span>
        </div>
      </div>
    </div>
    
    <!-- Kanban Board -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; overflow-x: auto; padding-bottom: 1rem;">
      ${renderKanbanColumn('⏳ Pendiente', 'pending', byStatus.pending, '#FEF3C7', '#92400E')}
      ${renderKanbanColumn('🔄 En Progreso', 'in_progress', byStatus.in_progress, '#DBEAFE', '#1E40AF')}
      ${renderKanbanColumn('👀 Revisión', 'review', byStatus.review, '#E9D5FF', '#6B21A8')}
      ${renderKanbanColumn('✅ Completado', 'completed', byStatus.completed, '#D1FAE5', '#065F46')}
      ${byStatus.cancelled.length > 0 ? renderKanbanColumn('❌ Cancelado', 'cancelled', byStatus.cancelled, '#FEE2E2', '#991B1B') : ''}
    </div>
  `);
}

function renderKanbanColumn(title, status, projects, bgColor, textColor) {
  return `
    <div 
      class="kanban-column" 
      data-status="${status}"
      ondrop="handleProjectDrop(event, '${status}')" 
      ondragover="handleProjectDragOver(event)"
      ondragleave="handleProjectDragLeave(event)"
      style="background: ${bgColor}; padding: 0.75rem; border-radius: 0.75rem; max-height: 70vh; overflow-y: auto; transition: all 0.2s ease;">
      <h3 style="color: ${textColor}; font-weight: 700; margin: 0 0 0.75rem 0; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; background: ${bgColor}; z-index: 10; padding-bottom: 0.5rem;">
        <span>${title}</span>
        <span style="background: white; color: ${textColor}; padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 600;">${projects.length}</span>
      </h3>
      <div class="kanban-cards" style="display: flex; flex-direction: column; gap: 0.5rem; min-height: 100px;">
        ${projects.length === 0 ? `
          <div style="border: 2px dashed ${textColor}40; border-radius: 0.5rem; padding: 2rem; text-align: center; color: ${textColor}60; font-size: 0.875rem;">
            Arrastra proyectos aquí
          </div>
        ` : projects.map(project => `
          <div 
            data-project-id="${project.id}"
            class="project-card"
            style="background: white; padding: 0.65rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 3px solid ${textColor}; transition: all 0.2s ease;"
            onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 3px 6px rgba(0,0,0,0.12)'" 
            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.1)'">
            
            <!-- Header con dropdown -->
            <div style="display: flex; align-items: start; gap: 0.5rem; margin-bottom: 0.5rem;">
              <div style="flex: 1; min-width: 0;">
                <h4 onclick="viewProjectDetail(${project.id})" style="font-size: 0.8rem; font-weight: 600; color: #1F2937; margin: 0 0 0.35rem 0; line-height: 1.3; cursor: pointer; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${project.name}</h4>
                <div style="display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap;">
                  ${getPriorityBadge(project.priority)}
                  <!-- Dropdown para cambiar estado -->
                  <select 
                    onclick="event.stopPropagation();"
                    onchange="changeProjectStatus(${project.id}, this.value, '${status}')"
                    style="font-size: 0.7rem; padding: 0.15rem 0.3rem; border: 1px solid #E5E7EB; border-radius: 0.25rem; background: white; cursor: pointer; color: #6B7280;"
                    title="Cambiar estado"
                  >
                    <option value="pending" ${status === 'pending' ? 'selected' : ''}>⏳ Pendiente</option>
                    <option value="in_progress" ${status === 'in_progress' ? 'selected' : ''}>🔄 En Progreso</option>
                    <option value="review" ${status === 'review' ? 'selected' : ''}>👀 Revisión</option>
                    <option value="completed" ${status === 'completed' ? 'selected' : ''}>✅ Completado</option>
                    <option value="cancelled" ${status === 'cancelled' ? 'selected' : ''}>❌ Cancelado</option>
                  </select>
                </div>
              </div>
            </div>
            
            <!-- Project Info compacto -->
            <div style="font-size: 0.7rem;">
              <div style="display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.3rem; flex-wrap: wrap;">
                ${getProjectTypeBadge(project.project_type || 'internal')}
              </div>
              ${project.client_name ? `
                <div style="color: #6B7280; margin-bottom: 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  <i class="fas fa-user" style="font-size: 0.65rem; opacity: 0.6;"></i> ${project.client_name}
                </div>
              ` : ''}
              ${project.deadline ? `
                <div style="display: flex; align-items: center; gap: 0.25rem; color: #9CA3AF;">
                  <span>⏰</span>
                  <span>${formatDate(project.deadline)}</span>
                </div>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ============================================
// RENDER TAREAS
// ============================================
function renderTasks() {
  const tasks = STATE.tasks || [];
  
  const byStatus = {
    pending: tasks.filter(t => t.status === 'pending'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    review: tasks.filter(t => t.status === 'review'),
    completed: tasks.filter(t => t.status === 'completed')
  };
  
  const totalTasks = tasks.length;
  const activeTasks = byStatus.pending.length + byStatus.in_progress.length + byStatus.review.length;
  const overdueTasks = tasks.filter(t => {
    if (!t.due_date || t.status === 'completed') return false;
    return new Date(t.due_date) < new Date();
  }).length;
  
  return renderLayout(`
    <div style="margin-bottom: 2rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h1 style="font-size: 2rem; font-weight: bold; color: #2D2C3E; margin: 0;">Tareas</h1>
        <button onclick="showNewTaskModal()" style="background: linear-gradient(135deg, #572c83 0%, #08a48d 100%); color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600; box-shadow: 0 2px 4px rgba(123, 95, 184, 0.3);">
          ➕ Nueva Tarea
        </button>
      </div>
      
      <!-- Stats Bar -->
      <div style="display: flex; gap: 1rem; padding: 1rem; background: white; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 1.5rem;">
        <div style="flex: 1; text-align: center; padding: 0.5rem;">
          <div style="font-size: 1.75rem; font-weight: 700; color: #572c83;">${activeTasks}</div>
          <div style="font-size: 0.75rem; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em;">Activas</div>
        </div>
        <div style="flex: 1; text-align: center; padding: 0.5rem; border-left: 1px solid #E5E7EB;">
          <div style="font-size: 1.75rem; font-weight: 700; color: ${overdueTasks > 0 ? '#EF4444' : '#08a48d'};">${overdueTasks}</div>
          <div style="font-size: 0.75rem; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em;">Atrasadas</div>
        </div>
        <div style="flex: 1; text-align: center; padding: 0.5rem; border-left: 1px solid #E5E7EB;">
          <div style="font-size: 1.75rem; font-weight: 700; color: #08a48d;">${byStatus.completed.length}</div>
          <div style="font-size: 0.75rem; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em;">Completadas</div>
        </div>
        <div style="flex: 1; text-align: center; padding: 0.5rem; border-left: 1px solid #E5E7EB;">
          <div style="font-size: 1.75rem; font-weight: 700; color: #6B7280;">${totalTasks}</div>
          <div style="font-size: 0.75rem; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em;">Total</div>
        </div>
      </div>
      
      <!-- Quick Tip -->
      <div style="background: rgba(8,164,141,0.1); border-left: 4px solid #08a48d; border-radius: 0.5rem; padding: 0.75rem 1rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem;">
        <div style="font-size: 1.25rem;">💡</div>
        <div style="flex: 1;">
          <span style="font-weight: 600; color: #2D2C3E; font-size: 0.875rem;">Usa el dropdown</span>
          <span style="color: #6B7280; font-size: 0.8rem; margin-left: 0.5rem;">en cada tarea para cambiar el estado rápidamente</span>
        </div>
      </div>
    </div>
    
    <!-- Kanban Board para Tareas -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; overflow-x: auto; padding-bottom: 1rem;">
      ${renderTaskKanbanColumn('⏳ Pendiente', 'pending', byStatus.pending, '#FEF3C7', '#92400E')}
      ${renderTaskKanbanColumn('🔄 En Progreso', 'in_progress', byStatus.in_progress, '#DBEAFE', '#1E40AF')}
      ${renderTaskKanbanColumn('👀 Revisión', 'review', byStatus.review, '#E9D5FF', '#6B21A8')}
      ${renderTaskKanbanColumn('✅ Completado', 'completed', byStatus.completed, '#D1FAE5', '#065F46')}
    </div>
  `);
}

function renderTaskKanbanColumn(title, status, tasks, bgColor, textColor) {
  return `
    <div 
      class="kanban-column-task" 
      data-status="${status}"
      ondrop="handleTaskDrop(event, '${status}')" 
      ondragover="handleTaskDragOver(event)"
      ondragleave="handleTaskDragLeave(event)"
      style="background: ${bgColor}; padding: 0.75rem; border-radius: 0.75rem; max-height: 70vh; overflow-y: auto; transition: all 0.2s ease;">
      <h3 style="color: ${textColor}; font-weight: 700; margin: 0 0 0.75rem 0; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; background: ${bgColor}; z-index: 10; padding-bottom: 0.5rem;">
        <span>${title}</span>
        <span style="background: white; color: ${textColor}; padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 600;">${tasks.length}</span>
      </h3>
      <div class="kanban-cards-task" style="display: flex; flex-direction: column; gap: 0.5rem; min-height: 100px;">
        ${tasks.length === 0 ? `
          <div style="border: 2px dashed ${textColor}40; border-radius: 0.5rem; padding: 2rem; text-align: center; color: ${textColor}60; font-size: 0.875rem;">
            Arrastra tareas aquí
          </div>
        ` : tasks.map(task => {
          const isOverdue = task.due_date && new Date(task.due_date) < new Date() && status !== 'completed';
          return `
          <div 
            data-task-id="${task.id}"
            class="task-card"
            style="background: white; padding: 0.65rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 3px solid ${isOverdue ? '#EF4444' : textColor}; transition: all 0.2s ease;"
            onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 3px 6px rgba(0,0,0,0.12)'" 
            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.1)'">
            
            <!-- Header con dropdown -->
            <div style="display: flex; align-items: start; gap: 0.5rem; margin-bottom: 0.5rem;">
              <div style="flex: 1; min-width: 0;">
                <h4 onclick="viewTaskDetail(${task.id})" style="font-size: 0.8rem; font-weight: 600; color: #1F2937; margin: 0 0 0.35rem 0; line-height: 1.3; cursor: pointer; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${task.title}</h4>
                <div style="display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap;">
                  ${getPriorityBadge(task.priority)}
                  ${isOverdue ? '<span style="font-size: 0.65rem; padding: 0.15rem 0.4rem; background: #FEE2E2; color: #991B1B; border-radius: 0.25rem; font-weight: 600;">🔴 ATRASADA</span>' : ''}
                  <!-- Dropdown para cambiar estado -->
                  <select 
                    onclick="event.stopPropagation();"
                    onchange="changeTaskStatus(${task.id}, this.value, '${status}')"
                    style="font-size: 0.7rem; padding: 0.15rem 0.3rem; border: 1px solid #E5E7EB; border-radius: 0.25rem; background: white; cursor: pointer; color: #6B7280;"
                    title="Cambiar estado"
                  >
                    <option value="pending" ${status === 'pending' ? 'selected' : ''}>⏳ Pendiente</option>
                    <option value="in_progress" ${status === 'in_progress' ? 'selected' : ''}>🔄 En Progreso</option>
                    <option value="review" ${status === 'review' ? 'selected' : ''}>👀 Revisión</option>
                    <option value="completed" ${status === 'completed' ? 'selected' : ''}>✅ Completada</option>
                  </select>
                </div>
              </div>
            </div>
            
            <!-- Task Info compacto -->
            <div style="font-size: 0.7rem;">
              ${task.description ? `
                <p style="color: #6B7280; margin: 0 0 0.4rem 0; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                  ${task.description}
                </p>
              ` : ''}
              
              ${task.project_name ? `
                <div style="display: flex; align-items: center; gap: 0.25rem; color: #6B7280; margin-bottom: 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  <i class="fas fa-folder" style="font-size: 0.65rem; opacity: 0.6;"></i>
                  <span>${task.project_name}</span>
                </div>
              ` : ''}
              
              ${task.due_date ? `
                <div style="display: flex; align-items: center; gap: 0.25rem; color: ${isOverdue ? '#EF4444' : '#9CA3AF'}; font-weight: ${isOverdue ? '600' : '400'};">
                  <span>${isOverdue ? '🔴' : '⏰'}</span>
                  <span>${formatDate(task.due_date)}</span>
                </div>
              ` : ''}
            </div>
          </div>
        `;
        }).join('')}
      </div>
    </div>
  `;
}

// ============================================
// RENDER CALENDARIO
// ============================================
function renderCalendar() {
  const events = STATE.events || [];
  const today = new Date();
  const upcomingEvents = events.filter(e => new Date(e.start_datetime) >= today).slice(0, 10);
  
  return renderLayout(`
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
      <h1 style="font-size: 2rem; font-weight: bold; color: #2D2C3E; margin: 0;">Calendario</h1>
      <button onclick="showNewEventModal()" style="background: linear-gradient(135deg, #572c83 0%, #08a48d 100%); color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600;">
        ➕ Nuevo Evento
      </button>
    </div>
    
    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem;">
      <div style="background: white; padding: 2rem; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h2 style="font-size: 1.25rem; font-weight: 600; color: #2D2C3E; margin: 0 0 1rem 0;">
          📅 ${today.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        </h2>
        <div style="text-align: center; padding: 3rem; color: #9CA3AF;">
          <div style="font-size: 4rem; margin-bottom: 1rem;">📆</div>
          <p>Vista de calendario completa próximamente</p>
        </div>
      </div>
      
      <div style="background: white; padding: 1.5rem; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h3 style="font-size: 1.125rem; font-weight: 600; color: #2D2C3E; margin: 0 0 1rem 0;">Próximos Eventos</h3>
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${upcomingEvents.map(event => `
            <div style="padding: 1rem; background: #F9FAFB; border-left: 4px solid #E91E8C; border-radius: 0.25rem;">
              <h4 style="font-size: 0.875rem; font-weight: 600; color: #1F2937; margin: 0 0 0.5rem 0;">${event.title}</h4>
              <p style="font-size: 0.75rem; color: #6B7280; margin: 0 0 0.25rem 0;">
                ⏰ ${formatDateTime(event.start_datetime)}
              </p>
              ${event.client_name ? `<p style="font-size: 0.75rem; color: #9CA3AF; margin: 0;">👤 ${event.client_name}</p>` : ''}
            </div>
          `).join('')}
          
          ${upcomingEvents.length === 0 ? `
            <div style="text-align: center; padding: 2rem; color: #9CA3AF;">
              <div style="font-size: 3rem; margin-bottom: 0.5rem;">📅</div>
              <p style="font-size: 0.875rem;">No hay eventos próximos</p>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `);
}

// ============================================
// RENDER RECURSOS
// ============================================
function renderResources() {
  return renderLayout(`
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
      <h1 style="font-size: 2rem; font-weight: bold; color: #2D2C3E; margin: 0;">Biblioteca de Recursos</h1>
      <button onclick="showNewResourceModal()" style="background: linear-gradient(135deg, #572c83 0%, #08a48d 100%); color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600;">
        ➕ Subir Recurso
      </button>
    </div>
    
    <div style="background: white; padding: 3rem; border-radius: 0.75rem; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="font-size: 4rem; margin-bottom: 1rem;">📚</div>
      <h3 style="font-size: 1.5rem; font-weight: 600; color: #374151; margin: 0 0 0.5rem 0;">Recursos y Documentación</h3>
      <p style="color: #6B7280; margin: 0;">Próximamente disponible</p>
    </div>
  `);
}


// ============================================
// MODAL FUNCTIONS
// ============================================
// Las funciones principales de modales están en modals.js
// Estas son funciones auxiliares

function showNewResourceModal() {
  showNotification('Modal de nuevo recurso - Próximamente', 'info');
}

function filterTasks(status) {
  showNotification(`Filtrar tareas por ${status || 'todas'} - Próximamente`, 'info');
}

// Las funciones viewClientDetail, viewProjectDetail, viewTaskDetail
// están ahora en detail-views.js


// Añadir estilos CSS para animaciones
const styleNotifications = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
  
  * {
    box-sizing: border-box;
  }
  
  body {
    margin: 0;
    padding: 0;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
`;
document.head.appendChild(styleNotifications);

// ============================================
// PROJECT DRAG & DROP HANDLERS
// ============================================

let draggedProjectId = null;
let draggedFromStatus = null;

function handleProjectDragStart(event, projectId, currentStatus) {
  draggedProjectId = projectId;
  draggedFromStatus = currentStatus;
  event.target.style.opacity = '0.5';
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/html', event.target.innerHTML);
}

function handleProjectDragEnd(event) {
  event.target.style.opacity = '1';
  
  // Remove all drag-over styles
  document.querySelectorAll('.kanban-column').forEach(col => {
    col.style.background = '';
    col.style.transform = '';
  });
}

function handleProjectDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  
  // Visual feedback
  const column = event.currentTarget;
  if (column.classList.contains('kanban-column')) {
    column.style.transform = 'scale(1.02)';
    column.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  }
  
  return false;
}

function handleProjectDragLeave(event) {
  const column = event.currentTarget;
  if (column.classList.contains('kanban-column')) {
    column.style.transform = '';
    column.style.boxShadow = '';
  }
}

async function handleProjectDrop(event, newStatus) {
  event.preventDefault();
  event.stopPropagation();
  
  const column = event.currentTarget;
  column.style.transform = '';
  column.style.boxShadow = '';
  
  if (!draggedProjectId || draggedFromStatus === newStatus) {
    return;
  }
  
  await changeProjectStatus(draggedProjectId, newStatus, draggedFromStatus);
  
  draggedProjectId = null;
  draggedFromStatus = null;
}

// Función para cambiar estado (usado por dropdown y drag & drop)
async function changeProjectStatus(projectId, newStatus, oldStatus) {
  if (oldStatus === newStatus) {
    return; // No hacer nada si el estado no cambió
  }
  
  try {
    // Mostrar notificación de cambio
    showNotification('🔄 Cambiando estado del proyecto...', 'info');
    
    // Hacer la llamada API para actualizar el estado
    await apiCall(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
    
    // Recargar proyectos para reflejar el cambio
    await loadProjects();
    
    // Mostrar notificación de éxito con emoji según el nuevo estado
    const statusEmojis = {
      'pending': '⏳',
      'in_progress': '🔄',
      'review': '👀',
      'completed': '✅',
      'cancelled': '❌'
    };
    
    const statusNames = {
      'pending': 'Pendiente',
      'in_progress': 'En Progreso',
      'review': 'Revisión',
      'completed': 'Completado',
      'cancelled': 'Cancelado'
    };
    
    showNotification(
      `${statusEmojis[newStatus]} Proyecto movido a: ${statusNames[newStatus]}`, 
      'success'
    );
    
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    showNotification('❌ Error al cambiar el estado del proyecto', 'error');
    await loadProjects(); // Recargar para volver al estado anterior
  }
}

// ============================================
// DASHBOARD CHARTS
// ============================================

function renderDashboardCharts() {
  // Esperar a que el DOM esté listo
  setTimeout(() => {
    renderProjectsChart();
    renderTasksChart();
    renderLeadsChart();
  }, 100);
}

function renderProjectsChart() {
  const container = document.getElementById('projectsChart');
  if (!container) return;
  
  const projects = STATE.projects || [];
  const statuses = {
    'pending': { count: 0, label: 'Pendiente', color: '#F59E0B' },
    'in_progress': { count: 0, label: 'En Progreso', color: '#572c83' },
    'review': { count: 0, label: 'Revisión', color: '#572c83' },
    'completed': { count: 0, label: 'Completado', color: '#08a48d' },
    'cancelled': { count: 0, label: 'Cancelado', color: '#EF4444' }
  };
  
  projects.forEach(p => {
    if (statuses[p.status]) statuses[p.status].count++;
  });
  
  // Filtrar estados con proyectos
  const data = Object.entries(statuses).filter(([_, v]) => v.count > 0);
  
  if (data.length === 0) {
    container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #9CA3AF;">No hay proyectos</div>';
    return;
  }
  
  // Renderizar como barras horizontales
  container.innerHTML = data.map(([key, status]) => {
    const percentage = projects.length > 0 ? (status.count / projects.length * 100).toFixed(0) : 0;
    return `
      <div style="margin-bottom: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <span style="font-size: 0.875rem; color: #6B7280; font-weight: 500;">${status.label}</span>
          <span style="font-size: 0.875rem; font-weight: 600; color: #2D2C3E;">${status.count} (${percentage}%)</span>
        </div>
        <div style="background: #E5E7EB; height: 32px; border-radius: 0.5rem; overflow: hidden;">
          <div style="background: ${status.color}; height: 100%; width: ${percentage}%; transition: width 0.3s ease; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 0.875rem;">
            ${percentage}%
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderTasksChart() {
  const container = document.getElementById('tasksChart');
  if (!container) return;
  
  const tasks = STATE.tasks || [];
  const priorities = {
    'urgent': { count: 0, label: 'Urgente', color: '#EF4444', icon: '🔴' },
    'high': { count: 0, label: 'Alta', color: '#F59E0B', icon: '🟠' },
    'medium': { count: 0, label: 'Media', color: '#3B82F6', icon: '🟡' },
    'low': { count: 0, label: 'Baja', color: '#10B981', icon: '🟢' }
  };
  
  tasks.forEach(t => {
    if (priorities[t.priority]) priorities[t.priority].count++;
  });
  
  const data = Object.entries(priorities);
  const maxCount = Math.max(...data.map(([_, p]) => p.count));
  
  if (maxCount === 0) {
    container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #9CA3AF;">No hay tareas</div>';
    return;
  }
  
  // Renderizar como gráfico de barras verticales
  container.innerHTML = `
    <div style="display: flex; align-items: end; justify-content: space-around; height: 200px; gap: 1rem;">
      ${data.map(([key, priority]) => {
        const heightPercent = maxCount > 0 ? (priority.count / maxCount * 100) : 0;
        return `
          <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
            <div style="font-weight: 700; font-size: 1.25rem; color: ${priority.color};">${priority.count}</div>
            <div style="width: 100%; background: ${priority.color}; height: ${heightPercent}%; min-height: ${priority.count > 0 ? '20px' : '0'}; border-radius: 0.5rem 0.5rem 0 0; transition: height 0.3s ease;"></div>
            <div style="text-align: center; font-size: 0.75rem; color: #6B7280; font-weight: 500;">
              <div style="font-size: 1.25rem; margin-bottom: 0.25rem;">${priority.icon}</div>
              ${priority.label}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderLeadsChart() {
  const container = document.getElementById('leadsChart');
  if (!container) return;
  
  const clients = STATE.clients || [];
  const leadQualities = {
    'hot': { count: 0, label: 'HOT', color: '#DC2626', icon: '🔴' },
    'warm': { count: 0, label: 'WARM', color: '#F59E0B', icon: '🟠' },
    'cold': { count: 0, label: 'COLD', color: '#EAB308', icon: '🟡' },
    'qualified': { count: 0, label: 'ACTIVOS', color: '#10B981', icon: '🟢' }
  };
  
  clients.forEach(c => {
    if (c.client_status === 'active') {
      leadQualities['qualified'].count++;
    } else if (leadQualities[c.lead_quality]) {
      leadQualities[c.lead_quality].count++;
    }
  });
  
  const data = Object.entries(leadQualities);
  const maxCount = Math.max(...data.map(([_, l]) => l.count));
  
  if (maxCount === 0) {
    container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #9CA3AF;">No hay clientes</div>';
    return;
  }
  
  // Renderizar como gráfico de barras verticales
  container.innerHTML = `
    <div style="display: flex; align-items: end; justify-content: space-around; height: 200px; gap: 1rem;">
      ${data.map(([key, lead]) => {
        const heightPercent = maxCount > 0 ? (lead.count / maxCount * 100) : 0;
        return `
          <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
            <div style="font-weight: 700; font-size: 1.25rem; color: ${lead.color};">${lead.count}</div>
            <div style="width: 100%; background: ${lead.color}; height: ${heightPercent}%; min-height: ${lead.count > 0 ? '20px' : '0'}; border-radius: 0.5rem 0.5rem 0 0; transition: height 0.3s ease;"></div>
            <div style="text-align: center; font-size: 0.75rem; color: #6B7280; font-weight: 500;">
              <div style="font-size: 1.25rem; margin-bottom: 0.25rem;">${lead.icon}</div>
              ${lead.label}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ============================================
// PROJECT FILTERS
// ============================================

if (!STATE.projectFilters) {
  STATE.projectFilters = {
    search: '',
    priority: '',
    client: ''
  };
}

function filterProjects() {
  const searchInput = document.getElementById('project-search');
  const prioritySelect = document.getElementById('project-filter-priority');
  const clientSelect = document.getElementById('project-filter-client');
  
  STATE.projectFilters = {
    search: searchInput ? searchInput.value.toLowerCase() : '',
    priority: prioritySelect ? prioritySelect.value : '',
    client: clientSelect ? clientSelect.value : ''
  };
  
  render();
}

function clearProjectFilters() {
  STATE.projectFilters = {
    search: '',
    priority: '',
    client: ''
  };
  
  render();
  
  // Reset form inputs
  setTimeout(() => {
    const searchInput = document.getElementById('project-search');
    const prioritySelect = document.getElementById('project-filter-priority');
    const clientSelect = document.getElementById('project-filter-client');
    
    if (searchInput) searchInput.value = '';
    if (prioritySelect) prioritySelect.value = '';
    if (clientSelect) clientSelect.value = '';
  }, 0);
}

function getFilteredProjects() {
  let filtered = STATE.projects || [];
  
  if (STATE.projectFilters.search) {
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(STATE.projectFilters.search) ||
      (p.client_name && p.client_name.toLowerCase().includes(STATE.projectFilters.search))
    );
  }
  
  if (STATE.projectFilters.priority) {
    filtered = filtered.filter(p => p.priority === STATE.projectFilters.priority);
  }
  
  if (STATE.projectFilters.client) {
    filtered = filtered.filter(p => p.client_name === STATE.projectFilters.client);
  }
  
  return filtered;
}

// ============================================
// TASK DRAG & DROP HANDLERS
// ============================================

let draggedTaskId = null;
let draggedTaskFromStatus = null;

function handleTaskDragStart(event, taskId, currentStatus) {
  draggedTaskId = taskId;
  draggedTaskFromStatus = currentStatus;
  event.target.style.opacity = '0.5';
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/html', event.target.innerHTML);
}

function handleTaskDragEnd(event) {
  event.target.style.opacity = '1';
  
  // Remove all drag-over styles
  document.querySelectorAll('.kanban-column-task').forEach(col => {
    col.style.background = '';
    col.style.transform = '';
  });
}

function handleTaskDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  
  // Visual feedback
  const column = event.currentTarget;
  if (column.classList.contains('kanban-column-task')) {
    column.style.transform = 'scale(1.02)';
    column.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  }
  
  return false;
}

function handleTaskDragLeave(event) {
  const column = event.currentTarget;
  if (column.classList.contains('kanban-column-task')) {
    column.style.transform = '';
    column.style.boxShadow = '';
  }
}

// Función compartida para cambiar estado de tarea (dropdown + drag & drop)
async function changeTaskStatus(taskId, newStatus, oldStatus) {
  if (oldStatus === newStatus) return;
  
  try {
    showNotification('🔄 Cambiando estado de la tarea...', 'info');
    
    await apiCall(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
    
    await loadTasks();
    
    const statusEmojis = {
      'pending': '⏳',
      'in_progress': '🔄',
      'review': '👀',
      'completed': '✅'
    };
    
    const statusNames = {
      'pending': 'Pendiente',
      'in_progress': 'En Progreso',
      'review': 'Revisión',
      'completed': 'Completada'
    };
    
    showNotification(
      `${statusEmojis[newStatus]} Tarea movida a: ${statusNames[newStatus]}`, 
      'success'
    );
    
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    showNotification('❌ Error al cambiar el estado de la tarea', 'error');
    await loadTasks();
  }
}

async function handleTaskDrop(event, newStatus) {
  event.preventDefault();
  event.stopPropagation();
  
  const column = event.currentTarget;
  column.style.transform = '';
  column.style.boxShadow = '';
  
  if (!draggedTaskId || draggedTaskFromStatus === newStatus) {
    return;
  }
  
  // Usar función compartida
  await changeTaskStatus(draggedTaskId, newStatus, draggedTaskFromStatus);
  
  draggedTaskId = null;
  draggedTaskFromStatus = null;
}

// ============================================
// CLIENT LEAD QUALITY & STATUS BADGES
// ============================================

function getLeadQualityBadge(quality) {
  const badges = {
    'hot': { emoji: '🔴', label: 'HOT', bg: '#FEE2E2', color: '#DC2626', border: '#EF4444' },
    'warm': { emoji: '🟠', label: 'WARM', bg: '#FED7AA', color: '#EA580C', border: '#F97316' },
    'cold': { emoji: '🟡', label: 'COLD', bg: '#FEF3C7', color: '#D97706', border: '#F59E0B' },
    'qualified': { emoji: '🟢', label: 'QUALIFIED', bg: '#D1FAE5', color: '#059669', border: '#10B981' }
  };
  
  const badge = badges[quality] || badges['cold'];
  
  return `
    <span style="
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      background: ${badge.bg};
      color: ${badge.color};
      border: 1px solid ${badge.border};
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 600;
    ">
      ${badge.emoji} ${badge.label}
    </span>
  `;
}

function getClientStatusBadge(status) {
  const badges = {
    'prospect': { emoji: '💼', label: 'Prospecto', bg: '#DBEAFE', color: '#1E40AF', border: '#3B82F6' },
    'active': { emoji: '✅', label: 'Activo', bg: '#D1FAE5', color: '#065F46', border: '#10B981' }
  };
  
  const badge = badges[status] || badges['prospect'];
  
  return `
    <span style="
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      background: ${badge.bg};
      color: ${badge.color};
      border: 1px solid ${badge.border};
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 600;
    ">
      ${badge.emoji} ${badge.label}
    </span>
  `;
}

// ============================================
// CLIENT FILTERS
// ============================================

if (!STATE.clientFilters) {
  STATE.clientFilters = {
    search: '',
    lead_quality: '',
    client_status: '',
    collective: ''
  };
}

function filterClients() {
  const search = document.getElementById('client-search')?.value || '';
  const lead_quality = document.getElementById('client-filter-lead-quality')?.value || '';
  const client_status = document.getElementById('client-filter-status')?.value || '';
  const collective = document.getElementById('client-filter-collective')?.value || '';
  
  STATE.clientFilters = {
    search: search.toLowerCase(),
    lead_quality,
    client_status,
    collective
  };
  
  render();
}

function clearClientFilters() {
  STATE.clientFilters = {
    search: '',
    lead_quality: '',
    client_status: '',
    collective: ''
  };
  render();
}

function getFilteredClients() {
  let filtered = STATE.clients || [];
  
  if (STATE.clientFilters.search) {
    filtered = filtered.filter(c => 
      c.business_name.toLowerCase().includes(STATE.clientFilters.search) ||
      (c.contact_name && c.contact_name.toLowerCase().includes(STATE.clientFilters.search)) ||
      (c.email && c.email.toLowerCase().includes(STATE.clientFilters.search))
    );
  }
  
  if (STATE.clientFilters.lead_quality) {
    filtered = filtered.filter(c => c.lead_quality === STATE.clientFilters.lead_quality);
  }
  
  if (STATE.clientFilters.client_status) {
    filtered = filtered.filter(c => c.client_status === STATE.clientFilters.client_status);
  }
  
  if (STATE.clientFilters.collective) {
    filtered = filtered.filter(c => c.collective === STATE.clientFilters.collective);
  }
  
  return filtered;
}

// ============================================
// PROJECT TYPE UTILITIES
// ============================================

function getProjectTypeBadge(projectType) {
  const badges = {
    'client': {
      emoji: '👥',
      label: 'CLIENTE',
      bg: '#DBEAFE',
      color: '#1E40AF',
      border: '#3B82F6'
    },
    'internal': {
      emoji: '🏢',
      label: 'INTERNO',
      bg: '#F3E8FF',
      color: '#6B21A8',
      border: '#A855F7'
    },
    'company': {
      emoji: '⚙️',
      label: 'EMPRESA',
      bg: '#FEF3C7',
      color: '#92400E',
      border: '#F59E0B'
    }
  };
  
  const badge = badges[projectType] || badges['internal'];
  
  return `
    <span style="
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 9999px;
      background: ${badge.bg};
      color: ${badge.color};
      border: 2px solid ${badge.border};
    ">
      ${badge.emoji} ${badge.label}
    </span>
  `;
}

// ============================================
// PROJECT FILTERS
// ============================================

function filterProjects() {
  const search = document.getElementById('project-search')?.value || '';
  const type = document.getElementById('project-filter-type')?.value || 'all';
  const status = document.getElementById('project-filter-status')?.value || '';
  const priority = document.getElementById('project-filter-priority')?.value || '';
  
  STATE.projectFilters = {
    search: search.toLowerCase(),
    type,
    status,
    priority
  };
  
  render();
}

function clearProjectFilters() {
  STATE.projectFilters = {
    search: '',
    type: 'all',
    status: '',
    priority: ''
  };
  render();
}

function getFilteredProjects() {
  let filtered = STATE.projects || [];
  
  if (STATE.projectFilters.search) {
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(STATE.projectFilters.search) ||
      (p.description && p.description.toLowerCase().includes(STATE.projectFilters.search)) ||
      (p.client_name && p.client_name.toLowerCase().includes(STATE.projectFilters.search))
    );
  }
  
  if (STATE.projectFilters.type && STATE.projectFilters.type !== 'all') {
    filtered = filtered.filter(p => p.project_type === STATE.projectFilters.type);
  }
  
  if (STATE.projectFilters.status) {
    filtered = filtered.filter(p => p.status === STATE.projectFilters.status);
  }
  
  if (STATE.projectFilters.priority) {
    filtered = filtered.filter(p => p.priority === STATE.projectFilters.priority);
  }
  
  return filtered;
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  try {
    const { user } = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    STATE.currentUser = user;
    STATE.currentView = 'dashboard';
    render();
    loadDashboardData();
    showNotification('¡Bienvenida, ' + user.name + '!', 'success');
  } catch (error) {
    document.getElementById('loginError').textContent = 'Credenciales inválidas';
    document.getElementById('loginError').style.display = 'block';
  }
}

async function handleLogout() {
  try {
    await apiCall('/auth/logout', { method: 'POST' });
    STATE.currentUser = null;
    STATE.currentView = 'dashboard';
    render();
    showNotification('Sesión cerrada', 'info');
  } catch (error) {
    console.error('Logout error:', error);
  }
}

async function checkAuth() {
  try {
    const { user } = await apiCall('/auth/me');
    STATE.currentUser = user;
    return true;
  } catch {
    return false;
  }
}

// ============================================
// NAVIGATION
// ============================================

function navigateTo(view) {
  STATE.currentView = view;
  
  // Para documentos, cargar datos ANTES de renderizar
  // Temporalmente deshabilitado - tabla no existe
  // if (view === 'documents' && typeof loadDocuments === 'function') {
  //   render(); // Muestra "Cargando carpetas..."
  //   loadDocuments(); // Carga datos y hace render() automáticamente cuando termina
  //   return;
  // }
  
  // Para recursos, cargar datos ANTES de renderizar
  if (view === 'resources' && typeof loadResources === 'function') {
    render(); // Muestra "Cargando recursos..."
    loadResources(); // Carga datos y hace render() automáticamente cuando termina
    return;
  }
  
  // Para otras vistas, render inmediato
  render();
  
  // Load data for the view
  switch(view) {
    case 'dashboard':
      loadDashboardData();
      break;
    case 'clients':
      loadClients();
      break;
    case 'projects':
      loadProjects();
      break;
    case 'tasks':
      loadTasks();
      break;
    case 'calendar':
      loadEvents();
      break;
  }
}

// ============================================
// DATA LOADING FUNCTIONS
// ============================================

async function loadDashboardData() {
  try {
    if (STATE.currentUser?.role === 'client') {
      const { data } = await apiCall('/clients/dashboard');
      console.log('Client dashboard:', data);
    } else {
      const { metrics } = await apiCall('/dashboard/metrics');
      STATE.metrics = metrics;
      
      // Load all data for dashboard
      await Promise.all([
        loadClients(),
        loadProjects(),
        loadTasks()
      ]);
    }
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

async function loadProjects() {
  try {
    const { projects } = await apiCall('/projects');
    STATE.projects = projects;
    render();
  } catch (error) {
    console.error('Error loading projects:', error);
  }
}

async function loadClients() {
  try {
    const { clients } = await apiCall('/clients');
    STATE.clients = clients;
    render();
  } catch (error) {
    console.error('Error loading clients:', error);
  }
}

async function loadTasks() {
  try {
    const { tasks } = await apiCall('/tasks');
    STATE.tasks = tasks;
    render();
  } catch (error) {
    console.error('Error loading tasks:', error);
  }
}

async function loadEvents() {
  try {
    const { events } = await apiCall('/events');
    STATE.events = events;
    render();
  } catch (error) {
    console.error('Error loading events:', error);
  }
}

// ============================================
// MAIN RENDER FUNCTION
// ============================================

function render() {
  const app = document.getElementById('app');
  
  if (!STATE.currentUser) {
    renderLogin(); // Esta función escribe directamente al DOM
    return;
  }
  
  let content = '';
  switch(STATE.currentView) {
    case 'dashboard':
      content = renderDashboard();
      break;
    case 'leads':
      content = typeof renderLeads === 'function' ? renderLeads() : '<div>Cargando leads...</div>';
      break;
    case 'clients':
      content = renderClients();
      break;
    case 'client-detail':
      content = typeof renderClientDetail === 'function' ? renderClientDetail() : renderClients();
      break;
    case 'project-detail':
      content = typeof renderProjectDetail === 'function' ? renderProjectDetail() : renderProjects();
      break;
    case 'task-detail':
      content = typeof renderTaskDetail === 'function' ? renderTaskDetail() : renderTasks();
      break;
    case 'projects':
      content = renderProjects();
      break;
    case 'tasks':
      content = renderTasks();
      break;
    case 'calendar':
      content = renderCalendar();
      break;
    case 'resources':
      content = typeof renderResources === 'function' ? renderResources() : '<div>Cargando recursos...</div>';
      break;
    // case 'documents': // Temporalmente deshabilitado - tabla no existe
    //   content = typeof renderDocuments === 'function' ? renderDocuments() : '<div>Cargando documentos...</div>';
    //   break;
    default:
      content = renderDashboard();
  }
  
  app.innerHTML = content;
  
  // Re-render charts if on dashboard
  if (STATE.currentView === 'dashboard') {
    renderDashboardCharts();
  }
}

// ============================================
// INITIALIZE FUNCTION (llamada desde galia-app.js)
// ============================================
console.log('✅ Galia Digital Full App cargado completamente');

async function initGaliaApp() {
  console.log('🚀 Inicializando Galia Digital Platform...');
  try {
    const isAuth = await checkAuth();
    render();
    if (isAuth) {
      loadDashboardData();
    }
    console.log('✅ Plataforma iniciada correctamente');
  } catch (error) {
    console.error('❌ Error al iniciar:', error);
    render(); // Renderiza login si no está autenticado
  }
}

// Exportar función de inicialización
window.initGaliaApp = initGaliaApp;
