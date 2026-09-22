function normalize(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function digitsOnly(str) {
  return String(str || "").replace(/\D/g, "");
}

function phoneFromJid(jid) {
  if (!jid) return "";
  return digitsOnly(jid.split("@")[0]);
}

function isAdmin(config, phone) {
  const p = digitsOnly(phone);
  if (!p) return false;
  return config.adminNumbers.some((a) => a === p || p.endsWith(a) || a.endsWith(p));
}

function isGroup(jid) {
  return /@g\.us$/.test(jid || "");
}

function formatCLP(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return amount;
  return "$" + n.toLocaleString("es-CL").replace(/,/g, ".");
}

function parseMonto(raw) {
  const n = Number(String(raw).replace(/\D/g, "").replace(/^0+/, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

module.exports = { normalize, digitsOnly, phoneFromJid, isAdmin, isGroup, formatCLP, parseMonto };