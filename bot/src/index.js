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