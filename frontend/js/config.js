// ============================================================
// config.js — Configuración del cliente de Supabase en frontend
// Aquí solo se usa la clave pública ANON.
// ============================================================

const SUPABASE_URL  = 'https://kougdwzepiismueqzpsg.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvdWdkd3plcGlpc211ZXF6cHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMDg1ODQsImV4cCI6MjA5MTc4NDU4NH0.TTSQ5aWmambzw8UikMdD2z5jvaFWzKWAIG53TcIlqTQ';

// Comprobamos que el SDK de Supabase se cargó antes de crear el cliente.
if (typeof supabase === 'undefined') {
  console.error('ERROR: El SDK de Supabase no se cargó. Revisa la etiqueta <script> del CDN.');
}

// Creamos el cliente de Supabase y lo dejamos disponible globalmente.
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
