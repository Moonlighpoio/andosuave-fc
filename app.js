// ============================================================
// App del club — funciona en MODO DEMO (sin servidor) y
// se conecta a Supabase automáticamente cuando configures las llaves.
// ============================================================

const SUPABASE_CONFIGURADO = Boolean(SUPABASE.url && SUPABASE.anonKey);

// ---------- Utilidades ----------
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function toast(msg, error = false) {
  let t = $("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.toggle("error", error);
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2600);
}

async function hashPass(pass) {
  if (crypto?.subtle) {
    const data = new TextEncoder().encode("club-futbol::" + pass);
    const buf = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return "plain::" + pass;
}

function normalize(str) {
  return String(str).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// ============================================================
// MODO DEMO (localStorage)
// ============================================================
const DEMO_KEY = "club_futbol_usuarios";
const SESSION_KEY = "club_futbol_sesion";
const ADMIN_PASS_DEMO = "admin123";
const MEMBER_PASS_DEMO = "demo123";

function getUsers() {
  try { return JSON.parse(localStorage.getItem(DEMO_KEY)) || []; } catch { return []; }
}
function saveUsers(list) { localStorage.setItem(DEMO_KEY, JSON.stringify(list)); }

function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; } catch { return null; }
}
function setSession(s) { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); }
function clearSession() { localStorage.removeItem(SESSION_KEY); }

function getRole(email) {
  return email.toLowerCase() === CLUB.adminEmail.toLowerCase() ? "admin" : "member";
}

async function demoRegister(nombre, email, pass) {
  const users = getUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { error: "Ese correo ya está registrado. Intenta iniciar sesión." };
  }
  users.push({
    id: "u_" + Date.now(),
    nombre,
    email,
    pass: await hashPass(pass),
    role: getRole(email),
    createdAt: new Date().toISOString(),
  });
  saveUsers(users);
  return { ok: true };
}

async function demoLogin(email, pass) {
  const users = getUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return { error: "No existe una cuenta con ese correo." };
  const h = await hashPass(pass);
  if (user.pass !== h) return { error: "Contraseña incorrecta." };
  setSession({ nombre: user.nombre, email: user.email, role: user.role });
  return { ok: true };
}

function ensureDemoAdmin() {
  const users = getUsers();
  if (!users.some((u) => u.email.toLowerCase() === CLUB.adminEmail.toLowerCase())) {
    users.push({
      id: "u_admin",
      nombre: "Administrador del club",
      email: CLUB.adminEmail,
      pass: "",
      role: "admin",
      createdAt: new Date().toISOString(),
    });
    saveUsers(users);
  }
  setSession({ nombre: "Administrador del club", email: CLUB.adminEmail, role: "admin" });
}

function ensureDemoMember() {
  const miembro = typeof PLANTEL !== "undefined" && PLANTEL.find((m) => m.rol !== "admin") || null;
  setSession({
    nombre: miembro ? miembro.nombre : "Miembro de ejemplo",
    email: miembro ? miembro.email : "demo@miembro.cl",
    role: "member",
  });
}

// Sincroniza el plantel del config con las cuentas locales del modo demo.
async function seedPlantel() {
  if (SUPABASE_CONFIGURADO) return;
  if (typeof PLANTEL === "undefined" || !Array.isArray(PLANTEL)) return;
  const users = getUsers();
  let changed = false;
  for (const m of PLANTEL) {
    const email = m.email.toLowerCase();
    if (users.some((u) => u.email.toLowerCase() === email)) continue;
    users.push({
      id: "u_" + email.replace(/[^a-z0-9]/g, "_"),
      nombre: m.nombre,
      email: m.email,
      pass: await hashPass(MEMBER_PASS_DEMO),
      role: m.rol || "member",
      dorsal: m.dorsal,
      posicion: m.posicion,
      capitan: Boolean(m.capitan),
      createdAt: new Date().toISOString(),
    });
    changed = true;
  }
  if (changed) saveUsers(users);
}

// ============================================================
// SUPABASE (solo si está configurado)
// ============================================================
let sbClient = null;
if (SUPABASE_CONFIGURADO) {
  sbClient = window.supabase.createClient(SUPABASE.url, SUPABASE.anonKey);
  sbClient.auth.onAuthStateChange((event, session) => {
    if (session) {
      setSession({
        email: session.user.email,
        nombre: session.user.user_metadata?.nombre || "Miembro",
        role: getRole(session.user.email),
      });
    }
seedPlantel().then(() => refresh());
  });
}

async function listMembers() {
  if (SUPABASE_CONFIGURADO) {
    const { data, error } = await sbClient
      .from("profiles")
      .select("id, nombre, email, role, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }
  return getUsers();
}

// ============================================================
// AUTH
// ============================================================
function switchTab(tab) {
  $("tab-login").classList.toggle("active", tab === "login");
  $("tab-register").classList.toggle("active", tab === "register");
  $("login-form").hidden = tab !== "login";
  $("register-form").hidden = tab !== "register";
}

// Traduce los mensajes de error de Supabase al español
function traducirError(e) {
  const msg = (e && e.message) || "";
  const t = (msg + " " + ((e && e.code) || "")).toLowerCase();
  if (t.includes("rate limit") || t.includes("too many requests") || t.includes("over_email_send_rate_limit"))
    return "Demasiados intentos. Espera unos minutos y vuelve a intentarlo.";
  if (t.includes("already registered") || t.includes("already been registered") || t.includes("user_already_exists"))
    return "Ya existe una cuenta con este correo.";
  if (t.includes("invalid login credentials") || t.includes("invalid credentials"))
    return "Correo o contraseña incorrectos.";
  if (t.includes("email not confirmed") || t.includes("email_not_confirmed") || t.includes("unconfirmed_email"))
    return "Debes confirmar tu correo para iniciar sesión.";
  if (t.includes("invalid email") || t.includes("unable to validate email"))
    return "El correo ingresado no es válido.";
  if (t.includes("at least 6") || t.includes("minimum of 6") || t.includes("weak password"))
    return "La contraseña debe tener al menos 6 caracteres.";
  if (t.includes("user not found") || t.includes("user_not_found"))
    return "No encontramos una cuenta con ese correo.";
  if (t.includes("session") || t.includes("invalid token") || t.includes("expired"))
    return "Tu sesión expiró. Inicia sesión de nuevo.";
  if (!msg) return "Ocurrió un error inesperado.";
  return "Hubo un problema: " + msg;
}

async function onLogin(e) {
  e.preventDefault();
  const email = $("login-email").value.trim();
  const pass = $("login-pass").value;
  const errBox = $("login-error");

  if (SUPABASE_CONFIGURADO) {
    const { error } = await sbClient.auth.signInWithPassword({ email, password: pass });
    if (error) { errBox.hidden = false; errBox.textContent = traducirError(error); return; }
    return;
  }
  const r = await demoLogin(email, pass);
  if (r.error) { errBox.hidden = false; errBox.textContent = r.error; return; }
  refresh();
}

async function onRegister(e) {
  e.preventDefault();
  const nombre = $("reg-name").value.trim();
  const email = $("reg-email").value.trim();
  const pass = $("reg-pass").value;
  const pass2 = $("reg-pass2").value;
  const errBox = $("register-error");
  errBox.hidden = true;

  if (pass !== pass2) { errBox.hidden = false; errBox.textContent = "Las contraseñas no coinciden."; return; }

  if (SUPABASE_CONFIGURADO) {
    const { error } = await sbClient.auth.signUp({
      email,
      password: pass,
      options: { data: { nombre, role: getRole(email) } },
    });
    if (error) { errBox.hidden = false; errBox.textContent = traducirError(error); return; }
    toast("Cuenta creada. Revisa tu correo para confirmarla ✉️");
    switchTab("login");
    return;
  }
  const r = await demoRegister(nombre, email, pass);
  if (r.error) { errBox.hidden = false; errBox.textContent = r.error; return; }
  toast("¡Cuenta creada! Ya puedes iniciar sesión 🎉");
  $("register-form").reset();
  switchTab("login");
}

function logout() {
  if (sbClient) sbClient.auth.signOut();
  clearSession();
  refresh();
}

// ============================================================
// VISTAS
// ============================================================
function showLanding() {
  $("landing-view").hidden = false;
  $("auth-view").hidden = true;
  $("app-view").hidden = true;
}

function showAuth() {
  $("landing-view").hidden = true;
  $("auth-view").hidden = false;
  $("app-view").hidden = true;
}

function scrollToAuth() {
  showAuth();
  setTimeout(() => $("auth-view").scrollIntoView({ behavior: "smooth" }), 80);
}

const session = () => getSession();

function renderInicio(ses) {
  const esAdmin = ses.role === "admin";
  return `
  <div class="hero-club">
    <span class="hero-crest"><img class="hero-img" src="${esc(CLUB.logo)}" alt="Escudo de ${esc(CLUB.nombre)}"/></span>
    <h1 class="page-title-welcome">¡Hola, <span class="welcome-name">${esc(ses.nombre.split(" ")[0])}</span>!</h1>
    <span class="role-tag">${esAdmin ? "Administrador del club" : "Miembro"}</span>
    <p class="page-sub">Bienvenido a la zona de miembros de <strong>${esc(CLUB.nombre)}</strong>. Aquí están las normas, los horarios y el asistente del club.</p>
  </div>
  <div class="quick-grid">
    <div class="quick-card" onclick="go(event,'normas')">
      <div class="icon">📋</div>
      <h4>Normas</h4><p>Revisa las reglas del club para todos los miembros.</p>
    </div>
    <div class="quick-card" onclick="go(event,'horarios')">
      <div class="icon">🗓️</div>
      <h4>Horarios</h4><p>Días, horas y canchas de juegos y entrenamientos.</p>
    </div>
    <div class="quick-card" onclick="go(event,'chat')">
      <div class="icon">💬</div>
      <h4>Chat del club</h4><p>Pregúntale al asistente por horarios, cuotas y más.</p>
    </div>
    <div class="quick-card" onclick="go(event,'miembros')">
      <div class="icon">👥</div>
      <h4>Miembros</h4><p>Conoce quiénes ya están inscritos en el club.</p>
    </div>
    ${esAdmin ? `<div class="quick-card" onclick="go(event,'admin')"><div class="icon">🛡️</div><h4>Panel Admin</h4><p>Gestiona los miembros registrados.</p></div>` : ""}
  </div>`;
}

function setEscudo(el) {
  if (!el) return;
  if (CLUB.logo) {
    const img = document.createElement("img");
    img.src = CLUB.logo;
    img.alt = CLUB.nombre;
    img.className = "escudo-img";
    img.draggable = false;
    el.replaceChildren(img);
  } else {
    el.textContent = CLUB.escudo;
  }
}

function renderNormas() {
  const grupos = NORMAS.map((grupo, gi) => `
    <div class="card">
      <h3>${esc(grupo.t)}</h3>
      ${grupo.items.map((it, ii) => `
        <div class="norma"><span class="num">${gi + 1}.${ii + 1}</span><p>${esc(it)}</p></div>`).join("")}
    </div>`).join("");

  return `
  <h1 class="page-title"><span class="title-ico">📋</span> Reglamento del club</h1>
  <p class="page-sub">Reglamento oficial de ${esc(CLUB.nombre)}. El incumplimiento puede significar multas o la baja del club.</p>
  ${grupos}
  <div class="card cuota-box">
    <p style="font-weight:600;">${esc(NORMA_FINAL)}</p>
  </div>`;
}

function renderHorarios() {
  return `
  <h1 class="page-title"><span class="title-ico">🗓️</span> Horarios</h1>
  <p class="page-sub">Actividades semanales del ${esc(CLUB.nombre)}.</p>
  <div class="sched">
    ${HORARIOS.map((h) => `
      <div class="sched-card">
        <div class="tipo">${esc(h.tipo)}</div>
        <div class="dia">${esc(h.dia)} · ${esc(h.hora)}</div>
        <div class="detalle">📍 ${esc(h.lugar)}</div>
        ${h.direccion ? `<div class="dir">${esc(h.direccion)}</div>` : ""}
        ${h.mapa ? `<a class="map-btn" href="${esc(h.mapa)}" target="_blank" rel="noopener">🗺️ Cómo llegar</a>` : ""}
      </div>`).join("")}
  </div>
  <div class="prices-grid">
    <div class="cuota-box cancha">
      <div class="etiqueta" style="color:var(--text-muted);font-size:.85rem;">PRECIO DE CANCHA</div>
      <div class="monto">${esc(CANCHA.monto)}</div>
      <p style="color:var(--text-muted);font-size:.85rem;">${esc(CANCHA.unidad)}</p>
      <p>${esc(CANCHA.descripcion)}</p>
      <p class="prices-aviso">🔔 ${esc(CANCHA.aviso)}${CLUB.whatsapp ? ` <a href="${esc(CLUB.whatsapp)}" target="_blank" rel="noopener">Abrir grupo de WhatsApp</a>` : ""}</p>
    </div>
    <div class="cuota-box">
      <div class="etiqueta" style="color:var(--text-muted);font-size:.85rem;">CUOTA MENSUAL</div>
      <div class="monto">${esc(CUOTA.monto)}</div>
      <p>${esc(CUOTA.descripcion)}</p>
      <p style="color:var(--text-muted);font-size:.85rem;margin-top:.4rem;">${esc(CUOTA.pago)}</p>
    </div>
  </div>`;
}

function renderChat() {
  return `
  <h1 class="page-title"><span class="title-ico">💬</span> Chat del club</h1>
  <p class="page-sub">Asistente del club: responde dudas sobre horarios, cuota, normas y más.</p>
  <div class="chat-wrap">
    <div class="chat-msgs" id="chat-msgs"></div>
    <form class="chat-input-row" id="chat-form">
      <input type="text" id="chat-input" placeholder="Ej: ¿cuándo jugamos?" autocomplete="off" />
      <button type="submit" class="btn btn-primary" aria-label="Enviar mensaje al chat">Enviar</button>
    </form>
  </div>
  <p class="chat-hint">Pregunta por: horarios, cuota, normas, redes, capitán…</p>`;
}

async function renderMiembros() {
  let users;
  try {
    users = await listMembers();
  } catch (err) {
    toast("Error al cargar miembros: " + err.message, true);
    return "";
  }
  if (!users) users = [];

  const fmt = (d) => {
    const t = new Date(d);
    return isNaN(t) ? "-" : t.toLocaleDateString("es-CL");
  };
  const inits = (n) => String(n || "?").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const ordenados = [...users].sort((a, b) => {
    if ((a.role === "admin") !== (b.role === "admin")) return a.role === "admin" ? -1 : 1;
    if (Boolean(a.capitan) !== Boolean(b.capitan)) return a.capitan ? -1 : 1;
    return new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0);
  });

  const admins = users.filter((u) => u.role === "admin").length;
  const capitanes = users.filter((u) => u.capitan).length;

  const card = (u) => {
    const dorsal = u.dorsal ?? "";
    const pos = u.posicion || u.position || "";
    const tag = u.capitan ? "capitan" : u.role;
    const label = u.capitan ? "⭐ Capitán" : u.role === "admin" ? "Admin" : "Miembro";
    const num = dorsal !== "" ? esc(dorsal) : esc(inits(u.nombre || u.name));
    return `
      <div class="member-card${u.capitan ? " capitan" : ""}">
        <div class="member-jersey">${num}</div>
        ${pos ? `<span class="member-pos">${esc(pos)}</span>` : ""}
        <span class="user-role ${tag}">${label}</span>
        <div class="member-name">${esc(u.nombre || u.name)}</div>
        <span class="member-mail">${esc(u.email)}</span>
        <span class="member-since">desde ${fmt(u.created_at || u.createdAt)}</span>
      </div>`;
  };

  const cards = ordenados.map(card).join("");

  return `
  <h1 class="page-title"><span class="title-ico">👥</span> Miembros del club</h1>
  <p class="page-sub">Estos son los inscritos de ${esc(CLUB.nombre)}. Sumamos buena onda dentro y fuera de la cancha.</p>
  <div class="stat-grid">
    <div class="stat"><div class="valor">${users.length}</div><div class="etiqueta">Inscritos</div></div>
    <div class="stat"><div class="valor">${admins}</div><div class="etiqueta">Directiva</div></div>
    <div class="stat"><div class="valor">${capitanes}</div><div class="etiqueta">Capitán(es)</div></div>
  </div>
  ${users.length
    ? `<div class="member-grid">${cards}</div>`
    : `<p class="empty">Aún no hay miembros registrados.</p>`}`;
}

async function renderAdmin() {
  let users;
  try {
    users = await listMembers();
  } catch (err) {
    toast("Error al cargar miembros: " + err.message, true);
    return "";
  }
  if (!users) users = [];

  const admins = users.filter((u) => u.role === "admin").length;
  const miembros = users.filter((u) => u.role === "member").length;
  const rows = users.map((u) => `
    <tr>
      <td><strong>${esc(u.nombre)}</strong></td>
      <td>${esc(u.email)}</td>
      <td>${u.dorsal ?? "-"}</td>
      <td>${esc(u.posicion || u.position || "-")}</td>
      <td><span class="user-role ${u.capitan ? "capitan" : u.role}">${u.capitan ? "⭐ Capitán" : u.role === "admin" ? "Admin" : "Miembro"}</span></td>
      <td>${new Date(u.created_at || u.createdAt).toLocaleDateString("es-CL")}</td>
      <td style="text-align:right;">
        ${u.role === "admin"
          ? `<span style="color:var(--text-muted);font-size:.78rem;">No se puede eliminar</span>`
          : `<button class="btn btn-danger btn-sm" onclick="deleteMember('${u.id}')">Eliminar</button>`}
      </td>
    </tr>`).join("");

  return `
  <h1 class="page-title"><span class="title-ico">🛡️</span> Panel de administración</h1>
  <p class="page-sub">${esc(PANEL_ADMIN.descripcion)}</p>
  <div class="stat-grid">
    <div class="stat"><div class="valor">${users.length}</div><div class="etiqueta">Total</div></div>
    <div class="stat"><div class="valor">${admins}</div><div class="etiqueta">Admins</div></div>
    <div class="stat"><div class="valor">${miembros}</div><div class="etiqueta">Miembros</div></div>
  </div>
  <div class="card">
    ${users.length
      ? `<div class="admin-table-wrap">
          <table class="admin-table">
          <thead><tr><th>Nombre</th><th>Correo</th><th>Dorsal</th><th>Posición</th><th>Rol</th><th>Registro</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>`
      : `<p class="empty">Aún no hay miembros registrados.</p>`}
  </div>
  <p style="color:var(--text-muted);font-size:.85rem;">⚠️ Al eliminar un miembro pierde el acceso al sitio del club.</p>`;
}

function go(event, route) {
  if (event) event.preventDefault();
  const ses = session();
  if (!ses) { refresh(); return; }

  $("app-nav").classList.remove("open");
  $("nav-toggle").classList.remove("open");
  $("nav-toggle").setAttribute("aria-expanded", "false");

  document.querySelectorAll("#app-nav a").forEach((a) =>
    a.classList.toggle("active", a.dataset.route === route)
  );

  const container = $("view-container");
  if (route === "normas") container.innerHTML = renderNormas();
  else if (route === "horarios") container.innerHTML = renderHorarios();
  else if (route === "chat") { container.innerHTML = renderChat(); initChat(); }
  else if (route === "admin") {
    if (ses.role !== "admin") { toast("No tienes permisos de administrador", true); return; }
    container.innerHTML = '<p class="page-sub">Cargando miembros…</p>';
    renderAdmin().then((html) => { container.innerHTML = html; });
  } else if (route === "miembros") {
    container.innerHTML = '<p class="page-sub">Cargando miembros…</p>';
    renderMiembros().then((html) => { container.innerHTML = html; });
  } else container.innerHTML = renderInicio(ses);
}

// ============================================================
// CHAT (basado en reglas)
// ============================================================
function responderBot(pregunta) {
  const q = normalize(pregunta);
  for (const regla of CHAT_REGLAS) {
    if (regla.palabras.some((p) => normalize(p) !== "" && q.includes(normalize(p)))) {
      return regla.respuestas[Math.floor(Math.random() * regla.respuestas.length)];
    }
  }
  return CHAT_FALLBACK[Math.floor(Math.random() * CHAT_FALLBACK.length)];
}

function initChat() {
  const msgs = $("chat-msgs");
  const form = $("chat-form");
  const input = $("chat-input");
  const add = (texto, tipo) => {
    const d = document.createElement("div");
    d.className = "msg " + tipo;
    d.textContent = texto;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  };

  add("¡Hola! 👋 Soy el asistente de " + CLUB.nombre + ". Pregúntame por horarios, cuota mensual, normas o redes.", "bot");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    add(q, "user");
    input.value = "";
    const typing = add("Escribiendo…", "bot typing");
    setTimeout(() => {
      typing.remove();
      add(responderBot(q), "bot");
    }, 500 + Math.random() * 700);
  });
}

// ============================================================
// ADMIN — eliminar miembro
// ============================================================
async function deleteMember(uid) {
  if (SUPABASE_CONFIGURADO) {
    const { data: { session } } = await sbClient.auth.getSession();
    if (!session) { toast("Sin sesión activa", true); return; }
    if (!confirm(`¿Eliminar a este miembro? Perderá el acceso al club.`)) return;
    try {
      const res = await fetch(`${SUPABASE.url}/functions/v1/delete-member`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: uid }),
      });
      const data = await res.json();
      if (!res.ok) { toast(data.error || "Error al eliminar", true); return; }
      toast("Miembro eliminado 🗑️");
      go(null, "admin");
    } catch (e) {
      const detalle = /failed to fetch|networkerror/i.test(e.message) ? "sin conexión con el servidor" : e.message;
      toast("Error de conexión: " + detalle, true);
    }
    return;
  }

  const users = getUsers();
  const target = users.find((u) => u.id === uid);
  if (!target) return;
  if (target.role === "admin") { toast("No puedes eliminar al administrador del club", true); return; }

  const nombre = target.nombre;
  if (!confirm(`¿Eliminar a "${nombre}"? Perderá el acceso al club.`)) return;
  saveUsers(users.filter((u) => u.id !== uid));
  toast(`Miembro "${nombre}" eliminado 🗑️`);
  go(null, "admin");
}

// ============================================================
// REFRESH DE VISTA PRINCIPAL
// ============================================================
function refresh() {
  const ses = session();
  const landing = $("landing-view");
  const auth = $("auth-view");
  const app = $("app-view");

  if (!ses) {
    landing.hidden = false;
    auth.hidden = true;
    app.hidden = true;

    $("landing-logo").textContent = CLUB.nombre;
    $("landing-logo").dataset.est = CLUB.est;
    $("landing-kicker").textContent = CLUB.est + " · FÚTBOL DE AMIGOS";
    setEscudo($("landing-header-escudo"));
    setEscudo($("landing-escudo"));
    $("landing-title").textContent = CLUB.nombre;
    $("landing-slogan").textContent = CLUB.slogan;
    $("landing-desc").textContent = CLUB.presentacion;
    $("landing-ig").href = CLUB.instagram.url;
    $("landing-ig").textContent = `📸 Síguenos en Instagram · ${CLUB.instagram.handle}`;
    $("landing-footer-text").textContent = `© ${new Date().getFullYear()} ${CLUB.nombre} · Zona de miembros`;

    $("auth-club-name").textContent = CLUB.nombre;
    $("auth-kicker").textContent = CLUB.est;
    $("auth-slogan").textContent = CLUB.slogan;
    setEscudo($("auth-escudo"));
    $("demo-box").hidden = SUPABASE_CONFIGURADO;
    $("login-error").hidden = true;
    $("register-error").hidden = true;
    return;
  }

  landing.hidden = true;
  auth.hidden = true;
  app.hidden = false;
  $("app-header-title").textContent = CLUB.nombre;
  setEscudo($("app-header-escudo"));
  $("user-badge").textContent = `${ses.nombre} · ${ses.role === "admin" ? "Admin" : "Miembro"}`;
  $("user-badge").title = ses.email;
  $("nav-admin").hidden = ses.role !== "admin";
  go(null, "inicio");
}

// ---------- Conectar handlers ----------
$("login-form").addEventListener("submit", onLogin);
$("register-form").addEventListener("submit", onRegister);
$("btn-demo-admin").addEventListener("click", () => { ensureDemoAdmin(); refresh(); });
$("btn-demo-miembro").addEventListener("click", () => { ensureDemoMember(); refresh(); });

// Menú hamburguesa (móviles)
$("nav-toggle").addEventListener("click", () => {
  const open = $("app-nav").classList.toggle("open");
  $("nav-toggle").classList.toggle("open", open);
  $("nav-toggle").setAttribute("aria-expanded", open);
});

refresh();