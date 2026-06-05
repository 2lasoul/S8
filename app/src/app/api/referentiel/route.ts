import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import pool from "@/lib/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categorie = searchParams.get("categorie");
  const [rows] = await pool.query<RowDataPacket[]>(
    categorie
      ? "SELECT * FROM referentiel WHERE categorie = ? ORDER BY valeur ASC"
      : "SELECT * FROM referentiel ORDER BY categorie ASC, valeur ASC",
    categorie ? [categorie] : []
  );
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const { categorie, valeur, couleur, branche } = await req.json();
  if (!categorie || !valeur) {
    return NextResponse.json({ error: "categorie et valeur obligatoires" }, { status: 400 });
  }
  await pool.query<ResultSetHeader>(
    "INSERT IGNORE INTO referentiel (categorie, valeur, couleur, branche) VALUES (?, ?, ?, ?)",
    [categorie, valeur, couleur ?? null, branche ?? null]
  );
  return NextResponse.json({ ok: true }, { status: 201 });
}
