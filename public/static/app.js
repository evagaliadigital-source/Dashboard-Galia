// Galia Digital Platform - Frontend Application
console.log('🚀 Galia Digital - Iniciando aplicación...');

// Estado global de la aplicación
const STATE = {
  currentUser: null,
  currentView: 'dashboard',
  clients: [],
  projects: [],
  tasks: [],
  events: [],
  selectedClient: null,
  selectedProject: null,
  dashboardMetrics: null
};

console.log('✅ Estado inicial creado');

// Configuración de Axios
if (typeof axios === 'undefined') {
  console.error('❌ ERROR: Axios no está disponible');
  alert('Error: No se pudo cargar Axios. Por favor recarga la página.');
} else {
  axios.defaults.baseURL = '/api';
  axios.defaults.withCredentials = true;
  console.log('✅ Axios configurado');
}

// Utilidades
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('es-ES', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusBadge = (status) => {
  const badges = {
    'pending': '<span class="px-3 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">⏳ Pendiente</span>',
    'in_progress': '<span class="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-800">🔄 En Progreso</span>',
    'review': '<span class="px-3 py-1 text-xs rounded-full bg-purple-100 text-purple-800">👀 En Revisión</span>',
    'completed': '<span class="px-3 py-1 text-xs rounded-full bg-green-100 text-green-800">✅ Completado</span>',
    'cancelled': '<span class="px-3 py-1 text-xs rounded-full bg-red-100 text-red-800">❌ Cancelado</span>',
    'active': '<span class="px-3 py-1 text-xs rounded-full bg-green-100 text-green-800">✅ Activo</span>',
    'paused': '<span class="px-3 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">⏸️ Pausado</span>',
    'trial': '<span class="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-800">🎁 Prueba</span>'
  };
  return badges[status] || status;
};

const getPriorityBadge = (priority) => {
  const badges = {
    'low': '<span class="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">Baja</span>',
    'medium': '<span class="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">Media</span>',
    'high': '<span class="px-2 py-1 text-xs rounded bg-orange-100 text-orange-700">Alta</span>',
    'urgent': '<span class="px-2 py-1 text-xs rounded bg-red-100 text-red-700">🔥 Urgente</span>'
  };
  return badges[priority] || priority;
};

// API Calls
const API = {
  // Auth
  login: (email, password) => axios.post('/auth/login', { email, password }),
  logout: () => axios.post('/auth/logout'),
  getMe: () => axios.get('/auth/me'),
  
  // Dashboard
  getMetrics: () => axios.get('/dashboard/metrics'),
  getActivity: () => axios.get('/dashboard/activity'),
  getClientDashboard: () => axios.get('/dashboard/client'),
  
  // Clients
  getClients: () => axios.get('/clients'),
  getClient: (id) => axios.get(\`/clients/\${id}\`),
  createClient: (data) => axios.post('/clients', data),
  updateClient: (id, data) => axios.put(\`/clients/\${id}\`, data),
  deleteClient: (id) => axios.delete(\`/clients/\${id}\`),
  getClientProjects: (id) => axios.get(\`/clients/\${id}/projects\`),
  getClientCommunications: (id) => axios.get(\`/clients/\${id}/communications\`),
  addCommunication: (id, data) => axios.post(\`/clients/\${id}/communications\`, data),
  
  // Projects
  getProjects: () => axios.get('/projects'),
  getProject: (id) => axios.get(\`/projects/\${id}\`),
  createProject: (data) => axios.post('/projects', data),
  updateProject: (id, data) => axios.put(\`/projects/\${id}\`, data),
  deleteProject: (id) => axios.delete(\`/projects/\${id}\`),
  getProjectTasks: (id) => axios.get(\`/projects/\${id}/tasks\`),
  createProjectTask: (id, data) => axios.post(\`/projects/\${id}/tasks\`, data),
  getProjectComments: (id) => axios.get(\`/projects/\${id}/comments\`),
  addProjectComment: (id, content) => axios.post(\`/projects/\${id}/comments\`, { content }),
  
  // Tasks
  getTasks: (params) => axios.get('/tasks', { params }),
  getTask: (id) => axios.get(\`/tasks/\${id}\`),
  updateTask: (id, data) => axios.put(\`/tasks/\${id}\`, data),
  deleteTask: (id) => axios.delete(\`/tasks/\${id}\`),
  
  // Events
  getEvents: (params) => axios.get('/events', { params }),
  getEvent: (id) => axios.get(\`/events/\${id}\`),
  createEvent: (data) => axios.post('/events', data),
  updateEvent: (id, data) => axios.put(\`/events/\${id}\`, data),
  deleteEvent: (id) => axios.delete(\`/events/\${id}\`),
  
  // Resources
  getResources: () => axios.get('/resources'),
  getResource: (id) => axios.get(\`/resources/\${id}\`),
  createResource: (data) => axios.post('/resources', data),
  updateResource: (id, data) => axios.put(\`/resources/\${id}\`, data),
  deleteResource: (id) => axios.delete(\`/resources/\${id}\`)
};

// Render Functions
function renderLogin() {
  return \`
    <div class="min-h-screen flex items-center justify-center gradient-bg">
      <div class="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-galia-purple mb-2">Galia Digital</h1>
          <p class="text-gray-600">Plataforma de Gestión</p>
        </div>
        
        <form id="loginForm" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input 
              type="email" 
              id="loginEmail" 
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-galia-pink focus:border-transparent"
              placeholder="tu@email.com"
            >
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
            <input 
              type="password" 
              id="loginPassword" 
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-galia-pink focus:border-transparent"
              placeholder="••••••••"
            >
          </div>
          
          <div id="loginError" class="hidden text-red-600 text-sm"></div>
          
          <button 
            type="submit" 
            class="w-full gradient-bg text-white py-3 rounded-lg font-semibold hover:opacity-90 transition"
          >
            Iniciar Sesión
          </button>
        </form>
        
        <div class="mt-6 text-center text-sm text-gray-600">
          <p>Demo: eva@galiadigital.com / demo123</p>
        </div>
      </div>
    </div>
  \`;
}

function renderSidebar() {
  const role = STATE.currentUser?.role;
  const isClient = role === 'client';
  
  const menuItems = isClient ? [
    { id: 'dashboard', icon: 'fa-home', label: 'Mi Dashboard' },
    { id: 'projects', icon: 'fa-folder-open', label: 'Mis Proyectos' },
    { id: 'calendar', icon: 'fa-calendar', label: 'Calendario' }
  ] : [
    { id: 'dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
    { id: 'clients', icon: 'fa-users', label: 'Clientes' },
    { id: 'projects', icon: 'fa-folder-open', label: 'Proyectos' },
    { id: 'tasks', icon: 'fa-tasks', label: 'Tareas' },
    { id: 'calendar', icon: 'fa-calendar', label: 'Calendario' },
    { id: 'resources', icon: 'fa-book', label: 'Recursos' }
  ];
  
  return \`
    <aside class="w-64 bg-galia-dark text-white flex flex-col h-screen fixed left-0 top-0">
      <div class="p-6 gradient-bg">
        <h1 class="text-2xl font-bold">Galia Digital</h1>
        <p class="text-sm opacity-90 mt-1">\${STATE.currentUser?.name}</p>
      </div>
      
      <nav class="flex-1 p-4 space-y-2">
        \${menuItems.map(item => \`
          <button 
            onclick="navigateTo('\${item.id}')"
            class="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition \${STATE.currentView === item.id ? 'sidebar-active' : ''}"
          >
            <i class="fas \${item.icon} w-5"></i>
            <span>\${item.label}</span>
          </button>
        \`).join('')}
      </nav>
      
      <div class="p-4 border-t border-white border-opacity-10">
        <button 
          onclick="handleLogout()"
          class="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-600 transition"
        >
          <i class="fas fa-sign-out-alt w-5"></i>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  \`;
}

function renderDashboard() {
  if (STATE.currentUser?.role === 'client') {
    return renderClientDashboard();
  }
  
  const metrics = STATE.dashboardMetrics || {};
  
  return \`
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold text-galia-dark">Dashboard</h1>
        <div class="text-sm text-gray-600">
          <i class="fas fa-calendar mr-2"></i>
          \${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>
      
      <!-- Métricas principales -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white rounded-xl shadow-md p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm">Clientes Activos</p>
              <h3 class="text-3xl font-bold text-galia-purple mt-2">\${metrics.clients?.active || 0}</h3>
              <p class="text-xs text-gray-500 mt-1">de \${metrics.clients?.total || 0} totales</p>
            </div>
            <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <i class="fas fa-users text-galia-purple text-xl"></i>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-md p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm">Proyectos Activos</p>
              <h3 class="text-3xl font-bold text-blue-600 mt-2">\${metrics.projects?.active || 0}</h3>
              <p class="text-xs text-gray-500 mt-1">de \${metrics.projects?.total || 0} totales</p>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <i class="fas fa-folder-open text-blue-600 text-xl"></i>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-md p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm">Tareas Pendientes</p>
              <h3 class="text-3xl font-bold text-orange-600 mt-2">\${metrics.tasks?.pending || 0}</h3>
              <p class="text-xs text-red-500 mt-1">\${metrics.tasks?.overdue || 0} atrasadas</p>
            </div>
            <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <i class="fas fa-tasks text-orange-600 text-xl"></i>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-md p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm">Ingresos Mensuales</p>
              <h3 class="text-3xl font-bold text-green-600 mt-2">\${(metrics.revenue?.monthly || 0).toFixed(0)}€</h3>
              <p class="text-xs text-gray-500 mt-1">\${metrics.events?.upcoming || 0} eventos próximos</p>
            </div>
            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <i class="fas fa-euro-sign text-green-600 text-xl"></i>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Acciones rápidas -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button onclick="showNewClientModal()" class="gradient-bg text-white rounded-xl p-6 flex items-center space-x-4 hover:opacity-90 transition">
          <i class="fas fa-user-plus text-3xl"></i>
          <div class="text-left">
            <h3 class="font-semibold">Nuevo Cliente</h3>
            <p class="text-sm opacity-90">Registrar peluquería</p>
          </div>
        </button>
        
        <button onclick="showNewProjectModal()" class="bg-blue-600 text-white rounded-xl p-6 flex items-center space-x-4 hover:opacity-90 transition">
          <i class="fas fa-folder-plus text-3xl"></i>
          <div class="text-left">
            <h3 class="font-semibold">Nuevo Proyecto</h3>
            <p class="text-sm opacity-90">Crear campaña</p>
          </div>
        </button>
        
        <button onclick="showNewEventModal()" class="bg-purple-600 text-white rounded-xl p-6 flex items-center space-x-4 hover:opacity-90 transition">
          <i class="fas fa-calendar-plus text-3xl"></i>
          <div class="text-left">
            <h3 class="font-semibold">Nueva Reunión</h3>
            <p class="text-sm opacity-90">Agendar evento</p>
          </div>
        </button>
      </div>
    </div>
  \`;
}

function renderClientDashboard() {
  return \`
    <div class="space-y-6">
      <h1 class="text-3xl font-bold text-galia-dark">Mi Dashboard</h1>
      
      <div class="bg-white rounded-xl shadow-md p-6">
        <h2 class="text-xl font-semibold mb-4">Bienvenido/a, \${STATE.currentUser?.name}</h2>
        <p class="text-gray-600">Aquí puedes ver el progreso de tus proyectos con Galia Digital.</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl p-6">
          <h3 class="text-lg font-semibold mb-2">Mis Proyectos</h3>
          <p class="text-3xl font-bold">Cargando...</p>
        </div>
      </div>
    </div>
  \`;
}

function renderClients() {
  return \`
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold text-galia-dark">Clientes</h1>
        <button onclick="showNewClientModal()" class="gradient-bg text-white px-6 py-3 rounded-lg hover:opacity-90 transition">
          <i class="fas fa-plus mr-2"></i>Nuevo Cliente
        </button>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        \${STATE.clients.map(client => \`
          <div class="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer" onclick="viewClientDetail(\${client.id})">
            <div class="flex items-start justify-between mb-4">
              <div class="flex-1">
                <h3 class="text-lg font-bold text-galia-dark mb-1">\${client.business_name}</h3>
                <p class="text-sm text-gray-600">\${client.contact_name}</p>
              </div>
              \${getStatusBadge(client.subscription_status)}
            </div>
            
            <div class="space-y-2 text-sm">
              <div class="flex items-center text-gray-600">
                <i class="fas fa-envelope w-5 mr-2"></i>
                <span>\${client.email}</span>
              </div>
              <div class="flex items-center text-gray-600">
                <i class="fas fa-phone w-5 mr-2"></i>
                <span>\${client.phone}</span>
              </div>
              \${client.instagram ? \`
                <div class="flex items-center text-gray-600">
                  <i class="fab fa-instagram w-5 mr-2"></i>
                  <span>\${client.instagram}</span>
                </div>
              \` : ''}
            </div>
            
            \${client.monthly_fee ? \`
              <div class="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                <span class="text-sm text-gray-600">Mensualidad</span>
                <span class="text-lg font-bold text-green-600">\${client.monthly_fee}€/mes</span>
              </div>
            \` : ''}
          </div>
        \`).join('')}
      </div>
      
      \${STATE.clients.length === 0 ? \`
        <div class="bg-white rounded-xl shadow-md p-12 text-center">
          <i class="fas fa-users text-6xl text-gray-300 mb-4"></i>
          <h3 class="text-xl font-semibold text-gray-700 mb-2">No hay clientes registrados</h3>
          <p class="text-gray-600 mb-6">Comienza agregando tu primer cliente</p>
          <button onclick="showNewClientModal()" class="gradient-bg text-white px-6 py-3 rounded-lg hover:opacity-90 transition">
            <i class="fas fa-plus mr-2"></i>Crear Primer Cliente
          </button>
        </div>
      \` : ''}
    </div>
  \`;
}

function renderProjects() {
  const groupedProjects = {
    'in_progress': STATE.projects.filter(p => p.status === 'in_progress'),
    'pending': STATE.projects.filter(p => p.status === 'pending'),
    'review': STATE.projects.filter(p => p.status === 'review'),
    'completed': STATE.projects.filter(p => p.status === 'completed')
  };
  
  return \`
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold text-galia-dark">Proyectos</h1>
        <button onclick="showNewProjectModal()" class="gradient-bg text-white px-6 py-3 rounded-lg hover:opacity-90 transition">
          <i class="fas fa-plus mr-2"></i>Nuevo Proyecto
        </button>
      </div>
      
      <!-- Vista Kanban -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="space-y-3">
          <div class="bg-yellow-100 rounded-lg px-4 py-2">
            <h3 class="font-semibold text-yellow-800">⏳ Pendiente (\${groupedProjects.pending.length})</h3>
          </div>
          <div class="space-y-3">
            \${groupedProjects.pending.map(p => renderProjectCard(p)).join('')}
          </div>
        </div>
        
        <div class="space-y-3">
          <div class="bg-blue-100 rounded-lg px-4 py-2">
            <h3 class="font-semibold text-blue-800">🔄 En Progreso (\${groupedProjects.in_progress.length})</h3>
          </div>
          <div class="space-y-3">
            \${groupedProjects.in_progress.map(p => renderProjectCard(p)).join('')}
          </div>
        </div>
        
        <div class="space-y-3">
          <div class="bg-purple-100 rounded-lg px-4 py-2">
            <h3 class="font-semibold text-purple-800">👀 Revisión (\${groupedProjects.review.length})</h3>
          </div>
          <div class="space-y-3">
            \${groupedProjects.review.map(p => renderProjectCard(p)).join('')}
          </div>
        </div>
        
        <div class="space-y-3">
          <div class="bg-green-100 rounded-lg px-4 py-2">
            <h3 class="font-semibold text-green-800">✅ Completado (\${groupedProjects.completed.length})</h3>
          </div>
          <div class="space-y-3">
            \${groupedProjects.completed.map(p => renderProjectCard(p)).join('')}
          </div>
        </div>
      </div>
    </div>
  \`;
}

function renderProjectCard(project) {
  return \`
    <div class="bg-white rounded-lg shadow p-4 hover:shadow-md transition cursor-pointer" onclick="viewProjectDetail(\${project.id})">
      <div class="flex items-start justify-between mb-2">
        <h4 class="font-semibold text-sm line-clamp-2">\${project.name}</h4>
        \${getPriorityBadge(project.priority)}
      </div>
      <p class="text-xs text-gray-600 mb-3">\${project.client_name || 'Sin cliente'}</p>
      \${project.deadline ? \`
        <div class="flex items-center text-xs text-gray-500">
          <i class="fas fa-clock mr-1"></i>
          <span>\${formatDate(project.deadline)}</span>
        </div>
      \` : ''}
    </div>
  \`;
}

function renderTasks() {
  return \`
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold text-galia-dark">Tareas</h1>
        <div class="flex space-x-2">
          <select onchange="filterTasks(this.value)" class="px-4 py-2 border border-gray-300 rounded-lg">
            <option value="">Todas</option>
            <option value="pending">Pendientes</option>
            <option value="in_progress">En Progreso</option>
            <option value="completed">Completadas</option>
          </select>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-md overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarea</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proyecto</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioridad</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asignado</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimiento</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            \${STATE.tasks.map(task => \`
              <tr class="hover:bg-gray-50 cursor-pointer" onclick="viewTaskDetail(\${task.id})">
                <td class="px-6 py-4">
                  <div class="font-medium text-gray-900">\${task.title}</div>
                  \${task.description ? \`<div class="text-sm text-gray-500 line-clamp-1">\${task.description}</div>\` : ''}
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">\${task.project_name || '-'}</td>
                <td class="px-6 py-4">\${getStatusBadge(task.status)}</td>
                <td class="px-6 py-4">\${getPriorityBadge(task.priority)}</td>
                <td class="px-6 py-4 text-sm text-gray-600">\${task.assigned_name || 'Sin asignar'}</td>
                <td class="px-6 py-4 text-sm text-gray-600">\${formatDate(task.due_date)}</td>
              </tr>
            \`).join('')}
          </tbody>
        </table>
        
        \${STATE.tasks.length === 0 ? \`
          <div class="p-12 text-center">
            <i class="fas fa-tasks text-6xl text-gray-300 mb-4"></i>
            <p class="text-gray-600">No hay tareas registradas</p>
          </div>
        \` : ''}
      </div>
    </div>
  \`;
}

function renderCalendar() {
  const today = new Date();
  const monthEvents = STATE.events.filter(e => {
    const eventDate = new Date(e.start_datetime);
    return eventDate.getMonth() === today.getMonth();
  });
  
  return \`
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold text-galia-dark">Calendario</h1>
        <button onclick="showNewEventModal()" class="gradient-bg text-white px-6 py-3 rounded-lg hover:opacity-90 transition">
          <i class="fas fa-plus mr-2"></i>Nuevo Evento
        </button>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
          <h2 class="text-xl font-semibold mb-4">
            <i class="fas fa-calendar-alt mr-2 text-galia-purple"></i>
            \${today.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </h2>
          <div class="text-center text-gray-500 py-12">
            <i class="fas fa-calendar text-6xl mb-4 opacity-50"></i>
            <p>Vista de calendario próximamente</p>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-md p-6">
          <h3 class="text-lg font-semibold mb-4">Próximos Eventos</h3>
          <div class="space-y-4">
            \${monthEvents.slice(0, 10).map(event => \`
              <div class="border-l-4 border-galia-pink pl-4 py-2">
                <h4 class="font-semibold text-sm">\${event.title}</h4>
                <p class="text-xs text-gray-600 mt-1">
                  <i class="fas fa-clock mr-1"></i>
                  \${formatDateTime(event.start_datetime)}
                </p>
                \${event.client_name ? \`<p class="text-xs text-gray-500 mt-1">\${event.client_name}</p>\` : ''}
              </div>
            \`).join('')}
            
            \${monthEvents.length === 0 ? \`
              <div class="text-center py-8 text-gray-500">
                <i class="fas fa-calendar-times text-4xl mb-2 opacity-50"></i>
                <p class="text-sm">No hay eventos este mes</p>
              </div>
            \` : ''}
          </div>
        </div>
      </div>
    </div>
  \`;
}

function renderResources() {
  return \`
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold text-galia-dark">Biblioteca de Recursos</h1>
        \${STATE.currentUser?.role !== 'client' ? \`
          <button onclick="showNewResourceModal()" class="gradient-bg text-white px-6 py-3 rounded-lg hover:opacity-90 transition">
            <i class="fas fa-plus mr-2"></i>Subir Recurso
          </button>
        \` : ''}
      </div>
      
      <div class="bg-white rounded-xl shadow-md p-6">
        <p class="text-gray-600 text-center py-12">
          <i class="fas fa-book text-6xl text-gray-300 mb-4"></i><br>
          Recursos y documentación próximamente
        </p>
      </div>
    </div>
  \`;
}

// Navigation
function navigateTo(view) {
  STATE.currentView = view;
  render();
  loadViewData();
}

function loadViewData() {
  switch(STATE.currentView) {
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

// Data loaders
async function loadDashboardData() {
  try {
    if (STATE.currentUser?.role === 'client') {
      const { data } = await API.getClientDashboard();
      console.log('Client dashboard:', data);
    } else {
      const { data } = await API.getMetrics();
      STATE.dashboardMetrics = data.metrics;
      render();
    }
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

async function loadClients() {
  try {
    const { data } = await API.getClients();
    STATE.clients = data.clients;
    render();
  } catch (error) {
    console.error('Error loading clients:', error);
  }
}

async function loadProjects() {
  try {
    const { data } = await API.getProjects();
    STATE.projects = data.projects;
    render();
  } catch (error) {
    console.error('Error loading projects:', error);
  }
}

async function loadTasks() {
  try {
    const { data } = await API.getTasks();
    STATE.tasks = data.tasks;
    render();
  } catch (error) {
    console.error('Error loading tasks:', error);
  }
}

async function loadEvents() {
  try {
    const { data } = await API.getEvents();
    STATE.events = data.events;
    render();
  } catch (error) {
    console.error('Error loading events:', error);
  }
}

// Modal functions (simplificadas para demo)
function showNewClientModal() {
  alert('Modal de nuevo cliente - Por implementar UI completa');
}

function showNewProjectModal() {
  alert('Modal de nuevo proyecto - Por implementar UI completa');
}

function showNewEventModal() {
  alert('Modal de nuevo evento - Por implementar UI completa');
}

function showNewResourceModal() {
  alert('Modal de nuevo recurso - Por implementar UI completa');
}

function viewClientDetail(id) {
  alert(\`Ver detalle cliente ID: \${id} - Por implementar UI completa\`);
}

function viewProjectDetail(id) {
  alert(\`Ver detalle proyecto ID: \${id} - Por implementar UI completa\`);
}

function viewTaskDetail(id) {
  alert(\`Ver detalle tarea ID: \${id} - Por implementar UI completa\`);
}

function filterTasks(status) {
  loadTasks({ status });
}

// Auth functions
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errorDiv = document.getElementById('loginError');
  
  try {
    const { data } = await API.login(email, password);
    STATE.currentUser = data.user;
    STATE.currentView = 'dashboard';
    render();
    loadDashboardData();
  } catch (error) {
    errorDiv.textContent = error.response?.data?.error || 'Error al iniciar sesión';
    errorDiv.classList.remove('hidden');
  }
}

async function handleLogout() {
  try {
    await API.logout();
    STATE.currentUser = null;
    STATE.currentView = 'dashboard';
    render();
  } catch (error) {
    console.error('Error logging out:', error);
  }
}

async function checkAuth() {
  try {
    const { data } = await API.getMe();
    STATE.currentUser = data.user;
    return true;
  } catch {
    return false;
  }
}

// Main render function
function render() {
  const app = document.getElementById('app');
  
  if (!STATE.currentUser) {
    app.innerHTML = renderLogin();
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    return;
  }
  
  let content = '';
  switch(STATE.currentView) {
    case 'dashboard': content = renderDashboard(); break;
    case 'clients': content = renderClients(); break;
    case 'projects': content = renderProjects(); break;
    case 'tasks': content = renderTasks(); break;
    case 'calendar': content = renderCalendar(); break;
    case 'resources': content = renderResources(); break;
    default: content = renderDashboard();
  }
  
  app.innerHTML = \`
    \${renderSidebar()}
    <main class="ml-64 p-8 min-h-screen">
      \${content}
    </main>
  \`;
}

// Initialize app
(async function init() {
  console.log('🎬 Iniciando función init()...');
  try {
    console.log('🔐 Verificando autenticación...');
    const isAuthenticated = await checkAuth();
    console.log('✅ Auth verificado:', isAuthenticated);
    
    console.log('🎨 Renderizando interfaz...');
    render();
    console.log('✅ Interfaz renderizada');
    
    if (isAuthenticated) {
      console.log('📊 Cargando dashboard data...');
      loadDashboardData();
    }
    console.log('🎉 Aplicación iniciada correctamente');
  } catch (error) {
    console.error('❌ Error en init():', error);
    document.getElementById('app').innerHTML = `
      <div style="padding: 2rem; background: white; margin: 2rem; border-radius: 1rem;">
        <h1 style="color: red;">Error al iniciar la aplicación</h1>
        <pre>${error.message}</pre>
        <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #E91E8C; color: white; border: none; border-radius: 0.5rem; cursor: pointer;">
          Recargar
        </button>
      </div>
    `;
  }
})();
