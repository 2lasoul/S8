import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function GET(_req: Request, { params }: { params: Promise<{ filmId: string }> }) {
  const { filmId } = await params;
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT titre, fichier_url FROM films WHERE id = ?",
    [filmId]
  );
  if (!rows.length) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({ titre: rows[0].titre, fichier_url: rows[0].fichier_url });
}
