import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const { id } = await params;
  const { valeur, couleur, branche } = await req.json();
  if (!valeur) return NextResponse.json({ error: "valeur obligatoire" }, { status: 400 });

  try {
    await pool.query(
      "UPDATE referentiel SET valeur = ?, couleur = ?, branche = ? WHERE id = ?",
      [valeur, couleur ?? null, branche ?? null, id]
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Valeur déjà existante dans cette catégorie" }, { status: 409 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const { id } = await params;
  await pool.query("DELETE FROM referentiel WHERE id = ?", [id]);
  return NextResponse.json({ ok: true });
}
