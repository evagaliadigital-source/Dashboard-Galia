// Galia Digital - Módulo de Leads COMPLETO
console.log('📊 Módulo de Leads cargando...');

// State para leads
if (typeof STATE !== 'undefined') {
  STATE.leads = [];
  STATE.leadMetrics = null;
  STATE.leadFilters = {
    quality: 'all',
    stage: 'all',
    search: ''
  };
  STATE.leadViewMode = 'kanban'; // 'kanban' or 'list'
  STATE.selectedLeads = new Set();
}

// ============================================
// LOAD LEADS
// ============================================
async function loadLeads() {
  try {
    const { leads } = await apiCall('/leads');
    STATE.leads = leads || [];
    
    // Load metrics
    const metrics = await apiCall('/leads/metrics/pipeline');
    STATE.leadMetrics = metrics;
    
    render();
  } catch (error) {
    console.error('Error loading leads:', error);
    showNotification('Error al cargar leads', 'error');
  }
}

// ============================================
// FILTERS
// ============================================
function getFilteredLeads() {
  let filtered = STATE.leads || [];
  
  // Filter by quality
  if (STATE.leadFilters.quality !== 'all') {
    filtered = filtered.filter(l => l.lead_quality === STATE.leadFilters.quality);
  }
  
  // Filter by stage
  if (STATE.leadFilters.stage !== 'all') {
    filtered = filtered.filter(l => l.stage === STATE.leadFilters.stage);
  }
  
  // Search filter
  if (STATE.leadFilters.search) {
    const search = STATE.leadFilters.search.toLowerCase();
    filtered = filtered.filter(l => 
      l.business_name?.toLowerCase().includes(search) ||
      l.contact_name?.toLowerCase().includes(search) ||
      l.email?.toLowerCase().includes(search) ||
      l.phone?.includes(search)
    );
  }
  
  return filtered;
}

// ============================================
// RENDER LEADS
// ============================================
function renderLeads() {
  const filteredLeads = getFilteredLeads();
  
  return renderLayout(`
    <div style="margin-bottom: 2rem;">
      ${renderLeadsHeader()}
      ${renderLeadsMetrics(filteredLeads)}
      ${renderLeadsFilters()}
    </div>
    
    ${STATE.leadViewMode === 'kanban' ? renderKanbanView(filteredLeads) : renderListView(filteredLeads)}
    
    <!-- Bulk Actions Bar -->
    ${STATE.selectedLeads.size > 0 ? renderBulkActionsBar() : ''}
  `);
}

function renderLeadsHeader() {
  return `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <div>
        <h1 style="font-size: 2rem; font-weight: bold; color: #2D2C3E; margin: 0 0 0.5rem 0;">🎯 Pipeline de Leads</h1>
        <p style="color: #6B7280; margin: 0;">Gestiona tu embudo de prospectos</p>
      </div>
      <div style="display: flex; gap: 1rem;">
        <button onclick="toggleLeadViewMode()" style="background: white; border: 2px solid #572c83; color: #572c83; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: 600;">
          ${STATE.leadViewMode === 'kanban' ? '📋 Vista Lista' : '📊 Vista Kanban'}
        </button>
        <button onclick="showNewLeadModal()" style="background: linear-gradient(135deg, #572c83 0%, #08a48d 100%); color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600;">
          ➕ Nuevo Lead
        </button>
      </div>
    </div>
  `;
}

function renderLeadsMetrics(leads) {
  const activeLeads = leads.filter(l => l.stage !== 'won' && l.stage !== 'lost');
  const totalValue = activeLeads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);
  const wonLeads = leads.filter(l => l.stage === 'won');
  const conversionRate = STATE.leadMetrics?.conversionRate || 0;
  
  return `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
      <div style="background: white; padding: 1.5rem; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="font-size: 0.875rem; color: #6B7280; margin-bottom: 0.5rem;">Leads Activos</div>
        <div style="font-size: 2rem; font-weight: 700; color: #572c83;">${activeLeads.length}</div>
      </div>
      
      <div style="background: white; padding: 1.5rem; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="font-size: 0.875rem; color: #6B7280; margin-bottom: 0.5rem;">Valor Total Pipeline</div>
        <div style="font-size: 2rem; font-weight: 700; color: #08a48d;">${Math.round(totalValue).toLocaleString()}€</div>
      </div>
      
      <div style="background: white; padding: 1.5rem; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="font-size: 0.875rem; color: #6B7280; margin-bottom: 0.5rem;">Ganados</div>
        <div style="font-size: 2rem; font-weight: 700; color: #10B981;">${wonLeads.length}</div>
      </div>
      
      <div style="background: white; padding: 1.5rem; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="font-size: 0.875rem; color: #6B7280; margin-bottom: 0.5rem;">Tasa Conversión</div>
        <div style="font-size: 2rem; font-weight: 700; color: #572c83;">${conversionRate}%</div>
      </div>
    </div>
  `;
}

function renderLeadsFilters() {
  return `
    <div style="background: white; padding: 1rem; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 1.5rem;">
      <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
        <!-- Search -->
        <input type="text" 
               placeholder="🔍 Buscar leads..."
               value="${STATE.leadFilters.search}"
               oninput="updateLeadFilter('search', this.value)"
               style="flex: 1; min-width: 200px; padding: 0.5rem 1rem; border: 1px solid #E5E7EB; border-radius: 0.5rem;">
        
        <!-- Quality Filter -->
        <select onchange="updateLeadFilter('quality', this.value)" 
                style="padding: 0.5rem 1rem; border: 1px solid #E5E7EB; border-radius: 0.5rem;">
          <option value="all" ${STATE.leadFilters.quality === 'all' ? 'selected' : ''}>Todas las calidades</option>
          <option value="hot" ${STATE.leadFilters.quality === 'hot' ? 'selected' : ''}>🔴 HOT</option>
          <option value="warm" ${STATE.leadFilters.quality === 'warm' ? 'selected' : ''}>🟠 WARM</option>
          <option value="cold" ${STATE.leadFilters.quality === 'cold' ? 'selected' : ''}>🟡 COLD</option>
          <option value="qualified" ${STATE.leadFilters.quality === 'qualified' ? 'selected' : ''}>⭐ QUALIFIED</option>
        </select>
        
        <!-- Stage Filter -->
        <select onchange="updateLeadFilter('stage', this.value)"
                style="padding: 0.5rem 1rem; border: 1px solid #E5E7EB; border-radius: 0.5rem;">
          <option value="all" ${STATE.leadFilters.stage === 'all' ? 'selected' : ''}>Todas las etapas</option>
          <option value="new_lead" ${STATE.leadFilters.stage === 'new_lead' ? 'selected' : ''}>📥 Nuevos</option>
          <option value="contacted" ${STATE.leadFilters.stage === 'contacted' ? 'selected' : ''}>📞 Contactados</option>
          <option value="qualified" ${STATE.leadFilters.stage === 'qualified' ? 'selected' : ''}>🎯 Calificados</option>
          <option value="negotiation" ${STATE.leadFilters.stage === 'negotiation' ? 'selected' : ''}>💬 Negociación</option>
          <option value="proposal" ${STATE.leadFilters.stage === 'proposal' ? 'selected' : ''}>📝 Propuesta</option>
          <option value="won" ${STATE.leadFilters.stage === 'won' ? 'selected' : ''}>✅ Ganados</option>
          <option value="lost" ${STATE.leadFilters.stage === 'lost' ? 'selected' : ''}>❌ Perdidos</option>
        </select>
        
        <!-- Clear Filters -->
        ${STATE.leadFilters.quality !== 'all' || STATE.leadFilters.stage !== 'all' || STATE.leadFilters.search ? `
          <button onclick="clearLeadFilters()" style="padding: 0.5rem 1rem; background: #EF4444; color: white; border: none; border-radius: 0.5rem; cursor: pointer;">
            🗑️ Limpiar
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

// ============================================
// KANBAN VIEW
// ============================================
function renderKanbanView(leads) {
  const byStage = {
    new_lead: leads.filter(l => l.stage === 'new_lead'),
    contacted: leads.filter(l => l.stage === 'contacted'),
    qualified: leads.filter(l => l.stage === 'qualified'),
    negotiation: leads.filter(l => l.stage === 'negotiation'),
    proposal: leads.filter(l => l.stage === 'proposal'),
    won: leads.filter(l => l.stage === 'won'),
    lost: leads.filter(l => l.stage === 'lost')
  };
  
  return `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; overflow-x: auto; padding-bottom: 1rem;">
      ${renderKanbanColumn('new_lead', '📥 Nuevos', byStage.new_lead, '#3B82F6')}
      ${renderKanbanColumn('contacted', '📞 Contactados', byStage.contacted, '#8B5CF6')}
      ${renderKanbanColumn('qualified', '🎯 Calificados', byStage.qualified, '#F59E0B')}
      ${renderKanbanColumn('negotiation', '💬 Negociación', byStage.negotiation, '#572c83')}
      ${renderKanbanColumn('proposal', '📝 Propuesta', byStage.proposal, '#08a48d')}
      ${renderKanbanColumn('won', '✅ Ganados', byStage.won, '#10B981')}
      ${renderKanbanColumn('lost', '❌ Perdidos', byStage.lost, '#EF4444')}
    </div>
  `;
}

function renderKanbanColumn(stage, title, leads, color) {
  const totalValue = leads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);
  
  return `
    <div style="background: #F8F7FA; border-radius: 0.75rem; padding: 1rem; min-height: 400px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 3px solid ${color};">
        <div>
          <h3 style="font-size: 0.875rem; font-weight: 700; color: #2D2C3E; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">${title}</h3>
          <p style="font-size: 0.75rem; color: #6B7280; margin: 0.25rem 0 0 0;">${leads.length} leads · ${Math.round(totalValue).toLocaleString()}€</p>
        </div>
        <div style="background: ${color}; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem;">
          ${leads.length}
        </div>
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        ${leads.map(lead => renderLeadCard(lead, stage)).join('')}
      </div>
    </div>
  `;
}

function renderLeadCard(lead, currentStage) {
  const qualityColors = {
    hot: '🔴',
    warm: '🟠',
    cold: '🟡',
    qualified: '⭐'
  };
  
  const qualityIcon = qualityColors[lead.lead_quality] || '⚪';
  const isSelected = STATE.selectedLeads.has(lead.id);
  
  return `
    <div style="background: white; padding: 1rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); cursor: pointer; transition: all 0.2s; border-left: 3px solid ${getLeadQualityColor(lead.lead_quality)}; ${isSelected ? 'border: 2px solid #572c83;' : ''}"
         onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 6px rgba(0,0,0,0.1)'"
         onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.1)'">
      
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
        <div onclick="viewLeadDetail(${lead.id})" style="flex: 1;">
          <h4 style="font-size: 0.875rem; font-weight: 600; color: #2D2C3E; margin: 0;">${qualityIcon} ${lead.business_name}</h4>
          <p style="font-size: 0.75rem; color: #6B7280; margin: 0.25rem 0 0 0;">${lead.contact_name}</p>
        </div>
        <input type="checkbox" 
               ${isSelected ? 'checked' : ''}
               onclick="toggleLeadSelection(${lead.id})"
               style="cursor: pointer; width: 18px; height: 18px;">
      </div>
      
      ${lead.estimated_value > 0 ? `
        <div style="font-size: 0.875rem; font-weight: 700; color: #08a48d; margin: 0.5rem 0;">
          ${Math.round(lead.estimated_value).toLocaleString()}€ · ${lead.probability}%
        </div>
      ` : ''}
      
      ${lead.notes ? `
        <p style="font-size: 0.75rem; color: #6B7280; margin: 0.5rem 0 0 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
          ${lead.notes}
        </p>
      ` : ''}
      
      ${lead.next_followup_date ? `
        <div style="font-size: 0.7rem; color: #F59E0B; margin-top: 0.5rem;">
          📅 Seguimiento: ${formatDate(lead.next_followup_date)}
        </div>
      ` : ''}
      
      <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;" onclick="event.stopPropagation();">
        ${currentStage !== 'won' && currentStage !== 'lost' ? `
          <button onclick="moveLeadToNextStage(${lead.id}, '${currentStage}')" 
                  style="flex: 1; padding: 0.5rem; font-size: 0.75rem; background: #572c83; color: white; border: none; border-radius: 0.25rem; cursor: pointer;">
            ➡️ Avanzar
          </button>
        ` : ''}
        ${(currentStage === 'qualified' || currentStage === 'negotiation' || currentStage === 'proposal') ? `
          <button onclick="showConvertLeadModal(${lead.id})" 
                  style="flex: 1; padding: 0.5rem; font-size: 0.75rem; background: #08a48d; color: white; border: none; border-radius: 0.25rem; cursor: pointer;">
            ✅ Convertir
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

// ============================================
// LIST VIEW
// ============================================
function renderListView(leads) {
  return `
    <div style="background: white; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead style="background: #F8F7FA; border-bottom: 2px solid #E5E7EB;">
          <tr>
            <th style="padding: 1rem; text-align: left;">
              <input type="checkbox" 
                     ${STATE.selectedLeads.size === leads.length && leads.length > 0 ? 'checked' : ''}
                     onclick="toggleAllLeads(${leads.length > 0})"
                     style="cursor: pointer; width: 18px; height: 18px;">
            </th>
            <th style="padding: 1rem; text-align: left; font-weight: 600; color: #2D2C3E;">Negocio</th>
            <th style="padding: 1rem; text-align: left; font-weight: 600; color: #2D2C3E;">Contacto</th>
            <th style="padding: 1rem; text-align: left; font-weight: 600; color: #2D2C3E;">Calidad</th>
            <th style="padding: 1rem; text-align: left; font-weight: 600; color: #2D2C3E;">Etapa</th>
            <th style="padding: 1rem; text-align: left; font-weight: 600; color: #2D2C3E;">Valor</th>
            <th style="padding: 1rem; text-align: left; font-weight: 600; color: #2D2C3E;">Prob.</th>
            <th style="padding: 1rem; text-align: left; font-weight: 600; color: #2D2C3E;">Seguimiento</th>
            <th style="padding: 1rem; text-align: center; font-weight: 600; color: #2D2C3E;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${leads.length === 0 ? `
            <tr>
              <td colspan="9" style="padding: 2rem; text-align: center; color: #6B7280;">
                No hay leads para mostrar
              </td>
            </tr>
          ` : leads.map(lead => renderLeadRow(lead)).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderLeadRow(lead) {
  const qualityColors = {
    hot: '🔴',
    warm: '🟠',
    cold: '🟡',
    qualified: '⭐'
  };
  
  const stageLabels = {
    new_lead: '📥 Nuevo',
    contacted: '📞 Contactado',
    qualified: '🎯 Calificado',
    negotiation: '💬 Negociación',
    proposal: '📝 Propuesta',
    won: '✅ Ganado',
    lost: '❌ Perdido'
  };
  
  const isSelected = STATE.selectedLeads.has(lead.id);
  
  return `
    <tr style="border-bottom: 1px solid #E5E7EB; ${isSelected ? 'background: #F3F4F6;' : ''}"
        onmouseover="this.style.background='#F9FAFB'"
        onmouseout="this.style.background='${isSelected ? '#F3F4F6' : 'white'}'">
      <td style="padding: 1rem;">
        <input type="checkbox" 
               ${isSelected ? 'checked' : ''}
               onclick="toggleLeadSelection(${lead.id})"
               style="cursor: pointer; width: 18px; height: 18px;">
      </td>
      <td style="padding: 1rem;">
        <div onclick="viewLeadDetail(${lead.id})" style="cursor: pointer; font-weight: 600; color: #2D2C3E;">
          ${lead.business_name}
        </div>
        ${lead.city ? `<div style="font-size: 0.75rem; color: #6B7280;">${lead.city}</div>` : ''}
      </td>
      <td style="padding: 1rem;">
        <div style="color: #2D2C3E;">${lead.contact_name}</div>
        ${lead.email ? `<div style="font-size: 0.75rem; color: #6B7280;">${lead.email}</div>` : ''}
      </td>
      <td style="padding: 1rem;">
        <span style="font-size: 1.25rem;">${qualityColors[lead.lead_quality] || '⚪'}</span>
      </td>
      <td style="padding: 1rem;">
        <span style="font-size: 0.875rem; color: #2D2C3E;">${stageLabels[lead.stage] || lead.stage}</span>
      </td>
      <td style="padding: 1rem; font-weight: 600; color: #08a48d;">
        ${lead.estimated_value > 0 ? Math.round(lead.estimated_value).toLocaleString() + '€' : '-'}
      </td>
      <td style="padding: 1rem; color: #6B7280;">
        ${lead.probability}%
      </td>
      <td style="padding: 1rem; font-size: 0.875rem; color: #6B7280;">
        ${lead.next_followup_date ? formatDate(lead.next_followup_date) : '-'}
      </td>
      <td style="padding: 1rem;">
        <div style="display: flex; gap: 0.5rem; justify-content: center;">
          <button onclick="viewLeadDetail(${lead.id})" 
                  style="padding: 0.25rem 0.5rem; font-size: 0.75rem; background: #572c83; color: white; border: none; border-radius: 0.25rem; cursor: pointer;"
                  title="Ver detalle">
            👁️
          </button>
          ${lead.stage !== 'won' && lead.stage !== 'lost' ? `
            <button onclick="moveLeadToNextStage(${lead.id}, '${lead.stage}')" 
                    style="padding: 0.25rem 0.5rem; font-size: 0.75rem; background: #08a48d; color: white; border: none; border-radius: 0.25rem; cursor: pointer;"
                    title="Avanzar etapa">
              ➡️
            </button>
          ` : ''}
          ${(lead.stage === 'qualified' || lead.stage === 'negotiation' || lead.stage === 'proposal') ? `
            <button onclick="showConvertLeadModal(${lead.id})" 
                    style="padding: 0.25rem 0.5rem; font-size: 0.75rem; background: #10B981; color: white; border: none; border-radius: 0.25rem; cursor: pointer;"
                    title="Convertir a cliente">
              ✅
            </button>
          ` : ''}
        </div>
      </td>
    </tr>
  `;
}

// ============================================
// BULK ACTIONS
// ============================================
function renderBulkActionsBar() {
  return `
    <div style="position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #572c83 0%, #08a48d 100%); color: white; padding: 1rem 2rem; border-radius: 0.75rem; box-shadow: 0 4px 12px rgba(0,0,0,0.2); display: flex; gap: 1rem; align-items: center; z-index: 1000;">
      <span style="font-weight: 600;">${STATE.selectedLeads.size} leads seleccionados</span>
      
      <button onclick="bulkMoveLeads()" style="background: white; color: #572c83; padding: 0.5rem 1rem; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600;">
        📦 Mover Etapa
      </button>
      
      <button onclick="bulkDeleteLeads()" style="background: #EF4444; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600;">
        🗑️ Eliminar
      </button>
      
      <button onclick="clearSelection()" style="background: transparent; border: 2px solid white; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; font-weight: 600;">
        ✖️ Cancelar
      </button>
    </div>
  `;
}

async function bulkMoveLeads() {
  const stage = prompt('Etapa de destino:\n\nnew_lead | contacted | qualified | negotiation | proposal | won | lost');
  if (!stage) return;
  
  const validStages = ['new_lead', 'contacted', 'qualified', 'negotiation', 'proposal', 'won', 'lost'];
  if (!validStages.includes(stage)) {
    showNotification('Etapa no válida', 'error');
    return;
  }
  
  try {
    const promises = Array.from(STATE.selectedLeads).map(id => 
      apiCall(`/leads/${id}/stage`, {
        method: 'PATCH',
        body: JSON.stringify({ stage })
      })
    );
    
    await Promise.all(promises);
    showNotification(`${STATE.selectedLeads.size} leads movidos correctamente`, 'success');
    clearSelection();
    await loadLeads();
  } catch (error) {
    console.error('Error moving leads:', error);
    showNotification('Error al mover leads', 'error');
  }
}

async function bulkDeleteLeads() {
  if (!confirm(`¿Eliminar ${STATE.selectedLeads.size} leads seleccionados?`)) return;
  
  try {
    const promises = Array.from(STATE.selectedLeads).map(id => 
      apiCall(`/leads/${id}`, { method: 'DELETE' })
    );
    
    await Promise.all(promises);
    showNotification(`${STATE.selectedLeads.size} leads eliminados`, 'success');
    clearSelection();
    await loadLeads();
  } catch (error) {
    console.error('Error deleting leads:', error);
    showNotification('Error al eliminar leads', 'error');
  }
}

function toggleLeadSelection(leadId) {
  if (STATE.selectedLeads.has(leadId)) {
    STATE.selectedLeads.delete(leadId);
  } else {
    STATE.selectedLeads.add(leadId);
  }
  render();
}

function toggleAllLeads(select) {
  if (select && STATE.selectedLeads.size < getFilteredLeads().length) {
    getFilteredLeads().forEach(lead => STATE.selectedLeads.add(lead.id));
  } else {
    STATE.selectedLeads.clear();
  }
  render();
}

function clearSelection() {
  STATE.selectedLeads.clear();
  render();
}

// ============================================
// LEAD DETAIL MODAL
// ============================================
async function viewLeadDetail(leadId) {
  try {
    const { lead } = await apiCall(`/leads/${leadId}`);
    if (!lead) {
      showNotification('Lead no encontrado', 'error');
      return;
    }
    
    showModal(renderLeadDetailModal(lead));
  } catch (error) {
    console.error('Error loading lead detail:', error);
    showNotification('Error al cargar lead', 'error');
  }
}

function renderLeadDetailModal(lead) {
  const qualityColors = {
    hot: '🔴 HOT',
    warm: '🟠 WARM',
    cold: '🟡 COLD',
    qualified: '⭐ QUALIFIED'
  };
  
  const stageLabels = {
    new_lead: '📥 Nuevo',
    contacted: '📞 Contactado',
    qualified: '🎯 Calificado',
    negotiation: '💬 Negociación',
    proposal: '📝 Propuesta',
    won: '✅ Ganado',
    lost: '❌ Perdido'
  };
  
  return `
    <div style="max-width: 900px; max-height: 80vh; overflow-y: auto;">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 2rem;">
        <div>
          <h2 style="font-size: 1.75rem; font-weight: 700; color: #2D2C3E; margin: 0 0 0.5rem 0;">
            ${lead.business_name}
          </h2>
          <div style="display: flex; gap: 1rem; align-items: center;">
            <span style="font-size: 1rem; padding: 0.25rem 0.75rem; background: ${getLeadQualityColor(lead.lead_quality)}; color: white; border-radius: 0.25rem;">
              ${qualityColors[lead.lead_quality]}
            </span>
            <span style="font-size: 1rem; padding: 0.25rem 0.75rem; background: #F3F4F6; color: #2D2C3E; border-radius: 0.25rem;">
              ${stageLabels[lead.stage]}
            </span>
          </div>
        </div>
        <button onclick="closeModal(); showEditLeadModal(${lead.id})" 
                style="background: #572c83; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600;">
          ✏️ Editar
        </button>
      </div>
      
      <!-- Grid de Información -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem; margin-bottom: 2rem;">
        <!-- Información de Contacto -->
        <div>
          <h3 style="font-size: 1rem; font-weight: 600; color: #2D2C3E; margin: 0 0 1rem 0; border-bottom: 2px solid #572c83; padding-bottom: 0.5rem;">
            📇 Información de Contacto
          </h3>
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div>
              <div style="font-size: 0.75rem; color: #6B7280; margin-bottom: 0.25rem;">Contacto</div>
              <div style="font-weight: 600; color: #2D2C3E;">${lead.contact_name}</div>
            </div>
            ${lead.email ? `
              <div>
                <div style="font-size: 0.75rem; color: #6B7280; margin-bottom: 0.25rem;">Email</div>
                <div style="color: #2D2C3E;">
                  <a href="mailto:${lead.email}" style="color: #572c83; text-decoration: none;">${lead.email}</a>
                </div>
              </div>
            ` : ''}
            ${lead.phone ? `
              <div>
                <div style="font-size: 0.75rem; color: #6B7280; margin-bottom: 0.25rem;">Teléfono</div>
                <div style="color: #2D2C3E;">
                  <a href="tel:${lead.phone}" style="color: #572c83; text-decoration: none;">${lead.phone}</a>
                </div>
              </div>
            ` : ''}
            ${lead.address ? `
              <div>
                <div style="font-size: 0.75rem; color: #6B7280; margin-bottom: 0.25rem;">Dirección</div>
                <div style="color: #2D2C3E;">${lead.address}</div>
              </div>
            ` : ''}
            ${lead.city ? `
              <div>
                <div style="font-size: 0.75rem; color: #6B7280; margin-bottom: 0.25rem;">Ciudad</div>
                <div style="color: #2D2C3E;">${lead.city}</div>
              </div>
            ` : ''}
          </div>
        </div>
        
        <!-- Información del Negocio -->
        <div>
          <h3 style="font-size: 1rem; font-weight: 600; color: #2D2C3E; margin: 0 0 1rem 0; border-bottom: 2px solid #08a48d; padding-bottom: 0.5rem;">
            💼 Información del Negocio
          </h3>
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${lead.website ? `
              <div>
                <div style="font-size: 0.75rem; color: #6B7280; margin-bottom: 0.25rem;">Website</div>
                <div style="color: #2D2C3E;">
                  <a href="${lead.website}" target="_blank" style="color: #08a48d; text-decoration: none;">${lead.website}</a>
                </div>
              </div>
            ` : ''}
            ${lead.instagram ? `
              <div>
                <div style="font-size: 0.75rem; color: #6B7280; margin-bottom: 0.25rem;">Instagram</div>
                <div style="color: #2D2C3E;">
                  <a href="https://instagram.com/${lead.instagram.replace('@', '')}" target="_blank" style="color: #08a48d; text-decoration: none;">${lead.instagram}</a>
                </div>
              </div>
            ` : ''}
            ${lead.collective ? `
              <div>
                <div style="font-size: 0.75rem; color: #6B7280; margin-bottom: 0.25rem;">Colectivo</div>
                <div style="color: #2D2C3E;">${lead.collective}</div>
              </div>
            ` : ''}
            ${lead.lead_source ? `
              <div>
                <div style="font-size: 0.75rem; color: #6B7280; margin-bottom: 0.25rem;">Fuente del Lead</div>
                <div style="color: #2D2C3E;">${lead.lead_source}</div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
      
      <!-- Datos Financieros -->
      <div style="background: linear-gradient(135deg, #572c83 0%, #08a48d 100%); padding: 1.5rem; border-radius: 0.75rem; margin-bottom: 2rem;">
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem;">
          <div>
            <div style="font-size: 0.875rem; color: rgba(255,255,255,0.8); margin-bottom: 0.5rem;">Valor Estimado</div>
            <div style="font-size: 2rem; font-weight: 700; color: white;">${lead.estimated_value ? Math.round(lead.estimated_value).toLocaleString() + '€' : '-'}</div>
          </div>
          <div>
            <div style="font-size: 0.875rem; color: rgba(255,255,255,0.8); margin-bottom: 0.5rem;">Probabilidad</div>
            <div style="font-size: 2rem; font-weight: 700; color: white;">${lead.probability}%</div>
          </div>
          <div>
            <div style="font-size: 0.875rem; color: rgba(255,255,255,0.8); margin-bottom: 0.5rem;">Valor Ponderado</div>
            <div style="font-size: 2rem; font-weight: 700; color: white;">
              ${lead.estimated_value ? Math.round((lead.estimated_value * lead.probability) / 100).toLocaleString() + '€' : '-'}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Fechas -->
      <div style="background: #F8F7FA; padding: 1.5rem; border-radius: 0.75rem; margin-bottom: 2rem;">
        <h3 style="font-size: 1rem; font-weight: 600; color: #2D2C3E; margin: 0 0 1rem 0;">📅 Timeline</h3>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
          ${lead.first_contact_date ? `
            <div>
              <div style="font-size: 0.75rem; color: #6B7280; margin-bottom: 0.25rem;">Primer Contacto</div>
              <div style="font-weight: 600; color: #2D2C3E;">${formatDate(lead.first_contact_date)}</div>
            </div>
          ` : ''}
          ${lead.last_contact_date ? `
            <div>
              <div style="font-size: 0.75rem; color: #6B7280; margin-bottom: 0.25rem;">Último Contacto</div>
              <div style="font-weight: 600; color: #2D2C3E;">${formatDate(lead.last_contact_date)}</div>
            </div>
          ` : ''}
          ${lead.next_followup_date ? `
            <div>
              <div style="font-size: 0.75rem; color: #6B7280; margin-bottom: 0.25rem;">Próximo Seguimiento</div>
              <div style="font-weight: 600; color: #F59E0B;">${formatDate(lead.next_followup_date)}</div>
            </div>
          ` : ''}
          ${lead.expected_close_date ? `
            <div>
              <div style="font-size: 0.75rem; color: #6B7280; margin-bottom: 0.25rem;">Cierre Esperado</div>
              <div style="font-weight: 600; color: #08a48d;">${formatDate(lead.expected_close_date)}</div>
            </div>
          ` : ''}
        </div>
      </div>
      
      <!-- Notas -->
      ${lead.notes ? `
        <div style="margin-bottom: 2rem;">
          <h3 style="font-size: 1rem; font-weight: 600; color: #2D2C3E; margin: 0 0 1rem 0;">📝 Notas</h3>
          <div style="background: #F8F7FA; padding: 1.5rem; border-radius: 0.75rem; color: #2D2C3E; white-space: pre-wrap;">
            ${lead.notes}
          </div>
        </div>
      ` : ''}
      
      <!-- Acciones -->
      <div style="display: flex; gap: 1rem; justify-content: flex-end; border-top: 2px solid #E5E7EB; padding-top: 1.5rem;">
        ${lead.stage !== 'won' && lead.stage !== 'lost' ? `
          <button onclick="closeModal(); moveLeadToNextStage(${lead.id}, '${lead.stage}')" 
                  style="background: #572c83; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600;">
            ➡️ Avanzar Etapa
          </button>
        ` : ''}
        ${(lead.stage === 'qualified' || lead.stage === 'negotiation' || lead.stage === 'proposal') ? `
          <button onclick="closeModal(); showConvertLeadModal(${lead.id})" 
                  style="background: linear-gradient(135deg, #08a48d 0%, #10B981 100%); color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600;">
            ✅ Convertir a Cliente
          </button>
        ` : ''}
        <button onclick="closeModal()" 
                style="background: #E5E7EB; color: #2D2C3E; padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600;">
          Cerrar
        </button>
      </div>
    </div>
  `;
}

// ============================================
// CREATE/EDIT LEAD MODAL
// ============================================
function showNewLeadModal() {
  showModal(renderLeadFormModal(null));
}

async function showEditLeadModal(leadId) {
  try {
    const { lead } = await apiCall(`/leads/${leadId}`);
    showModal(renderLeadFormModal(lead));
  } catch (error) {
    console.error('Error loading lead:', error);
    showNotification('Error al cargar lead', 'error');
  }
}

function renderLeadFormModal(lead) {
  const isEdit = lead !== null;
  
  return `
    <div style="max-width: 800px; max-height: 80vh; overflow-y: auto;">
      <h2 style="font-size: 1.75rem; font-weight: 700; color: #2D2C3E; margin: 0 0 2rem 0;">
        ${isEdit ? '✏️ Editar Lead' : '➕ Nuevo Lead'}
      </h2>
      
      <form id="leadForm" onsubmit="saveLead(event, ${isEdit ? lead.id : null})">
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;">
          
          <!-- Nombre del Negocio -->
          <div style="grid-column: span 2;">
            <label style="display: block; font-weight: 600; color: #2D2C3E; margin-bottom: 0.5rem;">
              Nombre del Negocio *
            </label>
            <input type="text" name="business_name" required
                   value="${isEdit ? lead.business_name : ''}"
                   style="width: 100%; padding: 0.75rem; border: 1px solid #E5E7EB; border-radius: 0.5rem; font-size: 1rem;">
          </div>
          
          <!-- Nombre de Contacto -->
          <div>
            <label style="display: block; font-weight: 600; color: #2D2C3E; margin-bottom: 0.5rem;">
              Nombre de Contacto *
            </label>
            <input type="text" name="contact_name" required
                   value="${isEdit ? lead.contact_name : ''}"
                   style="width: 100%; padding: 0.75rem; border: 1px solid #E5E7EB; border-radius: 0.5rem;">
          </div>
          
          <!-- Email -->
          <div>
            <label style="display: block; font-weight: 600; color: #2D2C3E; margin-bottom: 0.5rem;">
              Email
            </label>
            <input type="email" name="email"
                   value="${isEdit && lead.email ? lead.email : ''}"
                   style="width: 100%; padding: 0.75rem; border: 1px solid #E5E7EB; border-radius: 0.5rem;">
          </div>
          
          <!-- Teléfono -->
          <div>
            <label style="display: block; font-weight: 600; color: #2D2C3E; margin-bottom: 0.5rem;">
              Teléfono
            </label>
            <input type="tel" name="phone"
                   value="${isEdit && lead.phone ? lead.phone : ''}"
                   style="width: 100%; padding: 0.75rem; border: 1px solid #E5E7EB; border-radius: 0.5rem;">
          </div>
          
          <!-- Ciudad -->
          <div>
            <label style="display: block; font-weight: 600; color: #2D2C3E; margin-bottom: 0.5rem;">
              Ciudad
            </label>
            <input type="text" name="city"
                   value="${isEdit && lead.city ? lead.city : ''}"
                   style="width: 100%; padding: 0.75rem; border: 1px solid #E5E7EB; border-radius: 0.5rem;">
          </div>
          
          <!-- Dirección -->
          <div style="grid-column: span 2;">
            <label style="display: block; font-weight: 600; color: #2D2C3E; margin-bottom: 0.5rem;">
              Dirección
            </label>
            <input type="text" name="address"
                   value="${isEdit && lead.address ? lead.address : ''}"
                   style="width: 100%; padding: 0.75rem; border: 1px solid #E5E7EB; border-radius: 0.5rem;">
          </div>
          
          <!-- Website -->
          <div>
            <label style="display: block; font-weight: 600; color: #2D2C3E; margin-bottom: 0.5rem;">
              Website
            </label>
            <input type="url" name="website"
                   value="${isEdit && lead.website ? lead.website : ''}"
                   placeholder="https://"
                   style="width: 100%; padding: 0.75rem; border: 1px solid #E5E7EB; border-radius: 0.5rem;">
          </div>
          
          <!-- Instagram -->
          <div>
            <label style="display: block; font-weight: 600; color: #2D2C3E; margin-bottom: 0.5rem;">
              Instagram
            </label>
            <input type="text" name="instagram"
                   value="${isEdit && lead.instagram ? lead.instagram : ''}"
                   placeholder="@usuario"
                   style="width: 100%; padding: 0.75rem; border: 1px solid #E5E7EB; border-radius: 0.5rem;">
          </div>
          
          <!-- Etapa -->
          <div>
            <label style="display: block; font-weight: 600; color: #2D2C3E; margin-bottom: 0.5rem;">
              Etapa del Pipeline
            </label>
            <select name="stage" style="width: 100%; padding: 0.75rem; border: 1px solid #E5E7EB; border-radius: 0.5rem;">
              <option value="new_lead" ${!isEdit || lead.stage === 'new_lead' ? 'selected' : ''}>📥 Nuevo</option>
              <option value="contacted" ${isEdit && lead.stage === 'contacted' ? 'selected' : ''}>📞 Contactado</option>
              <option value="qualified" ${isEdit && lead.stage === 'qualified' ? 'selected' : ''}>🎯 Calificado</option>
              <option value="negotiation" ${isEdit && lead.stage === 'negotiation' ? 'selected' : ''}>💬 Negociación</option>
              <option value="proposal" ${isEdit && lead.stage === 'proposal' ? 'selected' : ''}>📝 Propuesta</option>
              <option value="won" ${isEdit && lead.stage === 'won' ? 'selected' : ''}>✅ Ganado</option>
              <option value="lost" ${isEdit && lead.stage === 'lost' ? 'selected' : ''}>❌ Perdido</option>
            </select>
          </div>
          
          <!-- Calidad del Lead -->
          <div>
            <label style="display: block; font-weight: 600; color: #2D2C3E; margin-bottom: 0.5rem;">
              Calidad del Lead
            </label>
            <select name="lead_quality" style="width: 100%; padding: 0.75rem; border: 1px solid #E5E7EB; border-radius: 0.5rem;">
              <option value="cold" ${!isEdit || lead.lead_quality === 'cold' ? 'selected' : ''}>🟡 COLD</option>
              <option value="warm" ${isEdit && lead.lead_quality === 'warm' ? 'selected' : ''}>🟠 WARM</option>
              <option value="hot" ${isEdit && lead.lead_quality === 'hot' ? 'selected' : ''}>🔴 HOT</option>
              <option value="qualified" ${isEdit && lead.lead_quality === 'qualified' ? 'selected' : ''}>⭐ QUALIFIED</option>
            </select>
          </div>
          
          <!-- Fuente del Lead -->
          <div>
            <label style="display: block; font-weight: 600; color: #2D2C3E; margin-bottom: 0.5rem;">
              Fuente del Lead
            </label>
            <input type="text" name="lead_source"
                   value="${isEdit && lead.lead_source ? lead.lead_source : ''}"
                   placeholder="ej: LinkedIn, Referido, Web..."
                   style="width: 100%; padding: 0.75rem; border: 1px solid #E5E7EB; border-radius: 0.5rem;">
          </div>
          
          <!-- Colectivo -->
          <div>
            <label style="display: block; font-weight: 600; color: #2D2C3E; margin-bottom: 0.5rem;">
              Colectivo
            </label>
            <input type="text" name="collective"
                   value="${isEdit && lead.collective ? lead.collective : ''}"
                   style="width: 100%; padding: 0.75rem; border: 1px solid #E5E7EB; border-radius: 0.5rem;">
          </div>
          
          <!-- Valor Estimado -->
          <div>
            <label style="display: block; font-weight: 600; color: #2D2C3E; margin-bottom: 0.5rem;">
              Valor Estimado (€)
            </label>
            <input type="number" name="estimated_value" min="0" step="0.01"
                   value="${isEdit && lead.estimated_value ? lead.estimated_value : 0}"
                   style="width: 100%; padding: 0.75rem; border: 1px solid #E5E7EB; border-radius: 0.5rem;">
          </div>
          
          <!-- Probabilidad -->
          <div>
            <label style="display: block; font-weight: 600; color: #2D2C3E; margin-bottom: 0.5rem;">
              Probabilidad (%)
            </label>
            <input type="number" name="probability" min="0" max="100"
                   value="${isEdit && lead.probability ? lead.probability : 50}"
                   style="width: 100%; padding: 0.75rem; border: 1px solid #E5E7EB; border-radius: 0.5rem;">
          </div>
          
          <!-- Próximo Seguimiento -->
          <div>
            <label style="display: block; font-weight: 600; color: #2D2C3E; margin-bottom: 0.5rem;">
              Próximo Seguimiento
            </label>
            <input type="date" name="next_followup_date"
                   value="${isEdit && lead.next_followup_date ? lead.next_followup_date : ''}"
                   style="width: 100%; padding: 0.75rem; border: 1px solid #E5E7EB; border-radius: 0.5rem;">
          </div>
          
          <!-- Cierre Esperado -->
          <div>
            <label style="display: block; font-weight: 600; color: #2D2C3E; margin-bottom: 0.5rem;">
              Cierre Esperado
            </label>
            <input type="date" name="expected_close_date"
                   value="${isEdit && lead.expected_close_date ? lead.expected_close_date : ''}"
                   style="width: 100%; padding: 0.75rem; border: 1px solid #E5E7EB; border-radius: 0.5rem;">
          </div>
          
          <!-- Notas -->
          <div style="grid-column: span 2;">
            <label style="display: block; font-weight: 600; color: #2D2C3E; margin-bottom: 0.5rem;">
              Notas
            </label>
            <textarea name="notes" rows="4"
                      style="width: 100%; padding: 0.75rem; border: 1px solid #E5E7EB; border-radius: 0.5rem; font-family: inherit; resize: vertical;">${isEdit && lead.notes ? lead.notes : ''}</textarea>
          </div>
        </div>
        
        <!-- Botones -->
        <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem; padding-top: 1.5rem; border-top: 2px solid #E5E7EB;">
          <button type="button" onclick="closeModal()" 
                  style="background: #E5E7EB; color: #2D2C3E; padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600;">
            Cancelar
          </button>
          <button type="submit"
                  style="background: linear-gradient(135deg, #572c83 0%, #08a48d 100%); color: white; padding: 0.75rem 2rem; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600;">
            ${isEdit ? '💾 Guardar Cambios' : '➕ Crear Lead'}
          </button>
        </div>
      </form>
    </div>
  `;
}

async function saveLead(event, leadId) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  
  const data = {
    business_name: formData.get('business_name'),
    contact_name: formData.get('contact_name'),
    email: formData.get('email') || null,
    phone: formData.get('phone') || null,
    address: formData.get('address') || null,
    city: formData.get('city') || null,
    website: formData.get('website') || null,
    instagram: formData.get('instagram') || null,
    stage: formData.get('stage'),
    lead_quality: formData.get('lead_quality'),
    lead_source: formData.get('lead_source') || null,
    collective: formData.get('collective') || null,
    estimated_value: parseFloat(formData.get('estimated_value')) || 0,
    probability: parseInt(formData.get('probability')) || 50,
    next_followup_date: formData.get('next_followup_date') || null,
    expected_close_date: formData.get('expected_close_date') || null,
    notes: formData.get('notes') || null
  };
  
  try {
    if (leadId) {
      // Update existing lead
      await apiCall(`/leads/${leadId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      showNotification('Lead actualizado correctamente', 'success');
    } else {
      // Create new lead
      await apiCall('/leads', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      showNotification('Lead creado correctamente', 'success');
    }
    
    closeModal();
    await loadLeads();
  } catch (error) {
    console.error('Error saving lead:', error);
    showNotification('Error al guardar lead', 'error');
  }
}

// ============================================
// LEAD ACTIONS
// ============================================
async function moveLeadToNextStage(leadId, currentStage) {
  const stageFlow = {
    new_lead: 'contacted',
    contacted: 'qualified',
    qualified: 'negotiation',
    negotiation: 'proposal',
    proposal: 'won'
  };
  
  const nextStage = stageFlow[currentStage];
  if (!nextStage) return;
  
  try {
    await apiCall(`/leads/${leadId}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stage: nextStage })
    });
    
    showNotification('Lead movido correctamente', 'success');
    await loadLeads();
  } catch (error) {
    console.error('Error moving lead:', error);
    showNotification('Error al mover lead', 'error');
  }
}

async function showConvertLeadModal(leadId) {
  if (!confirm('¿Convertir este lead en cliente activo?\n\nSe creará un nuevo cliente con los datos del lead.')) return;
  
  try {
    const result = await apiCall(`/leads/${leadId}/convert`, { method: 'POST' });
    showNotification(result.message || 'Lead convertido a cliente', 'success');
    await loadLeads();
    if (typeof loadClients === 'function') {
      await loadClients(); // Refresh clients list
    }
  } catch (error) {
    console.error('Error converting lead:', error);
    showNotification('Error al convertir lead', 'error');
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function toggleLeadViewMode() {
  STATE.leadViewMode = STATE.leadViewMode === 'kanban' ? 'list' : 'kanban';
  render();
}

function updateLeadFilter(key, value) {
  STATE.leadFilters[key] = value;
  render();
}

function clearLeadFilters() {
  STATE.leadFilters = {
    quality: 'all',
    stage: 'all',
    search: ''
  };
  render();
}

function getLeadQualityColor(quality) {
  const colors = {
    hot: '#EF4444',
    warm: '#F59E0B',
    cold: '#6B7280',
    qualified: '#572c83'
  };
  return colors[quality] || '#6B7280';
}

console.log('✅ Módulo de Leads COMPLETO cargado');
