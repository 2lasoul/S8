import pool from "./db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export interface Film {
  id: string;
  titre: string;
  fichier_url: string;
  duree: number;
  annee: number | null;
  annee_fin: number | null;
  date_label: string | null;
  description: string | null;
  poster_url: string | null;
  created_at: string;
  updated_at: string;
  couverture: number;
  branches: string[];
}

export function slugify(titre: string): string {
  return titre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

export function extractYoutubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export function getPosterUrl(fichier_url: string, poster_url?: string | null): string | null {
  if (poster_url) return poster_url;
  const ytId = extractYoutubeId(fichier_url);
  if (ytId) return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  return null;
}

interface FilmFilters {
  personne?: string | null;
  lieu?: string | null;
  evenement?: string | null;
  branche?: string | null;
}

export async function getAllFilms(filters: FilmFilters = {}): Promise<Film[]> {
  const { personne, lieu, evenement, branche } = filters;

  // Conditions sur les segments pour le filtrage par tags
  const tagConditions: string[] = [];
  const tagValues: string[] = [];
  if (personne)  { tagConditions.push("JSON_CONTAINS(s.personnes, ?)");  tagValues.push(JSON.stringify(personne)); }
  if (lieu)      { tagConditions.push("JSON_CONTAINS(s.lieux, ?)");      tagValues.push(JSON.stringify(lieu)); }
  if (evenement) { tagConditions.push("JSON_CONTAINS(s.evenements, ?)"); tagValues.push(JSON.stringify(evenement)); }
  if (branche)   { tagConditions.push("JSON_CONTAINS(s.branches, ?)");   tagValues.push(JSON.stringify(branche)); }

  const hasTagFilter = tagConditions.length > 0;

  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT
      f.*,
      COALESCE(ROUND(SUM(DISTINCT(s.tc_fin - s.tc_debut)) / f.duree * 100), 0) AS couverture,
      COALESCE(GROUP_CONCAT(DISTINCT s.branches SEPARATOR '|||'), '') AS branches_raw
    FROM films f
    LEFT JOIN segments s ON s.film_id = f.id
    ${hasTagFilter ? `WHERE f.id IN (
      SELECT DISTINCT film_id FROM segments
      WHERE ${tagConditions.join(" AND ")}
    )` : ""}
    GROUP BY f.id
    ORDER BY f.annee ASC, f.titre ASC
  `, tagValues);

  return rows.map((r) => {
    const branches = extractBranches(r.branches_raw as string);
    return { ...r, couverture: r.couverture ?? 0, branches };
  }) as Film[];
}

function extractBranches(raw: string): string[] {
  if (!raw) return [];
  const all: string[] = [];
  for (const chunk of raw.split("|||")) {
    try {
      const parsed = JSON.parse(chunk);
      if (Array.isArray(parsed)) all.push(...parsed);
    } catch { /* segment sans branches */ }
  }
  return [...new Set(all.filter(Boolean))];
}

export async function getFilmById(id: string): Promise<Film | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT f.*,
      COALESCE(ROUND(SUM(s.tc_fin - s.tc_debut) / f.duree * 100), 0) AS couverture
     FROM films f
     LEFT JOIN segments s ON s.film_id = f.id
     WHERE f.id = ?
     GROUP BY f.id`,
    [id]
  );
  if (!rows.length) return null;
  return { ...rows[0], branches: [] } as Film;
}

export async function createFilm(data: Omit<Film, "id" | "created_at" | "updated_at" | "couverture" | "branches">): Promise<string> {
  const id = slugify(data.titre);
  const poster = getPosterUrl(data.fichier_url, data.poster_url);
  await pool.query<ResultSetHeader>(
    `INSERT INTO films (id, titre, fichier_url, duree, annee, annee_fin, date_label, description, poster_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.titre, data.fichier_url, data.duree, data.annee ?? null, data.annee_fin ?? null,
     data.date_label ?? null, data.description ?? null, poster]
  );
  return id;
}

export async function updateFilm(id: string, data: Partial<Film>): Promise<void> {
  const fields = ["titre", "fichier_url", "duree", "annee", "annee_fin", "date_label", "description", "poster_url"];
  const updates = fields.filter((f) => f in data);
  if (!updates.length) return;
  const values = updates.map((f) => (data as Record<string, unknown>)[f]);
  await pool.query(
    `UPDATE films SET ${updates.map((f) => `${f} = ?`).join(", ")} WHERE id = ?`,
    [...values, id]
  );
}

export async function deleteFilm(id: string): Promise<void> {
  await pool.query("DELETE FROM films WHERE id = ?", [id]);
}
