// ============================================================
// sats-list.js — Lógica compartida para el listado de SATs
// ============================================================

function initSatsList() {
  const BACKEND = 'http://localhost:3000';
  const listPage = document.querySelector('.list-page');
  const listContainer = document.getElementById('satsList');
  const alertBox = document.getElementById('satsAlert');
  const emptyBox = document.getElementById('satsEmpty');
  const searchInput = document.getElementById('satSearch');
  const clientInput = document.getElementById('satClientFilter');
  const technicianInput = document.getElementById('satTechnicianFilter');
  const stateSelect = document.getElementById('satStateFilter');
  const sortSelect = document.getElementById('satSortFilter');
  const resetButton = document.getElementById('satResetFilters');
  const refreshButton = document.getElementById('btnRefreshSats');

  const mode = listPage?.dataset.satMode || 'admin';
  const scope = listPage?.dataset.satScope || 'all';
  const showDelete = listPage?.dataset.satShowDelete === 'true';
  const showCreate = listPage?.dataset.satShowCreate === 'true';

  let currentUser = null;
  let currentSats = [];

  // Muestra un error general en la vista.
  function showError(message) {
    alertBox.textContent = message;
    alertBox.classList.remove('hidden');
  }

  // Limpia el aviso de error.
  function clearError() {
    alertBox.textContent = '';
    alertBox.classList.add('hidden');
  }

  // Obtiene el token de sesión para llamar a la API.
  async function getSessionToken() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session?.access_token || null;
  }

  // Carga el contexto del usuario para saber si es técnico o admin.
  async function loadCurrentUser() {
    const token = await getSessionToken();
    if (!token) {
      window.location.href = '../index.html';
      return null;
    }

    const response = await fetch(`${BACKEND}/api/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await response.json();
    if (!response.ok) {
      showError(json.error || 'No se pudo cargar la sesión.');
      return null;
    }

    return {
      token,
      role: json.role,
      technician: json.technician,
    };
  }

  // Formatea la fecha de creación o programación.
  function formatDate(value) {
    if (!value) {
      return '—';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('es-ES');
  }

  function getSatDate(sat) {
    return sat?.fecha_programada || sat?.fecha_programa || sat?.fecha_creacion || null;
  }

  // Convierte el estado en una etiqueta visual.
  function statusClass(status) {
    if (status === 'acabado') {
      return 'status status-done';
    }

    if (status === 'en_progreso') {
      return 'status status-progress';
    }

    return 'status status-pending';
  }

  // Muestra el estado vacío cuando no hay SATs.
  function renderEmpty(message = 'No hay resultados para los filtros actuales.') {
    listContainer.innerHTML = '';
    emptyBox.querySelector('h3').textContent = 'Sin resultados';
    const paragraph = emptyBox.querySelector('p');
    if (paragraph) {
      paragraph.textContent = message;
    }
    emptyBox.classList.remove('hidden');
  }

  // Abre el detalle del SAT en una pestaña nueva.
  function openSatView(satId) {
    window.open(`sat-view.html?id=${encodeURIComponent(satId)}`, '_blank', 'noopener');
  }

  // Filtra el listado recibido por backend en la propia UI.
  function applyClientSideFilters(sats) {
    const search = (searchInput?.value || '').trim().toLowerCase();
    const client = (clientInput?.value || '').trim().toLowerCase();
    const technician = (technicianInput?.value || '').trim().toLowerCase();
    const state = (stateSelect?.value || '').trim().toLowerCase();
    const sort = sortSelect?.value || 'fecha_programada';

    const filtered = (sats || []).filter((sat) => {
      const haySearch =
        !search ||
        [sat.numero_sat, sat.cliente_nombre, sat.domicilio_dir].some((value) =>
          String(value || '').toLowerCase().includes(search)
        );

      const hayClient = !client || String(sat.cliente_nombre || '').toLowerCase().includes(client);
      const hayTechnician = !technician || String(sat.tecnico_nombre || '').toLowerCase().includes(technician);
      const hayState = !state || String(sat.estado || '').toLowerCase() === state;

      return haySearch && hayClient && hayTechnician && hayState;
    });

    return filtered.sort((a, b) => {
      const field = sort === 'fecha_cierre'
        ? 'fecha_cierre'
        : sort === 'fecha_creacion'
          ? 'fecha_creacion'
          : 'fecha_programada';

      const aValue = (a[field] || getSatDate(a)) ? new Date(a[field] || getSatDate(a)).getTime() : 0;
      const bValue = (b[field] || getSatDate(b)) ? new Date(b[field] || getSatDate(b)).getTime() : 0;
      return aValue - bValue;
    });
  }

  // Dibuja las tarjetas del listado.
  function renderSats(sats) {
    listContainer.innerHTML = '';

    const visibleSats = applyClientSideFilters(sats);
    if (!visibleSats || visibleSats.length === 0) {
      renderEmpty();
      return;
    }

    emptyBox.classList.add('hidden');

    for (const sat of visibleSats) {
      const card = document.createElement('article');
      card.className = 'list-card';

      const main = document.createElement('button');
      main.type = 'button';
      main.className = 'list-main';
      main.addEventListener('click', () => openSatView(sat.id));

      const heading = document.createElement('span');
      heading.className = 'list-name';
      heading.textContent = sat.numero_sat || 'Sin número';

      const meta = document.createElement('span');
      meta.className = 'list-meta';
      meta.textContent = `${sat.cliente_nombre || 'Sin cliente'} · ${sat.domicilio_dir || 'Sin domicilio'} · ${formatDate(getSatDate(sat))}`;

      const status = document.createElement('span');
      status.className = statusClass(sat.estado);
      status.textContent = sat.estado || 'pendiente';

      main.append(heading, meta, status);

      const actions = document.createElement('div');
      actions.className = 'list-actions';

      const viewButton = document.createElement('button');
      viewButton.type = 'button';
      viewButton.className = 'list-view';
      viewButton.textContent = 'Ver detalle';
      viewButton.addEventListener('click', () => openSatView(sat.id));
      actions.append(viewButton);

      if (showDelete && currentUser?.role === 'admin') {
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'list-delete';
        deleteButton.textContent = 'Eliminar';
        deleteButton.addEventListener('click', async (event) => {
          event.stopPropagation();

          const confirmed = window.confirm('¿Seguro que quieres eliminar este SAT?');
          if (!confirmed) {
            return;
          }

          deleteButton.disabled = true;

          try {
            const response = await fetch(`${BACKEND}/api/sats/${sat.id}`, {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${currentUser.token}`,
              },
            });

            const json = await response.json();
            if (!response.ok) {
              showError(json.error || 'No se pudo eliminar el SAT.');
              return;
            }

            await cargarSats();
          } catch (error) {
            showError('Error de conexión con el servidor.');
          } finally {
            deleteButton.disabled = false;
          }
        });
        actions.append(deleteButton);
      }

      card.append(main, actions);
      listContainer.appendChild(card);
    }
  }

  // Carga los SATs desde el backend.
  async function cargarSats() {
    if (!currentUser) {
      return;
    }

    clearError();
    listContainer.innerHTML = '';
    emptyBox.classList.add('hidden');

    const params = new URLSearchParams();
    params.set('scope', scope);
    params.set('sort', sortSelect?.value || 'fecha_programada');
    if (searchInput?.value.trim()) {
      params.set('search', searchInput.value.trim());
    }
    if (clientInput?.value.trim()) {
      params.set('cliente', clientInput.value.trim());
    }
    if (technicianInput?.value.trim() && mode === 'admin') {
      params.set('tecnico', technicianInput.value.trim());
    }
    if (stateSelect?.value) {
      params.set('estado', stateSelect.value);
    }

    try {
      const response = await fetch(`${BACKEND}/api/sats?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${currentUser.token}`,
        },
      });

      const json = await response.json();
      if (!response.ok) {
        showError(json.error || 'No se pudieron cargar los SATs.');
        return;
      }

      currentSats = json.sats || [];
      renderSats(currentSats);
    } catch (error) {
      showError('Error de conexión con el servidor.');
    }
  }

  // Vincula los filtros para refrescar el listado.
  function bindFilters() {
    const inputs = [searchInput, clientInput, technicianInput, stateSelect, sortSelect];
    for (const input of inputs) {
      if (!input) continue;
      input.addEventListener('input', () => renderSats(currentSats));
      input.addEventListener('change', () => renderSats(currentSats));
    }

    if (resetButton) {
      resetButton.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (clientInput) clientInput.value = '';
        if (technicianInput) technicianInput.value = '';
        if (stateSelect) stateSelect.value = '';
        if (sortSelect) sortSelect.value = 'fecha_programada';
        renderSats(currentSats);
      });
    }

    if (refreshButton) {
      refreshButton.addEventListener('click', cargarSats);
    }
  }

  // Redirige a la vista del técnico si entra por la pantalla de admin.
  async function guardRole() {
    currentUser = await loadCurrentUser();
    if (!currentUser) {
      return false;
    }

    if (mode === 'admin' && currentUser.role === 'technician') {
      window.location.href = 'mis-sats.html';
      return false;
    }

    if (mode === 'technician' && currentUser.role !== 'technician') {
      window.location.href = 'sats.html';
      return false;
    }

    return true;
  }

  async function init() {
    const allowed = await guardRole();
    if (!allowed) {
      return;
    }

    bindFilters();
    await cargarSats();
  }

  init();
}
