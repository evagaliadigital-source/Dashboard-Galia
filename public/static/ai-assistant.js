/**
 * GAL IA - Asistente IA de Galia Digital
 * Mentor especializado en gestión empresarial, Scrum, finanzas y legal
 */

// ============================================================================
// AI ASSISTANT STATE
// ============================================================================

if (!STATE.aiAssistant) {
  STATE.aiAssistant = {
    isOpen: false,
    messages: [],
    isTyping: false,
    isListening: false,
    voiceTranscript: null
  };
}

// ============================================================================
// VOICE RECOGNITION SETUP
// ============================================================================

let voiceRecognition = null;

function initVoiceRecognition() {
  // Check if browser supports Web Speech API
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    console.warn('Speech recognition not supported in this browser');
    return null;
  }
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  recognition.lang = 'es-ES';
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  
  recognition.onstart = () => {
    STATE.aiAssistant.isListening = true;
    STATE.aiAssistant.voiceTranscript = null;
    updateAIAssistantInputArea();
  };
  
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    STATE.aiAssistant.isListening = false;
    STATE.aiAssistant.voiceTranscript = transcript;
    updateAIAssistantInputArea();
  };
  
  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    STATE.aiAssistant.isListening = false;
    
    let errorMsg = 'Error al escuchar';
    if (event.error === 'no-speech') {
      errorMsg = 'No se detectó voz. Inténtalo de nuevo.';
    } else if (event.error === 'not-allowed') {
      errorMsg = '⚠️ Necesitas dar permiso al micrófono en tu navegador.';
    }
    
    showNotification(errorMsg, 'error');
    updateAIAssistantInputArea();
  };
  
  recognition.onend = () => {
    if (STATE.aiAssistant.isListening) {
      STATE.aiAssistant.isListening = false;
      updateAIAssistantInputArea();
    }
  };
  
  return recognition;
}

// ============================================================================
// RENDER AI ASSISTANT BUTTON (Sidebar)
// ============================================================================

function renderAIAssistantButton() {
  return `
    <button 
      onclick="toggleAIAssistant()" 
      title="GAL IA - Tu mentor de negocio"
      style="
        width: 100%; 
        padding: 1rem; 
        border: none; 
        background: transparent;
        cursor: pointer; 
        display: flex; 
        justify-content: center; 
        align-items: center;
        margin-bottom: 0.5rem; 
        transition: all 0.3s ease;
      "
      onmouseover="this.style.transform='scale(1.1)'"
      onmouseout="this.style.transform='scale(1)'"
    >
      <img 
        src="/static/galia-octopus.jpg" 
        alt="GAL IA" 
        style="
          width: 80px; 
          height: 80px; 
          border-radius: 50%; 
          border: 3px solid white; 
          box-shadow: 0 4px 16px rgba(233, 30, 140, 0.4), 0 0 0 4px rgba(233, 30, 140, 0.2); 
          animation: pulse 2s infinite;
          transition: all 0.3s ease;
        "
      />
    </button>
  `;
}

// ============================================================================
// TOGGLE AI ASSISTANT
// ============================================================================

function toggleAIAssistant() {
  STATE.aiAssistant.isOpen = !STATE.aiAssistant.isOpen;
  
  if (STATE.aiAssistant.isOpen && STATE.aiAssistant.messages.length === 0) {
    // Mensaje de bienvenida la primera vez
    addAIMessage(getWelcomeMessage());
  }
  
  renderAIAssistantPanel();
}

// ============================================================================
// RENDER AI ASSISTANT PANEL
// ============================================================================

function renderAIAssistantPanel() {
  let panel = document.getElementById('ai-assistant-panel');
  
  if (!STATE.aiAssistant.isOpen) {
    if (panel) panel.remove();
    return;
  }
  
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'ai-assistant-panel';
    document.body.appendChild(panel);
  }
  
  panel.innerHTML = `
    <div style="position: fixed; right: 0; top: 0; width: 420px; height: 100vh; background: white; box-shadow: -4px 0 24px rgba(0,0,0,0.15); z-index: 1000; display: flex; flex-direction: column; animation: slideInRight 0.3s ease;">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #E91E8C 0%, #9B4DCA 100%); color: white; padding: 1.5rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <img src="/static/galia-octopus.jpg" alt="GAL IA" style="width: 50px; height: 50px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.2);" />
        <div style="flex: 1;">
          <h2 style="margin: 0; font-size: 1.25rem; font-weight: 700;">GAL IA</h2>
          <p style="margin: 0; font-size: 0.875rem; opacity: 0.9;">Tu mentor experto en gestión 🐙</p>
        </div>
        <button onclick="toggleAIAssistant()" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <!-- Quick Actions -->
      <div style="padding: 1rem; background: #F9FAFB; border-bottom: 1px solid #E5E7EB;">
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button onclick="askAI('¿Qué leads debo llamar hoy?')" style="flex: 1; min-width: 140px; padding: 0.5rem 0.75rem; background: white; border: 2px solid #DC2626; border-radius: 0.5rem; cursor: pointer; font-size: 0.75rem; color: #DC2626; font-weight: 600; transition: all 0.2s;" onmouseover="this.style.background='#FEE2E2'" onmouseout="this.style.background='white'">
            🔥 Leads HOT
          </button>
          <button onclick="askAI('¿Cómo voy con mis proyectos?')" style="flex: 1; min-width: 140px; padding: 0.5rem 0.75rem; background: white; border: 2px solid #E5E7EB; border-radius: 0.5rem; cursor: pointer; font-size: 0.75rem; color: #6B7280; font-weight: 500; transition: all 0.2s;" onmouseover="this.style.borderColor='#9B4DCA'; this.style.color='#9B4DCA'" onmouseout="this.style.borderColor='#E5E7EB'; this.style.color='#6B7280'">
            📊 Proyectos
          </button>
          <button onclick="askAI('¿Qué tareas son urgentes?')" style="flex: 1; min-width: 140px; padding: 0.5rem 0.75rem; background: white; border: 2px solid #E5E7EB; border-radius: 0.5rem; cursor: pointer; font-size: 0.75rem; color: #6B7280; font-weight: 500; transition: all 0.2s;" onmouseover="this.style.borderColor='#9B4DCA'; this.style.color='#9B4DCA'" onmouseout="this.style.borderColor='#E5E7EB'; this.style.color='#6B7280'">
            ✓ Tareas
          </button>
          <button onclick="askAI('Dame consejos de gestión')" style="flex: 1; min-width: 140px; padding: 0.5rem 0.75rem; background: white; border: 2px solid #E5E7EB; border-radius: 0.5rem; cursor: pointer; font-size: 0.75rem; color: #6B7280; font-weight: 500; transition: all 0.2s;" onmouseover="this.style.borderColor='#9B4DCA'; this.style.color='#9B4DCA'" onmouseout="this.style.borderColor='#E5E7EB'; this.style.color='#6B7280'">
            💡 Consejos
          </button>
        </div>
      </div>
      
      <!-- Messages -->
      <div id="ai-messages" style="flex: 1; overflow-y: auto; padding: 1.5rem; background: #FFFFFF;">
        ${renderAIMessages()}
      </div>
      
      <!-- Input -->
      <div style="padding: 1rem; background: white; border-top: 2px solid #E5E7EB;">
        ${STATE.aiAssistant.isListening ? `
          <!-- Listening State -->
          <div style="text-align: center; padding: 1.5rem;">
            <div style="font-size: 3rem; margin-bottom: 0.5rem; animation: pulse 1.5s infinite;">🎤</div>
            <div style="font-weight: 600; color: #DC2626; margin-bottom: 0.25rem;">Escuchando...</div>
            <div style="font-size: 0.875rem; color: #6B7280; margin-bottom: 1rem;">Habla ahora</div>
            <div style="display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 1rem;">
              <div style="width: 4px; height: 20px; background: #DC2626; border-radius: 2px; animation: soundWave 0.6s infinite ease-in-out;"></div>
              <div style="width: 4px; height: 20px; background: #DC2626; border-radius: 2px; animation: soundWave 0.6s infinite ease-in-out 0.1s;"></div>
              <div style="width: 4px; height: 20px; background: #DC2626; border-radius: 2px; animation: soundWave 0.6s infinite ease-in-out 0.2s;"></div>
              <div style="width: 4px; height: 20px; background: #DC2626; border-radius: 2px; animation: soundWave 0.6s infinite ease-in-out 0.3s;"></div>
              <div style="width: 4px; height: 20px; background: #DC2626; border-radius: 2px; animation: soundWave 0.6s infinite ease-in-out 0.4s;"></div>
            </div>
            <button 
              onclick="stopVoiceRecognition()" 
              style="background: #DC2626; color: white; padding: 0.5rem 1.5rem; border-radius: 0.5rem; border: none; cursor: pointer; font-size: 0.875rem; font-weight: 600;"
            >
              ⏹️ Detener
            </button>
          </div>
        ` : STATE.aiAssistant.voiceTranscript ? `
          <!-- Confirmation State -->
          <div style="padding: 1rem; background: #F3F4F6; border-radius: 0.75rem; margin-bottom: 1rem;">
            <div style="font-size: 0.75rem; color: #6B7280; margin-bottom: 0.5rem; font-weight: 600;">DIJISTE:</div>
            <div style="color: #1F2937; font-size: 0.875rem; margin-bottom: 1rem;">"${STATE.aiAssistant.voiceTranscript}"</div>
            <div style="display: flex; gap: 0.5rem;">
              <button 
                onclick="confirmVoiceMessage()" 
                style="flex: 1; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 0.75rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600;"
              >
                ✓ Enviar
              </button>
              <button 
                onclick="startVoiceRecognition()" 
                style="flex: 1; background: #F59E0B; color: white; padding: 0.75rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600;"
              >
                🎤 Repetir
              </button>
              <button 
                onclick="cancelVoiceMessage()" 
                style="flex: 1; background: #6B7280; color: white; padding: 0.75rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600;"
              >
                ✗ Cancelar
              </button>
            </div>
          </div>
        ` : `
          <!-- Normal Input State -->
          <form onsubmit="sendAIMessage(event)" style="display: flex; gap: 0.75rem;">
            <input 
              type="text" 
              id="ai-input" 
              placeholder="Pregúntame lo que necesites... o usa 🎤"
              style="flex: 1; padding: 0.75rem 1rem; border: 2px solid #E5E7EB; border-radius: 0.75rem; font-size: 0.875rem; outline: none; transition: border-color 0.2s;"
              onfocus="this.style.borderColor='#9B4DCA'"
              onblur="this.style.borderColor='#E5E7EB'"
            />
            <button 
              type="button"
              onclick="startVoiceRecognition()" 
              style="background: linear-gradient(135deg, #DC2626 0%, #F59E0B 100%); color: white; padding: 0.75rem 1.25rem; border-radius: 0.75rem; border: none; cursor: pointer; font-weight: 600; transition: all 0.2s; box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);"
              onmouseover="this.style.transform='scale(1.05)'"
              onmouseout="this.style.transform='scale(1)'"
              title="Hablar con GAL IA"
            >
              🎤
            </button>
            <button 
              type="submit" 
              style="background: linear-gradient(135deg, #E91E8C 0%, #9B4DCA 100%); color: white; padding: 0.75rem 1.25rem; border-radius: 0.75rem; border: none; cursor: pointer; font-weight: 600; transition: all 0.2s; box-shadow: 0 2px 8px rgba(233, 30, 140, 0.3);"
              onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(233, 30, 140, 0.4)'"
              onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(233, 30, 140, 0.3)'"
            >
              <i class="fas fa-paper-plane"></i>
            </button>
          </form>
        `}
      </div>
    </div>
  `;
  
  // Auto-scroll to bottom
  setTimeout(() => {
    const messagesDiv = document.getElementById('ai-messages');
    if (messagesDiv) messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }, 100);
}

// ============================================================================
// RENDER AI MESSAGES
// ============================================================================

function renderAIMessages() {
  if (STATE.aiAssistant.messages.length === 0) {
    return '<div style="text-align: center; color: #9CA3AF; padding: 2rem;">No hay mensajes aún</div>';
  }
  
  return STATE.aiAssistant.messages.map(msg => {
    if (msg.role === 'user') {
      return `
        <div style="display: flex; justify-content: flex-end; margin-bottom: 1rem;">
          <div style="background: linear-gradient(135deg, #E91E8C 0%, #9B4DCA 100%); color: white; padding: 0.75rem 1rem; border-radius: 1rem 1rem 0.25rem 1rem; max-width: 80%; box-shadow: 0 2px 4px rgba(233, 30, 140, 0.2);">
            <p style="margin: 0; font-size: 0.875rem; line-height: 1.5;">${msg.content}</p>
          </div>
        </div>
      `;
    } else {
      return `
        <div style="display: flex; gap: 0.75rem; margin-bottom: 1rem;">
          <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #E91E8C 0%, #9B4DCA 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0;">
            🐙
          </div>
          <div style="background: #F3F4F6; padding: 0.75rem 1rem; border-radius: 1rem 1rem 1rem 0.25rem; max-width: 80%; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="color: #1F2937; font-size: 0.875rem; line-height: 1.6;">
              ${msg.content}
            </div>
          </div>
        </div>
      `;
    }
  }).join('') + (STATE.aiAssistant.isTyping ? `
    <div style="display: flex; gap: 0.75rem; margin-bottom: 1rem;">
      <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #E91E8C 0%, #9B4DCA 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0;">
        🐙
      </div>
      <div style="background: #F3F4F6; padding: 0.75rem 1rem; border-radius: 1rem 1rem 1rem 0.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="display: flex; gap: 0.25rem;">
          <div style="width: 8px; height: 8px; background: #9CA3AF; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out;"></div>
          <div style="width: 8px; height: 8px; background: #9CA3AF; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out 0.2s;"></div>
          <div style="width: 8px; height: 8px; background: #9CA3AF; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out 0.4s;"></div>
        </div>
      </div>
    </div>
  ` : '');
}

// ============================================================================
// SEND AI MESSAGE
// ============================================================================

async function sendAIMessage(event) {
  if (event) event.preventDefault();
  
  const input = document.getElementById('ai-input');
  const message = input.value.trim();
  
  if (!message) return;
  
  // Save input focus state
  const hadFocus = document.activeElement === input;
  
  // Add user message
  addUserMessage(message);
  input.value = '';
  
  // Show typing indicator
  STATE.aiAssistant.isTyping = true;
  renderAIAssistantPanel();
  
  // Restore focus if needed
  if (hadFocus) {
    setTimeout(() => {
      const newInput = document.getElementById('ai-input');
      if (newInput) newInput.focus();
    }, 50);
  }
  
  // Get AI response
  setTimeout(async () => {
    const response = await getAIResponse(message);
    STATE.aiAssistant.isTyping = false;
    addAIMessage(response);
    renderAIAssistantPanel();
  }, 1000 + Math.random() * 1000);
}

// ============================================================================
// ASK AI (Quick Actions)
// ============================================================================

function askAI(question) {
  const input = document.getElementById('ai-input');
  if (input) {
    input.value = question;
    sendAIMessage();
  }
}

// ============================================================================
// ADD MESSAGES
// ============================================================================

function addUserMessage(content) {
  STATE.aiAssistant.messages.push({
    role: 'user',
    content: content,
    timestamp: new Date().toISOString()
  });
}

function addAIMessage(content) {
  STATE.aiAssistant.messages.push({
    role: 'assistant',
    content: content,
    timestamp: new Date().toISOString()
  });
}

// ============================================================================
// GET WELCOME MESSAGE
// ============================================================================

function getWelcomeMessage() {
  return `
    <strong>¡Hola ${STATE.currentUser?.name || 'Eva'}! 👋</strong><br><br>
    Soy <strong>GAL IA</strong>, tu mentor especializado en gestión empresarial. Estoy aquí para ayudarte con:<br><br>
    🎯 <strong>Gestión de Leads & Ventas</strong><br>
    📊 <strong>Scrum & Metodologías Ágiles</strong><br>
    💼 <strong>Gestión de proyectos</strong><br>
    💰 <strong>Finanzas & Legal básico</strong><br>
    ⏰ <strong>Seguimiento y recordatorios</strong><br>
    📈 <strong>Análisis de tu negocio</strong><br><br>
    Puedo analizar tu dashboard, darte consejos sobre priorización, estrategias de leads, recordarte tareas importantes y más.<br><br>
    <em>¿En qué te puedo ayudar hoy?</em> 💜
  `;
}

// ============================================================================
// GET AI RESPONSE (Real OpenAI Integration)
// ============================================================================

async function getAIResponse(userMessage) {
  try {
    // Prepare context from dashboard
    const context = {
      leads: STATE.leads || [],
      projects: STATE.projects || [],
      tasks: STATE.tasks || [],
      clients: STATE.clients || [],
      metrics: STATE.metrics || {}
    };

    // Call backend API
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        message: userMessage,
        context: context
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error de API:', errorData);
      return `❌ <strong>Error al conectar con GAL IA</strong><br><br>${errorData.error || 'Error desconocido'}`;
    }

    const data = await response.json();
    return data.message || 'Sin respuesta de GAL IA';

  } catch (error) {
    console.error('Error en getAIResponse:', error);
    return `❌ <strong>Error de conexión</strong><br><br>No se pudo conectar con GAL IA. Verifica tu conexión e intenta de nuevo.`;
  }
}

// ============================================================================
// FALLBACK: OLD RESPONSE SYSTEM (Backup si falla API)
// ============================================================================

async function getAIResponseOLD(userMessage) {
  const message = userMessage.toLowerCase();
  
  // Analizar contexto del dashboard
  const projects = STATE.projects || [];
  const tasks = STATE.tasks || [];
  const metrics = STATE.metrics || {};
  
  const projectsActive = projects.filter(p => ['pending', 'in_progress', 'review'].includes(p.status));
  const tasksOverdue = tasks.filter(t => {
    if (!t.due_date || t.status === 'completed') return false;
    return new Date(t.due_date) < new Date();
  });
  const tasksUrgent = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed');
  
  // Respuestas contextuales inteligentes
  
  // Estado de proyectos
  if (message.includes('proyecto') || message.includes('estado') || message.includes('cómo voy')) {
    const pending = projects.filter(p => p.status === 'pending').length;
    const inProgress = projects.filter(p => p.status === 'in_progress').length;
    const review = projects.filter(p => p.status === 'review').length;
    const completed = projects.filter(p => p.status === 'completed').length;
    
    let response = `<strong>📊 Estado de tus Proyectos:</strong><br><br>`;
    response += `• <strong>${projectsActive.length} proyectos activos</strong> en total<br>`;
    response += `• ${pending} en Pendiente ⏳<br>`;
    response += `• ${inProgress} en Progreso 🔄<br>`;
    response += `• ${review} en Revisión 👀<br>`;
    response += `• ${completed} Completados ✅<br><br>`;
    
    if (pending > inProgress + review) {
      response += `<strong>💡 Consejo Scrum:</strong> Tienes muchos proyectos pendientes. Te recomiendo aplicar el principio de <strong>"Work In Progress (WIP) limit"</strong>. Mueve 2-3 proyectos prioritarios a "En Progreso" y enfócate en terminarlos antes de comenzar nuevos.`;
    } else if (review > 3) {
      response += `<strong>💡 Consejo:</strong> Tienes ${review} proyectos en revisión. Para mantener el flujo Scrum, intenta revisar y completar estos proyectos esta semana.`;
    } else if (completed > pending + inProgress) {
      response += `<strong>🎉 ¡Excelente trabajo!</strong> Has completado más proyectos de los que tienes activos. Tu ratio de finalización es muy bueno. Mantén este ritmo.`;
    } else {
      response += `<strong>✅ Buen equilibrio</strong> entre proyectos activos y completados. Sigue así.`;
    }
    
    return response;
  }
  
  // Tareas urgentes
  if (message.includes('tarea') || message.includes('urgente') || message.includes('prioridad')) {
    let response = `<strong>🔥 Análisis de Tareas:</strong><br><br>`;
    
    if (tasksUrgent.length > 0) {
      response += `<strong>⚠️ ATENCIÓN:</strong> Tienes <strong>${tasksUrgent.length} tareas urgentes</strong> sin completar:<br><br>`;
      tasksUrgent.slice(0, 3).forEach(task => {
        response += `• <strong>${task.title}</strong>`;
        if (task.due_date) response += ` (Vence: ${formatDate(task.due_date)})`;
        response += `<br>`;
      });
      if (tasksUrgent.length > 3) response += `<br>... y ${tasksUrgent.length - 3} más<br>`;
      response += `<br><strong>💡 Recomendación:</strong> En Scrum, las tareas urgentes deben resolverse en el sprint actual. Te sugiero dedicar las primeras 2 horas de mañana a estas tareas.`;
    } else if (tasksOverdue.length > 0) {
      response += `Tienes <strong>${tasksOverdue.length} tareas atrasadas</strong> 🔴<br><br>`;
      response += `<strong>💡 Plan de acción:</strong><br>`;
      response += `1. Revalúa si estas tareas siguen siendo necesarias<br>`;
      response += `2. Reprograma las fechas realistas<br>`;
      response += `3. Delega las que sea posible<br>`;
      response += `4. Cancela las que ya no apliquen`;
    } else {
      response += `<strong>✅ ¡Excelente!</strong> No tienes tareas urgentes pendientes.<br><br>`;
      const pendingTasks = tasks.filter(t => t.status === 'pending').length;
      if (pendingTasks > 0) {
        response += `Tienes ${pendingTasks} tareas pendientes. Te sugiero moverlas a "En Progreso" según tu capacidad del sprint.`;
      } else {
        response += `Tu backlog está limpio. Buen momento para planificar el próximo sprint.`;
      }
    }
    
    return response;
  }
  
  // Análisis de Leads (NUEVO)
  if (message.includes('lead') || message.includes('cliente') || message.includes('prospecto') || message.includes('hot') || message.includes('caliente')) {
    const clients = STATE.clients || [];
    
    const leadsHot = clients.filter(c => c.lead_quality === 'hot' && c.client_status === 'prospect');
    const leadsWarm = clients.filter(c => c.lead_quality === 'warm' && c.client_status === 'prospect');
    const leadsCold = clients.filter(c => c.lead_quality === 'cold' && c.client_status === 'prospect');
    const clientsActive = clients.filter(c => c.client_status === 'active');
    
    // Análisis de colectivos
    const collectiveMap = {};
    clients.forEach(c => {
      if (c.collective) {
        if (!collectiveMap[c.collective]) {
          collectiveMap[c.collective] = { hot: 0, warm: 0, cold: 0, active: 0 };
        }
        if (c.client_status === 'active') collectiveMap[c.collective].active++;
        else if (c.lead_quality === 'hot') collectiveMap[c.collective].hot++;
        else if (c.lead_quality === 'warm') collectiveMap[c.collective].warm++;
        else if (c.lead_quality === 'cold') collectiveMap[c.collective].cold++;
      }
    });
    
    let response = `<strong>🎯 Análisis de Gestión de Leads:</strong><br><br>`;
    
    // Resumen general
    response += `<strong>📊 Pipeline Actual:</strong><br>`;
    response += `• 🔴 <strong>${leadsHot.length} HOT</strong> - Listos para cerrar<br>`;
    response += `• 🟠 <strong>${leadsWarm.length} WARM</strong> - Necesitan seguimiento<br>`;
    response += `• 🟡 <strong>${leadsCold.length} COLD</strong> - Largo plazo<br>`;
    response += `• 🟢 <strong>${clientsActive.length} ACTIVOS</strong> - Ya facturando<br><br>`;
    
    // Priorización
    if (leadsHot.length > 0) {
      response += `<strong>🔥 PRIORIDAD MÁXIMA:</strong><br>`;
      response += `Tienes <strong>${leadsHot.length} leads HOT</strong> listos para cerrar. Estos deben ser tu foco esta semana:<br><br>`;
      leadsHot.slice(0, 3).forEach(lead => {
        response += `• <strong>${lead.business_name}</strong>`;
        if (lead.collective) response += ` (${lead.collective})`;
        response += `<br>`;
      });
      if (leadsHot.length > 3) response += `... y ${leadsHot.length - 3} más<br>`;
      response += `<br>`;
    }
    
    // Estrategia de colectivos
    const collectivesWithActive = Object.entries(collectiveMap).filter(([_, data]) => data.active > 0);
    if (collectivesWithActive.length > 0) {
      response += `<strong>🏢 EFECTO RED - OPORTUNIDAD:</strong><br>`;
      collectivesWithActive.forEach(([collective, data]) => {
        const totalProspects = data.hot + data.warm + data.cold;
        if (totalProspects > 0) {
          response += `<br><strong>${collective}:</strong><br>`;
          response += `• ✅ ${data.active} cliente${data.active > 1 ? 's' : ''} activo${data.active > 1 ? 's' : ''}<br>`;
          response += `• 💼 ${totalProspects} prospecto${totalProspects > 1 ? 's' : ''} más`;
          if (data.hot > 0) response += ` (${data.hot} HOT 🔥)`;
          response += `<br><br>`;
          response += `<strong>💡 Estrategia:</strong> Usa el caso de éxito de tu cliente activo como referencia para los ${totalProspects} prospectos restantes. Menciona resultados concretos en tu pitch.<br>`;
        }
      });
      response += `<br>`;
    }
    
    // Recomendaciones
    response += `<strong>📋 Plan de Acción Recomendado:</strong><br>`;
    if (leadsHot.length > 0) {
      response += `1. <strong>HOY/MAÑANA:</strong> Llamar a los ${leadsHot.length} leads HOT 🔴<br>`;
    }
    if (leadsWarm.length > 0) {
      response += `2. <strong>ESTA SEMANA:</strong> Seguimiento a ${leadsWarm.length} leads WARM 🟠<br>`;
    }
    if (leadsCold.length > 0) {
      response += `3. <strong>CONTINUO:</strong> Nutrir con contenido a ${leadsCold.length} leads COLD 🟡<br>`;
    }
    
    // Tasa de conversión
    const totalLeads = leadsHot.length + leadsWarm.length + leadsCold.length;
    if (totalLeads > 0 && clientsActive.length > 0) {
      const conversionRate = Math.round((clientsActive.length / (clientsActive.length + totalLeads)) * 100);
      response += `<br><strong>📈 Tasa de Conversión:</strong> ${conversionRate}%`;
      if (conversionRate < 20) {
        response += ` - Necesitas mejorar tu cierre. Considera: más demos, pricing ajustado, casos de éxito.`;
      } else if (conversionRate < 40) {
        response += ` - Tasa normal. Enfócate en leads HOT y usa referencias.`;
      } else {
        response += ` - ¡Excelente! Tu proceso de cierre funciona muy bien.`;
      }
    }
    
    return response;
  }
  
  // Análisis de Proyectos por Tipo (NUEVO - Diferenciación Cliente vs Interno)
  if (message.includes('proyecto interno') || message.includes('proyecto empresa') || message.includes('proyecto cliente') || message.includes('galia digital') || message.includes('obligaciones') || message.includes('ceo')) {
    const projectsClient = projects.filter(p => p.project_type === 'client');
    const projectsInternal = projects.filter(p => p.project_type === 'internal');
    const projectsCompany = projects.filter(p => p.project_type === 'company');
    
    const clientActive = projectsClient.filter(p => ['pending', 'in_progress', 'review'].includes(p.status));
    const internalActive = projectsInternal.filter(p => ['pending', 'in_progress', 'review'].includes(p.status));
    const companyActive = projectsCompany.filter(p => ['pending', 'in_progress', 'review'].includes(p.status));
    
    let response = `<strong>📂 Análisis de Proyectos por Tipo:</strong><br><br>`;
    
    // Proyectos de Clientes
    response += `<strong>👥 PROYECTOS DE CLIENTES (Facturables):</strong><br>`;
    response += `• Total: ${projectsClient.length} proyectos<br>`;
    response += `• Activos: ${clientActive.length}<br>`;
    response += `• Completados: ${projectsClient.filter(p => p.status === 'completed').length}<br>`;
    if (clientActive.length > 0) {
      response += `<br>Proyectos activos:<br>`;
      clientActive.slice(0, 3).forEach(p => {
        response += `  • ${p.name}`;
        if (p.client_name) response += ` (${p.client_name})`;
        response += ` - ${p.status === 'pending' ? '⏳' : p.status === 'in_progress' ? '🔄' : '👀'}<br>`;
      });
      if (clientActive.length > 3) response += `  ... y ${clientActive.length - 3} más<br>`;
    }
    response += `<br>`;
    
    // Proyectos Internos
    response += `<strong>🏢 PROYECTOS INTERNOS GALIA DIGITAL:</strong><br>`;
    response += `• Total: ${projectsInternal.length} proyectos<br>`;
    response += `• Activos: ${internalActive.length}<br>`;
    response += `• Completados: ${projectsInternal.filter(p => p.status === 'completed').length}<br>`;
    if (internalActive.length > 0) {
      response += `<br>Proyectos internos activos:<br>`;
      internalActive.slice(0, 3).forEach(p => {
        response += `  • ${p.name} - ${p.status === 'pending' ? '⏳' : p.status === 'in_progress' ? '🔄' : '👀'}<br>`;
      });
      if (internalActive.length > 3) response += `  ... y ${internalActive.length - 3} más<br>`;
    }
    response += `<br>`;
    
    // Proyectos Empresa/CEO
    response += `<strong>⚙️ PROYECTOS EMPRESA (Obligaciones CEO):</strong><br>`;
    response += `• Total: ${projectsCompany.length} proyectos<br>`;
    response += `• Activos: ${companyActive.length}<br>`;
    response += `• Completados: ${projectsCompany.filter(p => p.status === 'completed').length}<br>`;
    if (companyActive.length > 0) {
      response += `<br>Obligaciones CEO activas:<br>`;
      companyActive.slice(0, 3).forEach(p => {
        response += `  • ${p.name} - ${p.status === 'pending' ? '⏳' : p.status === 'in_progress' ? '🔄' : '👀'}<br>`;
      });
      if (companyActive.length > 3) response += `  ... y ${companyActive.length - 3} más<br>`;
    }
    response += `<br>`;
    
    // Análisis y Recomendaciones
    response += `<strong>📊 ANÁLISIS DE BALANCE:</strong><br>`;
    
    const totalActive = clientActive.length + internalActive.length + companyActive.length;
    const clientRatio = totalActive > 0 ? Math.round((clientActive.length / totalActive) * 100) : 0;
    const internalRatio = totalActive > 0 ? Math.round((internalActive.length / totalActive) * 100) : 0;
    const companyRatio = totalActive > 0 ? Math.round((companyActive.length / totalActive) * 100) : 0;
    
    response += `• Clientes: ${clientRatio}% de tu tiempo activo<br>`;
    response += `• Internos: ${internalRatio}% de tu tiempo activo<br>`;
    response += `• Empresa: ${companyRatio}% de tu tiempo activo<br><br>`;
    
    response += `<strong>💡 RECOMENDACIONES:</strong><br>`;
    
    if (clientRatio < 50 && clientActive.length > 0) {
      response += `⚠️ <strong>Alerta:</strong> Solo el ${clientRatio}% de tu tiempo va a proyectos facturables. Como emprendedora, deberías dedicar al menos 60-70% a trabajo de clientes para mantener cashflow saludable.<br><br>`;
      response += `<strong>Plan de acción:</strong><br>`;
      response += `1. Delega o automatiza proyectos internos<br>`;
      response += `2. Bloquea 3-4 horas diarias exclusivamente para proyectos de clientes<br>`;
      response += `3. Agenda tareas CEO para slots específicos (ej: viernes tarde)<br>`;
    } else if (clientRatio > 80 && (internalActive.length + companyActive.length) > 0) {
      response += `⚠️ <strong>Alerta:</strong> El ${clientRatio}% de tu tiempo va a clientes. Esto es bueno para ingresos, pero descuidas el crecimiento interno de Galia Digital.<br><br>`;
      response += `<strong>Plan de acción:</strong><br>`;
      response += `1. Dedica 1-2 horas/día a proyectos internos<br>`;
      response += `2. Automatiza procesos de clientes para liberar tiempo<br>`;
      response += `3. Considera contratar ayuda para trabajo operativo<br>`;
    } else if (companyActive.length > 5) {
      response += `⚠️ Tienes ${companyActive.length} obligaciones CEO activas. Esto puede ser abrumador.<br><br>`;
      response += `<strong>Tip de productividad:</strong><br>`;
      response += `• Aplica "CEO Days": Dedica 1 día completo a la semana solo a temas de empresa<br>`;
      response += `• Usa time-blocking: Agrupa tareas similares (ej: todas las llamadas en una tarde)<br>`;
      response += `• Prioriza con matriz de Eisenhower (urgente vs importante)<br>`;
    } else {
      response += `✅ <strong>Balance saludable</strong> entre proyectos de clientes, internos y obligaciones empresa.<br><br>`;
      response += `Mantén este equilibrio y revisa semanalmente para ajustar según cambien las prioridades del negocio.`;
    }
    
    return response;
  }
  
  // Consejos de gestión
  if (message.includes('consejo') || message.includes('ayuda') || message.includes('tip')) {
    const tips = [
      `<strong>📋 Daily Standup:</strong><br>Aunque trabajes sola, dedica 5 minutos cada mañana a revisar:<br>• ¿Qué hice ayer?<br>• ¿Qué haré hoy?<br>• ¿Qué me bloquea?<br><br>Esto te ayuda a mantener el foco.`,
      
      `<strong>⏱️ Timeboxing:</strong><br>Aplica la técnica Pomodoro:<br>• 25 min de trabajo enfocado<br>• 5 min de descanso<br>• Cada 4 pomodoros, 15-30 min de descanso largo<br><br>Aumenta tu productividad un 40%.`,
      
      `<strong>🎯 Priorización MoSCoW:</strong><br>Clasifica tus tareas:<br>• <strong>Must have:</strong> Crítico<br>• <strong>Should have:</strong> Importante<br>• <strong>Could have:</strong> Deseable<br>• <strong>Won't have:</strong> Para después<br><br>Te ayuda a decidir qué hacer primero.`,
      
      `<strong>💰 Regla 50/30/20 (Finanzas):</strong><br>Para tu negocio:<br>• 50% - Gastos operativos<br>• 30% - Inversión en crecimiento<br>• 20% - Ahorro/reserva<br><br>Mantén siempre un fondo de emergencia.`,
      
      `<strong>📊 Retrospectiva Semanal:</strong><br>Cada viernes dedica 15 minutos a:<br>• ¿Qué salió bien?<br>• ¿Qué salió mal?<br>• ¿Qué puedo mejorar?<br><br>La mejora continua es clave del éxito.`,
      
      `<strong>🚀 Sprint Planning:</strong><br>Cada lunes:<br>1. Define objetivos de la semana<br>2. Prioriza 5-7 tareas máximo<br>3. Estima tiempo realista<br>4. Deja 20% de margen para imprevistos<br><br>No sobrecargues tu sprint.`
    ];
    
    return tips[Math.floor(Math.random() * tips.length)];
  }
  
  // Análisis dashboard
  if (message.includes('analiz') || message.includes('dashboard') || message.includes('resumen')) {
    let response = `<strong>📈 Análisis Completo de Galia Digital:</strong><br><br>`;
    
    response += `<strong>Proyectos:</strong><br>`;
    response += `• ${projects.length} totales (${projectsActive.length} activos)<br>`;
    response += `• Ratio de completados: ${projects.length > 0 ? Math.round((projects.filter(p => p.status === 'completed').length / projects.length) * 100) : 0}%<br><br>`;
    
    response += `<strong>Tareas:</strong><br>`;
    response += `• ${tasks.length} totales<br>`;
    response += `• ${tasksOverdue.length} atrasadas 🔴<br>`;
    response += `• ${tasksUrgent.length} urgentes 🔥<br><br>`;
    
    response += `<strong>💡 Recomendación General:</strong><br>`;
    
    if (tasksOverdue.length > 5) {
      response += `Tu mayor problema son las <strong>tareas atrasadas</strong>. Necesitas:<br>1. Revisar fechas<br>2. Delegar o cancelar<br>3. Aplicar WIP limits más estrictos`;
    } else if (projectsActive.length > 10) {
      response += `Tienes demasiados proyectos activos. En Scrum se recomienda <strong>máximo 3-5 proyectos simultáneos</strong> para mantener el foco y la velocidad.`;
    } else if (projects.filter(p => p.status === 'completed').length > projectsActive.length * 2) {
      response += `<strong>¡Felicidades! 🎉</strong> Tu velocity es excelente. Estás completando proyectos más rápido de lo que comienzas nuevos. Este es el equilibrio ideal.`;
    } else {
      response += `Tu flujo de trabajo está equilibrado. Mantén este ritmo y revisa semanalmente tus prioridades.`;
    }
    
    return response;
  }
  
  // Legal básico
  if (message.includes('legal') || message.includes('contrato') || message.includes('factura')) {
    return `<strong>⚖️ Recordatorios Legales para Galia Digital:</strong><br><br>
      <strong>Contratos con clientes:</strong><br>
      • Siempre firma un contrato antes de empezar<br>
      • Define alcance, entregables y tiempos<br>
      • Incluye cláusula de propiedad intelectual<br>
      • Establece formas de pago claras<br><br>
      <strong>Facturación:</strong><br>
      • Emite facturas dentro de los 30 días<br>
      • Guarda copias digitales mínimo 5 años<br>
      • Incluye siempre tu CIF y datos fiscales<br><br>
      <strong>💡 Tip:</strong> Considera contratar un asesor fiscal para optimizar tu estructura tributaria.`;
  }
  
  // Finanzas
  if (message.includes('finanz') || message.includes('dinero') || message.includes('ingreso')) {
    const clientsActive = metrics.clients?.active || 0;
    const monthlyRevenue = metrics.revenue?.monthly || 0;
    
    return `<strong>💰 Análisis Financiero:</strong><br><br>
      ${clientsActive > 0 ? `<strong>Ingresos actuales:</strong> ${Math.round(monthlyRevenue)}€/mes<br>` : ''}
      ${clientsActive > 0 ? `<strong>Clientes activos:</strong> ${clientsActive}<br>` : ''}
      ${clientsActive > 0 ? `<strong>Ingreso promedio por cliente:</strong> ${Math.round(monthlyRevenue / clientsActive)}€<br><br>` : ''}
      <strong>💡 Consejos financieros:</strong><br>
      1. <strong>Diversifica:</strong> No dependas de 1-2 clientes grandes<br>
      2. <strong>Pricing:</strong> Revisa tus precios cada 6 meses<br>
      3. <strong>Cashflow:</strong> Mantén 3 meses de gastos en reserva<br>
      4. <strong>Upselling:</strong> Ofrece servicios adicionales a clientes actuales<br><br>
      <strong>Objetivo:</strong> Si quieres llegar a 42 clientes (punto de autofinanciación), necesitas ${42 - clientsActive} clientes más.`;
  }
  
  // Respuesta genérica inteligente
  return `<strong>Entiendo tu pregunta sobre "${userMessage}"</strong> 🤔<br><br>
    Como mentor de Galia Digital, puedo ayudarte con:<br><br>
    📊 <strong>Gestión Scrum:</strong> "¿Cómo voy con mis proyectos?"<br>
    ⏰ <strong>Priorización:</strong> "¿Qué tareas son urgentes?"<br>
    💡 <strong>Consejos:</strong> "Dame tips de productividad"<br>
    📈 <strong>Análisis:</strong> "Analiza mi dashboard"<br>
    💰 <strong>Finanzas:</strong> "Cómo están mis ingresos?"<br>
    ⚖️ <strong>Legal:</strong> "Consejos sobre contratos"<br><br>
    <em>¿En qué específicamente te puedo ayudar?</em> 💜`;
}

// ============================================================================
// ANIMATIONS
// ============================================================================

const aiStyles = document.createElement('style');
aiStyles.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }
  
  @keyframes bounce {
    0%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-10px);
    }
  }
`;
document.head.appendChild(aiStyles);

// ============================================================================
// UPDATE INPUT AREA ONLY (without full re-render)
// ============================================================================

function updateAIAssistantInputArea() {
  const inputContainer = document.querySelector('#ai-assistant-panel > div > div:last-child');
  if (!inputContainer) {
    // Si no existe el contenedor, hacer render completo
    renderAIAssistantPanel();
    return;
  }
  
  const inputHTML = STATE.aiAssistant.isListening ? `
    <!-- Listening State -->
    <div style="text-align: center; padding: 1.5rem;">
      <div style="font-size: 3rem; margin-bottom: 0.5rem; animation: pulse 1.5s infinite;">🎤</div>
      <div style="font-weight: 600; color: #DC2626; margin-bottom: 0.25rem;">Escuchando...</div>
      <div style="font-size: 0.875rem; color: #6B7280; margin-bottom: 1rem;">Habla ahora</div>
      <div style="display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 1rem;">
        <div style="width: 4px; height: 20px; background: #DC2626; border-radius: 2px; animation: soundWave 0.6s infinite ease-in-out;"></div>
        <div style="width: 4px; height: 20px; background: #DC2626; border-radius: 2px; animation: soundWave 0.6s infinite ease-in-out 0.1s;"></div>
        <div style="width: 4px; height: 20px; background: #DC2626; border-radius: 2px; animation: soundWave 0.6s infinite ease-in-out 0.2s;"></div>
        <div style="width: 4px; height: 20px; background: #DC2626; border-radius: 2px; animation: soundWave 0.6s infinite ease-in-out 0.3s;"></div>
        <div style="width: 4px; height: 20px; background: #DC2626; border-radius: 2px; animation: soundWave 0.6s infinite ease-in-out 0.4s;"></div>
      </div>
      <button 
        onclick="stopVoiceRecognition()" 
        style="background: #DC2626; color: white; padding: 0.5rem 1.5rem; border-radius: 0.5rem; border: none; cursor: pointer; font-size: 0.875rem; font-weight: 600;"
      >
        ⏹️ Detener
      </button>
    </div>
  ` : STATE.aiAssistant.voiceTranscript ? `
    <!-- Confirmation State -->
    <div style="padding: 1rem; background: #F3F4F6; border-radius: 0.75rem; margin-bottom: 1rem;">
      <div style="font-size: 0.75rem; color: #6B7280; margin-bottom: 0.5rem; font-weight: 600;">DIJISTE:</div>
      <div style="color: #1F2937; font-size: 0.875rem; margin-bottom: 1rem;">"${STATE.aiAssistant.voiceTranscript}"</div>
      <div style="display: flex; gap: 0.5rem;">
        <button 
          onclick="confirmVoiceMessage()" 
          style="flex: 1; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 0.75rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600;"
        >
          ✓ Enviar
        </button>
        <button 
          onclick="startVoiceRecognition()" 
          style="flex: 1; background: #F59E0B; color: white; padding: 0.75rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600;"
        >
          🎤 Repetir
        </button>
        <button 
          onclick="cancelVoiceMessage()" 
          style="flex: 1; background: #6B7280; color: white; padding: 0.75rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600;"
        >
          ✗ Cancelar
        </button>
      </div>
    </div>
  ` : `
    <!-- Normal Input State -->
    <form onsubmit="sendAIMessage(event)" style="display: flex; gap: 0.75rem;">
      <input 
        type="text" 
        id="ai-input" 
        placeholder="Pregúntame lo que necesites... o usa 🎤"
        style="flex: 1; padding: 0.75rem 1rem; border: 2px solid #E5E7EB; border-radius: 0.75rem; font-size: 0.875rem; outline: none; transition: border-color 0.2s;"
        onfocus="this.style.borderColor='#9B4DCA'"
        onblur="this.style.borderColor='#E5E7EB'"
      />
      <button 
        type="button"
        onclick="startVoiceRecognition()" 
        style="background: linear-gradient(135deg, #DC2626 0%, #F59E0B 100%); color: white; padding: 0.75rem 1.25rem; border-radius: 0.75rem; border: none; cursor: pointer; font-weight: 600; transition: all 0.2s; box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);"
        onmouseover="this.style.transform='scale(1.05)'"
        onmouseout="this.style.transform='scale(1)'"
        title="Hablar con GAL IA"
      >
        🎤
      </button>
      <button 
        type="submit" 
        style="background: linear-gradient(135deg, #E91E8C 0%, #9B4DCA 100%); color: white; padding: 0.75rem 1.25rem; border-radius: 0.75rem; border: none; cursor: pointer; font-weight: 600; transition: all 0.2s; box-shadow: 0 2px 8px rgba(233, 30, 140, 0.3);"
        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(233, 30, 140, 0.4)'"
        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(233, 30, 140, 0.3)'"
      >
        <i class="fas fa-paper-plane"></i>
      </button>
    </form>
  `;
  
  inputContainer.innerHTML = inputHTML;
}

// ============================================================================
// VOICE RECOGNITION CONTROLS
// ============================================================================

function startVoiceRecognition() {
  // Initialize recognition if not already done
  if (!voiceRecognition) {
    voiceRecognition = initVoiceRecognition();
  }
  
  if (!voiceRecognition) {
    showNotification('❌ Tu navegador no soporta reconocimiento de voz. Usa Chrome, Edge o Safari.', 'error');
    return;
  }
  
  try {
    STATE.aiAssistant.voiceTranscript = null;
    voiceRecognition.start();
  } catch (error) {
    console.error('Error starting recognition:', error);
    showNotification('Error al iniciar micrófono', 'error');
  }
}

function stopVoiceRecognition() {
  if (voiceRecognition) {
    voiceRecognition.stop();
  }
  STATE.aiAssistant.isListening = false;
  updateAIAssistantInputArea();
}

function confirmVoiceMessage() {
  const transcript = STATE.aiAssistant.voiceTranscript;
  if (transcript) {
    // Add user message
    addUserMessage(transcript);
    STATE.aiAssistant.voiceTranscript = null;
    
    // Show typing indicator
    STATE.aiAssistant.isTyping = true;
    renderAIAssistantPanel();
    
    // Get AI response
    setTimeout(async () => {
      const response = await getAIResponse(transcript);
      STATE.aiAssistant.isTyping = false;
      addAIMessage(response);
      renderAIAssistantPanel();
    }, 1000 + Math.random() * 1000);
  }
}

function cancelVoiceMessage() {
  STATE.aiAssistant.voiceTranscript = null;
  updateAIAssistantInputArea();
}

// ============================================================================
// VOICE ANIMATIONS
// ============================================================================

const voiceStyles = document.createElement('style');
voiceStyles.textContent = `
  @keyframes soundWave {
    0%, 100% {
      height: 20px;
    }
    50% {
      height: 40px;
    }
  }
`;
document.head.appendChild(voiceStyles);

console.log('✅ GAL IA - Asistente de IA con reconocimiento de voz cargado');
