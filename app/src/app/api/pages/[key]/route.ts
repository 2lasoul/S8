import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";
import type { RowDataPacket } from "mysql2";

export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT contenu FROM pages WHERE cle = ?", [key]
  );
  const contenu = rows[0]?.contenu ?? "";
  return NextResponse.json({ contenu });
}

export async function PUT(req: Request, { params }: { params: Promise<{ key: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const { key } = await params;
  const { contenu } = await req.json();
  await pool.query(
    "INSERT INTO pages (cle, contenu) VALUES (?, ?) ON DUPLICATE KEY UPDATE contenu = ?",
    [key, contenu, contenu]
  );
  return NextResponse.json({ ok: true });
}
