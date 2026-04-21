// ============================================================
// clientes.js — Lógica del listado de clientes
// ============================================================

function initClientes() {
  const BACKEND = '';
  const listContainer = document.getElementById('clientesList');
  const alertBox = document.getElementById('clientesAlert');
  const emptyBox = document.getElementById('clientesEmpty');
  const loadingModal = document.getElementById('clientesLoadingModal');
  const loadingTitle = document.getElementById('clientesLoadingTitle');
  const loadingMessage = document.getElementById('clientesLoadingMessage');
  const deleteModal = document.getElementById('clientesDeleteModal');
  const deleteTitle = document.getElementById('clientesDeleteTitle');
  const deleteMessage = document.getElementById('clientesDeleteMessage');
  const deleteCancel = document.getElementById('clientesDeleteCancel');
  const deleteConfirm = document.getElementById('clientesDeleteConfirm');
  const successModal = document.getElementById('clientesSuccessModal');
  const successTitle = document.getElementById('clientesSuccessTitle');
  const successMessage = document.getElementById('clientesSuccessMessage');
  const successOk = document.getElementById('clientesSuccessOk');

  // Muestra el error general en el listado.
  let activeModal = null;
  let clientToDelete = null;
  let deleteButtonToRestore = null;
  let deleteInFlight = false;

  function showModal(modal) {
    if (activeModal && activeModal !== modal) {
      activeModal.classList.add('hidden');
    }

    modal.classList.remove('hidden');
    activeModal = modal;
    document.body.style.overflow = 'hidden';
  }

  function hideModal(modal) {
    if (!modal.classList.contains('hidden')) {
      modal.classList.add('hidden');
    }

    if (activeModal === modal) {
      activeModal = null;
      document.body.style.overflow = '';
    }
  }

  function showLoadingModal(title, message) {
    loadingTitle.textContent = title;
    loadingMessage.textContent = message;
    showModal(loadingModal);
  }

  function hideLoadingModal() {
    hideModal(loadingModal);
  }

  function showDeleteModal(cliente, button) {
    clientToDelete = cliente;
    deleteButtonToRestore = button;
    deleteTitle.textContent = 'Eliminar cliente';
    deleteMessage.textContent = `Vas a eliminar a "${cliente.nombre || 'este cliente'}". Esta acción no se puede deshacer.`;
    showModal(deleteModal);
  }

  function hideDeleteModal() {
    hideModal(deleteModal);
  }

  function showSuccessModal(title, message) {
    successTitle.textContent = title;
    successMessage.textContent = message;
    showModal(successModal);
  }

  function showError(message) {
    hideLoadingModal();
    hideDeleteModal();
    alertBox.textContent = message;
    alertBox.classList.remove('hidden');
  }

  function clearError() {
    alertBox.textContent = '';
    alertBox.classList.add('hidden');
  }

  // Recupera el token de la sesión activa.
  async function getSessionToken() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session?.access_token || null;
  }

  // Pinta el mensaje cuando no hay clientes todavía.
  function renderEmpty() {
    listContainer.innerHTML = '';
    emptyBox.classList.remove('hidden');
  }

  // Crea las tarjetas con nombre y domicilio principal.
  function renderClientes(clientes) {
    listContainer.innerHTML = '';
    if (!clientes || clientes.length === 0) {
      renderEmpty();
      return;
    }

    emptyBox.classList.add('hidden');

    for (const cliente of clientes) {
      const card = document.createElement('article');
      card.className = 'cliente-card';

      const main = document.createElement('button');
      main.type = 'button';
      main.className = 'cliente-main';
      main.addEventListener('click', () => {
        window.location.href = `crear-cliente.html?id=${encodeURIComponent(cliente.id)}`;
      });

      const name = document.createElement('span');
      name.className = 'cliente-name';
      name.textContent = cliente.nombre || 'Sin nombre';

      const alias = document.createElement('span');
      alias.className = 'cliente-alias';
      alias.textContent = cliente.domicilio_alias || 'Sin domicilio';

      main.append(name, alias);

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'cliente-delete';
      deleteButton.textContent = 'Eliminar';
      deleteButton.addEventListener('click', (event) => {
        event.stopPropagation();
        showDeleteModal(cliente, deleteButton);
      });

      card.append(main, deleteButton);
      listContainer.appendChild(card);
    }
  }

  // Carga el listado desde el backend.
  async function cargarClientes() {
    clearError();
    listContainer.innerHTML = '';
    emptyBox.classList.add('hidden');
    showLoadingModal('Cargando clientes', 'Estamos preparando el listado.');

    try {
      const token = await getSessionToken();
      if (!token) {
        window.location.href = '../index.html';
        return;
      }

      const response = await fetch(`${BACKEND}/api/clients`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await response.json();
      if (!response.ok) {
        showError(json.error || 'No se pudieron cargar los clientes.');
        return;
      }

      renderClientes(json.clientes || []);
    } catch (error) {
      console.error('Error cargando clientes:', error);
      showError('Error de conexión con el servidor.');
    } finally {
      hideLoadingModal();
    }
  }

  async function eliminarClienteSeleccionado() {
    if (!clientToDelete || deleteInFlight) {
      return;
    }

    hideDeleteModal();
    deleteInFlight = true;

    if (deleteButtonToRestore) {
      deleteButtonToRestore.disabled = true;
    }

    showLoadingModal('Eliminando cliente', 'Por favor, espera un momento.');

    try {
      const token = await getSessionToken();
      if (!token) {
        window.location.href = '../index.html';
        return;
      }

      const response = await fetch(`${BACKEND}/api/clients/${clientToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await response.json();
      if (!response.ok) {
        showError(json.error || 'No se pudo eliminar el cliente.');
        return;
      }

      showSuccessModal(
        'Cliente eliminado',
        `"${clientToDelete.nombre || 'El cliente'}" se ha eliminado correctamente.`
      );
    } catch (error) {
      console.error('Error eliminando cliente:', error);
      showError('Error de conexión con el servidor.');
    } finally {
      deleteInFlight = false;
      if (deleteButtonToRestore) {
        deleteButtonToRestore.disabled = false;
      }
      hideLoadingModal();
    }
  }

  deleteCancel.addEventListener('click', hideDeleteModal);
  deleteConfirm.addEventListener('click', eliminarClienteSeleccionado);
  deleteModal.addEventListener('click', (event) => {
    if (event.target === deleteModal) {
      hideDeleteModal();
    }
  });
  successOk.addEventListener('click', async () => {
    hideModal(successModal);
    await cargarClientes();
  });
  successModal.addEventListener('click', (event) => {
    if (event.target === successModal) {
      hideModal(successModal);
      cargarClientes();
    }
  });

  cargarClientes();
}
