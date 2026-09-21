// ============================================================
// delete-member — Edge Function de Supabase (Deno)
// Elimina a un miembro de verdad (auth.users + su perfil).
// Usa la clave de servicio internamente; el cliente jamas la ve.
// Seguridad: solo puede ejecutarla un perfil con rol 'admin'.
// ============================================================

import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  try {
    // 1) Token del usuario que llama (miembro/admin logueado)
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json(401, { error: "No hay sesión activa." });

    // 2) Verificar el token y obtener el usuario
    const client = createClient(supabaseUrl, token, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: userError } = await client.auth.getUser(token);
    if (userError || !user) return json(401, { error: "Sesión inválida." });

    // 3) ¿Es administrador?
    const { data: adminRow } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (adminRow?.role !== "admin") return json(403, { error: "No tienes permisos de administrador." });

    // 4) ID del miembro a eliminar
    const { userId } = await req.json();
    if (!userId || typeof userId !== "string") return json(400, { error: "Falta el ID del miembro." });
    if (userId === user.id) return json(400, { error: "No puedes eliminar tu propia cuenta." });

    // 5) Eliminar al usuario (cascade borra su perfil)
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) return json(500, { error: deleteError.message });

    return json(200, { deleted: true });
  } catch (e) {
    return json(500, { error: e.message || "Error interno." });
  }
});