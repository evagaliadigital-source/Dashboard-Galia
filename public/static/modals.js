// ============================================
// GALIA DIGITAL - SISTEMA DE MODALES PROFESIONALES
// ============================================

// Colores corporativos Galia Digital (extraídos del logo)
const GALIA_COLORS = {
  purple: '#572c83',      // Púrpura medio (GALia texto)
  purpleDark: '#4A3B6E',  // Púrpura oscuro (DIGITAL texto)
  cyan: '#08a48d',        // Turquesa (detalles pulpo)
  blue: '#2D3E7C',        // Azul oscuro (cuerpo pulpo)
  gradient: 'linear-gradient(135deg, #572c83 0%, #08a48d 100%)',
  gradientAlt: 'linear-gradient(135deg, #4A3B6E 0%, #572c83 100%)'
};

// ============================================
// SISTEMA BASE DE MODALES
// ============================================

function createModalOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'modal-overlay';
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
    padding: 1rem;
    overflow-y: auto;
  `;
  
  // Cerrar al hacer clic fuera
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });
  
  // Cerrar con ESC
  document.addEventListener('keydown', handleEscapeKey);
  
  return overlay;
}

function handleEscapeKey(e) {
  if (e.key === 'Escape') {
    closeModal();
  }
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => {
      overlay.remove();
      document.removeEventListener('keydown', handleEscapeKey);
    }, 300);
  }
}

function createModalContainer(title, width = '600px') {
  const container = document.createElement('div');
  container.style.cssText = `
    background: white;
    border-radius: 1rem;
    width: 100%;
    max-width: ${width};
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    animation: slideDown 0.3s ease;
  `;
  
  // Header con logo y título
  const header = document.createElement('div');
  header.style.cssText = `
    background: ${GALIA_COLORS.gradient};
    padding: 1.5rem;
    border-radius: 1rem 1rem 0 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  `;
  
  const headerContent = document.createElement('div');
  headerContent.style.cssText = 'display: flex; align-items: center; gap: 1rem;';
  
  const logo = document.createElement('img');
  logo.src = '/static/galia-logo.png';
  logo.alt = 'Galia Digital';
  logo.style.cssText = 'height: 35px; background: white; padding: 0.25rem 0.5rem; border-radius: 0.5rem;';
  
  const titleElement = document.createElement('h2');
  titleElement.textContent = title;
  titleElement.style.cssText = 'color: white; font-size: 1.5rem; font-weight: 700; margin: 0;';
  
  headerContent.appendChild(logo);
  headerContent.appendChild(titleElement);
  
  const closeButton = document.createElement('button');
  closeButton.textContent = '✕';
  closeButton.onclick = closeModal;
  closeButton.style.cssText = `
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: none;
    width: 2rem;
    height: 2rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 1.25rem;
    transition: all 0.2s;
  `;
  closeButton.onmouseover = () => closeButton.style.background = 'rgba(255, 255, 255, 0.3)';
  closeButton.onmouseout = () => closeButton.style.background = 'rgba(255, 255, 255, 0.2)';
  
  header.appendChild(headerContent);
  header.appendChild(closeButton);
  container.appendChild(header);
  
  return container;
}

function createFormField(label, type = 'text', options = {}) {
  const field = document.createElement('div');
  field.style.cssText = 'margin-bottom: 1.25rem;';
  
  const labelElement = document.createElement('label');
  labelElement.textContent = label + (options.required ? ' *' : '');
  labelElement.style.cssText = `
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: ${GALIA_COLORS.purpleDark};
    font-size: 0.875rem;
  `;
  
  let input;
  
  if (type === 'select') {
    input = document.createElement('select');
    if (options.options) {
      options.options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        input.appendChild(option);
      });
    }
  } else if (type === 'textarea') {
    input = document.createElement('textarea');
    input.rows = options.rows || 4;
  } else {
    input = document.createElement('input');
    input.type = type;
  }
  
  input.name = options.name || '';
  input.placeholder = options.placeholder || '';
  input.required = options.required || false;
  input.value = options.value || '';
  
  input.style.cssText = `
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #E5E7EB;
    border-radius: 0.5rem;
    font-size: 1rem;
    transition: all 0.2s;
    box-sizing: border-box;
  `;
  
  input.addEventListener('focus', () => {
    input.style.borderColor = GALIA_COLORS.cyan;
    input.style.outline = 'none';
  });
  
  input.addEventListener('blur', () => {
    input.style.borderColor = '#E5E7EB';
    if (options.validate) {
      const error = options.validate(input.value);
      if (error) {
        input.style.borderColor = '#EF4444';
        showFieldError(field, error);
      } else {
        clearFieldError(field);
      }
    }
  });
  
  field.appendChild(labelElement);
  field.appendChild(input);
  
  return field;
}

function showFieldError(field, message) {
  clearFieldError(field);
  const error = document.createElement('div');
  error.className = 'field-error';
  error.textContent = '⚠️ ' + message;
  error.style.cssText = 'color: #EF4444; font-size: 0.75rem; margin-top: 0.25rem;';
  field.appendChild(error);
}

function clearFieldError(field) {
  const error = field.querySelector('.field-error');
  if (error) error.remove();
}

function createFormRow(fields) {
  const row = document.createElement('div');
  row.style.cssText = `
    display: grid;
    grid-template-columns: repeat(${fields.length}, 1fr);
    gap: 1rem;
    margin-bottom: 1.25rem;
  `;
  
  fields.forEach(fieldConfig => {
    const field = createFormField(fieldConfig.label, fieldConfig.type, fieldConfig);
    row.appendChild(field);
  });
  
  return row;
}

function createSectionTitle(title, icon = '') {
  const section = document.createElement('div');
  section.style.cssText = `
    margin: 1.5rem 0 1rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid ${GALIA_COLORS.cyan};
  `;
  
  const heading = document.createElement('h3');
  heading.textContent = `${icon} ${title}`;
  heading.style.cssText = `
    color: ${GALIA_COLORS.purple};
    font-size: 1rem;
    font-weight: 700;
    margin: 0;
  `;
  
  section.appendChild(heading);
  return section;
}

function createModalFooter(onSave, saveButtonText = 'Guardar') {
  const footer = document.createElement('div');
  footer.style.cssText = `
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding: 1.5rem;
    border-top: 1px solid #E5E7EB;
  `;
  
  const cancelButton = document.createElement('button');
  cancelButton.textContent = 'Cancelar';
  cancelButton.type = 'button';
  cancelButton.onclick = closeModal;
  cancelButton.style.cssText = `
    padding: 0.75rem 1.5rem;
    border: 2px solid ${GALIA_COLORS.purple};
    color: ${GALIA_COLORS.purple};
    background: white;
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  `;
  cancelButton.onmouseover = () => {
    cancelButton.style.background = '#F3F4F6';
  };
  cancelButton.onmouseout = () => {
    cancelButton.style.background = 'white';
  };
  
  const saveButton = document.createElement('button');
  saveButton.textContent = `💾 ${saveButtonText}`;
  saveButton.type = 'submit';
  saveButton.style.cssText = `
    padding: 0.75rem 1.5rem;
    border: none;
    background: ${GALIA_COLORS.gradient};
    color: white;
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  `;
  saveButton.onmouseover = () => {
    saveButton.style.transform = 'translateY(-2px)';
    saveButton.style.boxShadow = '0 4px 12px rgba(123, 95, 184, 0.4)';
  };
  saveButton.onmouseout = () => {
    saveButton.style.transform = 'translateY(0)';
    saveButton.style.boxShadow = 'none';
  };
  
  footer.appendChild(cancelButton);
  footer.appendChild(saveButton);
  
  return footer;
}

// ============================================
// MODAL CREAR/EDITAR CLIENTE
// ============================================

function showNewClientModal(clientData = null) {
  const overlay = createModalOverlay();
  const modal = createModalContainer(clientData ? 'Editar Cliente' : 'Nuevo Cliente');
  
  const form = document.createElement('form');
  form.style.cssText = 'padding: 1.5rem;';
  
  form.onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    try {
      if (clientData) {
        await updateClient(clientData.id, data);
      } else {
        await createClient(data);
      }
      closeModal();
    } catch (error) {
      console.error('Error al guardar cliente:', error);
    }
  };
  
  // Sección: Información del Negocio
  form.appendChild(createSectionTitle('INFORMACIÓN DEL NEGOCIO', '📋'));
  
  form.appendChild(createFormField('Nombre del negocio', 'text', {
    name: 'business_name',
    placeholder: 'Ej: Peluquería La Rosa',
    required: true,
    value: clientData?.business_name || ''
  }));
  
  form.appendChild(createFormField('Persona de contacto', 'text', {
    name: 'contact_name',
    placeholder: 'Ej: Laura Martínez',
    required: true,
    value: clientData?.contact_name || ''
  }));
  
  // Sección: Contacto
  form.appendChild(createSectionTitle('CONTACTO', '📧'));
  
  form.appendChild(createFormRow([
    {
      label: 'Email',
      type: 'email',
      name: 'email',
      placeholder: 'contacto@ejemplo.com',
      required: true,
      value: clientData?.email || '',
      validate: (value) => {
        if (value && !value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          return 'Formato de email inválido';
        }
        return null;
      }
    },
    {
      label: 'Teléfono',
      type: 'tel',
      name: 'phone',
      placeholder: '654 321 987',
      value: clientData?.phone || ''
    }
  ]));
  
  // Sección: Ubicación
  form.appendChild(createSectionTitle('UBICACIÓN', '📍'));
  
  form.appendChild(createFormField('Dirección', 'text', {
    name: 'address',
    placeholder: 'Calle Mayor 45',
    value: clientData?.address || ''
  }));
  
  form.appendChild(createFormRow([
    {
      label: 'Ciudad',
      type: 'text',
      name: 'city',
      placeholder: 'Madrid',
      value: clientData?.city || ''
    },
    {
      label: 'Instagram',
      type: 'text',
      name: 'instagram',
      placeholder: '@peluqueria',
      value: clientData?.instagram || ''
    }
  ]));
  
  // Sección: Gestión de Lead
  form.appendChild(createSectionTitle('GESTIÓN DE LEAD', '🎯'));
  
  form.appendChild(createFormRow([
    {
      label: 'Calidad del Lead',
      type: 'select',
      name: 'lead_quality',
      required: true,
      value: clientData?.lead_quality || 'cold',
      options: [
        { value: 'hot', label: '🔴 HOT - Listo para cerrar' },
        { value: 'warm', label: '🟠 WARM - Interesado' },
        { value: 'cold', label: '🟡 COLD - Largo plazo' },
        { value: 'qualified', label: '🟢 QUALIFIED - Ya es cliente' }
      ]
    },
    {
      label: 'Estado del Cliente',
      type: 'select',
      name: 'client_status',
      required: true,
      value: clientData?.client_status || 'prospect',
      options: [
        { value: 'prospect', label: '💼 Prospecto' },
        { value: 'active', label: '✅ Activo' }
      ]
    }
  ]));
  
  form.appendChild(createFormField('Colectivo/Asociación (opcional)', 'text', {
    name: 'collective',
    placeholder: 'Ej: Asociación de Peluqueras de Madrid',
    value: clientData?.collective || '',
    helper: '💡 Si pertenece a alguna asociación o colectivo profesional'
  }));
  
  // Sección: Suscripción
  form.appendChild(createSectionTitle('SUSCRIPCIÓN', '💰'));
  
  form.appendChild(createFormRow([
    {
      label: 'Estado',
      type: 'select',
      name: 'subscription_status',
      required: true,
      value: clientData?.subscription_status || 'trial',
      options: [
        { value: 'trial', label: '🎁 Trial' },
        { value: 'active', label: '✅ Activo' },
        { value: 'paused', label: '⏸️ Pausado' },
        { value: 'cancelled', label: '❌ Cancelado' }
      ]
    },
    {
      label: 'Cuota mensual (€)',
      type: 'number',
      name: 'monthly_fee',
      placeholder: '350',
      value: clientData?.monthly_fee || '0'
    }
  ]));
  
  // Footer con botones
  form.appendChild(createModalFooter(null, clientData ? 'Actualizar Cliente' : 'Crear Cliente'));
  
  modal.appendChild(form);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Focus en primer campo
  setTimeout(() => {
    const firstInput = form.querySelector('input');
    if (firstInput) firstInput.focus();
  }, 100);
}

// ============================================
// MODAL CREAR/EDITAR PROYECTO
// ============================================

function showNewProjectModal(projectData = null) {
  const overlay = createModalOverlay();
  const modal = createModalContainer(projectData ? 'Editar Proyecto' : 'Nuevo Proyecto', '700px');
  
  const form = document.createElement('form');
  form.style.cssText = 'padding: 1.5rem;';
  
  form.onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    try {
      if (projectData) {
        await updateProject(projectData.id, data);
      } else {
        await createProject(data);
      }
      closeModal();
    } catch (error) {
      console.error('Error al guardar proyecto:', error);
    }
  };
  
  // Sección: Información Básica
  form.appendChild(createSectionTitle('INFORMACIÓN BÁSICA', '📁'));
  
  form.appendChild(createFormField('Nombre del proyecto', 'text', {
    name: 'name',
    placeholder: 'Ej: Campaña Instagram Primavera 2025',
    required: true,
    value: projectData?.name || ''
  }));
  
  // Selector de tipo de proyecto
  const projectTypeField = document.createElement('div');
  projectTypeField.style.cssText = 'margin-bottom: 1.25rem;';
  
  const projectTypeLabel = document.createElement('label');
  projectTypeLabel.textContent = 'Tipo de Proyecto *';
  projectTypeLabel.style.cssText = `
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: ${GALIA_COLORS.purpleDark};
    font-size: 0.875rem;
  `;
  
  const projectTypeSelect = document.createElement('select');
  projectTypeSelect.name = 'project_type';
  projectTypeSelect.id = 'project-type-select';
  projectTypeSelect.required = true;
  projectTypeSelect.style.cssText = `
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #E5E7EB;
    border-radius: 0.5rem;
    font-size: 1rem;
    box-sizing: border-box;
    font-weight: 600;
  `;
  
  const projectTypes = [
    { value: 'client', label: '👥 Proyecto de Cliente', desc: 'Trabajo facturable para clientes' },
    { value: 'internal', label: '🏢 Proyecto Interno', desc: 'Proyectos internos de Galia Digital' },
    { value: 'company', label: '⚙️ Proyecto Empresa', desc: 'Obligaciones y tareas CEO/empresa' }
  ];
  
  projectTypes.forEach(type => {
    const option = document.createElement('option');
    option.value = type.value;
    option.textContent = type.label;
    option.title = type.desc;
    if (projectData && projectData.project_type === type.value) {
      option.selected = true;
    } else if (!projectData && type.value === 'client') {
      option.selected = true; // Default to client
    }
    projectTypeSelect.appendChild(option);
  });
  
  projectTypeField.appendChild(projectTypeLabel);
  projectTypeField.appendChild(projectTypeSelect);
  form.appendChild(projectTypeField);
  
  // Selector de cliente
  const clientField = document.createElement('div');
  clientField.style.cssText = 'margin-bottom: 1.25rem;';
  clientField.id = 'client-field-container';
  
  const clientLabel = document.createElement('label');
  clientLabel.textContent = 'Cliente';
  clientLabel.id = 'client-label';
  clientLabel.style.cssText = `
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: ${GALIA_COLORS.purpleDark};
    font-size: 0.875rem;
  `;
  
  const clientSelect = document.createElement('select');
  clientSelect.name = 'client_id';
  clientSelect.id = 'client-select';
  clientSelect.required = false; // Changed: not required by default
  clientSelect.style.cssText = `
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #E5E7EB;
    border-radius: 0.5rem;
    font-size: 1rem;
    box-sizing: border-box;
  `;
  
  // Cargar clientes
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Seleccionar cliente...';
  clientSelect.appendChild(defaultOption);
  
  if (STATE.clients && STATE.clients.length > 0) {
    STATE.clients.forEach(client => {
      const option = document.createElement('option');
      option.value = client.id;
      option.textContent = client.business_name;
      if ((projectData && projectData.client_id === client.id) || (STATE.preSelectedClient === client.id)) {
        option.selected = true;
      }
      clientSelect.appendChild(option);
    });
  }
  
  // Limpiar pre-selección
  STATE.preSelectedClient = null;
  
  clientField.appendChild(clientLabel);
  clientField.appendChild(clientSelect);
  form.appendChild(clientField);
  
  // Event listener para cambiar visibilidad de cliente según tipo de proyecto
  projectTypeSelect.addEventListener('change', function() {
    const selectedType = this.value;
    const clientContainer = document.getElementById('client-field-container');
    const clientSelectField = document.getElementById('client-select');
    const clientLabelField = document.getElementById('client-label');
    
    if (selectedType === 'client') {
      // Proyecto de cliente: mostrar y requerir cliente
      clientContainer.style.display = 'block';
      clientSelectField.required = true;
      clientLabelField.textContent = 'Cliente *';
    } else {
      // Proyecto interno/empresa: ocultar cliente
      clientContainer.style.display = 'none';
      clientSelectField.required = false;
      clientSelectField.value = ''; // Clear selection
    }
  });
  
  // Trigger initial state based on project type
  if (projectData) {
    const initialType = projectData.project_type || 'client';
    if (initialType !== 'client') {
      const clientContainer = document.getElementById('client-field-container');
      const clientSelectField = document.getElementById('client-select');
      clientContainer.style.display = 'none';
      clientSelectField.required = false;
    }
  }
  
  form.appendChild(createFormField('Descripción', 'textarea', {
    name: 'description',
    placeholder: 'Describe el proyecto...',
    rows: 3,
    value: projectData?.description || ''
  }));
  
  // Sección: Estado y Prioridad
  form.appendChild(createSectionTitle('ESTADO Y PRIORIDAD', '⚙️'));
  
  form.appendChild(createFormRow([
    {
      label: 'Estado',
      type: 'select',
      name: 'status',
      required: true,
      value: projectData?.status || 'pending',
      options: [
        { value: 'pending', label: '⏳ Pendiente' },
        { value: 'in_progress', label: '🔄 En Progreso' },
        { value: 'review', label: '👀 Revisión' },
        { value: 'completed', label: '✅ Completado' }
      ]
    },
    {
      label: 'Prioridad',
      type: 'select',
      name: 'priority',
      required: true,
      value: projectData?.priority || 'medium',
      options: [
        { value: 'low', label: 'Baja' },
        { value: 'medium', label: 'Media' },
        { value: 'high', label: 'Alta' },
        { value: 'urgent', label: '🔥 Urgente' }
      ]
    }
  ]));
  
  // Sección: Fechas y Presupuesto
  form.appendChild(createSectionTitle('FECHAS Y PRESUPUESTO', '📅'));
  
  form.appendChild(createFormRow([
    {
      label: 'Fecha inicio',
      type: 'date',
      name: 'start_date',
      value: projectData?.start_date ? projectData.start_date.split('T')[0] : ''
    },
    {
      label: 'Fecha fin',
      type: 'date',
      name: 'end_date',
      value: projectData?.end_date ? projectData.end_date.split('T')[0] : ''
    }
  ]));
  
  form.appendChild(createFormField('Presupuesto (€)', 'number', {
    name: 'budget',
    placeholder: '1500',
    value: projectData?.budget || ''
  }));
  
  form.appendChild(createFormField('Brief del cliente', 'textarea', {
    name: 'client_brief',
    placeholder: 'Requisitos y necesidades del cliente...',
    rows: 4,
    value: projectData?.client_brief || ''
  }));
  
  // Footer con botones
  form.appendChild(createModalFooter(null, projectData ? 'Actualizar Proyecto' : 'Crear Proyecto'));
  
  modal.appendChild(form);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Focus en primer campo
  setTimeout(() => {
    const firstInput = form.querySelector('input');
    if (firstInput) firstInput.focus();
  }, 100);
}

// ============================================
// MODAL CREAR/EDITAR TAREA
// ============================================

function showNewTaskModal(taskData = null) {
  const overlay = createModalOverlay();
  const modal = createModalContainer(taskData ? 'Editar Tarea' : 'Nueva Tarea', '600px');
  
  const form = document.createElement('form');
  form.style.cssText = 'padding: 1.5rem;';
  
  form.onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    try {
      if (taskData) {
        await updateTask(taskData.id, data);
      } else {
        await createTask(data);
      }
      closeModal();
    } catch (error) {
      console.error('Error al guardar tarea:', error);
    }
  };
  
  // Sección: Información Básica
  form.appendChild(createSectionTitle('INFORMACIÓN BÁSICA', '✓'));
  
  form.appendChild(createFormField('Título de la tarea', 'text', {
    name: 'title',
    placeholder: 'Ej: Diseñar post de Instagram',
    required: true,
    value: taskData?.title || ''
  }));
  
  form.appendChild(createFormField('Descripción', 'textarea', {
    name: 'description',
    placeholder: 'Detalles de la tarea...',
    rows: 3,
    value: taskData?.description || ''
  }));
  
  // Sección: Asignación
  form.appendChild(createSectionTitle('ASIGNACIÓN', '👤'));
  
  // Selector de proyecto
  const projectField = document.createElement('div');
  projectField.style.cssText = 'margin-bottom: 1.25rem;';
  
  const projectLabel = document.createElement('label');
  projectLabel.textContent = 'Proyecto';
  projectLabel.style.cssText = `
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: ${GALIA_COLORS.purpleDark};
    font-size: 0.875rem;
  `;
  
  const projectSelect = document.createElement('select');
  projectSelect.name = 'project_id';
  projectSelect.style.cssText = `
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #E5E7EB;
    border-radius: 0.5rem;
    font-size: 1rem;
    box-sizing: border-box;
  `;
  
  const projectDefault = document.createElement('option');
  projectDefault.value = '';
  projectDefault.textContent = 'Sin proyecto';
  projectSelect.appendChild(projectDefault);
  
  if (STATE.projects && STATE.projects.length > 0) {
    STATE.projects.forEach(project => {
      const option = document.createElement('option');
      option.value = project.id;
      option.textContent = project.name;
      if ((taskData && taskData.project_id === project.id) || (STATE.preSelectedProject === project.id)) {
        option.selected = true;
      }
      projectSelect.appendChild(option);
    });
  }
  
  // Limpiar pre-selección
  STATE.preSelectedProject = null;
  
  projectField.appendChild(projectLabel);
  projectField.appendChild(projectSelect);
  form.appendChild(projectField);
  
  // Asignar a usuario (simplificado por ahora)
  form.appendChild(createFormField('Asignado a', 'text', {
    name: 'assigned_to',
    placeholder: 'Nombre del miembro del equipo',
    value: taskData?.assigned_to || ''
  }));
  
  // Sección: Estado y Prioridad
  form.appendChild(createSectionTitle('ESTADO Y PRIORIDAD', '⚙️'));
  
  form.appendChild(createFormRow([
    {
      label: 'Estado',
      type: 'select',
      name: 'status',
      required: true,
      value: taskData?.status || 'pending',
      options: [
        { value: 'pending', label: '⏳ Pendiente' },
        { value: 'in_progress', label: '🔄 En Progreso' },
        { value: 'completed', label: '✅ Completado' }
      ]
    },
    {
      label: 'Prioridad',
      type: 'select',
      name: 'priority',
      required: true,
      value: taskData?.priority || 'medium',
      options: [
        { value: 'low', label: 'Baja' },
        { value: 'medium', label: 'Media' },
        { value: 'high', label: 'Alta' },
        { value: 'urgent', label: '🔥 Urgente' }
      ]
    }
  ]));
  
  form.appendChild(createFormField('Fecha límite', 'date', {
    name: 'due_date',
    value: taskData?.due_date ? taskData.due_date.split('T')[0] : ''
  }));
  
  // Footer con botones
  form.appendChild(createModalFooter(null, taskData ? 'Actualizar Tarea' : 'Crear Tarea'));
  
  modal.appendChild(form);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  setTimeout(() => {
    const firstInput = form.querySelector('input');
    if (firstInput) firstInput.focus();
  }, 100);
}

// ============================================
// MODAL CREAR/EDITAR EVENTO
// ============================================

function showNewEventModal(eventData = null) {
  const overlay = createModalOverlay();
  const modal = createModalContainer(eventData ? 'Editar Evento' : 'Nuevo Evento', '600px');
  
  const form = document.createElement('form');
  form.style.cssText = 'padding: 1.5rem;';
  
  form.onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Combinar fecha y hora
    if (data.event_date && data.event_time) {
      data.event_date = `${data.event_date}T${data.event_time}:00`;
      delete data.event_time;
    }
    
    try {
      if (eventData) {
        await updateEvent(eventData.id, data);
      } else {
        await createEvent(data);
      }
      closeModal();
    } catch (error) {
      console.error('Error al guardar evento:', error);
    }
  };
  
  // Sección: Información del Evento
  form.appendChild(createSectionTitle('INFORMACIÓN DEL EVENTO', '📅'));
  
  form.appendChild(createFormField('Título del evento', 'text', {
    name: 'title',
    placeholder: 'Ej: Reunión de seguimiento',
    required: true,
    value: eventData?.title || ''
  }));
  
  form.appendChild(createFormField('Descripción', 'textarea', {
    name: 'description',
    placeholder: 'Detalles del evento...',
    rows: 3,
    value: eventData?.description || ''
  }));
  
  form.appendChild(createFormField('Tipo de evento', 'select', {
    name: 'event_type',
    required: true,
    value: eventData?.event_type || 'meeting',
    options: [
      { value: 'meeting', label: '🤝 Reunión' },
      { value: 'demo', label: '🎯 Demo' },
      { value: 'follow_up', label: '📞 Seguimiento' },
      { value: 'call', label: '☎️ Llamada' },
      { value: 'presentation', label: '📊 Presentación' },
      { value: 'workshop', label: '🎓 Workshop' }
    ]
  }));
  
  // Sección: Fecha y Hora
  form.appendChild(createSectionTitle('FECHA Y HORA', '⏰'));
  
  const eventDate = eventData?.event_date ? new Date(eventData.event_date) : 
                    (STATE.preSelectedEventDate || null);
  
  // Limpiar pre-selección
  STATE.preSelectedEventDate = null;
  
  form.appendChild(createFormRow([
    {
      label: 'Fecha',
      type: 'date',
      name: 'event_date',
      required: true,
      value: eventDate ? eventDate.toISOString().split('T')[0] : ''
    },
    {
      label: 'Hora',
      type: 'time',
      name: 'event_time',
      required: true,
      value: eventDate ? eventDate.toTimeString().slice(0, 5) : ''
    }
  ]));
  
  // Sección: Ubicación y Asistentes
  form.appendChild(createSectionTitle('UBICACIÓN Y ASISTENTES', '📍'));
  
  form.appendChild(createFormField('Ubicación', 'text', {
    name: 'location',
    placeholder: 'Ej: Oficina / Zoom / Google Meet',
    value: eventData?.location || ''
  }));
  
  form.appendChild(createFormField('Asistentes', 'text', {
    name: 'attendees',
    placeholder: 'Separados por comas',
    value: eventData?.attendees || ''
  }));
  
  // Selector de cliente
  const clientField = document.createElement('div');
  clientField.style.cssText = 'margin-bottom: 1.25rem;';
  
  const clientLabel = document.createElement('label');
  clientLabel.textContent = 'Cliente relacionado';
  clientLabel.style.cssText = `
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: ${GALIA_COLORS.purpleDark};
    font-size: 0.875rem;
  `;
  
  const clientSelect = document.createElement('select');
  clientSelect.name = 'client_id';
  clientSelect.style.cssText = `
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #E5E7EB;
    border-radius: 0.5rem;
    font-size: 1rem;
    box-sizing: border-box;
  `;
  
  const clientDefault = document.createElement('option');
  clientDefault.value = '';
  clientDefault.textContent = 'Sin cliente';
  clientSelect.appendChild(clientDefault);
  
  if (STATE.clients && STATE.clients.length > 0) {
    STATE.clients.forEach(client => {
      const option = document.createElement('option');
      option.value = client.id;
      option.textContent = client.business_name;
      if (eventData && eventData.client_id === client.id) {
        option.selected = true;
      }
      clientSelect.appendChild(option);
    });
  }
  
  clientField.appendChild(clientLabel);
  clientField.appendChild(clientSelect);
  form.appendChild(clientField);
  
  // Sección: Recordatorios/Alarmas
  form.appendChild(createSectionTitle('RECORDATORIOS', '🔔'));
  
  const reminderField = document.createElement('div');
  reminderField.style.cssText = 'margin-bottom: 1.25rem;';
  
  const reminderLabel = document.createElement('label');
  reminderLabel.textContent = 'Recordatorio';
  reminderLabel.style.cssText = `
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: ${GALIA_COLORS.purpleDark};
    font-size: 0.875rem;
  `;
  
  const reminderSelect = document.createElement('select');
  reminderSelect.name = 'reminder_minutes';
  reminderSelect.style.cssText = `
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #E5E7EB;
    border-radius: 0.5rem;
    font-size: 1rem;
    box-sizing: border-box;
  `;
  
  const reminders = [
    { value: '0', label: 'Sin recordatorio' },
    { value: '5', label: '5 minutos antes' },
    { value: '10', label: '10 minutos antes' },
    { value: '15', label: '15 minutos antes' },
    { value: '30', label: '30 minutos antes' },
    { value: '60', label: '1 hora antes' },
    { value: '120', label: '2 horas antes' },
    { value: '1440', label: '1 día antes' },
    { value: '2880', label: '2 días antes' },
    { value: '10080', label: '1 semana antes' }
  ];
  
  reminders.forEach(reminder => {
    const option = document.createElement('option');
    option.value = reminder.value;
    option.textContent = reminder.label;
    if (eventData && eventData.reminder_minutes == reminder.value) {
      option.selected = true;
    }
    reminderSelect.appendChild(option);
  });
  
  reminderField.appendChild(reminderLabel);
  reminderField.appendChild(reminderSelect);
  form.appendChild(reminderField);
  
  // Checkbox para enviar recordatorio
  const sendReminderField = document.createElement('div');
  sendReminderField.style.cssText = 'margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem;';
  
  const sendReminderCheckbox = document.createElement('input');
  sendReminderCheckbox.type = 'checkbox';
  sendReminderCheckbox.name = 'send_reminder';
  sendReminderCheckbox.id = 'send_reminder';
  sendReminderCheckbox.checked = eventData?.send_reminder || false;
  sendReminderCheckbox.style.cssText = 'width: 20px; height: 20px; cursor: pointer;';
  
  const sendReminderLabel = document.createElement('label');
  sendReminderLabel.htmlFor = 'send_reminder';
  sendReminderLabel.textContent = 'Enviar notificación por email';
  sendReminderLabel.style.cssText = 'cursor: pointer; font-weight: 500; color: #2D2C3E;';
  
  sendReminderField.appendChild(sendReminderCheckbox);
  sendReminderField.appendChild(sendReminderLabel);
  form.appendChild(sendReminderField);
  
  // Info sobre Google Calendar
  const gcalInfo = document.createElement('div');
  gcalInfo.style.cssText = `
    background: #EFF6FF;
    border: 1px solid #BFDBFE;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1.25rem;
    font-size: 0.875rem;
    color: #1E40AF;
  `;
  gcalInfo.innerHTML = `
    <div style="display: flex; align-items: start; gap: 0.5rem;">
      <span style="font-size: 1.25rem;">ℹ️</span>
      <div>
        <strong>Sincronización con Google Calendar:</strong><br>
        Este evento puede sincronizarse con tu Google Calendar. 
        Configura la integración en la parte superior del calendario.
      </div>
    </div>
  `;
  form.appendChild(gcalInfo);
  
  // Footer con botones
  form.appendChild(createModalFooter(null, eventData ? 'Actualizar Evento' : 'Crear Evento'));
  
  modal.appendChild(form);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  setTimeout(() => {
    const firstInput = form.querySelector('input');
    if (firstInput) firstInput.focus();
  }, 100);
}

// ============================================
// MODAL CREAR/EDITAR COMUNICACIÓN
// ============================================

function showNewCommunicationModal(communicationData = null) {
  const overlay = createModalOverlay();
  const modal = createModalContainer(
    communicationData ? 'Editar Comunicación' : 'Nueva Comunicación', 
    '600px'
  );
  
  const form = document.createElement('form');
  form.style.cssText = 'padding: 1.5rem;';
  
  form.onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Combinar fecha y hora en communication_date
    if (data.comm_date && data.comm_time) {
      data.communication_date = `${data.comm_date}T${data.comm_time}:00`;
      delete data.comm_date;
      delete data.comm_time;
    }
    
    closeModal();
    
    if (communicationData) {
      await updateCommunication(communicationData.id, data);
    } else {
      await createCommunication(data);
    }
  };
  
  // Sección: Tipo de comunicación
  form.appendChild(createSectionTitle('TIPO DE COMUNICACIÓN', '💬'));
  
  form.appendChild(createFormRow([
    {
      label: 'Tipo',
      type: 'select',
      name: 'type',
      required: true,
      value: communicationData?.type || 'call',
      options: [
        { value: 'call', label: '📞 Llamada' },
        { value: 'email', label: '📧 Email' },
        { value: 'meeting', label: '🤝 Reunión' },
        { value: 'whatsapp', label: '💬 WhatsApp' },
        { value: 'other', label: '📝 Otro' }
      ]
    }
  ]));
  
  // Cliente relacionado (obligatorio)
  const clientField = document.createElement('div');
  clientField.style.cssText = 'margin-bottom: 1.25rem;';
  
  const clientLabel = document.createElement('label');
  clientLabel.textContent = 'Cliente *';
  clientLabel.style.cssText = `
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: ${GALIA_COLORS.purpleDark};
    font-size: 0.875rem;
  `;
  
  const clientSelect = document.createElement('select');
  clientSelect.name = 'client_id';
  clientSelect.required = true;
  clientSelect.style.cssText = `
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #E5E7EB;
    border-radius: 0.5rem;
    font-size: 1rem;
    box-sizing: border-box;
  `;
  
  const clientDefault = document.createElement('option');
  clientDefault.value = '';
  clientDefault.textContent = 'Selecciona un cliente...';
  clientSelect.appendChild(clientDefault);
  
  if (STATE.clients && STATE.clients.length > 0) {
    STATE.clients.forEach(client => {
      const option = document.createElement('option');
      option.value = client.id;
      option.textContent = client.business_name;
      if ((communicationData && communicationData.client_id === client.id) || 
          (STATE.preSelectedClient === client.id)) {
        option.selected = true;
      }
      clientSelect.appendChild(option);
    });
  }
  
  // Limpiar pre-selección
  STATE.preSelectedClient = null;
  
  clientField.appendChild(clientLabel);
  clientField.appendChild(clientSelect);
  form.appendChild(clientField);
  
  // Sección: Detalles
  form.appendChild(createSectionTitle('DETALLES', '📝'));
  
  form.appendChild(createFormField('Asunto', 'text', {
    name: 'subject',
    placeholder: 'Ej: Seguimiento de propuesta',
    value: communicationData?.subject || ''
  }));
  
  // Contenido (textarea)
  const contentField = document.createElement('div');
  contentField.style.cssText = 'margin-bottom: 1.25rem;';
  
  const contentLabel = document.createElement('label');
  contentLabel.textContent = 'Contenido / Notas';
  contentLabel.style.cssText = `
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: ${GALIA_COLORS.purpleDark};
    font-size: 0.875rem;
  `;
  
  const contentTextarea = document.createElement('textarea');
  contentTextarea.name = 'content';
  contentTextarea.rows = 5;
  contentTextarea.placeholder = 'Describe la comunicación, acuerdos, próximos pasos...';
  contentTextarea.value = communicationData?.content || '';
  contentTextarea.style.cssText = `
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #E5E7EB;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-family: inherit;
    resize: vertical;
    box-sizing: border-box;
  `;
  
  contentField.appendChild(contentLabel);
  contentField.appendChild(contentTextarea);
  form.appendChild(contentField);
  
  // Sección: Fecha y hora (OBLIGATORIOS)
  form.appendChild(createSectionTitle('FECHA Y HORA', '🕒'));
  
  // Obtener fecha/hora actuales o de los datos existentes
  let commDate, commTime;
  if (communicationData && communicationData.communication_date) {
    const dt = new Date(communicationData.communication_date);
    commDate = dt.toISOString().split('T')[0];
    commTime = dt.toTimeString().slice(0, 5);
  } else {
    // Valores por defecto: ahora
    const now = new Date();
    commDate = now.toISOString().split('T')[0];
    commTime = now.toTimeString().slice(0, 5);
  }
  
  form.appendChild(createFormRow([
    {
      label: 'Fecha *',
      type: 'date',
      name: 'comm_date',
      required: true,
      value: commDate
    },
    {
      label: 'Hora *',
      type: 'time',
      name: 'comm_time',
      required: true,
      value: commTime
    }
  ]));
  
  // Footer con botones
  form.appendChild(createModalFooter(
    null, 
    communicationData ? 'Actualizar Comunicación' : 'Registrar Comunicación'
  ));
  
  modal.appendChild(form);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  setTimeout(() => {
    clientSelect.focus();
  }, 100);
}

// ============================================
// FUNCIONES DE API (Conexión con backend)
// ============================================

async function createClient(data) {
  await apiCall('/clients', {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      country: data.country || 'España'
    })
  });
  showNotification('Cliente creado exitosamente', 'success');
  await loadClients();
}

async function updateClient(id, data) {
  await apiCall(`/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  showNotification('Cliente actualizado exitosamente', 'success');
  // Si estamos en vista detalle, recargar esa vista
  if (STATE.currentView === 'client-detail') {
    await viewClientDetail(id);
  } else {
    await loadClients();
  }
}

async function createProject(data) {
  await apiCall('/projects', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  showNotification('Proyecto creado exitosamente', 'success');
  await loadProjects();
}

async function updateProject(id, data) {
  await apiCall(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  showNotification('Proyecto actualizado exitosamente', 'success');
  // Si estamos en vista detalle, recargar esa vista
  if (STATE.currentView === 'project-detail') {
    await viewProjectDetail(id);
  } else {
    await loadProjects();
  }
}

async function createTask(data) {
  await apiCall('/tasks', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  showNotification('Tarea creada exitosamente', 'success');
  await loadTasks();
}

async function updateTask(id, data) {
  await apiCall(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  showNotification('Tarea actualizada exitosamente', 'success');
  // Si estamos en vista detalle, recargar esa vista
  if (STATE.currentView === 'task-detail') {
    await viewTaskDetail(id);
  } else {
    await loadTasks();
  }
}

async function createEvent(data) {
  await apiCall('/events', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  showNotification('Evento creado exitosamente', 'success');
  await loadEvents();
}

async function updateEvent(id, data) {
  await apiCall(`/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  showNotification('Evento actualizado exitosamente', 'success');
  await loadEvents();
}

async function createCommunication(data) {
  const clientId = data.client_id;
  delete data.client_id;
  
  await apiCall(`/clients/${clientId}/communications`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  showNotification('Comunicación registrada exitosamente', 'success');
  
  // Si estamos en vista detalle del cliente, recargar
  if (STATE.currentView === 'client-detail' && STATE.selectedItem?.data?.id === parseInt(clientId)) {
    await viewClientDetail(clientId);
  }
}

async function updateCommunication(id, data) {
  const clientId = data.client_id;
  
  await apiCall(`/communications/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  showNotification('Comunicación actualizada exitosamente', 'success');
  
  // Si estamos en vista detalle, recargar
  if (STATE.currentView === 'client-detail') {
    await viewClientDetail(STATE.selectedItem?.data?.id);
  }
}

// ============================================
// MODALES DE CARPETAS Y RECURSOS
// ============================================

// Modal Nueva/Editar Carpeta
function showNewFolderModal(folderData = null) {
  const overlay = createModalOverlay();
  const modal = createModalContainer(
    folderData ? 'Editar Carpeta' : 'Nueva Carpeta',
    '600px'
  );
  
  const form = document.createElement('form');
  form.style.cssText = 'padding: 1.5rem;';
  
  form.onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    closeModal();
    
    if (folderData) {
      await updateFolder(folderData.id, data);
    } else {
      await createFolder(data);
    }
  };
  
  // Sección: Información básica
  form.appendChild(createSectionTitle('INFORMACIÓN BÁSICA', '📁'));
  
  form.appendChild(createFormField('Nombre de la carpeta *', 'text', {
    name: 'name',
    placeholder: 'Ej: Campañas 2025',
    value: folderData?.name || '',
    required: true
  }));
  
  // Descripción (textarea)
  const descField = document.createElement('div');
  descField.style.cssText = 'margin-bottom: 1.25rem;';
  
  const descLabel = document.createElement('label');
  descLabel.textContent = 'Descripción';
  descLabel.style.cssText = `
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: ${GALIA_COLORS.purpleDark};
    font-size: 0.875rem;
  `;
  
  const descTextarea = document.createElement('textarea');
  descTextarea.name = 'description';
  descTextarea.rows = 3;
  descTextarea.placeholder = 'Breve descripción de qué contiene esta carpeta...';
  descTextarea.value = folderData?.description || '';
  descTextarea.style.cssText = `
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #E5E7EB;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-family: inherit;
    resize: vertical;
    box-sizing: border-box;
  `;
  
  descField.appendChild(descLabel);
  descField.appendChild(descTextarea);
  form.appendChild(descField);
  
  // Sección: Personalización
  form.appendChild(createSectionTitle('PERSONALIZACIÓN', '🎨'));
  
  // Carpeta padre (para subcarpetas)
  if (!folderData) {
    const parentField = document.createElement('div');
    parentField.style.cssText = 'margin-bottom: 1.25rem;';
    
    const parentLabel = document.createElement('label');
    parentLabel.textContent = 'Carpeta padre';
    parentLabel.style.cssText = `
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: ${GALIA_COLORS.purpleDark};
      font-size: 0.875rem;
    `;
    
    const parentSelect = document.createElement('select');
    parentSelect.name = 'parent_id';
    parentSelect.style.cssText = `
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #E5E7EB;
      border-radius: 0.5rem;
      font-size: 1rem;
      box-sizing: border-box;
    `;
    
    const parentDefault = document.createElement('option');
    parentDefault.value = '';
    parentDefault.textContent = 'Carpeta raíz (sin padre)';
    parentSelect.appendChild(parentDefault);
    
    if (STATE.folders && STATE.folders.length > 0) {
      STATE.folders.forEach(folder => {
        const option = document.createElement('option');
        option.value = folder.id;
        option.textContent = `${folder.icon} ${folder.name}`;
        if (STATE.currentFolderId === folder.id) {
          option.selected = true;
        }
        parentSelect.appendChild(option);
      });
    }
    
    // Si estamos dentro de una carpeta, preseleccionarla
    if (STATE.currentFolderId) {
      parentSelect.value = STATE.currentFolderId;
    }
    
    parentField.appendChild(parentLabel);
    parentField.appendChild(parentSelect);
    form.appendChild(parentField);
  }
  
  // Selector de icono
  const iconField = document.createElement('div');
  iconField.style.cssText = 'margin-bottom: 1.25rem;';
  
  const iconLabel = document.createElement('label');
  iconLabel.textContent = 'Icono';
  iconLabel.style.cssText = `
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: ${GALIA_COLORS.purpleDark};
    font-size: 0.875rem;
  `;
  
  const iconSelect = document.createElement('select');
  iconSelect.name = 'icon';
  iconSelect.style.cssText = `
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #E5E7EB;
    border-radius: 0.5rem;
    font-size: 1.25rem;
    box-sizing: border-box;
  `;
  
  const icons = [
    { value: '📁', label: '📁 Carpeta estándar' },
    { value: '📢', label: '📢 Marketing' },
    { value: '🎨', label: '🎨 Diseño' },
    { value: '📄', label: '📄 Documentos' },
    { value: '📋', label: '📋 Plantillas' },
    { value: '📱', label: '📱 Redes Sociales' },
    { value: '📧', label: '📧 Email' },
    { value: '🎯', label: '🎯 Objetivos' },
    { value: '🖼️', label: '🖼️ Imágenes' },
    { value: '🎬', label: '🎬 Videos' },
    { value: '📊', label: '📊 Reportes' },
    { value: '💼', label: '💼 Negocios' }
  ];
  
  icons.forEach(icon => {
    const option = document.createElement('option');
    option.value = icon.value;
    option.textContent = icon.label;
    if (folderData && folderData.icon === icon.value) {
      option.selected = true;
    }
    iconSelect.appendChild(option);
  });
  
  iconField.appendChild(iconLabel);
  iconField.appendChild(iconSelect);
  form.appendChild(iconField);
  
  // Selector de color
  const colorField = document.createElement('div');
  colorField.style.cssText = 'margin-bottom: 1.25rem;';
  
  const colorLabel = document.createElement('label');
  colorLabel.textContent = 'Color';
  colorLabel.style.cssText = `
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: ${GALIA_COLORS.purpleDark};
    font-size: 0.875rem;
  `;
  
  const colorGrid = document.createElement('div');
  colorGrid.style.cssText = 'display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.5rem;';
  
  const colors = [
    '#08a48d', // Rosa Galia
    '#572c83', // Púrpura Galia
    '#572c83', // Púrpura medio
    '#08a48d', // Turquesa Galia
    '#3B82F6', // Azul
    '#10B981', // Verde
    '#F59E0B', // Naranja
    '#EF4444', // Rojo
    '#8B5CF6', // Violeta
    '#6B7280', // Gris
    '#EC4899', // Rosa
    '#14B8A6'  // Teal
  ];
  
  const colorInput = document.createElement('input');
  colorInput.type = 'hidden';
  colorInput.name = 'color';
  colorInput.value = folderData?.color || '#572c83';
  
  colors.forEach(color => {
    const colorBtn = document.createElement('button');
    colorBtn.type = 'button';
    colorBtn.style.cssText = `
      width: 100%;
      aspect-ratio: 1;
      background: ${color};
      border: 3px solid ${folderData?.color === color || (!folderData && color === '#572c83') ? '#2D2C3E' : 'transparent'};
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    `;
    
    colorBtn.onclick = () => {
      colorInput.value = color;
      colorGrid.querySelectorAll('button').forEach(btn => {
        btn.style.borderColor = 'transparent';
      });
      colorBtn.style.borderColor = '#2D2C3E';
    };
    
    colorGrid.appendChild(colorBtn);
  });
  
  colorField.appendChild(colorLabel);
  colorField.appendChild(colorGrid);
  form.appendChild(colorInput);
  form.appendChild(colorField);
  
  // Footer con botones
  form.appendChild(createModalFooter(
    null,
    folderData ? 'Actualizar Carpeta' : 'Crear Carpeta'
  ));
  
  modal.appendChild(form);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  setTimeout(() => {
    form.querySelector('input[name="name"]').focus();
  }, 100);
}

// Modal Nuevo/Editar Recurso
function showNewResourceModal(resourceData = null) {
  const overlay = createModalOverlay();
  const modal = createModalContainer(
    resourceData ? 'Editar Recurso' : 'Subir Recurso',
    '600px'
  );
  
  const form = document.createElement('form');
  form.style.cssText = 'padding: 1.5rem;';
  
  form.onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    closeModal();
    
    if (resourceData) {
      await updateResource(resourceData.id, data);
    } else {
      await createResource(data);
    }
  };
  
  // Sección: Archivo
  form.appendChild(createSectionTitle('ARCHIVO', '📎'));
  
  form.appendChild(createFormField('Título del recurso *', 'text', {
    name: 'title',
    placeholder: 'Ej: Logo cliente Peluquería Laura',
    value: resourceData?.title || '',
    required: true
  }));
  
  // Selector de modo: URL o Upload
  if (!resourceData) {
    const modeSelector = document.createElement('div');
    modeSelector.style.cssText = 'margin-bottom: 1.25rem;';
    
    const modeLabel = document.createElement('label');
    modeLabel.textContent = 'Modo de archivo';
    modeLabel.style.cssText = `
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: ${GALIA_COLORS.purpleDark};
      font-size: 0.875rem;
    `;
    
    const modeButtons = document.createElement('div');
    modeButtons.style.cssText = 'display: flex; gap: 0.5rem;';
    
    const urlBtn = document.createElement('button');
    urlBtn.type = 'button';
    urlBtn.textContent = '🔗 URL Externa';
    urlBtn.id = 'mode-url';
    urlBtn.onclick = () => switchUploadMode('url');
    urlBtn.style.cssText = `
      flex: 1;
      padding: 0.75rem;
      border: 2px solid #572c83;
      background: #572c83;
      color: white;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    `;
    
    const uploadBtn = document.createElement('button');
    uploadBtn.type = 'button';
    uploadBtn.textContent = '☁️ Subir Archivo';
    uploadBtn.id = 'mode-upload';
    uploadBtn.onclick = () => switchUploadMode('upload');
    uploadBtn.style.cssText = `
      flex: 1;
      padding: 0.75rem;
      border: 2px solid #E5E7EB;
      background: white;
      color: #6B7280;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    `;
    
    modeButtons.appendChild(urlBtn);
    modeButtons.appendChild(uploadBtn);
    
    modeSelector.appendChild(modeLabel);
    modeSelector.appendChild(modeButtons);
    form.appendChild(modeSelector);
  }
  
  // Campo URL (modo URL)
  const urlField = document.createElement('div');
  urlField.id = 'url-field';
  urlField.style.cssText = 'margin-bottom: 1.25rem;';
  
  const urlLabel = document.createElement('label');
  urlLabel.textContent = 'URL del archivo *';
  urlLabel.style.cssText = `
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: ${GALIA_COLORS.purpleDark};
    font-size: 0.875rem;
  `;
  
  const urlInput = document.createElement('input');
  urlInput.type = 'url';
  urlInput.name = 'file_url';
  urlInput.placeholder = 'https://ejemplo.com/archivo.pdf';
  urlInput.value = resourceData?.file_url || '';
  if (!resourceData) urlInput.required = true;
  urlInput.style.cssText = `
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #E5E7EB;
    border-radius: 0.5rem;
    font-size: 1rem;
    box-sizing: border-box;
  `;
  
  urlField.appendChild(urlLabel);
  urlField.appendChild(urlInput);
  form.appendChild(urlField);
  
  // Campo Upload (modo Upload) - oculto por defecto
  const uploadField = document.createElement('div');
  uploadField.id = 'upload-field';
  uploadField.style.cssText = 'margin-bottom: 1.25rem; display: none;';
  
  const uploadLabel = document.createElement('label');
  uploadLabel.textContent = 'Selecciona un archivo *';
  uploadLabel.style.cssText = `
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: ${GALIA_COLORS.purpleDark};
    font-size: 0.875rem;
  `;
  
  const uploadInput = document.createElement('input');
  uploadInput.type = 'file';
  uploadInput.id = 'file-upload';
  uploadInput.accept = '*/*';
  uploadInput.onchange = handleFileUpload;
  uploadInput.style.cssText = `
    width: 100%;
    padding: 0.75rem;
    border: 2px dashed #572c83;
    border-radius: 0.5rem;
    font-size: 1rem;
    box-sizing: border-box;
    cursor: pointer;
  `;
  
  const uploadProgress = document.createElement('div');
  uploadProgress.id = 'upload-progress';
  uploadProgress.style.cssText = 'display: none; margin-top: 0.5rem;';
  
  const uploadInfo = document.createElement('div');
  uploadInfo.style.cssText = `
    background: #EFF6FF;
    border: 1px solid #BFDBFE;
    border-radius: 0.5rem;
    padding: 0.75rem;
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: #1E40AF;
  `;
  uploadInfo.innerHTML = `
    <strong>ℹ️ Límite:</strong> Máximo 5MB por archivo. 
    Tipos soportados: PDF, DOC, XLS, PPT, imágenes, videos.
  `;
  
  uploadField.appendChild(uploadLabel);
  uploadField.appendChild(uploadInput);
  uploadField.appendChild(uploadProgress);
  uploadField.appendChild(uploadInfo);
  form.appendChild(uploadField);
  
  // Campo oculto para guardar la URL generada del upload
  const uploadedUrlInput = document.createElement('input');
  uploadedUrlInput.type = 'hidden';
  uploadedUrlInput.name = 'uploaded_file_url';
  form.appendChild(uploadedUrlInput);
  
  // Descripción
  const descField = document.createElement('div');
  descField.style.cssText = 'margin-bottom: 1.25rem;';
  
  const descLabel = document.createElement('label');
  descLabel.textContent = 'Descripción';
  descLabel.style.cssText = `
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: ${GALIA_COLORS.purpleDark};
    font-size: 0.875rem;
  `;
  
  const descTextarea = document.createElement('textarea');
  descTextarea.name = 'description';
  descTextarea.rows = 3;
  descTextarea.placeholder = 'Describe el contenido del recurso...';
  descTextarea.value = resourceData?.description || '';
  descTextarea.style.cssText = `
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #E5E7EB;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-family: inherit;
    resize: vertical;
    box-sizing: border-box;
  `;
  
  descField.appendChild(descLabel);
  descField.appendChild(descTextarea);
  form.appendChild(descField);
  
  // Sección: Clasificación
  form.appendChild(createSectionTitle('CLASIFICACIÓN', '🏷️'));
  
  form.appendChild(createFormRow([
    {
      label: 'Categoría',
      type: 'select',
      name: 'category',
      required: true,
      value: resourceData?.category || 'document',
      options: [
        { value: 'template', label: '📋 Plantilla' },
        { value: 'guide', label: '📖 Guía' },
        { value: 'document', label: '📄 Documento' },
        { value: 'other', label: '📎 Otro' }
      ]
    },
    {
      label: 'Nivel de acceso',
      type: 'select',
      name: 'access_level',
      required: true,
      value: resourceData?.access_level || 'team',
      options: [
        { value: 'public', label: '🌍 Público' },
        { value: 'team', label: '👥 Equipo' },
        { value: 'admin', label: '🔒 Solo Admin' }
      ]
    }
  ]));
  
  // Carpeta destino
  const folderField = document.createElement('div');
  folderField.style.cssText = 'margin-bottom: 1.25rem;';
  
  const folderLabel = document.createElement('label');
  folderLabel.textContent = 'Guardar en carpeta';
  folderLabel.style.cssText = `
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: ${GALIA_COLORS.purpleDark};
    font-size: 0.875rem;
  `;
  
  const folderSelect = document.createElement('select');
  folderSelect.name = 'folder_id';
  folderSelect.style.cssText = `
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #E5E7EB;
    border-radius: 0.5rem;
    font-size: 1rem;
    box-sizing: border-box;
  `;
  
  const folderDefault = document.createElement('option');
  folderDefault.value = '';
  folderDefault.textContent = 'Sin carpeta (raíz)';
  folderSelect.appendChild(folderDefault);
  
  // Cargar todas las carpetas disponibles
  if (STATE.allFolders && STATE.allFolders.length > 0) {
    STATE.allFolders.forEach(folder => {
      const option = document.createElement('option');
      option.value = folder.id;
      const prefix = folder.parent_id ? '    ↳ ' : '';
      option.textContent = `${prefix}${folder.icon} ${folder.name}`;
      if ((resourceData && resourceData.folder_id === folder.id) || 
          (!resourceData && STATE.currentFolderId === folder.id)) {
        option.selected = true;
      }
      folderSelect.appendChild(option);
    });
  }
  
  folderField.appendChild(folderLabel);
  folderField.appendChild(folderSelect);
  form.appendChild(folderField);
  
  // Footer con botones
  form.appendChild(createModalFooter(
    null,
    resourceData ? 'Actualizar Recurso' : 'Subir Recurso'
  ));
  
  modal.appendChild(form);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  setTimeout(() => {
    form.querySelector('input[name="title"]').focus();
  }, 100);
}

// Funciones CRUD para Carpetas
async function createFolder(data) {
  try {
    await apiCall('/folders', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    showNotification('Carpeta creada exitosamente', 'success');
    await loadFoldersAndResources(STATE.currentFolderId);
  } catch (error) {
    showNotification('Error al crear carpeta', 'error');
  }
}

async function updateFolder(id, data) {
  try {
    await apiCall(`/folders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    showNotification('Carpeta actualizada exitosamente', 'success');
    await loadFoldersAndResources(STATE.currentFolderId);
  } catch (error) {
    showNotification('Error al actualizar carpeta', 'error');
  }
}

async function editFolder(id) {
  try {
    const { folder } = await apiCall(`/folders/${id}`);
    showNewFolderModal(folder);
  } catch (error) {
    showNotification('Error al cargar carpeta', 'error');
  }
}

async function deleteFolder(id) {
  showDeleteConfirmation('carpeta', id, async () => {
    try {
      await apiCall(`/folders/${id}`, { method: 'DELETE' });
      showNotification('Carpeta eliminada exitosamente', 'success');
      await loadFoldersAndResources(STATE.currentFolderId);
    } catch (error) {
      showNotification(error.message || 'Error al eliminar carpeta', 'error');
    }
  });
}

// Funciones CRUD para Recursos
async function createResource(data) {
  try {
    await apiCall('/resources', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    showNotification('Recurso creado exitosamente', 'success');
    await loadFoldersAndResources(STATE.currentFolderId);
  } catch (error) {
    showNotification('Error al crear recurso', 'error');
  }
}

async function updateResource(id, data) {
  try {
    await apiCall(`/resources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    showNotification('Recurso actualizado exitosamente', 'success');
    await loadFoldersAndResources(STATE.currentFolderId);
  } catch (error) {
    showNotification('Error al actualizar recurso', 'error');
  }
}

async function editResource(id) {
  try {
    // Cargar todas las carpetas primero
    if (!STATE.allFolders) {
      const { folders } = await apiCall('/folders');
      STATE.allFolders = folders;
    }
    
    const { resource } = await apiCall(`/resources/${id}`);
    showNewResourceModal(resource);
  } catch (error) {
    showNotification('Error al cargar recurso', 'error');
  }
}

async function deleteResource(id) {
  showDeleteConfirmation('recurso', id, async () => {
    try {
      await apiCall(`/resources/${id}`, { method: 'DELETE' });
      showNotification('Recurso eliminado exitosamente', 'success');
      await loadFoldersAndResources(STATE.currentFolderId);
    } catch (error) {
      showNotification('Error al eliminar recurso', 'error');
    }
  });
}

// ============================================
// UPLOAD DE ARCHIVOS
// ============================================

function switchUploadMode(mode) {
  const urlBtn = document.getElementById('mode-url');
  const uploadBtn = document.getElementById('mode-upload');
  const urlField = document.getElementById('url-field');
  const uploadField = document.getElementById('upload-field');
  const urlInput = urlField.querySelector('input[name="file_url"]');
  const fileInput = document.getElementById('file-upload');
  
  if (mode === 'url') {
    // Activar modo URL
    urlBtn.style.background = '#572c83';
    urlBtn.style.color = 'white';
    urlBtn.style.borderColor = '#572c83';
    
    uploadBtn.style.background = 'white';
    uploadBtn.style.color = '#6B7280';
    uploadBtn.style.borderColor = '#E5E7EB';
    
    urlField.style.display = 'block';
    uploadField.style.display = 'none';
    
    urlInput.required = true;
    fileInput.required = false;
    
  } else {
    // Activar modo Upload
    uploadBtn.style.background = '#572c83';
    uploadBtn.style.color = 'white';
    uploadBtn.style.borderColor = '#572c83';
    
    urlBtn.style.background = 'white';
    urlBtn.style.color = '#6B7280';
    urlBtn.style.borderColor = '#E5E7EB';
    
    urlField.style.display = 'none';
    uploadField.style.display = 'block';
    
    urlInput.required = false;
    fileInput.required = true;
  }
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // Validar tamaño (5MB máximo)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    showNotification('El archivo es demasiado grande. Máximo 5MB', 'error');
    event.target.value = '';
    return;
  }
  
  const progressDiv = document.getElementById('upload-progress');
  progressDiv.style.display = 'block';
  progressDiv.innerHTML = `
    <div style="background: #F3F4F6; border-radius: 0.5rem; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #572c83 0%, #08a48d 100%); height: 8px; width: 0%; transition: width 0.3s;" id="progress-bar"></div>
    </div>
    <div style="display: flex; justify-content: space-between; margin-top: 0.5rem; font-size: 0.875rem; color: #6B7280;">
      <span>📄 ${file.name}</span>
      <span>${(file.size / 1024).toFixed(1)} KB</span>
    </div>
  `;
  
  // Simular progreso
  const progressBar = document.getElementById('progress-bar');
  let progress = 0;
  const interval = setInterval(() => {
    progress += 10;
    progressBar.style.width = progress + '%';
    if (progress >= 90) clearInterval(interval);
  }, 100);
  
  // Leer archivo como Data URL (Base64)
  const reader = new FileReader();
  reader.onload = function(e) {
    clearInterval(interval);
    progressBar.style.width = '100%';
    
    // Guardar la URL del archivo
    const uploadedUrlInput = document.querySelector('input[name="uploaded_file_url"]');
    const urlInput = document.querySelector('input[name="file_url"]');
    
    // En producción, aquí subirías a Cloudflare R2 o similar
    // Por ahora usamos Data URL (Base64) para demostración
    uploadedUrlInput.value = e.target.result;
    urlInput.value = e.target.result;
    
    setTimeout(() => {
      progressDiv.innerHTML = `
        <div style="background: #D1FAE5; border: 1px solid #059669; border-radius: 0.5rem; padding: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-size: 1.25rem;">✅</span>
          <div style="flex: 1;">
            <div style="font-weight: 600; color: #065F46; margin-bottom: 0.25rem;">Archivo listo</div>
            <div style="font-size: 0.875rem; color: #059669;">📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)</div>
          </div>
        </div>
      `;
    }, 300);
  };
  
  reader.onerror = function() {
    showNotification('Error al leer el archivo', 'error');
    progressDiv.style.display = 'none';
    event.target.value = '';
  };
  
  reader.readAsDataURL(file);
}

// ============================================
// ANIMACIONES CSS (inyectadas en el DOM)
// ============================================

const modalStyles = document.createElement('style');
modalStyles.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-50px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  /* Scrollbar personalizado */
  #modal-overlay ::-webkit-scrollbar {
    width: 8px;
  }
  
  #modal-overlay ::-webkit-scrollbar-track {
    background: #F3F4F6;
  }
  
  #modal-overlay ::-webkit-scrollbar-thumb {
    background: ${GALIA_COLORS.purple};
    border-radius: 4px;
  }
  
  #modal-overlay ::-webkit-scrollbar-thumb:hover {
    background: ${GALIA_COLORS.cyan};
  }
`;
document.head.appendChild(modalStyles);

console.log('✅ Sistema de modales Galia Digital cargado');
