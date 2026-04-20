# Documentación de la aplicación

Este documento explica la app actual `0/`: qué hace cada página, cómo funciona y qué rutas de código son las más importantes.

## Piezas compartidas

| Archivo | Propósito | Código clave |
| --- | --- | --- |
| `frontend/js/config.js` | Crea el cliente de Supabase y las utilidades compartidas de autenticación | `setToken`, `getToken`, `getUser`, `getHeaders`, `logout` |
| `frontend/components/header.js` | Construye el encabezado reutilizable y detecta el rol del usuario | `renderHeader(basePath)` |
| `backend/server.js` | Servidor principal de la API | `/api/me`, `/api/clients`, `/api/technicians`, `/api/sats` |

## Páginas

### `frontend/index.html`
Pantalla de inicio de sesión.
- Usa `js/login.js` para entrar con Supabase Auth.
- Después del login, llama a `GET /api/me` y redirige según el rol.
- Código clave: `signInWithPassword` y la lógica de redirección por rol en `login.js`.

### `frontend/home.html`
Panel de inicio del administrador.
- Muestra accesos rápidos a clientes, técnicos y SATs.
- Llama a `renderHeader('')` y comprueba el rol antes de redirigir a técnicos.
- Código clave: `redirigirSegunRol()`.

### `frontend/pages/clientes.html`
Listado de clientes.
- Carga todos los clientes desde `GET /api/clients`.
- Cada tarjeta abre la vista de edición de ese cliente.
- Código clave: `initClientes()` y `renderClientes()`.

### `frontend/pages/crear-cliente.html`
Página de crear/editar cliente.
- Funciona en modo creación o edición según `?id=`.
- Gestiona domicilios dinámicos, validación y acciones de guardar/eliminar.
- Código clave: `initCrearCliente()`, `addDomicilio()`, `cargarCliente()`, `guardarCliente()`.

### `frontend/pages/tecnicos.html`
Listado de técnicos.
- Carga los técnicos desde `GET /api/technicians`.
- Abre un modal con detalle, acceso a edición y acción de borrado.
- Código clave: `initTecnicos()`, `openModal()`, `editTechnician()`.

### `frontend/pages/crear-tecnico.html`
Página de crear/editar técnico.
- En modo creación, crea un usuario de Auth y una fila de técnico.
- En modo edición, carga el técnico por `?id=` y actualiza la fila.
- Código clave: `initCrearTecnico()`, `cargarTecnico()`, `addCp()`.

### `frontend/pages/sats.html`
Listado de SATs del administrador.
- Carga todos los SATs desde `GET /api/sats`.
- Filtra por cliente, técnico, estado y fecha.
- Código clave: `initSatsList()`, `applyClientSideFilters()`, `renderSats()`.

### `frontend/pages/mis-sats.html`
Listado de SATs del técnico.
- Usa el mismo motor de listado que la vista de administrador, pero limitado al técnico autenticado.
- El encabezado y las acciones cambian automáticamente a modo técnico.
- Código clave: `data-sat-scope="mine"` e `initSatsList()`.

### `frontend/pages/crear-sat.html`
Asistente de creación de SAT.
- Formulario en dos pasos: primero cliente/fecha, luego técnico/servicios.
- Muestra el historial de SATs del cliente y un modal de confirmación antes de guardar.
- Código clave: `initSat()`, `cargarClientes()`, `validarTab1()`.

### `frontend/pages/sat-view.html`
Página de detalle y ciclo de vida del SAT.
- Muestra el registro completo del SAT.
- Permite iniciar el SAT y finalizarlo con firma y comentario.
- Código clave: `initSatView()`, `renderActions()`, `iniciarSat()`, `finalizarSat()`.

## Flujos importantes del backend

### Autenticación
- `POST /api/login` valida el token de Supabase.
- `GET /api/me` devuelve el rol del usuario y el perfil del técnico.
- `requireAuth` protege todas las rutas privadas.

### Clientes
- `GET /api/clients`, `GET /api/clients/:id`
- `POST /api/clients`, `PUT /api/clients/:id`, `DELETE /api/clients/:id`

### Técnicos
- `GET /api/technicians`, `GET /api/technicians/:id`
- `POST /api/technicians`, `PUT /api/technicians/:id`, `DELETE /api/technicians/:id`

### SATs
- `GET /api/sats`, `GET /api/sats/:id`
- `POST /api/sats`
- `POST /api/sats/:id/start`
- `POST /api/sats/:id/finish`

## Notas

- El administrador puede gestionar todo.
- Los técnicos solo ven sus propios SATs.
- El inicio y cierre de SAT usa `en_progreso` y `acabado` para que la interfaz bloquee el cierre hasta que el SAT haya empezado.

