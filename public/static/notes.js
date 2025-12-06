// ============================================================================
// NOTAS - Sistema completo
// ============================================================================

// Load notes from API
async function loadNotes() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/notes', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      STATE.notes = await response.json();
    } else {
      console.error('Error cargando notas');
      STATE.notes = [];
    }
  } catch (error) {
    console.error('Error:', error);
    STATE.notes = [];
  }
}

// Render notes view
function renderNotesView() {
  const categories = ['all', 'estrategia', 'reunion', 'llamada', 'idea', 'seguimiento', 'otro'];
  const categoryLabels = {
    all: 'Todas',
    estrategia: '🎯 Estrategia',
    reunion: '🤝 Reunión',
    llamada: '📞 Llamada',
    idea: '💡 Idea',
    seguimiento: '📊 Seguimiento',
    otro: '📝 Otro'
  };

  // Filter notes
  let filteredNotes = STATE.notes || [];
  
  if (STATE.notesFilters.category !== 'all') {
    filteredNotes = filteredNotes.filter(n => n.category === STATE.notesFilters.category);
  }
  
  if (STATE.notesFilters.search) {
    const search = STATE.notesFilters.search.toLowerCase();
    filteredNotes = filteredNotes.filter(n => 
      n.title.toLowerCase().includes(search) || 
      n.content.toLowerCase().includes(search) ||
      (n.tags && n.tags.toLowerCase().includes(search))
    );
  }
  
  if (STATE.notesFilters.pinned_only) {
    filteredNotes = filteredNotes.filter(n => n.is_pinned);
  }

  // Sort: pinned first, then by date
  filteredNotes.sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return b.is_pinned - a.is_pinned;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return `
    <div class="p-6">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">📝 Notas</h2>
          <p class="text-sm text-gray-600 mt-1">${filteredNotes.length} nota${filteredNotes.length !== 1 ? 's' : ''}</p>
        </div>
        <button onclick="showCreateNoteModal()" class="px-4 py-2 bg-galia-purple text-white rounded-lg hover:bg-opacity-90 transition">
          <i class="fas fa-plus mr-2"></i>Nueva Nota
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow p-4 mb-6">
        <div class="flex flex-wrap gap-4">
          <!-- Category filter -->
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
            <div class="flex flex-wrap gap-2">
              ${categories.map(cat => `
                <button 
                  onclick="STATE.notesFilters.category = '${cat}'; render();"
                  class="px-3 py-1 text-sm rounded-lg transition ${
                    STATE.notesFilters.category === cat 
                      ? 'bg-galia-purple text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }"
                >
                  ${categoryLabels[cat]}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Search -->
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
            <input 
              type="text" 
              value="${STATE.notesFilters.search}"
              onkeyup="STATE.notesFilters.search = this.value; render();"
              placeholder="Buscar en título, contenido o tags..." 
              class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-galia-purple focus:border-transparent"
            >
          </div>

          <!-- Pinned only -->
          <div class="flex items-end">
            <label class="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                ${STATE.notesFilters.pinned_only ? 'checked' : ''}
                onchange="STATE.notesFilters.pinned_only = this.checked; render();"
                class="w-4 h-4 text-galia-purple rounded"
              >
              <span class="text-sm text-gray-700">Solo fijadas 📌</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Notes Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${filteredNotes.length === 0 ? `
          <div class="col-span-full text-center py-12 text-gray-500">
            <i class="fas fa-sticky-note text-4xl mb-3"></i>
            <p>No hay notas todavía</p>
            <button onclick="showCreateNoteModal()" class="mt-4 text-galia-purple hover:underline">
              Crear primera nota
            </button>
          </div>
        ` : filteredNotes.map(note => `
          <div class="bg-white rounded-lg shadow hover:shadow-lg transition p-4 border-t-4 ${
            note.priority === 'high' ? 'border-red-500' : 
            note.priority === 'medium' ? 'border-yellow-500' : 
            'border-green-500'
          }">
            <!-- Header -->
            <div class="flex justify-between items-start mb-2">
              <div class="flex-1">
                <h3 class="font-semibold text-gray-800">${note.title}</h3>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-xs px-2 py-1 rounded-full ${
                    note.category === 'estrategia' ? 'bg-purple-100 text-purple-700' :
                    note.category === 'reunion' ? 'bg-blue-100 text-blue-700' :
                    note.category === 'llamada' ? 'bg-green-100 text-green-700' :
                    note.category === 'idea' ? 'bg-yellow-100 text-yellow-700' :
                    note.category === 'seguimiento' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-700'
                  }">
                    ${categoryLabels[note.category]}
                  </span>
                  ${note.is_pinned ? '<span class="text-xs">📌</span>' : ''}
                </div>
              </div>
              <div class="flex gap-1">
                <button onclick="togglePinNote(${note.id})" class="text-gray-400 hover:text-galia-purple" title="Fijar">
                  <i class="fas fa-thumbtack"></i>
                </button>
                <button onclick="showEditNoteModal(${note.id})" class="text-gray-400 hover:text-galia-purple" title="Editar">
                  <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteNote(${note.id})" class="text-gray-400 hover:text-red-500" title="Eliminar">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>

            <!-- Content -->
            <p class="text-sm text-gray-600 mb-3 line-clamp-3">${note.content}</p>

            <!-- Footer -->
            <div class="flex justify-between items-center text-xs text-gray-500">
              <span>${formatDate(note.created_at)}</span>
              ${note.linked_type !== 'none' ? `
                <span class="px-2 py-1 bg-gray-100 rounded">
                  🔗 ${note.linked_type}
                </span>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Show create note modal
function showCreateNoteModal() {
  showModal('Crear Nota', `
    <form id="createNoteForm" onsubmit="createNote(event)">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Título *</label>
          <input type="text" name="title" required class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-galia-purple">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Contenido *</label>
          <textarea name="content" required rows="4" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-galia-purple"></textarea>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select name="category" class="w-full px-3 py-2 border rounded-lg">
              <option value="otro">Otro</option>
              <option value="estrategia">Estrategia</option>
              <option value="reunion">Reunión</option>
              <option value="llamada">Llamada</option>
              <option value="idea">Idea</option>
              <option value="seguimiento">Seguimiento</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
            <select name="priority" class="w-full px-3 py-2 border rounded-lg">
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="low">Baja</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tags (separados por comas)</label>
          <input type="text" name="tags" placeholder="ventas, prospección, urgente" class="w-full px-3 py-2 border rounded-lg">
        </div>
      </div>

      <div class="flex justify-end gap-3 mt-6">
        <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-600 hover:text-gray-800">
          Cancelar
        </button>
        <button type="submit" class="px-4 py-2 bg-galia-purple text-white rounded-lg hover:bg-opacity-90">
          Crear Nota
        </button>
      </div>
    </form>
  `);
}

// Create note
async function createNote(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  
  const tagsInput = formData.get('tags');
  const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];

  const noteData = {
    title: formData.get('title'),
    content: formData.get('content'),
    category: formData.get('category'),
    priority: formData.get('priority'),
    tags: tags
  };

  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(noteData)
    });

    if (response.ok) {
      await loadNotes();
      closeModal();
      showNotification('Nota creada exitosamente', 'success');
      render();
    } else {
      const error = await response.json();
      showNotification(error.error || 'Error al crear nota', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showNotification('Error al crear nota', 'error');
  }
}

// Toggle pin note
async function togglePinNote(id) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/notes/${id}/pin`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      await loadNotes();
      render();
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Delete note
async function deleteNote(id) {
  if (!confirm('¿Seguro que quieres eliminar esta nota?')) return;

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/notes/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      await loadNotes();
      showNotification('Nota eliminada', 'success');
      render();
    }
  } catch (error) {
    console.error('Error:', error);
    showNotification('Error al eliminar nota', 'error');
  }
}

// Show edit note modal
async function showEditNoteModal(id) {
  const note = STATE.notes.find(n => n.id === id);
  if (!note) return;

  const tags = note.tags ? JSON.parse(note.tags).join(', ') : '';

  showModal('Editar Nota', `
    <form id="editNoteForm" onsubmit="updateNote(event, ${id})">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Título *</label>
          <input type="text" name="title" value="${escapeHtml(note.title)}" required class="w-full px-3 py-2 border rounded-lg">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Contenido *</label>
          <textarea name="content" required rows="4" class="w-full px-3 py-2 border rounded-lg">${escapeHtml(note.content)}</textarea>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select name="category" class="w-full px-3 py-2 border rounded-lg">
              <option value="otro" ${note.category === 'otro' ? 'selected' : ''}>Otro</option>
              <option value="estrategia" ${note.category === 'estrategia' ? 'selected' : ''}>Estrategia</option>
              <option value="reunion" ${note.category === 'reunion' ? 'selected' : ''}>Reunión</option>
              <option value="llamada" ${note.category === 'llamada' ? 'selected' : ''}>Llamada</option>
              <option value="idea" ${note.category === 'idea' ? 'selected' : ''}>Idea</option>
              <option value="seguimiento" ${note.category === 'seguimiento' ? 'selected' : ''}>Seguimiento</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
            <select name="priority" class="w-full px-3 py-2 border rounded-lg">
              <option value="low" ${note.priority === 'low' ? 'selected' : ''}>Baja</option>
              <option value="medium" ${note.priority === 'medium' ? 'selected' : ''}>Media</option>
              <option value="high" ${note.priority === 'high' ? 'selected' : ''}>Alta</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tags (separados por comas)</label>
          <input type="text" name="tags" value="${tags}" placeholder="ventas, prospección, urgente" class="w-full px-3 py-2 border rounded-lg">
        </div>
      </div>

      <div class="flex justify-end gap-3 mt-6">
        <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-600 hover:text-gray-800">
          Cancelar
        </button>
        <button type="submit" class="px-4 py-2 bg-galia-purple text-white rounded-lg hover:bg-opacity-90">
          Guardar Cambios
        </button>
      </div>
    </form>
  `);
}

// Update note
async function updateNote(event, id) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  
  const tagsInput = formData.get('tags');
  const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];

  const noteData = {
    title: formData.get('title'),
    content: formData.get('content'),
    category: formData.get('category'),
    priority: formData.get('priority'),
    tags: tags
  };

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/notes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(noteData)
    });

    if (response.ok) {
      await loadNotes();
      closeModal();
      showNotification('Nota actualizada', 'success');
      render();
    } else {
      const error = await response.json();
      showNotification(error.error || 'Error al actualizar nota', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showNotification('Error al actualizar nota', 'error');
  }
}

// Helper function to escape HTML
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
