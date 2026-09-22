require("dotenv").config();
const path = require("path");
const config = require("./config");
const { createStore } = require("./store");
const { Site } = require("./site");
const { connect, sessionDir } = require("./whatsapp");
const scheduler = require("./scheduler");
const { handle } = require("./commands");

async function main() {
  const store = createStore(path.join(config.dataDir, "db.json"));
  const site = new Site({
    dir: config.siteDir,
    repo: config.siteRepo,
    repoUrl: config.siteRepoUrl,
    token: config.githubToken,
  });

  try {
    await site.ensure();
  } catch (err) {
    console.error("No pude clonar el sitio (" + err.message + "). Usaré datos locales.");
  }

  const box = { config, store, site, sock: null };
  let started = false;

  await connect({
    config,
    sessionDir: sessionDir(config.dataDir),
    onOpen: (sock) => {
      box.sock = sock;
      if (!started) {
        started = true;
        scheduler.start(box);
      }
      if (process.env.TEST_SEND_TO) {
        const to = process.env.TEST_SEND_TO.replace(/\D/g, "");
        const text = process.env.TEST_SEND_TEXT || "Prueba del bot AndoSuave FC ✓";
        setTimeout(async () => {
          try {
            await sock.sendMessage(to + "@s.whatsapp.net", { text });
            console.log("✅ Mensaje de prueba enviado a " + to);
          } catch (err) {
            console.error("No pude enviar mensaje de prueba:", err.message);
          }
          delete process.env.TEST_SEND_TO;
        }, 3000);
      }
    },
    onMessage: async (msg, sock) => {
      box.sock = sock;
      try {
        await handle(box, msg);
      } catch (err) {
        console.error("Error en comando:", err.message);
      }
    },
  });
}

main();