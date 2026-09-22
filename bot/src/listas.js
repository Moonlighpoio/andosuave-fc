const { normalize } = require("./helpers");

function horaPasada(now, hora) {
  const m = /(\d{1,2}):(\d{2})/.exec(hora || "");
  if (!m) return false;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return nowMin >= Number(m[1]) * 60 + Number(m[2]);
}

function nextMatch(horarios, now = new Date()) {
  const base = { Lunes: 1, Martes: 2, Miercoles: 3, Jueves: 4, Viernes: 5, Sabado: 6, Domingo: 0 };
  const dias = {};
  for (const [k, v] of Object.entries(base)) dias[normalize(k)] = v;
  for (let i = 0; i < 8; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const dow = d.getDay();
    const entry = (horarios || []).find((h) => dias[normalize(h.dia)] === dow);
    if (!entry) continue;
    if (i === 0 && horaPasada(now, entry.hora)) continue;
    const fecha = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
    return {
      fecha,
      dia: entry.dia,
      tipo: entry.tipo || "Partido",
      hora: entry.hora,
      lugar: entry.lugar,
      direccion: entry.direccion,
      mapa: entry.mapa,
    };
  }
  return null;
}

function ensurePartido(data, match) {
  if (!data.partidos) data.partidos = {};
  if (!data.partidos[match.fecha]) {
    data.partidos[match.fecha] = {
      fecha: match.fecha,
      dia: match.dia,
      tipo: match.tipo,
      hora: match.hora,
      lugar: match.lugar,
      cerrada: false,
      jugadores: [],
    };
  }
  const p = data.partidos[match.fecha];
  if (match.dia && !p.dia) p.dia = match.dia;
  if (match.tipo && !p.tipo) p.tipo = match.tipo;
  if (match.hora && !p.hora) p.hora = match.hora;
  if (match.lugar && !p.lugar) p.lugar = match.lugar;
  if (match.direccion && !p.direccion) p.direccion = match.direccion;
  if (match.mapa && !p.mapa) p.mapa = match.mapa;
  return p;
}

function get(data, fecha) {
  if (!data.partidos) data.partidos = {};
  return data.partidos[fecha] || null;
}

function listar(partido) {
  if (!partido) return { titulo: "", lineas: [] };
  const ubicacion = `${partido.lugar || ""}${partido.mapa ? "\n📍 " + partido.mapa : ""}`;
  const titulo = `📋 Lista ${partido.dia} ${String(partido.fecha).slice(5).replace("-", "/")} · ${partido.hora}\n📍 ${ubicacion}\n${partido.cerrada ? "🔒 CERRADA" : "🟢 ABIERTA (cierra 12:00 del día del partido)"}`;
  const lineas = (partido.jugadores || []).map((j, i) => `${i + 1}. ${j.nombre}`);
  const banca = partido.banca || [];
  if (banca.length) lineas.push("Banca", ...banca.map((n, i) => `${i + 1}. ${n}`));
  return { titulo, lineas };
}

function partidoDeHoy(data, now = new Date()) {
  const f = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
  if (!data.partidos) data.partidos = {};
  return data.partidos[f] || null;
}

function anotar(data, partido, { nombre, telefono }) {
  if (!partido) return { ok: false, error: "No hay partido programado." };
  const p = ensurePartido(data, partido);
  if (p.cerrada) return { ok: false, error: "La lista ya está cerrada. 🔒" };
  const fnombre = String(nombre || "").trim();
  const ftelefono = String(telefono || "").trim();
  const dup = p.jugadores.find(
    (j) =>
      (ftelefono && j.telefono === ftelefono) ||
      (normalize(j.nombre) === normalize(fnombre) && normalize(fnombre) !== "")
  );
  if (dup) return { ok: false, error: `Ya estás en la lista (${dup.nombre}). Si dudas, usa !salir.` };
  p.jugadores.push({ nombre: fnombre || "Jugador", telefono: ftelefono, fecha: new Date().toISOString() });
  return { ok: true, partido: p };
}

function salir(data, fecha, { nombre, telefono }) {
  const p = get(data, fecha);
  if (!p) return { ok: false, error: "No hay lista para ese partido." };
  if (p.cerrada) return { ok: false, error: "La lista está cerrada, no puedes salir. 🔒" };
  const fnombre = String(nombre || "").trim();
  const ftelefono = String(telefono || "").trim();
  const idx = p.jugadores.findIndex(
    (j) =>
      (ftelefono && j.telefono === ftelefono) ||
      (normalize(j.nombre) === normalize(fnombre) && normalize(fnombre) !== "")
  );
  if (idx === -1) return { ok: false, error: "No estás en la lista." };
  const [removed] = p.jugadores.splice(idx, 1);
  return { ok: true, nombre: removed.nombre };
}

function cerrar(data, fecha) {
  const p = get(data, fecha);
  if (!p) return { ok: false, error: "No hay lista para ese partido." };
  p.cerrada = true;
  return { ok: true, partido: p };
}

function abrir(data, fecha) {
  const p = get(data, fecha);
  if (!p) return { ok: false, error: "No hay lista para ese partido." };
  p.cerrada = false;
  return { ok: true, partido: p };
}

function borrar(data, fecha) {
  if (!data.partidos) data.partidos = {};
  if (!data.partidos[fecha]) return { ok: false, error: "No hay lista para ese partido." };
  const n = data.partidos[fecha].jugadores.length;
  delete data.partidos[fecha];
  return { ok: true, cantidad: n };
}

module.exports = { nextMatch, ensurePartido, get, listar, anotar, salir, cerrar, abrir, borrar, partidoDeHoy };