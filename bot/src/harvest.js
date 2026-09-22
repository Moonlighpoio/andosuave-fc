const { normalize } = require("./helpers");
const listas = require("./listas");

const NUM_RE = /^(\d{1,3})-\s*(.+)$/;

function goodName(nm) {
  return nm.length >= 2 && /[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]/.test(nm) && !/^\d/.test(nm);
}

function parseLista(text) {
  const lines = String(text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const main = [];
  const banca = [];
  let inBanca = false;
  for (const line of lines) {
    if (/^banca\b/i.test(line)) { inBanca = true; continue; }
    const m = NUM_RE.exec(line);
    if (!m) continue;
    const name = m[2].trim();
    if (!goodName(name)) continue;
    if (inBanca) {
      if (Number(m[1]) >= 1 && Number(m[1]) <= 3 && banca.length < 3) banca.push(name);
    } else if (Number(m[1]) >= 1 && Number(m[1]) <= 14 && main.length < 14) {
      main.push(name);
    }
  }
  return main.length || banca.length ? { main, banca } : null;
}

function merge(partido, parsed) {
  if (!partido) return 0;
  if (!Array.isArray(partido.jugadores)) partido.jugadores = [];
  if (!Array.isArray(partido.banca)) partido.banca = [];
  const seen = new Set(partido.jugadores.map((j) => normalize(j.nombre)).concat(partido.banca.map(normalize)));
  let added = 0;
  for (const nm of parsed.main) {
    const k = normalize(nm);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    partido.jugadores.push({ nombre: nm, fecha: new Date().toISOString() });
    added++;
  }
  for (const nm of parsed.banca) {
    const k = normalize(nm);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    partido.banca.push(nm);
    added++;
  }
  return added;
}

function partidoDeHoy(data, now = new Date()) {
  const f = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
  return data.partidos?.[f] || null;
}

function horarios(box) {
  const club = box.site?.readClub();
  return { club, list: club?.HORARIOS || box.config.defaults.horarios };
}

async function capture(box, text) {
  const parsed = parseLista(text);
  if (!parsed) return 0;
  const data = box.store.get();
  if (!data.partidos) data.partidos = {};
  let partido = partidoDeHoy(data);
  if (!partido) {
    const m = listas.nextMatch(horarios(box).list);
    partido = m ? listas.ensurePartido(data, m) : null;
  }
  const n = merge(partido, parsed);
  if (n > 0) {
    box.store.save();
    console.log(`📝 Mensaje copiado detectado: +${n} → ${partido.dia} ${partido.fecha}`);
  }
  return n;
}

module.exports = { parseLista, merge, capture, partidoDeHoy };