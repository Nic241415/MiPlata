/*
 * admin.js — Datos del panel de Administración (solo en modo nube).
 *
 * Funciona solo para quien esté en la tabla public.admins (ver supabase/schema.sql).
 * Quien protege los datos es la base de datos, no este archivo: aunque alguien cambie
 * este código, Supabase solo le entrega los datos de otros a un administrador,
 * y nadie (ni el administrador) puede cambiar o borrar datos ajenos.
 */
const Admin = {
  is: false,

  /** ¿La persona con sesión es administradora? */
  async check() {
    this.is = false;
    if (Store.mode !== 'cloud' || !Store.user) return false;
    const { data, error } = await Store.sb.from('admins').select('user_id').eq('user_id', Store.user.id).maybeSingle();
    this.is = !error && !!data;
    return this.is;
  },

  /** Todas las personas registradas, cada una con sus datos: [{ user_id, email, created_at, last_sign_in_at, data: { coleccion: { id: doc } } }] */
  async load() {
    const { data: users, error } = await Store.sb.rpc('admin_users');
    if (error) throw new Error(error.message);
    const docs = {};
    for (let from = 0; ; from += 1000) { // Supabase entrega máximo 1000 filas por consulta
      const { data, error: e } = await Store.sb.from('docs').select('user_id,col,id,data').order('user_id').order('col').order('id').range(from, from + 999);
      if (e) throw new Error(e.message);
      for (const r of data) ((docs[r.user_id] ||= {})[r.col] ||= {})[r.id] = { ...r.data, id: r.id };
      if (data.length < 1000) break;
    }
    return users.map(u => ({ ...u, data: docs[u.user_id] || {} }));
  },
};
