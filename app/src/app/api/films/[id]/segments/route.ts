import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getFilmById } from "@/lib/films";
import { getSegmentsByFilm, createSegment, syncReferentiel } from "@/lib/segments";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const segments = await getSegmentsByFilm(id);
  return NextResponse.json(segments);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const { id } = await params;
  const film = await getFilmById(id);
  if (!film) return NextResponse.json({ error: "Film introuvable" }, { status: 404 });

  const body = await req.json();
  const tcDebut = Number(body.tc_debut);
  const tcFin = Number(body.tc_fin);

  if (isNaN(tcDebut) || isNaN(tcFin) || tcDebut < 0 || tcFin <= tcDebut || tcFin > film.duree) {
    return NextResponse.json({ error: "Timecodes invalides" }, { status: 400 });
  }

  try {
    const segId = await createSegment({
      film_id: id, tc_debut: tcDebut, tc_fin: tcFin,
      titre: body.titre ?? null,
      personnes: body.personnes ?? [],
      evenements: body.evenements ?? [],
      lieux: body.lieux ?? [],
      branches: body.branches ?? [],
      date_label: body.date_label ?? null,
      note: body.note ?? null,
    });
    await syncReferentiel(body);
    return NextResponse.json({ id: segId }, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "OVERLAP") {
      return NextResponse.json({ error: "Ce segment chevauche un segment existant" }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
