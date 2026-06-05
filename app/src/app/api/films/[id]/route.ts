import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getFilmById, updateFilm, deleteFilm } from "@/lib/films";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const film = await getFilmById(id);
  if (!film) return NextResponse.json({ error: "Film introuvable" }, { status: 404 });
  return NextResponse.json(film);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  if (body.annee_fin && body.annee && body.annee_fin < body.annee) {
    return NextResponse.json({ error: "Année de fin < année de début" }, { status: 400 });
  }
  await updateFilm(id, body);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const { id } = await params;
  const film = await getFilmById(id);
  if (!film) return NextResponse.json({ error: "Film introuvable" }, { status: 404 });
  await deleteFilm(id);
  return NextResponse.json({ ok: true });
}
