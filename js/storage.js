/*
 * storage.js — Dónde se guardan tus datos.
 *
 * Dos modos:
 *  - "cloud": en Supabase, con tu correo y contraseña. Los ves desde cualquier aparato.
 *    Se activa al llenar js/config.js.
 *  - "local": en este navegador (localStorage). Solo este computador y este navegador.
 *
 * La app solo usa estas funciones: init, loadAll, put, del, más las de sesión
 * (signIn, signUp, signOut). Así se puede cambiar dónde se guarda sin tocar el resto.
 *
 * Los datos se organizan en "colecciones" (accounts, txs, goals…).
 * Cada colección es un objeto { id: documento }.
 */
const Store = {
  KEY: 'mi-plata-v1',
  mode: 'local',
  ok: true,      // false si el navegador no deja guardar (por ejemplo, ventana privada)
  sb: null,      // cliente de Supabase
  user: null,    // persona con sesión iniciada (modo cloud)
  data: null,    // copia local (modo local)
  configError: '',

  /** Decide el modo y recupera la sesión si ya habías entrado antes. */
  async init() {
    const cfg = window.MP_CONFIG || {};
    if (!cfg.supabaseUrl || !cfg.supabaseKey) { this.mode = 'local'; return; }
    if (isSecretKey(cfg.supabaseKey)) {
      this.mode = 'local';
      this.configError = 'En js/config.js pusiste una clave secreta. Cámbiala por la clave pública (anon / publishable).';
      return;
    }
    if (!window.supabase?.createClient) {
      this.mode = 'local';
      this.configError = 'No se pudo cargar Supabase. Revisa tu conexión a internet y recarga.';
      return;
    }
    this.mode = 'cloud';
    const url = cfg.supabaseUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, ''); // por si se copió con /rest/v1/
    this.sb = window.supabase.createClient(url, cfg.supabaseKey.trim());
    const { data } = await this.sb.auth.getSession();
    this.user = data.session?.user || null;
  },

  /* ----- Sesión (solo modo cloud) ----- */
  async signIn(email, password) {
    const { data, error } = await this.sb.auth.signInWithPassword({ email, password });
    if (error) throw authError(error);
    this.user = data.user;
  },
  /** Crea la cuenta. Devuelve true si ya quedó con sesión, false si falta confirmar el correo. */
  async signUp(email, password) {
    const { data, error } = await this.sb.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + location.pathname } });
    if (error) throw authError(error);
    this.user = data.session ? data.user : null;
    return !!data.session;
  },
  async signOut() {
    if (this.sb) await this.sb.auth.signOut();
    this.user = null;
  },

  /* ----- Datos ----- */
  /** Lee todo. Devuelve { coleccion: { id: doc } } o null si está vacío. */
  async loadAll() {
    if (this.mode === 'local') {
      try { this.data = JSON.parse(localStorage.getItem(this.KEY)) || null; }
      catch (e) { this.data = null; this.ok = false; }
      return this.data;
    }
    const out = {};
    for (let from = 0; ; from += 1000) { // Supabase entrega máximo 1000 filas por consulta
      const { data, error } = await this.sb.from('docs').select('col,id,data').order('col').order('id').range(from, from + 999);
      if (error) throw dbError(error);
      for (const r of data) (out[r.col] ||= {})[r.id] = r.data;
      if (data.length < 1000) break;
    }
    return Object.keys(out).length ? out : null;
  },

  /** Crea o reemplaza un documento. */
  async put(col, id, doc) {
    if (this.mode === 'local') { this.data ||= {}; (this.data[col] ||= {})[id] = doc; return this._writeLocal(); }
    const { error } = await this.sb.from('docs').upsert({ user_id: this.user.id, col, id, data: doc, updated_at: new Date().toISOString() });
    if (error) throw dbError(error);
  },

  /** Borra un documento. */
  async del(col, id) {
    if (this.mode === 'local') { if (this.data?.[col]) delete this.data[col][id]; return this._writeLocal(); }
    const { error } = await this.sb.from('docs').delete().eq('col', col).eq('id', id);
    if (error) throw dbError(error);
  },

  /** Lo que haya guardado en este navegador (para pasarlo a la nube la primera vez). */
  localSnapshot() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || null; } catch (e) { return null; }
  },

  _writeLocal() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); this.ok = true; }
    catch (e) {
      this.ok = false;
      const err = new Error('No se pudo guardar en el navegador');
      err.code = e?.name === 'QuotaExceededError' ? 'quota_exceeded' : 'unavailable';
      throw err;
    }
  },
};

/* Protección: nunca usar una clave secreta en una página web. */
function isSecretKey(key) {
  if (key.startsWith('sb_secret_')) return true;
  try { return JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role === 'service_role'; }
  catch (e) { return false; }
}
/* Mensajes de error en español. */
function authError(e) {
  const m = (e.message || '').toLowerCase();
  const err = new Error(
    m.includes('invalid login') ? 'Correo o contraseña incorrectos.'
    : m.includes('not confirmed') ? 'Primero confirma tu correo: abre el enlace que te enviamos.'
    : m.includes('already registered') ? 'Ese correo ya tiene cuenta. Toca "Entrar".'
    : m.includes('password') && m.includes('6') ? 'La contraseña debe tener al menos 6 caracteres.'
    : m.includes('rate limit') ? 'Demasiados intentos. Espera unos minutos.'
    : m.includes('email') && m.includes('invalid') ? 'Ese correo no es válido.'
    : 'No se pudo entrar: ' + e.message);
  err.code = 'auth';
  return err;
}
function dbError(e) {
  const err = new Error(e.message);
  err.code = e.code === 'PGRST301' || /jwt/i.test(e.message) ? 'session' : e.code === '42P01' || /relation .* does not exist|could not find the table/i.test(e.message) ? 'no_table' : 'unavailable';
  return err;
}
