/* ============================================================
   DONATKU SHARED — Supabase Client
   ============================================================ */

// Konfigurasi Supabase
const SUPABASE_URL = 'https://chojjcumiucgikpmvcuz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_G1VWdDSpdUqOkwPPDwOJqg_wWWfqqRS';

// Supabase client (menggunakan SDK dari CDN, sudah di-load di HTML)
let _supabase = null;

function initSupabase() {
  if (_supabase) return _supabase;
  if (typeof window.supabase === 'undefined') {
    console.error('Supabase SDK belum di-load. Tambahkan <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script> di HTML.');
    return null;
  }
  _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'donatku-auth'
    }
  });
  return _supabase;
}

function getSupabase() {
  if (!_supabase) initSupabase();
  return _supabase;
}

/* ============================================================
   AUTH HELPERS
   ============================================================ */
const Auth = {
  // Register customer baru
  async register({ username, fullName, className, phone, password }) {
    const sb = getSupabase();
    const email = username + '@donatku.io'; // email internal dari username

    const { data, error } = await sb.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          username: username,
          username_lower: username.toLowerCase(),
          full_name: fullName,
          class_name: className,
          phone: phone,
          role: 'customer'
        }
      }
    });

    if (error) throw new Error(translateAuthError(error.message));
    return data;
  },

  // Login
  async login({ username, password }) {
    const sb = getSupabase();
    const email = username + '@donatku.io';

    const { data, error } = await sb.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) throw new Error(translateAuthError(error.message));
    return data;
  },

  // Logout
  async logout() {
    const sb = getSupabase();
    await sb.auth.signOut();
    localStorage.removeItem('donatku-auth');
    sessionStorage.clear();
  },

  // Cek session aktif
  async getSession() {
    const sb = getSupabase();
    const { data } = await sb.auth.getSession();
    return data.session;
  },

  // Ambil user + profile
  async getCurrentUser() {
    const sb = getSupabase();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return null;

    const { data: profile, error } = await sb
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !profile) return null;
    return { user: user, profile: profile };
  },

  // Cek apakah user admin
  async isAdmin() {
    const current = await Auth.getCurrentUser();
    return current && current.profile && current.profile.role === 'admin';
  },

  // Redirect helpers
  async requireLogin(redirectTo) {
    const session = await Auth.getSession();
    if (!session) {
      const target = redirectTo || window.location.pathname;
      window.location.href = 'login.html?redirect=' + encodeURIComponent(target);
      return false;
    }
    return true;
  },

  async requireAdmin(redirectTo) {
    const isAdmin = await Auth.isAdmin();
    if (!isAdmin) {
      alert('Akses ditolak. Halaman ini hanya untuk admin.');
      window.location.href = 'login.html?redirect=' + encodeURIComponent(redirectTo || window.location.pathname);
      return false;
    }
    return true;
  }
};

/* ============================================================
   TRANSLATE ERROR SUPABASE → BAHASA INDONESIA
   ============================================================ */
function translateAuthError(msg) {
  if (!msg) return 'Terjadi kesalahan.';
  const m = msg.toLowerCase();
  if (m.includes('user already registered') || m.includes('already registered'))
    return 'Nama akun ini sudah digunakan. Coba nama lain.';
  if (m.includes('invalid login credentials'))
    return 'Nama akun atau password salah.';
  if (m.includes('password should be at least'))
    return 'Password minimal 6 karakter.';
  if (m.includes('email not confirmed'))
    return 'Akun belum dikonfirmasi.';
  if (m.includes('rate limit'))
    return 'Terlalu banyak percobaan. Coba beberapa saat lagi.';
  return msg;
}

/* ============================================================
   AUTO-INIT
   ============================================================ */
if (typeof window !== 'undefined' && typeof window.supabase !== 'undefined') {
  initSupabase();
}