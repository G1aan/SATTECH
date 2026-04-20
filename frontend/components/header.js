// ============================================================
// header.js — Encabezado reutilizable de la aplicación
// Uso: incluir este script y llamar renderHeader(basePath)
//   basePath = ''    → desde raíz  (home.html)
//   basePath = '../' → desde pages/ (crear-sat.html, etc.)
// ============================================================

async function renderHeader(basePath = '') {
  const BACKEND = 'http://localhost:3000';

  // Obtenemos el usuario autenticado para mostrar su inicial.
  const { data: { session } } = await supabaseClient.auth.getSession();
  const email  = session?.user?.email || 'Usuario';
  const avatar = email.charAt(0).toUpperCase();

  let isTechnician = false;
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

  // Pintamos el header en el contenedor común de la página.
  const headerEl = document.getElementById('app-header');
  if (!headerEl) return;

  const homeHref = isTechnician ? `${basePath}pages/mis-sats.html` : `${basePath}home.html`;
  const homeLabel = isTechnician ? 'Mis SATs' : 'Inicio';

  headerEl.innerHTML = `
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

  // Cerramos sesión y volvemos al login.
  document.getElementById('btnLogout').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = basePath + 'index.html';
  });
}
