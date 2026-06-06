import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { updateFilm } from "@/lib/films";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;
  const { dataUrl } = await req.json();

  if (!dataUrl?.startsWith("data:image/png;base64,")) {
    return NextResponse.json({ error: "Format invalide" }, { status: 400 });
  }

  // Décode le base64
  const base64 = dataUrl.replace("data:image/png;base64,", "");
  const buffer = Buffer.from(base64, "base64");

  // Sauvegarde dans public/thumbnails/
  const dir = path.join(process.cwd(), "public", "thumbnails");
  await mkdir(dir, { recursive: true });
  const filename = `${id}.png`;
  await writeFile(path.join(dir, filename), buffer);

  // Met à jour poster_url dans la DB
  const posterUrl = `/thumbnails/${filename}`;
  await updateFilm(id, { poster_url: posterUrl } as never);

  return NextResponse.json({ poster_url: posterUrl });
}
