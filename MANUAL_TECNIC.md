# Manual Tècnic — MiSaaS

## 1. Informació General

**Nom del projecte:** MiSaaS  
**Versió del document:** 1.0.0  
**Data d’última actualització:** 20/04/2026  
**Autors i responsables:** equip de desenvolupament del projecte  
**Historial de versions:** primera versió d’aquest manual  
**Propòsit del document:** descriure l’arquitectura, configuració, base de dades, APIs, seguretat i operació tècnica de l’aplicació

## 2. Arquitectura del Sistema

### 2.1 Visió General

MiSaaS és una aplicació web basada en frontend estàtic i backend Node.js connectat a Supabase.

**Diagrama d’arquitectura general**
```text
Navegador
  -> Frontend HTML/CSS/JS
  -> Backend Express (API)
  -> Supabase Auth + Postgres
```

**Patrons de disseny utilitzats**
- Separació clara entre frontend i backend
- Control de rol per sessió
- API REST per a operacions de dades
- Component reutilitzable per a l’header
- Validació tant al client com al servidor

**Stack tecnològic implementat**
- HTML, CSS i JavaScript pur
- Node.js
- Express
- Supabase Auth
- Supabase Postgres
- `@supabase/supabase-js`

### 2.2 Components Principals

**Frontend**
- Carpeta `frontend/`
- Pantalles de login, llistats, formularis i detall SAT
- Consum de l’API per `fetch`

**Backend**
- Carpeta `backend/`
- Fitxer principal `backend/server.js`
- Rutes API, control d’autenticació i validació

**Base de dades**
- Supabase Postgres
- Taules principals: `clientes`, `domicilios`, `tecnicos`, `sats`, `zonas_cliente`

**Serveis externs**
- Supabase Auth
- Supabase Postgres
- API pública de geocodificació per autocompletar ciutat des de CP en el formulari de client

**APIs**
- API interna pròpia del backend: `/api/*`
- API externa de Supabase

## 3. Entorn Tècnic

### 3.1 Requeriments de Hardware

**Servidor**
- Qualsevol servidor capaç d’executar Node.js i servir arxius estàtics

**Capacitat d’emmagatzematge**
- Espai moderat per codi i logs
- Sense requisits elevats de dades al mateix servidor perquè la persistència principal és a Supabase

**Memòria RAM recomanada**
- Mínim funcional: 512 MB
- Recomanat: 1 GB o superior

**Processador recomanat**
- 1 nucli és suficient per a ús bàsic
- Recomanat: 2 nuclis si hi ha més trànsit

### 3.2 Requeriments de Software

**Sistema operatiu**
- Linux recomanat
- També compatible amb entorns de desenvolupament Windows o macOS

**Servidor web**
- Express

**Base de dades**
- Supabase Postgres

**Framework utilitzat**
- Express al backend

**Llenguatges de programació**
- JavaScript
- HTML
- CSS

**Dependències i llibreries**
- `express`
- `cors`
- `dotenv`
- `@supabase/supabase-js`
- `nodemon` en desenvolupament

## 4. Configuració del Sistema

### 4.1 Instal·lació

**Pas a pas del procés d’instal·lació**
1. Clona o copia el projecte.
2. Entra a la carpeta `backend/`.
3. Instal·la dependències amb `npm install`.
4. Configura les variables d’entorn al fitxer `.env`.
5. Inicia el backend amb `npm start` o `npm run dev`.
6. Obre el frontend des del mateix servidor o des del directori servit per Express.

**Configuració de l’entorn**
- El backend carrega variables amb `dotenv`.
- El frontend utilitza el client de Supabase des de `frontend/js/config.js`.

**Variables d’entorn necessàries**
- `PORT`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE`

**Arxius de configuració**
- `backend/.env`
- `backend/package.json`
- `frontend/js/config.js`
- `backend/server.js`

### 4.2 Desplegament

**Procediment de desplegament**
1. Verifica que les variables d’entorn siguin correctes.
2. Instal·la dependències a `backend/`.
3. Arrenca el backend amb Node.
4. Publica el frontend juntament amb el backend o des del mateix servei.
5. Comprova login, llistats i operacions principals.

**Configuració de servidors**
- Node.js per al backend
- Supabase com a servei gestionat

**Scripts necessaris**
- `npm start`
- `npm run dev`

**Gestió de versions**
- El projecte no mostra un sistema de migracions SQL dins del repositori.
- Els canvis de base de dades s’han de controlar fora del codi aplicatiu o amb scripts Supabase.

## 5. Base de Dades

### 5.1 Model de Dades

**Diagrama ER**
```text
clientes 1 --- n domicilios
clientes 1 --- n sats
domicilios 1 --- n sats
tecnicos 1 --- n sats
auth.users 1 --- 1 tecnicos
clientes 1 --- n zonas_cliente
```

**Descripció de taules**
- `clientes`: dades del client i horaris de visita
- `domicilios`: adreces associades a clients
- `tecnicos`: perfils dels tècnics i CPs de cobertura
- `sats`: fitxes de servei, estat, dates, assignació i firma
- `zonas_cliente`: relació auxiliar usada en neteges de dades

**Relacions entre entitats**
- Un client pot tenir diversos domicilis
- Un client pot tenir diversos SATs
- Un tècnic pot tenir diversos SATs
- Un SAT pertany a un client, un domicili i un tècnic

**Índexs i claus**
- `clientes.id`, `domicilios.id`, `tecnicos.id`, `sats.id`: claus primàries
- `clientes.codigo` hauria de ser únic
- `sats.numero_sat` hauria de ser únic
- `domicilios.cliente_id`, `sats.cliente_id`, `sats.domicilio_id`, `sats.tecnico_id` haurien d’estar indexats

### 5.2 Scripts i Procediments

**Scripts de creació**
- No hi ha scripts SQL de creació al repositori
- El model s’infereix del codi backend i del frontend

**Procediments emmagatzemats**
- No s’utilitzen procediments emmagatzemats

**Triggers**
- No hi ha triggers definits al codi del projecte

**Backups i recuperació**
- Les còpies de seguretat depenen de la configuració de Supabase
- Es recomana exportar l’esquema i tenir còpies periòdiques abans de canvis estructurals

## 6. Estructura del Codi

### 6.1 Organització del Projecte

**Estructura de directoris**
```text
backend/
frontend/
logs/
```

**Convencions de nomenclatura**
- Fitxers JavaScript en minúscules amb noms descriptius
- Pàgines HTML separades per funcionalitat
- Funcions en `camelCase`

**Patrons implementats**
- API REST
- Formularis amb validació
- Comprovació de rol amb `/api/me`
- Reutilització del header

### 6.2 Components Principals

**Mòduls**
- `frontend/js/login.js`
- `frontend/js/cliente.js`
- `frontend/js/tecnico.js`
- `frontend/js/sat.js`
- `frontend/js/sat-view.js`
- `frontend/js/sats-list.js`
- `backend/server.js`

**Classes principals**
- No s’utilitzen classes pròpies al projecte

**Interfícies**
- Interfície web de login
- Llistats
- Formularis d’edició
- Vista de detall SAT

**Serveis**
- Servei d’autenticació Supabase
- Servei de dades Supabase
- API Express pròpia

## 7. APIs i Interfícies

### 7.1 APIs Internes

**Endpoints disponibles**
- `POST /api/login`
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

**Mètodes HTTP**
- GET
- POST
- PUT
- DELETE

**Formats de petició/resposta**
- JSON

**Autenticació i autorització**
- Token Bearer de Supabase Auth
- `requireAuth` valida la sessió
- Control de rol per admin o technician

### 7.2 APIs Externes

**Serveis de tercers utilitzats**
- Supabase Auth
- Supabase Postgres
- API pública de geocodificació per ciutat

**Configuració**
- URL i claus definides al frontend i backend

**Gestió de credencials**
- La clau `SUPABASE_SERVICE_ROLE` només s’ha d’usar al backend
- La clau anon s’usa al frontend

## 8. Seguretat

### 8.1 Mecanismes de Seguretat

**Autenticació**
- Supabase Auth amb email i contrasenya

**Autorització**
- Control de rol via `GET /api/me`
- Admin vs technician

**Encriptació**
- La seguretat del trànsit depèn de HTTPS al desplegament
- Les credencials no s’han de guardar en codi font públic

**Gestió de sessions**
- Tokens de Supabase al frontend
- Validació al backend amb `getUser(token)`

### 8.2 Polítiques

**Control d’accés**
- Els tècnics només veuen els seus SATs
- L’administrador gestiona tot

**Gestió de contrasenyes**
- Els tècnics reben una contrasenya temporal
- L’email és la identitat d’accés

**Protocols de seguretat**
- Bearer tokens
- RLS recomanada a la base de dades

**Logs i auditoria**
- El backend utilitza `console.error` per a incidències
- No hi ha un sistema d’auditoria avançat al codi actual

## 9. Monitorització i Manteniment

### 9.1 Logs

**Sistema de logging**
- `console.error` i missatges de consola al backend

**Ubicació dels logs**
- Sortida estàndard del procés backend
- Carpeta `logs/` si s’hi desa informació externa

**Format dels logs**
- Text pla

**Rotació i retenció**
- No configurada al codi actual
- Recomanable gestionar-la al nivell del servidor o del contenidor

### 9.2 Monitorització

**Eines de monitorització**
- No n’hi ha d’integrades al projecte

**Mètriques principals**
- Disponibilitat del backend
- Respostes 4xx i 5xx
- Temps de resposta
- Errors de Supabase

**Alertes configurades**
- No definides al codi actual

## 10. Resolució de Problemes

### 10.1 Problemes Comuns

**No arrenca el backend**
- Causes possibles:
  - variables d’entorn incorrectes
  - dependències no instal·lades
- Diagnòstic:
  1. Revisa `.env`
  2. Executa `npm install`
  3. Torna a iniciar el servidor

**No es pot iniciar sessió**
- Causes possibles:
  - credencials incorrectes
  - email no confirmat
  - Supabase inaccesible
- Solució:
  1. Revisa credencials
  2. Confirma l’usuari a Supabase
  3. Verifica connexió i variables

**No es carreguen clients o SATs**
- Causes possibles:
  - token invàlid
  - error de permisos
  - taula o camp inexistent
- Solució:
  1. Revisa `/api/me`
  2. Comprova les polítiques de Supabase
  3. Verifica l’esquema de la base de dades

**No es pot finalitzar un SAT**
- Causes possibles:
  - falta firma
  - SAT no iniciat
  - SAT ja finalitzat
- Solució:
  1. Inicia el SAT
  2. Dibuixa la firma
  3. Torna a finalitzar

### 10.2 Suport

**Contactes de suport**
- No definits al repositori

**Procediments d’escalat**
- Revisió de logs
- Revisió de Supabase
- Validació de l’esquema i permisos

**Recursos addicionals**
- `DOCUMENTACION_SQL.md`
- `DOCUMENTACION_WEB.md`
- `DOCUMENTACION_PAGINAS.md`

## 11. Annexos

**Glossari de termes**
- SAT: servei d’assistència tècnica
- CP: codi postal
- RLS: Row Level Security
- Auth: autenticació de Supabase

**Referències tècniques**
- `backend/server.js`
- `backend/package.json`
- `frontend/js/config.js`
- `frontend/js/login.js`
- `frontend/js/sat.js`

**Documentació addicional**
- `MANUAL_USUARI.md`
- `DOCUMENTACION_SQL.md`
- `DOCUMENTACION_WEB.md`
- `DOCUMENTACION_PAGINAS.md`

**Diagrames complementaris**
- Diagrama ER bàsic inclòs a la secció 5.1

## Recomanacions Generals

**Actualització constant**
- Mantenir el document actualitzat
- Registrar tots els canvis
- Versionar el document

**Claredat i precisió**
- Utilitzar llenguatge tècnic però clar
- Incloure exemples quan sigui necessari
- Mantenir coherència en la terminologia

**Format i accessibilitat**
- Utilitzar un format estàndard
- Incloure índex i referències creuades
- Facilitar la navegació pel document

**Contingut multimèdia**
- Incloure diagrames explicatius
- Afegir captures de pantalla rellevants
- Afegir codi d’exemple quan sigui necessari

