# Manual d’Usuari — MiSaaS

## 1. Elements Introductoris

### 1.1. Portada
- **Nom de l’aplicació:** MiSaaS
- **Versió:** 1.0.0
- **Data d’actualització:** 20/04/2026
- **Logotip:** MiSaaS
- **Informació de contacte bàsica:** suport del projecte / equip administrador del desplegament

### 1.2. Prefaci
Aquest manual explica com utilitzar l’aplicació de gestió de SATs. Està pensat per a persones administradores i tècniques que han de treballar amb clients, tècnics i serveis.

**Com utilitzar aquest manual**
- Llegeix primer la introducció per entendre l’aplicació.
- Consulta la guia ràpida si necessites operar de seguida.
- Ves a les seccions detallades si vols saber com funciona cada mòdul.
- Utilitza la resolució de problemes si trobes errors o bloquejos.

**A qui va dirigit**
- Administradors del sistema
- Tècnics de camp
- Personal de suport o gestió

**Convencions utilitzades**
- Els noms de pantalles apareixen entre cometes o amb la ruta de fitxer.
- Els noms d’accions es mostren en negreta.
- Els valors tècnics apareixen en codi monospace.

**Icones i símbols**
- ✅ acció correcta o finalitzada
- ⚠️ advertència
- ℹ️ informació útil
- ❌ error o acció no permesa

**Terminologia bàsica**
- **SAT:** servei d’assistència tècnica.
- **Client:** empresa o persona que rep el servei.
- **Tècnic:** usuari assignat a SATs.
- **Estat:** fase del SAT (`pendent`, `en_progreso`, `acabado`).

**Notes i advertències**
- Els tècnics no poden crear SATs.
- Un SAT no es pot finalitzar sense firma.
- Un client o tècnic no es pot eliminar si té SATs associats.

### 1.3. Taula de continguts
1. Elements Introductoris
2. Introducció a l’Aplicació
3. Guia Ràpida
4. Funcionalitats Detallades
5. Procediments Pas a Pas
6. Resolució de Problemes
7. Recursos Addicionals
8. Glossari
9. Índex Alfabètic

---

## 2. Introducció a l’Aplicació

### 2.1. Visió General
MiSaaS és una aplicació web per gestionar SATs amb rols diferenciats. Permet controlar clients, domicilis, tècnics i serveis, així com iniciar i tancar SATs amb firma del client.

**Principals funcionalitats**
- Inici de sessió amb Supabase Auth
- Gestió de clients i domicilis
- Gestió de tècnics i cobertura per codis postals
- Creació i seguiment de SATs
- Filtrat i consulta de SATs per rol
- Inici i finalització de SATs

**Requeriments del sistema**
- Navegador modern amb JavaScript activat
- Connexió a Internet
- Accés a Supabase i al backend Node.js

**Navegadors compatibles**
- Chrome
- Edge
- Firefox
- Safari modern

### 2.2. Primers Passos

**Com accedir a l’aplicació**
1. Obre la URL del projecte.
2. Arriba a la pantalla de login.
3. Introdueix el correu i la contrasenya.

**Procés de registre**
No hi ha registre públic d’usuaris des del frontend.  
Els comptes de tècnic es creen des de l’administració de l’aplicació.

**Inici de sessió**
1. L’usuari introdueix email i contrasenya.
2. Supabase valida les credencials.
3. Si tot és correcte, l’aplicació redirigeix segons el rol.

**Tour inicial de la interfície**
- **Capçalera:** accés al compte, inici i tancament de sessió.
- **Panell principal:** accions principals.
- **Llistats:** consultes i filtres.
- **Formularis:** creació i edició de dades.

---

## 3. Guia Ràpida

### 3.1. Funcions Essencials

**Operacions més comunes**
- Crear client
- Crear tècnic
- Crear SAT
- Veure SATs assignats
- Iniciar SAT
- Finalitzar SAT

**Dreceres de teclat principals**
No hi ha dreceres de teclat específiques definides a l’aplicació.

**Consells ràpids**
- Revisa sempre el rol abans de treballar.
- En crear un SAT, comprova el CP del domicili per assignar el tècnic correcte.
- No intentis finalitzar un SAT sense haver-lo iniciat abans.

### 3.2. Interfície d’Usuari

**Elements principals de la pantalla**
- Encabezat amb logo, inici i logout
- Panell o llistat principal
- Botons d’acció
- Missatges d’error o confirmació

**Navegació bàsica**
- Els administradors naveguen pel panell principal.
- Els tècnics entren a “Mis SATs”.
- Cada llistat permet obrir el detall corresponent.

**Barra d’eines i menús**
- Inici
- Cerrar sesión
- Botó de crear o accedir a formularis, segons la pantalla

---

## 4. Funcionalitats Detallades

### 4.1. Mòdul d’Autenticació

**Descripció**
Permet entrar a l’aplicació amb Supabase Auth i determinar el rol de l’usuari.

**Captura de pantalla**
- Inserir captura de la pantalla de login.

**Passos detallats**
1. Escriu email i contrasenya.
2. Prem **Iniciar sessió**.
3. L’aplicació consulta `GET /api/me`.
4. Et redirigeix a la vista correcta.

**Exemple d’ús**
- Un tècnic entra i és enviat directament a la seva llista de SATs.

**Vídeo tutorial**
- No disponible en aquest document.

### 4.2. Mòdul de Clients

**Descripció**
Gestiona la fitxa del client i els seus domicilis.

**Captura de pantalla**
- Inserir captura del llistat de clients.
- Inserir captura del formulari de client.

**Passos detallats**
1. Entra a **Clientes**.
2. Prem **Crear cliente** o obre un client existent.
3. Omple les dades bàsiques.
4. Afegeix un o més domicilis.
5. Desa els canvis.

**Exemples d’ús**
- Crear un nou client amb dues adreces.
- Editar un client existent i corregir el seu telèfon.

**Vídeo tutorial**
- No disponible en aquest document.

### 4.3. Mòdul de Tècnics

**Descripció**
Gestiona els perfils dels tècnics i els codis postals de cobertura.

**Captura de pantalla**
- Inserir captura del llistat de tècnics.
- Inserir captura del formulari de tècnic.

**Passos detallats**
1. Entra a **Técnicos**.
2. Prem **Crear técnico**.
3. Omple nom, email, telèfon i CPs.
4. Desa.
5. Guarda la contrasenya temporal quan es mostri.

**Exemples d’ús**
- Crear un tècnic nou per a una zona concreta.
- Afegir cobertura per un codi postal comodí com `08*`.

**Vídeo tutorial**
- No disponible en aquest document.

### 4.4. Mòdul de SATs

**Descripció**
Permet crear, consultar, iniciar, filtrar i finalitzar SATs.

**Captura de pantalla**
- Inserir captura del llistat de SATs.
- Inserir captura de la creació de SAT.
- Inserir captura del detall SAT.

**Passos detallats**
1. Obre **Crear SAT**.
2. Selecciona client i domicili.
3. Tria data, horaris i dies disponibles.
4. Selecciona tècnic segons el CP.
5. Confirma la creació.
6. Obre el SAT des del detall per iniciar-lo o finalitzar-lo.

**Exemples d’ús**
- Crear un SAT per a un client amb incidència puntual.
- Iniciar el SAT quan el tècnic arriba.
- Finalitzar el SAT amb firma del client.

**Vídeo tutorial**
- No disponible en aquest document.

---

## 5. Procediments Pas a Pas

### 5.1. Tasques Comunes

**Autentificació**
1. Accedeix al login.
2. Escriu les credencials.
3. Espera la redirecció automàtica.

**Perfil d’usuari**
1. Revisa la capçalera.
2. Confirma si ets admin o tècnic.
3. Tanca sessió quan hagis acabat.

**Operacions bàsiques**
- Crear: obrir formulari, omplir camps i desar.
- Consultar: obrir llistat i seleccionar un element.
- Editar: obrir fitxa i modificar dades.
- Eliminar: només si el sistema ho permet.

**Consells i trucs**
- Desa abans de canviar de pantalla.
- Revisa el CP abans d’assignar tècnic.
- En finalitzar, comprova la firma.

**Enllaços a vídeos tutorials**
- No disponibles.

### 5.2. Casos d’Ús

**Cas 1: Administrador crea un client**
1. Entra al llistat de clients.
2. Prem **Crear cliente**.
3. Escriu les dades.
4. Afegeix domicilis.
5. Desa.

**Cas 2: Administrador crea un SAT**
1. Entra a **Crear SAT**.
2. Tria client i domicili.
3. Selecciona tècnic.
4. Omple serveis i disponibilitat.
5. Confirma.

**Cas 3: Tècnic inicia un SAT**
1. Entra a **Mis SATs**.
2. Obre un SAT pendent.
3. Prem **Iniciar SAT**.

**Cas 4: Tècnic finalitza un SAT**
1. Obre el SAT iniciat.
2. Prem **Finalizar SAT**.
3. Dibuixa la firma.
4. Desa el tancament.

**Millors pràctiques**
- No reutilitzar SATs ja finalitzats.
- No assignar tècnics fora de la seva cobertura.
- Registrar sempre la signatura de tancament.

---

## 6. Resolució de Problemes

### 6.1. Problemes Comuns

**Problema: No puc iniciar sessió**
- Causes possibles:
  - credencials incorrectes
  - email no confirmat
  - sessió caducada
- Solució:
  1. Comprova l’email i la contrasenya.
  2. Reintenta.
  3. Contacta amb l’administració si el compte no existeix.

**Problema: No es veuen SATs**
- Causes possibles:
  - no hi ha SATs assignats
  - el rol és tècnic i no té assignacions
  - filtre actiu massa restrictiu
- Solució:
  1. Revisa els filtres.
  2. Actualitza la llista.
  3. Confirma que el SAT està assignat al teu usuari.

**Problema: No es pot finalitzar un SAT**
- Causes possibles:
  - falta la firma
  - el SAT no ha estat iniciat
  - el SAT ja està finalitzat
- Solució:
  1. Inicia primer el SAT.
  2. Afegeix la firma al requadre.
  3. Torna a provar el tancament.

**Problema: No es pot eliminar un client o tècnic**
- Causes possibles:
  - té SATs associats
- Solució:
  1. Revisa els SATs vinculats.
  2. Elimina o reassigna els SATs si el flux de negoci ho permet.

### 6.2. Preguntes Més Freqüents (PMF)

**Categoria: Accés**
- **P:** Puc crear usuari des del web?
  - **R:** No, el registre públic no està activat.

**Categoria: Rols**
- **P:** Què pot fer un tècnic?
  - **R:** Veure els seus SATs, iniciar-los i finalitzar-los.

**Categoria: SATs**
- **P:** Puc acabar un SAT sense firma?
  - **R:** No.

**Categoria: Clients**
- **P:** Puc borrar un client amb SATs?
  - **R:** No.

Enllaços a seccions relacionades:
- Veure secció 4 per funcionalitats detallades.
- Veure secció 6.1 per problemes comuns.

---

## 7. Recursos Addicionals

### 7.1. Suport

**Com obtenir ajuda**
- Contacta amb l’equip de suport del projecte.
- Revisa els missatges d’error mostrats per la interfície.
- Consulta el backend si hi ha errors de permisos o validació.

**Informació de contacte**
- No definida al repositori.

**Horari d’atenció**
- No definit al repositori.

**Canals de suport disponibles**
- Revisió tècnica del projecte
- Documentació interna

### 7.2. Recursos Complementaris

**Enllaços útils**
- Documentació de la web
- Documentació SQL i de base de dades

**Vídeos tutorials addicionals**
- No inclosos

**Documents relacionats**
- `DOCUMENTACION_WEB.md`
- `DOCUMENTACION_SQL.md`
- `DOCUMENTACION_PAGINAS.md`

**Comunitat d’usuaris**
- No definida al projecte

---

## 8. Glossari

| Terme | Definició |
| --- | --- |
| SAT | Servei d’assistència tècnica |
| Client | Persona o empresa que rep el servei |
| Tècnic | Usuari assignat a la realització del SAT |
| Domicili | Adreça associada a un client |
| CP | Codi postal |
| RLS | Row Level Security de Supabase |
| Supabase Auth | Sistema d’autenticació de Supabase |

**Acrònims**
- SAT
- CP
- API
- RLS

---

## 9. Índex Alfabètic

- **Autenticació**: secció 4.1, 5.1
- **Client**: secció 4.2, 6.1, 8
- **Domicili**: secció 4.2, 8
- **Error**: secció 6
- **Firma**: secció 4.4, 6.1
- **SAT**: secció 4.4, 5.2, 6.1, 8
- **Tècnic**: secció 4.3, 5.2, 8

---

## Recomanacions per a l’Elaboració

### Format i estil
- Utilitza un llenguatge clar i directe.
- Inclou captures de pantalla reals.
- Mantén consistència en el format.
- Fes servir colors per destacar elements importants.

### Contingut multimèdia
- Integra vídeos tutorials curts.
- Utilitza infografies quan sigui possible.
- Inclou diagrames explicatius.
- Afegeix enllaços interactius.

### Accessibilitat
- Assegura que el text sigui llegible.
- Proporciona alternatives textuals per a imatges.
- Mantén una estructura clara i navegable.
- Considera diferents dispositius.

### Actualització
- Versiona el document.
- Mantén un registre de canvis.
- Actualitza regularment els enllaços.
- Revisa periòdicament el contingut.

### Elements interactius
- QR codes per accedir a vídeos.
- Enllaços directes a seccions relacionades.
- Formularis de feedback.
- Checklists interactius.

### Consideracions especials
- Versió imprimible.
- Versió en línia navegable.
- Possibilitat de cercar contingut.
- Adaptació a diferents nivells d’usuari.

**Objectius del manual**
- Fàcil d’entendre
- Pràctic d’utilitzar
- Complet en contingut
- Accessible per a diferents tipus d’usuaris
- Actualitzable de manera eficient

