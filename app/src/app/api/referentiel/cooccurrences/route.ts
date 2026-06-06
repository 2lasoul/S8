import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

// Retourne les valeurs fréquemment associées à ?valeur=X dans les segments existants
// Seuil minimum : 3 co-occurrences. Triées par fréquence décroissante.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const valeur = searchParams.get("valeur");
  const categorie = searchParams.get("categorie") as string | null;

  if (!valeur) {
    return NextResponse.json({ error: "valeur obligatoire" }, { status: 400 });
  }

  // Récupère tous les segments qui contiennent cette valeur dans n'importe quel champ
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT personnes, evenements, lieux, branches FROM segments
     WHERE JSON_CONTAINS(personnes, ?)
        OR JSON_CONTAINS(evenements, ?)
        OR JSON_CONTAINS(lieux, ?)
        OR JSON_CONTAINS(branches, ?)`,
    [JSON.stringify(valeur), JSON.stringify(valeur), JSON.stringify(valeur), JSON.stringify(valeur)]
  );

  if (rows.length === 0) return NextResponse.json([]);

  // Compte les co-occurrences par valeur+categorie
  const counts = new Map<string, { valeur: string; categorie: string; count: number }>();

  for (const row of rows) {
    const fields: Array<[string, string]> = [
      ["personne", "personnes"],
      ["evenement", "evenements"],
      ["lieu", "lieux"],
      ["branche", "branches"],
    ];
    for (const [cat, field] of fields) {
      const arr = parseJson(row[field]);
      for (const v of arr) {
        if (v === valeur) continue; // exclure la valeur elle-même
        const key = `${cat}:${v}`;
        const existing = counts.get(key);
        if (existing) existing.count++;
        else counts.set(key, { valeur: v, categorie: cat, count: 1 });
      }
    }
  }

  // Filtre par catégorie si précisée, seuil minimum 3
  const results = [...counts.values()]
    .filter((e) => e.count >= 3 && (!categorie || e.categorie === categorie))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return NextResponse.json(results);
}

function parseJson(val: unknown): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") { try { return JSON.parse(val); } catch { return []; } }
  return [];
}
