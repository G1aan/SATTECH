// ============================================================
// sat.js — Lógica del formulario Crear SAT
// ============================================================

async function initSat() {
  const BACKEND = 'http://localhost:3000';

  const { data: sessionData } = await supabaseClient.auth.getSession();
  const session = sessionData?.session;

  if (!session) {
    window.location.href = '../index.html';
    return;
  }

  const token = session.access_token;

  const response = await fetch(`${BACKEND}/api/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    window.location.href = '../index.html';
    return;
  }

  const user = await response.json();
  if (user.role === 'technician') {
    window.location.href = 'mis-sats.html';
    return;
  }

  const clienteSelect = document.getElementById('clienteSelect');
  const domicilioSelect = document.getElementById('domicilioSelect');
  const fechaProgramada = document.getElementById('fechaProgramada');
  const historialBox = document.getElementById('historialBox');
  const historialLista = document.getElementById('historialLista');
  const horarioInicio = document.getElementById('horarioInicio');
  const horarioFin = document.getElementById('horarioFin');
  const descripcion = document.getElementById('descripcion');
  const tabError = document.getElementById('tabError');
  const cpInfo = document.getElementById('cpInfo');
  const tecnicoSelect = document.getElementById('tecnicoSelect');
  const btnSiguiente = document.getElementById('btnSiguiente');
  const btnAnterior = document.getElementById('btnAnterior');
  const btnCrearSat = document.getElementById('btnCrearSat');
  const step1El = document.getElementById('step1');
  const step2El = document.getElementById('step2');
  const tab1El = document.getElementById('tab1');
  const tab2El = document.getElementById('tab2');
  const modalOverlay = document.getElementById('modalOverlay');
  const modalClose = document.getElementById('modalClose');
  const modalCancelar = document.getElementById('modalCancelar');
  const modalConfirmar = document.getElementById('modalConfirmar');
  const modalSatNum = document.getElementById('modalSatNum');
  const modalBtnText = document.getElementById('modalBtnText');
  const modalSpinner = document.getElementById('modalSpinner');

  const summaryFecha = document.getElementById('sumFechaProgramada');

  function mostrarError(mensaje) {
    tabError.textContent = mensaje;
    tabError.classList.remove('hidden');
  }

  function ocultarError() {
    tabError.textContent = '';
    tabError.classList.add('hidden');
  }

  function formatearFecha(valor) {
    if (!valor) {
      return '—';
    }

    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime()) ? valor : fecha.toLocaleDateString('es-ES');
  }

  async function cargarClientes() {
    const { data, error } = await supabaseClient
      .from('clientes')
      .select('id, nombre')
      .order('nombre');

    if (error) {
      mostrarError('No se pudieron cargar los clientes.');
      return;
    }

    data.forEach((cliente) => {
      const option = document.createElement('option');
      option.value = cliente.id;
      option.textContent = cliente.nombre;
      clienteSelect.appendChild(option);
    });
  }

  clienteSelect.addEventListener('change', async () => {
    const clienteId = clienteSelect.value;
    domicilioSelect.innerHTML = '<option value="">— Selecciona un domicilio —</option>';
    domicilioSelect.disabled = true;
    historialBox.classList.add('hidden');
    cpInfo.value = '';
    tecnicoSelect.innerHTML = '<option value="">— Selecciona un técnico —</option>';

    if (!clienteId) {
      return;
    }

    const { data: domicilios, error: domiciliosError } = await supabaseClient
      .from('domicilios')
      .select('id, direccion, codigo_postal')
      .eq('cliente_id', clienteId)
      .order('direccion');

    if (domiciliosError) {
      mostrarError('No se pudieron cargar los domicilios.');
      return;
    }

    domicilios.forEach((domicilio) => {
      const option = document.createElement('option');
      option.value = domicilio.id;
      option.dataset.cp = domicilio.codigo_postal || '';
      option.textContent = domicilio.direccion;
      domicilioSelect.appendChild(option);
    });

    domicilioSelect.disabled = domicilios.length === 0;

    const { data: sats, error: satsError } = await supabaseClient
      .from('sats')
      .select('numero_sat, estado, fecha_creacion')
      .eq('cliente_id', clienteId)
      .order('fecha_creacion', { ascending: false })
      .limit(5);

    if (satsError) {
      return;
    }

    if (sats.length > 0) {
      historialLista.innerHTML = sats
        .map((sat) => {
          return `<div style="padding:6px 0;border-bottom:1px solid #f1f5f9;">
            <strong>${sat.numero_sat}</strong>
            <span style="color:#64748b;font-size:0.8rem;"> — ${sat.estado} — ${new Date(sat.fecha_creacion).toLocaleDateString('es-ES')}</span>
          </div>`;
        })
        .join('');
      historialBox.classList.remove('hidden');
    }
  });

  domicilioSelect.addEventListener('change', async () => {
    const option = domicilioSelect.selectedOptions[0];
    const cp = option?.dataset?.cp || '';
    cpInfo.value = cp;
    tecnicoSelect.innerHTML = '<option value="">— Selecciona un técnico —</option>';

    if (!cp) {
      return;
    }

    const { data: tecnicos, error: tecnicosError } = await supabaseClient
      .from('tecnicos')
      .select('id, nombre')
      .contains('codigos_postales', [cp]);

    if (tecnicosError) {
      return;
    }

    tecnicos.forEach((tecnico) => {
      const option = document.createElement('option');
      option.value = tecnico.id;
      option.textContent = tecnico.nombre;
      tecnicoSelect.appendChild(option);
    });

    if (tecnicos.length === 1) {
      tecnicoSelect.value = tecnicos[0].id;
    }
  });

  btnSiguiente.addEventListener('click', () => {
    if (!validarTab1()) {
      return;
    }

    tab1El.classList.remove('active');
    tab2El.classList.add('active');
    step1El.classList.remove('active');
    step1El.classList.add('done');
    step2El.classList.add('active');
    ocultarError();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  btnAnterior.addEventListener('click', () => {
    tab2El.classList.remove('active');
    tab1El.classList.add('active');
    step2El.classList.remove('active');
    step1El.classList.remove('done');
    step1El.classList.add('active');
    ocultarError();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  function validarTab1() {
    const errores = [];

    if (!clienteSelect.value) {
      errores.push('Debes seleccionar un cliente.');
    }

    if (!domicilioSelect.value) {
      errores.push('Debes seleccionar un domicilio.');
    }

    if (!fechaProgramada.value) {
      errores.push('Debes indicar la fecha programada.');
    }

    if (!horarioInicio.value) {
      errores.push('Indica el horario de inicio.');
    }

    if (!horarioFin.value) {
      errores.push('Indica el horario de fin.');
    }

    const diasSeleccionados = [...document.querySelectorAll('.day-chip:checked')];
    if (diasSeleccionados.length === 0) {
      errores.push('Selecciona al menos un día disponible.');
    }

    if (horarioInicio.value && horarioFin.value && horarioFin.value <= horarioInicio.value) {
      errores.push('El horario de fin debe ser posterior al de inicio.');
    }

    if (errores.length > 0) {
      mostrarError(errores[0]);
      tabError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }

    return true;
  }

  btnCrearSat.addEventListener('click', () => {
    if (!validarTab1()) {
      return;
    }

    const hoy = new Date();
    const fecha = hoy.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = String(Math.floor(Math.random() * 900) + 100);
    const numSat = `SAT-${fecha}-${rand}`;
    modalSatNum.textContent = numSat;

    document.getElementById('sumCliente').textContent = clienteSelect.selectedOptions[0]?.textContent || '—';
    document.getElementById('sumDomicilio').textContent = domicilioSelect.selectedOptions[0]?.textContent || '—';
    summaryFecha.textContent = formatearFecha(fechaProgramada.value);
    document.getElementById('sumTecnico').textContent = tecnicoSelect.selectedOptions[0]?.textContent || '—';
    document.getElementById('sumHorario').textContent = `${horarioInicio.value} – ${horarioFin.value}`;

    const dias = [...document.querySelectorAll('.day-chip:checked')].map((dia) => dia.value);
    document.getElementById('sumDias').textContent = dias.join(', ') || '—';

    const reparaciones = [...document.querySelectorAll('[name="rep"]:checked')].map((rep) => rep.value);
    document.getElementById('sumReparaciones').textContent = reparaciones.join(', ') || 'Ninguna';

    const tipoDosificador = document.getElementById('tipoDosificador').value;
    const codigoProducto = document.getElementById('codigoProducto').value;
    document.getElementById('sumInstalacion').textContent = tipoDosificador
      ? `${tipoDosificador}${codigoProducto ? ` — ${codigoProducto}` : ''}`
      : 'Ninguna';

    const revisiones = [...document.querySelectorAll('[name="rev"]:checked')].map((rev) => rev.value);
    document.getElementById('sumRevisiones').textContent = revisiones.join(', ') || 'Ninguna';

    const zonas = [...document.querySelectorAll('[name="zona"]:checked')].map((zona) => zona.value);
    document.getElementById('sumZonas').textContent = zonas.join(', ') || 'Ninguna';

    modalConfirmar.dataset.numSat = numSat;
    modalOverlay.classList.remove('hidden');
  });

  function cerrarModal() {
    modalOverlay.classList.add('hidden');
    modalBtnText.textContent = 'Confirmar y crear';
    modalSpinner.classList.add('hidden');
    modalConfirmar.disabled = false;
  }

  modalClose.addEventListener('click', cerrarModal);
  modalCancelar.addEventListener('click', cerrarModal);
  modalOverlay.addEventListener('click', (event) => {
    if (event.target === modalOverlay) {
      cerrarModal();
    }
  });

  modalConfirmar.addEventListener('click', async () => {
    modalBtnText.textContent = 'Creando...';
    modalSpinner.classList.remove('hidden');
    modalConfirmar.disabled = true;

    const numeroSat = modalConfirmar.dataset.numSat;
    const reparaciones = [...document.querySelectorAll('[name="rep"]:checked')].map((rep) => rep.value);
    const revisiones = [...document.querySelectorAll('[name="rev"]:checked')].map((rev) => rev.value);
    const zonas = [...document.querySelectorAll('[name="zona"]:checked')].map((zona) => zona.value);
    const dias = [...document.querySelectorAll('.day-chip:checked')].map((dia) => dia.value);

    const payload = {
      numero_sat: numeroSat,
      cliente_id: clienteSelect.value,
      cliente_nombre: clienteSelect.selectedOptions[0]?.textContent || null,
      domicilio_id: domicilioSelect.value,
      domicilio_dir: domicilioSelect.selectedOptions[0]?.textContent || null,
      fecha_programada: fechaProgramada.value,
      tecnico_id: tecnicoSelect.value || null,
      tecnico_nombre: tecnicoSelect.selectedOptions[0]?.textContent || null,
      horario_inicio: horarioInicio.value,
      horario_fin: horarioFin.value,
      dias_disponibles: dias,
      descripcion: descripcion.value.trim() || null,
      reparaciones,
      instalacion_tipo: document.getElementById('tipoDosificador').value || null,
      instalacion_codigo: document.getElementById('codigoProducto').value.trim() || null,
      revisiones,
      zonas,
      estado: 'pendiente',
    };

    const createResponse = await fetch(`${BACKEND}/api/sats`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const createJson = await createResponse.json();

    if (!createResponse.ok) {
      cerrarModal();
      mostrarError(createJson.error || 'Error al crear el SAT.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    window.location.href = 'sats.html';
  });

  await cargarClientes();
}
