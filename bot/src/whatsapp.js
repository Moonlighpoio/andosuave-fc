const makeWASocket = require("@whiskeysockets/baileys").default;
const {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const qrcodeTerminal = require("qrcode-terminal");
const QRCode = require("qrcode");
const fs = require("fs");
const pino = require("pino");
const path = require("path");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let logger = pino({
  level: "info",
  transport: { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:HH:MM:ss" } },
}).child({ module: "baileys" });

async function tryPairing(sock, number) {
  for (let i = 0; i < 4; i++) {
    try {
      const code = await sock.requestPairingCode(number);
      console.log("\nCódigo de emparejamiento: " + code);
      console.log(
        "En el WhatsApp del número " + number + ": Ajustes → Dispositivos vinculados → " +
        "Vincular dispositivo → “Vincular con un número de teléfono” y escribe el código."
      );
      console.log(
        "⚠️  No cierres el bot mientras lo escribes: el código caduca en ~20 segundos."
      );
      return;
    } catch (err) {
      console.error("Intento de pairing falló (" + err.message + "), reintentando…");
      await sleep(3500);
    }
  }
  console.error("No se pudo obtener el código de emparejamiento. Escanea el QR si aparece.");
}

async function connect(ctx) {
  const { config, sessionDir, onOpen, onMessage } = ctx;

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  let version;
  try {
    const v = await fetchLatestBaileysVersion();
    version = v?.version;
  } catch {}

  const sock = makeWASocket({
    version,
    logger,
    auth: state,
    browser: ["AndoSuave FC", "Chrome", "24.0.0.999"],
    markOnlineOnConnect: false,
    syncFullHistory: false,
  });

  if (config.pairingNumber && !state.creds.registered) {
    setTimeout(() => tryPairing(sock, config.pairingNumber.replace(/\D/g, "")), 2500);
  }

  const ensureSessionDir = () => {
    try { fs.mkdirSync(sessionDir, { recursive: true }); } catch {}
  };

  const qrFile = path.join(sessionDir, "..", "qr.png");
  const qrRunFile = path.join(sessionDir, "..", `qr-${Date.now()}.png`);
  const showQR = async (qr) => {
    console.log("\nEscanea este QR con el WhatsApp del número externo:");
    qrcodeTerminal.generate(qr, { small: true });
    try {
      const png = await QRCode.toBuffer(qr, { width: 600, margin: 2 });
      fs.writeFileSync(qrRunFile, png);
      fs.writeFileSync(qrFile, png);
      console.log("📷 QR guardado en: " + qrRunFile + " (ábrelo y escanéalo con la cámara).");
    } catch (err) {
      console.error("No pude escribir el QR como imagen:", err.message);
    }
  };

  const saveCredsSafe = () => {
    ensureSessionDir();
    saveCreds().catch((err) => console.error("No pude guardar credenciales:", err.message));
  };

  sock.ev.on("creds.update", saveCredsSafe);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) showQR(qr);
    if (connection === "open") {
      console.log("✅ Bot conectado a WhatsApp.");
      if (onOpen) onOpen(sock);
    }
    if (connection === "close") {
      const status = lastDisconnect?.error instanceof Boom
        ? lastDisconnect.error.output.statusCode
        : null;
      const shouldReconnect = status !== DisconnectReason.loggedOut;
      console.log("Conexión cerrada" + (status !== null ? " (código " + status + ")" : "") + ", reconectando…");
      if (shouldReconnect) {
        setTimeout(() => connect(ctx), 3000);
      } else {
        console.log("Sesión cerrada por WhatsApp (loggedOut). Limpio la sesión y reinicio con QR nuevo.");
        try { sock.ev.removeAllListeners("creds.update"); } catch {}
        try { sock.ev.removeAllListeners("connection.update"); } catch {}
        try { fs.rmSync(sessionDir, { recursive: true, force: true }); } catch {}
        setTimeout(() => connect(ctx), 3000);
      }
    }
  });

  sock.ev.on("messages.upsert", ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      if (msg.key?.fromMe) continue;
      if (!msg.message) continue;
      if (onMessage) onMessage(msg, sock);
    }
  });

  return sock;
}

module.exports = { connect, sessionDir: (base) => path.join(base, "session") };