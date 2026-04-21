require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Cliente administrativo para hablar con Supabase desde el backend.
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE,
);

// Middleware básico de la API y estáticos del frontend.
app.use(express.json());
app.use(cors({ origin: '*' }));
app.use(express.static(path.join(__dirname, '../frontend')));

// Extrae el token Bearer enviado por el frontend.
function getBearerToken(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }
  return header.slice(7);
}

// Comprueba que el usuario esté autenticado antes de entrar en la API.
async function requireAuth(req, res, next) {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'No autorizado.' });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }

  req.user = data.user;
  next();
}

// Normaliza el teléfono: vacío => null.
function normalizeTelefono(value) {
  const telefono = typeof value === 'string' ? value.trim() : '';
  return telefono.length > 0 ? telefono : null;
}

let satDateColumnPromise = null;
let satStartColumnPromise = null;
const satColumnCache = new Map();

async function hasSatColumn(column) {
  if (satColumnCache.has(column)) {
    return satColumnCache.get(column);
  }

  const { error } = await supabaseAdmin
    .from('sats')
    .select(column)
    .limit(1);

  if (!error) {
    satColumnCache.set(column, true);
    return true;
  }

  const message = String(error.message || '').toLowerCase();
  if (message.includes('does not exist') || message.includes('could not find')) {
    satColumnCache.set(column, false);
    return false;
  }

  throw error;
}

async function resolveSatDateColumn() {
  if (!satDateColumnPromise) {
    satDateColumnPromise = (async () => {
      const candidates = ['fecha_programada', 'fecha_programa'];

      for (const column of candidates) {
        if (await hasSatColumn(column)) {
          return column;
        }
      }

      return null;
    })();
  }

  return satDateColumnPromise;
}

async function resolveSatStartColumn() {
  if (!satStartColumnPromise) {
    satStartColumnPromise = (async () => {
      if (await hasSatColumn('fecha_inicio')) {
        return 'fecha_inicio';
      }

      return null;
    })();
  }

  return satStartColumnPromise;
}

function normalizeSatRow(sat) {
  if (!sat) {
    return sat;
  }

  const fechaProgramada = sat.fecha_programada || sat.fecha_programa || sat.fecha_creacion || null;

  return {
    ...sat,
    fecha_programada: fechaProgramada,
    fecha_programa: sat.fecha_programa || fechaProgramada,
  };
}

// Limpia y homogeneiza los datos de entrada del cliente.
function cleanClientInput(body) {
  return {
    codigo: typeof body.codigo === 'string' ? body.codigo.trim() : '',
    nombre: typeof body.nombre === 'string' ? body.nombre.trim() : '',
    email: typeof body.email === 'string' ? body.email.trim() : '',
    telefono: normalizeTelefono(body.telefono),
    horario_inicio: typeof body.horario_inicio === 'string' ? body.horario_inicio.trim() : '',
    horario_fin: typeof body.horario_fin === 'string' ? body.horario_fin.trim() : '',
    domicilios: Array.isArray(body.domicilios) ? body.domicilios : null,
  };
}

// Valida los datos comunes de cliente.
function validateClientInput(input, { requireCodigo = true } = {}) {
  if (requireCodigo && (!/^\d{7}$/.test(input.codigo))) {
    return 'El código debe tener exactamente 7 dígitos.';
  }

  if (!input.nombre) {
    return 'El nombre es obligatorio.';
  }

  if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    return 'El email no es válido.';
  }

  if (input.telefono && !/^[6-9]\d{8}$/.test(input.telefono.replace(/\s/g, ''))) {
    return 'El teléfono no es válido (9 dígitos, empieza por 6-9).';
  }

  if (!input.horario_inicio || !input.horario_fin) {
    return 'Los horarios de visita son obligatorios.';
  }

  if (input.horario_fin <= input.horario_inicio) {
    return 'El horario de fin debe ser posterior al de inicio.';
  }

  return null;
}

// Valida que el cliente tenga al menos un domicilio correcto.
function validateDomicilios(domicilios) {
  if (!Array.isArray(domicilios) || domicilios.length === 0) {
    return 'Añade al menos un domicilio.';
  }

  for (const domicilio of domicilios) {
    if (!domicilio || typeof domicilio !== 'object') {
      return 'Formato de domicilio no válido.';
    }
    if (!String(domicilio.calle || '').trim()) {
      return 'La dirección del domicilio es obligatoria.';
    }
    if (!/^\d{5}$/.test(String(domicilio.cp || '').trim())) {
      return 'El CP del domicilio debe tener 5 dígitos.';
    }
  }

  return null;
}

// Convierte el domicilio del formulario en el formato de la tabla.
function normalizeDomicilioPayload(domicilio, clienteId) {
  return {
    cliente_id: clienteId,
    alias: String(domicilio.alias || '').trim() || null,
    direccion: String(domicilio.calle || '').trim(),
    codigo_postal: String(domicilio.cp || '').trim(),
    ciudad: String(domicilio.ciudad || '').trim() || null,
  };
}

// Construye el listado de clientes mostrando el alias del primer domicilio.
function buildClientList(clientes, domicilios) {
  const domiciliosPorCliente = new Map();

  for (const domicilio of domicilios || []) {
    if (!domiciliosPorCliente.has(domicilio.cliente_id)) {
      domiciliosPorCliente.set(domicilio.cliente_id, []);
    }
    domiciliosPorCliente.get(domicilio.cliente_id).push(domicilio);
  }

  return (clientes || []).map((cliente) => {
    const primerDomicilio = domiciliosPorCliente.get(cliente.id)?.[0] || null;

    return {
      ...cliente,
      domicilio_alias: primerDomicilio?.alias || primerDomicilio?.direccion || null,
    };
  });
}

// Carga un cliente por ID junto a sus domicilios.
async function loadClientById(id) {
  const { data: cliente, error } = await supabaseAdmin
    .from('clientes')
    .select('id, codigo, nombre, email, telefono, horario_inicio, horario_fin')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return { error };
  }

  if (!cliente) {
    return { cliente: null };
  }

  const { data: domicilios, error: domiciliosError } = await supabaseAdmin
    .from('domicilios')
    .select('id, cliente_id, alias, direccion, codigo_postal, ciudad')
    .eq('cliente_id', id);

  if (domiciliosError) {
    return { error: domiciliosError };
  }

  return { cliente, domicilios: domicilios || [] };
}

// Carga un técnico por ID.
async function loadTechnicianById(id) {
  const { data: tecnico, error } = await supabaseAdmin
    .from('tecnicos')
    .select('id, nombre, email, telefono, codigos_postales')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return { error };
  }

  if (!tecnico) {
    return { tecnico: null };
  }

  return { tecnico };
}

// Carga un SAT por ID.
async function loadSatById(id) {
  const { data: sat, error } = await supabaseAdmin
    .from('sats')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return { error };
  }

  if (!sat) {
    return { sat: null };
  }

  return { sat: normalizeSatRow(sat) };
}

// Carga el contexto del usuario para distinguir técnico o administrador.
async function loadUserContext(userId) {
  const { data: tecnico, error } = await supabaseAdmin
    .from('tecnicos')
    .select('id, nombre, email, telefono, codigos_postales')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    return { error };
  }

  if (!tecnico) {
    return {
      role: 'admin',
      technician: null,
    };
  }

  return {
    role: 'technician',
    technician: tecnico,
  };
}

// Limpia los filtros de búsqueda de SATs.
function normalizeSearch(value) {
  return typeof value === 'string' ? value.trim() : '';
}

// Limpia los datos del formulario SAT.
function cleanSatInput(body) {
  const arrayField = (value) => (Array.isArray(value) ? value : []);
  const fechaProgramada = typeof body.fecha_programada === 'string'
    ? body.fecha_programada.trim()
    : (typeof body.fecha_programa === 'string' ? body.fecha_programa.trim() : '');

  return {
    numero_sat: typeof body.numero_sat === 'string' ? body.numero_sat.trim() : '',
    cliente_id: typeof body.cliente_id === 'string' ? body.cliente_id.trim() : '',
    cliente_nombre: typeof body.cliente_nombre === 'string' ? body.cliente_nombre.trim() : '',
    domicilio_id: typeof body.domicilio_id === 'string' ? body.domicilio_id.trim() : '',
    domicilio_dir: typeof body.domicilio_dir === 'string' ? body.domicilio_dir.trim() : '',
    tecnico_id: typeof body.tecnico_id === 'string' ? body.tecnico_id.trim() : '',
    tecnico_nombre: typeof body.tecnico_nombre === 'string' ? body.tecnico_nombre.trim() : '',
    fecha_programada: fechaProgramada,
    horario_inicio: typeof body.horario_inicio === 'string' ? body.horario_inicio.trim() : '',
    horario_fin: typeof body.horario_fin === 'string' ? body.horario_fin.trim() : '',
    descripcion: typeof body.descripcion === 'string' ? body.descripcion.trim() : '',
    reparaciones: arrayField(body.reparaciones),
    instalacion_tipo: typeof body.instalacion_tipo === 'string' ? body.instalacion_tipo.trim() : '',
    instalacion_codigo: typeof body.instalacion_codigo === 'string' ? body.instalacion_codigo.trim() : '',
    revisiones: arrayField(body.revisiones),
    zonas: arrayField(body.zonas),
    dias_disponibles: arrayField(body.dias_disponibles),
  };
}

// Valida los datos básicos del SAT al crear.
function validateSatInput(input) {
  if (!input.numero_sat) {
    return 'El número de SAT es obligatorio.';
  }

  if (!input.cliente_id || !input.cliente_nombre) {
    return 'El cliente es obligatorio.';
  }

  if (!input.domicilio_id || !input.domicilio_dir) {
    return 'El domicilio es obligatorio.';
  }

  if (!input.tecnico_id || !input.tecnico_nombre) {
    return 'El técnico es obligatorio.';
  }

  if (!input.fecha_programada) {
    return 'La fecha programada es obligatoria.';
  }

  if (!input.horario_inicio || !input.horario_fin) {
    return 'Los horarios del SAT son obligatorios.';
  }

  if (input.horario_fin <= input.horario_inicio) {
    return 'El horario de fin debe ser posterior al de inicio.';
  }

  return null;
}

// Devuelve true si el SAT pertenece al técnico autenticado.
function canAccessSatAsTechnician(sat, userId) {
  return sat?.tecnico_id === userId;
}

// Ruta de login: valida el token de Supabase.
app.post('/api/login', async (req, res) => {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado.' });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }

  const context = await loadUserContext(data.user.id);
  if (context.error) {
    return res.status(500).json({ error: context.error.message });
  }

  res.json({
    mensaje: 'Autenticado correctamente.',
    usuario: {
      id: data.user.id,
      email: data.user.email,
      role: context.role,
      technician_id: context.technician?.id || null,
    },
  });
});

// Información de la sesión actual y tipo de usuario.
app.get('/api/me', requireAuth, async (req, res) => {
  const context = await loadUserContext(req.user.id);
  if (context.error) {
    return res.status(500).json({ error: context.error.message });
  }

  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
    },
    role: context.role,
    technician: context.technician,
  });
});

// Clientes: listado completo.
app.get('/api/clients', requireAuth, async (req, res) => {
  try {
    const { data: clientes, error: clientesError } = await supabaseAdmin
      .from('clientes')
      .select('id, codigo, nombre, email, telefono, horario_inicio, horario_fin')
      .order('nombre', { ascending: true });

    if (clientesError) {
      console.error('Error listing clients:', clientesError);
      return res.status(500).json({ error: clientesError.message });
    }

    const { data: domicilios, error: domiciliosError } = await supabaseAdmin
      .from('domicilios')
      .select('id, cliente_id, alias, direccion, codigo_postal, ciudad');

    if (domiciliosError) {
      console.error('Error loading client domicilios:', domiciliosError);
      return res.status(500).json({ error: domiciliosError.message });
    }

    res.json({ clientes: buildClientList(clientes, domicilios) });
  } catch (error) {
    console.error('Unexpected error listing clients:', error);
    res.status(500).json({ error: 'No se pudieron cargar los clientes.' });
  }
});

// Clientes: detalle completo con domicilios.
app.get('/api/clients/:id', requireAuth, async (req, res) => {
  try {
    const { cliente, domicilios, error } = await loadClientById(req.params.id);

    if (error) {
      console.error('Error loading client detail:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }

    res.json({ cliente, domicilios });
  } catch (error) {
    console.error('Unexpected error loading client detail:', error);
    res.status(500).json({ error: 'No se pudo cargar el cliente.' });
  }
});

// Clientes: alta nueva.
app.post('/api/clients', requireAuth, async (req, res) => {
  try {
    const input = cleanClientInput(req.body || {});
    const errorMsg = validateClientInput(input);
    if (errorMsg) {
      return res.status(400).json({ error: errorMsg });
    }

    const domiciliosError = validateDomicilios(input.domicilios);
    if (domiciliosError) {
      return res.status(400).json({ error: domiciliosError });
    }

    const { data: existe } = await supabaseAdmin
      .from('clientes')
      .select('id')
      .eq('codigo', input.codigo)
      .maybeSingle();

    if (existe) {
      return res.status(409).json({ error: `Ya existe un cliente con el código ${input.codigo}.` });
    }

    const { data: cliente, error: clienteError } = await supabaseAdmin
      .from('clientes')
      .insert([{
        codigo: input.codigo,
        nombre: input.nombre,
        email: input.email,
        telefono: input.telefono,
        horario_inicio: input.horario_inicio,
        horario_fin: input.horario_fin,
      }])
      .select('id, nombre, codigo')
      .single();

    if (clienteError) {
      console.error('Error creating client:', clienteError);
      return res.status(500).json({ error: clienteError.message });
    }

    const domiciliosData = input.domicilios.map((domicilio) =>
      normalizeDomicilioPayload(domicilio, cliente.id)
    );

    const { error: domiciliosInsertError } = await supabaseAdmin
      .from('domicilios')
      .insert(domiciliosData);

    if (domiciliosInsertError) {
      console.error('Error creating domicilios:', domiciliosInsertError);
      return res.status(500).json({ error: 'Cliente creado pero error en domicilios: ' + domiciliosInsertError.message });
    }

    res.status(201).json({ ok: true, cliente_id: cliente.id, nombre: cliente.nombre });
  } catch (error) {
    console.error('Unexpected error creating client:', error);
    res.status(500).json({ error: 'No se pudo crear el cliente.' });
  }
});

// Clientes: edición completa del registro y sus domicilios.
app.put('/api/clients/:id', requireAuth, async (req, res) => {
  try {
    const { cliente: existingClient, domicilios: existingDomicilios, error } = await loadClientById(req.params.id);

    if (error) {
      console.error('Error loading client for update:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!existingClient) {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }

    const input = cleanClientInput(req.body || {});
    const codigoInmutable = typeof req.body?.codigo === 'string' ? req.body.codigo.trim() : '';

    if (codigoInmutable && codigoInmutable !== existingClient.codigo) {
      return res.status(400).json({ error: 'El código del cliente no se puede modificar.' });
    }

    const errorMsg = validateClientInput({ ...input, codigo: existingClient.codigo }, { requireCodigo: false });
    if (errorMsg) {
      return res.status(400).json({ error: errorMsg });
    }

    const { error: updateError } = await supabaseAdmin
      .from('clientes')
      .update({
        nombre: input.nombre,
        email: input.email,
        telefono: input.telefono,
        horario_inicio: input.horario_inicio,
        horario_fin: input.horario_fin,
      })
      .eq('id', req.params.id);

    if (updateError) {
      console.error('Error updating client:', updateError);
      return res.status(500).json({ error: updateError.message });
    }

    if (Array.isArray(input.domicilios)) {
      const domiciliosError = validateDomicilios(input.domicilios);
      if (domiciliosError) {
        return res.status(400).json({ error: domiciliosError });
      }

      const existingIds = new Set((existingDomicilios || []).map((domicilio) => domicilio.id));
      const keptIds = new Set();

      for (const domicilio of input.domicilios) {
        const payload = normalizeDomicilioPayload(domicilio, req.params.id);

        if (domicilio.id) {
          const { error: domicilioUpdateError } = await supabaseAdmin
            .from('domicilios')
            .update(payload)
            .eq('id', domicilio.id)
            .eq('cliente_id', req.params.id);

          if (domicilioUpdateError) {
            console.error('Error updating domicilio:', domicilioUpdateError);
            return res.status(500).json({ error: domicilioUpdateError.message });
          }

          keptIds.add(domicilio.id);
          continue;
        }

        const { data: newDomicilio, error: domicilioInsertError } = await supabaseAdmin
          .from('domicilios')
          .insert([payload])
          .select('id')
          .single();

        if (domicilioInsertError) {
          console.error('Error creating domicilio during update:', domicilioInsertError);
          return res.status(500).json({ error: domicilioInsertError.message });
        }

        keptIds.add(newDomicilio.id);
      }

      const idsToDelete = [...existingIds].filter((id) => !keptIds.has(id));
      if (idsToDelete.length > 0) {
        const { error: domicilioDeleteError } = await supabaseAdmin
          .from('domicilios')
          .delete()
          .in('id', idsToDelete)
          .eq('cliente_id', req.params.id);

        if (domicilioDeleteError) {
          console.error('Error deleting removed domicilios:', domicilioDeleteError);
          return res.status(500).json({ error: domicilioDeleteError.message });
        }
      }
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Unexpected error updating client:', error);
    res.status(500).json({ error: 'No se pudo actualizar el cliente.' });
  }
});

// Clientes: borrado completo con comprobación de SATs asociados.
app.delete('/api/clients/:id', requireAuth, async (req, res) => {
  try {
    const { cliente, error } = await loadClientById(req.params.id);

    if (error) {
      console.error('Error loading client for delete:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }

    const { count, error: satsError } = await supabaseAdmin
      .from('sats')
      .select('id', { count: 'exact', head: true })
      .eq('cliente_id', req.params.id);

    if (satsError) {
      console.error('Error checking client SATs:', satsError);
      return res.status(500).json({ error: satsError.message });
    }

    if ((count || 0) > 0) {
      return res.status(409).json({ error: 'No se puede eliminar este cliente porque tiene SATs asociados.' });
    }

    const { error: domiciliosDeleteError } = await supabaseAdmin
      .from('domicilios')
      .delete()
      .eq('cliente_id', req.params.id);

    if (domiciliosDeleteError) {
      console.error('Error deleting client domicilios:', domiciliosDeleteError);
      return res.status(500).json({ error: domiciliosDeleteError.message });
    }

    const { error: clientDeleteError } = await supabaseAdmin
      .from('clientes')
      .delete()
      .eq('id', req.params.id);

    if (clientDeleteError) {
      console.error('Error deleting client:', clientDeleteError);
      return res.status(500).json({ error: clientDeleteError.message });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Unexpected error deleting client:', error);
    res.status(500).json({ error: 'No se pudo eliminar el cliente.' });
  }
});

// Técnicos: alta.
app.post('/api/technicians', requireAuth, async (req, res) => {
  const { nombre, email, telefono, codigos_postales = [] } = req.body;

  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio.' });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'El email no es válido.' });
  if (codigos_postales.length === 0)
    return res.status(400).json({ error: 'Añade al menos un código postal.' });

  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
  let tempPassword = 'T';
  for (let i = 0; i < 11; i++) {
    tempPassword += chars[Math.floor(Math.random() * chars.length)];
  }

  const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });

  if (authErr) {
    if (authErr.message.includes('already registered')) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese email.' });
    }
    return res.status(500).json({ error: authErr.message });
  }

  const { error: errT } = await supabaseAdmin.from('tecnicos').insert([{
    id: authData.user.id,
    nombre,
    email,
    telefono: telefono || null,
    codigos_postales,
  }]);

  if (errT) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return res.status(500).json({ error: errT.message });
  }

  res.status(201).json({
    ok: true,
    tecnico_id: authData.user.id,
    password_temporal: tempPassword,
  });
});

// Técnicos: listado.
app.get('/api/technicians', requireAuth, async (req, res) => {
  try {
    const { data: tecnicos, error } = await supabaseAdmin
      .from('tecnicos')
      .select('id, nombre, email, telefono, codigos_postales')
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error listing technicians:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ tecnicos: tecnicos || [] });
  } catch (error) {
    console.error('Unexpected error listing technicians:', error);
    res.status(500).json({ error: 'No se pudieron cargar los técnicos.' });
  }
});

// Técnicos: detalle.
app.get('/api/technicians/:id', requireAuth, async (req, res) => {
  try {
    const { tecnico, error } = await loadTechnicianById(req.params.id);

    if (error) {
      console.error('Error loading technician detail:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!tecnico) {
      return res.status(404).json({ error: 'Técnico no encontrado.' });
    }

    res.json({ tecnico });
  } catch (error) {
    console.error('Unexpected error loading technician detail:', error);
    res.status(500).json({ error: 'No se pudo cargar el técnico.' });
  }
});

// Técnicos: actualización de datos básicos.
app.put('/api/technicians/:id', requireAuth, async (req, res) => {
  try {
    const { tecnico, error } = await loadTechnicianById(req.params.id);

    if (error) {
      console.error('Error loading technician for update:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!tecnico) {
      return res.status(404).json({ error: 'Técnico no encontrado.' });
    }

    const nombre = typeof req.body?.nombre === 'string' ? req.body.nombre.trim() : '';
    const telefono = typeof req.body?.telefono === 'string' ? req.body.telefono.trim() : '';
    const codigos_postales = Array.isArray(req.body?.codigos_postales) ? req.body.codigos_postales : null;

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es obligatorio.' });
    }

    if (telefono && !/^[6-9]\d{8}$/.test(telefono.replace(/\s/g, ''))) {
      return res.status(400).json({ error: 'El teléfono no es válido (9 dígitos, empieza por 6-9).' });
    }

    if (!codigos_postales || codigos_postales.length === 0) {
      return res.status(400).json({ error: 'Añade al menos un código postal.' });
    }

    const { data: updatedTechnician, error: updateError } = await supabaseAdmin
      .from('tecnicos')
      .update({
        nombre,
        telefono: telefono || null,
        codigos_postales,
      })
      .eq('id', req.params.id)
      .select('id, nombre, email, telefono, codigos_postales')
      .single();

    if (updateError) {
      console.error('Error updating technician:', updateError);
      return res.status(500).json({ error: updateError.message });
    }

    res.json({ ok: true, tecnico: updatedTechnician });
  } catch (error) {
    console.error('Unexpected error updating technician:', error);
    res.status(500).json({ error: 'No se pudo actualizar el técnico.' });
  }
});

// Técnicos: borrado con validación de SATs vinculados.
app.delete('/api/technicians/:id', requireAuth, async (req, res) => {
  try {
    const { tecnico, error } = await loadTechnicianById(req.params.id);

    if (error) {
      console.error('Error loading technician for delete:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!tecnico) {
      return res.status(404).json({ error: 'Técnico no encontrado.' });
    }

    const { count, error: satsError } = await supabaseAdmin
      .from('sats')
      .select('id', { count: 'exact', head: true })
      .eq('tecnico_id', req.params.id);

    if (satsError) {
      console.error('Error checking technician SATs:', satsError);
      return res.status(500).json({ error: satsError.message });
    }

    if ((count || 0) > 0) {
      return res.status(409).json({ error: 'No se puede eliminar este técnico porque tiene SATs asignados.' });
    }

    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(req.params.id);
    if (authDeleteError) {
      console.error('Error deleting technician auth user:', authDeleteError);
      return res.status(500).json({ error: authDeleteError.message });
    }

    const { error: technicianDeleteError } = await supabaseAdmin
      .from('tecnicos')
      .delete()
      .eq('id', req.params.id);

    if (technicianDeleteError) {
      console.error('Error deleting technician row:', technicianDeleteError);
      return res.status(500).json({ error: technicianDeleteError.message });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Unexpected error deleting technician:', error);
    res.status(500).json({ error: 'No se pudo eliminar el técnico.' });
  }
});

// SATs: listado con filtros y alcance por rol.
app.get('/api/sats', requireAuth, async (req, res) => {
  try {
    const context = await loadUserContext(req.user.id);
    if (context.error) {
      return res.status(500).json({ error: context.error.message });
    }

    const scope = context.role === 'technician' ? 'mine' : (req.query.scope || 'all');
    const search = normalizeSearch(req.query.search);
    const cliente = normalizeSearch(req.query.cliente);
    const tecnico = normalizeSearch(req.query.tecnico);
    const estado = normalizeSearch(req.query.estado);
    const sort = normalizeSearch(req.query.sort) || 'fecha_programada';

    let query = supabaseAdmin
      .from('sats')
      .select('*');

    if (scope === 'mine') {
      query = query.eq('tecnico_id', req.user.id);
    }

    if (search) {
      const escaped = search.replace(/%/g, '\\%').replace(/_/g, '\\_');
      query = query.or(
        `numero_sat.ilike.%${escaped}%,cliente_nombre.ilike.%${escaped}%,domicilio_dir.ilike.%${escaped}%`
      );
    }

    if (cliente) {
      query = query.ilike('cliente_nombre', `%${cliente}%`);
    }

    if (context.role !== 'technician' && tecnico) {
      query = query.ilike('tecnico_nombre', `%${tecnico}%`);
    }

    if (estado) {
      query = query.eq('estado', estado);
    }

    const { data: sats, error } = await query;
    if (error) {
      console.error('Error listing SATs:', error);
      return res.status(500).json({ error: error.message });
    }

    const sortedSats = (sats || [])
      .map(normalizeSatRow)
      .sort((a, b) => {
        const field = sort === 'fecha_cierre'
          ? 'fecha_cierre'
          : sort === 'fecha_creacion'
            ? 'fecha_creacion'
            : 'fecha_programada';

        const aValue = a[field] ? new Date(a[field]).getTime() : 0;
        const bValue = b[field] ? new Date(b[field]).getTime() : 0;

        if (aValue !== bValue) {
          return aValue - bValue;
        }

        return String(a.numero_sat || '').localeCompare(String(b.numero_sat || ''));
      });

    res.json({ sats: sortedSats });
  } catch (error) {
    console.error('Unexpected error listing SATs:', error);
    res.status(500).json({ error: 'No se pudieron cargar los SATs.' });
  }
});

// SATs: creación.
app.post('/api/sats', requireAuth, async (req, res) => {
  try {
    const context = await loadUserContext(req.user.id);
    if (context.error) {
      return res.status(500).json({ error: context.error.message });
    }

    if (context.role === 'technician') {
      return res.status(403).json({ error: 'Los técnicos no pueden crear SATs.' });
    }

    const input = cleanSatInput(req.body || {});
    const errorMsg = validateSatInput(input);
    if (errorMsg) {
      return res.status(400).json({ error: errorMsg });
    }

    const { data: existe } = await supabaseAdmin
      .from('sats')
      .select('id')
      .eq('numero_sat', input.numero_sat)
      .maybeSingle();

    if (existe) {
      return res.status(409).json({ error: 'Ya existe un SAT con ese número.' });
    }

    const { data: cliente, error: clienteError } = await supabaseAdmin
      .from('clientes')
      .select('id, nombre')
      .eq('id', input.cliente_id)
      .maybeSingle();

    if (clienteError) {
      return res.status(500).json({ error: clienteError.message });
    }

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }

    const { data: domicilio, error: domicilioError } = await supabaseAdmin
      .from('domicilios')
      .select('id, direccion')
      .eq('id', input.domicilio_id)
      .eq('cliente_id', input.cliente_id)
      .maybeSingle();

    if (domicilioError) {
      return res.status(500).json({ error: domicilioError.message });
    }

    if (!domicilio) {
      return res.status(404).json({ error: 'Domicilio no encontrado.' });
    }

    const { data: tecnico, error: tecnicoError } = await supabaseAdmin
      .from('tecnicos')
      .select('id, nombre')
      .eq('id', input.tecnico_id)
      .maybeSingle();

    if (tecnicoError) {
      return res.status(500).json({ error: tecnicoError.message });
    }

    if (!tecnico) {
      return res.status(404).json({ error: 'Técnico no encontrado.' });
    }

    const satDateColumn = await resolveSatDateColumn();

    const payload = {
      numero_sat: input.numero_sat,
      cliente_id: cliente.id,
      cliente_nombre: cliente.nombre,
      domicilio_id: domicilio.id,
      domicilio_dir: domicilio.direccion,
      tecnico_id: tecnico.id,
      tecnico_nombre: tecnico.nombre,
      horario_inicio: input.horario_inicio,
      horario_fin: input.horario_fin,
      descripcion: input.descripcion || null,
      reparaciones: input.reparaciones,
      instalacion_tipo: input.instalacion_tipo || null,
      instalacion_codigo: input.instalacion_codigo || null,
      revisiones: input.revisiones,
      zonas: input.zonas,
      dias_disponibles: input.dias_disponibles,
      estado: 'pendiente',
      fecha_creacion: new Date().toISOString(),
      fecha_inicio: null,
      fecha_cierre: null,
      firma_cliente: null,
      comentario_cierre: null,
      tecnico_cierre_id: null,
      tecnico_cierre_nombre: null,
    };

    if (satDateColumn) {
      payload[satDateColumn] = input.fecha_programada;
    }

    const { data: sat, error } = await supabaseAdmin
      .from('sats')
      .insert([payload])
      .select('*')
      .single();

    if (error) {
      console.error('Error creating SAT:', error);
      return res.status(500).json({ error: error.message });
    }

    const responseSat = satDateColumn
      ? normalizeSatRow(sat)
      : normalizeSatRow({ ...sat, fecha_programada: input.fecha_programada });

    res.status(201).json({ ok: true, sat: responseSat });
  } catch (error) {
    console.error('Unexpected error creating SAT:', error);
    res.status(500).json({ error: 'No se pudo crear el SAT.' });
  }
});

// SATs: detalle con control de acceso por técnico.
app.get('/api/sats/:id', requireAuth, async (req, res) => {
  try {
    const context = await loadUserContext(req.user.id);
    if (context.error) {
      return res.status(500).json({ error: context.error.message });
    }

    const { sat, error } = await loadSatById(req.params.id);

    if (error) {
      console.error('Error loading SAT detail:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!sat) {
      return res.status(404).json({ error: 'SAT no encontrado.' });
    }

    if (context.role === 'technician' && !canAccessSatAsTechnician(sat, req.user.id)) {
      return res.status(403).json({ error: 'No tienes acceso a este SAT.' });
    }

    res.json({ sat });
  } catch (error) {
    console.error('Unexpected error loading SAT detail:', error);
    res.status(500).json({ error: 'No se pudo cargar el SAT.' });
  }
});

// SATs: marcar inicio de trabajo.
app.post('/api/sats/:id/start', requireAuth, async (req, res) => {
  try {
    const context = await loadUserContext(req.user.id);
    if (context.error) {
      return res.status(500).json({ error: context.error.message });
    }

    const { sat, error } = await loadSatById(req.params.id);
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!sat) {
      return res.status(404).json({ error: 'SAT no encontrado.' });
    }

    if (context.role === 'technician' && !canAccessSatAsTechnician(sat, req.user.id)) {
      return res.status(403).json({ error: 'No tienes acceso a este SAT.' });
    }

    if (sat.estado === 'acabado') {
      return res.status(409).json({ error: 'Este SAT ya está finalizado.' });
    }

    if (sat.estado === 'en_progreso' || sat.fecha_inicio) {
      return res.status(409).json({ error: 'Este SAT ya ha sido iniciado.' });
    }

    const satStartColumn = await resolveSatStartColumn();

    const startPayload = { estado: 'en_progreso' };
    if (satStartColumn) {
      startPayload[satStartColumn] = new Date().toISOString();
    }

    const { data: updatedSat, error: updateError } = await supabaseAdmin
      .from('sats')
      .update(startPayload)
      .eq('id', sat.id)
      .select('*')
      .single();

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    res.json({ ok: true, sat: normalizeSatRow(updatedSat) });
  } catch (error) {
    console.error('Unexpected error starting SAT:', error);
    res.status(500).json({ error: 'No se pudo iniciar el SAT.' });
  }
});

// SATs: cierre con firma.
app.post('/api/sats/:id/finish', requireAuth, async (req, res) => {
  try {
    const context = await loadUserContext(req.user.id);
    if (context.error) {
      return res.status(500).json({ error: context.error.message });
    }

    const { firma_cliente, comentario_cierre } = req.body || {};
    if (!firma_cliente || typeof firma_cliente !== 'string' || !firma_cliente.trim()) {
      return res.status(400).json({ error: 'La firma del cliente es obligatoria.' });
    }

    const { sat, error } = await loadSatById(req.params.id);
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!sat) {
      return res.status(404).json({ error: 'SAT no encontrado.' });
    }

    if (context.role === 'technician' && !canAccessSatAsTechnician(sat, req.user.id)) {
      return res.status(403).json({ error: 'No tienes acceso a este SAT.' });
    }

    if (sat.estado === 'acabado') {
      return res.status(409).json({ error: 'Este SAT ya está finalizado.' });
    }

    if (sat.estado !== 'en_progreso' && !sat.fecha_inicio) {
      return res.status(409).json({ error: 'Primero debes iniciar el SAT.' });
    }

    const finishPayload = { estado: 'acabado' };
    if (await hasSatColumn('fecha_cierre')) {
      finishPayload.fecha_cierre = new Date().toISOString();
    }
    if (await hasSatColumn('firma_cliente')) {
      finishPayload.firma_cliente = firma_cliente.trim();
    }
    if (await hasSatColumn('comentario_cierre')) {
      finishPayload.comentario_cierre = typeof comentario_cierre === 'string' ? comentario_cierre.trim() || null : null;
    }
    if (await hasSatColumn('tecnico_cierre_id')) {
      finishPayload.tecnico_cierre_id = req.user.id;
    }
    if (await hasSatColumn('tecnico_cierre_nombre')) {
      finishPayload.tecnico_cierre_nombre = context.technician?.nombre || req.user.email || null;
    }

    const { data: updatedSat, error: updateError } = await supabaseAdmin
      .from('sats')
      .update(finishPayload)
      .eq('id', sat.id)
      .select('*')
      .single();

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    res.json({ ok: true, sat: normalizeSatRow(updatedSat) });
  } catch (error) {
    console.error('Unexpected error finishing SAT:', error);
    res.status(500).json({ error: 'No se pudo finalizar el SAT.' });
  }
});

// SATs: borrado.
app.delete('/api/sats/:id', requireAuth, async (req, res) => {
  try {
    const context = await loadUserContext(req.user.id);
    if (context.error) {
      return res.status(500).json({ error: context.error.message });
    }

    if (context.role === 'technician') {
      return res.status(403).json({ error: 'Los técnicos no pueden eliminar SATs.' });
    }

    const { sat, error } = await loadSatById(req.params.id);

    if (error) {
      console.error('Error loading SAT for delete:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!sat) {
      return res.status(404).json({ error: 'SAT no encontrado.' });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('sats')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) {
      console.error('Error deleting SAT:', deleteError);
      return res.status(500).json({ error: deleteError.message });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Unexpected error deleting SAT:', error);
    res.status(500).json({ error: 'No se pudo eliminar el SAT.' });
  }
});


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/clientes', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/clientes.html'));
});

app.get('/crear-cliente', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/crear-cliente.html'));
});

app.get('/tecnicos', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/tecnicos.html'));
});

app.get('/crear-tecnico', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/crear-tecnico.html'));
});

app.get('/sats', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/sats.html'));
});

app.get('/mis-sats', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/mis-sats.html'));
});

app.get('/crear-sat', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/crear-sat.html'));
});

app.get('/sat', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/sat.html'));
});

app.get('/sat-view', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/sat-view.html'));
});

app.listen(PORT);
