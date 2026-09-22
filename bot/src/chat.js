const { normalize } = require("./helpers");

function responder(pregunta, reglas) {
  const q = normalize(pregunta);
  const matches = (reglas || []).filter((r) =>
    (r.palabras || []).some((p) => {
      const np = normalize(p);
      return np !== "" && q.includes(np);
    })
  );
  if (!matches.length) return null;
  const pool = matches.flatMap((r) => (Array.isArray(r.respuestas) ? r.respuestas : [r.respuestas || ""]));
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function respond(pregunta, club) {
  const r = responder(pregunta, club?.CHAT_REGLAS);
  if (r) return r;
  const fb = club?.CHAT_FALLBACK || [];
  if (!fb.length) return null;
  return fb[Math.floor(Math.random() * fb.length)];
}

module.exports = { responder, respond };