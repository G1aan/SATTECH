// ============================================================
// clientes.js — Lógica del listado de clientes
// ============================================================

function initClientes() {
  const BACKEND = '';
  const listContainer = document.getElementById('clientesList');
  const alertBox = document.getElementById('clientesAlert');
  const emptyBox = document.getElementById('clientesEmpty');

  // Muestra el error general en el listado.
  function showError(message) {
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
      deleteButton.addEventListener('click', async (event) => {
        event.stopPropagation();
        const confirmar = window.confirm('¿Seguro que quieres eliminar este cliente?');
        if (!confirmar) {
          return;
        }

        deleteButton.disabled = true;
        try {
          const token = await getSessionToken();
          if (!token) {
            window.location.href = '../index.html';
            return;
          }

          const response = await fetch(`${BACKEND}/api/clients/${cliente.id}`, {
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

          await cargarClientes();
        } catch (error) {
          console.error('Error eliminando cliente:', error);
          showError('Error de conexión con el servidor.');
        } finally {
          deleteButton.disabled = false;
        }
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

    const token = await getSessionToken();
    if (!token) {
      window.location.href = '../index.html';
      return;
    }

    try {
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
    }
  }

  cargarClientes();
}
