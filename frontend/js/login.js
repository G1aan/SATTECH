// ============================================================
// login.js — Lógica del formulario de inicio de sesión
// ============================================================

// Esperamos a que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {

  // ── Elementos del DOM ──────────────────────────────────────
  const form           = document.getElementById('loginForm');
  const emailInput     = document.getElementById('email');
  const passwordInput  = document.getElementById('password');
  const errorMsg       = document.getElementById('errorMsg');
  const btnLogin       = document.getElementById('btnLogin');
  const btnText        = document.getElementById('btnText');
  const btnSpinner     = document.getElementById('btnSpinner');
  const togglePassword = document.getElementById('togglePassword');

  // ── Mostrar / ocultar contraseña ───────────────────────────
  togglePassword.addEventListener('click', () => {
    const esPassword = passwordInput.type === 'password';
    passwordInput.type = esPassword ? 'text' : 'password';
    togglePassword.textContent = esPassword ? '🙈' : '👁';
  });

  // ── Envío del formulario ───────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email    = emailInput.value.trim();
    const password = passwordInput.value;

    // Validación básica
    if (!email || !password) {
      mostrarError('Por favor completa todos los campos.');
      return;
    }

    // Estado de carga
    setLoading(true);
    ocultarError();

    try {
      // Llamada a Supabase Auth
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Traducimos los mensajes más comunes
        mostrarError(traducirError(error.message));
        return;
      }

      const { data: { session } } = await supabaseClient.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        window.location.href = 'home.html';
        return;
      }

      const response = await fetch('/api/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        window.location.href = 'home.html';
        return;
      }

      const json = await response.json();
      window.location.href = json.role === 'technician' ? 'pages/mis-sats.html' : 'home.html';

    } catch (err) {
      mostrarError('Ocurrió un error inesperado. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  });

  // ── Funciones auxiliares ───────────────────────────────────

  function setLoading(activo) {
    btnLogin.disabled = activo;
    btnText.textContent  = activo ? 'Ingresando...' : 'Iniciar sesión';
    btnSpinner.classList.toggle('hidden', !activo);
  }

  function mostrarError(mensaje) {
    errorMsg.textContent = mensaje;
    errorMsg.classList.remove('hidden');
  }

  function ocultarError() {
    errorMsg.textContent = '';
    errorMsg.classList.add('hidden');
  }

  function traducirError(msg) {
    const errores = {
      'Invalid login credentials' : 'Correo o contraseña incorrectos.',
      'Email not confirmed'        : 'Debes confirmar tu correo antes de ingresar.',
      'Too many requests'          : 'Demasiados intentos. Espera unos minutos.',
    };
    return errores[msg] || 'Error al iniciar sesión. Verifica tus datos.';
  }

});
