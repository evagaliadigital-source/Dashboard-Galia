// ============================================
// GALIA DIGITAL - CALENDARIO CON MÚLTIPLES VISTAS
// ============================================

console.log('📅 Sistema de calendario cargando...');

// Estado del calendario
STATE.calendarView = 'month'; // month, week, day, list
STATE.currentDate = new Date();
STATE.events = [];
STATE.selectedEvent = null;

// Cargar eventos
async function loadEvents() {
  try {
    const { events } = await apiCall('/events');
    STATE.events = events || [];
    render();
  } catch (error) {
    console.error('Error cargando eventos:', error);
    showNotification('Error al cargar eventos', 'error');
  }
}

// Cambiar vista del calendario
function changeCalendarView(view) {
  STATE.calendarView = view;
  render();
}

// Navegar en el calendario
function navigateCalendar(direction) {
  const currentView = STATE.calendarView;
  const currentDate = STATE.currentDate;
  
  switch(currentView) {
    case 'month':
      if (direction === 'prev') {
        STATE.currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      } else if (direction === 'next') {
        STATE.currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      } else {
        STATE.currentDate = new Date();
      }
      break;
    case 'week':
      const days = direction === 'prev' ? -7 : (direction === 'next' ? 7 : 0);
      STATE.currentDate = new Date(currentDate.getTime() + days * 24 * 60 * 60 * 1000);
      break;
    case 'day':
      const dayDiff = direction === 'prev' ? -1 : (direction === 'next' ? 1 : 0);
      STATE.currentDate = new Date(currentDate.getTime() + dayDiff * 24 * 60 * 60 * 1000);
      break;
  }
  
  if (direction === 'today') {
    STATE.currentDate = new Date();
  }
  
  render();
}

// Renderizar calendario
function renderCalendar() {
  const view = STATE.calendarView;
  
  return renderLayout(`
    <!-- Header del calendario -->
    <div style="margin-bottom: 2rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div>
          <h1 style="font-size: 2rem; font-weight: bold; color: #2D2C3E; margin: 0 0 0.5rem 0;">
            📅 Calendario
          </h1>
          <p style="color: #6B7280; margin: 0;">
            ${getCalendarTitle()}
          </p>
        </div>
        
        <button onclick="showNewEventModal()" style="background: linear-gradient(135deg, #572c83 0%, #08a48d 100%); color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
          ➕ Nuevo Evento
        </button>
      </div>
      
      <!-- Controles de navegación y vista -->
      <div style="background: white; padding: 1rem; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <!-- Navegación -->
          <div style="display: flex; gap: 0.5rem;">
            <button onclick="navigateCalendar('prev')" style="background: #F3F4F6; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; font-weight: 600; color: #374151;">
              ← Anterior
            </button>
            <button onclick="navigateCalendar('today')" style="background: #572c83; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; font-weight: 600;">
              Hoy
            </button>
            <button onclick="navigateCalendar('next')" style="background: #F3F4F6; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; font-weight: 600; color: #374151;">
              Siguiente →
            </button>
          </div>
          
          <!-- Selector de vista -->
          <div style="display: flex; gap: 0.25rem; background: #F3F4F6; padding: 0.25rem; border-radius: 0.5rem;">
            ${renderViewButton('month', '📅 Mes')}
            ${renderViewButton('week', '📆 Semana')}
            ${renderViewButton('day', '📋 Día')}
            ${renderViewButton('list', '📝 Lista')}
          </div>
          
          <!-- Integración Google Calendar -->
          <button onclick="connectGoogleCalendar()" style="background: white; border: 2px solid #E5E7EB; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; font-weight: 600; color: #374151; display: flex; align-items: center; gap: 0.5rem;">
            <img src="https://www.google.com/calendar/images/ext/gc_button1_es.gif" style="height: 20px;" alt="Google Calendar">
            Sincronizar
          </button>
        </div>
      </div>
    </div>
    
    <!-- Contenido del calendario -->
    <div style="background: white; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
      ${renderCalendarView()}
    </div>
  `);
}

function renderViewButton(view, label) {
  const isActive = STATE.calendarView === view;
  return `
    <button 
      onclick="changeCalendarView('${view}')" 
      style="background: ${isActive ? '#572c83' : 'transparent'}; color: ${isActive ? 'white' : '#6B7280'}; border: none; padding: 0.5rem 1rem; border-radius: 0.375rem; cursor: pointer; font-weight: 600; transition: all 0.2s;"
    >
      ${label}
    </button>
  `;
}

function getCalendarTitle() {
  const date = STATE.currentDate;
  const view = STATE.calendarView;
  
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  
  switch(view) {
    case 'month':
      return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    case 'week':
      const weekStart = getWeekStart(date);
      const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      return `${weekStart.getDate()} ${monthNames[weekStart.getMonth()]} - ${weekEnd.getDate()} ${monthNames[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;
    case 'day':
      return `${dayNames[date.getDay()]}, ${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    case 'list':
      return `Todos los eventos`;
    default:
      return '';
  }
}

function renderCalendarView() {
  switch(STATE.calendarView) {
    case 'month':
      return renderMonthView();
    case 'week':
      return renderWeekView();
    case 'day':
      return renderDayView();
    case 'list':
      return renderListView();
    default:
      return '';
  }
}

// ============================================
// VISTA MES
// ============================================

function renderMonthView() {
  const currentDate = STATE.currentDate;
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay()); // Inicio de semana
  
  const weeks = [];
  let currentWeek = [];
  let date = new Date(startDate);
  
  for (let i = 0; i < 42; i++) { // 6 semanas máximo
    currentWeek.push(new Date(date));
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    date.setDate(date.getDate() + 1);
  }
  
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  
  return `
    <div style="padding: 1.5rem;">
      <!-- Encabezados de días -->
      <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; margin-bottom: 1px; background: #E5E7EB; border-radius: 0.5rem; overflow: hidden;">
        ${dayNames.map(day => `
          <div style="background: #F9FAFB; padding: 0.75rem; text-align: center; font-weight: 600; color: #6B7280; font-size: 0.875rem;">
            ${day}
          </div>
        `).join('')}
      </div>
      
      <!-- Grid de días -->
      <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: #E5E7EB; border-radius: 0.5rem; overflow: hidden;">
        ${weeks.map(week => week.map(date => renderMonthDay(date, month)).join('')).join('')}
      </div>
    </div>
  `;
}

function renderMonthDay(date, currentMonth) {
  const isCurrentMonth = date.getMonth() === currentMonth;
  const isToday = isSameDay(date, new Date());
  const dayEvents = getEventsForDay(date);
  
  return `
    <div 
      onclick="selectDay('${date.toISOString()}')"
      style="
        background: ${isCurrentMonth ? 'white' : '#F9FAFB'};
        min-height: 100px;
        padding: 0.5rem;
        cursor: pointer;
        transition: background 0.2s;
        position: relative;
      "
      onmouseover="this.style.background='#F3F4F6'"
      onmouseout="this.style.background='${isCurrentMonth ? 'white' : '#F9FAFB'}'"
    >
      <div style="
        display: inline-block;
        width: 28px;
        height: 28px;
        line-height: 28px;
        text-align: center;
        border-radius: 50%;
        font-weight: ${isToday ? '700' : '500'};
        background: ${isToday ? '#572c83' : 'transparent'};
        color: ${isToday ? 'white' : (isCurrentMonth ? '#2D2C3E' : '#9CA3AF')};
        font-size: 0.875rem;
        margin-bottom: 0.25rem;
      ">
        ${date.getDate()}
      </div>
      
      ${dayEvents.slice(0, 3).map(event => `
        <div 
          onclick="event.stopPropagation(); viewEventDetail(${event.id})"
          style="
            background: ${getEventColor(event.event_type)};
            color: white;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.75rem;
            margin-bottom: 0.25rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-weight: 600;
          "
          title="${event.title}"
        >
          ${getEventIcon(event.event_type)} ${event.title}
        </div>
      `).join('')}
      
      ${dayEvents.length > 3 ? `
        <div style="color: #6B7280; font-size: 0.75rem; font-weight: 600; text-align: center;">
          +${dayEvents.length - 3} más
        </div>
      ` : ''}
    </div>
  `;
}

// ============================================
// VISTA SEMANA
// ============================================

function renderWeekView() {
  const weekStart = getWeekStart(STATE.currentDate);
  const hours = Array.from({length: 24}, (_, i) => i);
  const days = Array.from({length: 7}, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return date;
  });
  
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  
  return `
    <div style="overflow-x: auto;">
      <div style="min-width: 800px;">
        <!-- Encabezados de días -->
        <div style="display: grid; grid-template-columns: 60px repeat(7, 1fr); background: #F9FAFB; border-bottom: 2px solid #E5E7EB; position: sticky; top: 0; z-index: 10;">
          <div style="padding: 1rem;"></div>
          ${days.map((date, i) => {
            const isToday = isSameDay(date, new Date());
            return `
              <div style="padding: 1rem; text-align: center;">
                <div style="font-size: 0.75rem; color: #6B7280; font-weight: 600;">${dayNames[i]}</div>
                <div style="
                  display: inline-block;
                  width: 36px;
                  height: 36px;
                  line-height: 36px;
                  border-radius: 50%;
                  font-weight: 700;
                  background: ${isToday ? '#572c83' : 'transparent'};
                  color: ${isToday ? 'white' : '#2D2C3E'};
                  margin-top: 0.25rem;
                ">
                  ${date.getDate()}
                </div>
              </div>
            `;
          }).join('')}
        </div>
        
        <!-- Grid horario -->
        <div style="position: relative;">
          ${hours.map(hour => `
            <div style="display: grid; grid-template-columns: 60px repeat(7, 1fr); border-bottom: 1px solid #E5E7EB; min-height: 60px;">
              <div style="padding: 0.5rem; text-align: right; font-size: 0.75rem; color: #6B7280; font-weight: 600;">
                ${hour.toString().padStart(2, '0')}:00
              </div>
              ${days.map(date => {
                const cellEvents = getEventsForHour(date, hour);
                return `
                  <div 
                    onclick="createEventAtTime('${date.toISOString()}', ${hour})"
                    style="border-left: 1px solid #E5E7EB; padding: 0.25rem; cursor: pointer; position: relative;"
                    onmouseover="this.style.background='#F9FAFB'"
                    onmouseout="this.style.background='white'"
                  >
                    ${cellEvents.map(event => `
                      <div 
                        onclick="event.stopPropagation(); viewEventDetail(${event.id})"
                        style="
                          background: ${getEventColor(event.event_type)};
                          color: white;
                          padding: 0.25rem 0.5rem;
                          border-radius: 0.25rem;
                          font-size: 0.75rem;
                          margin-bottom: 0.25rem;
                          font-weight: 600;
                          cursor: pointer;
                        "
                        title="${event.title}"
                      >
                        ${getEventIcon(event.event_type)} ${event.title}
                      </div>
                    `).join('')}
                  </div>
                `;
              }).join('')}
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// ============================================
// VISTA DÍA
// ============================================

function renderDayView() {
  const date = STATE.currentDate;
  const hours = Array.from({length: 24}, (_, i) => i);
  
  return `
    <div style="padding: 1.5rem;">
      <div style="display: grid; grid-template-columns: 80px 1fr; gap: 1rem;">
        ${hours.map(hour => {
          const hourEvents = getEventsForHour(date, hour);
          return `
            <div style="text-align: right; padding: 0.5rem; font-size: 0.875rem; color: #6B7280; font-weight: 600;">
              ${hour.toString().padStart(2, '0')}:00
            </div>
            <div 
              onclick="createEventAtTime('${date.toISOString()}', ${hour})"
              style="
                border-left: 3px solid #E5E7EB;
                padding: 0.5rem 1rem;
                min-height: 60px;
                cursor: pointer;
                transition: all 0.2s;
              "
              onmouseover="this.style.borderColor='#572c83'; this.style.background='#F9FAFB'"
              onmouseout="this.style.borderColor='#E5E7EB'; this.style.background='white'"
            >
              ${hourEvents.map(event => `
                <div 
                  onclick="event.stopPropagation(); viewEventDetail(${event.id})"
                  style="
                    background: ${getEventColor(event.event_type)};
                    color: white;
                    padding: 0.75rem;
                    border-radius: 0.5rem;
                    margin-bottom: 0.5rem;
                    cursor: pointer;
                  "
                >
                  <div style="font-weight: 700; margin-bottom: 0.25rem;">
                    ${getEventIcon(event.event_type)} ${event.title}
                  </div>
                  <div style="font-size: 0.875rem; opacity: 0.9;">
                    ${formatEventTime(event)}
                  </div>
                  ${event.location ? `
                    <div style="font-size: 0.875rem; opacity: 0.9; margin-top: 0.25rem;">
                      📍 ${event.location}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// ============================================
// VISTA LISTA
// ============================================

function renderListView() {
  const events = STATE.events || [];
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.start_datetime) - new Date(b.start_datetime)
  );
  
  if (sortedEvents.length === 0) {
    return `
      <div style="text-align: center; padding: 4rem;">
        <div style="font-size: 4rem; margin-bottom: 1rem;">📅</div>
        <h3 style="font-size: 1.5rem; font-weight: 600; color: #374151; margin: 0 0 0.5rem 0;">
          No hay eventos programados
        </h3>
        <p style="color: #6B7280; margin: 0 0 1.5rem 0;">
          Crea tu primer evento para empezar
        </p>
        <button onclick="showNewEventModal()" style="background: linear-gradient(135deg, #572c83 0%, #08a48d 100%); color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600;">
          ➕ Crear Evento
        </button>
      </div>
    `;
  }
  
  // Agrupar por fecha
  const groupedEvents = sortedEvents.reduce((acc, event) => {
    const date = new Date(event.start_datetime).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {});
  
  return `
    <div style="padding: 1.5rem;">
      ${Object.entries(groupedEvents).map(([date, dayEvents]) => `
        <div style="margin-bottom: 2rem;">
          <h3 style="font-size: 1.125rem; font-weight: 700; color: #2D2C3E; margin: 0 0 1rem 0; padding-bottom: 0.5rem; border-bottom: 2px solid #E5E7EB;">
            ${formatDateHeader(new Date(date))}
          </h3>
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${dayEvents.map(event => renderListEvent(event)).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderListEvent(event) {
  return `
    <div 
      onclick="viewEventDetail(${event.id})"
      style="
        background: #F9FAFB;
        padding: 1rem;
        border-radius: 0.5rem;
        border-left: 4px solid ${getEventColor(event.event_type)};
        cursor: pointer;
        transition: all 0.2s;
      "
      onmouseover="this.style.background='#F3F4F6'"
      onmouseout="this.style.background='#F9FAFB'"
    >
      <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem;">
        <div style="flex: 1;">
          <div style="font-weight: 700; color: #2D2C3E; margin-bottom: 0.25rem;">
            ${getEventIcon(event.event_type)} ${event.title}
          </div>
          <div style="color: #6B7280; font-size: 0.875rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
            <span>🕐 ${formatEventTime(event)}</span>
            ${event.location ? `<span>📍 ${event.location}</span>` : ''}
            ${event.client_name ? `<span>👤 ${event.client_name}</span>` : ''}
          </div>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button 
            onclick="event.stopPropagation(); editEvent(${event.id})"
            style="background: white; border: 1px solid #E5E7EB; width: 36px; height: 36px; border-radius: 0.375rem; cursor: pointer; display: flex; align-items: center; justify-content: center;"
          >
            ✏️
          </button>
          <button 
            onclick="event.stopPropagation(); deleteEvent(${event.id})"
            style="background: white; border: 1px solid #E5E7EB; width: 36px; height: 36px; border-radius: 0.375rem; cursor: pointer; display: flex; align-items: center; justify-content: center;"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  `;
}

// ============================================
// UTILIDADES
// ============================================

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

function getEventsForDay(date) {
  return (STATE.events || []).filter(event => {
    const eventDate = new Date(event.start_datetime);
    return isSameDay(eventDate, date);
  });
}

function getEventsForHour(date, hour) {
  return (STATE.events || []).filter(event => {
    const eventDate = new Date(event.start_datetime);
    return isSameDay(eventDate, date) && eventDate.getHours() === hour;
  });
}

function getEventColor(type) {
  const colors = {
    'meeting': '#572c83',
    'deadline': '#EF4444',
    'reminder': '#F59E0B',
    'call': '#3B82F6'
  };
  return colors[type] || '#6B7280';
}

function getEventIcon(type) {
  const icons = {
    'meeting': '🤝',
    'deadline': '⏰',
    'reminder': '🔔',
    'call': '📞'
  };
  return icons[type] || '📅';
}

function formatEventTime(event) {
  const start = new Date(event.start_datetime);
  const end = event.end_datetime ? new Date(event.end_datetime) : null;
  
  const timeStr = start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  if (end) {
    const endStr = end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    return `${timeStr} - ${endStr}`;
  }
  return timeStr;
}

function formatDateHeader(date) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (isSameDay(date, today)) {
    return '📅 Hoy';
  } else if (isSameDay(date, tomorrow)) {
    return '📅 Mañana';
  } else {
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${dayNames[date.getDay()]}, ${date.getDate()} de ${monthNames[date.getMonth()]}`;
  }
}

function selectDay(dateString) {
  STATE.currentDate = new Date(dateString);
  STATE.calendarView = 'day';
  render();
}

function createEventAtTime(dateString, hour) {
  const date = new Date(dateString);
  date.setHours(hour, 0, 0, 0);
  
  // Guardar fecha/hora preseleccionada
  STATE.preSelectedEventDate = date;
  showNewEventModal();
}

function viewEventDetail(id) {
  // TODO: Implementar vista detalle de evento
  showNotification('Vista detalle de evento - Próximamente', 'info');
}

function connectGoogleCalendar() {
  showNotification('Integración con Google Calendar - Próximamente', 'info');
}

console.log('✅ Sistema de calendario cargado');
