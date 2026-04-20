// ============================================================
// sat-view.js — Lógica del detalle del SAT
// ============================================================

function initSatView() {
  const BACKEND = '';
  const params = new URLSearchParams(window.location.search);
  const satId = params.get('id');

  const title = document.getElementById('satViewTitle');
  const subtitle = document.getElementById('satViewSubtitle');
  const alertBox = document.getElementById('satViewAlert');
  const rows = document.getElementById('satDetailRows');
  const summaryNumero = document.getElementById('sumNumeroSat');
  const summaryEstado = document.getElementById('sumEstado');
  const summaryCliente = document.getElementById('sumCliente');
  const summaryTecnico = document.getElementById('sumTecnico');
  const actionsBox = document.getElementById('satViewActions');
  const signaturePreviewPanel = document.getElementById('signaturePreviewPanel');
  const signaturePreviewImage = document.getElementById('signaturePreviewImage');
  const finishModalOverlay = document.getElementById('finishModalOverlay');
  const finishModalClose = document.getElementById('finishModalClose');
  const finishModalCancel = document.getElementById('finishModalCancel');
  const finishModalConfirm = document.getElementById('finishModalConfirm');
  const finishModalText = document.getElementById('finishModalText');
  const finishModalSpinner = document.getElementById('finishModalSpinner');
  const closingComment = document.getElementById('closingComment');
  const clearSignatureBtn = document.getElementById('clearSignatureBtn');
  const signatureCanvas = document.getElementById('signatureCanvas');
  const signatureContext = signatureCanvas.getContext('2d');

  let currentUser = null;
  let currentSat = null;
  let drawing = false;
  let hasSignature = false;

  // Muestra un mensaje de error visible para el usuario.
  function showError(message) {
    alertBox.textContent = message;
    alertBox.classList.remove('hidden');
  }

  // Limpia cualquier error anterior.
  function clearError() {
    alertBox.textContent = '';
    alertBox.classList.add('hidden');
  }

  // Obtiene el token de sesión para la petición privada.
  async function getSessionToken() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session?.access_token || null;
  }

  // Normaliza valores simples y listas para la tabla.
  function formatValue(value) {
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : '—';
    }

    if (value === null || value === undefined || value === '') {
      return '—';
    }

    return String(value);
  }

  // Formatea fechas en formato local legible.
  function formatDate(value) {
    if (!value) {
      return '—';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('es-ES');
  }

  // Añade una fila al detalle principal.
  function addRow(label, value, type = 'text') {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <th scope="row">${label}</th>
      <td>${type === 'date' ? formatDate(value) : formatValue(value)}</td>
    `;
    rows.appendChild(tr);
  }

  // Limpia el canvas de firma.
  function clearSignature() {
    signatureContext.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
    signatureContext.fillStyle = '#ffffff';
    signatureContext.fillRect(0, 0, signatureCanvas.width, signatureCanvas.height);
    hasSignature = false;
  }

  // Captura la posición real del puntero dentro del canvas.
  function getPointerPosition(event) {
    const rect = signatureCanvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (signatureCanvas.width / rect.width),
      y: (event.clientY - rect.top) * (signatureCanvas.height / rect.height),
    };
  }

  function startDrawing(event) {
    drawing = true;
    signatureContext.beginPath();
    const { x, y } = getPointerPosition(event);
    signatureContext.moveTo(x, y);
  }

  function draw(event) {
    if (!drawing) {
      return;
    }

    const { x, y } = getPointerPosition(event);
    signatureContext.lineTo(x, y);
    signatureContext.lineWidth = 2.5;
    signatureContext.lineCap = 'round';
    signatureContext.lineJoin = 'round';
    signatureContext.strokeStyle = '#0f172a';
    signatureContext.stroke();
    hasSignature = true;
  }

  function stopDrawing() {
    drawing = false;
  }

  // Abre el modal de cierre dejando la firma limpia.
  function openFinishModal() {
    closingComment.value = '';
    clearSignature();
    finishModalOverlay.classList.remove('hidden');
  }

  function closeFinishModal() {
    finishModalOverlay.classList.add('hidden');
    finishModalText.textContent = 'Finalizar SAT';
    finishModalSpinner.classList.add('hidden');
    finishModalConfirm.disabled = false;
  }

  // Decide si el usuario puede usar las acciones de técnico.
  function canManageSat() {
    if (!currentUser || !currentSat) {
      return false;
    }

    if (currentUser.role === 'admin') {
      return true;
    }

    return currentSat.tecnico_id === currentUser.user.id;
  }

  function isSatStarted() {
    if (!currentSat) {
      return false;
    }

    return currentSat.estado === 'en_progreso' || Boolean(currentSat.fecha_inicio);
  }

  function renderActions() {
    actionsBox.innerHTML = '';

    const backLink = document.createElement('a');
    backLink.href = currentUser?.role === 'technician' ? 'mis-sats.html' : 'sats.html';
    backLink.className = 'btn-secondary';
    backLink.textContent = '← Volver al listado';
    actionsBox.appendChild(backLink);

    if (!currentSat || !canManageSat()) {
      return;
    }

    const startButton = document.createElement('button');
    startButton.type = 'button';
    startButton.className = 'btn-primary';
    startButton.textContent = 'Iniciar SAT';
    startButton.disabled = currentSat.estado === 'acabado' || isSatStarted();
    startButton.addEventListener('click', iniciarSat);
    actionsBox.appendChild(startButton);

    const finishButton = document.createElement('button');
    finishButton.type = 'button';
    finishButton.className = 'btn-primary';
    finishButton.textContent = 'Finalizar SAT';
    finishButton.disabled = currentSat.estado === 'acabado' || !isSatStarted();
    finishButton.addEventListener('click', openFinishModal);
    actionsBox.appendChild(finishButton);
  }

  function renderSatDetail(sat) {
    currentSat = sat;
    rows.innerHTML = '';

    title.textContent = sat.numero_sat || 'Detalle del SAT';
    subtitle.textContent = `${sat.cliente_nombre || 'Sin cliente'} · ${sat.estado || 'Sin estado'}`;
    summaryNumero.textContent = sat.numero_sat || '—';
    summaryEstado.textContent = sat.estado || '—';
    summaryCliente.textContent = sat.cliente_nombre || '—';
    summaryTecnico.textContent = sat.tecnico_nombre || '—';

    addRow('Número SAT', sat.numero_sat);
    addRow('Estado', sat.estado);
    addRow('Cliente', sat.cliente_nombre);
    addRow('Cliente ID', sat.cliente_id);
    addRow('Domicilio', sat.domicilio_dir);
    addRow('Domicilio ID', sat.domicilio_id);
    addRow('Fecha programada', sat.fecha_programada, 'date');
    addRow('Fecha de creación', sat.fecha_creacion, 'date');
    addRow('Hora inicio', sat.horario_inicio);
    addRow('Hora fin', sat.horario_fin);
    addRow('Fecha inicio real', sat.fecha_inicio, 'date');
    addRow('Fecha cierre', sat.fecha_cierre, 'date');
    addRow('Técnico asignado', sat.tecnico_nombre);
    addRow('Técnico asignado ID', sat.tecnico_id);
    addRow('Técnico que cerró', sat.tecnico_cierre_nombre);
    addRow('Comentario de cierre', sat.comentario_cierre);
    addRow('Días disponibles', sat.dias_disponibles);
    addRow('Reparaciones', sat.reparaciones);
    addRow('Tipo de instalación', sat.instalacion_tipo);
    addRow('Código de producto', sat.instalacion_codigo);
    addRow('Revisiones', sat.revisiones);
    addRow('Zonas', sat.zonas);
    addRow('Descripción', sat.descripcion);
    addRow('Firma del cliente', sat.firma_cliente ? 'Disponible' : 'Pendiente');

    if (sat.firma_cliente) {
      signaturePreviewImage.src = sat.firma_cliente;
      signaturePreviewPanel.classList.remove('hidden');
    } else {
      signaturePreviewImage.removeAttribute('src');
      signaturePreviewPanel.classList.add('hidden');
    }

    renderActions();
  }

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
      user: json.user,
    };
  }

  async function cargarSat() {
    clearError();

    if (!satId) {
      showError('Falta el identificador del SAT.');
      subtitle.textContent = 'No se pudo cargar la ficha.';
      return;
    }

    currentUser = await loadCurrentUser();
    if (!currentUser) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND}/api/sats/${satId}`, {
        headers: {
          Authorization: `Bearer ${currentUser.token}`,
        },
      });

      const json = await response.json();
      if (!response.ok) {
        showError(json.error || 'No se pudo cargar el SAT.');
        subtitle.textContent = 'No se pudo cargar la ficha.';
        return;
      }

      renderSatDetail(json.sat);
    } catch (error) {
      showError('Error de conexión con el servidor.');
      subtitle.textContent = 'No se pudo cargar la ficha.';
    }
  }

  async function iniciarSat() {
    try {
      const response = await fetch(`${BACKEND}/api/sats/${satId}/start`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentUser.token}`,
        },
      });

      const json = await response.json();
      if (!response.ok) {
        showError(json.error || 'No se pudo iniciar el SAT.');
        return;
      }

      await cargarSat();
    } catch (error) {
      showError('Error de conexión con el servidor.');
    }
  }

  async function finalizarSat() {
    if (!hasSignature) {
      showError('La firma del cliente es obligatoria.');
      return;
    }

    finishModalText.textContent = 'Finalizando...';
    finishModalSpinner.classList.remove('hidden');
    finishModalConfirm.disabled = true;

    try {
      const response = await fetch(`${BACKEND}/api/sats/${satId}/finish`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firma_cliente: signatureCanvas.toDataURL('image/png'),
          comentario_cierre: closingComment.value.trim(),
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        showError(json.error || 'No se pudo finalizar el SAT.');
        return;
      }

      closeFinishModal();
      await cargarSat();
    } catch (error) {
      showError('Error de conexión con el servidor.');
    } finally {
      finishModalText.textContent = 'Finalizar SAT';
      finishModalSpinner.classList.add('hidden');
      finishModalConfirm.disabled = false;
    }
  }

  finishModalClose.addEventListener('click', closeFinishModal);
  finishModalCancel.addEventListener('click', closeFinishModal);
  finishModalOverlay.addEventListener('click', (event) => {
    if (event.target === finishModalOverlay) {
      closeFinishModal();
    }
  });
  finishModalConfirm.addEventListener('click', finalizarSat);
  clearSignatureBtn.addEventListener('click', clearSignature);

  signatureCanvas.addEventListener('pointerdown', startDrawing);
  signatureCanvas.addEventListener('pointermove', draw);
  signatureCanvas.addEventListener('pointerup', stopDrawing);
  signatureCanvas.addEventListener('pointerleave', stopDrawing);
  signatureCanvas.addEventListener('pointercancel', stopDrawing);

  clearSignature();
  cargarSat();
}
