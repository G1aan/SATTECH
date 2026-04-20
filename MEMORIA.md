# Memòria del projecte — MiSaaS

## 1. Elements Preliminars

### 1.1. Portada
- **Títol del projecte:** MiSaaS
- **Nom de l’autor/s:** equip de desenvolupament del projecte
- **Data:** 20/04/2026
- **Logotip:** MiSaaS
- **Versió del document:** 1.0.0

### 1.2. Resum Executiu
MiSaaS és una aplicació web de gestió de SATs orientada a clients, tècnics i serveis d’assistència. El projecte resol la necessitat de centralitzar la gestió de clients, domicilis, tècnics i parts de servei en una sola eina accessible des del navegador.

L’aplicació inclou autenticació amb Supabase Auth, backend amb Node.js i Express, i persistència de dades a Supabase Postgres. El sistema diferencia clarament el rol d’administrador i el de tècnic. L’administrador pot gestionar tota la informació i crear SATs, mentre que el tècnic només pot veure els seus serveis assignats i executar el cicle de vida del SAT.

Els resultats principals aconseguits són:
- autenticació funcional per rols
- gestió completa de clients i domicilis
- gestió de tècnics amb cobertura per codis postals
- creació, consulta, inici i tancament de SATs
- control d’accés adaptat al rol de l’usuari

### 1.3. Índex / Sumari
1. Elements Preliminars  
2. Cos Principal  
3. Elements Finals  
4. Annexos  

---

## 2. Cos Principal

### 2.1. Introducció

**Context del projecte**  
El projecte neix com una solució de gestió de SATs per a un entorn on cal coordinar clients, domicilis, tècnics i intervencions. L’objectiu és simplificar el treball administratiu i la traçabilitat dels serveis.

**Objectius detallats**
- crear una web funcional amb autenticació
- separar tasques d’administració i tasques de camp
- gestionar clients amb diversos domicilis
- associar tècnics a zones segons CP
- crear i controlar SATs fins al tancament

**Abast del projecte**
- Inclou login, llistats, formularis i detall SAT.
- Inclou gestió de dades a backend i Supabase.
- No inclou registre públic d’usuaris des del frontend.

**Metodologia utilitzada**
- desenvolupament iteratiu
- separació per mòduls funcionals
- validació al client i al servidor
- documentació funcional i tècnica separada

### 2.2. Planificació

**Pla de treball general**
1. Analitzar el projecte existent.
2. Identificar entitats, relacions i fluxos.
3. Implementar o revisar les pàgines principals.
4. Connectar frontend i backend.
5. Validar casos d’ús i documentar.

**Fases del projecte**
- anàlisi
- disseny funcional
- desenvolupament frontend
- desenvolupament backend
- integració amb Supabase
- documentació i tancament

**Cronograma**
La planificació s’ha organitzat per fases funcionals, prioritzant:
- autenticació
- gestió de dades mestres
- gestió de SATs
- refinament de detalls i documents

**Recursos necessaris**
- navegador modern
- Node.js
- Supabase
- editor de codi
- entorn local de proves

**Pla de treball detallat**
- autenticació i rol
- clients i domicilis
- tècnics i cobertura
- SATs i vida útil
- validació de permisos

**Tasques diàries / setmanals**
- revisió de codi
- implementació de pantalles
- comprovació de fluxos
- actualització de la documentació

**Fites assolides**
- pantalles operatives
- backend funcionant
- consultes i mutacions principals resoltes
- documents d’usuari, tècnic i web generats

**Desviacions de la planificació**
- no s’han detectat desviacions crítiques documentades
- alguns noms de camps i rutes s’han adaptat al model real de Supabase

### 2.3. Desenvolupament del Projecte

**Descripció de la solució implementada**  
La solució implementa un frontend estàtic amb JavaScript pur i un backend Express que actua com a capa segura d’accés a Supabase. El frontend ofereix les pantalles de treball i el backend valida l’accés, normalitza dades i executa les operacions sobre la base de dades.

**Tecnologies utilitzades**
- HTML, CSS i JavaScript
- Node.js
- Express
- Supabase Auth
- Supabase Postgres
- `@supabase/supabase-js`
- `dotenv`
- `cors`

**Arquitectura de la solució**
- frontend a `frontend/`
- backend a `backend/`
- servei d’autenticació extern amb Supabase
- base de dades centralitzada a Supabase Postgres

**Funcionalitats principals**
- login i tancament de sessió
- llistat i manteniment de clients
- llistat i manteniment de tècnics
- creació de SATs
- llistat general i llistat personal de SATs
- inici i finalització de SATs amb firma

**Decisions tècniques rellevants**
- ús d’una API REST pròpia per protegir operacions
- separació de rols al backend
- reutilització del component de capçalera
- validació doble de formularis
- ús de Supabase com a servei gestionat per simplificar autenticació i dades

### 2.4. Avaluació i Resultats

**Anàlisi del grau d’assoliment dels objectius**
Els objectius principals s’han cobert de manera funcional. L’aplicació permet treballar amb el flux complet de SATs des del login fins al tancament.

**Avaluació per punts**

**Objectius assolits**
- autenticació per rol
- CRUD de clients
- CRUD de tècnics
- creació i seguiment de SATs

**Ampliacions realitzades**
- vista de SAT amb firma
- historial de SATs del client
- filtratge i ordenació de llistats
- detecció automàtica del rol

**Grau d’implementació**
- alt en les funcionalitats principals
- correcte en la integració frontend-backend

**Eines utilitzades**
- editor de codi
- navegador
- Node.js
- Supabase

**Incidències i resolucions**
- control de permisos segons rol
- validació de camps obligatoris
- associació correcta entre SAT, client, domicili i tècnic

**Problemes trobats**
- diferències entre camps esperats i camps reals de la base de dades
- necessitat d’adaptar algunes consultes a l’esquema disponible

**Solucions aplicades**
- normalització de dades al backend
- lectura condicional de camps opcionals
- ús de validació abans de desar

**Lliçons apreses**
- és millor documentar el model real abans d’ampliar funcionalitats
- separar clarament API, dades i UI redueix errors
- el control de permisos és essencial en apps de gestió

---

## 3. Elements Finals

### 3.1. Conclusions
El projecte MiSaaS ha permès construir una eina funcional i coherent per a la gestió de SATs. La solució cobreix les necessitats bàsiques de l’administració i del treball de camp amb una arquitectura simple però efectiva.

**Resum dels resultats**
- aplicació funcional
- interfície clara
- backend segur
- integració amb Supabase

**Valoració personal**
El desenvolupament ha estat positiu perquè ha permès treballar amb autenticació, permisos, formularis, relacions de dades i cicle de vida d’entitats reals.

**Propostes de millora**
- afegir proves automatitzades
- afegir logs estructurats
- millorar monitorització
- afegir alertes i auditoria

**Línies futures de desenvolupament**
- notificacions
- dashboard amb mètriques
- historial avançat d’activitat
- exportació de dades

### 3.2. Referències i Bibliografia

**Referències tècniques**
- `backend/server.js`
- `frontend/js/*.js`
- `frontend/pages/*.html`
- documents del projecte generats

**Bibliografia consultada**
- documentació oficial de Supabase
- documentació d’Express
- documentació de JavaScript estàndard

**Recursos web**
- Supabase Docs
- Express Docs

**Eines utilitzades**
- Node.js
- navegador web
- Supabase

### 3.3. Annexos

**Material complementari**
- `MANUAL_USUARI.md`
- `MANUAL_TECNIC.md`
- `DOCUMENTACION_SQL.md`
- `DOCUMENTACION_WEB.md`
- `DOCUMENTACION_PAGINAS.md`

**Documentació addicional**
- descripció de l’arquitectura
- model de dades
- fluxos d’usuari

**Captures de pantalla**
- login
- llistats
- formularis
- vista de SAT

**Diagrames rellevants**
- diagrama d’arquitectura
- diagrama ER

