# Documentación de la aplicación web

## Qué hace la app
Es un sistema de gestión de SATs para clientes, técnicos y partes de servicio. Permite a un administrador crear y hacer seguimiento de SATs, asignarlos a técnicos y cerrarlos con firma. Los técnicos solo ven los SATs que tienen asignados.

## Arquitectura

| Capa | Tecnología | Responsabilidad |
| --- | --- | --- |
| Frontend | HTML, CSS, JavaScript puro | Interfaz, formularios, filtros y redirecciones por rol |
| Backend | Node.js + Express | API, validaciones, control de roles y acceso a Supabase |
| Base de datos | Supabase Postgres | Persistencia de datos y autenticación |
| Autenticación | Supabase Auth | Login y tokens de sesión |

El frontend usa el cliente público de Supabase para gestionar sesión y algunas lecturas directas. El backend usa el cliente de service role de Supabase para todas las operaciones protegidas.

## Roles de usuario

### Administrador
Puede gestionar todo:
- crear, editar y eliminar clientes
- crear, editar y eliminar técnicos
- crear, ver, iniciar, finalizar y eliminar SATs
- ver todos los SATs

### Técnico
Puede:
- ver solo los SATs asignados
- abrir el detalle de un SAT
- iniciar un SAT
- finalizar un SAT con firma y comentario

## Mapa de páginas

| Página | Propósito |
| --- | --- |
| `index.html` | Pantalla de login |
| `home.html` | Panel de administración |
| `pages/clientes.html` | Listado de clientes |
| `pages/crear-cliente.html` | Formulario de alta/edición de cliente |
| `pages/tecnicos.html` | Listado de técnicos |
| `pages/crear-tecnico.html` | Formulario de alta/edición de técnico |
| `pages/sats.html` | Listado de SATs del administrador |
| `pages/mis-sats.html` | Listado de SATs del técnico |
| `pages/crear-sat.html` | Asistente de creación de SAT |
| `pages/sat-view.html` | Pantalla de detalle y ciclo de vida del SAT |

> El backend también expone una ruta heredada `/sat`, pero la vista activa en el frontend actual es `sat-view.html`.

## Flujo de login

1. El usuario inicia sesión con email y contraseña.
2. Supabase Auth devuelve un token de sesión.
3. El frontend llama a `GET /api/me`.
4. La app redirige:
   - a los técnicos a `pages/mis-sats.html`
   - a los administradores a `home.html`

## Comportamiento común de la interfaz

El header se reutiliza en todas las páginas:
- muestra el nombre de la app
- muestra la inicial del usuario actual
- redirige a los técnicos a `Mis SATs`
- cierra sesión mediante Supabase Auth

## Funcionalidades principales

### Clientes
El listado de clientes carga tarjetas con el nombre del cliente y su domicilio principal.

Desde `pages/clientes.html`:
- abrir un cliente para editarlo
- borrar un cliente si no tiene SATs

Desde `pages/crear-cliente.html`:
- crear o editar un cliente
- añadir varios domicilios
- validar código, email, teléfono y horarios de visita
- autocompletar la ciudad desde el código postal cuando sea posible

### Técnicos
El listado de técnicos muestra los datos del perfil y los códigos postales de cobertura.

Desde `pages/tecnicos.html`:
- abrir un modal con el detalle del técnico
- pasar a edición
- borrar un técnico cuando esté permitido

Desde `pages/crear-tecnico.html`:
- crear un técnico y un usuario de Supabase Auth asociado
- editar nombre, teléfono y CPs de cobertura
- mostrar la contraseña temporal solo una vez al crear

### Creación de SAT
`pages/crear-sat.html` es un asistente en dos pasos:

1. seleccionar cliente, domicilio y fecha programada
2. seleccionar técnico y datos del servicio

El formulario:
- carga el historial de SATs del cliente
- filtra técnicos por el CP del domicilio
- valida horarios y campos obligatorios
- genera un número de SAT antes de confirmar

### Listado de SATs
`pages/sats.html` es el listado del administrador.
Permite:
- buscar por número, cliente o domicilio
- filtrar por cliente, técnico y estado
- ordenar por fecha programada, fecha de creación o fecha de cierre
- borrar SATs como administrador

`pages/mis-sats.html` es el listado del técnico.
Usa el mismo componente pero:
- solo muestra los SATs asignados
- oculta las acciones de crear y borrar
- mantiene el alcance técnico forzado por el backend

### Detalle y ciclo de vida del SAT
`pages/sat-view.html` muestra el registro completo:
- número de SAT
- estado
- datos de cliente y técnico
- fechas y horarios
- arrays de servicios
- comentario de cierre
- firma del cliente

Comportamiento por rol:
- los administradores pueden abrir cualquier SAT
- los técnicos solo pueden abrir sus propios SATs

Acciones del ciclo de vida:
- **Iniciar SAT** cambia el estado a `en_progreso`
- **Finalizar SAT** exige firma y cambia el estado a `acabado`
- la página de detalle muestra la firma guardada tras el cierre

## Flujo de API del backend

El frontend depende de estos endpoints:
- `GET /api/me`
- `GET /api/clients`
- `GET /api/clients/:id`
- `POST /api/clients`
- `PUT /api/clients/:id`
- `DELETE /api/clients/:id`
- `GET /api/technicians`
- `GET /api/technicians/:id`
- `POST /api/technicians`
- `PUT /api/technicians/:id`
- `DELETE /api/technicians/:id`
- `GET /api/sats`
- `GET /api/sats/:id`
- `POST /api/sats`
- `POST /api/sats/:id/start`
- `POST /api/sats/:id/finish`
- `DELETE /api/sats/:id`

## Flujo funcional de extremo a extremo

### Flujo de administrador
1. Crear un cliente.
2. Crear un técnico.
3. Crear un SAT y asignar ambos.
4. Seguir el SAT en el listado general.
5. Abrir el detalle cuando sea necesario.
6. Borrar registros solo cuando no estén vinculados a SATs activos.

### Flujo de técnico
1. Iniciar sesión con el email asignado.
2. Abrir `Mis SATs`.
3. Abrir el detalle de un SAT.
4. Iniciar el SAT cuando empiece el trabajo.
5. Finalizar el SAT con firma y comentario de cierre.

## Validaciones clave

- el login requiere una sesión válida de Supabase
- los técnicos no pueden crear SATs
- un técnico no puede ver ni editar SATs ajenos
- un SAT no puede cerrarse sin firma
- un SAT no puede iniciarse dos veces
- un cliente no se puede borrar si tiene SATs
- un técnico no se puede borrar si tiene SATs

