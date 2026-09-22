// ============================================================
// CONFIGURACIÓN DEL CLUB  —  edita aquí los datos reales
// ============================================================

const CLUB = {
  nombre: "AndoSuave FC",
  escudo: "⚽",
  logo: "logo.jpg",
  est: "EST. 2026",
  slogan: "Grupo de amigos que juega fútbol — se prioriza la diversión y la buena onda.",
  presentacion:
    "AndoSuave FC es un grupo de amigos que juega fútbol por pasión y comunidad. " +
    "Jugamos los lunes en Club Cordillera y los jueves en DepartaSport, siempre a las 20:00, " +
    "con una cuota mensual de $3.000 CLP. En esta zona de miembros compartimos horarios, " +
    "reglamento y novedades del equipo.",
  instagram: {
    handle: "@andosuave_fc",
    url: "https://www.instagram.com/andosuave_fc/",
  },
  directiva: {
    tesorero: "Ignacio Bilbao",
    administradores: ["Rodrigo Barriga", "Benjamín Barriga"],
  },
  // ÚNICO correo de administrador. Solo este podrá entrar al panel de gestión.
  adminEmail: "rbarriga.pino@gmail.com",
  // Enlace opcional al grupo de WhatsApp del club (avisos de precios y cambios).
  whatsapp: "",
};

// Plantel con las poleras del equipo (se muestra en la sección Miembros).
// nombre = texto en la camiseta · dorsal = número (o código de la polera) · posicion = "Jugador" | "Portero"
const POLERAS = [
  { nombre: "YIYO", dorsal: "18", posicion: "Jugador" },
  { nombre: "JM PEÑALOZA", dorsal: "9", posicion: "Jugador" },
  { nombre: "PRÍNCIPE MATEO", dorsal: "10-M", posicion: "Jugador" },
  { nombre: "NANO", dorsal: "8", posicion: "Jugador" },
  { nombre: "ROBERTO", dorsal: "17", posicion: "Jugador" },
  { nombre: "BARRIGA", dorsal: "11", posicion: "Jugador" },
  { nombre: "VENO EL COMANDANTE", dorsal: "73", posicion: "Jugador" },
  { nombre: "MARTOO SEXY", dorsal: "30", posicion: "Jugador" },
  { nombre: "LARVA", dorsal: "7", posicion: "Jugador" },
  { nombre: "KIESSLING", dorsal: "898", posicion: "Jugador" },
  { nombre: "I. BILBAO", dorsal: "2+9", posicion: "Jugador" },
  { nombre: "RENATO.S", dorsal: "91", posicion: "Jugador" },
  { nombre: "MORY", dorsal: "5", posicion: "Jugador" },
  { nombre: "PACHECO G", dorsal: "20", posicion: "Portero" },
  { nombre: "ABC", dorsal: "13", posicion: "Jugador" },
  { nombre: "TOMBARRI", dorsal: "26", posicion: "Jugador" },
  { nombre: "LÓPEZ", dorsal: "23", posicion: "Jugador" },
  { nombre: "JOFRE", dorsal: "35", posicion: "Jugador" },
  { nombre: "SERÓN", dorsal: "6", posicion: "Jugador" },
  { nombre: "BASTIAN IGNACIO", dorsal: "80", posicion: "Jugador" },
  { nombre: "POLLO", dorsal: "999", posicion: "Jugador" },
  { nombre: "DENIS", dorsal: "10", posicion: "Jugador" },
  { nombre: "ANDRES", dorsal: "15", posicion: "Jugador" },
  { nombre: "J.DIAZ ALISTE", dorsal: "1+8", posicion: "Jugador" },
  { nombre: "DON ELÍAS", dorsal: "75", posicion: "Jugador" },
  { nombre: "HISTÓRICO", dorsal: "47", posicion: "Jugador" },
  { nombre: "JULIO", dorsal: "14", posicion: "Jugador" },
  { nombre: "MAURI", dorsal: "22", posicion: "Jugador" },
  { nombre: "SAAVEDRA", dorsal: "83", posicion: "Jugador" },
  { nombre: "VASQUEZ", dorsal: "24", posicion: "Jugador" },
  { nombre: "VITOCO", dorsal: "16", posicion: "Jugador" },
  { nombre: "ZULETA", dorsal: "27", posicion: "Jugador" },
  { nombre: "DANIS", dorsal: "31", posicion: "Jugador" },
  { nombre: "ROBER", dorsal: "65", posicion: "Jugador" },
  { nombre: "TRÍPODE", dorsal: "9+1", posicion: "Jugador" },
  { nombre: "ZULETA", dorsal: "19", posicion: "Jugador" },
  { nombre: "FRANCO", dorsal: "14", posicion: "Jugador" },
  { nombre: "ANTONIO", dorsal: "7+1", posicion: "Jugador" },
  { nombre: "JT PEÑALOZA", dorsal: "9", posicion: "Jugador" },
  { nombre: "GALIASSI", dorsal: "77", posicion: "Jugador" },
];

// Días y horarios de los partidos
const HORARIOS = [
  {
    dia: "Lunes",
    tipo: "Partido",
    hora: "20:00 – 21:00",
    lugar: "Club Cordillera · La Florida",
    direccion: "Av. Departamental 3837, La Florida, Santiago",
    mapa: "https://www.google.com/maps/search/?api=1&query=Av.%20Departamental%203837%2C%20La%20Florida%2C%20Santiago%2C%20Chile",
  },
  {
    dia: "Jueves",
    tipo: "Partido",
    hora: "20:00 – 21:00",
    lugar: "DepartaSport",
    direccion: "Av. Departamental 1950, Pedro Aguirre Cerda, Santiago",
    mapa: "https://www.google.com/maps/search/?api=1&query=Av.%20Departamental%201950%2C%20Pedro%20Aguirre%20Cerda%2C%20Santiago%2C%20Chile",
  },
];

// Cuota mensual
const CUOTA = {
  monto: "$3.000",
  descripcion: "Cuota mensual para todos los integrantes del club.",
  vence: "Vence el día 5 de cada mes.",
  condiciones:
    "Primer mes: si un nuevo integrante no paga hasta el día 5, es expulsado automáticamente. " +
    "Meses siguientes: pagar fuera de plazo aplica una multa de $3.000.",
  mora: "Si la cuota sigue impaga antes del día 10 del mes, se procede a la expulsión del jugador.",
  pago:
    "Tesorero: Ignacio Bilbao · Cuenta Tenpo (Cuenta Vista) N° 111120388118 · " +
    "Correo ignacioandresmb10@gmail.com",
};

// Precio de la cancha por partido (editable; los cambios se avisan en el grupo de WhatsApp)
const CANCHA = {
  monto: "$3.000",
  unidad: "por partido",
  descripcion: "Valor que se paga por el arriendo de la cancha en cada jornada (lunes y jueves).",
  aviso: "Este valor puede cambiar con el tiempo. Cualquier modificación será notificada en el grupo de WhatsApp del club.",
};

// ============================================================
// REGLAMENTO DEL CLUB (extraído del documento oficial)
// ============================================================
const NORMAS = [
  {
    t: "1. Cuota mensual",
    items: [
      "Monto: $3.000. Vence el día 5 de cada mes.",
      "Primer mes: si un nuevo integrante no paga dentro del plazo (hasta el día 5), será expulsado automáticamente.",
      "Meses siguientes: si no se paga a tiempo, se aplica una multa de $3.000.",
      "Mora: si la cuota sigue impaga antes del día 10 del mes, se procede a la expulsión del jugador.",
    ],
  },
  {
    t: "2. Listas de partidos",
    items: [
      "Los 37 jugadores del grupo principal tienen prioridad absoluta para jugar siempre.",
      "En segundo lugar se considera la banca, que se usa si faltan jugadores del grupo principal.",
      "Si no se completa con la banca, podrán participar los llamados “galletas”.",
      "Los “galletas” deben anotarse el día anterior desde las 12:00 hrs, debajo de la lista de banca.",
      "No está permitido llevar jugadores no anotados previamente, ni hacer cambios o reemplazos por otra persona, ni siquiera por quien lo haya llevado.",
    ],
  },
  {
    t: "3. Renuncias y expulsiones",
    items: [
      "En caso de renuncia voluntaria o expulsión, no se realizará reembolso de las cuotas pagadas.",
      "Cualquier participante que incurra en agresiones físicas (puños u otras) será expulsado de forma inmediata y sin derecho a apelación.",
      "Si un integrante mantiene una conducta conflictiva en el grupo de WhatsApp, la administración podrá solicitar una votación entre los miembros para decidir su permanencia o expulsión.",
    ],
  },
  {
    t: "4. Atrasos",
    items: [
      "Todos los jugadores deben estar en la cancha y listos para jugar a la hora programada de inicio.",
      "Se considera atraso llegar después de la hora de inicio, o estar en el recinto pero sin haber ingresado a jugar (cambiándose de ropa o calzando los zapatos) una vez iniciado el partido.",
      "Tercer atraso: el jugador quedará suspendido por 1 fecha.",
      "Atrasos reiterados sin justificación pueden derivar en medidas disciplinarias, incluso votación para expulsión.",
    ],
  },
  {
    t: "5. Bajas",
    items: [
      "Las bajas deben informarse antes de las 12:00 horas del mismo día del partido.",
      "Baja entre las 12:00 y las 17:00: multa de $3.000 sin sanción de fechas.",
      "Baja después de las 17:00 (aunque se deje reemplazo): multa de $3.000 y sanción de 4 fechas sin jugar.",
    ],
  },
  {
    t: "6. Reemplazos",
    items: [
      "No está permitido agregar nuevos jugadores al grupo sin la autorización expresa de la administración.",
      "Cada jugador es responsable de anotarse por sí mismo en la lista de titulares; no está permitido que otro lo inscriba en su lugar.",
    ],
  },
  {
    t: "7. Horario de partidos",
    items: [
      "La convocatoria cierra a las 12:00 horas del mismo día del partido.",
      "Los partidos se juegan los lunes y jueves a las 20:00 horas.",
      "La cancha preferente es Club Cordillera los lunes y DepartaSport los jueves, aunque podría cambiar en caso de disponibilidad.",
    ],
  },
  {
    t: "8. Pagos de la cancha",
    items: [
      "Las mensualidades van a un fondo común que cubre reembolso por arriendo de cancha, compra de balones, ayudas solidarias, fiesta de fin de año y posibles premios.",
      "El arriendo de cancha se paga por separado entre todos y debe cancelarse el mismo día del partido hasta las 23:59.",
      "Pagar la cancha fuera de plazo: multa de $3.000. Si no se paga la cancha más la multa antes de las 23:59 del día siguiente, se aplican 2 fechas sin jugar.",
    ],
  },
  {
    t: "9. Excepciones",
    items: [
      "Lesiones: el jugador puede permanecer en el grupo siempre que continúe pagando su cuota mensual.",
      "Se aceptan excepciones justificadas por motivos médicos, urgencias familiares, compromisos académicos o laborales.",
      "Estas situaciones se evalúan de manera flexible y con criterio de buena fe por parte de la administración.",
    ],
  },
  {
    t: "10. Nómina",
    items: [
      "Cualquier jugador podrá hacer la nómina para la próxima semana una vez terminado el partido correspondiente.",
      "Es responsabilidad de cada uno estar atento al celular.",
    ],
  },
  {
    t: "11. Uniforme",
    items: [
      "Se puede jugar con polerón del color que toca mientras se calienta el cuerpo.",
      "Por obligación, debajo debe estar la camiseta del club 2026 sobre cualquier otra prenda.",
      "Equipación completa = camiseta más short. Las medias quedan a libre criterio.",
      "No cumplir con esto: sanción de 2 fechas sin jugar.",
    ],
  },
  {
    t: "12. Reintegro",
    items: [
      "Reintegro inmediato si un jugador no cumplió los tres partidos mensuales, pagando $3.000 de multa antes de la siguiente mensualidad.",
      "Si no quiere pagar, quedará suspendido un mes, con posibilidad de jugar solo si la banca no tiene ningún titular.",
    ],
  },
];

const NORMA_FINAL =
  "“Recuerden: somos un grupo de amigos donde se prioriza la diversión y la buena onda.” — La administración";

// Panel de administración
const PANEL_ADMIN = {
  titulo: "Gestión de miembros",
  descripcion: "Administra a los miembros registrados. Solo el correo de administrador puede entrar aquí.",
};

// ============================================================
// CHAT INTELIGENTE (basado en reglas)
// ============================================================
function resumenHorarios() {
  return HORARIOS.map((h) =>
    `• ${h.tipo} ${h.dia} a las ${h.hora} en ${h.lugar}${h.direccion ? " (" + h.direccion + ")" : ""}`
  ).join("\n");
}

const CHAT_REGLAS = [
  {
    palabras: ["día", "dia", "días", "dias", "partido", "juego", "juega", "jugamos", "jugar", "cuándo", "cuando", "donde", "dónde", "horario", "hora", "cancha", "lugar", "lunes", "jueves", "ubica", "convocatoria"],
    respuestas: [
      "Los partidos son los días:\n" + resumenHorarios() + "\n\nLa convocatoria cierra a las 12:00 hrs del mismo día del partido.",
      "Jugamos lunes y jueves a las 20:00. " + resumenHorarios(),
    ],
  },
  {
    palabras: ["cuota", "pagar", "pago", "plata", "dinero", "mensual", "tesorero", "3000", "$3.000", "vencimiento", "vence"],
    respuestas: [
      `La cuota mensual es ${CUOTA.monto}. ${CUOTA.vence} ${CUOTA.condiciones} ${CUOTA.mora}\n\n💳 ${CUOTA.pago}`,
      "La cuota es de " + CUOTA.monto + " y vence el día 5 de cada mes. Pagar fuera de plazo tiene multa de $3.000 (y si sigue impaga al día 10, expulsión).\n\n💳 " + CUOTA.pago,
    ],
  },
  {
    palabras: ["atraso", "atrasado", "tarde"],
    respuestas: [
      "Debes estar listo y en cancha a la hora de inicio del partido. El tercer atraso significa suspensión por 1 fecha, y los atrasos reiterados pueden llevar a medidas disciplinarias. ⏰",
    ],
  },
  {
    palabras: ["baja", "avisar", "no jugar", "falta"],
    respuestas: [
      "Para darte de baja de un partido avisa antes de las 12:00 hrs del mismo día. Entre 12:00 y 17:00 hay multa de $3.000 (sin sanción de fechas). Después de las 17:00: multa de $3.000 y 4 fechas sin jugar. 📵",
    ],
  },
  {
    palabras: ["cancha", "arriendo", "arrienda", "departasport", "cordillera", "$3.000 de cancha"],
    respuestas: [
      `El arriendo de cancha cuesta ${CANCHA.monto} por partido. El valor puede cambiar con el tiempo y se avisa en el grupo de WhatsApp del club. 📍 El pago se hace por separado el mismo día del partido hasta las 23:59. No pagar a tiempo tiene multa de $3.000; si tampoco se paga al día siguiente, 2 fechas sin jugar.`,
    ],
  },
  {
    palabras: ["galleta", "galletas", "banca", "titular", "titulares", "lista", "nómina", "nomina", "aliniación", "alineación", "inscribir", "anotar", "anotarse"],
    respuestas: [
      "Orden de prioridad: primero los 37 titulares, luego la banca y finalmente los “galletas”. Los galletas se anotan el día anterior desde las 12:00. La nómina se hace tras cada partido para la semana siguiente. 📋",
      "Para jugar: titulares tienen prioridad absoluta; la banca entra si faltan titulares; los galletas pueden participar si aún falta gente y deben anotarse el día anterior desde las 12:00.",
    ],
  },
  {
    palabras: ["uniforme", "camiseta", "camisa", "polera", "polerón", "short", "calceta", "medias"],
    respuestas: [
      "Uniforme obligatorio: camiseta del club 2026 debajo de cualquier prenda, más short. Las medias son a libre criterio. Incumplir esto: 2 fechas sin jugar. 👕",
    ],
  },
  {
    palabras: ["norma", "normas", "regla", "reglas", "reglamento", "sancion", "sanciones", "se puede", "no se puede", "está prohibido", "esta prohibido"],
    respuestas: [
      "El reglamento de AndoSuave FC cubre: cuota ($3.000, vence el día 5), listas de partidos, renuncias y expulsiones, atrasos (3er atraso = suspensión 1 fecha), bajas (aviso antes de las 12:00), reemplazos, horario (lun y jue 20:00), pagos de cancha, excepciones, nómina, uniforme (2 fechas si no se cumple) y reintegro. 📋 Pregúntame por uno en específico o revisa la sección Reglamento.",
    ],
  },
  {
    palabras: ["expuls", "renuncia", "reembolso", "violencia", "agresión", "peg", "pelea", "puñete", "whatsapp", "votación", "conducta", "conflicto"],
    respuestas: [
      "Las agresiones físicas significan expulsión inmediata sin apelación, y las renuncias no se reembolsan. Si hay conducta conflictiva en el WhatsApp, la administración puede pedir votación de los miembros. ⚠️",
    ],
  },
  {
    palabras: ["cuenta", "tenpo", "transferencia", "bilbao", "ignacio", "banco", "número", "correo", "pagar a quién", "a quién pago"],
    respuestas: [
      "Los pagos van al tesorero Ignacio Bilbao · Banco prepago Tenpo · Cuenta Vista N° 111120388118 · Correo ignacioandresmb10@gmail.com 🏦",
    ],
  },
  {
    palabras: ["miembros", "miembro", "inscritos", "inscrito", "inscrita", "inscritas", "registrados", "registrado", "plantel", "quién está", "quien esta", "quiénes están", "quienes estan", "jugadores son"],
    respuestas: [
      "Puedes ver a todos los inscritos en la sección 👥 Miembros del club. Ahí aparece cada integrante con su rol y fecha de ingreso. Todos sumamos buena onda dentro y fuera de la cancha. ⚽🤝",
    ],
  },
  {
    palabras: ["equipo", "grupo", "quienes", "quiénes", "somos", "cuántos", "cuantos", "integrantes", "cómo", "como es el", "qué es", "que es", "sobre"],
    respuestas: [
      "AndoSuave FC es un grupo de amigos que juega fútbol. Somos un equipo con 37 jugadores principales + banca + galletas, y jugamos lunes y jueves a las 20:00. Se prioriza la diversión y la buena onda. ⚽",
    ],
  },
  {
    palabras: ["instagram", "redes", "red", "síguenos", "siguenos", "seguir"],
    respuestas: [
      `Síguenos en Instagram: ${CLUB.instagram.handle} — ${CLUB.instagram.url}`,
      "Nuestra red es el Instagram: " + CLUB.instagram.handle + " (" + CLUB.instagram.url + ")",
    ],
  },
  {
    palabras: ["admin", "administrador", "administración", "directiva", "capitán", "capitan", "cuerpo"],
    respuestas: [
      `La administración de AndoSuave FC es ${CLUB.directiva.administradores.join(" y ")}. El tesorero es ${CLUB.directiva.tesorero}.`,
    ],
  },
  {
    palabras: ["hola", "buenas", "saludos", "que tal", "qué tal", "hey"],
    respuestas: [
      "¡Hola! 👋 Soy el asistente de AndoSuave FC. Pregúntame por horarios, cuota, atrasos, bajas, uniforme o cualquier regla del club.",
      "¡Buenas! ⚽ Pregúntame por horarios, cuota mensual, bajas o reglamento del club.",
    ],
  },
  {
    palabras: ["gracias", "genial", "perfecto", "ok", "buena respuesta"],
    respuestas: [
      "¡De nada! 🤝 Si necesitas algo más, aquí estoy.",
      "¡Para eso estoy! Cualquier otra duda, me dices.",
    ],
  },
];

const CHAT_FALLBACK = [
  "Buena pregunta. 🤔 Consulta el reglamento en la sección Normas o pregunta a la administración.",
  "No tengo esa respuesta aún. Revisa la sección Normas o consulta a la administración del club.",
  "Eso no lo tengo en mis datos. Intenta preguntar por horarios, cuota, bajas, atrasos o uniforme.",
];

// ============================================================
// SUPABASE CONECTADO ✅
// ============================================================
const SUPABASE = {
  url: "https://roystwcwvttxiyeknoid.supabase.co",
  anonKey: "sb_publishable_tr-yVRt9CUr7HcEqGwVr8w_FJb2XfDO",
};