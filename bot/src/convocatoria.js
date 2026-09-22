const { normalize } = require("./helpers");

const DIAS = { Lunes: 1, Martes: 2, Miercoles: 3, Jueves: 4, Viernes: 5, Sabado: 6, Domingo: 0 };

function diaIndex(nombre) {
  const k = normalize(nombre);
  for (const key of Object.keys(DIAS)) {
    if (normalize(key) === k) return DIAS[key];
  }
  return null;
}

function formatDDMM(fecha) {
  return String(fecha.getDate()).padStart(2, "0") + "/" + String(fecha.getMonth() + 1).padStart(2, "0");
}

function nextSameDay(horarios, now = new Date()) {
  const dow = now.getDay();
  const entry = (horarios || []).find((h) => diaIndex(h.dia) === dow);
  if (!entry) return null;
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
  return { entry, fecha: next };
}

function build(entry, fecha) {
  const lugar = [entry.lugar, entry.direccion].filter(Boolean).join(" · ");
  const lista = [];
  for (let i = 1; i <= 14; i++) lista.push(i + "-");
  lista.push("Banca");
  lista.push("1-");
  lista.push("2-");
  lista.push("3-");
  const lineas = [
    `⚽ ${entry.tipo || "Partido"} ${entry.dia} ${formatDDMM(fecha)}`,
    lugar ? `🕗 ${entry.hora} — ${lugar}` : `🕗 ${entry.hora}`,
  ];
  if (entry.mapa) lineas.push("📍 " + entry.mapa);
  lineas.push("", ...lista, "", "Apúntate con *!anotar* · La lista cierra a las 12:00 del día del partido 🔒");
  return lineas.join("\n");
}

module.exports = { build, nextSameDay, diaIndex, formatDDMM };