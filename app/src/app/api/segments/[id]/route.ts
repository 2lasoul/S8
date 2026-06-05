import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { updateSegment, deleteSegment, syncReferentiel } from "@/lib/segments";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

async function getSegment(id: string) {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM segments WHERE id = ?", [id]);
  return rows[0] ?? null;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const { id } = await params;
  const seg = await getSegment(id);
  if (!seg) return NextResponse.json({ error: "Segment introuvable" }, { status: 404 });

  const body = await req.json();
  try {
    await updateSegment(id, seg.film_id, body);
    await syncReferentiel({
      personnes: body.personnes ?? [],
      evenements: body.evenements ?? [],
      lieux: body.lieux ?? [],
      branches: body.branches ?? [],
    });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "OVERLAP") {
      return NextResponse.json({ error: "Ce segment chevauche un segment existant" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const { id } = await params;
  await deleteSegment(id);
  return NextResponse.json({ ok: true });
}
