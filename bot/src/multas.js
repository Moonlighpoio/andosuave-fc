const { normalize, formatCLP } = require("./helpers");

function ensureMultas(data) {
  if (!Array.isArray(data.multas)) data.multas = [];
  if (typeof data.multasNextId !== "number") data.multasNextId = 1;
}

function list(data) {
  ensureMultas(data);
  return data.multas;
}

function pending(data) {
  return list(data).filter((m) => !m.pagado);
}

function add(data, { nombre, telefono, monto, motivo }) {
  ensureMultas(data);
  const item = {
    id: String(data.multasNextId++),
    nombre: String(nombre || "").trim(),
    telefono: String(telefono || "").trim(),
    monto: Number(monto),
    motivo: String(motivo || "").trim(),
    fecha: new Date().toISOString(),
    pagado: false,
  };
  data.multas.push(item);
  return item;
}

function pay(data, id) {
  const item = list(data).find((m) => String(m.id) === String(id));
  if (!item || item.pagado) return null;
  item.pagado = true;
  item.pagadoFecha = new Date().toISOString();
  return item;
}

function unpay(data, id) {
  const item = list(data).find((m) => String(m.id) === String(id));
  if (!item) return null;
  item.pagado = false;
  delete item.pagadoFecha;
  return item;
}

function remove(data, id) {
  const items = list(data);
  const idx = items.findIndex((m) => String(m.id) === String(id));
  if (idx === -1) return null;
  const [item] = items.splice(idx, 1);
  return item;
}

function groupByMember(items) {
  const groups = {};
  for (const m of items) {
    const key = normalize(m.nombre) || m.telefono || "Sin nombre";
    if (!groups[key]) groups[key] = { nombre: m.nombre || m.telefono || "Sin nombre", total: 0, items: [] };
    groups[key].total += Number(m.monto) || 0;
    groups[key].items.push(m);
  }
  return Object.values(groups);
}

function textoResumen(pend) {
  const groups = groupByMember(pend);
  if (groups.length === 0) return "No hay multas pendientes. 🎉";
  return groups
    .map((g) => {
      const detalle = g.items
        .map((m) => `  #${m.id} · ${formatCLP(m.monto)} — ${m.motivo || "sin motivo"}`)
        .join("\n");
      return `👤 ${g.nombre} — total pendiente ${formatCLP(g.total)}\n${detalle}`;
    })
    .join("\n");
}

module.exports = { list, pending, add, pay, unpay, remove, groupByMember, textoResumen };