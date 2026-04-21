// ============================================================
// header.js — Encabezado reutilizable de la aplicación
// Uso: incluir este script y llamar renderHeader(basePath)
//   basePath = ''    → desde raíz  (home.html)
//   basePath = '../' → desde pages/ (crear-sat.html, etc.)
// ============================================================

function buildHeaderShell() {
  return `
    <header class="app-header app-header-loading" aria-busy="true">
      <div class="header-brand">
        <span class="header-logo header-skeleton header-skeleton-brand" aria-hidden="true"></span>
      </div>

      <nav class="header-nav" aria-hidden="true">
        <span class="btn-nav btn-nav-home header-skeleton header-skeleton-pill header-skeleton-pill-home"></span>
        <span class="btn-nav btn-logout header-skeleton header-skeleton-pill header-skeleton-pill-logout"></span>
        <span class="avatar header-skeleton header-skeleton-avatar"></span>
      </nav>
    </header>
  `;
}

function buildHeaderContent(email, homeHref, homeLabel, avatar) {
  return `
    <header class="app-header">

      <div class="header-brand">
        <a href="${homeHref}" class="header-logo">MiSaaS</a>
      </div>

      <nav class="header-nav">
        <a href="${homeHref}" class="btn-nav btn-nav-home">
          <span>🏠</span>
          <span>${homeLabel}</span>
        </a>
        <button class="btn-nav btn-logout" id="btnLogout">
          <span>⎋</span>
          <span>Cerrar sesión</span>
        </button>
        <div class="avatar" title="${email}">${avatar}</div>
      </nav>

    </header>
  `;
}

async function renderHeader(basePath = '') {
  const BACKEND = '';
  const headerEl = document.getElementById('app-header');
  if (!headerEl) return;

  headerEl.innerHTML = buildHeaderShell();

  let email = 'Usuario';
  let isTechnician = false;

  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    email = session?.user?.email || email;

    if (session?.access_token) {
      try {
        const response = await fetch(`${BACKEND}/api/me`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const json = await response.json();
          isTechnician = json.role === 'technician';
        }
      } catch (error) {
        console.error('No se pudo cargar el rol del usuario en el header:', error);
      }
    }
  } catch (error) {
    console.error('No se pudo cargar la sesión del header:', error);
  }

  const avatar = email.charAt(0).toUpperCase();
  const homeHref = isTechnician ? `${basePath}pages/mis-sats.html` : `${basePath}home.html`;
  const homeLabel = isTechnician ? 'Mis SATs' : 'Inicio';

  headerEl.innerHTML = buildHeaderContent(email, homeHref, homeLabel, avatar);

  const btnLogout = headerEl.querySelector('#btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      await supabaseClient.auth.signOut();
      window.location.href = basePath + 'index.html';
    });
  }
}
