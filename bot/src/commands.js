const { normalize, phoneFromJid, isAdmin, isGroup, formatCLP, parseMonto } = require("./helpers");
const multas = require("./multas");
const listas = require("./listas");
const chat = require("./chat");
const convocatoria = require("./convocatoria");
const harvest = require("./harvest");
const { Site } = require("./site");

function extractText(msg) {
  const m = msg.message;
  return String(
    m?.conversation ||
    m?.extendedTextMessage?.text ||
    m?.imageMessage?.caption ||
    m?.videoMessage?.caption ||
    ""
  ).trim();
}

function horarios(box) {
  const club = box.site?.readClub();
  const list = club?.HORARIOS || box.config.defaults.horarios;
  return { club, list };
}

function renderHorarios(list) {
  return list.map((h) => `• ${h.tipo} ${h.dia} a las ${h.hora}\n  📍 ${h.lugar}`).join("\n");
}

async function handle(box, msg) {
  const { config } = box;
  const text = extractText(msg);
  const jid = msg.key.remoteJid;

  if (!text.startsWith(config.prefix)) {
    const inGroup = isGroup(jid) && config.groupId && jid === config.groupId;
    const inDm = !isGroup(jid);
    if (inGroup || inDm) await harvest.capture(box, text);
    return false;
  }

  const group = isGroup(jid);
  const participant = msg.key.participant || jid;
  const senderPhone = phoneFromJid(participant);
  const admin = isAdmin(config, senderPhone);
  const senderName = String(msg.pushName || "").trim();

  if (config.groupId) {
    const inDesignated = group && jid === config.groupId;
    const adminDm = !group && admin;
    if (!inDesignated && !adminDm) return false;
  }

  const club = horarios(box).club;
  if (!text.startsWith(config.prefix)) {
    const resp = chat.responder(text, club?.CHAT_REGLAS);
    if (resp) await box.sock.sendMessage(jid, { text: resp });
    return Boolean(resp);
  }

  const parts = text.slice(config.prefix.length).trim().split(/\s+/);
  const cmd = (parts[0] || "").toLowerCase();
  const args = parts.slice(1).join(" ").trim();
  const reply = async (out) => {
    try {
      await box.sock.sendMessage(jid, { text: out });
    } catch (err) {
      console.error("Error al enviar:", err.message);
    }
  };
  const onlyAdmin = async () => {
    if (admin) return true;
    if (!config.adminNumbers.length) return false;
    await reply("🔒 Solo la administración puede usar ese comando.");
    return false;
  };

  const { list } = horarios(box);
  const match = listas.nextMatch(list);

  switch (cmd) {
    case "ayuda":
    case "help": {
      await reply(
        "🤖 Comandos de AndoSuave Bot:\n\n" +
        "📋 *Listas*\n" +
        "  · !lista — lista del próximo partido\n" +
        "  · !anotar — anótate (o !anotar <nombre>)\n" +
        "  · !salir — sálete de la lista\n" +
        "  · !cerrar / !abrir / !borrar-lista (admin)\n" +
        "  · !convocatoria (admin) — genera el mensaje de la próxima semana\n\n" +
        "⚽ *Info*\n" +
        "  · !horarios — días y canchas\n" +
        "  · !proximo — próximo partido y quién va\n" +
        "  · !consulta <pregunta> — responde como el asistente del sitio\n\n" +
        "💰 *Multas (admin)*\n" +
        "  · !multas — resumen de multas pendientes\n" +
        "  · !multa add <monto> <nombre> <motivo…>\n" +
        "  · !multa pay <id> / !multa rm <id> / !multa undo <id>\n\n" +
        "🌐 *Página (admin)*\n" +
        "  · !cambiar-horario <dia> <hora> <lugar>\n" +
        "  · !publicar — sube los cambios al sitio\n" +
        "  · !sincronizar — baja lo último del sitio\n" +
        "  · !ver-pagina — estado actual de la página"
      );
      break;
    }

    case "grupo": {
      if (!admin) { await onlyAdmin(); break; }
      await reply("ID de este grupo (para GROUP_ID en .env):\n`" + jid + "`");
      break;
    }

    case "horarios": {
      await reply(
        "🗓️ *Horarios*\n" + renderHorarios(list) +
        (club ? "" : "\n\n(Usando valores locales; configura GITHUB_TOKEN para leer la página.)")
      );
      break;
    }

    case "consulta":
    case "pregunta": {
      if (!args) { await reply("Escribe tu pregunta, ej: *!consulta cuándo jugamos*"); break; }
      const resp = chat.respond(args, club);
      await reply(resp || "No tengo esa respuesta aún. Revisa la sección Normas o pregunta a la administración.");
      break;
    }

    case "proximo": {
      if (!match) { await reply("No hay partidos programados en los horarios."); break; }
      const p = listas.get(box.store.get(), match.fecha);
      const cuantos = p ? p.jugadores.length : 0;
      await reply(
        `⚽ *Próximo partido*\n${match.tipo} ${match.dia} (${listas.ddmm(match.fecha)}) · ${match.hora}\n📍 ${match.lugar}\n👥 Anotados: ${cuantos}${match.cerrada ? " · 🔒 cerrada" : ""}`
      );
      break;
    }

    case "lista": {
      if (!match) { await reply("No hay partidos programados en los horarios."); break; }
      const p = listas.get(box.store.get(), match.fecha);
      const { titulo, lineas } = listas.listar(p);
      if (!p) {
        await reply(
          `📋 ${match.dia} (${match.fecha}) · ${match.hora}\n📍 ${match.lugar}\n\nAún no hay anotados. Apúntate con *!anotar*.`
        );
        break;
      }
      await reply(lineas.length ? `${titulo}\n\n${lineas.join("\n")}` : titulo + "\n\nAún no hay anotados. Apúntate con *!anotar*.");
      break;
    }

    case "anotar":
    case "apuntarse": {
      if (!match) { await reply("No hay partidos programados en los horarios."); break; }
      const data = box.store.get();
      const r = listas.anotar(data, match, {
        nombre: args || senderName || "Jugador",
        telefono: senderPhone,
      });
      if (!r.ok) { await reply(r.error); break; }
      const { titulo, lineas } = listas.listar(r.partido);
      box.store.save();
      await reply(`✅ Te anotaste para el ${match.dia} (${match.fecha}).\n\n${titulo}\n\n${lineas.join("\n")}`);
      break;
    }

    case "salir": {
      if (!match) { await reply("No hay partidos programados en los horarios."); break; }
      const data = box.store.get();
      const r = listas.salir(data, match.fecha, { nombre: args || senderName, telefono: senderPhone });
      if (!r.ok) { await reply(r.error); break; }
      box.store.save();
      await reply(`✅ ${r.nombre} salió de la lista del ${match.dia}.`);
      break;
    }

    case "cerrar": {
      if (!(await onlyAdmin())) break;
      if (!match) { await reply("No hay partidos programados en los horarios."); break; }
      const data = box.store.get();
      const r = listas.cerrar(data, match.fecha);
      if (!r.ok) { await reply(r.error); break; }
      box.store.save();
      await reply(`🔒 Lista del ${r.partido.dia} cerrada (${r.partido.jugadores.length} anotados).`);
      break;
    }

    case "abrir": {
      if (!(await onlyAdmin())) break;
      if (!match) { await reply("No hay partidos programados en los horarios."); break; }
      const data = box.store.get();
      const r = listas.abrir(data, match.fecha);
      if (!r.ok) { await reply(r.error); break; }
      box.store.save();
      await reply(`🟢 Lista del ${r.partido.dia} abierta de nuevo.`);
      break;
    }

    case "borrar-lista": {
      if (!(await onlyAdmin())) break;
      if (!match) { await reply("No hay partidos programados en los horarios."); break; }
      const data = box.store.get();
      const r = listas.borrar(data, match.fecha);
      if (!r.ok) { await reply(r.error); break; }
      box.store.save();
      await reply(`🗑️ Lista del ${match.dia} borrada (${r.cantidad} jugadores).`);
      break;
    }

    case "convocatoria": {
      if (!(await onlyAdmin())) break;
      const next = convocatoria.nextSameDay(list);
      if (!next) { await reply("Hoy no hay partido programado en los horarios."); break; }
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
      };
      box.store.save();
      await reply(convocatoria.build(entry, fecha));
      break;
    }

    case "multas": {
      const pend = multas.pending(box.store.get());
      const encabezado = pend.length ? `💰 *Multas pendientes* (${pend.length})\n\n` : "";
      await reply(encabezado + multas.textoResumen(pend));
      break;
    }

    case "multa": {
      if (!(await onlyAdmin())) break;
      const data = box.store.get();
      const inner = text.replace(/^!+multa/i, "").trim();
      const innerParts = inner.split(/\s+/);
      const sub = (innerParts[0] || "").toLowerCase();

      if (sub === "add") {
        const resto = innerParts.slice(1).join(" ");
        const tokens = resto.split(/\s+/);
        const idx = tokens.findIndex((t) => /^\d{2,}$/.test(t.replace(/\./g, "").replace(/\$/g, "")));
        if (idx === -1) { await reply("Uso: !multa add <monto> <nombre> <motivo…>\nEj: !multa add 3000 Nico baja tardía"); break; }
        const monto = parseMonto(tokens[idx]);
        const nombre = tokens[idx + 1] || "Sin nombre";
        const motivo = tokens.slice(idx + 2).join(" ") || "multa";
        const r = multas.add(data, { nombre, telefono: "", monto, motivo });
        box.store.save();
        await reply(`✅ Multa #${r.id} registrada: ${r.nombre} — ${formatCLP(r.monto)} (${r.motivo}).\nSe recordará automáticamente.`);
        break;
      }

      if (sub === "pay" || sub === "pagar") {
        const id = innerParts[1];
        if (!id) { await reply("Uso: !multa pay <id>"); break; }
        const r = multas.pay(data, id);
        if (!r) { await reply("No encontré una multa pendiente con ese id."); break; }
        box.store.save();
        await reply(`✅ Multa #${id} (${r.nombre}, ${formatCLP(r.monto)}) marcada como pagada.`);
        break;
      }

      if (sub === "undo") {
        const id = innerParts[1];
        if (!id) { await reply("Uso: !multa undo <id>"); break; }
        const r = multas.unpay(data, id);
        if (!r) { await reply("No encontré una multa pagada con ese id."); break; }
        box.store.save();
        await reply(`↩️ Multa #${id} (${r.nombre}) de nuevo como pendiente.`);
        break;
      }

      if (sub === "rm" || sub === "remove" || sub === "borrar") {
        const id = innerParts[1];
        if (!id) { await reply("Uso: !multa rm <id>"); break; }
        const r = multas.remove(data, id);
        if (!r) { await reply("No encontré una multa con ese id."); break; }
        box.store.save();
        await reply(`🗑️ Multa #${id} (${r.nombre}, ${formatCLP(r.monto)}) eliminada.`);
        break;
      }

      await reply(
        "💰 *Multas* — subcomandos (admin):\n" +
        "  · !multa add <monto> <nombre> <motivo…>\n" +
        "  · !multa pay <id>\n" +
        "  · !multa undo <id>\n" +
        "  · !multa rm <id>\n" +
        "Ver todas: *!multas*"
      );
      break;
    }

    case "cambiar-horario": {
      if (!(await onlyAdmin())) break;
      if (!box.site || !box.config.githubToken) { await reply("El bot no tiene GITHUB_TOKEN, no puede editar la página."); break; }
      const toks = args.split(/\s+/);
      if (toks.length < 3) { await reply("Uso: !cambiar-horario <dia> <hora> <lugar>\nEj: !cambiar-horario Lunes 21:00 Club Cordillera"); break; }
      const dia = toks[0];
      const hora = toks[1];
      const lugar = toks.slice(2).join(" ");
      try {
        await box.site.ensure();
        const updated = [...list].map((h) =>
          normalize(h.dia) === normalize(dia) ? { ...h, hora, lugar } : h
        );
        const existe = list.some((h) => normalize(h.dia) === normalize(dia));
        if (!existe) updated.push({ dia, tipo: "Partido", hora, lugar });
        if (!box.site.replaceHorarios(updated)) { await reply("No pude escribir los horarios en config.js."); break; }
        const res = await box.site.push("Actualizar horarios desde WhatsApp");
        await reply(res.changed
          ? `✅ Horario de ${dia} actualizado a ${hora} (${lugar}) y publicado en la página.`
          : res.output);
      } catch (err) {
        await reply("⚠️ Error publicando: " + err.message);
      }
      break;
    }

    case "publicar": {
      if (!(await onlyAdmin())) break;
      if (!box.site || !box.config.githubToken) { await reply("El bot no tiene GITHUB_TOKEN, no puede publicar."); break; }
      try {
        await box.site.ensure();
        const res = await box.site.push("Actualización desde WhatsApp (_" + senderName + "_)");
        await reply(res.changed ? "🌍 Cambios publicados en la página." : res.output);
      } catch (err) {
        await reply("⚠️ Error publicando: " + err.message);
      }
      break;
    }

    case "sincronizar": {
      if (!(await onlyAdmin())) break;
      if (!box.site || !box.config.githubToken) { await reply("El bot no tiene GITHUB_TOKEN."); break; }
      try {
        await box.site.ensure();
        await box.site.pull();
        await reply("🔄 Página sincronizada. Ya puedes usar !horarios con los datos más recientes.");
      } catch (err) {
        await reply("⚠️ Error sincronizando: " + err.message);
      }
      break;
    }

    case "ver-pagina": {
      if (!(await onlyAdmin())) break;
      try {
        const url = `https://raw.githubusercontent.com/${box.config.siteRepo}/main/config.js`;
        const res = await fetch(url);
        if (!res.ok) { await reply("⚠️ No pude leer la página (HTTP " + res.status + ")."); break; }
        const text = await res.text();
        const ctx = {};
        vm2(ctx, text);
        const c = ctx.__out;
        await reply(
          `🌍 *Estado actual de la página*\n\n` +
          `*${c.CLUB.nombre}* — ${c.CLUB.slogan}\n\n` +
          `🗓️ *Horarios*\n${renderHorarios(c.HORARIOS)}\n\n` +
          `💰 Cuota: ${c.CUOTA.monto}\n` +
          `📸 ${c.CLUB.instagram.handle}\n\n` +
          `Configurada con Supabase: ${Boolean(c.SUPABASE?.url) ? "sí ✅" : "no ❌"}`
        );
      } catch (err) {
        await reply("⚠️ Error leyendo la página: " + err.message);
      }
      break;
    }

    default: {
      await reply("No conozco el comando *" + cmd + "*. Escribe *!ayuda* para ver los disponibles.");
    }
  }
  return true;
}

function vm2(ctx, text) {
  const vm = require("vm");
  vm.runInNewContext(text + ";this.__out={CLUB,HORARIOS,CUOTA,NORMA_FINAL,SUPABASE};", ctx);
}

module.exports = { handle, horarios, renderHorarios };