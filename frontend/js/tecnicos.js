// ============================================================
// tecnicos.js — Lógica del listado de técnicos
// ============================================================

function initTecnicos() {
  const BACKEND = 'http://localhost:3000';
  const listContainer = document.getElementById('tecnicosList');
  const alertBox = document.getElementById('tecnicosAlert');
  const emptyBox = document.getElementById('tecnicosEmpty');
  const modal = document.getElementById('tecnicoModal');
  const modalTitle = document.getElementById('tecnicoModalTitle');
  const modalBody = document.getElementById('tecnicoModalBody');
  const modalClose = document.getElementById('tecnicoModalClose');
  const modalCancel = document.getElementById('tecnicoModalCancel');
  const modalEdit = document.getElementById('tecnicoModalEdit');
  const modalDelete = document.getElementById('tecnicoModalDelete');

  let currentTechnician = null;

  // Muestra un error general en la pantalla.
  function showError(message) {
    alertBox.textContent = message;
    alertBox.classList.remove('hidden');
  }

  // Limpia el aviso de error.
  function clearError() {
    alertBox.textContent = '';
    alertBox.classList.add('hidden');
  }

  // Recupera el token de sesión para la API.
  async function getSessionToken() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session?.access_token || null;
  }

  // Formatea los CPs para que se lean mejor en el listado.
  function formatCps(values) {
    if (!Array.isArray(values) || values.length === 0) {
      return '—';
    }
    return values.join(', ');
  }

  // Muestra el estado vacío cuando todavía no hay técnicos.
  function renderEmpty() {
    listContainer.innerHTML = '';
    emptyBox.classList.remove('hidden');
  }

  // Abre el modal con el detalle completo del técnico.
  function openModal(technician) {
    currentTechnician = technician;
    modalTitle.textContent = technician.nombre || 'Detalle del técnico';
    modalBody.innerHTML = `
      <div class="list-detail-row">
        <span class="list-detail-label">Nombre</span>
        <span class="list-detail-value">${technician.nombre || '—'}</span>
      </div>
      <div class="list-detail-row">
        <span class="list-detail-label">Email</span>
        <span class="list-detail-value">${technician.email || '—'}</span>
      </div>
      <div class="list-detail-row">
        <span class="list-detail-label">Teléfono</span>
        <span class="list-detail-value">${technician.telefono || '—'}</span>
      </div>
      <div class="list-detail-row">
        <span class="list-detail-label">CPs</span>
        <span class="list-detail-value">${formatCps(technician.codigos_postales)}</span>
      </div>
    `;
    modal.classList.remove('hidden');
  }

  // Cierra el modal y limpia la selección.
  function closeModal() {
    modal.classList.add('hidden');
    currentTechnician = null;
  }

  function editTechnician() {
    if (!currentTechnician) {
      return;
    }

    window.location.href = `crear-tecnico.html?id=${encodeURIComponent(currentTechnician.id)}`;
  }

  // Dibuja las tarjetas del listado.
  function renderTechnicians(tecnicos) {
    listContainer.innerHTML = '';
    if (!tecnicos || tecnicos.length === 0) {
      renderEmpty();
      return;
    }

    emptyBox.classList.add('hidden');

    for (const tecnico of tecnicos) {
      const card = document.createElement('article');
      card.className = 'list-card';

      const main = document.createElement('button');
      main.type = 'button';
      main.className = 'list-main';
      main.addEventListener('click', () => openModal(tecnico));

      const name = document.createElement('span');
      name.className = 'list-name';
      name.textContent = tecnico.nombre || 'Sin nombre';

      const meta = document.createElement('span');
      meta.className = 'list-meta';
      meta.textContent = `${tecnico.email || 'Sin email'} · ${formatCps(tecnico.codigos_postales)}`;

      main.append(name, meta);

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'list-delete';
      deleteButton.textContent = 'Detalle';
      deleteButton.addEventListener('click', () => openModal(tecnico));

      card.append(main, deleteButton);
      listContainer.appendChild(card);
    }
  }

  // Elimina el técnico actualmente seleccionado.
  async function removeTechnician() {
    if (!currentTechnician) {
      return;
    }

    const confirmed = window.confirm('¿Seguro que quieres eliminar este técnico?');
    if (!confirmed) {
      return;
    }

    modalDelete.disabled = true;

    try {
      const token = await getSessionToken();
      if (!token) {
        window.location.href = '../index.html';
        return;
      }

      const response = await fetch(`${BACKEND}/api/technicians/${currentTechnician.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await response.json();
      if (!response.ok) {
        showError(json.error || 'No se pudo eliminar el técnico.');
        return;
      }

      closeModal();
      await cargarTecnicos();
    } catch (error) {
      showError('Error de conexión con el servidor.');
    } finally {
      modalDelete.disabled = false;
    }
  }

  // Carga todos los técnicos desde la API.
  async function cargarTecnicos() {
    clearError();
    listContainer.innerHTML = '';
    emptyBox.classList.add('hidden');

    const token = await getSessionToken();
    if (!token) {
      window.location.href = '../index.html';
      return;
    }

    try {
      const response = await fetch(`${BACKEND}/api/technicians`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await response.json();
      if (!response.ok) {
        showError(json.error || 'No se pudieron cargar los técnicos.');
        return;
      }

      renderTechnicians(json.tecnicos || []);
    } catch (error) {
      showError('Error de conexión con el servidor.');
    }
  }

  modalClose.addEventListener('click', closeModal);
  modalCancel.addEventListener('click', closeModal);
  modalEdit.addEventListener('click', editTechnician);
  modalDelete.addEventListener('click', removeTechnician);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  cargarTecnicos();
}
