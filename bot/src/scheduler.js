const cron = require("node-cron");
const multas = require("./multas");
const listas = require("./listas");
const convocatoria = require("./convocatoria");

let tasks = [];

function horarios(box) {
  const club = box.site?.readClub();
  return { club, list: club?.HORARIOS || box.config.defaults.horarios };
}

function buildMultasMessage(box) {
  const pend = multas.pending(box.store.get());
  const club = horarios(box).club;
  const pago = club?.CUOTA?.pago || box.config.defaults.cuota.pago;
  if (!pend.length) return null;
  return (
    "⏰ *Recordatorio de multas pendientes*\n\n" +
    multas.textoResumen(pend) +
    "\n\n💳 Paga al tesorero:\n" + pago +
    "\n\n_Recuerda: la multa impaga puede significar suspensión o la baja._"
  );
}

function buildListaMessage(box, accion) {
  const { list } = horarios(box);
  const match = listas.nextMatch(list);
  if (!match) return null;
  const p = listas.get(box.store.get(), match.fecha);
  const nombres = p?.jugadores?.map((j, i) => `${i + 1}. ${j.nombre}`) || [];
  const banca = p?.banca?.length ? "\nBanca: " + p.banca.join(", ") : "";
  const cuerpo =
    `${match.tipo} ${match.dia} (${match.fecha}) · ${match.hora}\n📍 ${match.lugar}\n\n` +
    (nombres.length ? "Anotados:\n" + nombres.join("\n") + banca : "Aún no hay anotados. ¡Anótate con *!anotar*!");
  return accion + "\n\n" + cuerpo;
}

async function sendToGroup(box, text) {
  const gid = box.config.groupId;
  if (!gid || !text || !box.sock) return;
  try {
    await box.sock.sendMessage(gid, { text });
  } catch (err) {
    console.error("Error en recordatorio:", err.message);
  }
}

function closetLista(box) {
  const { list } = horarios(box);
  const match = listas.nextMatch(list);
  if (!match) return null;
  const data = box.store.get();
  const res = listas.cerrar(data, match.fecha);
  if (!res.ok) return null;
  box.store.save();
  return listas.listar(res.partido);
}

function start(box) {
  if (tasks.length) return;

  const { multasMinute, multasHour, listaMinute, listaHour, convocaMinute, convocaHour, finalMinute, finalHour } = box.config.reminders;
  const zona = { timezone: box.config.timezone };

  const add = (min, hora, day, fn) => {
    tasks.push(cron.schedule(`${min} ${hora} * * ${day}`, () => fn(box), zona));
  };

  add(multasMinute, multasHour, "*", (b) => sendToGroup(b, buildMultasMessage(b)));
  add(listaMinute, listaHour, "1,4", (b) => sendToGroup(b, buildListaMessage(b, "📋 *Convocatoria: cierra a las 12:00 del día del partido*")));
  add(10, 12, "1,4", (b) => {
    const r = closetLista(b);
    if (!r) return;
    sendToGroup(b, "🔒 *Lista cerrada (12:00)*\n\n" + (r.lineas.length ? r.lineas.join("\n") : "Sin anotados."));
    if (box.config.groupId) void box.store.save();
  });
  add(30, 19, "1,4", (b) => sendToGroup(b, buildListaMessage(b, "🏟️ *Partido hoy a las 20:00*")));

  add(convocaMinute, convocaHour, "1,4", (b) => enviarConvocatoria(b));
  add(finalMinute, finalHour, "1,4", (b) => enviarListaFinal(b));

  console.log("⏰ Recordatorios activados (" + box.config.timezone + ").");
}

function enviarConvocatoria(box) {
  const { list } = horarios(box);
  const next = convocatoria.nextSameDay(list);
  if (!next) return;
  const { entry, fecha } = next;
  const fechaStr = [fecha.getFullYear(), String(fecha.getMonth() + 1).padStart(2, "0"), String(fecha.getDate()).padStart(2, "0")].join("-");
  const data = box.store.get();
  if (!data.partidos) data.partidos = {};
  data.partidos[fechaStr] = {
    fecha: fechaStr,
    dia: entry.dia,
    tipo: entry.tipo || "Partido",
    hora: entry.hora,
    lugar: entry.lugar,
    direccion: entry.direccion,
    mapa: entry.mapa,
    cerrada: false,
    jugadores: [],
    banca: [],
  };
  box.store.save();
  sendToGroup(box, convocatoria.build(entry, fecha));
  console.log(`📣 Convocatoria enviada: ${entry.dia} ${convocatoria.formatDDMM(fecha)}`);
}

function enviarListaFinal(box) {
  const hoy = listas.partidoDeHoy(box.store.get());
  if (!hoy) return;
  const totales = (hoy.jugadores || []).length + (hoy.banca || []).length;
  if (!totales) return;
  const { lineas } = listas.listar(hoy);
  sendToGroup(
    box,
    `🌙 *Lista final del día* — ${hoy.dia} ${String(hoy.fecha).slice(5).replace("-", "/")} · ${hoy.hora}\n\n` +
      (lineas.length ? lineas.join("\n") : "Sin anotados.")
  );
  console.log(`🌙 Lista final enviada: ${totales} jugador(es).`);
}

function stop() {
  tasks.forEach((t) => t.stop());
  tasks = [];
}

module.exports = { start, stop };