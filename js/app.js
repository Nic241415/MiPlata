/* ---------- Utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => iso(new Date());
const parseD = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return iso(d); };
const addMonths = (s, n) => { const d = parseD(s); const day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + n); const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); d.setDate(Math.min(day, last)); return iso(d); };
const daysBetween = (a, b) => Math.round((parseD(b) - parseD(a)) / 86400000);
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const fdate = s => { const d = parseD(s); return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`; };
const monthLabel = key => { const [y, m] = key.split('-').map(Number); return `${MESES_L[m - 1]} ${y}`; };

const FIAT = { COP: { sym: '$', name: 'Peso colombiano' }, USD: { sym: 'US$', name: 'Dólar' }, EUR: { sym: '€', name: 'Euro' } };
const DEFAULT_COINS = { BTC: 'Bitcoin', ETH: 'Ethereum', USDT: 'Tether', SOL: 'Solana', BNB: 'BNB' };
const STABLE = new Set(['USDT', 'USDC', 'DAI']);
/* Último dato conocido, por si la base de datos aún no tiene cotizaciones. */
const FALLBACK = { usdcop: 3174.79, eurusd: 1.1228, date: '2026-10-21', coins: { BTC: 84705, ETH: 2496.16, USDT: 0.9993, SOL: 108.12, BNB: 749.34 }, fut: { SP500: 7614, NASDAQ: 28534 } };
/* Futuros de índices de EE. UU., en dólares. Precio actual: TradingView (futuros E-mini de la CME).
 * Historial: CoinGecko, con los tokens que siguen a los ETF SPY y QQQ, escalado al precio del futuro
 * (la forma de la curva es la misma; el nivel de días pasados es aproximado). */
const FUTURES = { SP500: { name: 'S&P 500', full: 'Futuro E-mini S&P 500', tv: 'CME_MINI:ES1!', cg: 'sp500-xstock' }, NASDAQ: { name: 'Nasdaq 100', full: 'Futuro E-mini Nasdaq 100', tv: 'CME_MINI:NQ1!', cg: 'nasdaq-xstock' } };

function group(intStr) { return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function num(v, maxD, minD = 0) {
  let [i, d = ''] = Math.abs(v).toFixed(maxD).split('.');
  d = d.replace(/0+$/, ''); while (d.length < minD) d += '0';
  return group(i) + (d ? ',' + d : '');
}
function digitsFor(cur, v) {
  if (cur === 'COP') return Math.abs(v) >= 1000 ? [0, 0] : [2, 0];
  if (FIAT[cur] || STABLE.has(cur)) return [2, 2];
  return [Math.abs(v) >= 1000 ? 2 : 8, 0];
}
function fmt(v, cur, opts = {}) {
  if (v == null || !isFinite(v)) return '—';
  const [maxD, minD] = digitsFor(cur, v);
  const s = num(v, maxD, minD);
  const sign = v < 0 && Math.abs(v) >= 0.5 * Math.pow(10, -maxD) ? '−' : (opts.sign && v > 0 ? '+' : '');
  return FIAT[cur] ? `${sign}${FIAT[cur].sym} ${s}` : `${sign}${s} ${cur}`; // espacio que no se parte: el símbolo no queda solo en otra línea
}
function fmtShort(v, cur) {
  const a = Math.abs(v); const sym = FIAT[cur] ? FIAT[cur].sym + ' ' : '';
  const sign = v < 0 ? '−' : '';
  if (a >= 1e9) return `${sign}${sym}${num(a / 1e9, 1)} mil M`;
  if (a >= 1e6) return `${sign}${sym}${num(a / 1e6, 1)} M`;
  if (a >= 1e3) return `${sign}${sym}${num(a, a >= 1e5 ? 0 : 1)}`;
  return `${sign}${sym}${num(a, 2)}`;
}
const pct = v => (v > 0 ? '+' : v < 0 ? '−' : '') + num(Math.abs(v), 2) + ' %';
function parseNum(str) {
  if (typeof str === 'number') return str;
  let s = String(str || '').trim().replace(/[^\d.,-]/g, '');
  if (!s) return NaN;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else { const p = s.split('.'); if (p.length > 2) s = p.join(''); else if (p.length === 2 && p[1].length === 3 && p[0] !== '0' && p[0] !== '-0') s = p.join(''); }
  return parseFloat(s);
}
const inNum = v => (v == null || v === '' || !isFinite(v)) ? '' : String(+(+v).toFixed(8)).replace('.', ',');

/* ---------- Estado ---------- */
// cards, cardtx y cardcats son de la sección secreta Tarjeta de crédito: no cuentan en saldos, gastos ni análisis.
const COLS = ['accounts', 'txs', 'categories', 'trades', 'goals', 'contribs', 'recurring', 'alerts', 'settings', 'market', 'cards', 'cardtx', 'cardcats'];
const S = {}; COLS.forEach(c => S[c] = {});
const UI = { view: 'inicio', range: { USDCOP: 30, EURCOP: 30, EURUSD: 30, BTC: 30 }, f: { from: '', to: '', acc: '', cat: '', type: '', q: '', min: '', max: '' }, showFilters: false, showArchived: false, budgetMonth: today().slice(0, 7), txLimit: 15 };
/* Movimientos: se ven 15 al entrar y "Cargar más" suma 25. */
const TX_FIRST = 15, TX_MORE = 25;
let mode = 'loading', initDone = false;
const LIVE = { status: 'pending', fx: null, coins: null, fut: null, updated: null };
const baseCur = () => S.settings.main?.base || 'COP';

/* ---------- Cotizaciones y conversión ---------- */
function fxPoints() { return (S.market.fx?.points || []).slice().sort((a, b) => a[0] < b[0] ? -1 : 1); }
function curRates() {
  const pts = fxPoints(); const last = pts[pts.length - 1];
  let r = last ? { usdcop: last[1], eurusd: last[2], updated: S.market.fx?.updated || last[0], source: S.market.fx?.source || 'incluidas con la app' }
    : { usdcop: FALLBACK.usdcop, eurusd: FALLBACK.eurusd, updated: FALLBACK.date, source: 'respaldo' };
  const m = S.market.manual?.fx;
  if (m && m.updated > (r.updated || '')) r = { usdcop: m.usdcop, eurusd: m.eurusd, updated: m.updated, source: 'manual' };
  if (LIVE.fx && LIVE.updated > (r.updated || '')) r = { ...LIVE.fx, updated: LIVE.updated, source: 'en vivo' };
  return r;
}
function fxAt(date) {
  const pts = fxPoints();
  if (!date || !pts.length || date >= pts[pts.length - 1][0]) return curRates();
  let p = pts[0]; for (const x of pts) { if (x[0] <= date) p = x; else break; }
  return { usdcop: p[1], eurusd: p[2] };
}
const histAt = (hist, date) => { let p = hist[0]; for (const x of hist) { if (x[0] <= date) p = x; else break; } return p[1]; };
function futUsd(sym, date) {
  const f = S.market.futures?.items?.[sym];
  if (date && f?.hist?.length && date < f.hist[f.hist.length - 1][0]) return histAt(f.hist, date);
  return LIVE.fut?.[sym]?.usd ?? f?.usd ?? FALLBACK.fut[sym];
}
function coinUsd(sym, date) {
  if (FUTURES[sym]) return futUsd(sym, date);
  const auto = S.market.crypto?.coins?.[sym];
  if (date && auto?.hist?.length && date < auto.hist[auto.hist.length - 1][0]) {
    let p = auto.hist[0]; for (const x of auto.hist) { if (x[0] <= date) p = x; else break; } return p[1];
  }
  const man = S.market.manual?.coins?.[sym]; const live = LIVE.coins?.[sym];
  let best = null;
  for (const [v, u] of [[FALLBACK.coins[sym], FALLBACK.date], [auto?.usd, S.market.crypto?.updated], [man?.usd, man?.updated], [live?.usd, LIVE.updated]])
    if (v != null && (!best || (u || '') > (best[1] || ''))) best = [v, u];
  return best ? best[0] : null;
}
function coinCh24(sym) {
  if (FUTURES[sym]) return LIVE.fut?.[sym]?.ch24 ?? S.market.futures?.items?.[sym]?.ch24 ?? null;
  return LIVE.coins?.[sym]?.ch24 ?? S.market.crypto?.coins?.[sym]?.ch24 ?? null;
}
/* Todo lo que se puede registrar en Inversiones: cripto y futuros. */
const assetName = k => FUTURES[k]?.name || coinList()[k] || k;
const fmtQty = (v, k) => FUTURES[k] ? `${num(v, 4)} unid.` : fmt(v, k);
function usdPer(cur, date) {
  if (cur === 'USD') return 1;
  const r = fxAt(date);
  if (cur === 'COP') return 1 / r.usdcop;
  if (cur === 'EUR') return r.eurusd;
  return coinUsd(cur, date) ?? 0;
}
function conv(v, from, to, date) { if (from === to) return v; const t = usdPer(to, date); return t ? v * usdPer(from, date) / t : 0; }
function coinList() {
  const c = { ...DEFAULT_COINS };
  for (const k of Object.keys(S.market.crypto?.coins || {})) c[k] = c[k] || k;
  for (const [k, v] of Object.entries(S.market.manual?.coins || {})) c[k] = c[k] || v.name || k;
  return c;
}
const allCurrencies = () => ['COP', 'USD', 'EUR', ...Object.keys(coinList())];
function pairValue(pair) {
  const r = curRates(); const [a, b] = pair.split('/');
  if (pair === 'USD/COP') return r.usdcop;
  if (pair === 'EUR/COP') return r.usdcop * r.eurusd;
  if (pair === 'EUR/USD') return r.eurusd;
  const u = coinUsd(a); if (u == null) return null;
  return b === 'COP' ? u * r.usdcop : u;
}
function pairOptions() { const o = ['USD/COP', 'EUR/COP', 'EUR/USD', ...Object.keys(FUTURES).map(k => `${k}/USD`)]; for (const k of Object.keys(coinList())) o.push(`${k}/USD`, `${k}/COP`); return o; }

/* ---------- Cálculos ---------- */
const accList = (all = true) => Object.values(S.accounts).filter(a => all || !a.archived).sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
const catName = id => S.categories[id]?.name || 'Sin categoría';
function balances(upto) {
  const b = {};
  for (const a of Object.values(S.accounts)) b[a.id] = (!upto || (a.since || '0000') <= upto) ? (+a.initial || 0) : 0;
  for (const t of Object.values(S.txs)) {
    if (upto && t.date > upto) continue;
    if (t.type === 'income') { if (t.accountId in b) b[t.accountId] += t.amount; }
    else if (t.type === 'expense') { if (t.accountId in b) b[t.accountId] -= t.amount; }
    else if (t.type === 'transfer') { if (t.accountId in b) b[t.accountId] -= t.amount; if (t.toAccountId in b) b[t.toAccountId] += (t.toAmount ?? t.amount); }
  }
  return b;
}
/* Subgrupos: dinero apartado dentro de una cuenta (ej. "Bicicleta" en Bancolombia). Se guardan en la misma
 * cuenta (a.subs) y cada movimiento puede llevar subId (y toSubId en transferencias). Lo que no está en
 * ningún subgrupo es el dinero "libre" de la cuenta. */
const subList = a => Object.entries(a?.subs || {}).map(([id, s]) => ({ ...s, id })).sort((x, y) => x.name.localeCompare(y.name));
const subName = (a, sid) => a?.subs?.[sid]?.name || '';
function subBalances(a) {
  const out = {}; for (const s of subList(a)) out[s.id] = +s.initial || 0;
  for (const t of Object.values(S.txs)) {
    if (t.accountId === a.id && t.subId in out) out[t.subId] += t.type === 'income' ? t.amount : -t.amount;
    if (t.type === 'transfer' && t.toAccountId === a.id && t.toSubId in out) out[t.toSubId] += (t.toAmount ?? t.amount);
  }
  return out;
}
function netWorth(upto) { const b = balances(upto), base = baseCur(); let s = 0; for (const a of Object.values(S.accounts)) s += conv(b[a.id], a.currency, base, upto); return s; }
function txAmountIn(t, cur) { const a = S.accounts[t.accountId]; return conv(t.amount, a?.currency || 'COP', cur, t.date); }
function monthFlows(key, cur = baseCur()) {
  let inc = 0, exp = 0; const byCat = {};
  for (const t of Object.values(S.txs)) {
    if (!t.date.startsWith(key)) continue;
    if (t.type === 'income') inc += txAmountIn(t, cur);
    else if (t.type === 'expense') { const v = txAmountIn(t, cur); exp += v; byCat[t.categoryId] = (byCat[t.categoryId] || 0) + v; }
  }
  return { inc, exp, save: inc - exp, byCat };
}
function holdings() {
  const H = {};
  const trades = Object.values(S.trades).sort((a, b) => a.date < b.date ? -1 : 1);
  for (const t of trades) {
    const h = H[t.asset] ||= { asset: t.asset, buyQty: 0, cost: 0, sellQty: 0, proceeds: 0, platforms: new Set() };
    const usd = t.qty * t.price * usdPer(t.priceCur || 'USD', t.date);
    if (t.side === 'buy') { h.buyQty += t.qty; h.cost += usd; } else { h.sellQty += t.qty; h.proceeds += usd; }
    if (t.platform) h.platforms.add(t.platform);
  }
  return Object.values(H).map(h => {
    const avg = h.buyQty ? h.cost / h.buyQty : 0; const held = h.buyQty - h.sellQty;
    const price = coinUsd(h.asset) ?? 0; const value = held * price; const basis = held * avg;
    return { ...h, avg, held, price, value, basis, pnl: value - basis, pnlPct: basis ? (value - basis) / basis * 100 : 0, realized: h.proceeds - h.sellQty * avg };
  });
}
function goalSaved(g) { return Object.values(S.contribs).filter(c => c.goalId === g.id).reduce((s, c) => s + c.amount, 0); }
function goalPlan(g) {
  const saved = goalSaved(g), left = Math.max(0, g.target - saved);
  const days = daysBetween(today(), g.deadline); const months = Math.max(1, Math.ceil(days / 30.44));
  return { saved, left, days, months, monthly: days < 0 ? left : left / months, pct: g.target ? Math.min(100, saved / g.target * 100) : 0 };
}
function nextDate(d, freq) { return freq === 'weekly' ? addDays(d, 7) : freq === 'biweekly' ? addDays(d, 14) : freq === 'yearly' ? addMonths(d, 12) : freq === 'quarterly' ? addMonths(d, 3) : addMonths(d, 1); }
const FREQ = { weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual', quarterly: 'Trimestral', yearly: 'Anual' };
function triggeredAlerts() { return Object.values(S.alerts).filter(a => a.active !== false).map(a => ({ ...a, now: pairValue(a.pair) })).filter(a => a.now != null && (a.op === '>' ? a.now > a.value : a.now < a.value)); }
function dueSoon() { const lim = addDays(today(), 7); return Object.values(S.recurring).filter(r => r.active !== false && r.next <= lim).sort((a, b) => a.next < b.next ? -1 : 1); }
function budgetOver(key) {
  const lim = S.settings.budget?.limits || {}; const f = monthFlows(key, 'COP');
  return Object.entries(lim).filter(([c, v]) => v > 0 && (f.byCat[c] || 0) > v).map(([c, v]) => ({ cat: c, limit: v, spent: f.byCat[c] }));
}

/* ---------- Guardado ---------- */
const clean = o => { const { id, ...rest } = o; return JSON.parse(JSON.stringify(rest)); };
/* La app cambia su copia en memoria (S) y le pide a Store (js/storage.js) que lo guarde. */
async function put(col, id, data) {
  const doc = clean(data); S[col][id] = { ...doc, id }; sched();
  await Store.put(col, id, doc);
}
async function del(col, id) {
  delete S[col][id]; sched();
  await Store.del(col, id);
}
async function writeMany(list, label) {
  let done = 0; const q = list.slice();
  const worker = async () => { while (q.length) { const [op, col, id, data] = q.shift(); try { op === 'del' ? await del(col, id) : await put(col, id, data); } catch (e) { if (e?.code === 'quota_exceeded') throw e; } done++; if (label && done % 10 === 0) toast(`${label}: ${done} de ${list.length}`); } };
  await Promise.all([worker(), worker(), worker()]);
}
async function safe(fn, ok) {
  try { await fn(); if (ok) toast(ok); }
  catch (e) {
    const code = e?.code;
    if (code === 'session') { mode = 'login'; render(); return toast('Tu sesión venció. Vuelve a entrar.'); }
    toast(code === 'quota_exceeded' ? 'Se llenó el espacio del navegador. Exporta un respaldo y borra datos viejos.'
      : code === 'no_table' ? 'Falta crear la tabla en Supabase: corre el archivo supabase/schema.sql (mira el README).'
      : Store.mode === 'cloud' ? 'No se pudo guardar en la nube. Revisa tu conexión a internet e inténtalo otra vez.'
      : 'No se pudo guardar. Si estás en una ventana privada, abre la app en una ventana normal.');
  }
}

/* ---------- Datos por defecto y de ejemplo ---------- */
const DEFAULT_CATS = [
  ['comida', 'Comida', 'expense'], ['transporte', 'Transporte', 'expense'], ['arriendo', 'Arriendo', 'expense'], ['servicios', 'Servicios', 'expense'],
  ['salud', 'Salud', 'expense'], ['ocio', 'Ocio', 'expense'], ['educacion', 'Educación', 'expense'], ['compras', 'Compras', 'expense'],
  ['suscripciones', 'Suscripciones', 'expense'], ['otros_g', 'Otros gastos', 'expense'],
  ['salario', 'Salario', 'income'], ['extra', 'Trabajos extra', 'income'], ['rendimientos', 'Rendimientos', 'income'], ['otros_i', 'Otros ingresos', 'income'],
];
function demoData() {
  const T = today(), out = []; let seed = 7;
  const rnd = (a, b) => { seed = (seed * 9301 + 49297) % 233280; return a + (seed / 233280) * (b - a); };
  const round = (v, step) => Math.round(v / step) * step;
  const start = addMonths(T.slice(0, 8) + '01', -5);
  const A = (id, name, type, sub, currency, initial, color, icon, order) => out.push(['put', 'accounts', id, { name, type, sub, currency, initial, color, icon, since: start, order, demo: true }]);
  A('d-banco', 'Bancolombia Ahorros', 'bank', 'Ahorros', 'COP', 3200000, '#2F4A7A', 'bank', 1);
  A('d-nequi', 'Nequi', 'wallet', '', 'COP', 150000, '#5B7FC0', 'wallet', 2);
  A('d-efectivo', 'Efectivo', 'cash', '', 'COP', 250000, '#9DB8E8', 'cash', 3);
  A('d-wise', 'Wise', 'wallet', '', 'USD', 900, '#1E3560', 'wallet', 4);
  A('d-binance', 'Binance', 'crypto', '', 'USDT', 650, '#6E7A8A', 'crypto', 5);
  A('d-ledger', 'Billetera BTC', 'crypto', '', 'BTC', 0.01, '#A9B2BE', 'crypto', 6);
  out[0][3].subs = { 'd-bici': { name: 'Bicicleta', initial: 800000 } };
  const tx = (date, type, amount, accountId, categoryId, note, extra = {}) => { if (date <= T) out.push(['put', 'txs', 'd-' + uid(), { date, type, amount, accountId, categoryId, note, ...extra, demo: true }]); };
  for (let m = 0; m < 6; m++) {
    const ms = addMonths(start, m); const d = n => ms.slice(0, 8) + pad(n);
    const current = ms.slice(0, 7) === T.slice(0, 7);
    tx(d(1), 'income', 5200000, 'd-banco', 'salario', 'Salario');
    tx(d(4), 'transfer', 400000, 'd-banco', '', 'Retiro en cajero', { toAccountId: 'd-efectivo', toAmount: 400000 });
    tx(d(2), 'expense', 1800000, 'd-banco', 'arriendo', 'Arriendo apartamento');
    tx(d(3), 'transfer', 900000, 'd-banco', '', 'Recarga Nequi', { toAccountId: 'd-nequi', toAmount: 900000 });
    tx(d(8), 'expense', round(rnd(250000, 310000), 100), 'd-banco', 'servicios', 'Luz, agua y gas');
    tx(d(12), 'expense', 89900, 'd-banco', 'servicios', 'Internet');
    tx(d(24), 'expense', 26900, 'd-banco', 'suscripciones', 'Netflix');
    const meals = current ? 7 : 6;
    for (let k = 0; k < meals; k++) tx(d(3 + k * 4), 'expense', round(rnd(110000, current ? 200000 : 170000), 100), k % 3 ? 'd-nequi' : 'd-efectivo', 'comida', ['Mercado D1', 'Almuerzo', 'Éxito', 'Domicilio', 'Panadería', 'Mercado Ara', 'Restaurante'][k]);
    for (let k = 0; k < 4; k++) tx(d(5 + k * 6), 'expense', round(rnd(35000, 75000), 100), 'd-nequi', 'transporte', ['TransMilenio', 'Uber', 'Gasolina', 'Taxi'][k]);
    tx(d(14), 'expense', round(rnd(70000, 180000), 100), 'd-nequi', 'ocio', 'Cine y comida');
    tx(d(27), 'expense', round(rnd(60000, 150000), 100), 'd-efectivo', 'ocio', 'Salida con amigos');
    if (m % 2 === 0) tx(d(18), 'expense', 120000, 'd-banco', 'salud', 'Cita médica');
    if (m % 2 === 1) {
      tx(d(15), 'income', 350, 'd-wise', 'extra', 'Proyecto freelance');
      const r = fxAt(d(20)).usdcop; tx(d(20), 'transfer', 300, 'd-wise', '', 'Paso dólares al banco', { toAccountId: 'd-banco', toAmount: Math.round(300 * r * 0.985) });
    }
  }
  const tr = (date, asset, side, qty, platform) => out.push(['put', 'trades', 'd-' + uid(), { date, asset, side, qty, price: Math.round((coinUsd(asset, date) ?? FALLBACK.coins[asset]) * 100) / 100, priceCur: 'USD', platform, demo: true }]);
  tr(addDays(start, 10), 'BTC', 'buy', 0.008, 'Binance'); tr(addDays(start, 70), 'BTC', 'buy', 0.005, 'Binance');
  tr(addDays(start, 40), 'ETH', 'buy', 0.4, 'MetaMask'); tr(addDays(T, -25), 'BTC', 'sell', 0.003, 'Binance');
  tr(addDays(start, 20), 'SP500', 'buy', 0.2, 'Interactive Brokers');
  const y = T.slice(0, 4);
  const G = (id, name, target, currency, deadline) => out.push(['put', 'goals', id, { name, target, currency, deadline, demo: true }]);
  G('d-viaje', 'Viaje a Cartagena', 10000000, 'COP', `${y}-12-15`);
  G('d-emergencia', 'Fondo de emergencia', 20000000, 'COP', addMonths(T, 9));
  G('d-portatil', 'Portátil nuevo', 1500, 'USD', addMonths(T, 5));
  const C = (goalId, accountId, amount, date) => out.push(['put', 'contribs', 'd-' + uid(), { goalId, accountId, amount, date, demo: true }]);
  for (let k = 0; k < 4; k++) C('d-viaje', 'd-banco', 1500000, addMonths(start, k + 1));
  for (let k = 0; k < 3; k++) C('d-emergencia', 'd-banco', 1000000, addMonths(start, k + 2));
  C('d-portatil', 'd-wise', 200, addMonths(start, 3)); C('d-portatil', 'd-wise', 200, addMonths(start, 5));
  const R = (id, name, amount, currency, freq, next, accountId, categoryId) => out.push(['put', 'recurring', id, { name, amount, currency, freq, next, accountId, categoryId, active: true, demo: true }]);
  R('d-arriendo', 'Arriendo', 1800000, 'COP', 'monthly', addMonths(T.slice(0, 8) + '02', 1), 'd-banco', 'arriendo');
  R('d-netflix', 'Netflix', 26900, 'COP', 'monthly', addDays(T, 3), 'd-banco', 'suscripciones');
  R('d-celular', 'Plan de celular', 55000, 'COP', 'monthly', addDays(T, 5), 'd-nequi', 'servicios');
  R('d-icloud', 'iCloud', 0.99, 'USD', 'monthly', addDays(T, 14), 'd-wise', 'suscripciones');
  R('d-seguro', 'Seguro del carro', 1450000, 'COP', 'yearly', addDays(T, -1), 'd-banco', 'otros_g');
  const usdcop = curRates().usdcop;
  out.push(['put', 'alerts', 'd-al1', { pair: 'USD/COP', op: '>', value: 4200, active: true, demo: true }]);
  out.push(['put', 'alerts', 'd-al2', { pair: 'USD/COP', op: '<', value: Math.ceil(usdcop / 50) * 50 + 50, active: true, demo: true }]);
  out.push(['put', 'alerts', 'd-al3', { pair: 'BTC/USD', op: '>', value: Math.floor((coinUsd('BTC') || 80000) / 5000) * 5000, active: true, demo: true }]);
  if (!S.settings.budget) out.push(['put', 'settings', 'budget', { limits: { comida: 1000000, transporte: 300000, arriendo: 1800000, servicios: 450000, ocio: 300000, salud: 200000, suscripciones: 60000 }, demo: true }]);
  return out;
}
async function loadDemo() { await safe(() => writeMany(demoData(), 'Cargando ejemplo'), 'Datos de ejemplo cargados'); }
function demoDocs() { const l = []; for (const c of COLS) for (const d of Object.values(S[c])) if (d.demo) l.push(['del', c, d.id]); return l; }
async function clearDemo() { const l = demoDocs(); await safe(() => writeMany(l, 'Borrando ejemplo'), `Listo: se borraron ${l.length} datos de ejemplo`); }
async function firstRun(withDemo = true) {
  if (S.settings.main) return;
  await safe(async () => {
    await put('settings', 'main', { base: 'COP', created: today() });
    if (!Object.keys(S.categories).length) await writeMany(DEFAULT_CATS.map(([id, name, kind]) => ['put', 'categories', id, { name, kind }]));
    if (withDemo && !Object.keys(S.accounts).length) await writeMany(demoData(), 'Cargando ejemplo');
  }, withDemo ? 'Bienvenida: cargamos datos de ejemplo para que veas la app' : 'Listo: empieza creando tu primera cuenta');
}

/* ---------- Iconos ---------- */
const P = {
  inicio: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  cuentas: 'M3 7h18v12H3zM3 7l3-3h12l3 3M16 13h2',
  movimientos: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
  inversiones: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  mercado: 'M3 3v18h18M7 15l4-4 3 3 5-6',
  ahorro: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01',
  pagos: 'M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3',
  ajustes: 'M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M16 4v4M10 10v4M18 16v4',
  mas: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  analisis: 'M21 12.5A9 9 0 1 1 11.5 3v9.5zM15 2.6A9 9 0 0 1 21.4 9H15z',
  bank: 'M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18',
  wallet: 'M3 7h18v12H3zM3 7l3-3h12l3 3M16 13h2',
  cash: 'M2 7h20v10H2zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM5 10v.01M19 14v.01',
  crypto: 'M8 7h6a2.5 2.5 0 0 1 0 5H8zM8 12h7a2.5 2.5 0 0 1 0 5H8zM8 5v14M11 5V3M11 21v-2M14 5V3M14 21v-2',
  card: 'M2 6h20v12H2zM2 10h20M6 15h4', tarjeta: 'M2 6h20v12H2zM2 10h20M6 15h4',
  piggy: 'M5 11a7 6 0 0 1 13-2h2v4h-2l-1 3v3h-3v-2h-4v2H7v-3a6 6 0 0 1-2-5zM15 9h.01',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeOff: 'M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2',
  auto: 'M12 21a9 9 0 1 0 0-18v18z M12 3a9 9 0 0 1 0 18',
  in: 'M12 19V5M5 12l7 7 7-7', out: 'M12 5v14M5 12l7-7 7 7', tr: 'M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7',
  plus: 'M12 5v14M5 12h14', minus: 'M5 12h14', refresh: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7', tag: 'M3 12V4h8l10 10-8 8zM7.5 7.5h.01',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4.2-4.2', filter: 'M4 6h16M7 12h10M10 18h4',
};
const ico = (n, cls = 'ico') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n] || P.wallet}"/></svg>`;
const ACC_TYPES = { bank: 'Banco', wallet: 'Billetera digital', cash: 'Efectivo', crypto: 'Cripto / exchange' };
const SWATCH = ['#2F4A7A', '#5B7FC0', '#9DB8E8', '#1E3560', '#6E7A8A', '#A9B2BE', '#3D4B5C', '#8394AD'];
/* Colores del diseño anterior: las cuentas que ya los tienen se muestran con su equivalente sobrio. */
const OLD_SWATCH = ['#3657D6', '#B8418F', '#0E8F7E', '#6D5BD0', '#D07300', '#7A8590', '#1F7A3A', '#C2352B'];
const accColor = c => SWATCH[OLD_SWATCH.indexOf(c)] || c || '#6E7A8A';

/* ---------- Navegación ---------- */
/* Barra principal (arriba en computador, abajo en celular): solo Inicio, Movimientos y Cuentas.
 * Lo demás va en la barra lateral (computador) o en "Más" (celular). */
const MAIN_VIEWS = [['inicio', 'Inicio'], ['movimientos', 'Movimientos'], ['cuentas', 'Cuentas'], ['ahorro', 'Ahorro']];
const MORE_VIEWS = [['analisis', 'Análisis', 'Patrimonio, gastos y lo que te conviene saber'], ['inversiones', 'Inversiones', 'Cripto y futuros (S&amp;P 500, Nasdaq)'], ['mercado', 'Mercado', 'Dólar, euro, futuros y cripto'],
  ['pagos', 'Pagos', 'Suscripciones, arriendo, cuotas'], ['ajustes', 'Ajustes', 'Moneda, tema, respaldo']];
const TABS = [...MAIN_VIEWS, ['mas', 'Más']];
/* "Tarjeta de crédito" solo aparece después de tocar 5 veces el logo MP (ver brandTap). */
const moreViews = () => ccUnlocked() ? [...MORE_VIEWS, ['tarjeta', 'Tarjeta de crédito', 'Cupo, gastos y pagos de tu tarjeta']] : MORE_VIEWS;
function renderNav() {
  const cur = UI.view; const MV = moreViews(); const inMore = cur === 'mas' || MV.some(v => v[0] === cur);
  const on = k => cur === k ? 'aria-current="page"' : '';
  $('#rail').innerHTML = MAIN_VIEWS.map(([k, l]) => `<button data-go="${k}" ${on(k)}>${l}</button>`).join('');
  let side = $('#side');
  if (!side) { side = document.createElement('aside'); side.id = 'side'; side.className = 'side'; side.setAttribute('aria-label', 'Más secciones'); $('#main').before(side); } // index.html viejo en caché
  side.innerHTML = MV.map(([k, l]) => `<button data-go="${k}" ${on(k)}>${ico(k)}${l}</button>`).join('');
  $('#tabbar').innerHTML = TABS.map(([k, l]) => `<button data-go="${k}" ${(cur === k || (k === 'mas' && inMore)) ? 'aria-current="page"' : ''}>${ico(k)}<span>${l}</span></button>`).join('');
  $('#base-sel').value = baseCur();
}

/* ---------- Vistas ---------- */
function modeNotice() {
  if (!Store.ok) return `<div class="notice warn"><span class="dot"></span><div class="grow"><b>Este navegador no está guardando.</b> Puede ser una ventana privada o el almacenamiento bloqueado. Abre la app en una ventana normal para no perder cambios.</div></div>`;
  return '';
}
function avisos() {
  const n = [];
  for (const a of triggeredAlerts()) n.push(`<div class="notice neg"><span class="dot" style="color:var(--neg)"></span><div class="grow"><b>Alerta de precio:</b> ${esc(a.pair)} ${a.op === '>' ? 'superó' : 'bajó de'} ${esc(fmtPair(a.pair, a.value))}. Ahora está en <b>${esc(fmtPair(a.pair, a.now))}</b>.</div><button class="btn sm ghost" data-act="alert-off" data-id="${a.id}">Ocultar</button></div>`);
  for (const o of budgetOver(today().slice(0, 7))) n.push(`<div class="notice warn"><span class="dot" style="color:var(--warn)"></span><div class="grow"><b>Te pasaste del presupuesto</b> en ${esc(catName(o.cat))}: llevas ${fmt(o.spent, 'COP')} de ${fmt(o.limit, 'COP')}.</div></div>`);
  const due = dueSoon();
  if (due.length) n.push(`<div class="notice info"><span class="dot" style="color:var(--accent-text)"></span><div class="grow"><b>Pagos de los próximos 7 días:</b> ${due.map(r => `${esc(r.name)} (${r.next < today() ? '<span class="neg">vencido</span>' : esc(relDay(r.next))}, ${fmt(r.amount, r.currency)})`).join(' · ')}</div><button class="btn sm ghost" data-go="pagos">Ver</button></div>`);
  return n.join('');
}
function relDay(d) { const n = daysBetween(today(), d); return n === 0 ? 'hoy' : n === 1 ? 'mañana' : n < 0 ? `hace ${-n} días` : `en ${n} días`; }
function fmtPair(pair, v) { const q = pair.split('/')[1]; return fmt(v, q); }
function rateLine() { const r = curRates(); return `Tasas: USD/COP ${num(r.usdcop, 2)} · EUR/COP ${num(r.usdcop * r.eurusd, 2)} · actualizadas ${r.updated ? fdate(r.updated.slice(0, 10)) : '—'} (${r.source})`; }

function vInicio() {
  const base = baseCur();
  const accs = accList(false); const nw = netWorth();
  const demo = Object.values(S.accounts).some(a => a.demo); const b = balances();
  // Los mismos botones de Movimientos (ingreso azul, gasto blanco, transferencia gris). Sin cuentas, llevan a crear una (txForm lo hace solo).
  const qa = (icon, label, type) => `<button class="mv-add ${type}" data-act="new-tx" data-type="${type}"><span class="mv-ico">${ico(icon)}</span>${label}</button>`;
  return modeNotice() + `
  ${demo ? `<div class="notice warn"><span class="dot"></span><div class="grow"><b>Estás viendo datos de ejemplo.</b> Cuando quieras empezar con tus cifras reales, bórralos.</div><button class="btn sm" data-act="ask-clear-demo">Borrar ejemplo</button></div>` : ''}
  <section class="hero">
    <div class="hero-head"><span class="label">Patrimonio neto · ${base}</span>
      <button class="eye" data-act="toggle-hide" aria-pressed="${moneyHidden()}" aria-label="${moneyHidden() ? 'Mostrar el dinero' : 'Ocultar el dinero'}" title="${moneyHidden() ? 'Mostrar' : 'Ocultar'}">${ico(moneyHidden() ? 'eyeOff' : 'eye')}</button></div>
    <span class="big">${moneyHidden() ? `${FIAT[base].sym} ••••••` : fmt(nw, base)}</span>
    <div class="hero-acts">${qa('plus', 'Ingreso', 'income')}${qa('minus', 'Gasto', 'expense')}${qa('tr', 'Transferencia', 'transfer')}</div>
  </section>
  <div class="notices">${avisos()}</div>
  <section><div class="sec-head"><h2>Tus cuentas</h2>${accs.length ? '<button class="btn sm ghost" data-go="cuentas">Ver todas</button>' : ''}</div>
    <div class="accs">${accs.map(a => accCard(a, b[a.id])).join('')}<button class="acc-card add" data-act="new-acc"><span class="avatar">${ico('cuentas')}</span><span class="acc-n">Nueva cuenta</span></button></div></section>
  <p class="small muted center">${esc(rateLine())}</p>`;
}
/* Tarjeta redonda de cuenta para la franja de Inicio. */
function accCard(a, bal) {
  const c = accColor(a.color);
  return `<button class="acc-card" data-act="edit-acc" data-id="${a.id}"><span class="avatar tint" style="--c:${esc(c)}">${ico(a.icon || a.type)}</span>
    <span class="acc-n">${esc(a.name)}</span><b class="${bal < 0 ? 'neg' : ''}">${moneyHidden() ? '••••' : fmt(bal, a.currency)}</b></button>`;
}
function accRow(a, bal) {
  const base = baseCur(); const c = accColor(a.color);
  return `<div class="row click" data-act="edit-acc" data-id="${a.id}"><span class="avatar tint" style="--c:${esc(c)}">${ico(a.icon || a.type)}</span>
    <div class="main"><div class="t">${esc(a.name)}${a.demo ? '<span class="pill-demo">ejemplo</span>' : ''}</div><div class="s">${ACC_TYPES[a.type] || ''}${a.sub ? ' · ' + esc(a.sub) : ''}${a.archived ? ' · archivada' : ''}</div></div>
    <div class="r"><div class="amt ${bal < 0 ? 'neg' : ''}">${fmt(bal, a.currency)}</div>${a.currency !== base ? `<div class="s">≈ ${fmt(conv(bal, a.currency, base), base)}</div>` : ''}</div></div>`;
}
/* Subgrupos de una cuenta, debajo de ella, con lo que queda libre al final. */
function subRows(a, bal) {
  const subs = subList(a); if (!subs.length) return '';
  const sb = subBalances(a); const free = bal - subs.reduce((s, x) => s + sb[x.id], 0);
  return `<div class="subs">${subs.map(s => `<div class="row click sub" data-act="edit-sub" data-id="${a.id}" data-sid="${s.id}"><div class="main"><div class="t">${esc(s.name)}</div></div><div class="amt ${sb[s.id] < 0 ? 'neg' : ''}">${fmt(sb[s.id], a.currency)}</div></div>`).join('')}
    <div class="row sub free"><div class="main"><div class="t">Libre</div></div><div class="amt ${free < 0 ? 'neg' : ''}">${fmt(free, a.currency)}</div></div></div>`;
}
function vCuentas() {
  const b = balances(); const list = accList(UI.showArchived); const base = baseCur();
  const groups = Object.keys(ACC_TYPES).map(t => [t, list.filter(a => a.type === t)]).filter(([, l]) => l.length);
  return modeNotice() + `<div class="card-head"><h1>Cuentas y billeteras</h1><div class="btns"><button class="btn" data-act="toggle-arch">${UI.showArchived ? 'Ocultar archivadas' : 'Ver archivadas'}</button><button class="btn" data-act="new-sub">Nuevo subgrupo</button><button class="btn primary" data-act="new-acc">Nueva cuenta</button></div></div>
  ${groups.length ? groups.map(([t, l]) => `<section class="card"><div class="card-head"><h2>${ACC_TYPES[t]}</h2><span class="small muted num">${fmt(l.reduce((s, a) => s + conv(b[a.id], a.currency, base), 0), base)}</span></div><div class="rows">${l.map(a => accRow(a, b[a.id]) + subRows(a, b[a.id])).join('')}</div></section>`).join('')
    : `<div class="card empty"><b>No hay cuentas</b>Toca "Nueva cuenta" para crear la primera: tu banco, Nequi, el efectivo o tu billetera cripto.</div>`}
  <p class="small muted">El saldo de cada cuenta es su saldo inicial más los movimientos registrados. Con un subgrupo apartas parte de ese dinero para algo (ej. "Bicicleta" en Bancolombia); lo demás queda libre. Toca una cuenta o un subgrupo para editarlo.</p>`;
}
const byDateDesc = (a, b) => a.date === b.date ? ((b.created || '') > (a.created || '') ? 1 : -1) : (a.date < b.date ? 1 : -1);
function filteredTxs() {
  const f = UI.f; const q = f.q.trim().toLowerCase(); const base = baseCur();
  const min = parseNum(f.min), max = parseNum(f.max);
  return Object.values(S.txs).filter(t => (!f.from || t.date >= f.from) && (!f.to || t.date <= f.to) && (!f.acc || t.accountId === f.acc || t.toAccountId === f.acc)
    && (!f.cat || t.categoryId === f.cat) && (!f.type || t.type === f.type) && (!q || (t.note || '').toLowerCase().includes(q) || catName(t.categoryId).toLowerCase().includes(q))
    && (isNaN(min) || txAmountIn(t, base) >= min) && (isNaN(max) || txAmountIn(t, base) <= max))
    .sort(byDateDesc);
}
/* Cuántos filtros del panel están puestos (la búsqueda va aparte). */
const activeFilters = () => ['from', 'to', 'acc', 'cat', 'type'].filter(k => UI.f[k]).length + (UI.f.min || UI.f.max ? 1 : 0);
/* Saldo de la cuenta justo después de cada movimiento (como la columna "saldo" de una libreta de ahorros). */
function runningBalances(accId) {
  const acc = S.accounts[accId]; if (!acc) return {};
  let run = +acc.initial || 0; const out = {};
  const list = Object.values(S.txs).filter(t => t.accountId === accId || t.toAccountId === accId).sort((a, b) => -byDateDesc(a, b));
  for (const t of list) {
    if (t.type === 'income') run += t.amount;
    else if (t.type === 'expense') run -= t.amount;
    else { if (t.accountId === accId) run -= t.amount; if (t.toAccountId === accId) run += (t.toAmount ?? t.amount); }
    out[t.id] = run;
  }
  return out;
}
const fday = s => { const d = parseD(s); return `${d.getDate()} ${MESES[d.getMonth()]}`; };
const dayLabel = s => { const n = daysBetween(s, today()); return n === 0 ? 'Hoy' : n === 1 ? 'Ayer' : fdate(s); };
/* Una fila de movimiento: ícono redondo, concepto, valor y (si se ve una sola cuenta) el saldo que quedó. */
function ledgerRow(t, accId, bal) {
  const a = S.accounts[t.accountId], to = S.accounts[t.toAccountId]; let cur = a?.currency || 'COP';
  let title, sub, amt, cls = '';
  if (t.type === 'transfer') {
    const s1 = subName(a, t.subId), s2 = subName(to, t.toSubId);
    title = t.note || 'Transferencia'; sub = `${esc(a?.name || '¿?')}${s1 ? ' · ' + esc(s1) : ''} → ${esc(to?.name || '¿?')}${s2 ? ' · ' + esc(s2) : ''}`;
    if (accId && t.toAccountId === accId) { cur = to.currency; amt = fmt(t.toAmount ?? t.amount, cur, { sign: true }); }
    else if (accId) amt = fmt(-t.amount, cur);
    else amt = fmt(t.amount, cur) + (to && to.currency !== cur ? ` → ${fmt(t.toAmount, to.currency)}` : '');
  } else {
    const s1 = subName(a, t.subId);
    title = t.note || catName(t.categoryId); sub = `${esc(catName(t.categoryId))} · ${esc(a?.name || 'Cuenta borrada')}${s1 ? ' · ' + esc(s1) : ''}`;
    amt = fmt(t.type === 'income' ? t.amount : -t.amount, cur, { sign: true }); cls = t.type === 'income' ? 'pos' : 'neg';
  }
  const icon = t.type === 'transfer' ? 'tr' : t.type === 'income' ? 'in' : 'out';
  return `<div class="row click" data-act="edit-tx" data-id="${t.id}"><span class="avatar ${t.type}">${ico(icon)}</span>
    <div class="main"><div class="t">${esc(title)}</div><div class="s">${t.demo ? 'Ejemplo · ' : ''}${sub}</div></div>
    <div class="r"><div class="amt ${cls}">${amt}</div>${bal != null ? `<div class="s">Saldo ${fmt(bal, cur)}</div>` : ''}</div></div>`;
}
function ledger(list, o = {}) {
  const bals = o.acc ? runningBalances(o.acc) : null;
  let html = '', day = '';
  for (const t of list) {
    if (t.date !== day) { day = t.date; html += `<div class="day">${dayLabel(day)}</div>`; }
    html += ledgerRow(t, o.acc, bals ? bals[t.id] : null);
  }
  return `<section class="card list">${o.title ? `<div class="card-head"><h2>${o.title}</h2>${o.more ? '<button class="btn sm ghost" data-go="movimientos">Ver todos</button>' : ''}</div>` : ''}
    ${list.length ? `<div class="rows">${html}</div>`
      : `<div class="empty"><b>${o.emptyTitle || 'Aún no hay movimientos'}</b>${o.emptyText || 'Registra el primero con el botón +.'}</div>`}${o.foot || ''}</section>`;
}
function catOptions(sel, withAll) {
  const cats = Object.values(S.categories); const g = k => cats.filter(c => c.kind === k).sort((a, b) => a.name.localeCompare(b.name)).map(c => `<option value="${c.id}" ${sel === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
  return (withAll ? `<option value="">Todas</option>` : '') + `<optgroup label="Gastos">${g('expense')}</optgroup><optgroup label="Ingresos">${g('income')}</optgroup>`;
}
const accOptions = (sel, withAll, all) => (withAll ? `<option value="">Todas</option>` : '') + accList(true).filter(a => all || !a.archived || a.id === sel).map(a => `<option value="${a.id}" ${sel === a.id ? 'selected' : ''}>${esc(a.name)} (${a.currency})</option>`).join('');
/* Movimientos (según el boceto del dueño): tres botones para registrar con el total del mes debajo de cada uno,
   buscador con botón de filtros desplegable, y la lista de a 15 con "Cargar más". */
function vMovimientos() {
  const list = filteredTxs(); const base = baseCur(); const f = UI.f;
  const nf = activeFilters(), open = UI.showFilters, shown = Math.min(UI.txLimit, list.length);
  const key = today().slice(0, 7), mes = MESES_L[+key.slice(5) - 1], m = monthFlows(key);
  const count = Object.values(S.txs).filter(t => t.date.startsWith(key)).length;
  const col = (type, icon, label, statLabel, value, cls) => `<div class="mv-col">
      <button class="mv-add ${type}" data-act="new-tx" data-type="${type}"><span class="mv-ico">${ico(icon)}</span>${label}</button>
      <div class="mv-stat"><span class="label">${statLabel}</span><b class="${cls}">${value}</b></div></div>`;
  return modeNotice() + `<h1>Movimientos</h1>
  <section class="card mv-top">
    ${col('income', 'plus', 'Ingreso', `Ingresos de ${mes}`, fmt(m.inc, base), 'pos')}
    ${col('expense', 'minus', 'Gasto', `Gastos de ${mes}`, fmt(m.exp, base), 'neg')}
    ${col('transfer', 'tr', 'Transferencia', `Movimientos de ${mes}`, count, '')}
  </section>
  <div class="mv-find">
    <label class="search">${ico('search')}<input id="f-q" data-filter="q" type="search" placeholder="Buscar por nota o categoría" aria-label="Buscar movimientos" value="${esc(f.q)}"></label>
    <div class="find-acts"><button class="btn filt-btn" data-act="toggle-filters" aria-expanded="${open}" aria-controls="filters">${ico('filter')}Filtros${nf ? `<span class="count">${nf}</span>` : ''}</button>
      <button class="btn filt-btn" data-act="cats">${ico('tag')}Categorías</button></div>
    ${open ? `<section class="card filters" id="filters" aria-label="Filtros">
      <label class="field"><span>Desde</span><input id="f-from" data-filter="from" type="date" value="${f.from}"></label>
      <label class="field"><span>Hasta</span><input id="f-to" data-filter="to" type="date" value="${f.to}"></label>
      <label class="field"><span>Cuenta</span><select id="f-acc" data-filter="acc">${accOptions(f.acc, true, true)}</select></label>
      <label class="field"><span>Categoría</span><select id="f-cat" data-filter="cat">${catOptions(f.cat, true)}</select></label>
      <label class="field"><span>Tipo</span><select id="f-type" data-filter="type"><option value="">Todos</option><option value="income" ${f.type === 'income' ? 'selected' : ''}>Ingresos</option><option value="expense" ${f.type === 'expense' ? 'selected' : ''}>Gastos</option><option value="transfer" ${f.type === 'transfer' ? 'selected' : ''}>Transferencias</option></select></label>
      <div class="field range"><span id="f-amt-l">Monto (en ${base})</span><div class="range-in" role="group" aria-labelledby="f-amt-l">
        <input id="f-min" data-filter="min" inputmode="decimal" placeholder="Desde" aria-label="Monto desde" value="${esc(f.min)}"><span aria-hidden="true">–</span>
        <input id="f-max" data-filter="max" inputmode="decimal" placeholder="Hasta" aria-label="Monto hasta" value="${esc(f.max)}"></div></div>
      <div class="filters-foot"><button class="btn" data-act="clear-filters"${nf || f.q ? '' : ' disabled'}>Limpiar filtros</button></div>
    </section>` : ''}
  </div>
  ${f.acc ? `<p class="small muted">Viendo solo ${esc(S.accounts[f.acc]?.name || 'una cuenta')}: el "Saldo" de cada fila es lo que quedó en la cuenta después de cada movimiento.</p>` : ''}
  ${ledger(list.slice(0, UI.txLimit), { acc: f.acc && S.accounts[f.acc] ? f.acc : null, emptyTitle: nf || f.q ? 'No hay movimientos con estos filtros' : 'Aún no hay movimientos', emptyText: nf || f.q ? 'Cambia la búsqueda o los filtros.' : 'Registra el primero con los botones de arriba.',
    foot: list.length ? `<div class="more"><span class="small muted">Viendo ${shown} de ${list.length}</span>${list.length > shown ? `<button class="btn" data-act="more-tx">Cargar más</button>` : ''}</div>` : '' })}`;
}
/* Botones de periodo para un gráfico de precio. */
const rangeSeg = key => `<div class="seg" role="group" aria-label="Periodo">${[[1, '1 día'], [7, '7 días'], [30, '30 días'], [365, '1 año']].map(([d, l]) => `<button data-act="range" data-key="${key}" data-days="${d}" aria-pressed="${(UI.range[key] ?? 30) === d}">${l}</button>`).join('')}</div>`;
const priceChart = (key, label) => `<div class="chart-box short"><canvas id="ch-${key}" data-chart="${key}" aria-label="Gráfico de ${esc(label)}"></canvas></div>`;
function vInversiones() {
  const H = holdings(); const base = baseCur();
  const tv = H.reduce((s, h) => s + h.value, 0), tb = H.reduce((s, h) => s + h.basis, 0), tp = tv - tb;
  const trades = Object.values(S.trades).sort((a, b) => a.date < b.date ? 1 : -1);
  return modeNotice() + `<div class="card-head"><h1>Inversiones</h1><button class="btn primary" data-act="new-trade">Registrar compra o venta</button></div>
  ${H.length ? `<section class="hero"><span class="label">Valor actual de tus inversiones</span><span class="big">${fmt(tv, 'USD')}</span><span class="sub">${base !== 'USD' ? `≈ ${fmt(conv(tv, 'USD', base), base)} · ` : ''}Ganancia o pérdida sin vender: <b>${fmt(tp, 'USD', { sign: true })} (${pct(tb ? tp / tb * 100 : 0)})</b></span></section>
  <div class="grid g2">${H.map(h => { const n = priceSeries(h.asset).length; return `<section class="card inv"><div class="card-head"><div class="mk-head"><div class="mk-name">${esc(assetName(h.asset))}</div><div class="mk-price">${FUTURES[h.asset] ? 'Futuro' : esc(h.asset)}</div></div><span class="chip ${h.pnl >= 0 ? 'pos' : 'neg'}">${pct(h.pnlPct)}</span></div>
    <div class="kv"><span class="muted">Cantidad que tienes</span><b>${fmtQty(h.held, h.asset)}</b></div>
    <div class="kv"><span class="muted">Valor actual</span><b>${fmt(h.value, 'USD')}</b></div>
    <div class="kv"><span class="muted">Precio actual</span><b>${fmt(h.price, 'USD')}</b></div>
    <div class="kv"><span class="muted">Ganancia o pérdida</span><b class="${h.pnl >= 0 ? 'pos' : 'neg'}">${fmt(h.pnl, 'USD', { sign: true })}</b></div>
    ${n > 1 ? `<div class="inv-chart">${rangeSeg(h.asset)}${priceChart(h.asset, assetName(h.asset))}</div>` : '<p class="small muted">Aún no hay historial de precios para esta moneda.</p>'}
    <div class="small muted">Plataformas: ${esc([...h.platforms].join(', ') || '—')}</div>
    ${h.sellQty ? `<div class="realized"><span class="avatar ${h.realized >= 0 ? 'income' : 'expense'}">${ico(h.realized >= 0 ? 'in' : 'out')}</span><div class="main"><div class="t">Ganancia ya realizada</div><div class="s">Por lo que vendiste</div></div><div class="amt ${h.realized >= 0 ? 'pos' : 'neg'}">${fmt(h.realized, 'USD', { sign: true })}</div></div>` : ''}</section>`; }).join('')}</div>` : ''}
  <section class="card"><h2>Historial de compras y ventas</h2>${trades.length ? `<div class="tbl-wrap"><table><thead><tr><th>Fecha</th><th>Operación</th><th>Activo</th><th class="r">Cantidad</th><th class="r">Precio</th><th class="r">Total</th><th>Plataforma</th></tr></thead><tbody>
    ${trades.map(t => `<tr class="row-click" data-act="edit-trade" data-id="${t.id}" style="cursor:pointer"><td>${fdate(t.date)}</td><td><span class="chip ${t.side === 'buy' ? 'pos' : 'neg'}">${t.side === 'buy' ? 'Compra' : 'Venta'}</span>${t.demo ? '<span class="pill-demo">ejemplo</span>' : ''}</td><td>${esc(assetName(t.asset))}</td><td class="r">${num(t.qty, 8)}</td><td class="r">${fmt(t.price, t.priceCur || 'USD')}</td><td class="r">${fmt(t.qty * t.price, t.priceCur || 'USD')}</td><td>${esc(t.platform || '')}</td></tr>`).join('')}
  </tbody></table></div>` : `<div class="empty"><b>Aún no registras inversiones</b>Anota cada compra o venta de cripto o de futuros (S&amp;P 500, Nasdaq) con su precio, y aquí verás si vas ganando o perdiendo.</div>`}</section>
  <p class="small muted">Los precios están en dólares. Esta sección es un registro aparte: para que la inversión cuente en tu patrimonio, crea también una cuenta con su saldo.</p>`;
}
function seriesFor(key) {
  const pts = fxPoints(); const r = curRates();
  const s = pts.map(p => [p[0], key === 'USDCOP' ? p[1] : key === 'EURCOP' ? p[1] * p[2] : p[2]]);
  const nowV = key === 'USDCOP' ? r.usdcop : key === 'EURCOP' ? r.usdcop * r.eurusd : r.eurusd;
  const T = today(); if (!s.length || s[s.length - 1][0] < T) s.push([T, nowV]); else s[s.length - 1][1] = nowV;
  return s;
}
/* Historial diario de una tasa, una criptomoneda o un futuro, terminando en el precio de hoy. */
function priceSeries(key) {
  if (MARKET_FX.some(x => x[0] === key)) return seriesFor(key);
  const hist = FUTURES[key] ? S.market.futures?.items?.[key]?.hist : S.market.crypto?.coins?.[key]?.hist;
  const s = (hist || []).slice(); const u = coinUsd(key); const T = today();
  if (u != null) { if (s.length && s[s.length - 1][0] === T) s[s.length - 1] = [T, u]; else s.push([T, u]); }
  return s;
}
function vMercado() {
  const r = curRates(); const coins = coinList(); const hid = mHidden();
  const live = LIVE.status === 'ok' ? `<div class="notice info"><span class="dot" style="color:var(--pos)"></span><div class="grow"><b>Cotizaciones en vivo.</b> Última consulta: ${LIVE.updated ? new Date(LIVE.updated).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' }) : 'hace un momento'}</div></div>`
    : `<div class="notice info"><span class="dot" style="color:var(--accent-text)"></span><div class="grow"><b>Cotizaciones del ${r.updated ? fdate(r.updated.slice(0, 10)) : '—'} (${esc(r.source)}).</b> ${LIVE.status === 'pending' ? 'Consultando precios actuales…' : 'No se pudo conectar. Revisa tu internet y toca "Actualizar precios".'}</div></div>`;
  const card = (key, label, val, q, sub) => {
    const s = priceSeries(key); const from = addDays(today(), -(UI.range[key] ?? 30)); const ss = s.filter(p => p[0] >= from);
    const first = ss[0]?.[1], ch = first ? (val - first) / first * 100 : 0;
    return `<section class="card"><div class="card-head"><div class="mk-head"><div class="mk-name">${label}</div><div class="mk-price">${fmt(val, q)}</div>${sub ? `<div class="small muted">${sub}</div>` : ''}</div><span class="chip ${ch >= 0 ? 'pos' : 'neg'}">${pct(ch)}</span></div>
      ${rangeSeg(key)}<div style="margin-top:10px">${priceChart(key, label)}</div></section>`;
  };
  const fxVal = { USDCOP: [r.usdcop, 'COP'], EURCOP: [r.usdcop * r.eurusd, 'COP'], EURUSD: [r.eurusd, 'USD'] };
  const fx = MARKET_FX.filter(([k]) => !hid.has(k)), fut = Object.entries(FUTURES).filter(([k]) => !hid.has(k)), cr = Object.entries(coins).filter(([k]) => !hid.has(k));
  const alerts = Object.values(S.alerts);
  const trig = new Set(triggeredAlerts().map(a => a.id));
  return modeNotice() + `<div class="card-head"><h1>Mercado</h1><div class="btns"><button class="btn" data-act="mview">${ico('eye')}Elegir qué ver</button><button class="btn primary" data-act="refresh-market" ${UI.refreshing ? 'disabled' : ''}>${ico('refresh')}${UI.refreshing ? 'Actualizando…' : 'Actualizar precios'}</button></div></div>${live}
  ${fx.length ? `<div class="grid ${fx.length === 3 ? 'g3' : 'g2'}">${fx.map(([k, l]) => card(k, l, ...fxVal[k])).join('')}</div>` : ''}
  ${fut.length ? `<section><div class="sec-head"><h2>Futuros</h2></div><div class="grid g2">${fut.map(([k, f]) => card(k, `${f.name} · USD`, coinUsd(k), 'USD', esc(f.full))).join('')}</div>
    <p class="small muted" style="margin:10px 4px 0">Precio del futuro E-mini (CME). El historial de días pasados es aproximado: sigue a los fondos SPY y QQQ.</p></section>` : ''}
  ${cr.length ? `<section class="card"><div class="card-head"><h2>Criptomonedas</h2><button class="btn sm" data-act="add-coin">Agregar moneda</button></div>
    <div class="tbl-wrap"><table><thead><tr><th>Moneda</th><th class="r">Precio USD</th><th class="r">Precio COP</th><th class="r">24 horas</th></tr></thead><tbody>
    ${cr.map(([k, n]) => { const u = coinUsd(k), c = coinCh24(k); return `<tr><td><b>${esc(k)}</b> <span class="muted small">${esc(n)}</span></td><td class="r">${u == null ? '—' : fmt(u, 'USD')}</td><td class="r">${u == null ? '—' : fmt(u * r.usdcop, 'COP')}</td><td class="r">${c == null ? '<span class="muted">—</span>' : `<span class="${c >= 0 ? 'pos' : 'neg'}">${pct(c)}</span>`}</td></tr>`; }).join('')}
    </tbody></table></div>
    ${!hid.has('BTC') && S.market.crypto?.coins?.BTC?.hist ? `<div class="card-head" style="margin-top:16px"><h3>Bitcoin en USD</h3>${rangeSeg('BTC')}</div>${priceChart('BTC', 'Bitcoin')}` : ''}
  </section>` : ''}
  ${!fx.length && !fut.length && !cr.length ? `<div class="card empty"><b>Ocultaste todo</b>Toca "Elegir qué ver" para mostrar tasas, futuros o criptomonedas.</div>` : ''}
  <section class="card"><div class="card-head"><h2>Alertas de precio</h2><button class="btn sm primary" data-act="new-alert">Nueva alerta</button></div>
    ${alerts.length ? `<div class="rows">${alerts.map(a => { const now = pairValue(a.pair); return `<div class="row"><div class="main"><div class="t">Avisarme si ${esc(a.pair)} ${a.op === '>' ? 'supera' : 'baja de'} ${esc(fmtPair(a.pair, a.value))}${a.demo ? '<span class="pill-demo">ejemplo</span>' : ''}</div><div class="s">Ahora: ${now == null ? '—' : esc(fmtPair(a.pair, now))}</div></div>
      <span class="chip ${a.active === false ? 'neutral' : trig.has(a.id) ? 'neg' : 'pos'}">${a.active === false ? 'Pausada' : trig.has(a.id) ? 'Se cumplió' : 'Vigilando'}</span>
      <button class="btn sm ghost" data-act="toggle-alert" data-id="${a.id}">${a.active === false ? 'Activar' : 'Pausar'}</button><button class="btn sm ghost danger" data-act="del-alert" data-id="${a.id}">Borrar</button></div>`; }).join('')}</div>`
    : `<div class="empty"><b>Sin alertas</b>Ejemplo: "avisarme si USD/COP supera 4.200". Cuando se cumpla, lo verás arriba en Inicio.</div>`}
  </section>`;
}
function vAhorro() {
  const goals = Object.values(S.goals).sort((a, b) => a.deadline < b.deadline ? -1 : 1);
  const key = UI.budgetMonth; const f = monthFlows(key, 'COP'); const lim = S.settings.budget?.limits || {};
  const expCats = Object.values(S.categories).filter(c => c.kind === 'expense');
  const cats = [...new Set([...Object.keys(lim).filter(k => lim[k] > 0), ...Object.keys(f.byCat)])].filter(k => S.categories[k] || f.byCat[k]);
  const planned = goals.reduce((s, g) => s + conv(goalPlan(g).monthly, g.currency, 'COP'), 0);
  const isCur = key === today().slice(0, 7);
  const subs = accList(false).flatMap(a => { const sb = subBalances(a); return subList(a).map(s => ({ ...s, a, bal: sb[s.id] })); });
  const budget = budgetCard(key, f, lim, cats, planned, isCur);
  return modeNotice() + `<h1>Ahorro</h1>
  <section class="card"><div class="card-head"><h2>Subgrupos</h2><button class="btn sm primary" data-act="new-sub">Nuevo subgrupo</button></div>
    ${subs.length ? `<div class="rows">${subs.map(s => `<div class="row click" data-act="edit-sub" data-id="${s.a.id}" data-sid="${s.id}"><span class="avatar tint" style="--c:${esc(accColor(s.a.color))}">${ico('piggy')}</span>
      <div class="main"><div class="t">${esc(s.name)}</div><div class="s">${esc(s.a.name)}${s.initial ? ` · apartaste ${fmt(s.initial, s.a.currency)}` : ''}</div></div>
      <div class="r"><div class="amt ${s.bal < 0 ? 'neg' : ''}">${fmt(s.bal, s.a.currency)}</div></div></div>`).join('')}</div>`
      : `<div class="empty"><b>Aún no tienes subgrupos</b>Aparta dinero de una cuenta para algo. Ej: en Bancolombia, 3.000.000 para "Bicicleta".</div>`}</section>
  ${budget}
  <section class="card"><div class="card-head"><h2>Metas</h2><button class="btn sm primary" data-act="new-goal">Nueva meta</button></div>${goals.length ? `<div class="goals">${goals.map(g => { const p = goalPlan(g); return `<div class="goal">
    <div class="goal-top">${ring(p.pct)}<div class="goal-name"><h3>${esc(g.name)}${g.demo ? '<span class="pill-demo">ejemplo</span>' : ''}</h3><span class="small muted">Llevas ${fmt(p.saved, g.currency)} de ${fmt(g.target, g.currency)}</span></div><button class="btn sm ghost" data-act="edit-goal" data-id="${g.id}">Editar</button></div>
    <div class="kv"><span class="muted">Fecha ${fdate(g.deadline)}</span><b>${p.left <= 0 ? '<span class="pos">¡Meta cumplida!</span>' : p.days < 0 ? '<span class="neg">Fecha vencida</span>' : `${fmt(p.monthly, g.currency)} al mes`}</b></div>
    ${p.left > 0 && p.days >= 0 ? `<div class="small muted">Te faltan ${fmt(p.left, g.currency)} en ${p.months} ${p.months === 1 ? 'mes' : 'meses'}.</div>` : ''}
    <div class="btns"><button class="btn sm primary" data-act="contrib" data-id="${g.id}">Aportar</button></div></div>`; }).join('')}</div>`
    : `<div class="empty"><b>Aún no tienes metas</b>Ejemplo: "Viaje: 10.000.000 COP para diciembre". La app calcula cuánto ahorrar cada mes.</div>`}</section>`;
}
function budgetCard(key, f, lim, cats, planned, isCur) {
  return `<section class="card"><div class="card-head"><h2>Presupuesto de ${monthLabel(key)}</h2><div class="btns"><button class="btn sm" data-act="bmonth" data-d="-1" aria-label="Mes anterior">‹</button>${isCur ? '' : '<button class="btn sm" data-act="bmonth" data-d="0">Este mes</button>'}<button class="btn sm" data-act="bmonth" data-d="1" aria-label="Mes siguiente">›</button><button class="btn sm primary" data-act="new-budget">Nuevo presupuesto</button></div></div>
    <div class="stats"><div class="stat"><span class="label">Ingresos</span><span class="v pos">${fmt(f.inc, 'COP')}</span></div><div class="stat"><span class="label">Gastos</span><span class="v neg">${fmt(f.exp, 'COP')}</span></div><div class="stat"><span class="label">Sobra para ahorrar</span><span class="v ${f.save >= 0 ? 'pos' : 'neg'}">${fmt(f.save, 'COP')}</span></div></div>
    ${planned > 0 ? `<p class="small ${f.save >= planned ? 'muted' : 'neg'}" style="margin:10px 0 0">Tus metas piden ${fmt(planned, 'COP')} al mes. ${f.save >= planned ? 'Este mes te alcanza.' : `Este mes te faltan ${fmt(planned - f.save, 'COP')}.`}</p>` : ''}
    <div class="rows" style="margin-top:8px">${cats.length ? cats.sort((a, b) => (f.byCat[b] || 0) - (f.byCat[a] || 0)).map(c => { const sp = f.byCat[c] || 0, l = lim[c] || 0, over = l && sp > l; const w = l ? Math.min(100, sp / l * 100) : 0; return `<div class="row${S.categories[c] ? ' click' : ''}" style="display:grid;gap:6px"${S.categories[c] ? ` data-act="edit-budget" data-id="${c}"` : ''}><div class="kv"><span><b>${esc(catName(c))}</b> ${over ? '<span class="chip neg">Te pasaste</span>' : l && sp > l * 0.85 ? '<span class="chip warn">Cerca del límite</span>' : ''}</span><b class="${over ? 'neg' : ''}">${fmt(sp, 'COP')}${l ? ` <span class="muted">/ ${fmt(l, 'COP')}</span>` : ' <span class="muted small">sin límite</span>'}</b></div>${l ? `<div class="bar ${over ? 'over' : ''}"><i style="width:${w}%"></i></div>` : ''}</div>`; }).join('') : `<div class="empty"><b>Sin gastos este mes</b>Agrega un límite con "Nuevo presupuesto".</div>`}</div>
    <p class="small muted">Los límites y montos de esta sección están en COP. Toca una categoría para cambiar o quitar su límite.</p></section>`;
}
/* Anillo de progreso de una meta (círculo SVG con el porcentaje en el centro). */
function ring(pct) {
  const r = 26, c = 2 * Math.PI * r, v = Math.max(0, Math.min(100, pct));
  return `<div class="ring${v >= 100 ? ' done' : ''}" role="progressbar" aria-valuenow="${Math.round(v)}" aria-valuemin="0" aria-valuemax="100" aria-label="Progreso de la meta">
    <svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="${r}"/><circle class="fill" cx="32" cy="32" r="${r}" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c * (1 - v / 100)).toFixed(1)}"/></svg><span>${Math.round(v)}%</span></div>`;
}
function vPagos() {
  const list = Object.values(S.recurring).sort((a, b) => a.next < b.next ? -1 : 1); const lim = addDays(today(), 7);
  const row = r => { const n = daysBetween(today(), r.next); return `<div class="row"><span class="avatar" style="color:${n < 0 ? 'var(--neg)' : r.next <= lim ? 'var(--warn)' : 'var(--c6)'}">${ico('pagos')}</span><div class="main"><div class="t">${esc(r.name)}${r.demo ? '<span class="pill-demo">ejemplo</span>' : ''}</div><div class="s">${FREQ[r.freq]} · ${esc(S.accounts[r.accountId]?.name || 'sin cuenta')} · ${n < 0 ? `<span class="neg">vencido hace ${-n} días</span>` : `vence ${relDay(r.next)} (${fdate(r.next)})`}</div></div>
    <div class="r"><div class="amt">${fmt(r.amount, r.currency)}</div><div class="btns" style="justify-content:flex-end;margin-top:4px"><button class="btn sm primary" data-act="pay" data-id="${r.id}">Pagado</button><button class="btn sm ghost" data-act="edit-rec" data-id="${r.id}">Editar</button></div></div></div>`; };
  const soon = list.filter(r => r.active !== false && r.next <= lim), later = list.filter(r => !(r.active !== false && r.next <= lim));
  return modeNotice() + `<div class="card-head"><h1>Pagos recurrentes</h1><button class="btn primary" data-act="new-rec">Nuevo pago</button></div>
  <section class="card"><h2>Próximos 7 días</h2>${soon.length ? `<div class="rows">${soon.map(row).join('')}</div>` : `<div class="empty"><b>Nada por pagar esta semana</b>Aquí aparecen los pagos que vencen pronto.</div>`}</section>
  <section class="card"><h2>Todos los pagos</h2>${later.length ? `<div class="rows">${later.map(row).join('')}</div>` : `<div class="empty"><b>Sin más pagos</b>Agrega suscripciones, arriendo o cuotas con "Nuevo pago".</div>`}</section>
  <p class="small muted">Al tocar "Pagado", la app crea el gasto en la cuenta del pago y mueve la próxima fecha según la frecuencia.</p>`;
}
function vAjustes() {
  const nDemo = demoDocs().length;
  return modeNotice() + `<h1>Ajustes</h1>
  <section class="card"><h2>Moneda base</h2><p class="small muted" style="margin-top:0">El patrimonio total y los resúmenes se muestran en esta moneda.</p>
    <div class="seg">${['COP', 'USD', 'EUR'].map(c => `<button data-act="set-base" data-cur="${c}" aria-pressed="${baseCur() === c}">${c}</button>`).join('')}</div></section>
  <section class="card"><h2>Tema</h2><div class="seg">${[['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Oscuro']].map(([k, l]) => `<button data-act="set-theme" data-theme="${k}" aria-pressed="${themeMode() === k}">${l}</button>`).join('')}</div></section>
  <section class="card"><h2>Datos de ejemplo</h2><p class="small muted" style="margin-top:0">${nDemo ? `Hay ${nDemo} datos de ejemplo (cuentas, movimientos, metas…). Borrarlos no toca lo que tú hayas registrado.` : 'No hay datos de ejemplo cargados.'}</p>
    <div class="btns">${nDemo ? '<button class="btn danger" data-act="ask-clear-demo">Borrar datos de ejemplo</button>' : '<button class="btn" data-act="load-demo">Cargar datos de ejemplo</button>'}</div></section>
  <section class="card"><h2>Respaldo</h2><p class="small muted" style="margin-top:0">Descarga todos tus datos en un archivo .json. Guárdalo en tu computador o en la nube. Con "Restaurar" puedes volver a cargarlo.</p>
    <div class="btns"><button class="btn primary" data-act="export">Exportar mis datos</button><label class="btn" for="import-file">Restaurar respaldo</label><input id="import-file" type="file" accept=".json,application/json" hidden></div></section>
  ${storageCard()}
  <section class="card"><h2>Reiniciar cuenta</h2><p class="small muted" style="margin-top:0">Borra todo: cuentas, movimientos, inversiones, metas, pagos, alertas, categorías y ajustes${Store.mode === 'cloud' ? ', también en la nube' : ''}. No se puede deshacer. Si quieres guardar algo, exporta un respaldo antes.</p>
    <button class="btn danger" data-act="ask-reset">Reiniciar y borrar todo</button></section>`;
}
function storageCard() {
  if (Store.mode === 'cloud') return `<section class="card"><h2>Tu cuenta</h2><p class="small muted" style="margin-top:0">Tus datos se guardan en la nube (Supabase) con la cuenta <b>${esc(Store.user?.email || '')}</b>. Entra con ese correo desde el celular o el computador para verlos. Solo tú puedes leerlos. La app nunca pide claves de tus bancos: todo se escribe a mano.</p>
    <div class="btns"><button class="btn" data-act="reload-cloud">Actualizar datos</button><button class="btn danger" data-act="logout">Cerrar sesión</button></div></section>`;
  return `<section class="card"><h2>Dónde se guarda todo</h2>${Store.configError ? `<div class="notice warn" style="margin-bottom:10px"><span class="dot"></span><div class="grow">${esc(Store.configError)}</div></div>` : ''}<p class="small muted" style="margin:0">Tus datos se guardan solo en este navegador, en este computador. Si borras los datos del navegador, se pierden: exporta un respaldo de vez en cuando. Para guardarlos en la nube, llena el archivo js/config.js con los datos de Supabase (mira el README). La app nunca pide claves de tus bancos: todo se escribe a mano.</p></section>`;
}
function vLogin() {
  return `<div class="gate" data-gate="login"><span class="logo" aria-hidden="true">MP</span><section class="card"><h1>Inicia sesión</h1>
    <p class="muted small">Tus datos se guardan en la nube con tu cuenta. Entra con el mismo correo desde el celular o el computador.</p>
    <form data-form="login" class="fgrid" novalidate>
      ${fld('Correo', '<input id="login-email" name="email" type="email" autocomplete="email" required>')}
      ${fld('Contraseña', '<input id="login-pass" name="password" type="password" autocomplete="current-password" minlength="6" required>', 'Mínimo 6 caracteres. Usa una contraseña nueva, no la de tu banco.')}
      <div class="btns"><button class="btn primary" type="submit">Entrar</button><button class="btn" type="button" data-act="signup">Crear cuenta</button></div>
      <p class="small" id="login-msg" role="status" style="margin:0"></p>
    </form></section></div>`;
}
function vMigrate() {
  const local = Store.localSnapshot() || {}; const n = Object.values(local).reduce((s, c) => s + Object.keys(c || {}).length, 0);
  const acc = Object.values(local.accounts || {}); const real = acc.filter(a => !a.demo).length;
  return `<div class="gate wide" data-gate="migrate"><span class="logo" aria-hidden="true">MP</span><section class="card"><h1>Tu cuenta está lista</h1>
    <p class="muted">Tu nube está vacía. ¿Cómo quieres empezar?</p>
    <div class="morelist">
      ${n ? `<button data-act="migrate-local"><span><b>Subir lo que tengo en este navegador</b><span>${n} datos guardados aquí (${acc.length} cuentas${real < acc.length ? `, ${acc.length - real} de ejemplo` : ''}).</span></span></button>` : ''}
      <button data-act="migrate-demo"><span><b>Empezar con datos de ejemplo</b><span>Para ver cómo funciona. Luego los borras con un botón.</span></span></button>
      <button data-act="migrate-empty"><span><b>Empezar vacío</b><span>Solo las categorías por defecto. Creas tus cuentas desde cero.</span></span></button>
    </div></section></div>`;
}
function vMas() {
  return `<h1>Más</h1><div class="morelist">${moreViews().map(([k, t, s]) =>`<button data-go="${k}"><span class="avatar" style="color:var(--accent-text)">${ico(k)}</span><span><b>${t}</b><span>${s}</span></span></button>`).join('')}</div>`;
}
/* ---------- Análisis ----------
 * Todo lo que antes estaba en Inicio (evolución, resumen del mes, gráficos) y más: tendencias de 6 meses,
 * dónde se va el dinero y datos útiles calculados con lo que la persona registró. */
const MONTHLY = { weekly: 52 / 12, biweekly: 26 / 12, monthly: 1, quarterly: 1 / 3, yearly: 1 / 12 };
function analysis() {
  const base = baseCur(), T = today(), key = T.slice(0, 7), prevKey = addMonths(key + '-01', -1).slice(0, 7);
  const f = monthFlows(key), pf = monthFlows(prevKey);
  const nw = netWorth(), d = nw - netWorth(addDays(key + '-01', -1));
  const day = +T.slice(8), dim = new Date(+key.slice(0, 4), +key.slice(5), 0).getDate();
  const past = [1, 2, 3, 4, 5, 6].map(i => monthFlows(addMonths(key + '-01', -i).slice(0, 7))).filter(m => m.inc || m.exp);
  const avgExp = past.length ? past.reduce((s, m) => s + m.exp, 0) / past.length : 0;
  const avgSave = past.length ? past.reduce((s, m) => s + m.save, 0) / past.length : 0, avgInc = past.length ? past.reduce((s, m) => s + m.inc, 0) / past.length : 0;
  const b = balances(); let liquid = 0; for (const a of Object.values(S.accounts)) if (a.type !== 'crypto') liquid += conv(b[a.id], a.currency, base);
  const cats = Object.entries(f.byCat).sort((x, y) => y[1] - x[1]);
  const biggest = Object.values(S.txs).filter(t => t.type === 'expense' && t.date.startsWith(key)).sort((x, y) => txAmountIn(y, base) - txAmountIn(x, base))[0];
  const recurring = Object.values(S.recurring).filter(r => r.active !== false).reduce((s, r) => s + conv(r.amount, r.currency, base) * (MONTHLY[r.freq] || 1), 0);
  const subs = accList(false).reduce((s, a) => { const sb = subBalances(a); return s + Object.values(sb).reduce((x, v) => x + conv(v, a.currency, base), 0); }, 0);
  const nSubs = accList(false).reduce((s, a) => s + subList(a).length, 0);
  const H = holdings(); const inv = H.reduce((s, h) => s + h.value, 0), invB = H.reduce((s, h) => s + h.basis, 0);
  return { base, key, prevKey, f, pf, nw, d, day, dim, avgExp, avgSave, avgInc, liquid, cats, biggest, recurring, subs, nSubs, inv, invB, months: past.length };
}
function vAnalisis() {
  if (!Object.keys(S.accounts).length) return modeNotice() + `<h1>Análisis</h1><div class="card empty"><b>Aún no hay nada que analizar</b>Crea tus cuentas y registra movimientos: aquí verás cómo evoluciona tu dinero.</div>`;
  const A = analysis(), { base, f } = A; const mes = MESES_L[+A.key.slice(5) - 1], mesP = MESES_L[+A.prevKey.slice(5) - 1];
  const rate = f.inc > 0 ? f.save / f.inc * 100 : null; const perDay = f.exp / A.day; const proj = perDay * A.dim;
  const runway = A.avgExp > 0 ? A.liquid / A.avgExp : null;
  const kpi = (label, value, sub, cls = '') => `<div class="kpi"><span class="label">${label}</span><b class="${cls}">${value}</b>${sub ? `<span class="small muted">${sub}</span>` : ''}</div>`;
  const tips = [];
  if (A.pf.exp > 0 && f.exp > 0) { const ch = (proj - A.pf.exp) / A.pf.exp * 100; tips.push([ch > 5 ? 'neg' : ch < -5 ? 'pos' : '', `A este ritmo terminarás ${mes} con gastos de <b>${fmt(proj, base)}</b>, ${Math.abs(ch) < 5 ? `parecido a ${mesP}` : `un ${num(Math.abs(ch), 0)} % ${ch > 0 ? 'más' : 'menos'} que en ${mesP}`} (${fmt(A.pf.exp, base)}).`]); }
  if (A.cats.length) tips.push(['', `Donde más gastas este mes: <b>${esc(catName(A.cats[0][0]))}</b>, ${fmt(A.cats[0][1], base)} (${num(A.cats[0][1] / f.exp * 100, 0)} % de tus gastos).`]);
  if (A.biggest) tips.push(['', `Tu gasto más grande del mes: <b>${esc(A.biggest.note || catName(A.biggest.categoryId))}</b>, ${fmt(txAmountIn(A.biggest, base), base)} el ${fdate(A.biggest.date).slice(0, -5)}.`]);
  if (runway != null) tips.push([runway < 3 ? 'neg' : runway >= 6 ? 'pos' : '', `Con tu dinero disponible (sin cripto) cubres <b>${num(runway, 1)} ${runway >= 1 && runway < 2 ? 'mes' : 'meses'}</b> de gastos promedio. Lo recomendado es tener de 3 a 6 meses.`]);
  if (A.months) tips.push([A.avgSave >= 0 ? 'pos' : 'neg', `En los últimos ${A.months} meses ${A.avgSave >= 0 ? 'ahorraste' : 'gastaste de más'} en promedio <b>${fmt(Math.abs(A.avgSave), base)}</b> al mes${A.avgInc > 0 ? ` (${num(Math.abs(A.avgSave) / A.avgInc * 100, 0)} % de tus ingresos)` : ''}.`]);
  if (A.recurring > 0) tips.push(['', `Tus pagos recurrentes suman unos <b>${fmt(A.recurring, base)}</b> al mes${f.inc > 0 ? `, el ${num(A.recurring / f.inc * 100, 0)} % de lo que te entró en ${mes}` : ''}.`]);
  if (A.nSubs) tips.push(['', `Tienes <b>${fmt(A.subs, base)}</b> apartado en ${A.nSubs} ${A.nSubs === 1 ? 'subgrupo' : 'subgrupos'}.`]);
  if (A.inv > 0) tips.push([A.inv >= A.invB ? 'pos' : 'neg', `Tus inversiones valen <b>${fmt(A.inv, 'USD')}</b> (${pct(A.invB ? (A.inv - A.invB) / A.invB * 100 : 0)} frente a lo que pagaste).`]);
  const total = f.exp || 1;
  return modeNotice() + `<div class="card-head"><h1>Análisis</h1><span class="small muted">Cifras en ${base} · ${mes}</span></div>
  <div class="kpis">
    ${kpi('Patrimonio neto', fmt(A.nw, base), `${fmt(A.d, base, { sign: true })} en ${mes}`, '')}
    ${kpi(`Ahorro de ${mes}`, fmt(f.save, base), rate != null ? `${num(rate, 0)} % de tus ingresos` : 'Aún sin ingresos este mes', f.save >= 0 ? 'pos' : 'neg')}
    ${kpi('Gasto promedio por día', fmt(perDay, base), `Llevas ${A.day} ${A.day === 1 ? 'día' : 'días'} del mes`)}
    ${kpi('Tu dinero alcanza para', runway == null ? '—' : `${num(runway, 1)} meses`, 'Con tu gasto promedio', runway == null ? '' : runway < 3 ? 'neg' : '')}
  </div>
  <div class="stats">
    <div class="stat"><span class="label">Ingresos de ${mes}</span><span class="v pos">${fmt(f.inc, base)}</span></div>
    <div class="stat"><span class="label">Gastos de ${mes}</span><span class="v neg">${fmt(f.exp, base)}</span></div>
    <div class="stat"><span class="label">Te queda</span><span class="v ${f.save >= 0 ? '' : 'neg'}">${fmt(f.save, base)}</span></div>
  </div>
  <section class="card"><div class="card-head"><h2>Evolución del patrimonio</h2><span class="small muted">Cierre de cada mes</span></div><div class="chart-box"><canvas id="ch-nw" aria-label="Gráfico de evolución del patrimonio"></canvas></div></section>
  <section class="card"><div class="card-head"><h2>Ingresos y gastos</h2><span class="small muted">Últimos 6 meses</span></div><div class="chart-box"><canvas id="ch-flow" aria-label="Ingresos y gastos de los últimos 6 meses"></canvas></div>
    <div class="legend"><span><i style="background:var(--pos)"></i>Ingresos</span><span><i style="background:var(--neg)"></i>Gastos</span></div></section>
  <div class="grid g2">
    <section class="card"><div class="card-head"><h2>Gastos por categoría</h2><span class="small muted">${mes}</span></div>
      ${A.cats.length ? `<div class="catbars">${A.cats.map(([c, v]) => `<div class="catbar"><div class="kv"><span>${esc(catName(c))}</span><b>${fmt(v, base)} <span class="muted small">${num(v / total * 100, 0)} %</span></b></div><div class="bar"><i style="width:${(v / A.cats[0][1] * 100).toFixed(1)}%"></i></div></div>`).join('')}</div>`
        : '<div class="empty"><b>Sin gastos este mes</b>Cuando registres gastos, verás aquí en qué se va tu dinero.</div>'}</section>
    <section class="card"><h2>Lo que te conviene saber</h2>${tips.length ? `<ul class="tips">${tips.map(([c, t]) => `<li><span class="dot ${c}"></span><p>${t}</p></li>`).join('')}</ul>` : '<div class="empty"><b>Aún faltan datos</b>Registra movimientos de un par de meses para ver consejos.</div>'}</section>
  </div>
  <div class="grid g2">
    <section class="card"><h2>Por divisa</h2><div class="chart-box short"><canvas id="ch-cur" aria-label="Distribución por divisa"></canvas></div><div class="legend" id="lg-cur"></div></section>
    <section class="card"><h2>Por tipo de cuenta</h2><div class="chart-box short"><canvas id="ch-type" aria-label="Distribución por tipo de cuenta"></canvas></div></section>
  </div>
  <p class="small muted center">${esc(rateLine())}</p>`;
}
const VIEW_FN = { tarjeta: vTarjeta, inicio: vInicio, cuentas: vCuentas, movimientos: vMovimientos, analisis: vAnalisis, inversiones: vInversiones, mercado: vMercado, ahorro: vAhorro, pagos: vPagos, ajustes: vAjustes, mas: vMas };

/* ---------- Gráficos ---------- */
const CH = [];
const cssv = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const hexA = (h, a) => { const m = h.replace('#', ''); const n = parseInt(m.length === 3 ? m.split('').map(x => x + x).join('') : m, 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };
function baseOpts(cur, extra = {}) {
  const ink2 = cssv('--ink-2'), line = cssv('--line');
  return { responsive: true, maintainAspectRatio: false, animation: false, interaction: { mode: 'index', intersect: false },
    plugins: { legend: { display: false }, tooltip: { ...tipStyle(), callbacks: { label: c => ' ' + fmt(c.parsed.y ?? c.parsed, cur) } } },
    scales: { x: { grid: { display: false }, ticks: { color: ink2, maxTicksLimit: 6, maxRotation: 0 }, border: { color: line } },
      y: { grid: { display: false }, ticks: { color: ink2, maxTicksLimit: 5, callback: v => fmtShort(v, cur) }, border: { display: false } } }, ...extra };
}
/* Tooltip plano con los colores del tema (tinta sobre fondo invertido, sin esquinas redondas). */
const tipStyle = () => ({ backgroundColor: cssv('--ink'), titleColor: cssv('--bg'), bodyColor: cssv('--bg'), cornerRadius: 2, padding: 10, displayColors: false,
  titleFont: { family: cssv('--f'), weight: '600' }, bodyFont: { family: cssv('--f') } });
/* Gráficos de Análisis: evolución del patrimonio, ingresos y gastos por mes, por divisa y por tipo de cuenta. */
function mountAnalysisCharts() {
  const base = baseCur(); const C = ['--c1', '--c2', '--c3', '--c4', '--c5', '--c6'].map(cssv);
  const nwC = $('#ch-nw');
  if (nwC) {
    const T = today(); let first = T;
    for (const a of Object.values(S.accounts)) if (a.since && a.since < first) first = a.since;
    for (const t of Object.values(S.txs)) if (t.date < first) first = t.date;
    const pts = []; let m = addMonths(T.slice(0, 8) + '01', -11); if (m < first.slice(0, 8) + '01') m = first.slice(0, 8) + '01';
    while (m <= T) { const end = addDays(addMonths(m, 1), -1); if (end >= T) break; pts.push([end, MESES[+end.slice(5, 7) - 1] + ' ' + end.slice(2, 4)]); m = addMonths(m, 1); }
    pts.push([T, 'Hoy']);
    const acc = cssv('--chart');
    CH.push(new Chart(nwC, { type: 'line', data: { labels: pts.map(p => p[1]), datasets: [{ data: pts.map(p => netWorth(p[0] === T ? null : p[0])), borderColor: acc, backgroundColor: hexA(acc, .1), fill: true, tension: .35, pointRadius: 0, pointHoverRadius: 6, pointBackgroundColor: acc, borderWidth: 2 }] }, options: baseOpts(base) }));
  }
  const flC = $('#ch-flow');
  if (flC) {
    const keys = [5, 4, 3, 2, 1, 0].map(i => addMonths(today().slice(0, 8) + '01', -i).slice(0, 7)); const fl = keys.map(k => monthFlows(k));
    const bar = (data, col) => ({ data, backgroundColor: col, borderRadius: 999, borderSkipped: false, maxBarThickness: 14 });
    CH.push(new Chart(flC, { type: 'bar', data: { labels: keys.map(k => MESES[+k.slice(5) - 1]), datasets: [{ label: 'Ingresos', ...bar(fl.map(x => x.inc), cssv('--pos')) }, { label: 'Gastos', ...bar(fl.map(x => x.exp), cssv('--neg')) }] },
      options: baseOpts(base, { plugins: { legend: { display: false }, tooltip: { ...tipStyle(), callbacks: { label: c => ` ${c.dataset.label}: ${fmt(c.parsed.y, base)}` } } } }) }));
  }
  const curC = $('#ch-cur');
  if (curC) {
    const b = balances(); const g = {};
    for (const a of Object.values(S.accounts)) { const v = conv(b[a.id], a.currency, base); if (v > 0) g[a.currency] = (g[a.currency] || 0) + v; }
    const e = Object.entries(g).sort((x, y) => y[1] - x[1]); const tot = e.reduce((s, x) => s + x[1], 0);
    CH.push(new Chart(curC, { type: 'doughnut', data: { labels: e.map(x => x[0]), datasets: [{ data: e.map(x => x[1]), backgroundColor: e.map((_, i) => C[i % C.length]), borderColor: cssv('--surface'), borderWidth: 2 }] },
      options: { responsive: true, maintainAspectRatio: false, animation: false, cutout: '74%', plugins: { legend: { display: false }, tooltip: { ...tipStyle(), callbacks: { label: c => ` ${c.label}: ${fmt(c.parsed, base)} (${num(c.parsed / tot * 100, 1)} %)` } } } } }));
    $('#lg-cur').innerHTML = e.map((x, i) => `<span><i style="background:${C[i % C.length]}"></i>${x[0]} · ${num(x[1] / tot * 100, 1)} %</span>`).join('');
  }
  const tC = $('#ch-type');
  if (tC) {
    const b = balances(); const g = {};
    for (const a of Object.values(S.accounts)) g[a.type] = (g[a.type] || 0) + conv(b[a.id], a.currency, base);
    const e = Object.entries(g).sort((x, y) => y[1] - x[1]);
    CH.push(new Chart(tC, { type: 'bar', data: { labels: e.map(x => ACC_TYPES[x[0]]), datasets: [{ data: e.map(x => x[1]), backgroundColor: e.map((_, i) => C[i % C.length]), borderRadius: 999, borderSkipped: false, barThickness: 16 }] },
      options: baseOpts(base, { indexAxis: 'y', plugins: { legend: { display: false }, tooltip: { ...tipStyle(), callbacks: { label: c => ' ' + fmt(c.parsed.x, base) } } },
        scales: { x: { grid: { display: false }, ticks: { color: cssv('--ink-2'), maxTicksLimit: 4, callback: v => fmtShort(v, base) }, border: { display: false } }, y: { grid: { display: false }, ticks: { color: cssv('--ink') }, border: { display: false } } } }) }));
  }
}
function mountCharts() {
  while (CH.length) CH.pop().destroy();
  if (!window.Chart) return;
  Chart.defaults.font.family = cssv('--f'); Chart.defaults.font.size = 12;
  mountAnalysisCharts();
  // Gráficos de precio: cada <canvas data-chart="CLAVE"> (tasas, criptomonedas y futuros).
  for (const el of document.querySelectorAll('canvas[data-chart]')) {
    const key = el.dataset.chart, days = UI.range[key] ?? 30;
    // 1 día de Bitcoin: precios cada 5 minutos (lo demás solo tiene un dato por día: ayer y hoy)
    const intra = key === 'BTC' && days === 1 && INTRA.BTC;
    let s = intra ? INTRA.BTC.slice() : priceSeries(key);
    if (!intra) { const from = addDays(today(), -days); s = s.filter(p => p[0] >= from); }
    const q = key === 'USDCOP' || key === 'EURCOP' ? 'COP' : 'USD';
    const col = s.length > 1 && s[s.length - 1][1] >= s[0][1] ? cssv('--pos') : cssv('--neg');
    CH.push(new Chart(el, { type: 'line', data: { labels: s.map(p => intra ? p[0] : fdate(p[0]).slice(0, -5)), datasets: [{ data: s.map(p => p[1]), borderColor: col, backgroundColor: hexA(col, .08), fill: true, tension: .25, pointRadius: s.length < 12 ? 2.5 : 0, borderWidth: 1.5 }] },
      options: baseOpts(q, { scales: { x: { grid: { display: false }, ticks: { color: cssv('--ink-2'), maxTicksLimit: 4, maxRotation: 0 } }, y: { grid: { display: false }, ticks: { color: cssv('--ink-2'), maxTicksLimit: 4, callback: v => key === 'EURUSD' ? num(v, 3) : fmtShort(v, q) }, border: { display: false } } } }) }));
  }
}

/* ---------- Render ---------- */
let rq = 0;
function sched() { if (!rq) rq = requestAnimationFrame(() => { rq = 0; render(); }); }
function render() {
  renderNav(); renderThemeBtn();
  const gate = mode === 'login' || mode === 'migrate' || mode === 'loading';
  $('#rail').hidden = $('#tabbar').hidden = gate;
  document.body.classList.toggle('is-gate', mode === 'login' || mode === 'migrate');
  $('#fab').hidden = gate || ['ajustes', 'mas', 'tarjeta'].includes(UI.view); // en Tarjeta, el + del resto de la app confundiría
  if (mode === 'loading') return;
  if (mode === 'login' || mode === 'migrate') { while (CH.length) CH.pop().destroy(); if (!$('#main [data-gate="' + mode + '"]')) $('#main').innerHTML = mode === 'login' ? vLogin() : vMigrate(); return; }
  const ae = document.activeElement; const fid = ae && ae.id && $('#main').contains(ae) ? ae.id : null; const sel = fid && ae.selectionStart != null ? [ae.selectionStart, ae.selectionEnd] : null;
  $('#main').innerHTML = (VIEW_FN[UI.view] || vInicio)();
  if (fid) { const el = document.getElementById(fid); if (el) { el.focus(); if (sel) try { el.setSelectionRange(...sel); } catch (e) { } } }
  mountCharts();
}
function go(v) { document.body.classList.remove('side-open'); if (v !== UI.view) UI.txLimit = TX_FIRST; UI.view = v; render(); window.scrollTo(0, 0); }

/* ---------- Bienvenida ----------
 * Aparece cada vez que se abre la app, antes del inicio de sesión o de tus datos: logo, una frase y "Entrar".
 * No guarda nada: los datos se siguen cargando por detrás mientras la persona lee. */
let WELCOME = true;
function renderWelcome() {
  if (!WELCOME) return;
  let el = $('#welcome');
  if (!el) { // por si el navegador guardó un index.html viejo sin la bienvenida
    el = document.createElement('div'); el.id = 'welcome'; el.className = 'welcome';
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'wl-title');
    document.body.prepend(el);
  }
  document.body.classList.add('is-welcome'); el.hidden = false;
  el.innerHTML = `<div class="wl">
    <span class="wl-logo" aria-hidden="true">MP</span>
    <div class="wl-text"><h1 class="wl-title" id="wl-title">Tu dinero, simple.</h1>
      <p class="wl-lead">Cuentas, gastos, inversiones y metas en un solo lugar.</p></div>
    <div class="wl-go"><button class="btn primary lg" type="button" data-act="enter">Entrar</button>
      <p>Todo lo escribes tú. Nunca te pedimos claves de tus bancos.</p></div>
  </div>`;
  el.querySelector('[data-act="enter"]').focus({ preventScroll: true });
}
function enterApp() {
  const el = $('#welcome'); if (!WELCOME) return;
  const done = () => { WELCOME = false; el.hidden = true; el.innerHTML = ''; document.body.classList.remove('is-welcome'); render(); };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return done();
  el.classList.add('out'); setTimeout(done, 240);
}

/* ---------- Hoja (formularios) ---------- */
function openSheet(title, body, form) {
  $('#sheet-root').innerHTML = `<div class="scrim" data-act="close-sheet-bg"><form class="sheet" ${form ? `data-form="${form}"` : ''} novalidate><div class="sheet-head"><h2>${title}</h2><button type="button" class="btn sm ghost" data-act="close-sheet" aria-label="Cerrar">Cerrar</button></div>${body}</form></div>`;
  const first = $('#sheet-root input:not([type=radio]):not([type=hidden]), #sheet-root select'); if (first && matchMedia('(min-width: 700px)').matches) first.focus();
}
const closeSheet = () => { $('#sheet-root').innerHTML = ''; };
let toastT;
function toast(msg) { $('#toast-root').innerHTML = `<div class="toast" role="status">${esc(msg)}</div>`; clearTimeout(toastT); toastT = setTimeout(() => $('#toast-root').innerHTML = '', 3200); }
function askConfirm(title, text, yesLabel, onYes) {
  openSheet(title, `<p style="margin:0">${text}</p><div class="btns"><button type="button" class="btn danger" data-act="confirm-yes">${yesLabel}</button><button type="button" class="btn" data-act="close-sheet">Cancelar</button></div>`);
  CONFIRM = onYes;
}
let CONFIRM = null;
const fld = (label, inner, hint) => `<label class="field"><span>${label}</span>${inner}${hint ? `<small>${hint}</small>` : ''}</label>`;
const curSelect = (name, sel, onlyFiat) => `<select name="${name}">${(onlyFiat ? ['COP', 'USD', 'EUR'] : allCurrencies()).map(c => `<option ${c === sel ? 'selected' : ''}>${c}</option>`).join('')}</select>`;
const NUM_HINT = 'Usa coma para decimales: 1.234.567,89';

function accForm(a = {}) {
  const isNew = !a.id; const type = a.type || 'bank';
  openSheet(isNew ? 'Nueva cuenta' : 'Editar cuenta', `<input type="hidden" name="id" value="${a.id || ''}">
    ${fld('Nombre', `<input name="name" required maxlength="60" value="${esc(a.name || '')}" placeholder="Ej: Bancolombia, Nequi, Binance">`)}
    <div class="fgrid two">${fld('Tipo', `<select name="type">${Object.entries(ACC_TYPES).map(([k, l]) => `<option value="${k}" ${k === type ? 'selected' : ''}>${l}</option>`).join('')}</select>`)}
    ${fld('Detalle (opcional)', `<input name="sub" maxlength="40" value="${esc(a.sub || '')}" placeholder="Ahorros, corriente, PayPal…">`)}</div>
    <div class="fgrid two">${fld('Divisa', curSelect('currency', a.currency || 'COP'))}${fld('Saldo inicial', `<input name="initial" inputmode="decimal" value="${inNum(a.initial ?? '')}" placeholder="0">`, NUM_HINT)}</div>
    ${fld('Fecha del saldo inicial', `<input type="date" name="since" value="${a.since || today()}">`)}
    <div class="field"><span>Color</span><div class="swatches">${SWATCH.map((c, i) => `<label style="background:${c}" title="Color ${i + 1}"><input type="radio" name="color" value="${c}" ${(a.color || SWATCH[0]) === c ? 'checked' : ''}></label>`).join('')}</div></div>
    <div class="field"><span>Icono</span><div class="icopick">${['bank', 'wallet', 'cash', 'crypto', 'card', 'piggy'].map(k => `<label title="${k}"><input type="radio" name="icon" value="${k}" ${(a.icon || type) === k ? 'checked' : ''}>${ico(k)}</label>`).join('')}</div></div>
    <div class="btns"><button class="btn primary" type="submit">Guardar</button>${isNew ? '' : `<button type="button" class="btn" data-act="arch-acc" data-id="${a.id}">${a.archived ? 'Desarchivar' : 'Archivar'}</button><button type="button" class="btn danger" data-act="del-acc" data-id="${a.id}">Eliminar</button>`}</div>`, 'acc');
}
function txForm(t = {}) {
  const isNew = !t.id; const type = t.type || 'expense'; const accs = accList(false);
  if (!accs.length) { toast('Primero crea una cuenta'); return accForm(); }
  const from = t.accountId || accs[0].id; const to = t.toAccountId || (accs[1] || accs[0]).id;
  openSheet(isNew ? 'Nuevo movimiento' : 'Editar movimiento', `<input type="hidden" name="id" value="${t.id || ''}">
    <div class="seg" role="radiogroup" aria-label="Tipo">${[['expense', 'Gasto'], ['income', 'Ingreso'], ['transfer', 'Transferencia']].map(([k, l]) => `<label><input type="radio" name="type" value="${k}" ${type === k ? 'checked' : ''}>${l}</label>`).join('')}</div>
    <div class="fgrid two">${fld('Monto', `<input name="amount" id="tx-amount" inputmode="decimal" required value="${inNum(t.amount ?? '')}" placeholder="0">`, NUM_HINT)}${fld('Fecha', `<input type="date" name="date" value="${t.date || today()}">`)}</div>
    ${fld('Cuenta', `<select name="accountId" id="tx-from">${accOptions(from, false, false)}</select>`)}
    ${subField('subId', 'tx-sub', from, t.subId)}
    <div class="only-flow fgrid">${fld('Categoría', `<select name="categoryId">${catOptions(t.categoryId || (type === 'income' ? 'salario' : 'comida'))}</select>`)}</div>
    <div class="only-transfer fgrid">${fld('Hacia la cuenta', `<select name="toAccountId" id="tx-to">${accOptions(to, false, false)}</select>`)}
      ${subField('toSubId', 'tx-tosub', to, t.toSubId)}
      <div class="fgrid two" id="fx-row">${fld('Tasa de cambio', `<input id="tx-rate" inputmode="decimal" placeholder="Ej: 3.950">`, '1 unidad de origen = X de destino')}${fld('Monto recibido', `<input name="toAmount" id="tx-toamount" inputmode="decimal" value="${inNum(t.toAmount ?? '')}">`)}</div></div>
    ${fld('Nota (opcional)', `<input name="note" maxlength="80" value="${esc(t.note || '')}" placeholder="Ej: Mercado del mes">`)}
    <div class="btns"><button class="btn primary" type="submit">Guardar</button>${isNew ? '' : `<button type="button" class="btn danger" data-act="del-tx" data-id="${t.id}">Eliminar</button>`}</div>`, 'tx');
  syncFx(true);
}
/* Selector de subgrupo de la cuenta elegida; se oculta si la cuenta no tiene subgrupos. */
function subField(name, id, accId, sel) {
  const subs = subList(S.accounts[accId]);
  return `<label class="field" id="${id}-wrap"${subs.length ? '' : ' hidden'}><span>${name === 'toSubId' ? 'Al subgrupo' : 'Subgrupo'}</span><select name="${name}" id="${id}">
    <option value="">Dinero libre (sin subgrupo)</option>${subs.map(s => `<option value="${s.id}" ${sel === s.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></label>`;
}
function subForm(accId, sid) {
  const accs = accList(false); if (!accs.length) { toast('Primero crea una cuenta'); return accForm(); }
  const a = S.accounts[accId]; const s = a?.subs?.[sid] || {}; const isNew = !sid;
  const def = accId || (accs.find(x => x.type === 'bank') || accs[0]).id;
  openSheet(isNew ? 'Nuevo subgrupo' : 'Editar subgrupo', `<input type="hidden" name="sid" value="${sid || ''}">
    <p class="small muted" style="margin:0">Aparta parte del dinero de una cuenta para algo. Ej: de los 15.000.000 de Bancolombia, 3.000.000 para "Bicicleta". El dinero sigue en la cuenta; en los movimientos eliges si entra o sale de este subgrupo.</p>
    ${isNew ? fld('Cuenta', `<select name="accId">${accOptions(def, false, false)}</select>`) : `<input type="hidden" name="accId" value="${a.id}">${fld('Cuenta', `<input value="${esc(a.name)}" disabled>`)}`}
    ${fld('Nombre', `<input name="name" maxlength="40" required value="${esc(s.name || '')}" placeholder="Ej: Bicicleta, Viaje, Emergencias">`)}
    ${fld('Monto que apartas', `<input name="initial" inputmode="decimal" value="${inNum(s.initial ?? '')}" placeholder="0">`, 'En la divisa de la cuenta. Después sube o baja con los movimientos de este subgrupo.')}
    <div class="btns"><button class="btn primary" type="submit">Guardar</button>${isNew ? '' : `<button type="button" class="btn danger" data-act="del-sub" data-id="${a.id}" data-sid="${sid}">Eliminar</button>`}</div>`, 'sub');
}
function syncFx(init, src) {
  const fr = S.accounts[$('#tx-from')?.value], to = S.accounts[$('#tx-to')?.value]; const row = $('#fx-row'); if (!row || !fr || !to) return;
  const diff = fr.currency !== to.currency; row.hidden = !diff;
  if (!diff) return;
  row.querySelector('#tx-rate').closest('.field').querySelector('small').textContent = `1 ${fr.currency} = X ${to.currency}`;
  const amt = parseNum($('#tx-amount').value), rate = $('#tx-rate'), toA = $('#tx-toamount');
  if (init || src === 'acc') { const existing = parseNum(toA.value); if (init && existing && amt) rate.value = inNum(+(existing / amt).toPrecision(6)); else { rate.value = inNum(+conv(1, fr.currency, to.currency).toPrecision(6)); if (amt) toA.value = inNum(+(amt * parseNum(rate.value)).toFixed(8)); } }
  else if (src === 'rate' || src === 'amount') { const r = parseNum(rate.value); if (amt && r) toA.value = inNum(+(amt * r).toFixed(8)); }
  else if (src === 'toamount') { const v = parseNum(toA.value); if (amt && v) rate.value = inNum(+(v / amt).toPrecision(6)); }
}
function tradeForm(t = {}) {
  const isNew = !t.id;
  openSheet(isNew ? 'Registrar compra o venta' : 'Editar operación', `<input type="hidden" name="id" value="${t.id || ''}">
    <div class="seg" role="radiogroup">${[['buy', 'Compra'], ['sell', 'Venta']].map(([k, l]) => `<label><input type="radio" name="side" value="${k}" ${(t.side || 'buy') === k ? 'checked' : ''}>${l}</label>`).join('')}</div>
    <div class="fgrid two">${fld('Activo', `<select name="asset"><optgroup label="Criptomonedas">${Object.entries(coinList()).map(([k, n]) => `<option value="${k}" ${k === (t.asset || 'BTC') ? 'selected' : ''}>${esc(k)} · ${esc(n)}</option>`).join('')}</optgroup>
      <optgroup label="Futuros">${Object.entries(FUTURES).map(([k, f]) => `<option value="${k}" ${k === t.asset ? 'selected' : ''}>${esc(f.name)}</option>`).join('')}</optgroup></select>`)}${fld('Cantidad', `<input name="qty" inputmode="decimal" value="${inNum(t.qty ?? '')}" placeholder="0,005">`, 'Ej: 0,005 BTC o 2 unidades del S&amp;P 500')}</div>
    <div class="fgrid two">${fld('Precio por unidad', `<input name="price" inputmode="decimal" value="${inNum(t.price ?? '')}">`)}${fld('Moneda del precio', curSelect('priceCur', t.priceCur || 'USD', true))}</div>
    <div class="fgrid two">${fld('Fecha', `<input type="date" name="date" value="${t.date || today()}">`)}${fld('Plataforma', `<input name="platform" maxlength="40" value="${esc(t.platform || '')}" placeholder="Binance, MetaMask…">`)}</div>
    <div class="btns"><button class="btn primary" type="submit">Guardar</button>${isNew ? '' : `<button type="button" class="btn danger" data-act="del-trade" data-id="${t.id}">Eliminar</button>`}</div>`, 'trade');
}
function goalForm(g = {}) {
  const isNew = !g.id;
  openSheet(isNew ? 'Nueva meta' : 'Editar meta', `<input type="hidden" name="id" value="${g.id || ''}">
    ${fld('Nombre', `<input name="name" maxlength="60" value="${esc(g.name || '')}" placeholder="Ej: Viaje">`)}
    <div class="fgrid two">${fld('Monto objetivo', `<input name="target" inputmode="decimal" value="${inNum(g.target ?? '')}" placeholder="10.000.000">`, NUM_HINT)}${fld('Divisa', curSelect('currency', g.currency || 'COP', true))}</div>
    ${fld('Fecha límite', `<input type="date" name="deadline" value="${g.deadline || addMonths(today(), 6)}">`)}
    <div class="btns"><button class="btn primary" type="submit">Guardar</button>${isNew ? '' : `<button type="button" class="btn danger" data-act="del-goal" data-id="${g.id}">Eliminar</button>`}</div>`, 'goal');
}
function contribForm(g) {
  const hist = Object.values(S.contribs).filter(c => c.goalId === g.id).sort((a, b) => a.date < b.date ? 1 : -1);
  openSheet(`Aportar a "${esc(g.name)}"`, `<input type="hidden" name="goalId" value="${g.id}">
    <div class="fgrid two">${fld(`Monto (${g.currency})`, `<input name="amount" inputmode="decimal" placeholder="0">`, NUM_HINT)}${fld('Fecha', `<input type="date" name="date" value="${today()}">`)}</div>
    ${fld('Desde la cuenta', `<select name="accountId">${accOptions('', false, false)}</select>`, 'El dinero sigue en tu cuenta; queda apartado para esta meta.')}
    <div class="btns"><button class="btn primary" type="submit">Guardar aporte</button></div>
    ${hist.length ? `<div><div class="label" style="margin-bottom:4px">Aportes anteriores</div><div class="rows">${hist.map(c => `<div class="row"><div class="main"><div class="t">${fmt(c.amount, g.currency)}</div><div class="s">${fdate(c.date)} · ${esc(S.accounts[c.accountId]?.name || '—')}</div></div><button type="button" class="btn sm ghost danger" data-act="del-contrib" data-id="${c.id}">Quitar</button></div>`).join('')}</div></div>` : ''}`, 'contrib');
}
/* Un presupuesto = límite mensual (en COP) para una categoría de gasto. */
function budgetForm(cat) {
  const lim = S.settings.budget?.limits || {}; const isNew = !cat;
  const cats = Object.values(S.categories).filter(c => c.kind === 'expense').sort((a, b) => a.name.localeCompare(b.name));
  if (!cats.length) return toast('Primero crea una categoría de gasto en Movimientos');
  const sel = cat || (cats.find(c => !lim[c.id]) || cats[0]).id;
  openSheet(isNew ? 'Nuevo presupuesto' : 'Editar presupuesto', `<p class="small muted" style="margin:0">Pon un límite al mes para una categoría. Te avisamos si te pasas.</p>
    ${fld('Categoría', `<select name="cat">${cats.map(c => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${esc(c.name)}${isNew && lim[c.id] ? ' (ya tiene)' : ''}</option>`).join('')}</select>`)}
    ${fld('Límite mensual (COP)', `<input name="limit" inputmode="decimal" value="${inNum(lim[sel] || '')}" placeholder="500.000">`, NUM_HINT)}
    <div class="btns"><button class="btn primary" type="submit">Guardar</button>${!isNew && lim[cat] ? `<button type="button" class="btn danger" data-act="del-budget" data-id="${cat}">Quitar presupuesto</button>` : ''}</div>`, 'budget');
}
function recForm(r = {}) {
  const isNew = !r.id;
  openSheet(isNew ? 'Nuevo pago recurrente' : 'Editar pago', `<input type="hidden" name="id" value="${r.id || ''}">
    ${fld('Nombre', `<input name="name" maxlength="60" value="${esc(r.name || '')}" placeholder="Ej: Netflix, Arriendo">`)}
    <div class="fgrid two">${fld('Monto', `<input name="amount" inputmode="decimal" value="${inNum(r.amount ?? '')}">`, NUM_HINT)}${fld('Divisa', curSelect('currency', r.currency || 'COP', true))}</div>
    <div class="fgrid two">${fld('Frecuencia', `<select name="freq">${Object.entries(FREQ).map(([k, l]) => `<option value="${k}" ${(r.freq || 'monthly') === k ? 'selected' : ''}>${l}</option>`).join('')}</select>`)}${fld('Próxima fecha', `<input type="date" name="next" value="${r.next || today()}">`)}</div>
    <div class="fgrid two">${fld('Se paga desde', `<select name="accountId">${accOptions(r.accountId, false, false)}</select>`)}${fld('Categoría', `<select name="categoryId">${catOptions(r.categoryId || 'suscripciones')}</select>`)}</div>
    <label class="check"><input type="checkbox" name="active" ${r.active === false ? '' : 'checked'}> Activo</label>
    <div class="btns"><button class="btn primary" type="submit">Guardar</button>${isNew ? '' : `<button type="button" class="btn danger" data-act="del-rec" data-id="${r.id}">Eliminar</button>`}</div>`, 'rec');
}
function alertForm() {
  openSheet('Nueva alerta de precio', `${fld('Par', `<select name="pair">${pairOptions().map(p => `<option>${p}</option>`).join('')}</select>`)}
    <div class="fgrid two">${fld('Condición', `<select name="op"><option value=">">Supera</option><option value="<">Baja de</option></select>`)}${fld('Valor', `<input name="value" inputmode="decimal" placeholder="4.200">`, NUM_HINT)}</div>
    <div class="btns"><button class="btn primary" type="submit">Crear alerta</button></div>`, 'alert');
}
function catForm(c = {}) {
  const isNew = !c.id; const used = c.id && Object.values(S.txs).some(t => t.categoryId === c.id);
  openSheet(isNew ? 'Nueva categoría' : 'Editar categoría', `<input type="hidden" name="id" value="${c.id || ''}">
    ${fld('Nombre', `<input name="name" maxlength="40" value="${esc(c.name || '')}">`)}
    <div class="seg">${[['expense', 'Gasto'], ['income', 'Ingreso']].map(([k, l]) => `<label><input type="radio" name="kind" value="${k}" ${(c.kind || 'expense') === k ? 'checked' : ''}>${l}</label>`).join('')}</div>
    <div class="btns"><button class="btn primary" type="submit">Guardar</button>${isNew ? '' : `<button type="button" class="btn danger" data-act="del-cat" data-id="${c.id}">Eliminar</button>`}</div>
    ${used ? '<p class="small muted" style="margin:0">Esta categoría tiene movimientos. Si la eliminas, quedarán como "Sin categoría".</p>' : ''}`, 'cat');
}
/* Categorías (antes en Ajustes): se abren desde Movimientos. */
function catsSheet() {
  const cats = Object.values(S.categories).sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));
  openSheet('Categorías', `<div class="btns"><button type="button" class="btn primary" data-act="new-cat">Nueva categoría</button></div>
    ${cats.length ? `<div class="rows">${cats.map(c => `<div class="row click" data-act="edit-cat" data-id="${c.id}"><div class="main"><div class="t">${esc(c.name)}</div></div><span class="chip ${c.kind === 'income' ? 'pos' : 'neg'}">${c.kind === 'income' ? 'Ingreso' : 'Gasto'}</span></div>`).join('')}</div>`
      : '<div class="empty"><b>No hay categorías</b>Crea una para clasificar tus gastos e ingresos.</div>'}`);
}
/* Mercado: qué tasas, futuros y criptomonedas se muestran. */
const MARKET_FX = [['USDCOP', 'Dólar · USD/COP'], ['EURCOP', 'Euro · EUR/COP'], ['EURUSD', 'Euro · EUR/USD']];
const marketKeys = () => [...MARKET_FX.map(x => x[0]), ...Object.keys(FUTURES), ...Object.keys(coinList())];
const mHidden = () => new Set(S.settings.mview?.hidden || []);
function mviewForm() {
  const h = mHidden(); const box = (k, l) => `<label class="check"><input type="checkbox" name="show" value="${k}" ${h.has(k) ? '' : 'checked'}> ${esc(l)}</label>`;
  openSheet('Elegir qué ver', `<p class="small muted" style="margin:0">Desmarca lo que no quieras ver en Mercado.</p>
    <div class="label">Tasas de cambio</div><div class="checks">${MARKET_FX.map(([k, l]) => box(k, l)).join('')}</div>
    <div class="label">Futuros</div><div class="checks">${Object.entries(FUTURES).map(([k, f]) => box(k, f.name)).join('')}</div>
    <div class="label">Criptomonedas</div><div class="checks">${Object.entries(coinList()).map(([k, n]) => box(k, `${k} · ${n}`)).join('')}</div>
    <div class="btns"><button class="btn primary" type="submit">Guardar</button></div>`, 'mview');
}
function coinForm() {
  openSheet('Agregar criptomoneda', `<div class="fgrid two">${fld('Símbolo', `<input name="sym" maxlength="10" placeholder="ADA" style="text-transform:uppercase">`)}${fld('Nombre', `<input name="name" maxlength="30" placeholder="Cardano">`)}</div>
    ${fld('Precio actual en USD', `<input name="usd" inputmode="decimal" placeholder="0,45">`)}
    <div class="btns"><button class="btn primary" type="submit">Agregar</button></div>`, 'coin');
}

/* ---------- Guardar formularios ---------- */
const now = () => new Date().toISOString();
const FORMS = {
  async login(fd) {
    const msg = $('#login-msg'); msg.textContent = 'Entrando…';
    try { await Store.signIn(fd.get('email').trim(), fd.get('password')); await loadData(); }
    catch (e) { msg.textContent = e.message; }
  },
  async acc(fd) {
    const id = fd.get('id') || uid(); const prev = S.accounts[id] || {};
    const name = fd.get('name').trim(); if (!name) return toast('Escribe un nombre para la cuenta');
    const initial = parseNum(fd.get('initial') || '0'); if (!isFinite(initial)) return toast('Revisa el saldo inicial');
    await safe(() => put('accounts', id, { ...prev, name, type: fd.get('type'), sub: fd.get('sub').trim(), currency: fd.get('currency'), initial, since: fd.get('since') || today(), color: fd.get('color'), icon: fd.get('icon'), archived: !!prev.archived, order: prev.order ?? Object.keys(S.accounts).length + 1 }), 'Cuenta guardada');
    closeSheet();
  },
  async tx(fd) {
    const id = fd.get('id') || uid(); const prev = S.txs[id] || {}; const type = fd.get('type');
    const amount = parseNum(fd.get('amount')); if (!(amount > 0)) return toast('Escribe un monto mayor que cero');
    const d = { ...prev, type, amount, date: fd.get('date') || today(), accountId: fd.get('accountId'), note: fd.get('note').trim(), created: prev.created || now() };
    const sub = fd.get('subId'), toSub = fd.get('toSubId');
    if (sub && S.accounts[d.accountId]?.subs?.[sub]) d.subId = sub; else delete d.subId;
    if (type === 'transfer') {
      d.toAccountId = fd.get('toAccountId');
      if (toSub && S.accounts[d.toAccountId]?.subs?.[toSub]) d.toSubId = toSub; else delete d.toSubId;
      // En la misma cuenta se puede mover dinero entre lo libre y un subgrupo, o entre subgrupos.
      if (d.toAccountId === d.accountId && (d.subId || '') === (d.toSubId || '')) return toast('Elige otra cuenta o subgrupo de destino');
      const fr = S.accounts[d.accountId], to = S.accounts[d.toAccountId];
      d.toAmount = fr.currency === to.currency ? amount : parseNum(fd.get('toAmount'));
      if (!(d.toAmount > 0)) return toast('Escribe el monto recibido o la tasa');
      d.categoryId = '';
    } else { d.categoryId = fd.get('categoryId'); delete d.toAccountId; delete d.toAmount; delete d.toSubId; }
    await safe(() => put('txs', id, d), 'Movimiento guardado'); closeSheet();
  },
  async trade(fd) {
    const id = fd.get('id') || uid(); const qty = parseNum(fd.get('qty')), price = parseNum(fd.get('price'));
    if (!(qty > 0) || !(price > 0)) return toast('Revisa la cantidad y el precio');
    await safe(() => put('trades', id, { ...(S.trades[id] || {}), side: fd.get('side'), asset: fd.get('asset'), qty, price, priceCur: fd.get('priceCur'), date: fd.get('date') || today(), platform: fd.get('platform').trim() }), 'Operación guardada'); closeSheet();
  },
  async goal(fd) {
    const id = fd.get('id') || uid(); const target = parseNum(fd.get('target')); const name = fd.get('name').trim();
    if (!name || !(target > 0)) return toast('Escribe el nombre y el monto de la meta');
    await safe(() => put('goals', id, { ...(S.goals[id] || {}), name, target, currency: fd.get('currency'), deadline: fd.get('deadline') }), 'Meta guardada'); closeSheet();
  },
  async contrib(fd) {
    const amount = parseNum(fd.get('amount')); if (!(amount > 0)) return toast('Escribe un monto');
    await safe(() => put('contribs', uid(), { goalId: fd.get('goalId'), accountId: fd.get('accountId'), amount, date: fd.get('date') || today() }), 'Aporte guardado'); closeSheet();
  },
  async budget(fd) {
    const cat = fd.get('cat'), n = parseNum(fd.get('limit')); if (!cat) return toast('Elige una categoría');
    if (!(n > 0)) return toast('Escribe el límite del mes');
    const b = S.settings.budget || {};
    await safe(() => put('settings', 'budget', { ...b, limits: { ...(b.limits || {}), [cat]: n } }), 'Presupuesto guardado'); closeSheet();
  },
  async sub(fd) {
    const a = S.accounts[fd.get('accId')]; if (!a) return toast('Elige una cuenta');
    const name = fd.get('name').trim(); if (!name) return toast('Escribe un nombre para el subgrupo');
    const initial = parseNum(fd.get('initial') || '0'); if (!isFinite(initial) || initial < 0) return toast('Revisa el monto que apartas');
    const sid = fd.get('sid') || 's' + uid();
    await safe(() => put('accounts', a.id, { ...a, subs: { ...(a.subs || {}), [sid]: { name, initial } } }), 'Subgrupo guardado'); closeSheet();
  },
  async mview(fd) {
    const shown = new Set(fd.getAll('show')); const hidden = marketKeys().filter(k => !shown.has(k));
    await safe(() => put('settings', 'mview', { hidden }), 'Listo'); closeSheet();
  },
  async rec(fd) {
    const id = fd.get('id') || uid(); const amount = parseNum(fd.get('amount')); const name = fd.get('name').trim();
    if (!name || !(amount > 0)) return toast('Escribe el nombre y el monto');
    await safe(() => put('recurring', id, { ...(S.recurring[id] || {}), name, amount, currency: fd.get('currency'), freq: fd.get('freq'), next: fd.get('next'), accountId: fd.get('accountId'), categoryId: fd.get('categoryId'), active: fd.get('active') === 'on' }), 'Pago guardado'); closeSheet();
  },
  async alert(fd) {
    const value = parseNum(fd.get('value')); if (!(value > 0)) return toast('Escribe el valor de la alerta');
    await safe(() => put('alerts', uid(), { pair: fd.get('pair'), op: fd.get('op'), value, active: true }), 'Alerta creada'); closeSheet();
  },
  async cat(fd) {
    const name = fd.get('name').trim(); if (!name) return toast('Escribe un nombre');
    const id = fd.get('id') || 'c-' + uid();
    await safe(() => put('categories', id, { ...(S.categories[id] || {}), name, kind: fd.get('kind') }), 'Categoría guardada'); closeSheet();
  },
  async coin(fd) {
    const sym = fd.get('sym').trim().toUpperCase().replace(/[^A-Z0-9]/g, ''); const usd = parseNum(fd.get('usd'));
    if (!sym || !(usd > 0)) return toast('Escribe el símbolo y el precio');
    const prev = S.market.manual || {};
    await safe(() => put('market', 'manual', { ...prev, coins: { ...(prev.coins || {}), [sym]: { name: fd.get('name').trim() || sym, usd, updated: now() } } }), `${sym} agregada`); closeSheet();
  },
};

/* ---------- Acciones ---------- */
const RESET_TEXT = 'BORRAR TODO';
const ACTS = {
  'new-tx': (_, el) => txForm(el?.dataset.type ? { type: el.dataset.type } : {}), 'edit-tx': id => txForm(S.txs[id]),
  'del-tx': id => askConfirm('¿Eliminar movimiento?', 'El saldo de la cuenta se recalcula sin este movimiento.', 'Eliminar', () => safe(() => del('txs', id), 'Movimiento eliminado')),
  'new-acc': () => accForm(), 'edit-acc': id => accForm(S.accounts[id]),
  'arch-acc': id => { const a = S.accounts[id]; closeSheet(); safe(() => put('accounts', id, { ...a, archived: !a.archived }), a.archived ? 'Cuenta activa otra vez' : 'Cuenta archivada'); },
  'del-acc': id => { const n = Object.values(S.txs).filter(t => t.accountId === id || t.toAccountId === id).length;
    askConfirm('¿Eliminar cuenta?', `Se eliminará "${esc(S.accounts[id].name)}"${n ? ` y sus ${n} movimientos` : ''}. Esto no se puede deshacer. Si solo quieres ocultarla, mejor archívala.`, 'Eliminar cuenta',
      () => safe(() => writeMany([...Object.values(S.txs).filter(t => t.accountId === id || t.toAccountId === id).map(t => ['del', 'txs', t.id]), ['del', 'accounts', id]]), 'Cuenta eliminada')); },
  'toggle-arch': () => { UI.showArchived = !UI.showArchived; render(); },
  'new-trade': () => tradeForm(), 'edit-trade': id => tradeForm(S.trades[id]),
  'del-trade': id => askConfirm('¿Eliminar operación?', 'Se quitará de tu historial de inversiones.', 'Eliminar', () => safe(() => del('trades', id), 'Operación eliminada')),
  'new-goal': () => goalForm(), 'edit-goal': id => goalForm(S.goals[id]), 'contrib': id => contribForm(S.goals[id]),
  'del-goal': id => askConfirm('¿Eliminar meta?', 'También se borran sus aportes registrados. El dinero de tus cuentas no cambia.', 'Eliminar meta',
    () => safe(() => writeMany([...Object.values(S.contribs).filter(c => c.goalId === id).map(c => ['del', 'contribs', c.id]), ['del', 'goals', id]]), 'Meta eliminada')),
  'del-contrib': id => { closeSheet(); safe(() => del('contribs', id), 'Aporte quitado'); },
  'new-budget': () => budgetForm(), 'edit-budget': id => budgetForm(id),
  'del-budget': id => { const b = S.settings.budget || {}; const limits = { ...(b.limits || {}) }; delete limits[id]; closeSheet(); safe(() => put('settings', 'budget', { ...b, limits }), 'Presupuesto quitado'); },
  'new-sub': (_, el) => subForm(el?.dataset.acc), 'edit-sub': (id, el) => subForm(id, el.dataset.sid),
  'del-sub': (id, el) => { const a = S.accounts[id], sid = el.dataset.sid;
    askConfirm('¿Eliminar subgrupo?', `Se elimina "${esc(subName(a, sid))}". El dinero y sus movimientos se quedan en ${esc(a.name)} como dinero libre.`, 'Eliminar',
      () => { const subs = { ...(a.subs || {}) }; delete subs[sid]; safe(() => put('accounts', id, { ...a, subs }), 'Subgrupo eliminado'); }); },
  'cats': () => catsSheet(),
  'mview': () => mviewForm(),
  'refresh-market': async () => {
    if (UI.refreshing) return; UI.refreshing = true; LIVE.status = 'pending'; render();
    await tryLive(); UI.refreshing = false; render();
    toast(LIVE.status === 'ok' ? 'Precios actualizados' : 'No se pudo actualizar. Revisa tu internet.');
  },
  'bmonth': (_, el) => { const d = +el.dataset.d; UI.budgetMonth = d === 0 ? today().slice(0, 7) : addMonths(UI.budgetMonth + '-01', d).slice(0, 7); render(); },
  'new-rec': () => recForm(), 'edit-rec': id => recForm(S.recurring[id]),
  'del-rec': id => askConfirm('¿Eliminar pago recurrente?', 'Los gastos que ya registraste no se borran.', 'Eliminar', () => safe(() => del('recurring', id), 'Pago eliminado')),
  'pay': id => { const r = S.recurring[id]; const a = S.accounts[r.accountId] || accList(false)[0]; if (!a) return toast('Primero crea una cuenta');
    const amount = +conv(r.amount, r.currency, a.currency).toFixed(8);
    safe(async () => { await put('txs', uid(), { type: 'expense', amount, date: today(), accountId: a.id, categoryId: r.categoryId || 'otros_g', note: r.name, recurringId: id, created: now() }); await put('recurring', id, { ...r, next: nextDate(r.next, r.freq) }); },
      `Listo: se registró el gasto de ${r.name}`); },
  'new-alert': () => alertForm(), 'alert-off': id => safe(() => put('alerts', id, { ...S.alerts[id], active: false }), 'Alerta pausada'),
  'toggle-alert': id => { const a = S.alerts[id]; safe(() => put('alerts', id, { ...a, active: a.active === false })); },
  'del-alert': id => safe(() => del('alerts', id), 'Alerta borrada'),
  'range': (_, el) => { UI.range[el.dataset.key] = +el.dataset.days; render(); if (el.dataset.key === 'BTC' && +el.dataset.days === 1) loadIntraday(); },
  'add-coin': () => coinForm(),
  'new-cat': () => catForm(), 'edit-cat': id => catForm(S.categories[id]),
  'del-cat': id => { closeSheet(); safe(() => del('categories', id), 'Categoría eliminada'); },
  'set-base': (_, el) => safe(() => put('settings', 'main', { ...(S.settings.main || {}), base: el.dataset.cur })),
  'set-theme': (_, el) => setTheme(el.dataset.theme, el),
  'load-demo': () => loadDemo(),
  'ask-clear-demo': () => askConfirm('¿Borrar los datos de ejemplo?', 'Se borran solo las cuentas, movimientos, metas, pagos y alertas marcados como ejemplo. Lo que tú registraste se queda.', 'Borrar ejemplo', clearDemo),
  'export': () => exportData(),
  'toggle-hide': () => setMoneyHidden(!moneyHidden()),
  'ask-reset': () => openSheet('¿Borrar todo?', `<p style="margin:0">Se borrarán <b>todos</b> tus datos${Store.mode === 'cloud' ? ' en la nube y en todos tus aparatos' : ''}. Esto no se puede deshacer.</p>
    ${fld(`Para confirmar, escribe <b>${RESET_TEXT}</b>`, `<input id="reset-text" autocomplete="off" spellcheck="false">`)}
    <div class="btns"><button type="button" class="btn danger" id="reset-go" data-act="do-reset" disabled>Borrar todo</button><button type="button" class="btn" data-act="close-sheet">Cancelar</button></div>`),
  'do-reset': async () => {
    if ($('#reset-text')?.value.trim().toUpperCase() !== RESET_TEXT) return;
    closeSheet(); toast('Borrando todo…');
    await safe(async () => {
      await Store.clearAll();
      for (const c of COLS) S[c] = {};
      UI.view = 'inicio';
      if (Store.mode === 'cloud') await loadData(); // la nube queda vacía: muestra "¿Cómo quieres empezar?"
      else { await loadSeedMarket(); await firstRun(false); render(); }
    }, 'Listo: tu cuenta quedó en blanco');
  },
  'signup': async (_, el) => {
    const f = el.closest('form'); const email = f.email.value.trim(), pw = f.password.value; const msg = $('#login-msg');
    if (!email || pw.length < 6) { msg.textContent = 'Escribe tu correo y una contraseña de al menos 6 caracteres.'; return; }
    msg.textContent = 'Creando tu cuenta…';
    try {
      const inNow = await Store.signUp(email, pw);
      if (inNow) await loadData();
      else msg.innerHTML = '<b>Revisa tu correo.</b> Te enviamos un enlace para confirmar la cuenta. Ábrelo y luego vuelve aquí y toca "Entrar".';
    } catch (e) { msg.textContent = e.message; }
  },
  'logout': () => askConfirm('¿Cerrar sesión?', 'Tus datos siguen guardados en la nube. Para verlos, vuelve a entrar con tu correo.', 'Cerrar sesión', async () => {
    await Store.signOut(); for (const c of COLS) S[c] = {}; mode = 'login'; UI.view = 'inicio'; render();
  }),
  'reload-cloud': () => loadData().then(() => toast('Datos actualizados')),
  'migrate-local': async () => {
    const local = Store.localSnapshot() || {}; const list = [];
    for (const c of COLS) for (const [id, d] of Object.entries(local[c] || {})) list.push(['put', c, id, d]);
    mode = 'ready'; render();
    await safe(() => writeMany(list, 'Subiendo a la nube'), `Listo: se subieron ${list.length} datos a la nube`);
    await firstRun(false); render();
  },
  'migrate-demo': async () => { mode = 'ready'; render(); await firstRun(true); render(); },
  'migrate-empty': async () => { mode = 'ready'; render(); await firstRun(false); render(); },
  'clear-filters': () => { UI.f = { from: '', to: '', acc: '', cat: '', type: '', q: '', min: '', max: '' }; UI.txLimit = TX_FIRST; render(); },
  'toggle-filters': () => { UI.showFilters = !UI.showFilters; render(); if (UI.showFilters) $('#f-from')?.focus(); },
  'more-tx': () => { UI.txLimit += TX_MORE; render(); },
  'enter': () => enterApp(),
  'toggle-side': () => { const o = document.body.classList.toggle('side-open'); $('#side-btn')?.setAttribute('aria-expanded', o); },
  'close-side': () => { document.body.classList.remove('side-open'); $('#side-btn')?.setAttribute('aria-expanded', 'false'); },
  'close-sheet': () => closeSheet(), 'confirm-yes': () => { const f = CONFIRM; CONFIRM = null; closeSheet(); f && f(); },
};
document.addEventListener('click', e => {
  if (e.target.matches('.scrim')) return closeSheet();
  if (e.target.closest('.brand')) brandTap();
  const g = e.target.closest('[data-go]'); if (g) return go(g.dataset.go);
  const a = e.target.closest('[data-act]'); if (!a || a.dataset.act === 'close-sheet-bg') return;
  const fn = ACTS[a.dataset.act]; if (fn) { e.preventDefault(); fn(a.dataset.id, a); }
});
document.addEventListener('submit', e => { e.preventDefault(); const f = e.target; const fn = FORMS[f.dataset.form]; if (fn) fn(new FormData(f), f); });
document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.filter === 'q') { UI.f.q = t.value; UI.txLimit = TX_FIRST; sched(); }
  if (t.dataset.cfilter === 'q') { UI.cf.q = t.value; UI.ccLimit = TX_FIRST; sched(); }
  if (t.id === 'reset-text') $('#reset-go').disabled = t.value.trim().toUpperCase() !== RESET_TEXT;
  if (t.id === 'tx-rate') syncFx(false, 'rate'); if (t.id === 'tx-toamount') syncFx(false, 'toamount'); if (t.id === 'tx-amount') syncFx(false, 'amount');
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.filter && t.dataset.filter !== 'q') { UI.f[t.dataset.filter] = t.value; UI.txLimit = TX_FIRST; render(); }
  if (t.dataset.cfilter && t.dataset.cfilter !== 'q') { UI.cf[t.dataset.cfilter] = t.value; UI.ccLimit = TX_FIRST; render(); }
  if (t.id === 'tx-from' || t.id === 'tx-to') { syncFx(false, 'acc'); const [n, id] = t.id === 'tx-from' ? ['subId', 'tx-sub'] : ['toSubId', 'tx-tosub']; $(`#${id}-wrap`).outerHTML = subField(n, id, t.value); }
  if (t.id === 'base-sel') safe(() => put('settings', 'main', { ...(S.settings.main || {}), base: t.value }));
  if (t.id === 'import-file' && t.files[0]) importData(t.files[0]);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') { if ($('#sheet-root').innerHTML) closeSheet(); else ACTS['close-side'](); } });

/* ---------- Tarjeta de crédito (sección secreta) ----------
 * Se desbloquea tocando 5 veces el logo MP. Es un registro aparte: sus tarjetas (cards), gastos y pagos
 * (cardtx) y categorías (cardcats) NO cuentan en el patrimonio, en Movimientos, en Ahorro ni en Análisis.
 * Cupo disponible = cupo − gastos + pagos. "Reiniciar cupo" registra el pago de la tarjeta. */
const DEFAULT_CC_CATS = [['comida', 'Comida'], ['transporte', 'Transporte'], ['compras', 'Compras'], ['servicios', 'Servicios'], ['ocio', 'Ocio'], ['salud', 'Salud'], ['suscripciones', 'Suscripciones'], ['viajes', 'Viajes'], ['otros', 'Otros']];
Object.assign(UI, { ccCard: '', cf: { from: '', to: '', cat: '', type: '', q: '', min: '', max: '' }, ccFilters: false, ccLimit: TX_FIRST });
function ccUnlocked() { return !!S.settings.secret?.cc; }
let brandN = 0, brandT;
function brandTap() { clearTimeout(brandT); brandT = setTimeout(() => { brandN = 0; }, 1500); if (++brandN >= 5) { brandN = 0; unlockCC(); } }
async function unlockCC() {
  if (mode !== 'ready' || ccUnlocked()) return;
  await safe(async () => {
    await put('settings', 'secret', { ...(S.settings.secret || {}), cc: true });
    if (!Object.keys(S.cardcats).length) await writeMany(DEFAULT_CC_CATS.map(([id, name]) => ['put', 'cardcats', 'cc-' + id, { name }]));
  });
  toast('Desbloqueaste la sección Tarjeta de crédito'); go('tarjeta');
}
const ccCards = () => Object.values(S.cards).sort((a, b) => a.name.localeCompare(b.name));
const ccCur = () => S.cards[UI.ccCard] || ccCards()[0];
const ccCatName = id => S.cardcats[id]?.name || 'Sin categoría';
const ccCatOptions = (sel, withAll) => (withAll ? '<option value="">Todas</option>' : '') + Object.values(S.cardcats).sort((a, b) => a.name.localeCompare(b.name)).map(c => `<option value="${c.id}" ${sel === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
function ccUsed(c) { let u = 0; for (const t of Object.values(S.cardtx)) if (t.cardId === c.id) u += t.type === 'payment' ? -t.amount : t.amount; return u; }
const ccActive = () => ['from', 'to', 'cat', 'type'].filter(k => UI.cf[k]).length + (UI.cf.min || UI.cf.max ? 1 : 0);
function ccFiltered(c) {
  const f = UI.cf, q = f.q.trim().toLowerCase(), min = parseNum(f.min), max = parseNum(f.max);
  return Object.values(S.cardtx).filter(t => t.cardId === c.id && (!f.from || t.date >= f.from) && (!f.to || t.date <= f.to) && (!f.cat || t.categoryId === f.cat) && (!f.type || t.type === f.type)
    && (!q || (t.note || '').toLowerCase().includes(q) || ccCatName(t.categoryId).toLowerCase().includes(q)) && (isNaN(min) || t.amount >= min) && (isNaN(max) || t.amount <= max)).sort(byDateDesc);
}
function ccRow(t, cur) {
  const pay = t.type === 'payment'; const title = t.note || (pay ? 'Pago de la tarjeta' : ccCatName(t.categoryId));
  return `<div class="row click" data-act="cc-edit-tx" data-id="${t.id}"><span class="avatar ${pay ? 'income' : 'expense'}">${ico(pay ? 'in' : 'out')}</span>
    <div class="main"><div class="t">${esc(title)}</div><div class="s">${pay ? 'Pago · se libera cupo' : esc(ccCatName(t.categoryId))}</div></div>
    <div class="r"><div class="amt ${pay ? 'pos' : 'neg'}">${fmt(pay ? t.amount : -t.amount, cur, { sign: true })}</div></div></div>`;
}
function vTarjeta() {
  if (!ccUnlocked()) return `<h1>Tarjeta de crédito</h1><div class="card empty"><b>Sección no disponible</b>Vuelve a Inicio.</div>`;
  const cards = ccCards(); const c = ccCur();
  if (!c) return modeNotice() + `<h1>Tarjeta de crédito</h1><div class="card empty"><b>Aún no tienes una tarjeta</b>Crea una con su cupo para llevar el saldo, los gastos y los pagos. Esta sección es aparte: no cuenta en tu patrimonio ni en tus gastos.<div class="btns" style="justify-content:center;margin-top:14px"><button class="btn primary" data-act="cc-new-card">Nueva tarjeta</button></div></div>`;
  const cur = c.currency || 'COP', used = ccUsed(c), avail = c.limit - used, p = c.limit > 0 ? Math.max(0, Math.min(100, used / c.limit * 100)) : 0;
  const list = ccFiltered(c), f = UI.cf, nf = ccActive(), open = UI.ccFilters, shown = Math.min(UI.ccLimit, list.length);
  const byCat = {}; let spent = 0; for (const t of list) if (t.type !== 'payment') { byCat[t.categoryId] = (byCat[t.categoryId] || 0) + t.amount; spent += t.amount; }
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  let rows = '', day = ''; for (const t of list.slice(0, UI.ccLimit)) { if (t.date !== day) { day = t.date; rows += `<div class="day">${dayLabel(day)}</div>`; } rows += ccRow(t, cur); }
  return modeNotice() + `<div class="card-head"><h1>Tarjeta de crédito</h1><div class="btns">
      ${cards.length > 1 ? `<div class="seg" role="group" aria-label="Tarjeta">${cards.map(x => `<button data-act="cc-pick" data-id="${x.id}" aria-pressed="${x.id === c.id}">${esc(x.name)}</button>`).join('')}</div>` : ''}
      <button class="btn" data-act="cc-edit-card" data-id="${c.id}">Editar tarjeta</button><button class="btn" data-act="cc-new-card">${ico('plus')}Nueva tarjeta</button></div></div>
  <section class="hero">
    <span class="label">Cupo disponible · ${esc(c.name)}</span>
    <span class="big ${avail < 0 ? 'neg' : ''}">${fmt(avail, cur)}</span>
    <div class="cc-bar"><div class="bar ${avail < 0 ? 'over' : ''}"><i style="width:${p.toFixed(1)}%"></i></div><span class="small muted">Usado ${fmt(used, cur)} de ${fmt(c.limit, cur)}</span></div>
    <div class="hero-acts two"><button class="mv-add expense" data-act="cc-new" data-type="expense"><span class="mv-ico">${ico('minus')}</span>Gasto</button>
      <button class="mv-add income" data-act="cc-new" data-type="payment"><span class="mv-ico">${ico('refresh')}</span>Reiniciar cupo</button></div>
  </section>
  <div class="mv-find">
    <label class="search">${ico('search')}<input id="cf-q" data-cfilter="q" type="search" placeholder="Buscar por nota o categoría" aria-label="Buscar en la tarjeta" value="${esc(f.q)}"></label>
    <div class="find-acts"><button class="btn filt-btn" data-act="cc-toggle-filters" aria-expanded="${open}" aria-controls="cc-filters">${ico('filter')}Filtros${nf ? `<span class="count">${nf}</span>` : ''}</button>
      <button class="btn filt-btn" data-act="cc-cats">${ico('tag')}Categorías</button></div>
    ${open ? `<section class="card filters" id="cc-filters" aria-label="Filtros">
      <label class="field"><span>Desde</span><input id="cf-from" data-cfilter="from" type="date" value="${f.from}"></label>
      <label class="field"><span>Hasta</span><input id="cf-to" data-cfilter="to" type="date" value="${f.to}"></label>
      <label class="field"><span>Categoría</span><select id="cf-cat" data-cfilter="cat">${ccCatOptions(f.cat, true)}</select></label>
      <label class="field"><span>Tipo</span><select id="cf-type" data-cfilter="type"><option value="">Todos</option><option value="expense" ${f.type === 'expense' ? 'selected' : ''}>Gastos</option><option value="payment" ${f.type === 'payment' ? 'selected' : ''}>Pagos</option></select></label>
      <div class="field range"><span id="cf-amt-l">Monto (en ${cur})</span><div class="range-in" role="group" aria-labelledby="cf-amt-l">
        <input id="cf-min" data-cfilter="min" inputmode="decimal" placeholder="Desde" aria-label="Monto desde" value="${esc(f.min)}"><span aria-hidden="true">–</span>
        <input id="cf-max" data-cfilter="max" inputmode="decimal" placeholder="Hasta" aria-label="Monto hasta" value="${esc(f.max)}"></div></div>
      <div class="filters-foot"><button class="btn" data-act="cc-clear"${nf || f.q ? '' : ' disabled'}>Limpiar filtros</button></div>
    </section>` : ''}
  </div>
  <section class="card"><div class="card-head"><h2>Gastos por categoría</h2><span class="small muted">${nf || f.q ? 'Con los filtros puestos' : 'Todos los gastos'} · ${fmt(spent, cur)}</span></div>
    ${cats.length ? `<div class="catbars">${cats.map(([k, v]) => `<div class="catbar"><div class="kv"><span>${esc(ccCatName(k))}</span><b>${fmt(v, cur)} <span class="muted small">${num(v / spent * 100, 0)} %</span></b></div><div class="bar"><i style="width:${(v / cats[0][1] * 100).toFixed(1)}%"></i></div></div>`).join('')}</div>`
      : '<div class="empty"><b>Sin gastos</b>Registra un gasto con el botón de arriba.</div>'}</section>
  <section class="card list"><div class="card-head"><h2>Movimientos de la tarjeta</h2></div>
    ${list.length ? `<div class="rows">${rows}</div><div class="more"><span class="small muted">Viendo ${shown} de ${list.length}</span>${list.length > shown ? '<button class="btn" data-act="cc-more">Cargar más</button>' : ''}</div>`
      : `<div class="empty"><b>${nf || f.q ? 'No hay movimientos con estos filtros' : 'Aún no hay movimientos'}</b>${nf || f.q ? 'Cambia la búsqueda o los filtros.' : 'Los gastos y pagos de esta tarjeta aparecen aquí.'}</div>`}</section>
  <p class="small muted">Esta sección es aparte: lo que registres aquí no cambia tu patrimonio, tus cuentas ni tus gastos del resto de la app.</p>`;
}
function ccCardForm(c = {}) {
  const isNew = !c.id;
  openSheet(isNew ? 'Nueva tarjeta' : 'Editar tarjeta', `<input type="hidden" name="id" value="${c.id || ''}">
    ${fld('Nombre', `<input name="name" maxlength="40" value="${esc(c.name || '')}" placeholder="Ej: Visa Bancolombia">`)}
    <div class="fgrid two">${fld('Cupo total', `<input name="limit" inputmode="decimal" value="${inNum(c.limit ?? '')}" placeholder="5.000.000">`, NUM_HINT)}${fld('Divisa', curSelect('currency', c.currency || 'COP', true))}</div>
    <div class="btns"><button class="btn primary" type="submit">Guardar</button>${isNew ? '' : `<button type="button" class="btn danger" data-act="cc-del-card" data-id="${c.id}">Eliminar</button>`}</div>`, 'cccard');
}
function ccTxForm(t = {}, type) {
  const c = S.cards[t.cardId] || ccCur(); if (!c) { toast('Primero crea una tarjeta'); return ccCardForm(); }
  const isNew = !t.id; const pay = (t.type || type) === 'payment'; const cards = ccCards(); const used = ccUsed(c);
  openSheet(pay ? (isNew ? 'Reiniciar cupo' : 'Editar pago') : (isNew ? 'Nuevo gasto con la tarjeta' : 'Editar gasto'), `<input type="hidden" name="id" value="${t.id || ''}"><input type="hidden" name="type" value="${pay ? 'payment' : 'expense'}">
    ${pay && isNew ? `<p class="small muted" style="margin:0">Registra el pago de la tarjeta. Si pagas todo lo usado (${fmt(used, c.currency || 'COP')}), el cupo vuelve a quedar completo.</p>` : ''}
    ${cards.length > 1 ? fld('Tarjeta', `<select name="cardId">${cards.map(x => `<option value="${x.id}" ${x.id === c.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>`) : `<input type="hidden" name="cardId" value="${c.id}">`}
    <div class="fgrid two">${fld(pay ? 'Monto pagado' : 'Monto', `<input name="amount" inputmode="decimal" value="${inNum(t.amount ?? (pay ? Math.max(0, used) : ''))}" placeholder="0">`, NUM_HINT)}${fld('Fecha', `<input type="date" name="date" value="${t.date || today()}">`)}</div>
    ${pay ? '' : fld('Categoría', `<select name="categoryId">${ccCatOptions(t.categoryId || Object.keys(S.cardcats)[0])}<option value="" ${t.id && !t.categoryId ? 'selected' : ''}>Sin categoría</option></select>`)}
    ${fld('Nota (opcional)', `<input name="note" maxlength="80" value="${esc(t.note || '')}" placeholder="${pay ? 'Ej: Pago de octubre' : 'Ej: Mercado'}">`)}
    <div class="btns"><button class="btn primary" type="submit">Guardar</button>${isNew ? '' : `<button type="button" class="btn danger" data-act="cc-del-tx" data-id="${t.id}">Eliminar</button>`}</div>`, 'cctx');
}
function ccCatsSheet() {
  const cats = Object.values(S.cardcats).sort((a, b) => a.name.localeCompare(b.name));
  openSheet('Categorías de la tarjeta', `<div class="btns"><button type="button" class="btn primary" data-act="cc-new-cat">Nueva categoría</button></div>
    ${cats.length ? `<div class="rows">${cats.map(c => `<div class="row click" data-act="cc-edit-cat" data-id="${c.id}"><div class="main"><div class="t">${esc(c.name)}</div></div></div>`).join('')}</div>` : '<div class="empty"><b>No hay categorías</b>Crea una para clasificar los gastos de la tarjeta.</div>'}`);
}
function ccCatForm(c = {}) {
  const isNew = !c.id;
  openSheet(isNew ? 'Nueva categoría' : 'Editar categoría', `<input type="hidden" name="id" value="${c.id || ''}">
    ${fld('Nombre', `<input name="name" maxlength="40" value="${esc(c.name || '')}">`)}
    <div class="btns"><button class="btn primary" type="submit">Guardar</button>${isNew ? '' : `<button type="button" class="btn danger" data-act="cc-del-cat" data-id="${c.id}">Eliminar</button>`}</div>`, 'cccat');
}
Object.assign(FORMS, {
  async cccard(fd) {
    const id = fd.get('id') || 'k' + uid(); const name = fd.get('name').trim(); const limit = parseNum(fd.get('limit'));
    if (!name || !(limit > 0)) return toast('Escribe el nombre y el cupo de la tarjeta');
    await safe(async () => {
      await put('cards', id, { ...(S.cards[id] || {}), name, limit, currency: fd.get('currency') });
      if (!Object.keys(S.cardcats).length) await writeMany(DEFAULT_CC_CATS.map(([k, n]) => ['put', 'cardcats', 'cc-' + k, { name: n }]));
    }, 'Tarjeta guardada');
    UI.ccCard = id; closeSheet();
  },
  async cctx(fd) {
    const id = fd.get('id') || uid(); const amount = parseNum(fd.get('amount')); if (!(amount > 0)) return toast('Escribe un monto mayor que cero');
    const type = fd.get('type'), prev = S.cardtx[id] || {};
    await safe(() => put('cardtx', id, { ...prev, type, cardId: fd.get('cardId'), amount, date: fd.get('date') || today(), categoryId: type === 'payment' ? '' : (fd.get('categoryId') || ''), note: fd.get('note').trim(), created: prev.created || now() }),
      type === 'payment' ? 'Pago registrado' : 'Gasto guardado');
    UI.ccCard = fd.get('cardId'); closeSheet();
  },
  async cccat(fd) {
    const name = fd.get('name').trim(); if (!name) return toast('Escribe un nombre');
    await safe(() => put('cardcats', fd.get('id') || 'cc-' + uid(), { name }), 'Categoría guardada'); ccCatsSheet();
  },
});
Object.assign(ACTS, {
  'cc-pick': id => { UI.ccCard = id; UI.ccLimit = TX_FIRST; render(); },
  'cc-new-card': () => ccCardForm(), 'cc-edit-card': id => ccCardForm(S.cards[id]),
  'cc-del-card': id => { const n = Object.values(S.cardtx).filter(t => t.cardId === id).length;
    askConfirm('¿Eliminar tarjeta?', `Se eliminará "${esc(S.cards[id].name)}"${n ? ` y sus ${n} movimientos` : ''}. No se puede deshacer.`, 'Eliminar',
      () => safe(() => writeMany([...Object.values(S.cardtx).filter(t => t.cardId === id).map(t => ['del', 'cardtx', t.id]), ['del', 'cards', id]]), 'Tarjeta eliminada')); },
  'cc-new': (_, el) => ccTxForm({}, el.dataset.type), 'cc-edit-tx': id => ccTxForm(S.cardtx[id]),
  'cc-del-tx': id => askConfirm('¿Eliminar este movimiento?', 'El cupo de la tarjeta se recalcula sin él.', 'Eliminar', () => safe(() => del('cardtx', id), 'Movimiento eliminado')),
  'cc-cats': () => ccCatsSheet(), 'cc-new-cat': () => ccCatForm(), 'cc-edit-cat': id => ccCatForm(S.cardcats[id]),
  'cc-del-cat': id => { closeSheet(); safe(() => del('cardcats', id), 'Categoría eliminada'); },
  'cc-toggle-filters': () => { UI.ccFilters = !UI.ccFilters; render(); if (UI.ccFilters) $('#cf-from')?.focus(); },
  'cc-clear': () => { UI.cf = { from: '', to: '', cat: '', type: '', q: '', min: '', max: '' }; UI.ccLimit = TX_FIRST; render(); },
  'cc-more': () => { UI.ccLimit += TX_MORE; render(); },
});

/* ---------- Tema ---------- */
/* Ocultar el dinero en Inicio: se recuerda en cada aparato (no se guarda en la nube). */
function moneyHidden() { try { return localStorage.getItem('mp-hide') === '1'; } catch (e) { return false; } }
function setMoneyHidden(v) { try { localStorage.setItem('mp-hide', v ? '1' : '0'); } catch (e) { } render(); }
/* Sin preferencia guardada, la app sigue el tema del sistema (claro u oscuro). */
function themeMode() { try { return localStorage.getItem('mp-theme') || 'auto'; } catch (e) { return 'auto'; } }
const HOST_THEME = document.documentElement.getAttribute('data-theme');
function applyTheme() {
  const m = themeMode(); const el = document.documentElement;
  if (m !== 'auto') el.setAttribute('data-theme', m);
  else if (HOST_THEME) el.setAttribute('data-theme', HOST_THEME);
  else el.removeAttribute('data-theme');
  const meta = $('meta[name="theme-color"]'); if (meta) meta.content = cssv('--bg');
}
/* Al cambiar de tema, el nuevo se abre en un círculo que crece desde el botón que se tocó. */
function setTheme(m, from) {
  try { localStorage.setItem('mp-theme', m); } catch (e) { }
  const swap = () => { applyTheme(); render(); };
  if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return swap();
  const r = from?.getBoundingClientRect(); const x = r ? r.left + r.width / 2 : innerWidth - 40, y = r ? r.top + r.height / 2 : 40;
  const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  document.startViewTransition(swap).ready.then(() => document.documentElement.animate(
    { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
    { duration: 650, easing: 'cubic-bezier(.22, 1, .36, 1)', pseudoElement: '::view-transition-new(root)' })).catch(() => { });
}
function renderThemeBtn() {
  const m = themeMode(), name = m === 'auto' ? 'automático' : m === 'dark' ? 'oscuro' : 'claro'; const b = $('#theme-btn');
  b.innerHTML = ico(m === 'auto' ? 'auto' : m === 'dark' ? 'moon' : 'sun'); b.title = `Tema ${name} (tocar para cambiar)`; b.setAttribute('aria-label', `Tema ${name}. Cambiar tema`);
}
$('#theme-btn').addEventListener('click', e => setTheme({ auto: 'light', light: 'dark', dark: 'auto' }[themeMode()], e.currentTarget));
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => sched());

/* ---------- Respaldo ---------- */
async function exportData() {
  // 'Mi Plata' es el nombre interno de los respaldos (la app ahora se llama MP): no cambiarlo, o los respaldos viejos no se podrían restaurar.
  const data = { app: 'Mi Plata', version: 1, exported: now() }; for (const c of COLS) data[c] = S[c];
  const json = JSON.stringify(data, null, 2); const name = `mi-plata-respaldo-${today()}.json`;
  try {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000); toast('Respaldo descargado'); return;
  } catch (e) { /* si el navegador no deja descargar, mostramos el texto para copiarlo */ }
  openSheet('Copia tu respaldo', `<p class="small muted" style="margin:0">Aquí no se pudo descargar el archivo. Copia este texto y guárdalo en un archivo llamado ${esc(name)}.</p><textarea id="exp-text" rows="10" style="width:100%;font-family:monospace;font-size:12px" readonly>${esc(json)}</textarea><div class="btns"><button type="button" class="btn primary" id="copy-exp">Copiar</button></div>`);
  $('#copy-exp').onclick = async () => { const ta = $('#exp-text'); try { await navigator.clipboard.writeText(json); toast('Copiado'); } catch (e) { ta.focus(); ta.select(); toast('Selecciona y copia con Ctrl+C'); } };
}
function importData(file) {
  const rd = new FileReader();
  rd.onload = () => {
    let data; try { data = JSON.parse(rd.result); } catch (e) { return toast('El archivo no es un respaldo válido'); }
    if (data.app !== 'Mi Plata') return toast('Este archivo no es un respaldo de esta app');
    const list = []; for (const c of COLS) for (const [id, d] of Object.entries(data[c] || {})) list.push(['put', c, id, d]);
    askConfirm('¿Restaurar respaldo?', `Se cargarán ${list.length} datos del ${esc(fdate(data.exported.slice(0, 10)))}. Si ya existen con el mismo identificador, se reemplazan.`, 'Restaurar', () => safe(() => writeMany(list, 'Restaurando'), 'Respaldo restaurado'));
  };
  rd.readAsText(file);
}

/* ---------- Cotizaciones en vivo ----------
 * APIs gratis y sin clave:
 *  - CoinGecko: precios cripto y su historial.
 *  - open.er-api.com: tasas de cambio de hoy.
 *  - currency-api (fawazahmed0, en jsDelivr): tasas de días pasados, para completar el historial.
 * Cada consulta exitosa se guarda, así el historial crece día a día aunque luego no haya internet. */
const COIN_IDS = { BTC: 'bitcoin', ETH: 'ethereum', USDT: 'tether', SOL: 'solana', BNB: 'binancecoin' };
const getJSON = (url, ms = 8000) => { const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms); return fetch(url, { signal: ctl.signal }).then(r => { clearTimeout(t); if (!r.ok) throw new Error(r.status); return r.json(); }); };
async function tryLive() {
  const fut = fetchFutures();
  try {
    const [c, f] = await Promise.all([
      getJSON(`https://api.coingecko.com/api/v3/simple/price?ids=${Object.values(COIN_IDS).join(',')}&vs_currencies=usd&include_24hr_change=true`),
      getJSON('https://open.er-api.com/v6/latest/USD')]);
    const coins = {}; for (const [k, id] of Object.entries(COIN_IDS)) if (c[id]) coins[k] = { usd: c[id].usd, ch24: c[id].usd_24h_change };
    LIVE.coins = coins; LIVE.fx = { usdcop: f.rates.COP, eurusd: 1 / f.rates.EUR }; LIVE.updated = now(); LIVE.status = 'ok';
    sched();
    await saveLive();
    await fillHistory();
  } catch (e) { if (LIVE.status !== 'ok') LIVE.status = 'blocked'; }
  await fut; if (LIVE.fut) await saveFutures().catch(() => { });
  sched();
}
/* Precio actual de los futuros E-mini (TradingView no pide clave y deja consultar desde el navegador). */
async function fetchFutures() {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 8000);
  try {
    const r = await fetch('https://scanner.tradingview.com/futures/scan', { method: 'POST', signal: ctl.signal, body: JSON.stringify({ symbols: { tickers: Object.values(FUTURES).map(f => f.tv) }, columns: ['close', 'change'] }) });
    if (!r.ok) throw new Error(r.status);
    const j = await r.json(); const out = {};
    for (const [k, f] of Object.entries(FUTURES)) { const d = j.data?.find(x => x.s === f.tv)?.d; if (d && d[0] > 0) out[k] = { usd: d[0], ch24: d[1] }; }
    if (Object.keys(out).length) LIVE.fut = out;
  } catch (e) { } finally { clearTimeout(t); }
}
/* Guarda el precio de hoy y, si falta, trae un año de historial (tokens que siguen a SPY/QQQ, escalados al futuro). */
async function saveFutures() {
  const T = today(); const prev = S.market.futures || {}; const items = { ...(prev.items || {}) };
  for (const [k, v] of Object.entries(LIVE.fut)) {
    const it = { ...(items[k] || {}), usd: v.usd, ch24: +(v.ch24 ?? 0).toFixed(2) };
    let hist = (it.hist || []).filter(p => p[0] !== T);
    if (hist.length < 2 || daysBetween(hist[hist.length - 1][0], T) > 3) {
      try { const r = await getJSON(`https://api.coingecko.com/api/v3/coins/${FUTURES[k].cg}/market_chart?vs_currency=usd&days=365&interval=daily`);
        const last = r.prices[r.prices.length - 1][1]; const ratio = v.usd / last; const byDay = {};
        for (const [ms, p] of r.prices) byDay[iso(new Date(ms))] = +(p * ratio).toFixed(2);
        hist = Object.entries(byDay).filter(p => p[0] !== T).sort((a, b) => a[0] < b[0] ? -1 : 1);
      } catch (e) { }
    }
    it.hist = [...hist, [T, v.usd]].slice(-400); items[k] = it;
  }
  await put('market', 'futures', { ...prev, items, updated: now() });
}
async function saveLive() {
  const T = today(), ts = LIVE.updated;
  const fx = { points: [], ...(S.market.fx || {}) }; const pts = fx.points.filter(p => p[0] !== T);
  pts.push([T, +LIVE.fx.usdcop.toFixed(2), +LIVE.fx.eurusd.toFixed(5)]);
  await put('market', 'fx', { ...fx, points: pts.sort((a, b) => a[0] < b[0] ? -1 : 1).slice(-400), updated: ts, source: 'en vivo' });
  const cr = { coins: {}, ...(S.market.crypto || {}) }; const coins = { ...cr.coins };
  for (const [k, v] of Object.entries(LIVE.coins)) {
    const prev = coins[k] || {}; const c = { ...prev, usd: v.usd, ch24: +(v.ch24 ?? 0).toFixed(2) };
    if (prev.hist) c.hist = [...prev.hist.filter(p => p[0] !== T), [T, v.usd]].slice(-400);
    coins[k] = c;
  }
  await put('market', 'crypto', { ...cr, coins, updated: ts, source: 'en vivo' });
}
/* Completa los días que faltan en el historial (máximo 30 por vez, para no hacer demasiadas consultas). */
async function fillHistory() {
  const pts = fxPoints(); const last = pts.length > 1 ? pts[pts.length - 2][0] : addDays(today(), -31);
  const missing = []; for (let d = addDays(last, 1); d < today() && missing.length < 30; d = addDays(d, 1)) missing.push(d);
  if (missing.length) {
    const got = await Promise.all(missing.map(d => getJSON(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${d}/v1/currencies/usd.json`).then(r => [d, +r.usd.cop.toFixed(2), +(1 / r.usd.eur).toFixed(5)]).catch(() => null)));
    const add = got.filter(Boolean);
    if (add.length) { const fx = S.market.fx; await put('market', 'fx', { ...fx, points: [...fx.points, ...add].sort((a, b) => a[0] < b[0] ? -1 : 1) }); }
  }
  // Historial de BTC, ETH y de las criptomonedas que tienes en Inversiones (para sus gráficos).
  const cr = S.market.crypto; const held = holdings().map(h => h.asset).filter(k => COIN_IDS[k]);
  const stale = k => { const h = cr?.coins?.[k]?.hist || []; return daysBetween(h.length > 1 ? h[h.length - 2][0] : '2000-01-01', today()) > 2; };
  const want = [...new Set(['BTC', 'ETH', ...held])].filter(stale);
  if (want.length) {
    const coins = { ...cr.coins };
    for (const k of want) {
      try { const r = await getJSON(`https://api.coingecko.com/api/v3/coins/${COIN_IDS[k]}/market_chart?vs_currency=usd&days=365&interval=daily`);
        const byDay = {}; for (const [ms, p] of r.prices) byDay[iso(new Date(ms))] = +p.toFixed(2);
        coins[k] = { ...coins[k], hist: Object.entries(byDay).sort((a, b) => a[0] < b[0] ? -1 : 1) };
      } catch (e) { }
    }
    await put('market', 'crypto', { ...cr, coins });
  }
}
/* Precio de Bitcoin de las últimas 24 horas (cada 5 minutos). Se pide solo al elegir "1 día". */
const INTRA = { BTC: null, at: 0 };
async function loadIntraday() {
  if (INTRA.BTC && Date.now() - INTRA.at < 5 * 60000) return;
  try {
    const r = await getJSON(`https://api.coingecko.com/api/v3/coins/${COIN_IDS.BTC}/market_chart?vs_currency=usd&days=1`);
    INTRA.BTC = r.prices.map(([ms, p]) => { const d = new Date(ms); return [`${pad(d.getHours())}:${pad(d.getMinutes())}`, +p.toFixed(2)]; });
    INTRA.at = Date.now(); render();
  } catch (e) { toast('No se pudo traer el precio de las últimas 24 horas'); }
}
/* Datos de mercado incluidos con la app (carpeta data/), por si es la primera vez o no hay internet. */
async function loadSeedMarket() {
  for (const [doc, file] of [['fx', 'data/market-fx.json'], ['crypto', 'data/market-crypto.json']]) {
    if (S.market[doc]) continue;
    try { const d = await getJSON(file, 4000); S.market[doc] = { ...d, id: doc }; } catch (e) { }
  }
}

/* ---------- Arranque ---------- */
async function boot() {
  applyTheme();
  renderWelcome();
  try { const h = location.hash.slice(1); if (VIEW_FN[h]) UI.view = h; } catch (e) { }
  render();
  try { await Store.init(); } catch (e) { Store.mode = 'local'; Store.configError = 'No se pudo conectar con Supabase: ' + e.message; }
  if (Store.mode === 'cloud' && !Store.user) { mode = 'login'; render(); return; }
  await loadData();
}
/* Carga todo desde donde esté guardado y decide qué mostrar. */
async function loadData() {
  let saved;
  try { saved = await Store.loadAll() || {}; }
  catch (e) {
    if (e.code === 'session') { mode = 'login'; render(); return; }
    mode = 'ready'; render();
    return toast(e.code === 'no_table' ? 'Falta crear la tabla en Supabase: corre el archivo supabase/schema.sql.' : 'No se pudieron cargar tus datos. Revisa tu internet y recarga.');
  }
  for (const c of COLS) { S[c] = {}; for (const [id, doc] of Object.entries(saved[c] || {})) S[c][id] = { ...doc, id }; }
  await loadSeedMarket();
  initDone = true;
  if (Store.mode === 'cloud' && !S.settings.main) { mode = 'migrate'; render(); }
  else { mode = 'ready'; await firstRun(); render(); }
  if (LIVE.status !== 'ok') tryLive(); else saveLive().catch(() => { });
}
/* En la nube: al volver a la app (por ejemplo, después de usarla en el celular), trae los cambios. */
let lastLoad = Date.now();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || Store.mode !== 'cloud' || mode !== 'ready' || $('#sheet-root').innerHTML) return;
  if (Date.now() - lastLoad > 60000) { lastLoad = Date.now(); loadData(); }
});
boot();
