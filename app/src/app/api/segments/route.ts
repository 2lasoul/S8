import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

function parseJson(val: unknown): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") { try { return JSON.parse(val); } catch { return []; } }
  return [];
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const personne  = searchParams.get("personne");
  const lieu      = searchParams.get("lieu");
  const evenement = searchParams.get("evenement");
  const branche   = searchParams.get("branche");

  const conditions: string[] = [];
  const values: string[] = [];

  if (personne)  { conditions.push("JSON_CONTAINS(s.personnes, ?)");  values.push(JSON.stringify(personne)); }
  if (lieu)      { conditions.push("JSON_CONTAINS(s.lieux, ?)");      values.push(JSON.stringify(lieu)); }
  if (evenement) { conditions.push("JSON_CONTAINS(s.evenements, ?)"); values.push(JSON.stringify(evenement)); }
  if (branche)   { conditions.push("JSON_CONTAINS(s.branches, ?)");   values.push(JSON.stringify(branche)); }

  if (!conditions.length) {
    return NextResponse.json([]);
  }

  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT s.*, f.titre AS film_titre, f.annee, f.annee_fin,
           f.date_label AS film_date_label, f.fichier_url, f.duree AS film_duree
    FROM segments s
    JOIN films f ON f.id = s.film_id
    WHERE ${conditions.join(" AND ")}
    ORDER BY f.annee ASC, s.tc_debut ASC
  `, values);

  return NextResponse.json(rows.map((r) => ({
    ...r,
    personnes: parseJson(r.personnes),
    evenements: parseJson(r.evenements),
    lieux: parseJson(r.lieux),
    branches: parseJson(r.branches),
  })));
}
