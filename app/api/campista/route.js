import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function validCirse(value) {
  return typeof value === "string" && value.trim().length > 0 && /^\d+$/.test(value.trim());
}

export async function POST(request) {
  try {
    const body = await request.json();
    const cirse = String(body?.cirse ?? "").trim();
    const action = body?.action;

    if (!validCirse(cirse)) {
      return NextResponse.json({ error: "Ingresá un número de Circe válido, usando solo números." }, { status: 400 });
    }
    if (!["lookup", "save"].includes(action)) {
      return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const lookup = await supabase
      .from("campistas")
      .select("cirse, mitologia")
      .eq("cirse", cirse)
      .limit(2);

    if (lookup.error) {
      console.error("Error consultando Supabase:", lookup.error.message);
      return NextResponse.json({ error: "No pudimos consultar la base de datos. Revisá la configuración e intentá de nuevo." }, { status: 500 });
    }

    const rows = lookup.data ?? [];
    if (rows.length > 1) {
      return NextResponse.json({ error: "Hay más de un campista con ese número de Circe. Contactá al equipo." }, { status: 409 });
    }
    if (rows.length === 0) {
      return NextResponse.json({ error: "El Circe no existe." }, { status: 404 });
    }

    const camper = rows[0];
    const empty = camper.mitologia == null || (typeof camper.mitologia === "string" && !camper.mitologia.trim());

    if (action === "lookup") {
      if (!empty) {
        return NextResponse.json({ error: "Este Circe ya completó el test de mitología." }, { status: 409 });
      }
      return NextResponse.json({ ok: true });
    }

    const chosen = body?.mitologia;
    if (!["Griega", "Romana", "Nórdica", "Egipcia"].includes(chosen)) {
      return NextResponse.json({ error: "Elegí una mitología válida." }, { status: 400 });
    }
    if (!empty) {
      return NextResponse.json({ error: "Este Circe ya completó el test. No se modificó la base de datos." }, { status: 409 });
    }

    // Actualiza únicamente la columna mitologia y vuelve a comprobar que siga vacía.
    const update = await supabase
      .from("campistas")
      .update({ mitologia: chosen })
      .eq("cirse", cirse)
      .is("mitologia", "null")
      .select("cirse");

    if (update.error) {
      console.error("Error guardando mitología:", update.error.message);
      return NextResponse.json({ error: "No pudimos guardar tu elección. Revisá la configuración o contactá al equipo." }, { status: 500 });
    }
    if (!update.data || update.data.length !== 1) {
      return NextResponse.json({ error: "No se guardó la elección. Este Circe puede haber sido asignado mientras completabas el test." }, { status: 409 });
    }
    return NextResponse.json({ ok: true, mitologia: chosen });
  } catch (error) {
    console.error("Error en API de campista:", error?.message ?? error);
    return NextResponse.json({ error: "Ocurrió un error inesperado. Intentá de nuevo más tarde." }, { status: 500 });
  }
}
