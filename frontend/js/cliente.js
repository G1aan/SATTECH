function initCrearCliente() {
  const BACKEND = '';
  const clienteId = new URLSearchParams(window.location.search).get('id');
  const isEditMode = Boolean(clienteId);
  document.title = isEditMode ? 'Ficha de cliente — MiSaaS' : 'Crear Cliente — MiSaaS';

  // Elementos principales de la vista de cliente.
  const pageTitle = document.getElementById('clientePageTitle');
  const formAlert = document.getElementById('formAlert');
  const domiciliosCont = document.getElementById('domiciliosContainer');
  const btnAddDomicilio = document.getElementById('btnAddDomicilio');
  const btnGuardar = document.getElementById('btnGuardar');
  const btnGuardarText = document.getElementById('btnGuardarText');
  const btnGuardarSpinner = document.getElementById('btnGuardarSpinner');
  const btnEliminar = document.getElementById('btnEliminarCliente');
  const codigoInput = document.getElementById('codigo');
  const modalExito = document.getElementById('modalExito');
  const modalExitoTitle = document.getElementById('modalExitoTitle');
  const modalExitoMsg = document.getElementById('modalExitoMsg');
  const btnModalOk = document.getElementById('btnModalOk');
  const clientLoadingModal = document.getElementById('clientLoadingModal');
  const clientLoadingTitle = document.getElementById('clientLoadingTitle');
  const clientLoadingMessage = document.getElementById('clientLoadingMessage');
  const clientDeleteModal = document.getElementById('clientDeleteModal');
  const clientDeleteTitle = document.getElementById('clientDeleteTitle');
  const clientDeleteMessage = document.getElementById('clientDeleteMessage');
  const clientDeleteCancel = document.getElementById('clientDeleteCancel');
  const clientDeleteConfirm = document.getElementById('clientDeleteConfirm');

  let domicilioCount = 0;
  let activeModal = null;
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
    clientLoadingTitle.textContent = title;
    clientLoadingMessage.textContent = message;
    showModal(clientLoadingModal);
  }

  function hideLoadingModal() {
    hideModal(clientLoadingModal);
  }

  function showDeleteModal() {
    const nombre = document.getElementById('nombre').value.trim();
    clientDeleteTitle.textContent = 'Eliminar cliente';
    clientDeleteMessage.textContent = `Vas a eliminar a "${nombre || 'este cliente'}". Esta acción no se puede deshacer.`;
    showModal(clientDeleteModal);
  }

  function hideDeleteModal() {
    hideModal(clientDeleteModal);
  }

  function showSuccessModal(title, message, buttonText) {
    modalExitoTitle.textContent = title;
    modalExitoMsg.textContent = message;
    btnModalOk.textContent = buttonText;
    showModal(modalExito);
  }

  // Ajusta el estado del formulario según si está cargando o no.
  function setLoading(isLoading, title, message) {
    btnGuardar.disabled = isLoading;
    btnAddDomicilio.disabled = isLoading;
    if (btnEliminar) {
      btnEliminar.disabled = isLoading;
    }
    btnGuardarSpinner.classList.toggle('hidden', !isLoading);
    btnGuardarText.textContent = isEditMode
      ? (isLoading ? 'Guardando...' : '💾 Guardar cambios')
      : (isLoading ? 'Guardando...' : '✅ Crear Cliente');

    if (isLoading) {
      showLoadingModal(title, message);
    } else {
      hideLoadingModal();
    }
  }

  // Muestra un mensaje de error en la parte superior.
  function mostrarError(msg) {
    hideLoadingModal();
    hideDeleteModal();
    formAlert.textContent = msg;
    formAlert.className = 'form-alert error';
    formAlert.classList.remove('hidden');
    formAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Limpia el aviso de error.
  function clearError() {
    formAlert.classList.add('hidden');
    formAlert.textContent = '';
  }

  // Añade un bloque de domicilio al formulario.
  function addDomicilio(domicilio = {}) {
    domicilioCount += 1;
    const idx = domicilioCount;
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    if (domicilio.id) {
      div.dataset.id = domicilio.id;
    }

    div.innerHTML = `
      <div class="dynamic-item-header">
        <span class="dynamic-item-title">Domicilio #${idx}</span>
        <button type="button" class="btn-remove" title="Eliminar">✕</button>
      </div>
      <div class="fields-grid">
        <div class="form-group">
          <label>Alias <small style="color:#94a3b8">(ej: Sede Central)</small></label>
          <input type="text" class="dom-alias" placeholder="Sede Central" />
        </div>
        <div class="form-group">
          <label>Código Postal *</label>
          <input type="text" class="dom-cp" maxlength="5" placeholder="28001" />
        </div>
        <div class="form-group full-width">
          <label>Calle / Dirección *</label>
          <input type="text" class="dom-calle" placeholder="Calle Mayor 1" />
        </div>
        <div class="form-group">
          <label>Ciudad</label>
          <input type="text" class="dom-ciudad" placeholder="Se autocompleta por CP" />
        </div>
      </div>
    `;

    div.querySelector('.dom-alias').value = domicilio.alias || '';
    div.querySelector('.dom-calle').value = domicilio.direccion || domicilio.calle || '';
    div.querySelector('.dom-cp').value = domicilio.codigo_postal || domicilio.cp || '';
    div.querySelector('.dom-ciudad').value = domicilio.ciudad || '';

    div.querySelector('.btn-remove').addEventListener('click', () => div.remove());

    const cpInput = div.querySelector('.dom-cp');
    const ciudadInput = div.querySelector('.dom-ciudad');
    cpInput.addEventListener('blur', () => autocompletarCiudad(cpInput.value, ciudadInput));

    domiciliosCont.appendChild(div);
  }

  // Intenta completar la ciudad a partir del código postal.
  async function autocompletarCiudad(cp, ciudadInput) {
    if (!/^\d{5}$/.test(cp)) {
      return;
    }

    try {
      const res = await fetch(`https://api.zippopotam.us/es/${cp}`);
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      ciudadInput.value = data.places?.[0]?.['place name'] || '';
    } catch (error) {
      console.warn('No se pudo autocompletar la ciudad:', error);
    }
  }

  // Recoge los domicilios escritos en la pantalla.
  function recogerDomicilios() {
    return [...domiciliosCont.querySelectorAll('.dynamic-item')].map((div) => ({
      id: div.dataset.id || null,
      alias: div.querySelector('.dom-alias').value.trim(),
      calle: div.querySelector('.dom-calle').value.trim(),
      cp: div.querySelector('.dom-cp').value.trim(),
      ciudad: div.querySelector('.dom-ciudad').value.trim(),
    }));
  }

  // Valida los campos antes de mandar la petición.
  function validar(datos, domicilios) {
    if (!/^\d{7}$/.test(datos.codigo)) {
      return 'El código debe tener exactamente 7 dígitos.';
    }
    if (!datos.nombre) {
      return 'El nombre es obligatorio.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email)) {
      return 'El email no es válido.';
    }
    if (datos.telefono && !/^[6-9]\d{8}$/.test(datos.telefono.replace(/\s/g, ''))) {
      return 'El teléfono no es válido (9 dígitos, empieza por 6-9).';
    }
    if (!datos.horarioInicio || !datos.horarioFin) {
      return 'Los horarios de visita son obligatorios.';
    }
    if (datos.horarioFin <= datos.horarioInicio) {
      return 'El horario de fin debe ser posterior al de inicio.';
    }
    if (domicilios.length === 0) {
      return 'Añade al menos un domicilio.';
    }
    for (const domicilio of domicilios) {
      if (!domicilio.calle) {
        return 'La dirección del domicilio es obligatoria.';
      }
      if (!/^\d{5}$/.test(domicilio.cp)) {
        return 'El CP del domicilio debe tener 5 dígitos.';
      }
    }
    return null;
  }

  // Obtiene el token de sesión actual.
  async function getSessionToken() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session?.access_token || null;
  }

  // Carga la ficha del cliente cuando estamos editando.
  async function cargarCliente() {
    setLoading(true, 'Cargando cliente', 'Estamos preparando la ficha del cliente.');

    try {
      const token = await getSessionToken();
      if (!token) {
        mostrarError('Sesión expirada. Vuelve a iniciar sesión.');
        return false;
      }

      const response = await fetch(`${BACKEND}/api/clients/${clienteId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await response.json();
      if (!response.ok) {
        mostrarError(json.error || 'No se pudo cargar el cliente.');
        return false;
      }

      const { cliente, domicilios } = json;
      pageTitle.textContent = '👁️ Ficha de cliente';
      codigoInput.value = cliente.codigo || '';
      codigoInput.readOnly = true;
      document.getElementById('nombre').value = cliente.nombre || '';
      document.getElementById('email').value = cliente.email || '';
      document.getElementById('telefono').value = cliente.telefono || '';
      document.getElementById('horarioInicio').value = cliente.horario_inicio || '';
      document.getElementById('horarioFin').value = cliente.horario_fin || '';
      btnGuardarText.textContent = '💾 Guardar cambios';
      btnEliminar.classList.remove('hidden');

      domiciliosCont.innerHTML = '';
      domicilioCount = 0;
      (domicilios || []).forEach((domicilio) => addDomicilio(domicilio));
      if ((domicilios || []).length === 0) {
        addDomicilio();
      }

      return true;
    } finally {
      setLoading(false);
    }
  }

  // Guarda el cliente, creando o actualizando según toque.
  async function guardarCliente() {
    clearError();

    const datos = {
      codigo: codigoInput.value.trim(),
      nombre: document.getElementById('nombre').value.trim(),
      email: document.getElementById('email').value.trim(),
      telefono: document.getElementById('telefono').value.trim(),
      horarioInicio: document.getElementById('horarioInicio').value,
      horarioFin: document.getElementById('horarioFin').value,
    };

    const domicilios = recogerDomicilios();
    const error = validar(datos, domicilios);
    if (error) {
      mostrarError(error);
      return;
    }

    setLoading(true, isEditMode ? 'Guardando cliente' : 'Creando cliente', 'Por favor, espera un momento.');

    try {
      const token = await getSessionToken();
      if (!token) {
        mostrarError('Sesión expirada. Vuelve a iniciar sesión.');
        return;
      }

      const response = await fetch(
        isEditMode ? `${BACKEND}/api/clients/${clienteId}` : `${BACKEND}/api/clients`,
        {
          method: isEditMode ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            codigo: datos.codigo,
            nombre: datos.nombre,
            email: datos.email,
            telefono: datos.telefono,
            horario_inicio: datos.horarioInicio,
            horario_fin: datos.horarioFin,
            domicilios,
          }),
        }
      );

      const json = await response.json();
      if (!response.ok) {
        mostrarError(json.error || 'Error al guardar el cliente.');
        return;
      }

      showSuccessModal(
        isEditMode ? 'Cliente actualizado' : 'Cliente creado',
        isEditMode
        ? `Los cambios de "${datos.nombre}" se guardaron correctamente.`
          : `El cliente "${datos.nombre}" ha sido registrado correctamente.`,
        'Ir al listado'
      );
    } catch (error) {
      mostrarError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  }

  async function confirmarEliminacion() {
    if (deleteInFlight) {
      return;
    }

    hideDeleteModal();
    deleteInFlight = true;
    setLoading(true, 'Eliminando cliente', 'Por favor, espera un momento.');

    try {
      const token = await getSessionToken();
      if (!token) {
        mostrarError('Sesión expirada. Vuelve a iniciar sesión.');
        return;
      }

      const response = await fetch(`${BACKEND}/api/clients/${clienteId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await response.json();
      if (!response.ok) {
        mostrarError(json.error || 'No se pudo eliminar el cliente.');
        return;
      }

      showSuccessModal('Cliente eliminado', 'El cliente se ha eliminado correctamente.', 'Volver al listado');
    } catch (error) {
      mostrarError('Error de conexión con el servidor.');
    } finally {
      deleteInFlight = false;
      setLoading(false);
    }
  }

  btnAddDomicilio.addEventListener('click', () => addDomicilio());
  btnGuardar.addEventListener('click', guardarCliente);
  btnEliminar.addEventListener('click', showDeleteModal);
  clientDeleteCancel.addEventListener('click', hideDeleteModal);
  clientDeleteConfirm.addEventListener('click', confirmarEliminacion);
  btnModalOk.addEventListener('click', () => {
    window.location.href = 'clientes.html';
  });
  clientDeleteModal.addEventListener('click', (event) => {
    if (event.target === clientDeleteModal) {
      hideDeleteModal();
    }
  });
  modalExito.addEventListener('click', (event) => {
    if (event.target === modalExito) {
      hideModal(modalExito);
      window.location.href = 'clientes.html';
    }
  });

  if (isEditMode) {
    pageTitle.textContent = '⏳ Cargando cliente...';
    btnGuardarText.textContent = '💾 Guardar cambios';
    cargarCliente().then((loaded) => {
      if (!loaded) {
        btnEliminar.classList.add('hidden');
      }
    });
  } else {
    addDomicilio();
  }
}
