# Documentación SQL y de base de datos

## Alcance
Este documento describe las tablas que usa la aplicación, las relaciones entre ellas, las inserciones y actualizaciones que realiza el backend, y los permisos mínimos necesarios para que la web funcione correctamente con Supabase.

> Nota: el repositorio no incluye migraciones SQL ni scripts de políticas de Supabase. Los permisos de abajo son el mínimo inferido a partir del código.

## Tablas principales

| Tabla | Propósito | Campos clave |
| --- | --- | --- |
| `clientes` | Datos maestros de clientes | `id`, `codigo`, `nombre`, `email`, `telefono`, `horario_inicio`, `horario_fin` |
| `domicilios` | Direcciones del cliente | `id`, `cliente_id`, `alias`, `direccion`, `codigo_postal`, `ciudad` |
| `tecnicos` | Perfiles de técnicos vinculados a usuarios de Supabase Auth | `id`, `nombre`, `email`, `telefono`, `codigos_postales` |
| `sats` | Partes de servicio / órdenes de trabajo | `id`, `numero_sat`, `cliente_id`, `domicilio_id`, `tecnico_id`, `estado`, `fecha_programada`, `fecha_creacion`, `fecha_inicio`, `fecha_cierre`, `firma_cliente` |
| `zonas_cliente` | Relación auxiliar cliente-zona usada en limpiezas al borrar | `cliente_id` y campos relacionados con zonas |
| `auth.users` | Cuentas de Supabase Auth | gestionadas por Supabase, no por la aplicación directamente |

## Relaciones

| Padre | Hijo | Relación |
| --- | --- | --- |
| `clientes.id` | `domicilios.cliente_id` | uno a muchos |
| `clientes.id` | `sats.cliente_id` | uno a muchos |
| `domicilios.id` | `sats.domicilio_id` | uno a muchos |
| `tecnicos.id` | `sats.tecnico_id` | uno a muchos |
| `tecnicos.id` | `sats.tecnico_cierre_id` | uno a muchos, cuando el esquema lo soporta |
| `clientes.id` | `zonas_cliente.cliente_id` | uno a muchos |
| `auth.users.id` | `tecnicos.id` | uno a uno |

## Mutaciones de datos que realiza la aplicación

### Clientes

#### Crear cliente
El backend crea primero el cliente y después inserta todos los domicilios.

```sql
INSERT INTO clientes (codigo, nombre, email, telefono, horario_inicio, horario_fin)
VALUES (...);

INSERT INTO domicilios (cliente_id, alias, direccion, codigo_postal, ciudad)
VALUES (...);
```

Reglas que aplica la app:
- `codigo` debe tener exactamente 7 dígitos.
- `nombre` y `email` son obligatorios.
- `horario_fin` debe ser posterior a `horario_inicio`.
- Se requiere al menos un domicilio válido.

#### Actualizar cliente
El backend actualiza la fila del cliente y luego sincroniza los domicilios:
- actualiza domicilios existentes
- inserta domicilios nuevos
- elimina los domicilios quitados del formulario

#### Eliminar cliente
El borrado se bloquea si el cliente tiene SATs asociados.

Orden de limpieza:
```sql
DELETE FROM domicilios WHERE cliente_id = ?;
DELETE FROM zonas_cliente WHERE cliente_id = ?;
DELETE FROM clientes WHERE id = ?;
```

### Técnicos

#### Crear técnico
El backend crea primero el usuario en Supabase Auth y luego inserta el perfil del técnico con el mismo UUID.

```sql
-- Creación del usuario en Supabase Auth
-- gestionada mediante auth.admin.createUser(...)

INSERT INTO tecnicos (id, nombre, email, telefono, codigos_postales)
VALUES (...);
```

Comportamiento importante:
- la contraseña es temporal y solo se muestra una vez
- el email pasa a ser la identidad de acceso
- la cobertura del técnico se guarda como un array en `codigos_postales`

#### Actualizar técnico
Solo cambian los datos del perfil:
```sql
UPDATE tecnicos
SET nombre = ?, telefono = ?, codigos_postales = ?
WHERE id = ?;
```

#### Eliminar técnico
El borrado se bloquea si el técnico sigue teniendo SATs asignados.

Orden de limpieza:
```sql
DELETE FROM auth.users WHERE id = ?;
DELETE FROM tecnicos WHERE id = ?;
```

### SATs

#### Crear SAT
El backend valida que existan el cliente, el domicilio y el técnico, y después inserta el SAT con su estado inicial.

```sql
INSERT INTO sats (
  numero_sat,
  cliente_id,
  cliente_nombre,
  domicilio_id,
  domicilio_dir,
  tecnico_id,
  tecnico_nombre,
  fecha_programada,
  horario_inicio,
  horario_fin,
  descripcion,
  reparaciones,
  instalacion_tipo,
  instalacion_codigo,
  revisiones,
  zonas,
  dias_disponibles,
  estado,
  fecha_creacion,
  fecha_inicio,
  fecha_cierre,
  firma_cliente,
  comentario_cierre,
  tecnico_cierre_id,
  tecnico_cierre_nombre
)
VALUES (..., 'pendiente', NOW(), NULL, NULL, NULL, NULL, NULL, NULL);
```

La app guarda arrays para:
- `reparaciones`
- `revisiones`
- `zonas`
- `dias_disponibles`

#### Iniciar SAT
```sql
UPDATE sats
SET estado = 'en_progreso',
    fecha_inicio = NOW()
WHERE id = ?;
```

#### Finalizar SAT
```sql
UPDATE sats
SET estado = 'acabado',
    fecha_cierre = NOW(),
    firma_cliente = ?,
    comentario_cierre = ?,
    tecnico_cierre_id = ?,
    tecnico_cierre_nombre = ?
WHERE id = ?;
```

#### Eliminar SAT
Los administradores pueden borrar SATs directamente:
```sql
DELETE FROM sats WHERE id = ?;
```

## Permisos necesarios

Como el frontend usa el cliente público de Supabase, la base de datos debe permitir lecturas autenticadas sobre las tablas que el navegador consulta directamente.

### Modelo mínimo de acceso

| Actor | Acceso requerido |
| --- | --- |
| Visitantes anónimos | solo la pantalla de login |
| Administradores autenticados | CRUD completo a través del backend |
| Técnicos autenticados | leer sus propios SATs, iniciar y finalizar sus propios SATs |
| Cliente Supabase del frontend | `SELECT` sobre las tablas que se leen desde el navegador |

### Modelo recomendado de RLS

#### `clientes`
- los usuarios autenticados pueden leer
- el service role del backend realiza escrituras

#### `domicilios`
- los usuarios autenticados pueden leer
- el service role del backend realiza escrituras

#### `tecnicos`
- los usuarios autenticados pueden leer
- el service role del backend realiza escrituras

#### `sats`
- los administradores pueden leer todas las filas
- los técnicos pueden leer las filas donde `tecnico_id = auth.uid()`
- los técnicos solo pueden actualizar sus propios SATs para las acciones de inicio y cierre
- solo los administradores pueden borrar

### Comportamiento del service role
El backend usa la clave de service role de Supabase, así que sus llamadas API omiten RLS. Por eso puede gestionar inserciones, actualizaciones y borrados de forma segura mientras el navegador solo necesita acceso de lectura controlado.

## Reglas de validación reflejadas en el flujo de base de datos

- el código del cliente es inmutable una vez creado
- el email del cliente debe ser válido
- el email del técnico debe ser válido y único
- un técnico debe tener al menos un CP de cobertura
- un SAT no puede finalizarse antes de iniciarse
- un SAT no puede iniciarse dos veces
- no se puede borrar un técnico o cliente si existen SATs vinculados

