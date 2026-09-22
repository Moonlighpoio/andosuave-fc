require("dotenv").config();
const fs = require("fs");
const path = require("path");
const config = require("./config");
const { createStore } = require("./store");
const { Site } = require("./site");
const { connect, sessionDir } = require("./whatsapp");
const scheduler = require("./scheduler");
const { handle } = require("./commands");

function persistEnvGroupId(id) {
  try {
    const envPath = path.join(__dirname, "..", ".env");
    let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
    const re = /^GROUP_ID=.*$/m;
    if (re.test(env)) env = env.replace(re, "GROUP_ID=" + id);
    else env += (env.endsWith("\n") ? "" : "\n") + "GROUP_ID=" + id + "\n";
    fs.writeFileSync(envPath, env);
    config.groupId = id;
    console.log("💾 GROUP_ID guardado en .env: " + id);
  } catch (err) {
    console.error("No pude guardar GROUP_ID en .env:", err.message);
  }
}

async function autoDetectGroup(sock) {
  try {
    const groups = (await sock.groupFetchAllParticipating()) || {};
    const list = Object.entries(groups);
    if (!list.length) {
      console.log("ℹ️ El número del bot no está en ningún grupo.");
      return;
    }
    console.log("👥 Grupos del bot: " + list.map(([id, g]) => `${g.subject} (${id})`).join(" | "));
    if (config.groupId) {
      const cur = list.find(([id]) => id === config.groupId);
      if (!cur) console.log("⚠️ GROUP_ID configurado pero el número del bot NO está en ese grupo.");
      return;
    }
    if (list.length === 1) {
      const [id] = list[0];
      persistEnvGroupId(id);
      console.log(`✅ Grupo auto-detectado: ${groups[id].subject} (${id}). Ahí se enviarán las convocatorias.`);
    } else {
      console.log("ℹ️ Hay varios grupos. Define GROUP_ID en .env eligiendo de la lista anterior.");
    }
  } catch (err) {
    console.log("⚠️ No pude detectar grupos: " + err.message);
  }
}

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
      setTimeout(() => void autoDetectGroup(sock), 6000);
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