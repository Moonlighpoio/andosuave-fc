require('dotenv').config();
const path = require('path');

const DEFAULT_HORARIOS = [
  { dia: "Lunes", tipo: "Partido", hora: "20:00 – 21:00", lugar: "Club Cordillera · La Florida" },
  { dia: "Jueves", tipo: "Partido", hora: "20:00 – 21:00", lugar: "DepartaSport" },
];

const DEFAULT_CUOTA = {
  monto: "$3.000",
  vence: "Vence el día 5 de cada mes.",
  mora: "Si la cuota sigue impaga antes del día 10 del mes, se procede a la expulsión del jugador.",
  pago:
    "Tesorero: Ignacio Bilbao · Cuenta Tenpo (Cuenta Vista) N° 111120388118 · Correo ignacioandresmb10@gmail.com",
};

module.exports = {
  adminNumbers: (process.env.ADMIN_NUMBERS || "")
    .split(",")
    .map((s) => s.trim().replace(/\D/g, ""))
    .filter(Boolean),
  groupId: (process.env.GROUP_ID || "").trim(),
  prefix: "!",
  timezone: process.env.TZ || "America/Santiago",
  pairingNumber: (process.env.PAIRING_NUMBER || "").trim(),
  dataDir: process.env.DATA_DIR || "data",
  siteDir: process.env.SITE_DIR || path.join(process.env.DATA_DIR || "data", "site"),
  siteRepoUrl: process.env.SITE_REPO_URL || "",
  siteRepo: process.env.SITE_REPO || "Moonlighpoio/andosuave-fc",
  githubToken: process.env.GITHUB_TOKEN || "",
  reminders: {
    multasHour: Number(process.env.REMINDER_MULTAS_HOUR || 19),
    multasMinute: Number(process.env.REMINDER_MULTAS_MINUTE || 0),
    listaHour: Number(process.env.REMINDER_LISTA_HOUR || 11),
    listaMinute: Number(process.env.REMINDER_LISTA_MINUTE || 30),
    convocaHour: Number(process.env.REMINDER_CONVOCA_HOUR || 21),
    convocaMinute: Number(process.env.REMINDER_CONVOCA_MINUTE || 1),
    finalHour: Number(process.env.REMINDER_FINAL_HOUR || 23),
    finalMinute: Number(process.env.REMINDER_FINAL_MINUTE || 0),
  },
  defaults: {
    horarios: DEFAULT_HORARIOS,
    cuota: DEFAULT_CUOTA,
  },
};