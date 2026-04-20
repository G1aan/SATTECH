// ============================================================
// tecnico.js — Lógica del formulario Crear Técnico
// ============================================================

function initCrearTecnico() {

  const BACKEND = '/api';
  const tecnicoId = new URLSearchParams(window.location.search).get('id');
  const isEditMode = Boolean(tecnicoId);

  // Elementos principales del formulario.
  const pageTitle         = document.getElementById('pageTitle');
  const formAlert         = document.getElementById('formAlert');
  const cpInput           = document.getElementById('cpInput');
  const btnAddCp          = document.getElementById('btnAddCp');
  const tagsContainer     = document.getElementById('tagsContainer');
  const btnGuardar        = document.getElementById('btnGuardar');
  const btnGuardarText    = document.getElementById('btnGuardarText');
  const btnGuardarSpinner = document.getElementById('btnGuardarSpinner');
  const modalExito        = document.getElementById('modalExito');
  const successTitle      = document.getElementById('successTitle');
  const successMessage    = document.getElementById('successMessage');
  const modalPassword     = document.getElementById('modalPassword');
  const successWarning    = document.getElementById('successWarning');
  const btnModalOk        = document.getElementById('btnModalOk');
  const emailInput        = document.getElementById('email');

  // CPs añadidos en memoria antes de guardar.
  const cpsArray = [];

  // Elimina el texto de ayuda cuando ya hay CPs.
  function limpiarPlaceholder() {
    const span = tagsContainer.querySelector('span');
    if (span) span.remove();
  }

  async function getSessionToken() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session?.access_token || null;
  }

  // Añade un CP válido como etiqueta visual.
  function addCp(valor) {
    valor = valor.trim().toUpperCase();
    if (!valor) return;

    // Validamos formato: 5 dígitos exactos o comodín con asterisco.
    const esExacto   = /^\d{5}$/.test(valor);
    const esComodin  = /^\d{1,4}\*$/.test(valor);

    if (!esExacto && !esComodin) {
      mostrarError('CP inválido. Usa 5 dígitos (28001) o comodín (08*).');
      return;
    }

    // Evita que un CP se repita.
    if (cpsArray.includes(valor)) {
      cpInput.value = '';
      return;
    }

    limpiarPlaceholder();
    cpsArray.push(valor);
    formAlert.classList.add('hidden');

    // Creamos la etiqueta visual.
    const tag = document.createElement('span');
    tag.className = `tag${esComodin ? ' tag-wildcard' : ''}`;
    tag.dataset.valor = valor;
    tag.innerHTML = `
      ${valor}
      <button type="button" class="tag-remove" title="Eliminar">✕</button>
    `;

    tag.querySelector('.tag-remove').addEventListener('click', () => {
      const i = cpsArray.indexOf(valor);
      if (i > -1) cpsArray.splice(i, 1);
      tag.remove();
      if (cpsArray.length === 0) {
        tagsContainer.innerHTML = `
          <span style="color:#cbd5e1;font-size:0.83rem;align-self:center;">
            Añade al menos un CP...
          </span>`;
      }
    });

    tagsContainer.appendChild(tag);
    cpInput.value = '';
    cpInput.focus();
  }

  btnAddCp.addEventListener('click', () => addCp(cpInput.value));
  cpInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addCp(cpInput.value); }
  });

  // Valida los datos antes de enviar.
  function validar(datos) {
    if (!datos.nombre) return 'El nombre es obligatorio.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email)) return 'El email no es válido.';
    if (!/^[6-9]\d{8}$/.test(datos.telefono.replace(/\s/g, '')))
      return 'El teléfono no es válido (9 dígitos, empieza por 6-9).';
    if (cpsArray.length === 0) return 'Añade al menos un código postal de cobertura.';
    return null;
  }

  // Muestra el error en el formulario.
  function mostrarError(msg) {
    formAlert.textContent = msg;
    formAlert.className = 'form-alert error';
    formAlert.classList.remove('hidden');
    formAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function cargarTecnico() {
    const token = await getSessionToken();
    if (!token) {
      mostrarError('Sesión expirada. Vuelve a iniciar sesión.');
      return;
    }

    const response = await fetch(`${BACKEND}/api/technicians/${tecnicoId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await response.json();
    if (!response.ok) {
      mostrarError(json.error || 'No se pudo cargar el técnico.');
      return;
    }

    const tecnico = json.tecnico;
    pageTitle.textContent = '✏️ Editar técnico';
    document.querySelector('main h2').textContent = '✏️ Editar técnico';
    btnGuardarText.textContent = '💾 Guardar cambios';
    emailInput.value = tecnico.email || '';
    emailInput.readOnly = true;
    document.getElementById('nombre').value = tecnico.nombre || '';
    document.getElementById('telefono').value = tecnico.telefono || '';
    cpsArray.length = 0;
    tagsContainer.innerHTML = '';
    for (const cp of (tecnico.codigos_postales || [])) {
      addCp(cp);
    }
  }

  // Envía el técnico al backend.
  btnGuardar.addEventListener('click', async () => {
    formAlert.classList.add('hidden');

    const datos = {
      nombre  : document.getElementById('nombre').value.trim(),
      email   : document.getElementById('email').value.trim(),
      telefono: document.getElementById('telefono').value.trim(),
    };

    const error = validar(datos);
    if (error) { mostrarError(error); return; }

    btnGuardar.disabled        = true;
    btnGuardarText.textContent = isEditMode ? 'Guardando...' : 'Creando...';
    btnGuardarSpinner.classList.remove('hidden');

    try {
      const token = await getSessionToken();
      if (!token) {
        mostrarError('Sesión expirada. Vuelve a iniciar sesión.');
        return;
      }

      const res = await fetch(`${BACKEND}/api/technicians${isEditMode ? `/${tecnicoId}` : ''}`, {
        method : isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type' : 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre            : datos.nombre,
          email             : datos.email,
          telefono          : datos.telefono,
          codigos_postales  : cpsArray,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        mostrarError(json.error || (isEditMode ? 'Error al actualizar el técnico.' : 'Error al crear el técnico.'));
        return;
      }

      if (isEditMode) {
        successTitle.textContent = 'Técnico actualizado';
        successMessage.textContent = 'Los cambios se han guardado correctamente.';
        modalPassword.textContent = '—';
        modalPassword.classList.add('hidden');
        successWarning.classList.add('hidden');
        btnModalOk.textContent = 'Volver al listado';
      } else {
        successTitle.textContent = 'Técnico creado';
        successMessage.textContent = 'Comparte esta contraseña temporal con el técnico para su primer acceso:';
        modalPassword.textContent = json.password_temporal;
        modalPassword.classList.remove('hidden');
        successWarning.classList.remove('hidden');
        btnModalOk.textContent = 'Entendido, ir al inicio';
      }

      modalExito.classList.remove('hidden');

    } catch (e) {
      mostrarError('Error de conexión con el servidor.');
    } finally {
      btnGuardar.disabled        = false;
      btnGuardarText.textContent = isEditMode ? '💾 Guardar cambios' : '✅ Crear Técnico';
      btnGuardarSpinner.classList.add('hidden');
    }
  });

  btnModalOk.addEventListener('click', () => {
    window.location.href = isEditMode ? 'tecnicos.html' : '../home.html';
  });

  if (isEditMode) {
    emailInput.readOnly = true;
    btnGuardarText.textContent = '💾 Guardar cambios';
    pageTitle.textContent = '✏️ Editar técnico';
    document.querySelector('main h2').textContent = '✏️ Editar técnico';
    modalPassword.classList.add('hidden');
    successWarning.classList.add('hidden');
    cargarTecnico();
  }
}
