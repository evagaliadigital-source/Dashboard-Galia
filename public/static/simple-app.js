// Galia Digital Platform - Versión Simplificada
console.log('🚀 App cargando...');

// Estado global
let currentUser = null;

// Utility para fetch
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
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Renderizar Login
function renderLogin() {
  document.getElementById('app').innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #E91E8C 0%, #9B4DCA 100%);">
      <div style="background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); width: 100%; max-width: 400px;">
        <div style="text-center; margin-bottom: 2rem;">
          <h1 style="font-size: 2.5rem; font-weight: bold; color: #9B4DCA; margin-bottom: 0.5rem;">Galia Digital</h1>
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
              placeholder="••••••••"
              style="width: 100%; padding: 0.75rem 1rem; border: 1px solid #D1D5DB; border-radius: 0.5rem; font-size: 1rem;"
            >
          </div>
          
          <div id="loginError" style="display: none; color: #DC2626; font-size: 0.875rem;"></div>
          
          <button 
            type="submit" 
            style="width: 100%; background: linear-gradient(135deg, #E91E8C 0%, #9B4DCA 100%); color: white; padding: 0.75rem; border-radius: 0.5rem; font-weight: 600; border: none; cursor: pointer;"
          >
            Iniciar Sesión
          </button>
        </form>
        
        <div style="margin-top: 1.5rem; text-align: center; font-size: 0.875rem; color: #6B7280;">
          <p><strong>Demo:</strong> eva@galiadigital.com / demo123</p>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

// Renderizar Dashboard
function renderDashboard() {
  document.getElementById('app').innerHTML = `
    <div style="display: flex; min-height: 100vh;">
      <!-- Sidebar -->
      <aside style="width: 16rem; background: #2D2C3E; color: white; position: fixed; height: 100vh; overflow-y: auto;">
        <div style="padding: 1.5rem; background: linear-gradient(135deg, #E91E8C 0%, #9B4DCA 100%);">
          <h1 style="font-size: 1.5rem; font-weight: bold;">Galia Digital</h1>
          <p style="font-size: 0.875rem; opacity: 0.9; margin-top: 0.25rem;">${currentUser?.name || 'Usuario'}</p>
        </div>
        
        <nav style="padding: 1rem;">
          <button onclick="navigateTo('dashboard')" style="width: 100%; text-align: left; padding: 0.75rem 1rem; border-radius: 0.5rem; background: transparent; color: white; border: none; cursor: pointer; margin-bottom: 0.5rem;">
            📊 Dashboard
          </button>
          <button onclick="navigateTo('clients')" style="width: 100%; text-align: left; padding: 0.75rem 1rem; border-radius: 0.5rem; background: transparent; color: white; border: none; cursor: pointer; margin-bottom: 0.5rem;">
            👥 Clientes
          </button>
          <button onclick="navigateTo('projects')" style="width: 100%; text-align: left; padding: 0.75rem 1rem; border-radius: 0.5rem; background: transparent; color: white; border: none; cursor: pointer; margin-bottom: 0.5rem;">
            📁 Proyectos
          </button>
        </nav>
        
        <div style="position: absolute; bottom: 0; width: 100%; padding: 1rem; border-top: 1px solid rgba(255,255,255,0.1);">
          <button onclick="handleLogout()" style="width: 100%; padding: 0.75rem 1rem; border-radius: 0.5rem; background: transparent; color: white; border: none; cursor: pointer;">
            🚪 Cerrar Sesión
          </button>
        </div>
      </aside>
      
      <!-- Main Content -->
      <main style="margin-left: 16rem; flex: 1; padding: 2rem; background: #F8F7FA;">
        <div style="max-width: 1200px;">
          <h1 style="font-size: 2rem; font-weight: bold; color: #2D2C3E; margin-bottom: 1.5rem;">Dashboard</h1>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
            <div style="background: white; padding: 1.5rem; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <p style="color: #6B7280; font-size: 0.875rem;">Clientes Activos</p>
              <h3 style="font-size: 2rem; font-weight: bold; color: #9B4DCA; margin-top: 0.5rem;">2</h3>
            </div>
            
            <div style="background: white; padding: 1.5rem; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <p style="color: #6B7280; font-size: 0.875rem;">Proyectos Activos</p>
              <h3 style="font-size: 2rem; font-weight: bold; color: #3B82F6; margin-top: 0.5rem;">3</h3>
            </div>
            
            <div style="background: white; padding: 1.5rem; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <p style="color: #6B7280; font-size: 0.875rem;">Tareas Pendientes</p>
              <h3 style="font-size: 2rem; font-weight: bold; color: #F59E0B; margin-top: 0.5rem;">5</h3>
            </div>
            
            <div style="background: white; padding: 1.5rem; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <p style="color: #6B7280; font-size: 0.875rem;">Ingresos Mensuales</p>
              <h3 style="font-size: 2rem; font-weight: bold; color: #10B981; margin-top: 0.5rem;">800€</h3>
            </div>
          </div>
          
          <div style="background: white; padding: 2rem; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h2 style="font-size: 1.25rem; font-weight: 600; color: #2D2C3E; margin-bottom: 1rem;">Bienvenida, ${currentUser?.name || 'Usuario'}!</h2>
            <p style="color: #6B7280;">Tu plataforma de gestión está lista. Navega por las secciones para gestionar clientes, proyectos y tareas.</p>
            
            <div style="margin-top: 1.5rem; padding: 1rem; background: #F3F4F6; border-radius: 0.5rem;">
              <p style="font-size: 0.875rem; color: #374151;"><strong>📌 Nota:</strong> Esta es una versión simplificada. Las funcionalidades completas se cargarán próximamente.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;
}

// Handlers
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errorDiv = document.getElementById('loginError');
  
  try {
    const data = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    currentUser = data.user;
    renderDashboard();
  } catch (error) {
    errorDiv.textContent = 'Credenciales inválidas';
    errorDiv.style.display = 'block';
  }
}

async function handleLogout() {
  try {
    await apiCall('/auth/logout', { method: 'POST' });
    currentUser = null;
    renderLogin();
  } catch (error) {
    console.error('Logout error:', error);
  }
}

function navigateTo(view) {
  alert(`Navegando a ${view} - Próximamente funcional`);
}

// Verificar auth
async function checkAuth() {
  try {
    const data = await apiCall('/auth/me');
    currentUser = data.user;
    return true;
  } catch {
    return false;
  }
}

// Inicializar
(async function init() {
  console.log('✅ Iniciando app...');
  try {
    const isAuth = await checkAuth();
    if (isAuth) {
      renderDashboard();
    } else {
      renderLogin();
    }
    console.log('✅ App iniciada');
  } catch (error) {
    console.error('❌ Error:', error);
    renderLogin();
  }
})();
