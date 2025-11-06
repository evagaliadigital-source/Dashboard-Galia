// ============================================
// GALIA DIGITAL - FUNCIONES EDITAR Y ELIMINAR
// ============================================

console.log('✏️ Funciones editar/eliminar cargando...');

// ============================================
// FUNCIONES EDITAR
// ============================================

async function editClient(id) {
  try {
    const { client } = await apiCall(`/clients/${id}`);
    // Asegurar que STATE.clients esté cargado para los dropdowns
    if (!STATE.clients || STATE.clients.length === 0) {
      await loadClients();
    }
    showNewClientModal(client);
  } catch (error) {
    console.error('Error al editar cliente:', error);
    showNotification('Error al cargar cliente', 'error');
  }
}

async function editProject(id) {
  try {
    const { project } = await apiCall(`/projects/${id}`);
    // Asegurar que STATE.clients esté cargado para el dropdown de cliente
    if (!STATE.clients || STATE.clients.length === 0) {
      await loadClients();
    }
    showNewProjectModal(project);
  } catch (error) {
    console.error('Error al editar proyecto:', error);
    showNotification('Error al cargar proyecto', 'error');
  }
}

async function editTask(id) {
  try {
    const response = await apiCall(`/tasks/${id}`);
    const task = response.task || response;
    // Asegurar que STATE.projects esté cargado para el dropdown
    if (!STATE.projects || STATE.projects.length === 0) {
      await loadProjects();
    }
    showNewTaskModal(task);
  } catch (error) {
    console.error('Error al editar tarea:', error);
    showNotification('Error al cargar tarea', 'error');
  }
}

async function editEvent(id) {
  try {
    const response = await apiCall(`/events/${id}`);
    const event = response.event || response;
    // Asegurar que STATE.clients esté cargado para el dropdown
    if (!STATE.clients || STATE.clients.length === 0) {
      await loadClients();
    }
    showNewEventModal(event);
  } catch (error) {
    console.error('Error al editar evento:', error);
    showNotification('Error al cargar evento', 'error');
  }
}

// ============================================
// FUNCIONES ELIMINAR
// ============================================

function deleteClient(id) {
  showDeleteConfirmation('cliente', id, async () => {
    try {
      await apiCall(`/clients/${id}`, { method: 'DELETE' });
      showNotification('Cliente eliminado exitosamente', 'success');
      navigateTo('clients');
    } catch (error) {
      showNotification('Error al eliminar cliente', 'error');
    }
  });
}

function deleteProject(id) {
  showDeleteConfirmation('proyecto', id, async () => {
    try {
      await apiCall(`/projects/${id}`, { method: 'DELETE' });
      showNotification('Proyecto eliminado exitosamente', 'success');
      navigateTo('projects');
    } catch (error) {
      showNotification('Error al eliminar proyecto', 'error');
    }
  });
}

function deleteTask(id) {
  showDeleteConfirmation('tarea', id, async () => {
    try {
      await apiCall(`/tasks/${id}`, { method: 'DELETE' });
      showNotification('Tarea eliminada exitosamente', 'success');
      navigateTo('tasks');
    } catch (error) {
      showNotification('Error al eliminar tarea', 'error');
    }
  });
}

function deleteEvent(id) {
  showDeleteConfirmation('evento', id, async () => {
    try {
      await apiCall(`/events/${id}`, { method: 'DELETE' });
      showNotification('Evento eliminado exitosamente', 'success');
      navigateTo('calendar');
    } catch (error) {
      showNotification('Error al eliminar evento', 'error');
    }
  });
}

// ============================================
// MODAL DE CONFIRMACIÓN DE ELIMINACIÓN
// ============================================

function showDeleteConfirmation(type, id, onConfirm) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(5px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    animation: fadeIn 0.3s ease;
  `;
  
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: white;
    border-radius: 1rem;
    width: 90%;
    max-width: 450px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    animation: slideDown 0.3s ease;
  `;
  
  modal.innerHTML = `
    <div style="padding: 2rem; text-align: center;">
      <div style="width: 64px; height: 64px; background: #FEE2E2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
        <span style="font-size: 2rem;">⚠️</span>
      </div>
      
      <h2 style="font-size: 1.5rem; font-weight: 700; color: #2D2C3E; margin: 0 0 0.75rem 0;">
        Confirmar Eliminación
      </h2>
      
      <p style="color: #6B7280; margin: 0 0 0.5rem 0; line-height: 1.6;">
        ¿Estás segura de que deseas eliminar este <strong>${type}</strong>?
      </p>
      
      <p style="color: #EF4444; font-size: 0.875rem; margin: 0 0 2rem 0; font-weight: 600;">
        Esta acción no se puede deshacer.
      </p>
      
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button id="cancelDeleteBtn" style="padding: 0.75rem 1.5rem; border: 2px solid #572c83; color: #572c83; background: white; border-radius: 0.5rem; cursor: pointer; font-weight: 600; transition: all 0.2s;">
          Cancelar
        </button>
        <button id="confirmDeleteBtn" style="padding: 0.75rem 1.5rem; border: none; background: #EF4444; color: white; border-radius: 0.5rem; cursor: pointer; font-weight: 600; transition: all 0.2s;">
          🗑️ Eliminar ${type}
        </button>
      </div>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Botón cancelar
  document.getElementById('cancelDeleteBtn').onclick = () => {
    overlay.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => overlay.remove(), 300);
  };
  
  // Hover effects
  const confirmBtn = document.getElementById('confirmDeleteBtn');
  confirmBtn.onmouseover = () => {
    confirmBtn.style.background = '#DC2626';
    confirmBtn.style.transform = 'translateY(-2px)';
  };
  confirmBtn.onmouseout = () => {
    confirmBtn.style.background = '#EF4444';
    confirmBtn.style.transform = 'translateY(0)';
  };
  
  const cancelBtn = document.getElementById('cancelDeleteBtn');
  cancelBtn.onmouseover = () => {
    cancelBtn.style.background = '#F3F4F6';
  };
  cancelBtn.onmouseout = () => {
    cancelBtn.style.background = 'white';
  };
  
  // Botón confirmar
  confirmBtn.onclick = async () => {
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Eliminando...';
    confirmBtn.style.background = '#9CA3AF';
    
    await onConfirm();
    
    overlay.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => overlay.remove(), 300);
  };
  
  // Cerrar con ESC
  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      overlay.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => overlay.remove(), 300);
      document.removeEventListener('keydown', handleEsc);
    }
  };
  document.addEventListener('keydown', handleEsc);
  
  // Cerrar al hacer clic fuera
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => overlay.remove(), 300);
    }
  });
}

console.log('✅ Funciones editar/eliminar cargadas');
