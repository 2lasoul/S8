import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getAllFilms, createFilm } from "@/lib/films";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const personne  = searchParams.get("personne");
    const lieu      = searchParams.get("lieu");
    const evenement = searchParams.get("evenement");
    const branche   = searchParams.get("branche");
    const films = await getAllFilms({ personne, lieu, evenement, branche });
    return NextResponse.json(films);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  try {
    const body = await req.json();
    if (!body.titre || !body.fichier_url || !body.duree) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }
    if (body.annee_fin && body.annee && body.annee_fin < body.annee) {
      return NextResponse.json({ error: "Année de fin < année de début" }, { status: 400 });
    }
    const id = await createFilm(body);
    return NextResponse.json({ id }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erreur serveur";
    if (msg.includes("Duplicate entry")) {
      return NextResponse.json({ error: "Un film avec ce titre existe déjà" }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
