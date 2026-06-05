import pool from "./db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { v4 as uuidv4 } from "uuid";

export interface Segment {
  id: string;
  film_id: string;
  tc_debut: number;
  tc_fin: number;
  titre: string | null;
  personnes: string[];
  evenements: string[];
  lieux: string[];
  branches: string[];
  date_label: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

function parseJson(val: unknown): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return []; }
  }
  return [];
}

function toSegment(r: RowDataPacket): Segment {
  return {
    ...r,
    personnes: parseJson(r.personnes),
    evenements: parseJson(r.evenements),
    lieux: parseJson(r.lieux),
    branches: parseJson(r.branches),
  } as Segment;
}

export async function getSegmentsByFilm(filmId: string): Promise<Segment[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM segments WHERE film_id = ? ORDER BY tc_debut ASC",
    [filmId]
  );
  return rows.map(toSegment);
}

async function checkOverlap(filmId: string, tcDebut: number, tcFin: number, excludeId?: string): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM segments
     WHERE film_id = ? AND id != ? AND tc_debut < ? AND tc_fin > ?`,
    [filmId, excludeId ?? "", tcFin, tcDebut]
  );
  return rows.length > 0;
}

export async function createSegment(data: Omit<Segment, "id" | "created_at" | "updated_at">): Promise<string> {
  const overlaps = await checkOverlap(data.film_id, data.tc_debut, data.tc_fin);
  if (overlaps) throw new Error("OVERLAP");

  const id = uuidv4();
  await pool.query<ResultSetHeader>(
    `INSERT INTO segments (id, film_id, tc_debut, tc_fin, titre, personnes, evenements, lieux, branches, date_label, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.film_id, data.tc_debut, data.tc_fin,
     data.titre ?? null,
     JSON.stringify(data.personnes ?? []),
     JSON.stringify(data.evenements ?? []),
     JSON.stringify(data.lieux ?? []),
     JSON.stringify(data.branches ?? []),
     data.date_label ?? null,
     data.note ?? null]
  );
  return id;
}

export async function updateSegment(id: string, filmId: string, data: Partial<Segment>): Promise<void> {
  if (data.tc_debut !== undefined && data.tc_fin !== undefined) {
    const overlaps = await checkOverlap(filmId, data.tc_debut, data.tc_fin, id);
    if (overlaps) throw new Error("OVERLAP");
  }

  const jsonFields = ["personnes", "evenements", "lieux", "branches"];
  const fields = ["tc_debut", "tc_fin", "titre", "personnes", "evenements", "lieux", "branches", "date_label", "note"];
  const updates = fields.filter((f) => f in data);
  if (!updates.length) return;

  const values = updates.map((f) => {
    const v = (data as Record<string, unknown>)[f];
    return jsonFields.includes(f) ? JSON.stringify(v ?? []) : (v ?? null);
  });

  await pool.query(
    `UPDATE segments SET ${updates.map((f) => `${f} = ?`).join(", ")} WHERE id = ?`,
    [...values, id]
  );
}

export async function deleteSegment(id: string): Promise<void> {
  await pool.query("DELETE FROM segments WHERE id = ?", [id]);
}

export async function syncReferentiel(data: Pick<Segment, "personnes" | "evenements" | "lieux" | "branches">): Promise<void> {
  const entries: Array<[string, string]> = [
    ...data.personnes.map((v): [string, string] => ["personne", v]),
    ...data.evenements.map((v): [string, string] => ["evenement", v]),
    ...data.lieux.map((v): [string, string] => ["lieu", v]),
    ...data.branches.map((v): [string, string] => ["branche", v]),
  ];
  if (!entries.length) return;
  await pool.query(
    `INSERT IGNORE INTO referentiel (categorie, valeur) VALUES ${entries.map(() => "(?,?)").join(",")}`,
    entries.flat()
  );
}
